#!/usr/bin/env python3
"""
F8: GeoNode Sync Service
=========================
Periodically fetches geo-data from KoboToolbox submissions via the API
and uploads them to GeoNode as vector layers.

UPDATE-PROOF: Uses KoboToolbox public API (not direct DB access).
"""
import json
import logging
import os
import re
import sys
import tempfile
import time
import threading

import requests
import schedule
from dotenv import load_dotenv

load_dotenv('/app/config.env')

# Configuration
KOBO_API_URL = os.getenv('KOBO_API_URL', 'http://kpi:8000/api/v2')
KOBO_API_TOKEN = os.getenv('KOBO_API_TOKEN', '')
GEONODE_URL = os.getenv('GEONODE_URL', '')
GEONODE_USERNAME = os.getenv('GEONODE_USERNAME', 'admin')
GEONODE_PASSWORD = os.getenv('GEONODE_PASSWORD', '')
SYNC_INTERVAL = int(os.getenv('SYNC_INTERVAL_MINUTES', '30'))
FORM_UIDS = [u.strip() for u in os.getenv('FORM_UIDS', '').split(',') if u.strip()]
LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')

# Tanzania bounding box for sanity check
TZ_LAT_MIN, TZ_LAT_MAX = -11.75, -1.0
TZ_LON_MIN, TZ_LON_MAX = 29.0, 40.5

logging.basicConfig(
    level=getattr(logging, LOG_LEVEL),
    format='%(asctime)s [%(levelname)s] %(message)s',
)
log = logging.getLogger('geonode-sync')

# Track sync state
last_sync = {}
last_sync_status = {'time': None, 'success': False, 'error': None, 'synced': 0}


def validate_config():
    """Validate required configuration at startup."""
    errors = []
    if not KOBO_API_TOKEN or KOBO_API_TOKEN == 'changeme':
        errors.append('KOBO_API_TOKEN is not set')
    if not GEONODE_URL or GEONODE_URL == 'changeme':
        errors.append('GEONODE_URL is not set')
    if not GEONODE_PASSWORD or GEONODE_PASSWORD == 'changeme':
        errors.append('GEONODE_PASSWORD is not set')
    if not FORM_UIDS:
        errors.append('FORM_UIDS is empty (no forms to sync)')
    return errors


def kobo_headers():
    return {'Authorization': f'Token {KOBO_API_TOKEN}'}


def parse_geopoint(value):
    """
    Parse KoboToolbox geopoint from various formats:
      - Space-separated: "lat lon altitude accuracy"
      - Semicolon-separated: "lat;lon;alt;acc"
      - GeoJSON point: {"type": "Point", "coordinates": [lon, lat]}
    Returns (lat, lon) or None.
    """
    if isinstance(value, dict):
        coords = value.get('coordinates', [])
        if len(coords) >= 2:
            return coords[1], coords[0]  # GeoJSON is [lon, lat]
        return None

    if not isinstance(value, str):
        return None

    value = value.strip()
    if not value:
        return None

    # Try space-separated (most common KoboToolbox format)
    parts = re.split(r'[\s;,]+', value)
    if len(parts) >= 2:
        try:
            lat, lon = float(parts[0]), float(parts[1])
            if -90 <= lat <= 90 and -180 <= lon <= 180:
                return lat, lon
        except (ValueError, IndexError):
            pass

    return None


def is_in_tanzania(lat, lon):
    """Check if coordinates are roughly within Tanzania."""
    return TZ_LAT_MIN <= lat <= TZ_LAT_MAX and TZ_LON_MIN <= lon <= TZ_LON_MAX


def fetch_submissions(form_uid):
    """Fetch new submissions with geo-data from KoboToolbox."""
    url = f'{KOBO_API_URL}/assets/{form_uid}/data.json'
    params = {'format': 'json'}

    if form_uid in last_sync:
        params['query'] = json.dumps({
            '_submission_time': {'$gt': last_sync[form_uid]}
        })

    try:
        resp = requests.get(url, headers=kobo_headers(), params=params, timeout=60)
        resp.raise_for_status()
        data = resp.json()
        results = data.get('results', [])
        log.info(f"Form {form_uid}: fetched {len(results)} submissions")
        return results
    except requests.RequestException as e:
        log.error(f"Failed to fetch from KoboToolbox: {e}")
        return []


def extract_geodata(submissions):
    """Extract GeoJSON features from submissions."""
    features = []
    skipped = 0
    outside_tz = 0

    for sub in submissions:
        found = False
        for key, value in sub.items():
            if key.startswith('_'):
                continue

            result = parse_geopoint(value)
            if result is None:
                continue

            lat, lon = result
            if not is_in_tanzania(lat, lon):
                outside_tz += 1
                log.debug(f"Submission {sub.get('_id')}: coordinates ({lat}, {lon}) outside Tanzania")

            feature = {
                'type': 'Feature',
                'geometry': {
                    'type': 'Point',
                    'coordinates': [lon, lat],
                },
                'properties': {
                    'submission_id': sub.get('_id'),
                    'submitted_by': sub.get('_submitted_by', 'unknown'),
                    'submission_time': sub.get('_submission_time', ''),
                    'source_field': key,
                },
            }
            for k, v in sub.items():
                if not k.startswith('_') and k != key and isinstance(v, (str, int, float, bool)):
                    feature['properties'][k] = v
            features.append(feature)
            found = True
            break  # One feature per submission

        if not found:
            skipped += 1

    if skipped:
        log.warning(f"Skipped {skipped} submissions with no parseable geo-data")
    if outside_tz:
        log.warning(f"{outside_tz} submissions have coordinates outside Tanzania")

    return {
        'type': 'FeatureCollection',
        'features': features,
    }


def upload_to_geonode(geojson, layer_name):
    """Upload GeoJSON to GeoNode as a new/updated layer."""
    if not geojson['features']:
        log.info(f"No geo-features to upload for {layer_name}")
        return True

    with tempfile.NamedTemporaryFile(mode='w', suffix='.geojson', delete=False) as f:
        json.dump(geojson, f)
        tmp_path = f.name

    try:
        upload_url = f'{GEONODE_URL}/api/v2/uploads/upload/'
        with open(tmp_path, 'rb') as f:
            resp = requests.post(
                upload_url,
                auth=(GEONODE_USERNAME, GEONODE_PASSWORD),
                files={'base_file': (f'{layer_name}.geojson', f, 'application/json')},
                data={'charset': 'UTF-8'},
                timeout=120,
            )

        if resp.status_code in (200, 201):
            log.info(f"Uploaded layer to GeoNode: {layer_name} ({len(geojson['features'])} features)")
            return True
        else:
            log.error(f"GeoNode upload failed ({resp.status_code}): {resp.text[:200]}")
            return False

    except requests.RequestException as e:
        log.error(f"GeoNode upload error: {e}")
        return False
    finally:
        os.unlink(tmp_path)


def get_form_name(form_uid):
    """Fetch form name from KoboToolbox API."""
    try:
        resp = requests.get(
            f'{KOBO_API_URL}/assets/{form_uid}.json',
            headers=kobo_headers(),
            timeout=30,
        )
        resp.raise_for_status()
        return resp.json().get('name', form_uid)
    except requests.RequestException:
        return form_uid


def sync_all():
    """Main sync job: fetch from Kobo, push to GeoNode."""
    log.info("Starting sync cycle...")
    total_synced = 0

    for form_uid in FORM_UIDS:
        submissions = fetch_submissions(form_uid)
        if not submissions:
            continue

        geojson = extract_geodata(submissions)
        form_name = get_form_name(form_uid)
        layer_name = f"kobo_{form_name.lower().replace(' ', '_')}"

        if upload_to_geonode(geojson, layer_name):
            total_synced += len(geojson['features'])
            times = [s.get('_submission_time', '') for s in submissions if s.get('_submission_time')]
            if times:
                last_sync[form_uid] = max(times)

    last_sync_status.update({
        'time': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
        'success': True,
        'error': None,
        'synced': total_synced,
    })
    log.info(f"Sync cycle complete. {total_synced} features synced.")


# Simple HTTP health check and test connection server
def run_health_server():
    """Run health check and GeoNode test-connection endpoints on port 8080."""
    from http.server import HTTPServer, BaseHTTPRequestHandler
    from urllib.parse import urlparse, parse_qs

    class Handler(BaseHTTPRequestHandler):
        def do_GET(self):
            parsed = urlparse(self.path)

            if parsed.path == '/health':
                body = json.dumps({
                    'status': 'healthy',
                    'last_sync': last_sync_status,
                    'forms_tracked': len(FORM_UIDS),
                    'config_valid': len(validate_config()) == 0,
                }).encode()
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(body)

            elif parsed.path == '/test-connection':
                params = parse_qs(parsed.query)
                url = params.get('url', [''])[0]
                token = params.get('token', [''])[0]
                username = params.get('username', [''])[0]
                password = params.get('password', [''])[0]
                action = params.get('action', ['test'])[0]

                if action == 'list':
                    page = int(params.get('page', ['1'])[0])
                    search = params.get('search', [''])[0]
                    result = self._list_datasets(url, token, username, password, page, search)
                else:
                    result = self._test_geonode(url, token, username, password)

                body = json.dumps(result).encode()
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(body)
            else:
                self.send_response(404)
                self.end_headers()

        def _test_geonode(self, url, token, username, password):
            """Test GeoNode connection server-side (no CORS issues)."""
            if not url:
                return {'ok': False, 'error': 'No GeoNode URL provided'}

            url = url.rstrip('/')
            headers = {'Accept': 'application/json'}
            auth = None

            if token:
                tok = token if ' ' in token else f'Bearer {token}'
                headers['Authorization'] = tok
            elif username and password:
                auth = (username, password)

            try:
                # Try /api/v2/datasets/ first (GeoNode 4.x), fall back to /api/v2/layers/ (3.x)
                for endpoint in ['/api/v2/datasets/', '/api/v2/layers/']:
                    resp = requests.get(
                        f'{url}{endpoint}?page_size=1',
                        headers=headers,
                        auth=auth,
                        timeout=15,
                        allow_redirects=True,
                    )
                    if resp.status_code == 200:
                        data = resp.json()
                        count = data.get('total', len(data.get('datasets', data.get('layers', data.get('results', [])))))
                        return {'ok': True, 'count': count}
                return {'ok': False, 'error': f'HTTP {resp.status_code}'}
            except requests.ConnectionError:
                return {'ok': False, 'error': 'Could not connect to GeoNode server'}
            except requests.Timeout:
                return {'ok': False, 'error': 'Connection timed out'}
            except Exception as e:
                return {'ok': False, 'error': str(e)}

        def _list_datasets(self, url, token, username, password, page=1, search=''):
            """List GeoNode datasets with pagination and search."""
            if not url:
                return {'ok': False, 'error': 'No GeoNode URL provided'}

            url = url.rstrip('/')
            headers = {'Accept': 'application/json'}
            auth = None

            if token:
                tok = token if ' ' in token else f'Bearer {token}'
                headers['Authorization'] = tok
            elif username and password:
                auth = (username, password)

            page_size = 20
            params = {
                'page_size': page_size,
                'page': page,
            }
            if search:
                params['search'] = search

            try:
                # Try /api/v2/datasets/ (GeoNode 4.x) then /api/v2/layers/ (3.x)
                for endpoint in ['/api/v2/datasets/', '/api/v2/layers/']:
                    resp = requests.get(
                        f'{url}{endpoint}',
                        headers=headers,
                        auth=auth,
                        params=params,
                        timeout=20,
                        allow_redirects=True,
                    )
                    if resp.status_code == 200:
                        data = resp.json()
                        items = data.get('datasets', data.get('layers', data.get('results', [])))
                        total = data.get('total', len(items))
                        datasets = []
                        for item in items:
                            datasets.append({
                                'id': item.get('pk', item.get('id')),
                                'name': item.get('name', ''),
                                'title': item.get('title', item.get('name', 'Untitled')),
                                'abstract': item.get('raw_abstract', item.get('abstract', ''))[:200],
                                'subtype': item.get('subtype', item.get('storeType', '')),
                                'alternate': item.get('alternate', item.get('typename', item.get('name', ''))),
                            })
                        return {'ok': True, 'datasets': datasets, 'total': total}
                return {'ok': False, 'error': f'HTTP {resp.status_code}'}
            except requests.ConnectionError:
                return {'ok': False, 'error': 'Could not connect to GeoNode server'}
            except requests.Timeout:
                return {'ok': False, 'error': 'Connection timed out'}
            except Exception as e:
                return {'ok': False, 'error': str(e)}

        def log_message(self, format, *args):
            pass  # Suppress access logs

    server = HTTPServer(('0.0.0.0', 8080), Handler)
    server.serve_forever()


if __name__ == '__main__':
    log.info("GeoNode Sync Service starting...")
    log.info(f"KoboToolbox API: {KOBO_API_URL}")
    log.info(f"GeoNode: {GEONODE_URL or '(not configured)'}")
    log.info(f"Sync interval: {SYNC_INTERVAL} minutes")
    log.info(f"Tracking forms: {FORM_UIDS or '(none configured)'}")

    # Validate config and warn (don't exit — allows health check to report status)
    config_errors = validate_config()
    if config_errors:
        for err in config_errors:
            log.warning(f"Config issue: {err}")
        log.warning("Sync will not run until configuration is fixed. Health check available on :8080/health")

    # Start health check server in background
    health_thread = threading.Thread(target=run_health_server, daemon=True)
    health_thread.start()

    if not config_errors:
        # Run once immediately
        sync_all()
        # Schedule periodic sync
        schedule.every(SYNC_INTERVAL).minutes.do(sync_all)

    while True:
        schedule.run_pending()
        time.sleep(10)

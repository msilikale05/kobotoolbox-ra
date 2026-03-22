#!/usr/bin/env python3
"""
Webhook Relay: Email, WhatsApp & SMS Notifications
====================================================
Flask service that receives webhook POSTs from KoboToolbox's built-in
REST Services (Hook) system and forwards notifications via Email, Twilio
SMS, and/or WhatsApp.

KoboToolbox Setup:
  1. Go to Project > Settings > REST Services
  2. Add a new service pointing to: http://webhook-relay:5000/webhook/<form-uid>
  3. Select JSON format

UPDATE-PROOF: Standalone container using KoboToolbox's built-in Hook system.
"""
import hashlib
import io
import json
import logging
import os
import re
import smtplib
import threading
import time as _time
from collections import defaultdict
from datetime import datetime, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from dotenv import load_dotenv
from flask import Flask, request, jsonify, redirect, Response
from twilio.rest import Client as TwilioClient

load_dotenv('/app/config.env')

# CORS support for local development (browser cross-origin requests)
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, DELETE, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    return response

app = Flask(__name__)
app.secret_key = os.getenv('FLASK_SECRET_KEY', 'dev-key')
app.after_request(add_cors_headers)

# Configuration
TWILIO_SID = os.getenv('TWILIO_ACCOUNT_SID', '')
TWILIO_TOKEN = os.getenv('TWILIO_AUTH_TOKEN', '')
TWILIO_PHONE = os.getenv('TWILIO_PHONE_NUMBER', '')
TWILIO_WHATSAPP = os.getenv('TWILIO_WHATSAPP_NUMBER', '')
SMS_RECIPIENTS = [r.strip() for r in os.getenv('SMS_RECIPIENTS', '').split(',') if r.strip()]
WHATSAPP_RECIPIENTS = [r.strip() for r in os.getenv('WHATSAPP_RECIPIENTS', '').split(',') if r.strip()]
NOTIFY_VIA = os.getenv('NOTIFY_VIA', 'email')
WEBHOOK_SECRET = os.getenv('WEBHOOK_SECRET', '')
LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')

# WhatsApp Gateway (whatsapp-web.js based)

# Email configuration
SMTP_HOST = os.getenv('SMTP_HOST', '')
SMTP_PORT = int(os.getenv('SMTP_PORT', '587'))
SMTP_USER = os.getenv('SMTP_USER', '')
SMTP_PASSWORD = os.getenv('SMTP_PASSWORD', '')
SMTP_USE_TLS = os.getenv('SMTP_USE_TLS', 'true').lower() in ('true', '1', 'yes')
EMAIL_FROM = os.getenv('EMAIL_FROM', '')
EMAIL_RECIPIENTS = [r.strip() for r in os.getenv('EMAIL_RECIPIENTS', '').split(',') if r.strip()]
EMAIL_SUBJECT_PREFIX = os.getenv('EMAIL_SUBJECT_PREFIX', '[Ramani Yangu]')

# KoboToolbox URL for links in emails
KOBO_URL = os.getenv('KOBO_URL', 'https://kf.ramaniyangu.com')

# Rate limiting: max notifications per form per minute
RATE_LIMIT = int(os.getenv('RATE_LIMIT_PER_MIN', '10'))
_rate_tracker = defaultdict(list)

# Stats
_stats = {'received': 0, 'sent_sms': 0, 'sent_whatsapp': 0, 'sent_email': 0, 'errors': 0}

logging.basicConfig(
    level=getattr(logging, LOG_LEVEL),
    format='%(asctime)s [%(levelname)s] %(message)s',
)
log = logging.getLogger('webhook-relay')

# Initialize Twilio client (lazy)
_twilio = None


def get_twilio():
    global _twilio
    if _twilio is None:
        if TWILIO_SID and TWILIO_TOKEN:
            _twilio = TwilioClient(TWILIO_SID, TWILIO_TOKEN)
        else:
            log.warning("Twilio credentials not configured")
    return _twilio


def format_message(data, form_uid):
    """Format submission data into a plain-text notification message."""
    submitted_by = data.get('_submitted_by', 'Anonymous')
    submission_time = data.get('_submission_time', 'Unknown')
    form_title = data.get('_xform_id_string', form_uid)

    # Extract key fields (skip internal fields)
    fields = []
    for key, value in data.items():
        if key.startswith('_') or key in ('meta', 'formhub'):
            continue
        if isinstance(value, (dict, list)):
            continue
        if value:
            label = key.replace('_', ' ').replace('/', ' > ').title()
            fields.append(f"  {label}: {value}")

    field_summary = '\n'.join(fields[:8])  # Limit to 8 fields for SMS
    if len(fields) > 8:
        field_summary += f'\n  ... and {len(fields) - 8} more fields'

    return (
        f"New submission received!\n"
        f"Form: {form_title}\n"
        f"By: {submitted_by}\n"
        f"Time: {submission_time}\n"
        f"\nData:\n{field_summary}"
    )


TEMPLATE_DIR = os.getenv('EMAIL_TEMPLATE_DIR', '/app/templates/submission')


def load_template(name):
    """Load an email template file, return None if not found."""
    path = os.path.join(TEMPLATE_DIR, name)
    try:
        with open(path, 'r') as f:
            return f.read()
    except FileNotFoundError:
        return None


def format_email_html(data, form_uid):
    """Format submission data into a styled HTML email with full details."""
    from html import escape
    from datetime import datetime

    submitted_by = str(data.get('_submitted_by', '') or 'Anonymous')
    submission_time_raw = str(data.get('_submission_time', '') or '')
    form_title = str(data.get('_xform_id_string', '') or form_uid)
    submission_id = str(data.get('_id', '') or '')
    version = str(data.get('__version__', '') or '')

    # Format time nicely
    submission_time = submission_time_raw
    try:
        dt = datetime.fromisoformat(submission_time_raw.replace('Z', '+00:00'))
        submission_time = dt.strftime('%B %d, %Y at %I:%M %p')
    except Exception:
        pass

    # Geolocation
    geo = data.get('_geolocation', [])
    geo_html = ''
    if geo and len(geo) >= 2 and geo[0] and geo[1]:
        lat, lon = geo[0], geo[1]
        map_link = f'https://www.google.com/maps?q={lat},{lon}'
        geo_html = f'''<tr>
<td style="padding:12px 30px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;overflow:hidden;">
    <tr>
      <td style="padding:12px 16px;">
        <span style="color:#16a34a;font-size:12px;font-weight:600;text-transform:uppercase;">Location</span><br>
        <span style="color:#1e293b;font-size:14px;">{lat:.6f}, {lon:.6f}</span>
        <a href="{map_link}" style="color:#54a8dc;font-size:12px;margin-left:12px;text-decoration:none;">View on Map &rarr;</a>
      </td>
    </tr>
  </table>
</td>
</tr>'''

    # Attachments
    attachments = data.get('_attachments', [])
    attach_html = ''
    if attachments:
        attach_items = ''
        for att in attachments[:5]:
            fname = att.get('filename', 'file').split('/')[-1]
            mime = att.get('mimetype', '')
            url = att.get('download_url', '')
            icon = '&#128247;' if 'image' in mime else '&#128206;'
            attach_items += f'<div style="padding:6px 0;border-bottom:1px solid #f1f5f9;font-size:13px;">{icon} <a href="{escape(url)}" style="color:#54a8dc;text-decoration:none;">{escape(fname)}</a> <span style="color:#94a3b8;font-size:11px;">{escape(mime)}</span></div>'
        if len(attachments) > 5:
            attach_items += f'<div style="padding:6px 0;font-size:12px;color:#94a3b8;">... and {len(attachments) - 5} more file(s)</div>'
        attach_html = f'''<tr>
<td style="padding:0 30px 16px;">
  <p style="margin:0 0 8px;color:#475569;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Attachments ({len(attachments)})</p>
  <div style="border:1px solid #e2e8f0;border-radius:6px;padding:8px 14px;">{attach_items}</div>
</td>
</tr>'''

    # Extract all non-internal fields
    fields = []
    for key, value in data.items():
        if key.startswith('_') or key in ('meta', 'formhub', '__version__'):
            continue
        if isinstance(value, (dict, list)):
            value = str(value)
        if value is not None and str(value).strip():
            label = key.replace('_', ' ').replace('/', ' > ').title()
            fields.append((label, str(value)))

    # Build field rows HTML
    field_rows = ''
    for i, (label, value) in enumerate(fields):
        bg = '#f8fafc' if i % 2 == 0 else '#ffffff'
        # Truncate very long values
        display = escape(value[:300]) + ('...' if len(value) > 300 else '')
        field_rows += (
            f'<tr style="background:{bg};">'
            f'<td style="padding:10px 14px;border-bottom:1px solid #eef2f7;color:#64748b;font-weight:600;font-size:13px;width:35%;vertical-align:top;">{escape(label)}</td>'
            f'<td style="padding:10px 14px;border-bottom:1px solid #eef2f7;color:#334155;font-size:13px;word-break:break-word;">{display}</td>'
            f'</tr>'
        )

    form_link = f'{KOBO_URL}/#/forms/{form_uid}/data'
    sub_link = f'{KOBO_URL}/#/forms/{form_uid}/data/table?q=_id:{submission_id}' if submission_id else form_link

    logo_url = f'{KOBO_URL}/custom-static/images/ra-logo.png'

    html = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">

<!-- Header with logo -->
<tr>
<td style="background:linear-gradient(135deg,#1a2a3a 0%,#2c5f8a 50%,#54a8dc 100%);padding:24px 30px;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td style="vertical-align:middle;">
        <h1 style="margin:0;color:#ffffff;font-size:18px;font-weight:600;">New Submission Received</h1>
        <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">{escape(form_title)}</p>
      </td>
      <td width="100" style="vertical-align:middle;text-align:right;">
        <img src="{logo_url}" alt="Ramani Yangu" width="90" style="display:block;margin-left:auto;" />
      </td>
    </tr>
  </table>
</td>
</tr>

<!-- Accent bar -->
<tr>
<td style="height:4px;background:linear-gradient(90deg,#54a8dc 0%,#1a2a3a 100%);"></td>
</tr>

<!-- Summary info cards -->
<tr>
<td style="padding:20px 30px 0;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td width="50%" style="padding:8px 0;vertical-align:top;">
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:12px 14px;">
          <span style="color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">Submitted by</span><br>
          <strong style="color:#1e293b;font-size:16px;">{escape(submitted_by)}</strong>
        </div>
      </td>
      <td width="4"></td>
      <td width="50%" style="padding:8px 0;vertical-align:top;">
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:12px 14px;">
          <span style="color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">Submission Time</span><br>
          <strong style="color:#1e293b;font-size:14px;">{escape(submission_time)}</strong>
        </div>
      </td>
    </tr>
    <tr>
      <td width="50%" style="padding:4px 0 12px;vertical-align:top;">
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:12px 14px;">
          <span style="color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">Form</span><br>
          <strong style="color:#1e293b;font-size:13px;">{escape(form_title)}</strong>
        </div>
      </td>
      <td width="4"></td>
      <td width="50%" style="padding:4px 0 12px;vertical-align:top;">
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:12px 14px;">
          <span style="color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">Submission ID</span><br>
          <strong style="color:#1e293b;font-size:13px;">#{submission_id}</strong>
          <span style="color:#94a3b8;font-size:11px;display:block;">{len(fields)} fields &middot; {len(attachments)} attachment(s)</span>
        </div>
      </td>
    </tr>
  </table>
</td>
</tr>

<!-- Geolocation (if available) -->
{geo_html}

<!-- Data fields -->
<tr>
<td style="padding:10px 30px 16px;">
  <p style="margin:0 0 12px;color:#475569;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Submission Data ({len(fields)} fields)</p>
  <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:6px;overflow:hidden;">
    {field_rows if field_rows else '<tr><td style="padding:14px;color:#94a3b8;text-align:center;">No data fields</td></tr>'}
  </table>
</td>
</tr>

<!-- Attachments (if any) -->
{attach_html}

<!-- Action buttons -->
<tr>
<td style="padding:0 30px 24px;" align="center">
  <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
    <tr>
      <td style="padding-right:8px;">
        <a href="{sub_link}" style="display:inline-block;padding:12px 28px;background:#54a8dc;color:#ffffff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:600;">View Submission</a>
      </td>
      <td>
        <a href="{form_link}" style="display:inline-block;padding:12px 28px;background:#1a2a3a;color:#ffffff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:600;">All Data</a>
      </td>
    </tr>
  </table>
</td>
</tr>

<!-- Footer -->
<tr>
<td style="background:#1a2a3a;padding:24px 30px;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td style="vertical-align:middle;">
        <img src="{logo_url}" alt="Ramani Yangu" width="70" style="display:block;opacity:0.9;" />
      </td>
      <td style="vertical-align:middle;text-align:right;">
        <p style="margin:0;color:rgba(255,255,255,0.7);font-size:12px;line-height:1.6;">
          Resilience Academy | Ramani Yangu<br>
          Data Collection Platform
        </p>
        <p style="margin:6px 0 0;">
          <a href="{KOBO_URL}" style="color:#54a8dc;text-decoration:none;font-size:12px;">{KOBO_URL}</a>
          &nbsp;&middot;&nbsp;
          <a href="mailto:info@ramaniyangu.com" style="color:#54a8dc;text-decoration:none;font-size:12px;">info@ramaniyangu.com</a>
        </p>
      </td>
    </tr>
  </table>
</td>
</tr>

<!-- Bottom accent -->
<tr>
<td style="height:4px;background:linear-gradient(90deg,#54a8dc 0%,#1a2a3a 100%);"></td>
</tr>

</table>
</td></tr>
</table>
</body>
</html>"""
    return html


def send_email(data, form_uid, recipients):
    """Send email notification via SMTP."""
    if not SMTP_HOST or not EMAIL_FROM:
        log.warning("Email SMTP not configured, skipping")
        return

    form_title = data.get('_xform_id_string', form_uid)
    submitted_by = data.get('_submitted_by', 'Anonymous')
    subject = f"{EMAIL_SUBJECT_PREFIX} New submission: {form_title} (by {submitted_by})"

    html_body = format_email_html(data, form_uid)
    plain_body = format_message(data, form_uid)

    for recipient in recipients:
        try:
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = EMAIL_FROM
            msg['To'] = recipient

            msg.attach(MIMEText(plain_body, 'plain'))
            msg.attach(MIMEText(html_body, 'html'))

            if SMTP_USE_TLS:
                server = smtplib.SMTP(SMTP_HOST, SMTP_PORT)
                server.starttls()
            else:
                if SMTP_PORT == 465:
                    server = smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT)
                else:
                    server = smtplib.SMTP(SMTP_HOST, SMTP_PORT)

            if SMTP_USER and SMTP_PASSWORD:
                server.login(SMTP_USER, SMTP_PASSWORD)

            server.sendmail(EMAIL_FROM, recipient, msg.as_string())
            server.quit()
            log.info(f"Email sent to {recipient}")
        except Exception as e:
            log.error(f"Email to {recipient} failed: {e}")
            _stats['errors'] += 1


def send_sms(message, recipients):
    """Send SMS via Twilio."""
    client = get_twilio()
    if not client or not TWILIO_PHONE:
        log.warning("SMS not configured, skipping")
        return

    for recipient in recipients:
        try:
            msg = client.messages.create(
                body=message[:1600],  # SMS limit
                from_=TWILIO_PHONE,
                to=recipient,
            )
            log.info(f"SMS sent to {recipient}: {msg.sid}")
        except Exception as e:
            log.error(f"SMS to {recipient} failed: {e}")


def send_whatsapp(message, recipients):
    """Send WhatsApp message via Twilio."""
    client = get_twilio()
    if not client or not TWILIO_WHATSAPP:
        log.warning("WhatsApp not configured, skipping")
        return

    for recipient in recipients:
        try:
            wa_to = f"whatsapp:{recipient}" if not recipient.startswith('whatsapp:') else recipient
            msg = client.messages.create(
                body=message[:4096],
                from_=TWILIO_WHATSAPP,
                to=wa_to,
            )
            log.info(f"WhatsApp sent to {recipient}: {msg.sid}")
        except Exception as e:
            log.error(f"WhatsApp to {recipient} failed: {e}")


def check_rate_limit(form_uid):
    """Simple per-form rate limiter."""
    import time
    now = time.time()
    window = [t for t in _rate_tracker[form_uid] if now - t < 60]
    _rate_tracker[form_uid] = window
    if len(window) >= RATE_LIMIT:
        return False
    _rate_tracker[form_uid].append(now)
    return True


@app.route('/webhook/<form_uid>', methods=['POST'])
def webhook(form_uid):
    """Receive webhook from KoboToolbox REST Services."""
    # Validate form_uid format (alphanumeric only)
    if not re.match(r'^[a-zA-Z0-9_-]+$', form_uid):
        return jsonify({'error': 'Invalid form UID'}), 400

    # Optional shared secret validation
    if WEBHOOK_SECRET:
        auth = request.headers.get('Authorization', '')
        if auth != f'Token {WEBHOOK_SECRET}':
            log.warning(f"Unauthorized webhook attempt for form: {form_uid}")
            return jsonify({'error': 'Unauthorized'}), 401

    # Content-Type check
    content_type = request.content_type or ''
    if 'json' not in content_type and 'form' not in content_type:
        log.warning(f"Unexpected Content-Type: {content_type}")

    try:
        data = request.get_json(force=True)
        if not isinstance(data, dict):
            raise ValueError("Expected JSON object")
    except Exception:
        log.error("Invalid JSON payload")
        _stats['errors'] += 1
        return jsonify({'error': 'Invalid JSON'}), 400

    _stats['received'] += 1
    log.info(f"Received webhook for form: {form_uid}")

    # Rate limit check
    if not check_rate_limit(form_uid):
        log.warning(f"Rate limit exceeded for form: {form_uid}")
        return jsonify({'status': 'rate_limited'}), 429

    message = format_message(data, form_uid)

    # Send email notifications
    if NOTIFY_VIA in ('email', 'all', 'email_sms', 'email_whatsapp') and EMAIL_RECIPIENTS:
        send_email(data, form_uid, EMAIL_RECIPIENTS)
        _stats['sent_email'] += 1

    # Send SMS notifications
    if NOTIFY_VIA in ('sms', 'all', 'both', 'email_sms') and SMS_RECIPIENTS:
        send_sms(message, SMS_RECIPIENTS)
        _stats['sent_sms'] += 1

    # Send WhatsApp notifications (Twilio)
    if NOTIFY_VIA in ('whatsapp', 'all', 'both', 'email_whatsapp') and WHATSAPP_RECIPIENTS:
        send_whatsapp(message, WHATSAPP_RECIPIENTS)
        _stats['sent_whatsapp'] += 1

    return jsonify({'status': 'ok', 'form_uid': form_uid}), 200


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'twilio_configured': bool(TWILIO_SID and TWILIO_TOKEN),
        'email_configured': bool(SMTP_HOST and EMAIL_FROM),
        'notify_via': NOTIFY_VIA,
        'email_recipients': len(EMAIL_RECIPIENTS),
        'sms_recipients': len(SMS_RECIPIENTS),
        'whatsapp_recipients': len(WHATSAPP_RECIPIENTS),
        'stats': _stats,
    })


# ── Multi-Dashboard Config ──
DASHBOARD_CONFIG_PATH = os.getenv(
    'DASHBOARD_CONFIG_PATH', '/app/config/dashboard-config.json'
)


def read_dashboard_config():
    """Read multi-dashboard config from JSON file."""
    try:
        with open(DASHBOARD_CONFIG_PATH, 'r') as f:
            data = json.load(f)
            # Ensure required keys exist
            if 'dashboards' not in data:
                data['dashboards'] = {}
            if 'users' not in data:
                data['users'] = {}
            return data
    except (FileNotFoundError, json.JSONDecodeError):
        return {'dashboards': {}, 'users': {}}


def write_dashboard_config(config):
    """Write multi-dashboard config to JSON file."""
    os.makedirs(os.path.dirname(DASHBOARD_CONFIG_PATH), exist_ok=True)
    with open(DASHBOARD_CONFIG_PATH, 'w') as f:
        json.dump(config, f, indent=2)


@app.route('/api/dashboard-config', methods=['GET'])
def get_dashboard_config():
    """Get full multi-dashboard config."""
    return jsonify(read_dashboard_config())


@app.route('/api/dashboard-config', methods=['POST'])
def set_dashboard_config():
    """Save multi-dashboard config."""
    try:
        config = request.get_json(force=True)
        if not isinstance(config, dict):
            return jsonify({'error': 'Config must be a JSON object'}), 400

        # Read existing config
        existing = read_dashboard_config()

        # Update dashboards (full replace)
        if 'dashboards' in config:
            existing['dashboards'] = config['dashboards']

        # Users: full replace with sanitization.
        # The client always sends the complete users dict.
        if 'users' in config and isinstance(config['users'], dict):
            clean_users = {}
            for username, dashboard_id in config['users'].items():
                username = username.strip()
                if re.match(r'^[\w.\-@]+$', username) and isinstance(dashboard_id, str) and dashboard_id.strip():
                    clean_users[username] = dashboard_id.strip()
            existing['users'] = clean_users

        if 'users' not in existing:
            existing['users'] = {}

        write_dashboard_config(existing)
        log.info(f"Dashboard config updated: {len(existing['dashboards'])} dashboards, {len(existing['users'])} users")
        return jsonify({'status': 'ok'})
    except Exception as e:
        log.error(f"Failed to update dashboard config: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/dashboard-config/user/<username>', methods=['GET'])
def get_user_dashboard(username):
    """Get dashboard ID assigned to a specific user."""
    if not re.match(r'^[\w.\-]+$', username):
        return jsonify({'error': 'Invalid username'}), 400
    config = read_dashboard_config()
    dashboard_id = config.get('users', {}).get(username)
    if dashboard_id:
        return jsonify({'username': username, 'dashboard': dashboard_id})
    else:
        return jsonify({'username': username, 'dashboard': None})


# ── Dashboard Data Proxy ──
# Fetches form/submission data using the admin service token
# so dashboard-only users can see data without individual form permissions.
import requests as http_requests

KPI_INTERNAL_URL = os.getenv('KPI_INTERNAL_URL', 'http://nginx')
KPI_INTERNAL_HOST = os.getenv('KPI_INTERNAL_HOST', 'kf.ramaniyangu.internal')
DASHBOARD_SERVICE_TOKEN = os.getenv('DASHBOARD_SERVICE_TOKEN', '')


def get_service_token_for_dashboard():
    """Get the service token for dashboard data proxy."""
    if DASHBOARD_SERVICE_TOKEN:
        return DASHBOARD_SERVICE_TOKEN
    # Try reading from file
    for path in ['/app/.service-token', '/srv/custom-static/.formlist-token']:
        try:
            with open(path, 'r') as f:
                token = f.read().strip()
                if token:
                    return token
        except FileNotFoundError:
            pass
    return ''


@app.route('/api/dashboard-data/forms', methods=['GET'])
def proxy_forms():
    """Proxy form list using service token — for dashboard users."""
    token = get_service_token_for_dashboard()
    if not token:
        return jsonify({'error': 'Service token not configured', 'results': []}), 200

    try:
        resp = http_requests.get(
            f'{KPI_INTERNAL_URL}/api/v2/assets/',
            params={
                'asset_type': 'survey',
                'fields': '["uid","name","deployment_status","deployment__submission_count","date_modified","content"]',
                'limit': '200'
            },
            headers={
                'Authorization': f'Token {token}',
                'Accept': 'application/json',
                'Host': KPI_INTERNAL_HOST,
                'X-Forwarded-Proto': 'https'
            },
            timeout=15,
            allow_redirects=False
        )
        if resp.ok:
            return jsonify(resp.json())
        return jsonify({'results': [], 'error': f'KPI returned {resp.status_code}'}), 200
    except Exception as e:
        log.error(f"Dashboard data proxy error: {e}")
        return jsonify({'results': [], 'error': str(e)}), 200


@app.route('/api/dashboard-data/submissions/<form_uid>', methods=['GET'])
def proxy_submissions(form_uid):
    """Proxy submission data using service token — for dashboard users."""
    if not re.match(r'^[a-zA-Z0-9_-]+$', form_uid):
        return jsonify({'error': 'Invalid form UID', 'results': []}), 400

    token = get_service_token_for_dashboard()
    if not token:
        return jsonify({'error': 'Service token not configured', 'results': []}), 200

    try:
        limit = request.args.get('limit', '100')
        sort = request.args.get('sort', '{"_submission_time":-1}')
        resp = http_requests.get(
            f'{KPI_INTERNAL_URL}/api/v2/assets/{form_uid}/data/',
            params={'limit': limit, 'sort': sort},
            headers={
                'Authorization': f'Token {token}',
                'Accept': 'application/json',
                'Host': KPI_INTERNAL_HOST,
                'X-Forwarded-Proto': 'https'
            },
            timeout=15,
            allow_redirects=False
        )
        if resp.ok:
            return jsonify(resp.json())
        return jsonify({'results': [], 'error': f'KPI returned {resp.status_code}'}), 200
    except Exception as e:
        log.error(f"Dashboard submissions proxy error: {e}")
        return jsonify({'results': [], 'error': str(e)}), 200


# ── Public Dashboard Sharing ──
import secrets
import time
import urllib.request as urllib_request
import urllib.parse as urllib_parse
import urllib.error as urllib_error

# Resolve nginx IP at startup to avoid DNS issues in Gunicorn workers
import socket
_nginx_ip = None
try:
    _nginx_ip = socket.gethostbyname('nginx')
except Exception:
    _nginx_ip = 'nginx'
KPI_URL = os.getenv('KPI_INTERNAL_URL', f'http://{_nginx_ip}')
SERVICE_TOKEN = None
_public_cache = {}  # token -> {data, timestamp}
CACHE_TTL = 30  # seconds


def get_service_token():
    """Read the service token for KPI API access."""
    global SERVICE_TOKEN
    if SERVICE_TOKEN:
        return SERVICE_TOKEN
    # Try environment variables
    SERVICE_TOKEN = os.getenv('KOBO_SERVICE_TOKEN', '') or os.getenv('DASHBOARD_SERVICE_TOKEN', '')
    if SERVICE_TOKEN:
        return SERVICE_TOKEN
    # Try file
    for path in ['/app/.formlist-token', '/srv/custom-static/.formlist-token']:
        try:
            with open(path, 'r') as f:
                SERVICE_TOKEN = f.read().strip()
                if SERVICE_TOKEN:
                    return SERVICE_TOKEN
        except FileNotFoundError:
            pass
    return ''


@app.route('/api/dashboard-share', methods=['POST'])
def manage_share():
    """Create or revoke a share token for a dashboard."""
    try:
        data = request.get_json(force=True)
        dashboard_id = data.get('dashboard_id', '').strip()
        action = data.get('action', 'create')

        if not dashboard_id:
            return jsonify({'error': 'dashboard_id required'}), 400

        config = read_dashboard_config()
        if 'shares' not in config:
            config['shares'] = {}

        if action == 'create':
            token = secrets.token_hex(16)
            config['shares'][token] = {
                'dashboard_id': dashboard_id,
                'created_at': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
                'active': True
            }
            write_dashboard_config(config)
            return jsonify({'token': token, 'status': 'created'})

        elif action == 'revoke':
            token = data.get('token', '').strip()
            if token in config.get('shares', {}):
                del config['shares'][token]
                write_dashboard_config(config)
                return jsonify({'status': 'revoked'})
            return jsonify({'error': 'Token not found'}), 404

        return jsonify({'error': 'Invalid action'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/dashboard-shares/<dashboard_id>', methods=['GET'])
def list_shares(dashboard_id):
    """List active share tokens for a dashboard."""
    config = read_dashboard_config()
    shares = []
    for token, info in config.get('shares', {}).items():
        if info.get('dashboard_id') == dashboard_id and info.get('active', True):
            shares.append({
                'token': token,
                'created_at': info.get('created_at', ''),
            })
    return jsonify({'shares': shares})


@app.route('/api/dashboard-public/<token>', methods=['GET'])
def get_public_dashboard(token):
    """Serve dashboard data for a public/embed share token."""
    # Validate token
    if not re.match(r'^[a-f0-9]{32}$', token):
        return jsonify({'error': 'Invalid token'}), 400

    config = read_dashboard_config()
    share = config.get('shares', {}).get(token)
    if not share or not share.get('active', True):
        return jsonify({'error': 'Share not found or revoked'}), 404

    dashboard_id = share['dashboard_id']
    dashboard = config.get('dashboards', {}).get(dashboard_id)
    if not dashboard:
        return jsonify({'error': 'Dashboard not found'}), 404

    # Check cache
    cached = _public_cache.get(token)
    if cached and (time.time() - cached['timestamp']) < CACHE_TTL:
        return jsonify(cached['data'])

    # Fetch data from KPI
    svc_token = get_service_token()
    if not svc_token:
        return jsonify({'error': 'Service token not configured'}), 500

    # Need Host header so nginx routes to the KPI server block
    kf_host = os.getenv('KF_HOST', '') or KPI_INTERNAL_HOST
    headers = {
        'Authorization': f'Token {svc_token}',
        'Accept': 'application/json',
        'Host': kf_host
    }

    def kpi_get(path, params=None):
        """Make a GET request to KPI via http.client (most reliable in Gunicorn)."""
        import http.client
        query = ''
        if params:
            query = '?' + urllib_parse.urlencode(params)
        conn = http.client.HTTPConnection(_nginx_ip, 80, timeout=15)
        conn.request('GET', path + query, headers=headers)
        resp = conn.getresponse()
        body = resp.read()
        conn.close()
        if resp.status != 200:
            raise Exception(f'KPI returned {resp.status}')
        return json.loads(body.decode())

    try:
        # Fetch forms
        forms_data = kpi_get('/api/v2/assets/', {
            'asset_type': 'survey',
            'fields': '["uid","name","deployment_status","deployment__submission_count"]',
            'limit': 200
        })
        forms = [f for f in forms_data.get('results', []) if f.get('deployment_status') == 'deployed']

        # Determine which forms the dashboard needs
        widget_uids = set()
        for w in dashboard.get('widgets', []):
            form_refs = w.get('forms', ['__all__'])
            if '__all__' in form_refs:
                widget_uids = {f['uid'] for f in forms}
                break
            widget_uids.update(form_refs)

        # Fetch submissions per form
        submissions = {}
        for uid in widget_uids:
            try:
                sub_data = kpi_get(f'/api/v2/assets/{uid}/data/', {
                    'limit': 1000,
                    'sort': '{"_submission_time":-1}'
                })
                submissions[uid] = sub_data.get('results', [])
            except Exception:
                submissions[uid] = []

        result = {
            'dashboard': {
                'name': dashboard.get('name', dashboard_id),
                'widgets': dashboard.get('widgets', [])
            },
            'forms': forms,
            'submissions': submissions
        }

        # Cache it
        _public_cache[token] = {'data': result, 'timestamp': time.time()}

        return jsonify(result)

    except Exception as e:
        log.error(f"Failed to fetch public dashboard data: {e}")
        return jsonify({'error': 'Failed to fetch data'}), 500


# ── Assignments API ──
ASSIGNMENTS_CONFIG_PATH = os.getenv(
    'ASSIGNMENTS_CONFIG_PATH', '/app/config/assignments.json'
)


def read_assignments_config():
    """Read assignments config from JSON file."""
    try:
        with open(ASSIGNMENTS_CONFIG_PATH, 'r') as f:
            data = json.load(f)
            if 'assignments' not in data:
                data['assignments'] = []
            return data
    except (FileNotFoundError, json.JSONDecodeError):
        return {'assignments': []}


def write_assignments_config(config):
    """Write assignments config to JSON file."""
    os.makedirs(os.path.dirname(ASSIGNMENTS_CONFIG_PATH), exist_ok=True)
    with open(ASSIGNMENTS_CONFIG_PATH, 'w') as f:
        json.dump(config, f, indent=2)


@app.route('/api/assignments', methods=['GET'])
def get_assignments():
    """Get all assignments."""
    return jsonify(read_assignments_config())


@app.route('/api/assignments', methods=['POST'])
def create_assignment():
    """Create or update an assignment."""
    try:
        data = request.get_json(force=True)
        if not isinstance(data, dict):
            return jsonify({'error': 'Expected JSON object'}), 400

        config = read_assignments_config()

        # If updating an existing assignment (has id)
        assignment_id = data.get('id', '')
        if assignment_id:
            for i, a in enumerate(config['assignments']):
                if a.get('id') == assignment_id:
                    config['assignments'][i] = data
                    write_assignments_config(config)
                    return jsonify({'status': 'updated', 'id': assignment_id})
            return jsonify({'error': 'Assignment not found'}), 404

        # New assignment
        new_id = 'asgn_' + str(int(time.time())) + '_' + secrets.token_hex(4)
        data['id'] = new_id
        data['created_at'] = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
        if 'status' not in data:
            data['status'] = 'active'

        config['assignments'].append(data)
        write_assignments_config(config)
        log.info(f"Assignment created: {new_id}")
        return jsonify({'status': 'created', 'id': new_id})
    except Exception as e:
        log.error(f"Failed to create assignment: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/assignments/<assignment_id>', methods=['DELETE'])
def delete_assignment(assignment_id):
    """Delete an assignment."""
    if not re.match(r'^[\w-]+$', assignment_id):
        return jsonify({'error': 'Invalid assignment ID'}), 400

    config = read_assignments_config()
    original_len = len(config['assignments'])
    config['assignments'] = [a for a in config['assignments'] if a.get('id') != assignment_id]

    if len(config['assignments']) == original_len:
        return jsonify({'error': 'Assignment not found'}), 404

    write_assignments_config(config)
    log.info(f"Assignment deleted: {assignment_id}")
    return jsonify({'status': 'deleted'})


@app.route('/api/assignments/user/<username>', methods=['GET'])
def get_user_assignments(username):
    """Get assignments for a specific user."""
    if not re.match(r'^[\w.\-@]+$', username):
        return jsonify({'error': 'Invalid username'}), 400

    config = read_assignments_config()
    user_assignments = []
    for a in config.get('assignments', []):
        assigned_to = a.get('assigned_to', [])
        if username in assigned_to:
            user_assignments.append(a)
    return jsonify({'assignments': user_assignments})


# ── Announcements API ──
ANNOUNCEMENTS_CONFIG_PATH = os.getenv(
    'ANNOUNCEMENTS_CONFIG_PATH', '/app/config/announcements.json'
)


def read_announcements_config():
    """Read announcements config from JSON file."""
    try:
        with open(ANNOUNCEMENTS_CONFIG_PATH, 'r') as f:
            data = json.load(f)
            if 'announcements' not in data:
                data['announcements'] = []
            return data
    except (FileNotFoundError, json.JSONDecodeError):
        return {'announcements': []}


def write_announcements_config(config):
    """Write announcements config to JSON file."""
    os.makedirs(os.path.dirname(ANNOUNCEMENTS_CONFIG_PATH), exist_ok=True)
    with open(ANNOUNCEMENTS_CONFIG_PATH, 'w') as f:
        json.dump(config, f, indent=2)


@app.route('/api/announcements', methods=['GET'])
def get_announcements():
    """Get active (non-expired) announcements."""
    config = read_announcements_config()
    now = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
    active = []
    for a in config.get('announcements', []):
        expires = a.get('expires_at', '')
        if expires and expires < now:
            continue
        active.append(a)
    return jsonify({'announcements': active})


@app.route('/api/announcements', methods=['POST'])
def create_announcement():
    """Create a new announcement."""
    try:
        data = request.get_json(force=True)
        if not isinstance(data, dict):
            return jsonify({'error': 'Expected JSON object'}), 400

        title = data.get('title', '').strip()
        message = data.get('message', '').strip()
        ann_type = data.get('type', 'info')

        if not title or not message:
            return jsonify({'error': 'Title and message are required'}), 400
        if ann_type not in ('info', 'warning', 'urgent'):
            ann_type = 'info'

        config = read_announcements_config()

        new_id = 'ann_' + str(int(time.time())) + '_' + secrets.token_hex(4)
        announcement = {
            'id': new_id,
            'title': title,
            'message': message,
            'type': ann_type,
            'expires_at': data.get('expires_at', ''),
            'created_by': data.get('created_by', ''),
            'created_at': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
        }

        config['announcements'].append(announcement)
        write_announcements_config(config)
        log.info(f"Announcement created: {new_id}")
        return jsonify({'status': 'created', 'id': new_id})
    except Exception as e:
        log.error(f"Failed to create announcement: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/announcements/<announcement_id>', methods=['DELETE'])
def delete_announcement(announcement_id):
    """Delete an announcement."""
    if not re.match(r'^[\w-]+$', announcement_id):
        return jsonify({'error': 'Invalid announcement ID'}), 400

    config = read_announcements_config()
    original_len = len(config['announcements'])
    config['announcements'] = [a for a in config['announcements'] if a.get('id') != announcement_id]

    if len(config['announcements']) == original_len:
        return jsonify({'error': 'Announcement not found'}), 404

    write_announcements_config(config)
    log.info(f"Announcement deleted: {announcement_id}")
    return jsonify({'status': 'deleted'})


# ── Teams API ──
TEAMS_CONFIG_PATH = os.getenv(
    'TEAMS_CONFIG_PATH', '/app/config/teams.json'
)


def read_teams_config():
    """Read teams config from JSON file."""
    try:
        with open(TEAMS_CONFIG_PATH, 'r') as f:
            data = json.load(f)
            if 'teams' not in data:
                data['teams'] = []
            return data
    except (FileNotFoundError, json.JSONDecodeError):
        return {'teams': []}


def write_teams_config(config):
    """Write teams config to JSON file."""
    os.makedirs(os.path.dirname(TEAMS_CONFIG_PATH), exist_ok=True)
    with open(TEAMS_CONFIG_PATH, 'w') as f:
        json.dump(config, f, indent=2)


@app.route('/api/teams', methods=['GET'])
def get_teams():
    """Get all teams."""
    return jsonify(read_teams_config())


@app.route('/api/teams', methods=['POST'])
def create_or_update_team():
    """Create or update a team."""
    try:
        data = request.get_json(force=True)
        if not isinstance(data, dict):
            return jsonify({'error': 'Expected JSON object'}), 400

        config = read_teams_config()

        team_id = data.get('id', '')
        if team_id:
            for i, t in enumerate(config['teams']):
                if t.get('id') == team_id:
                    config['teams'][i] = data
                    write_teams_config(config)
                    return jsonify({'status': 'updated', 'id': team_id})
            return jsonify({'error': 'Team not found'}), 404

        # New team
        new_id = 'team_' + str(int(time.time())) + '_' + secrets.token_hex(4)
        data['id'] = new_id
        data['created_at'] = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())

        config['teams'].append(data)
        write_teams_config(config)
        log.info(f"Team created: {new_id}")
        return jsonify({'status': 'created', 'id': new_id})
    except Exception as e:
        log.error(f"Failed to create/update team: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/teams/<team_id>', methods=['GET'])
def get_team(team_id):
    """Get a specific team's details."""
    if not re.match(r'^[\w-]+$', team_id):
        return jsonify({'error': 'Invalid team ID'}), 400

    config = read_teams_config()
    for t in config.get('teams', []):
        if t.get('id') == team_id:
            return jsonify(t)
    return jsonify({'error': 'Team not found'}), 404


@app.route('/api/teams/<team_id>', methods=['DELETE'])
def delete_team(team_id):
    """Delete a team."""
    if not re.match(r'^[\w-]+$', team_id):
        return jsonify({'error': 'Invalid team ID'}), 400

    config = read_teams_config()
    original_len = len(config['teams'])
    config['teams'] = [t for t in config['teams'] if t.get('id') != team_id]

    if len(config['teams']) == original_len:
        return jsonify({'error': 'Team not found'}), 404

    write_teams_config(config)
    log.info(f"Team deleted: {team_id}")
    return jsonify({'status': 'deleted'})


# ── GeoNode / Data Source Test Connection ──

@app.route('/api/test-connection', methods=['GET'])
def test_data_source():
    """Test connection to a GeoNode or WMS/WFS server (avoids browser CORS)."""
    url = request.args.get('url', '').rstrip('/')
    token = request.args.get('token', '')
    username = request.args.get('username', '')
    password = request.args.get('password', '')
    action = request.args.get('action', 'test')

    if not url:
        return jsonify({'ok': False, 'error': 'No URL provided'})

    headers = {'Accept': 'application/json'}
    auth = None
    if token:
        tok = token if ' ' in token else 'Bearer {}'.format(token)
        headers['Authorization'] = tok
    elif username and password:
        auth = (username, password)

    if action == 'list':
        return _list_datasets(url, headers, auth, request.args)
    else:
        return _test_connection(url, headers, auth)


def _test_connection(url, headers, auth):
    import requests as req
    try:
        for endpoint in ['/api/v2/datasets/', '/api/v2/layers/']:
            resp = req.get(
                '{}{}'.format(url, endpoint),
                headers=headers, auth=auth, timeout=15,
                params={'page_size': 1}, allow_redirects=True
            )
            if resp.status_code == 200:
                data = resp.json()
                count = data.get('total', len(data.get('datasets', data.get('layers', data.get('results', [])))))
                return jsonify({'ok': True, 'count': count})
        return jsonify({'ok': False, 'error': 'HTTP {}'.format(resp.status_code)})
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)})


def _list_datasets(url, headers, auth, args):
    import requests as req
    page = int(args.get('page', 1))
    search = args.get('search', '')
    params = {'page_size': 20, 'page': page}
    if search:
        params['search'] = search
    try:
        for endpoint in ['/api/v2/datasets/', '/api/v2/layers/']:
            resp = req.get(
                '{}{}'.format(url, endpoint),
                headers=headers, auth=auth, params=params,
                timeout=20, allow_redirects=True
            )
            if resp.status_code == 200:
                data = resp.json()
                items = data.get('datasets', data.get('layers', data.get('results', [])))
                total = data.get('total', len(items))
                datasets = []
                for item in items:
                    datasets.append({
                        'pk': item.get('pk', ''),
                        'title': item.get('title', ''),
                        'name': item.get('alternate', item.get('name', '')),
                        'abstract': (item.get('abstract', '') or '')[:200],
                        'subtype': item.get('subtype', 'vector'),
                    })
                return jsonify({'ok': True, 'datasets': datasets, 'total': total, 'page': page})
        return jsonify({'ok': False, 'error': 'HTTP {}'.format(resp.status_code)})
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)})


# ── Form Scheduler ──

def _read_form_schedules():
    """Read formSchedules from dashboard-config.json."""
    config = read_dashboard_config()
    return config.get('formSchedules', {})


def _write_form_schedules(schedules):
    """Write formSchedules to dashboard-config.json."""
    config = read_dashboard_config()
    config['formSchedules'] = schedules
    write_dashboard_config(config)


@app.route('/api/form-schedules/<form_uid>', methods=['GET'])
def get_form_schedules(form_uid):
    """Return schedules for a specific form."""
    if not re.match(r'^[a-zA-Z0-9]+$', form_uid):
        return jsonify({'error': 'Invalid form UID'}), 400
    schedules = _read_form_schedules()
    return jsonify({'form_uid': form_uid, 'schedules': schedules.get(form_uid, [])})


@app.route('/api/form-schedules/<form_uid>', methods=['POST'])
def create_form_schedule(form_uid):
    """Create or update a schedule for a form."""
    if not re.match(r'^[a-zA-Z0-9]+$', form_uid):
        return jsonify({'error': 'Invalid form UID'}), 400
    try:
        data = request.get_json(force=True)
        if not isinstance(data, dict):
            return jsonify({'error': 'Request body must be a JSON object'}), 400

        schedule_type = data.get('type', '')
        if schedule_type not in ('auto_deploy', 'auto_archive', 'reminder'):
            return jsonify({'error': 'Invalid schedule type'}), 400

        now_iso = datetime.now(timezone.utc).isoformat()
        schedule = {
            'id': 's_{}'.format(int(_time.time() * 1000)),
            'type': schedule_type,
            'executed': False,
            'created_at': now_iso,
        }

        # Deploy/archive fields
        if schedule_type in ('auto_deploy', 'auto_archive'):
            dt_str = data.get('datetime', '')
            if not dt_str:
                return jsonify({'error': 'datetime is required for deploy/archive'}), 400
            schedule['datetime'] = dt_str

        # Reminder fields
        if schedule_type == 'reminder':
            schedule['recurring'] = bool(data.get('recurring', False))
            schedule['recurrence'] = data.get('recurrence', 'weekly')
            schedule['day'] = data.get('day', 'monday')
            schedule['time'] = data.get('time', '09:00')
            schedule['email_recipients'] = data.get('email_recipients', '')
            schedule['message'] = data.get('message', '')

        schedules = _read_form_schedules()
        if form_uid not in schedules:
            schedules[form_uid] = []
        schedules[form_uid].append(schedule)
        _write_form_schedules(schedules)

        log.info(f"Form schedule created: {schedule['id']} type={schedule_type} for form={form_uid}")
        return jsonify({'status': 'ok', 'schedule': schedule})
    except Exception as e:
        log.error(f"Failed to create form schedule: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/form-schedules/<form_uid>/<schedule_id>', methods=['DELETE'])
def delete_form_schedule(form_uid, schedule_id):
    """Delete a schedule."""
    if not re.match(r'^[a-zA-Z0-9]+$', form_uid):
        return jsonify({'error': 'Invalid form UID'}), 400
    schedules = _read_form_schedules()
    form_schedules = schedules.get(form_uid, [])
    original_len = len(form_schedules)
    form_schedules = [s for s in form_schedules if s.get('id') != schedule_id]
    if len(form_schedules) == original_len:
        return jsonify({'error': 'Schedule not found'}), 404
    schedules[form_uid] = form_schedules
    _write_form_schedules(schedules)
    log.info(f"Form schedule deleted: {schedule_id} for form={form_uid}")
    return jsonify({'status': 'deleted'})


# ── Background Scheduler Checker ──

def _send_reminder_email(recipients, subject, body):
    """Send a reminder email using the existing SMTP config."""
    if not SMTP_HOST or not SMTP_USER:
        log.warning("SMTP not configured, cannot send reminder email")
        return False
    try:
        msg = MIMEMultipart('alternative')
        msg['From'] = EMAIL_FROM or SMTP_USER
        msg['To'] = recipients
        msg['Subject'] = f'{EMAIL_SUBJECT_PREFIX} {subject}'
        msg.attach(MIMEText(body, 'plain'))
        msg.attach(MIMEText(
            f'<html><body style="font-family:Arial,sans-serif;color:#1e293b;">'
            f'<div style="max-width:600px;margin:0 auto;padding:20px;">'
            f'<div style="background:#54a8dc;color:#fff;padding:16px 24px;border-radius:8px 8px 0 0;">'
            f'<h2 style="margin:0;">Form Reminder</h2></div>'
            f'<div style="background:#fff;border:1px solid #e2e8f0;border-top:none;padding:24px;border-radius:0 0 8px 8px;">'
            f'<p>{body}</p></div></div></body></html>', 'html'))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            if SMTP_USE_TLS:
                server.starttls()
            if SMTP_USER and SMTP_PASSWORD:
                server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(msg['From'], recipients.split(','), msg.as_string())
        log.info(f"Reminder email sent to {recipients}")
        return True
    except Exception as e:
        log.error(f"Failed to send reminder email: {e}")
        return False


def _execute_deploy_action(form_uid, action_type):
    """Call KoboToolbox API to deploy or archive a form."""
    token = get_service_token_for_dashboard()
    if not token:
        log.error("No service token available for deploy/archive action")
        return False
    try:
        if action_type == 'auto_deploy':
            # Deploy the form
            resp = http_requests.patch(
                f'{KPI_INTERNAL_URL}/api/v2/assets/{form_uid}/deployment/',
                json={'active': True},
                headers={
                    'Authorization': f'Token {token}',
                    'Host': KPI_INTERNAL_HOST,
                    'Content-Type': 'application/json',
                },
                timeout=30
            )
        elif action_type == 'auto_archive':
            # Archive (set not active)
            resp = http_requests.patch(
                f'{KPI_INTERNAL_URL}/api/v2/assets/{form_uid}/deployment/',
                json={'active': False},
                headers={
                    'Authorization': f'Token {token}',
                    'Host': KPI_INTERNAL_HOST,
                    'Content-Type': 'application/json',
                },
                timeout=30
            )
        else:
            return False
        log.info(f"Deploy/archive action {action_type} for {form_uid}: status={resp.status_code}")
        return resp.status_code in (200, 201)
    except Exception as e:
        log.error(f"Deploy/archive action failed for {form_uid}: {e}")
        return False


def _check_reminder_due(schedule):
    """Check if a recurring reminder is due right now (within the current minute)."""
    now = datetime.now()
    sched_time = schedule.get('time', '09:00')
    try:
        sched_hour, sched_min = [int(x) for x in sched_time.split(':')]
    except (ValueError, AttributeError):
        return False

    if now.hour != sched_hour or now.minute != sched_min:
        return False

    recurrence = schedule.get('recurrence', 'daily')
    if recurrence == 'daily':
        return True
    elif recurrence == 'weekly':
        day_name = schedule.get('day', 'monday').lower()
        day_map = {
            'monday': 0, 'tuesday': 1, 'wednesday': 2, 'thursday': 3,
            'friday': 4, 'saturday': 5, 'sunday': 6
        }
        return now.weekday() == day_map.get(day_name, 0)
    elif recurrence == 'monthly':
        return now.day == 1  # First day of month
    return False


def _scheduler_loop():
    """Background thread: checks every 60s for due schedules."""
    log.info("Form scheduler background thread started")
    while True:
        try:
            schedules = _read_form_schedules()
            changed = False
            now = datetime.now()

            for form_uid, form_schedules in list(schedules.items()):
                for schedule in form_schedules:
                    stype = schedule.get('type', '')

                    # Auto deploy/archive: one-time, check datetime
                    if stype in ('auto_deploy', 'auto_archive') and not schedule.get('executed'):
                        dt_str = schedule.get('datetime', '')
                        try:
                            sched_dt = datetime.fromisoformat(dt_str)
                            if now >= sched_dt:
                                log.info(f"Executing {stype} for form {form_uid}")
                                success = _execute_deploy_action(form_uid, stype)
                                schedule['executed'] = True
                                schedule['executed_at'] = datetime.now(timezone.utc).isoformat()
                                schedule['success'] = success
                                changed = True
                        except (ValueError, TypeError):
                            log.warning(f"Invalid datetime in schedule {schedule.get('id')}: {dt_str}")

                    # Time windows: auto deploy/archive based on day + time
                    elif stype == 'time_window':
                        days = schedule.get('days', [])
                        open_time = schedule.get('open_time', '')
                        close_time = schedule.get('close_time', '')
                        if days and open_time and close_time:
                            day_names = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
                            current_day = day_names[now.weekday()]
                            current_time = now.strftime('%H:%M')
                            is_active_day = current_day in days
                            is_in_window = is_active_day and open_time <= current_time < close_time

                            last_state = schedule.get('_last_state', '')
                            if is_in_window and last_state != 'deployed':
                                log.info(f"Time window OPEN for {form_uid} — deploying")
                                _execute_deploy_action(form_uid, 'auto_deploy')
                                schedule['_last_state'] = 'deployed'
                                changed = True
                            elif not is_in_window and last_state != 'archived' and last_state != '':
                                log.info(f"Time window CLOSED for {form_uid} — archiving")
                                _execute_deploy_action(form_uid, 'auto_archive')
                                schedule['_last_state'] = 'archived'
                                changed = True
                            elif last_state == '':
                                # First run — set initial state without changing deployment
                                schedule['_last_state'] = 'deployed' if is_in_window else 'archived'
                                changed = True

                    # Reminders
                    elif stype == 'reminder':
                        if _check_reminder_due(schedule):
                            last_sent = schedule.get('_last_sent_minute', '')
                            current_minute = now.strftime('%Y-%m-%d %H:%M')
                            if last_sent != current_minute:
                                recipients = schedule.get('email_recipients', '')
                                message = schedule.get('message', 'Please submit your data')
                                if recipients:
                                    _send_reminder_email(
                                        recipients,
                                        f'Reminder: Form {form_uid}',
                                        message
                                    )
                                schedule['_last_sent_minute'] = current_minute
                                changed = True

            if changed:
                _write_form_schedules(schedules)

        except Exception as e:
            log.error(f"Scheduler loop error: {e}")

        _time.sleep(60)


# Start background scheduler thread
_scheduler_thread = threading.Thread(target=_scheduler_loop, daemon=True)
_scheduler_thread.start()


# ── Avatar System (Gravatar + Letter Initial) ──
_AVATAR_COLORS = [
    '#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#1abc9c',
    '#3498db', '#9b59b6', '#e91e63', '#00bcd4', '#ff5722',
    '#795548', '#607d8b', '#4caf50', '#ff9800', '#673ab7',
]

# Cache email lookups to avoid repeated API calls
_email_cache = {}


def _color_for_username(username):
    idx = sum(ord(c) for c in username) % len(_AVATAR_COLORS)
    return _AVATAR_COLORS[idx]


def _generate_initial_svg(username):
    letter = username[0].upper() if username else '?'
    color = _color_for_username(username)
    return (
        '<?xml version="1.0" encoding="UTF-8"?>'
        '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">'
        '<circle cx="100" cy="100" r="100" fill="{color}"/>'
        '<text x="100" y="100" dy=".35em" text-anchor="middle" '
        'font-family="Arial,Helvetica,sans-serif" font-size="96" font-weight="700" '
        'fill="#ffffff">{letter}</text>'
        '</svg>'
    ).format(color=color, letter=letter)


def _get_email_for_user(username):
    if username in _email_cache:
        return _email_cache[username]
    token = get_service_token()
    if not token:
        return None
    try:
        import requests
        resp = requests.get(
            'http://nginx/api/v2/users/{}/?format=json'.format(username),
            headers={
                'Authorization': 'Token {}'.format(token),
                'Host': 'kf.ramaniyangu.com',
                'X-Forwarded-Proto': 'https',
            },
            timeout=5
        )
        if resp.status_code == 200:
            data = resp.json()
            email = data.get('email') or ''
            _email_cache[username] = email
            return email
    except Exception:
        pass
    _email_cache[username] = None
    return None


@app.route('/api/avatar/<username>', methods=['GET'])
def get_avatar(username):
    """Avatar: Gravatar (by email) -> Letter initial SVG."""
    # 1. Try Gravatar
    email = _get_email_for_user(username)
    if email:
        md5_hash = hashlib.md5(email.strip().lower().encode('utf-8')).hexdigest()
        gravatar_url = 'https://www.gravatar.com/avatar/{}?s=200&d=404'.format(md5_hash)
        try:
            import requests
            resp = requests.head(gravatar_url, timeout=3)
            if resp.status_code == 200:
                return redirect(gravatar_url)
        except Exception:
            pass

    # 2. Fallback to generated SVG letter initial
    svg = _generate_initial_svg(username)
    return Response(svg, mimetype='image/svg+xml', headers={
        'Cache-Control': 'public, max-age=3600',
    })


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)

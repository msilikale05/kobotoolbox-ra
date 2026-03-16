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
import json
import logging
import os
import re
import smtplib
from collections import defaultdict
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from dotenv import load_dotenv
from flask import Flask, request, jsonify
from twilio.rest import Client as TwilioClient

load_dotenv('/app/config.env')

# CORS support for local development (browser cross-origin requests)
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
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


def format_email_html(data, form_uid):
    """Format submission data into a styled HTML email with full details."""
    from html import escape
    from datetime import datetime

    submitted_by = data.get('_submitted_by', 'Anonymous')
    submission_time_raw = data.get('_submission_time', '')
    form_title = data.get('_xform_id_string', form_uid)
    submission_id = data.get('_id', '')
    version = data.get('__version__', '')

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

    html = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">

<!-- Header -->
<tr>
<td style="background:linear-gradient(135deg,#1a2a3a 0%,#54a8dc 100%);padding:24px 30px;">
  <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:600;">New Submission Received</h1>
  <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">{escape(form_title)}</p>
</td>
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
  <a href="{sub_link}" style="display:inline-block;padding:12px 24px;background:#54a8dc;color:#ffffff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:600;margin-right:8px;">View Submission</a>
  <a href="{form_link}" style="display:inline-block;padding:12px 24px;background:#e2e8f0;color:#475569;text-decoration:none;border-radius:6px;font-size:14px;font-weight:600;">All Data</a>
</td>
</tr>

<!-- Footer -->
<tr>
<td style="background:#f8fafc;padding:16px 30px;border-top:1px solid #e2e8f0;">
  <p style="margin:0;color:#94a3b8;font-size:12px;text-align:center;">
    Resilience Academy | Ramani Yangu Data Collection Platform<br>
    <a href="{KOBO_URL}" style="color:#54a8dc;text-decoration:none;">{KOBO_URL}</a>
  </p>
</td>
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

    # Send WhatsApp notifications
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
    """Save full multi-dashboard config."""
    try:
        config = request.get_json(force=True)
        if not isinstance(config, dict):
            return jsonify({'error': 'Config must be a JSON object'}), 400
        # Ensure required keys
        if 'dashboards' not in config:
            config['dashboards'] = {}
        if 'users' not in config:
            config['users'] = {}
        # Sanitize usernames in the users map
        clean_users = {}
        for username, dashboard_id in config.get('users', {}).items():
            username = username.strip()
            if re.match(r'^[\w.\-]+$', username) and isinstance(dashboard_id, str):
                clean_users[username] = dashboard_id.strip()
        config['users'] = clean_users
        write_dashboard_config(config)
        log.info(f"Dashboard config updated: {len(config['dashboards'])} dashboards, {len(config['users'])} users")
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


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)

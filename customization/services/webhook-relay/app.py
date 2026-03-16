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

app = Flask(__name__)
app.secret_key = os.getenv('FLASK_SECRET_KEY', 'dev-key')

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
    """Format submission data into a styled HTML email."""
    submitted_by = data.get('_submitted_by', 'Anonymous')
    submission_time = data.get('_submission_time', 'Unknown')
    form_title = data.get('_xform_id_string', form_uid)
    submission_id = data.get('_id', '')

    # Extract all non-internal fields
    fields = []
    for key, value in data.items():
        if key.startswith('_') or key in ('meta', 'formhub'):
            continue
        if isinstance(value, (dict, list)):
            value = str(value)
        if value:
            label = key.replace('_', ' ').replace('/', ' > ').title()
            fields.append((label, str(value)))

    # Build field rows HTML
    field_rows = ''
    for i, (label, value) in enumerate(fields):
        bg = '#f8fafc' if i % 2 == 0 else '#ffffff'
        field_rows += (
            f'<tr style="background:{bg};">'
            f'<td style="padding:10px 14px;border-bottom:1px solid #eef2f7;color:#64748b;font-weight:600;font-size:13px;width:35%;vertical-align:top;">{label}</td>'
            f'<td style="padding:10px 14px;border-bottom:1px solid #eef2f7;color:#334155;font-size:13px;">{value}</td>'
            f'</tr>'
        )

    form_link = f'{KOBO_URL}/#/forms/{form_uid}/data'

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
  <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">{form_title}</p>
</td>
</tr>

<!-- Summary -->
<tr>
<td style="padding:20px 30px 10px;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td style="padding:8px 0;"><span style="color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Submitted by</span><br><strong style="color:#1e293b;font-size:15px;">{submitted_by}</strong></td>
      <td style="padding:8px 0;text-align:right;"><span style="color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Time</span><br><strong style="color:#1e293b;font-size:15px;">{submission_time}</strong></td>
    </tr>
  </table>
</td>
</tr>

<!-- Divider -->
<tr><td style="padding:0 30px;"><hr style="border:none;border-top:1px solid #e2e8f0;margin:8px 0;"></td></tr>

<!-- Data fields -->
<tr>
<td style="padding:10px 30px 20px;">
  <p style="margin:0 0 12px;color:#475569;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Submission Data</p>
  <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:6px;overflow:hidden;">
    {field_rows}
  </table>
</td>
</tr>

<!-- Action button -->
<tr>
<td style="padding:0 30px 24px;" align="center">
  <a href="{form_link}" style="display:inline-block;padding:12px 28px;background:#54a8dc;color:#ffffff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:600;">View in KoboToolbox</a>
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


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)

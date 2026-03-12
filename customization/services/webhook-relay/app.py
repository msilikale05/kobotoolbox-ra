#!/usr/bin/env python3
"""
F11: WhatsApp/SMS Webhook Relay
================================
Flask service that receives webhook POSTs from KoboToolbox's built-in
REST Services (Hook) system and forwards notifications via Twilio.

KoboToolbox Setup:
  1. Go to Project > Settings > REST Services
  2. Add a new service pointing to: http://webhook-relay:5000/webhook/<form-uid>
  3. Select JSON format

UPDATE-PROOF: Standalone container using KoboToolbox's built-in Hook system.
"""
import logging
import os
import re
from collections import defaultdict

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
NOTIFY_VIA = os.getenv('NOTIFY_VIA', 'both')
WEBHOOK_SECRET = os.getenv('WEBHOOK_SECRET', '')
LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')

# Rate limiting: max notifications per form per minute
RATE_LIMIT = int(os.getenv('RATE_LIMIT_PER_MIN', '10'))
_rate_tracker = defaultdict(list)

# Stats
_stats = {'received': 0, 'sent_sms': 0, 'sent_whatsapp': 0, 'errors': 0}

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
    """Format submission data into a notification message."""
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

    if NOTIFY_VIA in ('sms', 'both') and SMS_RECIPIENTS:
        send_sms(message, SMS_RECIPIENTS)
        _stats['sent_sms'] += 1

    if NOTIFY_VIA in ('whatsapp', 'both') and WHATSAPP_RECIPIENTS:
        send_whatsapp(message, WHATSAPP_RECIPIENTS)
        _stats['sent_whatsapp'] += 1

    return jsonify({'status': 'ok', 'form_uid': form_uid}), 200


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'twilio_configured': bool(TWILIO_SID and TWILIO_TOKEN),
        'notify_via': NOTIFY_VIA,
        'sms_recipients': len(SMS_RECIPIENTS),
        'whatsapp_recipients': len(WHATSAPP_RECIPIENTS),
        'stats': _stats,
    })


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)

/**
 * Ramani Yangu - WhatsApp Notification Gateway
 * ==============================================
 * Uses whatsapp-web.js to send notifications via WhatsApp Web.
 * Scan QR code once to connect — just like WhatsApp Web on your browser.
 *
 * Endpoints:
 *   GET  /           - Status page with QR code for setup
 *   GET  /status     - JSON status (connected, qr available, etc.)
 *   GET  /qr         - Current QR code as image
 *   POST /send       - Send a message: { to: "255700000000", message: "text" }
 *   POST /notify     - Send formatted submission notification
 *   GET  /health     - Health check
 */

const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const qrcode = require('qrcode');
const path = require('path');

const app = express();
app.use(express.json());

// CORS
app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// State
let currentQR = null;
let isReady = false;
let clientInfo = null;
let lastError = null;
let messagesSent = 0;

// Notification recipients (comma-separated phone numbers)
const NOTIFY_NUMBERS = (process.env.WHATSAPP_NOTIFY_NUMBERS || '').split(',').map(function (n) { return n.trim(); }).filter(Boolean);

// WhatsApp client
const client = new Client({
  authStrategy: new LocalAuth({ dataPath: '/app/wa-session' }),
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--disable-gpu',
      '--single-process'
    ]
  }
});

client.on('qr', function (qr) {
  currentQR = qr;
  isReady = false;
  console.log('QR code received — scan with WhatsApp to connect');
});

client.on('ready', function () {
  isReady = true;
  currentQR = null;
  clientInfo = client.info;
  console.log('WhatsApp connected as: ' + (clientInfo ? clientInfo.pushname : 'unknown'));
});

client.on('authenticated', function () {
  console.log('WhatsApp authenticated');
});

client.on('auth_failure', function (msg) {
  lastError = 'Auth failed: ' + msg;
  console.error(lastError);
});

client.on('disconnected', function (reason) {
  isReady = false;
  lastError = 'Disconnected: ' + reason;
  console.log(lastError);
  // Try to reconnect
  setTimeout(function () {
    console.log('Attempting reconnect...');
    client.initialize().catch(function (e) { console.error('Reconnect failed:', e); });
  }, 5000);
});

// Initialize WhatsApp client
client.initialize().catch(function (e) {
  lastError = 'Init error: ' + e.message;
  console.error(lastError);
});

// ── Routes ──

// Status page with QR code
app.get('/', function (req, res) {
  var statusColor = isReady ? '#10b981' : (currentQR ? '#f59e0b' : '#e74c3c');
  var statusText = isReady ? 'Connected' : (currentQR ? 'Scan QR Code' : 'Initializing...');
  var connectedAs = isReady && clientInfo ? clientInfo.pushname || clientInfo.wid.user : '';

  var html = '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>WhatsApp Gateway - Ramani Yangu</title>' +
    '<style>body{margin:0;font-family:-apple-system,sans-serif;background:#f1f5f9;display:flex;align-items:center;justify-content:center;min-height:100vh;}' +
    '.card{background:#fff;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.1);max-width:420px;width:90%;overflow:hidden;}' +
    '.header{background:linear-gradient(135deg,#1a2a3a,#54a8dc);padding:24px;color:#fff;text-align:center;}' +
    '.header h1{margin:0;font-size:20px;font-weight:600;}.header p{margin:6px 0 0;opacity:0.8;font-size:13px;}' +
    '.body{padding:24px;text-align:center;}' +
    '.status{display:inline-flex;align-items:center;gap:8px;padding:8px 16px;border-radius:20px;font-size:14px;font-weight:600;margin-bottom:16px;}' +
    '.qr-box{padding:16px;border:2px dashed #e2e8f0;border-radius:8px;margin:16px 0;}' +
    '.info{font-size:13px;color:#64748b;line-height:1.6;margin-top:16px;text-align:left;}' +
    '.footer{padding:16px 24px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:12px;color:#94a3b8;text-align:center;}</style></head>' +
    '<body><div class="card">' +
    '<div class="header"><h1>WhatsApp Gateway</h1><p>Ramani Yangu Notification System</p></div>' +
    '<div class="body">' +
    '<div class="status" style="background:' + statusColor + '20;color:' + statusColor + ';">' +
    '<span style="width:10px;height:10px;border-radius:50%;background:' + statusColor + ';"></span>' + statusText + '</div>';

  if (isReady) {
    html += '<div style="font-size:16px;font-weight:600;color:#1e293b;margin:12px 0;">Connected as ' + connectedAs + '</div>' +
      '<div style="font-size:13px;color:#64748b;">' + messagesSent + ' messages sent</div>' +
      '<div class="info"><strong>Notification numbers:</strong><br>' +
      (NOTIFY_NUMBERS.length ? NOTIFY_NUMBERS.join(', ') : 'None configured — set WHATSAPP_NOTIFY_NUMBERS in config') + '</div>';
  } else if (currentQR) {
    html += '<div class="qr-box"><img src="/qr" alt="QR Code" style="max-width:256px;width:100%;"/></div>' +
      '<div class="info">' +
      '<strong>To connect:</strong><br>' +
      '1. Open WhatsApp on your phone<br>' +
      '2. Tap Menu (or Settings) &gt; Linked Devices<br>' +
      '3. Tap "Link a Device"<br>' +
      '4. Scan this QR code' +
      '</div>';
  } else {
    html += '<div style="padding:20px;color:#94a3b8;">Initializing WhatsApp client...</div>';
    if (lastError) html += '<div style="color:#e74c3c;font-size:13px;margin-top:8px;">' + lastError + '</div>';
  }

  html += '</div><div class="footer">Resilience Academy | Ramani Yangu</div></div>' +
    '<script>setTimeout(function(){location.reload()},10000);</script></body></html>';

  res.send(html);
});

// QR code as image
app.get('/qr', function (req, res) {
  if (!currentQR) {
    return res.status(404).json({ error: 'No QR code available' });
  }
  qrcode.toBuffer(currentQR, { width: 300, margin: 2 }, function (err, buffer) {
    if (err) return res.status(500).json({ error: err.message });
    res.type('image/png').send(buffer);
  });
});

// JSON status
app.get('/status', function (req, res) {
  res.json({
    connected: isReady,
    qr_available: !!currentQR,
    user: isReady && clientInfo ? { name: clientInfo.pushname, number: clientInfo.wid.user } : null,
    messages_sent: messagesSent,
    notify_numbers: NOTIFY_NUMBERS,
    error: lastError
  });
});

// Send a message
app.post('/send', function (req, res) {
  if (!isReady) return res.status(503).json({ error: 'WhatsApp not connected. Scan QR code first.' });

  var to = (req.body.to || '').toString().trim();
  var message = (req.body.message || '').trim();

  if (!to || !message) return res.status(400).json({ error: 'to and message are required' });

  // Format phone number: ensure it ends with @c.us
  var chatId = to.replace(/[^0-9]/g, '');
  if (!chatId.endsWith('@c.us')) chatId = chatId + '@c.us';

  client.sendMessage(chatId, message).then(function (msg) {
    messagesSent++;
    console.log('Message sent to ' + to);
    res.json({ status: 'sent', to: to });
  }).catch(function (err) {
    console.error('Send failed:', err);
    res.status(500).json({ error: err.message });
  });
});

// Send formatted submission notification
app.post('/notify', function (req, res) {
  if (!isReady) return res.status(503).json({ error: 'WhatsApp not connected' });

  var data = req.body;
  var formTitle = data.form_title || data._xform_id_string || 'Unknown Form';
  var submittedBy = data.submitted_by || data._submitted_by || 'Anonymous';
  var submissionTime = data.submission_time || data._submission_time || '';
  var formUid = data.form_uid || '';

  // Format time
  var timeStr = submissionTime;
  try {
    var dt = new Date(submissionTime);
    if (!isNaN(dt.getTime())) {
      timeStr = dt.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
    }
  } catch (e) {}

  // Build fields summary
  var fields = [];
  var fieldData = data.fields || data.data || {};
  var keys = Object.keys(fieldData);
  for (var i = 0; i < keys.length && i < 6; i++) {
    var key = keys[i];
    if (key.charAt(0) === '_') continue;
    var val = fieldData[key];
    if (val && typeof val !== 'object') {
      fields.push('  ' + key.replace(/_/g, ' ').replace(/\//g, ' > ') + ': ' + val);
    }
  }

  var message = '*📋 New Submission*\n' +
    '━━━━━━━━━━━━━━━━━\n' +
    '*Form:* ' + formTitle + '\n' +
    '*By:* ' + submittedBy + '\n' +
    '*Time:* ' + timeStr + '\n';

  if (fields.length) {
    message += '\n*Data:*\n' + fields.join('\n') + '\n';
  }

  if (data.location) {
    message += '\n📍 *Location:* ' + data.location + '\n';
  }

  message += '\n🔗 View: https://kf.ramaniyangu.com/#/forms/' + formUid + '/data';

  // Send to all configured numbers
  var targets = NOTIFY_NUMBERS.slice();
  if (data.to) {
    var extra = Array.isArray(data.to) ? data.to : [data.to];
    extra.forEach(function (n) { if (targets.indexOf(n) === -1) targets.push(n); });
  }

  if (!targets.length) {
    return res.status(400).json({ error: 'No notification numbers configured' });
  }

  var sent = 0;
  var errors = [];

  targets.forEach(function (num) {
    var chatId = num.replace(/[^0-9]/g, '') + '@c.us';
    client.sendMessage(chatId, message).then(function () {
      sent++;
      messagesSent++;
      if (sent + errors.length === targets.length) {
        res.json({ status: 'ok', sent: sent, errors: errors });
      }
    }).catch(function (err) {
      errors.push({ to: num, error: err.message });
      if (sent + errors.length === targets.length) {
        res.json({ status: 'partial', sent: sent, errors: errors });
      }
    });
  });
});

// Health check
app.get('/health', function (req, res) {
  res.json({
    status: isReady ? 'connected' : 'disconnected',
    messages_sent: messagesSent
  });
});

// Start server
var PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', function () {
  console.log('WhatsApp Gateway running on port ' + PORT);
});

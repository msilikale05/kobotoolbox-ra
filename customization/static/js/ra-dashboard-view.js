/**
 * Resilience Academy - Multi-Dashboard View
 * ============================================
 * Widget-based, admin-configurable dashboard for designated viewer users.
 * Supports multiple dashboards with per-user assignment.
 * Admin defines widgets (stat cards, charts, tables, feeds) via Settings page.
 * Dashboard users see only their assigned dashboard — nothing else.
 *
 * UPDATE-PROOF: Loaded via nginx sub_filter; does not modify core files.
 */
(function () {
  'use strict';

  var CONFIG_URL = '/webhook-api/dashboard-config';
  var CONFIG_URL_FALLBACK = 'http://localhost:5050/api/dashboard-config';
  var PAGE_ID = 'ra-dashonly-page';
  var BRAND_NAME = 'Ramani Yangu';
  var REFRESH_INTERVAL = 30000;

  var currentUser = null;
  var isDashboardOnly = false;
  var isPreviewMode = false;
  var previewDashboardId = null;
  var refreshTimer = null;
  var dashConfig = null;
  var activeDashboardId = null;
  var formsCache = [];
  var subsCache = {};

  var PIE_COLORS = ['#54a8dc', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#14b8a6', '#6366f1'];

  if (/\/accounts\/(login|signup|password)/.test(window.location.pathname)) return;

  // ── INSTANT SCREEN COVER (replaces default KoboToolbox loading) ──
  var screenCover = document.createElement('div');
  screenCover.id = 'ra-do-screencover';
  screenCover.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:#ffffff;z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;transition:opacity 0.4s;';
  screenCover.innerHTML =
    '<img src="/custom-static/images/ra-logo-dark.png" alt="Resilience Academy" style="width:180px;margin-bottom:32px;opacity:0;animation:ra-cover-fadein 0.6s ease forwards;">' +
    '<div style="width:120px;height:2px;background:#f0f0f0;border-radius:2px;overflow:hidden;"><div style="height:100%;background:#54a8dc;border-radius:2px;animation:ra-cover-bar 2s ease-in-out infinite;"></div></div>' +
    '<style>' +
      '@keyframes ra-cover-fadein{to{opacity:1}}' +
      '@keyframes ra-cover-bar{0%{width:0;margin-left:0}50%{width:100%;margin-left:0}100%{width:0;margin-left:100%}}' +
    '</style>';
  document.documentElement.appendChild(screenCover);

  function removeScreenCover() {
    var c = document.getElementById('ra-do-screencover');
    if (c) {
      c.style.opacity = '0';
      setTimeout(function () { if (c.parentNode) c.remove(); }, 400);
    }
  }

  // ── Styles ──
  var style = document.createElement('style');
  style.textContent = [
    '#' + PAGE_ID + ' {',
    '  position: fixed; top: 0; left: 0; right: 0; bottom: 0;',
    '  background: #f1f5f9; z-index: 99999; overflow-y: auto;',
    '  display: none;',
    '  flex-direction: column;',
    '  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;',
    '}',
    '#' + PAGE_ID + '.ra-do--visible { display: flex; }',
    'body.ra-do-active #kpi-app { display: none !important; }',
    'body.ra-do-active header { display: none !important; }',
    'body.ra-do-active nav { display: none !important; }',
    'body.ra-do-active .k-drawer { display: none !important; }',
    'body.ra-do-active [class*="drawer"] { display: none !important; }',
    'body.ra-do-active #ra-welcome-panel { display: none !important; }',
    'body.ra-do-active #ra-leaderboard-page { display: none !important; }',
    'body.ra-do-active #ra-map-page { display: none !important; }',
    'body.ra-do-active #ra-settings-page { display: none !important; }',

    '.ra-do__header {',
    '  background: linear-gradient(135deg, #1a2a3a 0%, #54a8dc 100%);',
    '  color: #fff; padding: 0; display: flex; flex-direction: column;',
    '  position: sticky; top: 0; z-index: 10;',
    '  box-shadow: 0 2px 8px rgba(0,0,0,0.15);',
    '}',
    '.ra-do__header-top {',
    '  display: flex; align-items: center; justify-content: space-between;',
    '  padding: 10px 24px; min-height: 48px;',
    '}',
    '.ra-do__header-left { display: flex; align-items: center; gap: 14px; }',
    '.ra-do__header img { height: 28px; width: auto; }',
    '.ra-do__header-right { display: flex; align-items: center; gap: 12px; font-size: 13px; }',
    '.ra-do__header-title {',
    '  padding: 0 24px 10px; font-size: 16px; font-weight: 600; margin: 0;',
    '  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;',
    '  opacity: 0.9; border-top: 1px solid rgba(255,255,255,0.1);',
    '  padding-top: 8px; text-align: center;',
    '}',
    '.ra-do__username { cursor: pointer; position: relative; color: #fff; text-decoration: underline; text-decoration-style: dotted; text-underline-offset: 3px; }',
    '.ra-do__username:hover { color: #7dc0e8; }',
    '.ra-do__user-dropdown { position: absolute; top: 100%; right: 0; margin-top: 8px; background: #fff; border-radius: 8px; box-shadow: 0 8px 30px rgba(0,0,0,0.25); min-width: 200px; z-index: 9999; padding: 6px 0; display: none; }',
    '.ra-do__user-dropdown--open { display: block; }',
    '.ra-do__user-dropdown-item { display: flex; align-items: center; gap: 10px; padding: 10px 16px; font-size: 13px; color: #333; cursor: pointer; border: none; background: none; width: 100%; text-align: left; }',
    '.ra-do__user-dropdown-item:hover { background: #f5f7fa; }',
    '.ra-do__user-dropdown-item svg { width: 16px; height: 16px; fill: #666; flex-shrink: 0; }',

    /* Profile edit popup */
    '.ra-do__popup-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 99999; display: flex; align-items: center; justify-content: center; }',
    '.ra-do__popup { background: #fff; border-radius: 12px; width: 440px; max-height: 85vh; display: flex; flex-direction: column; box-shadow: 0 12px 40px rgba(0,0,0,0.3); }',
    '.ra-do__popup-header { padding: 16px 20px; border-bottom: 1px solid #eee; display: flex; align-items: center; justify-content: space-between; }',
    '.ra-do__popup-header h3 { margin: 0; font-size: 16px; color: #1a2a3a; }',
    '.ra-do__popup-close { background: none; border: none; font-size: 22px; cursor: pointer; color: #999; padding: 4px 8px; }',
    '.ra-do__popup-close:hover { color: #333; }',
    '.ra-do__popup-body { padding: 16px 20px; overflow-y: auto; flex: 1; }',
    '.ra-do__popup-field { margin-bottom: 14px; }',
    '.ra-do__popup-field label { display: block; font-size: 12px; font-weight: 600; color: #555; margin-bottom: 4px; }',
    '.ra-do__popup-field input, .ra-do__popup-field textarea { width: 100%; padding: 8px 10px; font-size: 13px; border: 1px solid #d0d5dd; border-radius: 6px; box-sizing: border-box; font-family: inherit; }',
    '.ra-do__popup-field textarea { resize: vertical; min-height: 60px; }',
    '.ra-do__popup-field input:focus, .ra-do__popup-field textarea:focus { border-color: #54a8dc; outline: none; }',
    '.ra-do__popup-footer { padding: 12px 20px; border-top: 1px solid #eee; display: flex; justify-content: flex-end; gap: 8px; }',
    '.ra-do__popup-btn { padding: 8px 16px; border-radius: 6px; font-size: 13px; cursor: pointer; border: 1px solid #d0d5dd; background: #fff; color: #333; }',
    '.ra-do__popup-btn:hover { background: #f5f7fa; }',
    '.ra-do__popup-btn--primary { background: #54a8dc; color: #fff; border-color: #54a8dc; }',
    '.ra-do__popup-btn--primary:hover { background: #3d8abf; }',
    '.ra-do__popup-status { padding: 8px 12px; border-radius: 6px; font-size: 12px; margin-top: 8px; display: none; }',
    '.ra-do__popup-status--ok { display: block; background: #e8f5e9; color: #2e7d32; }',
    '.ra-do__popup-status--err { display: block; background: #fbe9e7; color: #c62828; }',

    /* Subscribe floating button */
    '.ra-do__subscribe-btn {',
    '  position: fixed; bottom: 24px; right: 24px; z-index: 9998;',
    '  background: #54a8dc; color: #fff; border: none; border-radius: 50px;',
    '  padding: 12px 20px; font-size: 13px; font-weight: 600; cursor: pointer;',
    '  box-shadow: 0 4px 16px rgba(84,168,220,0.4);',
    '  display: flex; align-items: center; gap: 8px;',
    '  transition: background 0.2s, transform 0.2s, box-shadow 0.2s;',
    '  font-family: inherit;',
    '}',
    '.ra-do__subscribe-btn:hover { background: #3d8abf; transform: translateY(-2px); box-shadow: 0 6px 20px rgba(84,168,220,0.5); }',
    '.ra-do__subscribe-btn svg { width: 18px; height: 18px; fill: #fff; }',
    '.ra-do__subscribe-popup {',
    '  position: fixed; bottom: 80px; right: 24px; z-index: 9999;',
    '  background: #fff; border-radius: 12px; width: 380px;',
    '  box-shadow: 0 12px 40px rgba(0,0,0,0.25);',
    '  display: none; flex-direction: column;',
    '  animation: ra-do-slidein 0.25s ease;',
    '}',
    '.ra-do__subscribe-popup--open { display: flex; }',
    '@keyframes ra-do-slidein { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }',
    '.ra-do__subscribe-header {',
    '  padding: 14px 18px; border-bottom: 1px solid #eee;',
    '  display: flex; align-items: center; justify-content: space-between;',
    '}',
    '.ra-do__subscribe-header h4 { margin: 0; font-size: 15px; color: #1a2a3a; }',
    '.ra-do__subscribe-close { background: none; border: none; font-size: 20px; cursor: pointer; color: #999; padding: 2px 6px; }',
    '.ra-do__subscribe-close:hover { color: #333; }',
    '.ra-do__subscribe-body { padding: 16px 18px; min-height: 200px; }',

    '.ra-do__logout {',
    '  background: rgba(255,255,255,0.2); color: #fff; border: none;',
    '  padding: 7px 16px; border-radius: 5px; font-size: 13px; cursor: pointer;',
    '}',
    '.ra-do__logout:hover { background: rgba(255,255,255,0.3); }',
    '.ra-do__content { max-width: 1200px; margin: 0 auto; padding: 24px 24px 60px; flex: 1; width: 100%; box-sizing: border-box; }',

    '.ra-do__grid {',
    '  display: grid; grid-template-columns: repeat(2, 1fr);',
    '  gap: 20px;',
    '}',
    '.ra-do__widget {',
    '  background: #fff; border-radius: 8px;',
    '  box-shadow: 0 1px 3px rgba(0,0,0,0.08); overflow: hidden;',
    '}',
    '.ra-do__widget--full { grid-column: 1 / -1; }',
    '.ra-do__widget-header {',
    '  padding: 14px 18px; border-bottom: 1px solid #f1f5f9;',
    '  font-size: 14px; font-weight: 600; color: #1e293b;',
    '}',
    '.ra-do__widget-body { padding: 18px; }',

    '.ra-do__stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 14px; }',
    '.ra-do__stat { text-align: center; padding: 12px; }',
    '.ra-do__stat-value { font-size: 28px; font-weight: 700; color: #1e293b; }',
    '.ra-do__stat-label { font-size: 12px; color: #64748b; margin-top: 4px; }',

    '.ra-do__bar { fill: #54a8dc; transition: fill 0.15s; }',
    '.ra-do__bar:hover { fill: #3b8abf; }',
    '.ra-do__chart-label { font-size: 10px; fill: #94a3b8; }',
    '.ra-do__chart-val { font-size: 10px; fill: #475569; text-anchor: middle; }',

    '.ra-do__table { width: 100%; border-collapse: collapse; }',
    '.ra-do__table th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; padding: 10px 12px; border-bottom: 2px solid #e2e8f0; font-weight: 600; }',
    '.ra-do__table td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #334155; }',
    '.ra-do__table tr:hover td { background: #f8fafc; }',

    '.ra-do__feed-item { display: flex; gap: 12px; padding: 10px 0; border-bottom: 1px solid #f1f5f9; }',
    '.ra-do__feed-avatar { width: 34px; height: 34px; border-radius: 50%; background: #e0f2fe; color: #0284c7; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; flex-shrink: 0; }',
    '.ra-do__feed-info { flex: 1; min-width: 0; }',
    '.ra-do__feed-user { font-weight: 600; color: #1e293b; font-size: 13px; }',
    '.ra-do__feed-form { color: #64748b; font-size: 12px; }',
    '.ra-do__feed-time { color: #94a3b8; font-size: 12px; white-space: nowrap; }',

    '.ra-do__pie-legend { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }',
    '.ra-do__pie-item { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #475569; }',
    '.ra-do__pie-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }',

    '.ra-do__refresh { font-size: 11px; color: #94a3b8; text-align: right; margin-top: 12px; }',

    /* Tablet */
    '@media (max-width: 900px) {',
    '  .ra-do__grid { gap: 14px; }',
    '  .ra-do__widget-header { padding: 12px 14px; font-size: 13px; }',
    '  .ra-do__widget-body { padding: 14px; }',
    '  .ra-do__content { padding: 20px 16px 40px; }',
    '}',

    /* Mobile */
    '@media (max-width: 600px) {',
    '  .ra-do__header-top { padding: 8px 14px; min-height: 40px; }',
    '  .ra-do__header img { height: 24px; }',
    '  .ra-do__header-title { padding: 0 14px 8px; font-size: 13px; padding-top: 6px; }',
    '  .ra-do__header-right { gap: 6px; font-size: 11px; }',
    '  .ra-do__logout { padding: 5px 10px; font-size: 11px; }',
    '  .ra-do__grid { grid-template-columns: 1fr; gap: 12px; }',
    '  .ra-do__content { padding: 12px 10px 30px; }',
    '  .ra-do__widget-header { padding: 10px 12px; font-size: 12px; }',
    '  .ra-do__widget-body { padding: 12px; }',
    '  .ra-do__stat-value { font-size: 22px; }',
    '  .ra-do__stat-label { font-size: 11px; }',
    '  .ra-do__stats { grid-template-columns: repeat(2, 1fr); gap: 8px; }',
    '  .ra-do__stat { padding: 8px; }',
    '  .ra-do__feed-item { gap: 8px; padding: 8px 0; }',
    '  .ra-do__feed-avatar { width: 28px; height: 28px; font-size: 12px; }',
    '  .ra-do__feed-user { font-size: 12px; }',
    '  .ra-do__feed-form { font-size: 11px; }',
    '  .ra-do__feed-time { font-size: 11px; }',
    '  .ra-do__table th { font-size: 10px; padding: 8px; }',
    '  .ra-do__table td { font-size: 12px; padding: 8px; }',
    '  .ra-do__pie-legend { font-size: 11px; }',
    '  .ra-do__popup { width: 95vw; max-height: 90vh; border-radius: 8px; }',
    '  .ra-do__user-dropdown { right: -40px; min-width: 170px; }',
    '}',
    ''
  ].join('\n');
  document.head.appendChild(style);

  // ── Helpers ──
  function esc(s) {
    var d = document.createElement('div');
    d.appendChild(document.createTextNode(s || ''));
    return d.innerHTML;
  }

  function timeAgo(ds) {
    if (!ds) return '';
    var diff = (Date.now() - new Date(ds).getTime()) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    if (diff < 604800) return Math.floor(diff / 86400) + 'd ago';
    return new Date(ds).toLocaleDateString();
  }

  // Common form field names that hold the submitter/collector name
  var NAME_FIELD_PATTERNS = [
    'collector_name', 'enumerator_name', 'enumerator', 'collector',
    'surveyor_name', 'surveyor', 'interviewer_name', 'interviewer',
    'recorder_name', 'recorder', 'agent_name', 'agent',
    'field_officer', 'data_collector', 'respondent_name', 'your_name'
  ];

  function getSubmitter(s, nameField) {
    // 1. If explicit nameField is configured, use it first
    if (nameField) {
      var keys = Object.keys(s);
      for (var j = 0; j < keys.length; j++) {
        var k = keys[j];
        if (k === nameField || k.indexOf('/' + nameField) === k.length - nameField.length - 1) {
          var v = s[k];
          if (v && String(v).trim()) return String(v).trim();
        }
      }
    }

    // 2. Check _submitted_by (KoboToolbox system field)
    var user = s._submitted_by;
    if (user && user !== '' && user !== 'AnonymousUser') return user;

    // 3. Auto-detect common name fields in the submission data
    var allKeys = Object.keys(s);
    for (var i = 0; i < NAME_FIELD_PATTERNS.length; i++) {
      var pattern = NAME_FIELD_PATTERNS[i];
      for (var jj = 0; jj < allKeys.length; jj++) {
        var kk = allKeys[jj];
        if (kk === pattern || kk.indexOf('/' + pattern) === kk.length - pattern.length - 1) {
          var val = s[kk];
          if (val && String(val).trim()) return String(val).trim();
        }
      }
    }

    // 4. Fallback
    return 'Unknown';
  }

  function fetchJSON(url) {
    return fetch(url, { credentials: 'same-origin' }).then(function (r) {
      return r.ok ? r.json() : Promise.reject(r.status);
    });
  }

  // ── User Detection ──
  function detectUser() {
    return fetchJSON('/me/').then(function (data) {
      currentUser = data;
      return loadDashboardConfig().then(function () {
        var users = (dashConfig && dashConfig.users) ? dashConfig.users : {};
        if (users[data.username]) {
          isDashboardOnly = true;
          activeDashboardId = users[data.username];
          // Set title immediately and flag globally so ra-welcome.js stops overriding
          document.title = data.username + ' | ' + BRAND_NAME;
        } else {
          isDashboardOnly = false;
          activeDashboardId = null;
        }
        return isDashboardOnly;
      });
    }).catch(function () { return false; });
  }

  function fetchWithTimeout(url, opts, ms) {
    ms = ms || 5000;
    return new Promise(function (resolve, reject) {
      var timer = setTimeout(function () { reject(new Error('timeout')); }, ms);
      fetch(url, opts || {}).then(function (r) {
        clearTimeout(timer);
        resolve(r);
      }).catch(function (e) {
        clearTimeout(timer);
        reject(e);
      });
    });
  }

  function loadDashboardConfig() {
    return fetchWithTimeout(CONFIG_URL, { credentials: 'same-origin' }, 3000)
      .then(function (r) {
        if (!r.ok) throw new Error('not ok');
        return r.json();
      })
      .then(function (c) { dashConfig = c; })
      .catch(function () {
        // Fallback for local dev
        return fetchWithTimeout(CONFIG_URL_FALLBACK, {}, 3000)
          .then(function (r) { return r.ok ? r.json() : {}; })
          .then(function (c) { dashConfig = c; })
          .catch(function () { dashConfig = { dashboards: {}, users: {} }; });
      });
  }

  // ── Access Control ──
  function enforceAccess() {
    if (!isDashboardOnly || isPreviewMode) return;
    var p = document.getElementById(PAGE_ID);
    if (p) p.classList.add('ra-do--visible');
    document.body.classList.add('ra-do-active');
  }

  // ── Get Active Dashboard ──
  function getActiveDashboard() {
    var dashboards = (dashConfig && dashConfig.dashboards) ? dashConfig.dashboards : {};
    var dashId = isPreviewMode ? previewDashboardId : activeDashboardId;
    if (dashId && dashboards[dashId]) {
      return dashboards[dashId];
    }
    // Fallback to "default" dashboard
    if (dashboards['default']) {
      return dashboards['default'];
    }
    // Return null to trigger default widgets
    return null;
  }

  // ── Create Page Shell ──
  function createPage() {
    var existing = document.getElementById(PAGE_ID);
    if (existing) existing.remove();

    var dashboard = getActiveDashboard();
    var dashName = (dashboard && dashboard.name) ? dashboard.name : 'Data Collection Dashboard';

    var page = document.createElement('div');
    page.id = PAGE_ID;
    page.innerHTML =
      '<div class="ra-do__header">' +
        '<div class="ra-do__header-top">' +
          '<div class="ra-do__header-left">' +
            '<img src="/custom-static/images/ra-logo.png" alt="' + BRAND_NAME + '">' +
          '</div>' +
          '<div class="ra-do__header-right">' +
            '<span>Welcome, <strong class="ra-do__username" id="ra-do-username" title="Click for account options">' + esc(currentUser ? currentUser.username : '') +
              '<div class="ra-do__user-dropdown" id="ra-do-user-dropdown">' +
                '<button class="ra-do__user-dropdown-item" data-action="edit-profile" title="Edit your profile details">' +
                  '<svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>' +
                  'Edit Profile</button>' +
              '</div>' +
            '</strong></span>' +
            '<button class="ra-do__logout" id="ra-do-logout-btn" title="Sign out of your account">Logout</button>' +
          '</div>' +
        '</div>' +
        '<div class="ra-do__header-title">' + esc(dashName) + '</div>' +
      '</div>' +
      '<div class="ra-do__content">' +
        '<div class="ra-do__grid" id="ra-do-grid"></div>' +
        '<div class="ra-do__refresh" id="ra-do-refresh"></div>' +
      '</div>' +
      '<div id="ra-do-footer" style="display:none;"></div>';

    document.body.appendChild(page);
    page.classList.add('ra-do--visible');
    if (!isPreviewMode) document.body.classList.add('ra-do-active');

    // Load footer from customization/footer/
    loadDashboardFooter();

    // Subscribe floating button
    createSubscribeButton(page);

    // Set browser tab title to "username | Ramani Yangu"
    if (currentUser && currentUser.username) {
      document.title = currentUser.username + ' | ' + BRAND_NAME;
    }

    document.getElementById('ra-do-logout-btn').addEventListener('click', function () {
      var csrf = '';
      document.cookie.split(';').forEach(function (c) {
        c = c.trim();
        if (c.indexOf('csrftoken=') === 0) csrf = c.substring(10);
      });
      var form = document.createElement('form');
      form.method = 'POST';
      form.action = '/accounts/logout/';
      var inp = document.createElement('input');
      inp.type = 'hidden';
      inp.name = 'csrfmiddlewaretoken';
      inp.value = csrf;
      form.appendChild(inp);
      document.body.appendChild(form);
      form.submit();
    });

    // Username dropdown toggle
    var usernameEl = document.getElementById('ra-do-username');
    var userDropdown = document.getElementById('ra-do-user-dropdown');
    if (usernameEl && userDropdown) {
      usernameEl.addEventListener('click', function (e) {
        e.stopPropagation();
        userDropdown.classList.toggle('ra-do__user-dropdown--open');
      });
      document.addEventListener('click', function () {
        userDropdown.classList.remove('ra-do__user-dropdown--open');
      });
      userDropdown.addEventListener('click', function (e) {
        var item = e.target.closest('[data-action]');
        if (!item) return;
        e.stopPropagation();
        userDropdown.classList.remove('ra-do__user-dropdown--open');
        var act = item.getAttribute('data-action');
        if (act === 'edit-profile') openDashEditProfile();
        else if (act === 'change-password') openDashChangePassword();
      });
    }
  }

  function createSubscribeButton(page) {
    // Floating subscribe button
    var btn = document.createElement('button');
    btn.className = 'ra-do__subscribe-btn';
    btn.innerHTML =
      '<svg viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>' +
      'Subscribe';

    // Popup
    var popup = document.createElement('div');
    popup.className = 'ra-do__subscribe-popup';
    popup.innerHTML =
      '<div class="ra-do__subscribe-header">' +
        '<h4>Stay Updated</h4>' +
        '<button class="ra-do__subscribe-close">&times;</button>' +
      '</div>' +
      '<div class="ra-do__subscribe-body">' +
        '<div id="ra-do-subscribe-form"></div>' +
      '</div>';

    page.appendChild(btn);
    page.appendChild(popup);

    // Preload the SureContact script immediately (in background)
    var scScript = document.createElement('script');
    scScript.src = 'https://app.surecontact.com/embed/forms.js';
    document.head.appendChild(scScript);

    // Toggle popup
    var formRendered = false;
    btn.addEventListener('click', function () {
      var isOpen = popup.classList.contains('ra-do__subscribe-popup--open');
      if (isOpen) {
        popup.classList.remove('ra-do__subscribe-popup--open');
      } else {
        popup.classList.add('ra-do__subscribe-popup--open');
        if (!formRendered && window.SureContactForms) {
          window.SureContactForms.render({
            formId: '577cd0a9-b85a-4a26-a8bb-b93a82369994',
            container: '#ra-do-subscribe-form'
          });
          formRendered = true;
        }
      }
    });

    // Close button
    popup.querySelector('.ra-do__subscribe-close').addEventListener('click', function () {
      popup.classList.remove('ra-do__subscribe-popup--open');
    });

    // Close on click outside
    document.addEventListener('click', function (e) {
      if (!popup.classList.contains('ra-do__subscribe-popup--open')) return;
      if (popup.contains(e.target) || btn.contains(e.target)) return;
      popup.classList.remove('ra-do__subscribe-popup--open');
    });
  }

  function getCsrf() {
    var c = document.cookie.split(';').find(function (s) { return s.trim().indexOf('csrftoken=') === 0; });
    return c ? c.trim().substring(10) : '';
  }

  function loadDashboardFooter() {
    var footerEl = document.getElementById('ra-do-footer');
    if (!footerEl) return;

    // Load footer CSS
    var cssLink = document.createElement('link');
    cssLink.rel = 'stylesheet';
    cssLink.href = '/custom-static/../customization/footer/dashboard-footer.css';

    // Try loading from the custom-static mount (footer files are served via nginx)
    fetch('/custom-static/footer/dashboard-footer.html')
      .then(function (r) {
        if (!r.ok) throw new Error('not found');
        return r.text();
      })
      .then(function (html) {
        // Replace template variables
        html = html.replace(/\{\{YEAR\}\}/g, new Date().getFullYear());
        html = html.replace(/\{\{BRAND\}\}/g, BRAND_NAME);
        footerEl.innerHTML = html;

        // Load CSS
        var css = document.createElement('link');
        css.rel = 'stylesheet';
        css.href = '/custom-static/footer/dashboard-footer.css';
        document.head.appendChild(css);
      })
      .catch(function () {
        // Fallback: inline footer if file not found
        footerEl.innerHTML =
          '<div style="background:#1a2a3a;border-top:2px solid #54a8dc;padding:12px 24px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;">' +
            '<div style="display:flex;align-items:center;gap:10px;">' +
              '<img src="/custom-static/images/ra-logo.png" alt="" style="height:24px;opacity:0.9;">' +
              '<span style="font-size:11px;color:rgba(255,255,255,0.5);">Powered by Resilience Academy</span>' +
            '</div>' +
            '<div style="font-size:11px;color:rgba(255,255,255,0.4);">&copy; ' + new Date().getFullYear() + ' ' + BRAND_NAME + '</div>' +
          '</div>';
      });
  }

  function openDashEditProfile() {
    fetchJSON('/me/').then(function (user) {
      if (!user) return;
      var extra = user.extra_details || {};
      var overlay = document.createElement('div');
      overlay.className = 'ra-do__popup-overlay';
      overlay.innerHTML =
        '<div class="ra-do__popup">' +
          '<div class="ra-do__popup-header"><h3>Edit Profile</h3><button class="ra-do__popup-close" title="Close">&times;</button></div>' +
          '<div class="ra-do__popup-body">' +
            '<div class="ra-do__popup-field"><label>Full Name</label><input type="text" id="ra-do-pf-name" value="' + esc(extra.name || '') + '" placeholder="Your full name"></div>' +
            '<div class="ra-do__popup-field"><label>Organization</label><input type="text" id="ra-do-pf-org" value="' + esc(extra.organization || '') + '" placeholder="Your organization"></div>' +
            '<div class="ra-do__popup-field"><label>Bio</label><textarea id="ra-do-pf-bio" placeholder="About you...">' + esc(extra.bio || '') + '</textarea></div>' +
            '<div class="ra-do__popup-field"><label>City</label><input type="text" id="ra-do-pf-city" value="' + esc(extra.city || '') + '"></div>' +
            '<div class="ra-do__popup-field"><label>Country</label><input type="text" id="ra-do-pf-country" value="' + esc(extra.country || '') + '"></div>' +
            '<div class="ra-do__popup-status" id="ra-do-pf-status"></div>' +
          '</div>' +
          '<div class="ra-do__popup-footer"><button class="ra-do__popup-btn" id="ra-do-pf-cancel">Cancel</button><button class="ra-do__popup-btn ra-do__popup-btn--primary" id="ra-do-pf-save">Save</button></div>' +
        '</div>';
      document.body.appendChild(overlay);
      overlay.querySelector('.ra-do__popup-close').addEventListener('click', function () { overlay.remove(); });
      overlay.querySelector('#ra-do-pf-cancel').addEventListener('click', function () { overlay.remove(); });
      overlay.addEventListener('click', function (e) { if (e.target === overlay) overlay.remove(); });
      overlay.querySelector('#ra-do-pf-save').addEventListener('click', function () {
        var statusEl = overlay.querySelector('#ra-do-pf-status');
        fetch('/me/', {
          method: 'PATCH', credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCsrf() },
          body: JSON.stringify({ extra_details: {
            name: overlay.querySelector('#ra-do-pf-name').value.trim(),
            organization: overlay.querySelector('#ra-do-pf-org').value.trim(),
            bio: overlay.querySelector('#ra-do-pf-bio').value.trim(),
            city: overlay.querySelector('#ra-do-pf-city').value.trim(),
            country: overlay.querySelector('#ra-do-pf-country').value.trim()
          }})
        }).then(function (r) {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          statusEl.className = 'ra-do__popup-status ra-do__popup-status--ok';
          statusEl.textContent = 'Profile updated!';
          setTimeout(function () { overlay.remove(); }, 1200);
        }).catch(function (err) {
          statusEl.className = 'ra-do__popup-status ra-do__popup-status--err';
          statusEl.textContent = 'Failed: ' + err.message;
        });
      });
    });
  }

  function openDashChangePassword() {
    var overlay = document.createElement('div');
    overlay.className = 'ra-do__popup-overlay';
    overlay.innerHTML =
      '<div class="ra-do__popup">' +
        '<div class="ra-do__popup-header"><h3>Change Password</h3><button class="ra-do__popup-close" title="Close">&times;</button></div>' +
        '<div class="ra-do__popup-body">' +
          '<div class="ra-do__popup-field"><label>Current Password</label><input type="password" id="ra-do-pw-old"></div>' +
          '<div class="ra-do__popup-field"><label>New Password</label><input type="password" id="ra-do-pw-new1"></div>' +
          '<div class="ra-do__popup-field"><label>Confirm New Password</label><input type="password" id="ra-do-pw-new2"></div>' +
          '<div class="ra-do__popup-status" id="ra-do-pw-status"></div>' +
        '</div>' +
        '<div class="ra-do__popup-footer"><button class="ra-do__popup-btn" id="ra-do-pw-cancel">Cancel</button><button class="ra-do__popup-btn ra-do__popup-btn--primary" id="ra-do-pw-save">Update Password</button></div>' +
      '</div>';
    document.body.appendChild(overlay);
    overlay.querySelector('.ra-do__popup-close').addEventListener('click', function () { overlay.remove(); });
    overlay.querySelector('#ra-do-pw-cancel').addEventListener('click', function () { overlay.remove(); });
    overlay.addEventListener('click', function (e) { if (e.target === overlay) overlay.remove(); });
    overlay.querySelector('#ra-do-pw-save').addEventListener('click', function () {
      var statusEl = overlay.querySelector('#ra-do-pw-status');
      var oldPw = overlay.querySelector('#ra-do-pw-old').value;
      var newPw1 = overlay.querySelector('#ra-do-pw-new1').value;
      var newPw2 = overlay.querySelector('#ra-do-pw-new2').value;
      if (!oldPw || !newPw1 || !newPw2) { statusEl.className = 'ra-do__popup-status ra-do__popup-status--err'; statusEl.textContent = 'All fields are required.'; return; }
      if (newPw1 !== newPw2) { statusEl.className = 'ra-do__popup-status ra-do__popup-status--err'; statusEl.textContent = 'Passwords do not match.'; return; }
      if (newPw1.length < 8) { statusEl.className = 'ra-do__popup-status ra-do__popup-status--err'; statusEl.textContent = 'Minimum 8 characters.'; return; }
      var fd = new FormData();
      fd.append('oldpassword', oldPw); fd.append('password1', newPw1); fd.append('password2', newPw2);
      fetch('/accounts/password/change/', { method: 'POST', credentials: 'same-origin', headers: { 'X-CSRFToken': getCsrf() }, body: fd })
      .then(function (r) {
        if (r.ok || r.status === 302) { statusEl.className = 'ra-do__popup-status ra-do__popup-status--ok'; statusEl.textContent = 'Password changed!'; setTimeout(function () { overlay.remove(); }, 1200); }
        else { return r.text().then(function (t) { if (t.indexOf('current password') !== -1) throw new Error('Current password is incorrect.'); throw new Error('Failed to change password.'); }); }
      }).catch(function (err) { statusEl.className = 'ra-do__popup-status ra-do__popup-status--err'; statusEl.textContent = err.message; });
    });
  }

  // ── Load Data & Render ──
  function loadAndRender() {
    return loadDashboardConfig().then(function () {
      return fetchJSON('/api/v2/assets/?asset_type=survey&fields=["uid","name","deployment_status","deployment__submission_count","date_modified","content"]&limit=200');
    }).then(function (data) {
      formsCache = (data.results || []).filter(function (f) { return f.deployment_status === 'deployed'; });

      var dashboard = getActiveDashboard();
      var widgets = (dashboard && dashboard.widgets && dashboard.widgets.length) ? dashboard.widgets : getDefaultWidgets();

      // Determine which forms we need submissions for
      var neededUids = {};
      widgets.forEach(function (w) {
        var uids = w.forms || [];
        if (!uids.length || uids[0] === '__all__') {
          formsCache.forEach(function (f) { neededUids[f.uid] = true; });
        } else {
          uids.forEach(function (u) { neededUids[u] = true; });
        }
      });

      var uidsToFetch = Object.keys(neededUids);
      var promises = uidsToFetch.map(function (uid) {
        return fetchJSON('/api/v2/assets/' + uid + '/data/?limit=100&sort={"_submission_time":-1}')
          .then(function (d) { subsCache[uid] = d.results || []; })
          .catch(function () { subsCache[uid] = []; });
      });

      return Promise.all(promises).then(function () {
        return widgets;
      });
    }).then(function (widgets) {
      renderWidgets(widgets);
      var ref = document.getElementById('ra-do-refresh');
      if (ref) ref.textContent = 'Auto-refreshes every 30s \u00b7 Last updated: ' + new Date().toLocaleTimeString();
      // Show footer after content has loaded
      var footerEl = document.getElementById('ra-do-footer');
      if (footerEl) footerEl.style.display = '';
    });
  }

  function getDefaultWidgets() {
    return [
      { id: 'd1', type: 'stat-cards', title: 'Overview', width: 'full', forms: ['__all__'] },
      { id: 'd2', type: 'submissions-period', title: 'Submissions', width: 'full', forms: ['__all__'] },
      { id: 'd3', type: 'form-status', title: 'Form Status', width: 'half', forms: ['__all__'] },
      { id: 'd4', type: 'top-contributors', title: 'Top Contributors', width: 'half', forms: ['__all__'], config: { limit: 10 } },
      { id: 'd5', type: 'submissions-by-form', title: 'Submissions by Form', width: 'half', forms: ['__all__'] },
      { id: 'd6', type: 'submissions-by-day', title: 'Submissions by Day', width: 'half', forms: ['__all__'] },
      { id: 'd7', type: 'recent-feed', title: 'Recent Submissions', width: 'half', forms: ['__all__'], config: { limit: 10 } },
      { id: 'd8', type: 'geo-coverage', title: 'Geographic Coverage', width: 'half', forms: ['__all__'] }
    ];
  }

  // ── Render Widgets ──
  function renderWidgets(widgets) {
    var grid = document.getElementById('ra-do-grid');
    if (!grid) return;

    var WIDGET_LABELS = {
      'stat-cards': 'Overview', 'chart': 'Submissions Chart', 'form-table': 'Form Table',
      'recent-feed': 'Recent Submissions', 'pie-chart': 'Pie Chart', 'single-stat': 'Single Stat',
      'field-number': 'Field Number', 'field-text-list': 'Field Text List',
      'field-select-bar': 'Select Bar Chart', 'field-counter': 'Field Counter',
      'field-latest': 'Latest Value', 'field-timeline': 'Field Timeline',
      'submissions-by-form': 'Submissions by Form', 'top-contributors': 'Top Contributors',
      'submissions-by-day': 'Submissions by Day', 'avg-per-day': 'Average Per Day',
      'submissions-period': 'Submissions by Period', 'geo-coverage': 'Geographic Coverage',
      'form-status': 'Form Status', 'info-text': 'Info Text',
      'subscribe': 'Subscribe', 'embed': 'Embed'
    };

    grid.innerHTML = widgets.map(function (w) {
      var cls = w.width === 'full' ? ' ra-do__widget--full' : '';
      var displayTitle = w.title || WIDGET_LABELS[w.type] || w.type;
      var cfg = w.config || {};
      var wStyle = cfg.bgColor ? 'background-color:' + cfg.bgColor + ';' : '';
      var bodyStyle = cfg.textColor ? 'color:' + cfg.textColor + ';' : '';
      var headerStyle = cfg.headerColor ? 'color:' + cfg.headerColor + ';' : '';
      return '<div class="ra-do__widget' + cls + '" data-wid="' + esc(w.id) + '"' + (wStyle ? ' style="' + wStyle + '"' : '') + '>' +
        '<div class="ra-do__widget-header"' + (headerStyle ? ' style="' + headerStyle + '"' : '') + '>' + esc(displayTitle) + '</div>' +
        '<div class="ra-do__widget-body" id="ra-do-wb-' + esc(w.id) + '"' + (bodyStyle ? ' style="' + bodyStyle + '"' : '') + '></div>' +
      '</div>';
    }).join('');

    widgets.forEach(function (w) {
      var el = document.getElementById('ra-do-wb-' + w.id);
      if (!el) return;
      var subs = getSubsForWidget(w);

      switch (w.type) {
        case 'stat-cards': renderStatCards(el, w, subs); break;
        case 'chart': renderChart(el, w, subs); break;
        case 'form-table': renderFormTable(el, w); break;
        case 'recent-feed': renderRecentFeed(el, w, subs); break;
        case 'pie-chart': renderPieChart(el, w, subs); break;
        case 'single-stat': renderSingleStat(el, w, subs); break;
        case 'field-number': renderFieldNumber(el, w, subs); break;
        case 'field-text-list': renderFieldTextList(el, w, subs); break;
        case 'field-select-bar': renderFieldSelectBar(el, w, subs); break;
        case 'field-counter': renderFieldCounter(el, w, subs); break;
        case 'field-latest': renderFieldLatest(el, w, subs); break;
        case 'field-timeline': renderFieldTimeline(el, w, subs); break;
        case 'submissions-by-form': renderSubmissionsByForm(el, w); break;
        case 'top-contributors': renderTopContributors(el, w, subs); break;
        case 'submissions-by-day': renderSubmissionsByDay(el, w, subs); break;
        case 'avg-per-day': renderAvgPerDay(el, w, subs); break;
        case 'submissions-period': renderSubmissionsPeriod(el, w, subs); break;
        case 'geo-coverage': renderGeoCoverage(el, w, subs); break;
        case 'form-status': renderFormStatus(el, w); break;
        case 'info-text': renderInfoText(el, w); break;
        case 'subscribe': renderSubscribeWidget(el, w); break;
        case 'embed': renderEmbedWidget(el, w); break;
        default: el.innerHTML = '<p style="color:#999;">Unknown widget type: ' + esc(w.type) + '</p>';
      }
    });
  }

  function getSubsForWidget(w) {
    var uids = w.forms || [];
    var all = [];
    if (!uids.length || uids[0] === '__all__') {
      Object.keys(subsCache).forEach(function (uid) {
        subsCache[uid].forEach(function (s) {
          s._form_uid = uid;
          s._form_name = getFormName(uid);
          all.push(s);
        });
      });
    } else {
      uids.forEach(function (uid) {
        (subsCache[uid] || []).forEach(function (s) {
          s._form_uid = uid;
          s._form_name = getFormName(uid);
          all.push(s);
        });
      });
    }
    all.sort(function (a, b) { return new Date(b._submission_time) - new Date(a._submission_time); });
    return all;
  }

  function getFormName(uid) {
    for (var i = 0; i < formsCache.length; i++) {
      if (formsCache[i].uid === uid) return formsCache[i].name;
    }
    return uid;
  }

  // ── Widget: Stat Cards ──
  function renderStatCards(el, w, subs) {
    var cfg = w.config || {};
    var days = cfg.days || 7;
    var totalForms = formsCache.length;
    var totalSubs = 0;
    formsCache.forEach(function (f) { totalSubs += (f.deployment__submission_count || 0); });

    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var todayCount = subs.filter(function (s) { return new Date(s._submission_time) >= today; }).length;

    var cutoff = new Date(Date.now() - days * 86400000);
    var contributors = {};
    subs.forEach(function (s) {
      if (new Date(s._submission_time) >= cutoff) contributors[getSubmitter(s)] = true;
    });

    el.innerHTML = '<div class="ra-do__stats">' +
      stat(totalForms, 'Active Forms') +
      stat(totalSubs, 'Total Submissions') +
      stat(todayCount, 'Today') +
      stat(Object.keys(contributors).length, 'Contributors (' + days + 'd)') +
    '</div>';
  }

  function stat(val, label) {
    return '<div class="ra-do__stat"><div class="ra-do__stat-value">' + val + '</div><div class="ra-do__stat-label">' + label + '</div></div>';
  }

  // ── Widget: Bar Chart ──
  function renderChart(el, w, subs) {
    var cfg = w.config || {};
    var days = cfg.days || 30;
    var buckets = {};
    var labels = [];
    for (var i = days - 1; i >= 0; i--) {
      var d = new Date(Date.now() - i * 86400000);
      var key = d.toISOString().split('T')[0];
      buckets[key] = 0;
      labels.push(key);
    }
    subs.forEach(function (s) {
      if (!s._submission_time) return;
      var key = s._submission_time.split('T')[0];
      if (buckets[key] !== undefined) buckets[key]++;
    });

    var values = labels.map(function (l) { return buckets[l]; });
    var maxVal = Math.max.apply(null, values) || 1;
    var svgW = 760, svgH = 180, padL = 35, padR = 10, padT = 20, padB = 25;
    var chartW = svgW - padL - padR, chartH = svgH - padT - padB;
    var barW = chartW / days, gap = 1;

    var bars = '', lbls = '';
    for (var j = 0; j < days; j++) {
      var barH = (values[j] / maxVal) * chartH;
      var x = padL + j * barW, y = padT + chartH - barH;
      bars += '<rect class="ra-do__bar" x="' + (x + gap) + '" y="' + y + '" width="' + (barW - gap * 2) + '" height="' + barH + '" rx="2"><title>' + labels[j] + ': ' + values[j] + '</title></rect>';
      if (values[j] > 0) bars += '<text class="ra-do__chart-val" x="' + (x + barW / 2) + '" y="' + (y - 3) + '">' + values[j] + '</text>';
      if (j % 5 === 0 || j === days - 1) lbls += '<text class="ra-do__chart-label" x="' + (x + barW / 2) + '" y="' + (svgH - 4) + '" text-anchor="middle">' + labels[j].substring(5) + '</text>';
    }
    var yLines = '';
    for (var k = 0; k <= 3; k++) {
      var yP = padT + chartH - (chartH * k / 3);
      yLines += '<text class="ra-do__chart-label" x="' + (padL - 4) + '" y="' + (yP + 3) + '" text-anchor="end">' + Math.round(maxVal * k / 3) + '</text>';
      yLines += '<line x1="' + padL + '" y1="' + yP + '" x2="' + (svgW - padR) + '" y2="' + yP + '" stroke="#f1f5f9" stroke-width="1"/>';
    }
    el.innerHTML = '<svg viewBox="0 0 ' + svgW + ' ' + svgH + '" style="width:100%;height:auto;" preserveAspectRatio="xMidYMid meet">' + yLines + bars + lbls + '</svg>';
  }

  // ── Widget: Form Table ──
  function renderFormTable(el, w) {
    var cfg = w.config || {};
    var sortBy = cfg.sortBy || 'count';
    var limit = cfg.limit || 50;
    var forms = formsCache.slice();
    if (sortBy === 'name') forms.sort(function (a, b) { return a.name.localeCompare(b.name); });
    else if (sortBy === 'name-desc') forms.sort(function (a, b) { return b.name.localeCompare(a.name); });
    else if (sortBy === 'count-asc') forms.sort(function (a, b) { return (a.deployment__submission_count || 0) - (b.deployment__submission_count || 0); });
    else forms.sort(function (a, b) { return (b.deployment__submission_count || 0) - (a.deployment__submission_count || 0); });
    forms = forms.slice(0, limit);
    if (!forms.length) { el.innerHTML = '<p style="color:#94a3b8;">No forms</p>'; return; }
    var rows = forms.map(function (f) {
      return '<tr><td style="font-weight:600;">' + esc(f.name) + '</td><td style="text-align:right;font-weight:600;">' + (f.deployment__submission_count || 0) + '</td></tr>';
    }).join('');
    el.innerHTML = '<table class="ra-do__table"><thead><tr><th>Form</th><th style="text-align:right;">Submissions</th></tr></thead><tbody>' + rows + '</tbody></table>';
  }

  // ── Widget: Recent Feed ──
  function renderRecentFeed(el, w, subs) {
    var cfg = w.config || {};
    var limit = cfg.limit || 15;
    var nameField = cfg.nameField || '';
    var items = subs.slice(0, limit);
    if (!items.length) { el.innerHTML = '<p style="color:#94a3b8;">No recent submissions</p>'; return; }
    el.innerHTML = items.map(function (s) {
      var user = getSubmitter(s, nameField);
      return '<div class="ra-do__feed-item">' +
        '<div class="ra-do__feed-avatar">' + user.charAt(0).toUpperCase() + '</div>' +
        '<div class="ra-do__feed-info"><span class="ra-do__feed-user">' + esc(user) + '</span> <span class="ra-do__feed-form">' + esc(s._form_name || '') + '</span></div>' +
        '<span class="ra-do__feed-time">' + timeAgo(s._submission_time) + '</span>' +
      '</div>';
    }).join('');
  }

  // ── Widget: Pie Chart ──
  function renderPieChart(el, w, subs) {
    var cfg = w.config || {};
    var field = cfg.field || '_submitted_by';
    var counts = {};
    subs.forEach(function (s) {
      var val = s[field];
      if (val === undefined) {
        Object.keys(s).forEach(function (k) { if (k.indexOf('/' + field) === k.length - field.length - 1) val = s[k]; });
      }
      var key = String(val || 'Unknown');
      counts[key] = (counts[key] || 0) + 1;
    });

    var entries = Object.keys(counts).map(function (k) { return { label: k, count: counts[k] }; });
    entries.sort(function (a, b) { return b.count - a.count; });
    if (entries.length > 8) {
      var other = 0;
      entries.slice(8).forEach(function (e) { other += e.count; });
      entries = entries.slice(0, 8);
      entries.push({ label: 'Other', count: other });
    }

    var total = 0;
    entries.forEach(function (e) { total += e.count; });
    if (!total) { el.innerHTML = '<p style="color:#94a3b8;">No data</p>'; return; }

    var size = 160, cx = size / 2, cy = size / 2, r = 60, strokeW = 24;
    var paths = '', angle = 0;
    entries.forEach(function (e, i) {
      var slice = (e.count / total) * Math.PI * 2;
      var x1 = cx + r * Math.cos(angle), y1 = cy + r * Math.sin(angle);
      var x2 = cx + r * Math.cos(angle + slice), y2 = cy + r * Math.sin(angle + slice);
      var large = slice > Math.PI ? 1 : 0;
      paths += '<path d="M ' + x1 + ' ' + y1 + ' A ' + r + ' ' + r + ' 0 ' + large + ' 1 ' + x2 + ' ' + y2 + '" fill="none" stroke="' + PIE_COLORS[i % PIE_COLORS.length] + '" stroke-width="' + strokeW + '"><title>' + esc(e.label) + ': ' + e.count + '</title></path>';
      angle += slice;
    });

    var legend = entries.map(function (e, i) {
      var pct = Math.round(e.count / total * 100);
      return '<div class="ra-do__pie-item"><div class="ra-do__pie-dot" style="background:' + PIE_COLORS[i % PIE_COLORS.length] + ';"></div>' + esc(e.label) + ' (' + pct + '%)</div>';
    }).join('');

    el.innerHTML = '<div style="display:flex;align-items:center;gap:24px;flex-wrap:wrap;">' +
      '<svg width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '">' + paths +
      '<text x="' + cx + '" y="' + (cy + 5) + '" text-anchor="middle" font-size="20" font-weight="700" fill="#1e293b">' + total + '</text></svg>' +
      '<div class="ra-do__pie-legend">' + legend + '</div></div>';
  }

  // ── Widget: Single Stat ──
  function renderSingleStat(el, w, subs) {
    var cfg = w.config || {};
    var metric = cfg.metric || 'count';
    var value = 0;

    if (metric === 'count') {
      value = subs.length;
    } else if (metric === 'today') {
      var today = new Date();
      today.setHours(0, 0, 0, 0);
      value = subs.filter(function (s) { return new Date(s._submission_time) >= today; }).length;
    } else if (metric === 'contributors') {
      var c = {};
      subs.forEach(function (s) { c[getSubmitter(s)] = true; });
      value = Object.keys(c).length;
    }

    var display = (cfg.prefix || '') + value + (cfg.suffix || '');
    el.innerHTML = '<div style="text-align:center;padding:20px;">' +
      '<div style="font-size:48px;font-weight:700;color:#1e293b;">' + esc(display) + '</div>' +
      '<div style="font-size:13px;color:#64748b;margin-top:4px;">' + esc(cfg.label || metric) + '</div>' +
    '</div>';
  }

  // ── Field Value Helper ──
  function getFieldValue(sub, field) {
    if (!field) return undefined;
    // Direct match
    if (sub[field] !== undefined) return sub[field];
    // Try nested path (group/field)
    var keys = Object.keys(sub);
    for (var i = 0; i < keys.length; i++) {
      if (keys[i].indexOf('/' + field) === keys[i].length - field.length - 1) return sub[keys[i]];
    }
    return undefined;
  }

  function getNumericValues(subs, field) {
    var vals = [];
    subs.forEach(function (s) {
      var v = getFieldValue(s, field);
      var n = parseFloat(v);
      if (!isNaN(n)) vals.push(n);
    });
    return vals;
  }

  // ── Widget: Field Number (sum/avg/min/max of a numeric field) ──
  function renderFieldNumber(el, w, subs) {
    var cfg = w.config || {};
    var field = cfg.field || '';
    var op = cfg.operation || 'sum';
    var vals = getNumericValues(subs, field);

    var value = 0;
    if (vals.length) {
      if (op === 'sum') {
        vals.forEach(function (v) { value += v; });
      } else if (op === 'average') {
        var total = 0;
        vals.forEach(function (v) { total += v; });
        value = Math.round(total / vals.length * 100) / 100;
      } else if (op === 'min') {
        value = Math.min.apply(null, vals);
      } else if (op === 'max') {
        value = Math.max.apply(null, vals);
      } else if (op === 'count') {
        value = vals.length;
      }
    }

    var displayVal = (typeof value === 'number' && value % 1 !== 0) ? value.toLocaleString(undefined, {maximumFractionDigits: 2}) : value.toLocaleString();

    var displayStr = (cfg.prefix || '') + displayVal + (cfg.suffix || '');
    el.innerHTML = '<div style="text-align:center;padding:20px;">' +
      '<div style="font-size:42px;font-weight:700;color:#1e293b;">' + esc(displayStr) + '</div>' +
      '<div style="font-size:13px;color:#64748b;margin-top:6px;">' + esc(cfg.label || (op + ' of ' + field)) + '</div>' +
      '<div style="font-size:11px;color:#94a3b8;margin-top:2px;">' + vals.length + ' values from ' + subs.length + ' submissions</div>' +
    '</div>';
  }

  // ── Widget: Field Text List (unique values with counts) ──
  function renderFieldTextList(el, w, subs) {
    var cfg = w.config || {};
    var field = cfg.field || '';
    var limit = cfg.limit || 20;
    var counts = {};

    subs.forEach(function (s) {
      var v = getFieldValue(s, field);
      if (v !== undefined && v !== null && v !== '') {
        var key = String(v);
        counts[key] = (counts[key] || 0) + 1;
      }
    });

    var sortBy = cfg.sortBy || 'count';
    var entries = Object.keys(counts).map(function (k) { return { label: k, count: counts[k] }; });
    if (sortBy === 'name') entries.sort(function (a, b) { return a.label.localeCompare(b.label); });
    else if (sortBy === 'name-desc') entries.sort(function (a, b) { return b.label.localeCompare(a.label); });
    else if (sortBy === 'count-asc') entries.sort(function (a, b) { return a.count - b.count; });
    else entries.sort(function (a, b) { return b.count - a.count; });
    entries = entries.slice(0, limit);

    if (!entries.length) { el.innerHTML = '<p style="color:#94a3b8;text-align:center;">No data for field "' + esc(field) + '"</p>'; return; }

    var maxCount = entries[0].count;
    el.innerHTML = entries.map(function (e) {
      var pct = Math.round(e.count / maxCount * 100);
      return '<div style="display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid #f8fafc;">' +
        '<div style="flex:1;min-width:0;">' +
          '<div style="font-size:13px;color:#1e293b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + esc(e.label) + '</div>' +
          '<div style="height:4px;background:#e2e8f0;border-radius:2px;margin-top:4px;"><div style="height:100%;background:#54a8dc;border-radius:2px;width:' + pct + '%;"></div></div>' +
        '</div>' +
        '<span style="font-size:13px;font-weight:600;color:#475569;flex-shrink:0;">' + e.count + '</span>' +
      '</div>';
    }).join('');
  }

  // ── Widget: Field Select Bar Chart (distribution of choices) ──
  function renderFieldSelectBar(el, w, subs) {
    var cfg = w.config || {};
    var field = cfg.field || '';
    var counts = {};

    subs.forEach(function (s) {
      var v = getFieldValue(s, field);
      if (v !== undefined && v !== null && v !== '') {
        // Handle select_multiple (space-separated)
        var vals = String(v).split(' ');
        vals.forEach(function (val) {
          val = val.trim();
          if (val) counts[val] = (counts[val] || 0) + 1;
        });
      }
    });

    var entries = Object.keys(counts).map(function (k) { return { label: k, count: counts[k] }; });
    entries.sort(function (a, b) { return b.count - a.count; });
    var maxItems = cfg.limit || 12;
    if (entries.length > maxItems) entries = entries.slice(0, maxItems);

    if (!entries.length) { el.innerHTML = '<p style="color:#94a3b8;text-align:center;">No data</p>'; return; }

    var maxVal = entries[0].count;
    var svgW = 760, barH = 28, gap = 4, padL = 120, padR = 50;
    var svgH = entries.length * (barH + gap) + 10;
    var chartW = svgW - padL - padR;

    var bars = entries.map(function (e, i) {
      var y = i * (barH + gap) + 5;
      var w2 = (e.count / maxVal) * chartW;
      var label = e.label.length > 18 ? e.label.substring(0, 18) + '..' : e.label;
      return '<text x="' + (padL - 8) + '" y="' + (y + barH / 2 + 4) + '" text-anchor="end" font-size="11" fill="#475569">' + esc(label) + '</text>' +
        '<rect x="' + padL + '" y="' + y + '" width="' + w2 + '" height="' + barH + '" rx="4" fill="' + PIE_COLORS[i % PIE_COLORS.length] + '" opacity="0.85"/>' +
        '<text x="' + (padL + w2 + 6) + '" y="' + (y + barH / 2 + 4) + '" font-size="12" font-weight="600" fill="#475569">' + e.count + '</text>';
    }).join('');

    el.innerHTML = '<svg viewBox="0 0 ' + svgW + ' ' + svgH + '" style="width:100%;height:auto;" preserveAspectRatio="xMidYMid meet">' + bars + '</svg>';
  }

  // ── Widget: Field Counter (count submissions where field matches a value) ──
  function renderFieldCounter(el, w, subs) {
    var cfg = w.config || {};
    var field = cfg.field || '';
    var matchValue = cfg.matchValue || '';
    var matchOp = cfg.matchOp || 'equals';
    var count = 0;

    subs.forEach(function (s) {
      var v = getFieldValue(s, field);
      if (v === undefined || v === null) return;
      var sv = String(v).toLowerCase();
      var mv = matchValue.toLowerCase();

      if (matchOp === 'equals' && sv === mv) count++;
      else if (matchOp === 'contains' && sv.indexOf(mv) !== -1) count++;
      else if (matchOp === 'not_empty' && sv !== '') count++;
      else if (matchOp === 'greater_than' && parseFloat(v) > parseFloat(matchValue)) count++;
      else if (matchOp === 'less_than' && parseFloat(v) < parseFloat(matchValue)) count++;
    });

    var pct = subs.length ? Math.round(count / subs.length * 100) : 0;

    el.innerHTML = '<div style="text-align:center;padding:20px;">' +
      '<div style="font-size:42px;font-weight:700;color:#1e293b;">' + count + '</div>' +
      '<div style="font-size:13px;color:#64748b;margin-top:4px;">' + esc(cfg.label || ('where ' + field + ' ' + matchOp + ' ' + matchValue)) + '</div>' +
      '<div style="font-size:11px;color:#94a3b8;margin-top:4px;">' + pct + '% of ' + subs.length + ' submissions</div>' +
      '<div style="height:6px;background:#e2e8f0;border-radius:3px;margin-top:8px;max-width:200px;display:inline-block;width:100%;">' +
        '<div style="height:100%;background:#54a8dc;border-radius:3px;width:' + pct + '%;"></div>' +
      '</div>' +
    '</div>';
  }

  // ── Widget: Field Latest (most recent value of a field) ──
  function renderFieldLatest(el, w, subs) {
    var cfg = w.config || {};
    var field = cfg.field || '';

    // subs are already sorted by time descending
    var latestVal = '';
    var latestTime = '';
    var latestBy = '';
    for (var i = 0; i < subs.length; i++) {
      var v = getFieldValue(subs[i], field);
      if (v !== undefined && v !== null && v !== '') {
        latestVal = String(v);
        latestTime = subs[i]._submission_time || '';
        latestBy = getSubmitter(subs[i]);
        break;
      }
    }

    if (!latestVal) { el.innerHTML = '<p style="color:#94a3b8;text-align:center;">No data for "' + esc(field) + '"</p>'; return; }

    el.innerHTML = '<div style="text-align:center;padding:20px;">' +
      '<div style="font-size:28px;font-weight:700;color:#1e293b;word-break:break-word;">' + esc(latestVal) + '</div>' +
      '<div style="font-size:12px;color:#64748b;margin-top:8px;">' + esc(cfg.label || 'Latest: ' + field) + '</div>' +
      '<div style="font-size:11px;color:#94a3b8;margin-top:4px;">by ' + esc(latestBy) + ' &middot; ' + timeAgo(latestTime) + '</div>' +
    '</div>';
  }

  // ── Widget: Field Timeline (numeric field values over time) ──
  function renderFieldTimeline(el, w, subs) {
    var cfg = w.config || {};
    var field = cfg.field || '';
    var days = cfg.days || 30;

    // Group by day, calculate average per day
    var buckets = {};
    var labels = [];
    for (var i = days - 1; i >= 0; i--) {
      var d = new Date(Date.now() - i * 86400000);
      var key = d.toISOString().split('T')[0];
      buckets[key] = { sum: 0, count: 0, min: Infinity, max: -Infinity };
      labels.push(key);
    }

    subs.forEach(function (s) {
      if (!s._submission_time) return;
      var key = s._submission_time.split('T')[0];
      var v = parseFloat(getFieldValue(s, field));
      if (buckets[key] && !isNaN(v)) {
        buckets[key].sum += v;
        buckets[key].count++;
        if (v < buckets[key].min) buckets[key].min = v;
        if (v > buckets[key].max) buckets[key].max = v;
      }
    });

    var agg = cfg.aggregation || 'average';
    var values = labels.map(function (l) {
      var b = buckets[l];
      if (!b.count) return null;
      if (agg === 'sum') return Math.round(b.sum * 100) / 100;
      if (agg === 'min') return b.min;
      if (agg === 'max') return b.max;
      return Math.round(b.sum / b.count * 100) / 100;
    });

    // Find min/max for scaling
    var nonNull = values.filter(function (v) { return v !== null; });
    if (!nonNull.length) { el.innerHTML = '<p style="color:#94a3b8;text-align:center;">No numeric data for "' + esc(field) + '"</p>'; return; }
    var minVal = Math.min.apply(null, nonNull);
    var maxVal = Math.max.apply(null, nonNull);
    if (maxVal === minVal) maxVal = minVal + 1;

    // SVG line chart
    var svgW = 760, svgH = 180, padL = 45, padR = 10, padT = 15, padB = 25;
    var chartW = svgW - padL - padR, chartH = svgH - padT - padB;
    var stepX = chartW / (days - 1);

    var points = [];
    var dots = '';
    for (var j = 0; j < days; j++) {
      if (values[j] === null) continue;
      var x = padL + j * stepX;
      var y = padT + chartH - ((values[j] - minVal) / (maxVal - minVal)) * chartH;
      points.push(x + ',' + y);
      dots += '<circle cx="' + x + '" cy="' + y + '" r="3" fill="#54a8dc"><title>' + labels[j] + ': ' + values[j] + '</title></circle>';
    }

    var line = points.length > 1 ? '<polyline points="' + points.join(' ') + '" fill="none" stroke="#54a8dc" stroke-width="2" stroke-linejoin="round"/>' : '';

    // Y-axis labels
    var yLabels = '';
    for (var k = 0; k <= 3; k++) {
      var yV = minVal + (maxVal - minVal) * k / 3;
      var yP = padT + chartH - (chartH * k / 3);
      yLabels += '<text class="ra-do__chart-label" x="' + (padL - 4) + '" y="' + (yP + 3) + '" text-anchor="end">' + (Math.round(yV * 10) / 10) + '</text>';
      yLabels += '<line x1="' + padL + '" y1="' + yP + '" x2="' + (svgW - padR) + '" y2="' + yP + '" stroke="#f1f5f9" stroke-width="1"/>';
    }

    // X-axis labels
    var xLabels = '';
    for (var m = 0; m < days; m++) {
      if (m % 5 === 0 || m === days - 1) {
        var xPos = padL + m * stepX;
        xLabels += '<text class="ra-do__chart-label" x="' + xPos + '" y="' + (svgH - 4) + '" text-anchor="middle">' + labels[m].substring(5) + '</text>';
      }
    }

    el.innerHTML = '<svg viewBox="0 0 ' + svgW + ' ' + svgH + '" style="width:100%;height:auto;" preserveAspectRatio="xMidYMid meet">' +
      yLabels + xLabels + line + dots + '</svg>';
  }

  // ── Widget: Info / Contact Card ──
  function renderInfoText(el, w) {
    var cfg = w.config || {};
    var html = cfg.html || '<p>No content configured. Edit this widget to add contact information.</p>';
    var textColor = cfg.textColor || '#334155';
    var bgColor = cfg.bgColor || '';
    var style = 'line-height:1.7;font-size:14px;color:' + textColor + ';';
    if (bgColor) style += 'background:' + bgColor + ';padding:16px;border-radius:6px;';
    el.innerHTML = '<div style="' + style + '">' + html + '</div>';
    // Apply text color to all child elements that don't have inline color
    if (cfg.textColor) {
      el.querySelectorAll('p,div,span,li,td,th,h1,h2,h3,h4,h5,h6,b,strong,i,em,u,small').forEach(function (node) {
        if (!node.style.color) node.style.color = cfg.textColor;
      });
    }
    // Make links open in new tab
    var linkColor = cfg.textColor ? cfg.textColor : '#54a8dc';
    el.querySelectorAll('a').forEach(function (a) {
      a.target = '_blank';
      a.rel = 'noopener';
      if (!a.style.color) a.style.color = linkColor;
    });
  }

  // ── Widget: Subscribe Form ──
  function renderSubscribeWidget(el, w) {
    var cfg = w.config || {};
    var formId = cfg.formId || '577cd0a9-b85a-4a26-a8bb-b93a82369994';
    var description = cfg.description || 'Subscribe to receive updates on data collection activities and urban resilience research.';
    var containerId = 'ra-do-subscribe-widget-' + w.id;

    el.innerHTML =
      '<div style="text-align:center;padding:8px 0 12px;">' +
        '<div style="font-size:13px;color:#64748b;margin-bottom:12px;">' + esc(description) + '</div>' +
        '<div id="' + containerId + '"></div>' +
      '</div>';

    // Render form when SDK is ready
    function tryRender() {
      if (window.SureContactForms) {
        window.SureContactForms.render({ formId: formId, container: '#' + containerId });
      } else {
        setTimeout(tryRender, 500);
      }
    }
    // Load SDK if not already loaded
    if (!document.querySelector('script[src*="surecontact"]')) {
      var s = document.createElement('script');
      s.src = 'https://app.surecontact.com/embed/forms.js';
      s.onload = tryRender;
      document.head.appendChild(s);
    } else {
      tryRender();
    }
  }

  // ── Widget: Embed (generic iframe) ──
  function renderEmbedWidget(el, w) {
    var cfg = w.config || {};
    var url = cfg.url || '';
    var height = cfg.height || 400;

    if (!url) {
      el.innerHTML = '<p style="color:#999;text-align:center;padding:24px;">No URL configured. Edit this widget and set <code>config.url</code>.</p>';
      return;
    }

    el.innerHTML = '<iframe src="' + esc(url) + '" width="100%" height="' + height + '" frameborder="0" style="border:none;border-radius:6px;" loading="lazy"></iframe>';
  }

  // ── Widget: Submissions by Form (KoboToolbox) ──
  function renderSubmissionsByForm(el, w) {
    var cfg = w.config || {};
    var sortBy = cfg.sortBy || 'count';
    var limit = cfg.limit || 50;
    var html = '';
    var forms = formsCache.slice();
    if (sortBy === 'name') forms.sort(function (a, b) { return a.name.localeCompare(b.name); });
    else if (sortBy === 'name-desc') forms.sort(function (a, b) { return b.name.localeCompare(a.name); });
    else if (sortBy === 'count-asc') forms.sort(function (a, b) { return (a.deployment__submission_count || 0) - (b.deployment__submission_count || 0); });
    else forms.sort(function (a, b) { return (b.deployment__submission_count || 0) - (a.deployment__submission_count || 0); });
    forms = forms.slice(0, limit);
    var maxCount = 0;
    forms.forEach(function (f) { if ((f.deployment__submission_count || 0) > maxCount) maxCount = f.deployment__submission_count; });
    if (!maxCount) maxCount = 1;

    forms.forEach(function (f) {
      var count = f.deployment__submission_count || 0;
      var pct = Math.round((count / maxCount) * 100);
      var status = f.deployment_status === 'deployed' ? '#54a8dc' : '#94a3b8';
      html += '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">' +
        '<span style="width:180px;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="' + esc(f.name) + '">' + esc(f.name) + '</span>' +
        '<div style="flex:1;height:20px;background:#f1f5f9;border-radius:4px;overflow:hidden;">' +
        '<div style="width:' + pct + '%;height:100%;background:' + status + ';border-radius:4px;transition:width 0.3s;"></div>' +
        '</div>' +
        '<span style="width:40px;text-align:right;font-weight:700;color:#29292a;font-size:14px;">' + count + '</span>' +
        '</div>';
    });
    el.innerHTML = html || '<p style="color:#94a3b8;text-align:center;">No forms</p>';
  }

  // ── Widget: Top Contributors (KoboToolbox) ──
  function renderTopContributors(el, w, subs) {
    var cfg = w.config || {};
    var limit = cfg.limit || 10;
    var nameField = cfg.nameField || '';
    var users = {};
    subs.forEach(function (s) {
      var u = getSubmitter(s, nameField);
      users[u] = (users[u] || 0) + 1;
    });
    var sorted = Object.keys(users).map(function (u) { return { name: u, count: users[u] }; })
      .sort(function (a, b) { return b.count - a.count; }).slice(0, limit);

    if (!sorted.length) { el.innerHTML = '<p style="color:#94a3b8;text-align:center;">No submissions</p>'; return; }
    var maxC = sorted[0].count;
    var medals = ['&#129351;', '&#129352;', '&#129353;'];

    el.innerHTML = sorted.map(function (u, i) {
      var pct = Math.round((u.count / maxC) * 100);
      var badge = i < 3 ? '<span style="font-size:16px;">' + medals[i] + '</span> ' : '<span style="color:#94a3b8;font-size:12px;width:22px;display:inline-block;text-align:center;">' + (i + 1) + '</span> ';
      return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">' +
        badge +
        '<span style="width:120px;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + esc(u.name) + '</span>' +
        '<div style="flex:1;height:14px;background:#f1f5f9;border-radius:3px;overflow:hidden;">' +
        '<div style="width:' + pct + '%;height:100%;background:#54a8dc;border-radius:3px;"></div></div>' +
        '<span style="font-weight:700;font-size:13px;color:#29292a;min-width:30px;text-align:right;">' + u.count + '</span>' +
        '</div>';
    }).join('');
  }

  // ── Widget: Submissions by Day of Week (KoboToolbox) ──
  function renderSubmissionsByDay(el, w, subs) {
    var cfg = w.config || {};
    var filterDays = cfg.days || 0; // 0 = all time
    var cutoff = filterDays ? new Date(Date.now() - filterDays * 86400000) : null;
    var dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    var counts = [0, 0, 0, 0, 0, 0, 0];
    subs.forEach(function (s) {
      if (!s._submission_time) return;
      var dt = new Date(s._submission_time);
      if (cutoff && dt < cutoff) return;
      counts[dt.getDay()]++;
    });
    var maxC = Math.max.apply(null, counts) || 1;

    el.innerHTML = '<div style="display:flex;align-items:flex-end;gap:8px;height:120px;padding-top:10px;">' +
      dayNames.map(function (day, i) {
        var pct = Math.round((counts[i] / maxC) * 100);
        var isHighest = counts[i] === maxC && counts[i] > 0;
        var color = isHighest ? '#54a8dc' : '#cbd5e1';
        return '<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;">' +
          '<span style="font-size:11px;font-weight:700;color:#29292a;">' + counts[i] + '</span>' +
          '<div style="width:100%;background:' + color + ';height:' + Math.max(pct, 3) + '%;border-radius:3px 3px 0 0;transition:height 0.3s;"></div>' +
          '<span style="font-size:11px;color:#64748b;">' + day + '</span>' +
          '</div>';
      }).join('') + '</div>';
  }

  // ── Widget: Average Per Day (KoboToolbox) ──
  function renderAvgPerDay(el, w, subs) {
    if (!subs.length) { el.innerHTML = '<p style="color:#94a3b8;text-align:center;">No submissions</p>'; return; }
    var cfg = w.config || {};
    var filterDays = cfg.days || 0;
    var cutoff = filterDays ? new Date(Date.now() - filterDays * 86400000) : null;

    var dates = {};
    subs.forEach(function (s) {
      if (!s._submission_time) return;
      if (cutoff && new Date(s._submission_time) < cutoff) return;
      var d = s._submission_time.split('T')[0];
      dates[d] = (dates[d] || 0) + 1;
    });
    var dayKeys = Object.keys(dates);
    if (!dayKeys.length) { el.innerHTML = '<p style="color:#94a3b8;text-align:center;">No submissions in period</p>'; return; }
    var dayCount = dayKeys.length;
    var totalInPeriod = 0;
    dayKeys.forEach(function (k) { totalInPeriod += dates[k]; });
    var avg = (totalInPeriod / dayCount).toFixed(1);
    var maxDay = dayKeys.reduce(function (a, b) { return dates[a] > dates[b] ? a : b; }, dayKeys[0]);
    var minDay = dayKeys.reduce(function (a, b) { return dates[a] < dates[b] ? a : b; }, dayKeys[0]);

    var display = (cfg.prefix || '') + avg + (cfg.suffix || '');
    el.innerHTML = '<div style="text-align:center;">' +
      '<div style="font-size:48px;font-weight:700;color:#54a8dc;">' + esc(display) + '</div>' +
      '<div style="font-size:13px;color:#64748b;margin-bottom:16px;">submissions per day' + (filterDays ? ' (last ' + filterDays + ' days)' : '') + '</div>' +
      '<div style="display:flex;justify-content:center;gap:24px;font-size:12px;color:#94a3b8;">' +
        '<div>Peak: <strong style="color:#29292a;">' + dates[maxDay] + '</strong> on ' + maxDay + '</div>' +
        '<div>Lowest: <strong style="color:#29292a;">' + dates[minDay] + '</strong> on ' + minDay + '</div>' +
      '</div></div>';
  }

  // ── Widget: Submissions by Period - KoboToolbox style with tabs ──
  function renderSubmissionsPeriod(el, w, subs) {
    var periods = [
      { label: 'Past 7 days', days: 7 },
      { label: 'Past 31 days', days: 31 },
      { label: 'Past 3 months', days: 90 },
      { label: 'Past 12 months', days: 365 }
    ];
    var activePeriod = 0;

    function render(periodIdx) {
      var p = periods[periodIdx];
      var cutoff = new Date(Date.now() - p.days * 86400000);
      var filtered = subs.filter(function (s) {
        return s._submission_time && new Date(s._submission_time) >= cutoff;
      });

      // Build day buckets
      var buckets = {};
      for (var i = p.days - 1; i >= 0; i--) {
        var d = new Date(Date.now() - i * 86400000);
        buckets[d.toISOString().split('T')[0]] = 0;
      }
      filtered.forEach(function (s) {
        var key = s._submission_time.split('T')[0];
        if (buckets[key] !== undefined) buckets[key]++;
      });

      var labels = Object.keys(buckets);
      var values = labels.map(function (l) { return buckets[l]; });
      var maxV = Math.max.apply(null, values) || 1;

      // Tabs
      var tabs = periods.map(function (pp, idx) {
        var active = idx === periodIdx ? 'background:#54a8dc;color:#fff;' : 'background:#f1f5f9;color:#64748b;';
        return '<button style="padding:6px 12px;border:none;border-radius:4px;font-size:12px;cursor:pointer;' + active + '" data-pidx="' + idx + '">' + pp.label + '</button>';
      }).join('');

      // Bar chart
      var barW = Math.max(2, Math.floor(700 / labels.length) - 2);
      var bars = values.map(function (v, i) {
        var h = Math.round((v / maxV) * 100);
        return '<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;min-width:' + barW + 'px;">' +
          '<div style="width:80%;height:' + Math.max(h, 2) + '%;background:#54a8dc;border-radius:2px 2px 0 0;"></div></div>';
      }).join('');

      // Summary numbers
      var totalP = filtered.length;

      el.innerHTML = '<div style="display:flex;gap:8px;margin-bottom:12px;">' + tabs + '</div>' +
        '<div style="display:flex;align-items:flex-end;height:120px;gap:1px;margin-bottom:8px;">' + bars + '</div>' +
        '<div style="display:flex;gap:24px;margin-top:8px;">' +
          '<div style="flex:1;text-align:center;padding:12px;background:#f8fafc;border-radius:6px;">' +
            '<div style="font-size:32px;font-weight:700;color:#54a8dc;">' + totalP + '</div>' +
            '<div style="font-size:12px;color:#94a3b8;">in ' + p.label.toLowerCase() + '</div>' +
          '</div>' +
          '<div style="flex:1;text-align:center;padding:12px;background:#f8fafc;border-radius:6px;">' +
            '<div style="font-size:32px;font-weight:700;color:#54a8dc;">' + subs.length + '</div>' +
            '<div style="font-size:12px;color:#94a3b8;">total all time</div>' +
          '</div>' +
        '</div>';

      // Tab click handlers
      el.querySelectorAll('[data-pidx]').forEach(function (btn) {
        btn.addEventListener('click', function () { render(parseInt(this.getAttribute('data-pidx'))); });
      });
    }

    render(activePeriod);
  }

  // ── Widget: Geographic Coverage (KoboToolbox) — View-Only Leaflet Map ──
  var GEO_COLORS = ['#54a8dc', '#e67e22', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#14b8a6', '#6366f1'];
  var _geoMapInstances = {};

  function loadLeafletForGeo(callback) {
    if (window.L && window.L.map) { callback(); return; }
    if (!document.querySelector('link[href*="leaflet"]')) {
      var css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(css);
    }
    if (!document.querySelector('script[src*="leaflet"]')) {
      var script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = function () {
        var tries = 0;
        var iv = setInterval(function () {
          if ((window.L && window.L.map) || tries > 40) { clearInterval(iv); callback(); }
          tries++;
        }, 100);
      };
      document.head.appendChild(script);
    } else {
      var tries = 0;
      var iv = setInterval(function () {
        if ((window.L && window.L.map) || tries > 40) { clearInterval(iv); callback(); }
        tries++;
      }, 100);
    }
  }

  function renderGeoCoverage(el, w, subs) {
    var mapId = 'ra-geo-map-' + w.id;
    var selectId = 'ra-geo-sel-' + w.id;
    var countId = 'ra-geo-count-' + w.id;

    // Group submissions by form
    var formGroups = {};
    subs.forEach(function (s) {
      var uid = s._form_uid || '__unknown__';
      if (!formGroups[uid]) formGroups[uid] = { name: s._form_name || uid, subs: [] };
      formGroups[uid].subs.push(s);
    });
    var formKeys = Object.keys(formGroups);

    // Only include forms that actually have GPS points
    var formsWithGeo = formKeys.filter(function (uid) {
      return formGroups[uid].subs.some(function (s) {
        var g = s._geolocation;
        if (!g || !g[0] || !g[1]) return false;
        var la = parseFloat(g[0]), lo = parseFloat(g[1]);
        return !isNaN(la) && !isNaN(lo) && !(la === 0 && lo === 0) && Math.abs(la) <= 90 && Math.abs(lo) <= 180;
      });
    });

    // Build form selector
    var optionsHtml = '<option value="__all__">All Forms (' + formsWithGeo.length + ')</option>';
    formsWithGeo.forEach(function (uid) {
      optionsHtml += '<option value="' + esc(uid) + '">' + esc(formGroups[uid].name) + '</option>';
    });

    el.innerHTML =
      '<div style="margin-bottom:8px;display:flex;align-items:center;gap:8px;">' +
        '<label style="font-size:12px;color:#64748b;white-space:nowrap;">Show form:</label>' +
        '<select id="' + selectId + '" style="flex:1;min-width:140px;padding:6px 10px;border:1px solid #d1d5db;border-radius:4px;font-size:12px;color:#1e293b;background:#fff;">' +
          optionsHtml +
        '</select>' +
        '<span id="' + countId + '" style="font-size:11px;color:#94a3b8;white-space:nowrap;"></span>' +
      '</div>' +
      '<div id="' + mapId + '" style="width:100%;height:320px;border-radius:6px;border:1px solid #e2e8f0;background:#e8ecf0;"></div>';

    if (!formsWithGeo.length) {
      document.getElementById(mapId).innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#94a3b8;font-size:13px;">No GPS data available</div>';
      return;
    }

    loadLeafletForGeo(function () {
      var L = window.L;
      if (!L || !L.map) return;

      setTimeout(function () {
        var container = document.getElementById(mapId);
        if (!container || container.offsetWidth === 0) return;

        // Destroy previous instance on re-render
        if (_geoMapInstances[w.id]) {
          try { _geoMapInstances[w.id].remove(); } catch (e) {}
          _geoMapInstances[w.id] = null;
        }

        var map = L.map(mapId, {
          center: [-6.8, 39.28],
          zoom: 6,
          zoomControl: false,        // no zoom buttons — keep it clean
          scrollWheelZoom: false,     // prevent accidental scroll zoom
          doubleClickZoom: false,     // no double-click zoom
          boxZoom: false,             // no box zoom
          keyboard: false,            // no keyboard nav
          dragging: true,             // allow panning
          attributionControl: false
        });
        _geoMapInstances[w.id] = map;

        // Street basemap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19
        }).addTo(map);

        L.control.attribution({ position: 'bottomright', prefix: false })
          .addAttribution('&copy; OSM')
          .addTo(map);

        var activeLayer = null;

        function showPoints(filterUid) {
          if (activeLayer) { map.removeLayer(activeLayer); activeLayer = null; }
          activeLayer = L.layerGroup().addTo(map);

          var bounds = [];
          var total = 0;
          var keysToShow = (filterUid === '__all__') ? formsWithGeo : [filterUid];

          keysToShow.forEach(function (uid, idx) {
            var fg = formGroups[uid];
            if (!fg) return;
            var color = GEO_COLORS[idx % GEO_COLORS.length];

            fg.subs.forEach(function (s) {
              var geo = s._geolocation;
              if (!geo || !geo[0] || !geo[1]) return;
              var lat = parseFloat(geo[0]), lon = parseFloat(geo[1]);
              if (isNaN(lat) || isNaN(lon) || (lat === 0 && lon === 0) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return;

              L.circleMarker([lat, lon], {
                radius: 5,
                fillColor: color,
                color: '#fff',
                weight: 1.5,
                opacity: 1,
                fillOpacity: 0.8,
                interactive: false   // no click/hover — view only
              }).addTo(activeLayer);

              bounds.push([lat, lon]);
              total++;
            });
          });

          var countEl = document.getElementById(countId);
          if (countEl) countEl.textContent = total + ' points';

          if (bounds.length) {
            map.flyToBounds(bounds, { padding: [25, 25], maxZoom: 14, duration: 0.8 });
          }
        }

        // Initial render
        showPoints('__all__');

        // Form selector — switch view
        var selectEl = document.getElementById(selectId);
        if (selectEl) {
          selectEl.addEventListener('change', function () { showPoints(this.value); });
        }

        setTimeout(function () { map.invalidateSize(); }, 300);
      }, 150);
    });
  }

  // ── Widget: Form Status Overview (KoboToolbox) ──
  function renderFormStatus(el, w) {
    var deployed = 0, draft = 0, archived = 0;
    formsCache.forEach(function (f) {
      if (f.deployment_status === 'deployed') deployed++;
      else if (f.deployment_status === 'archived') archived++;
      else draft++;
    });
    var total = formsCache.length;

    el.innerHTML = '<div style="display:flex;gap:12px;">' +
      '<div style="flex:1;text-align:center;padding:16px;background:#e8f8f0;border-radius:8px;">' +
        '<div style="font-size:28px;font-weight:700;color:#27ae60;">' + deployed + '</div>' +
        '<div style="font-size:12px;color:#27ae60;">Deployed</div>' +
      '</div>' +
      '<div style="flex:1;text-align:center;padding:16px;background:#fef3e2;border-radius:8px;">' +
        '<div style="font-size:28px;font-weight:700;color:#f39c12;">' + draft + '</div>' +
        '<div style="font-size:12px;color:#f39c12;">Draft</div>' +
      '</div>' +
      '<div style="flex:1;text-align:center;padding:16px;background:#f1f5f9;border-radius:8px;">' +
        '<div style="font-size:28px;font-weight:700;color:#94a3b8;">' + archived + '</div>' +
        '<div style="font-size:12px;color:#94a3b8;">Archived</div>' +
      '</div>' +
      '<div style="flex:1;text-align:center;padding:16px;background:#e8f4fd;border-radius:8px;">' +
        '<div style="font-size:28px;font-weight:700;color:#54a8dc;">' + total + '</div>' +
        '<div style="font-size:12px;color:#54a8dc;">Total</div>' +
      '</div>' +
    '</div>';
  }

  // ── Auto Refresh ──
  function startRefresh() {
    if (refreshTimer) clearInterval(refreshTimer);
    refreshTimer = setInterval(function () { loadAndRender(); }, REFRESH_INTERVAL);
  }

  // ── Bootstrap ──
  function bootstrap() {
    // Safety: always remove cover after 3 seconds no matter what
    setTimeout(removeScreenCover, 3000);

    detectUser().then(function (isDashOnly) {
      if (!isDashOnly) {
        removeScreenCover();
        return;
      }
      try {
        createPage();
      } catch (e) {
        removeScreenCover();
        return;
      }
      removeScreenCover();
      // Set title for dashboard user
      document.title = (currentUser ? currentUser.username : '') + ' | ' + BRAND_NAME;
      // Load data with error handling — don't let it hang
      try {
        loadAndRender();
      } catch (e) {}
      startRefresh();
    }).catch(function () {
      removeScreenCover();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }

  // ── Admin Preview API ──
  window.__raDashboardPreview = {
    show: function (dashboardId) {
      isPreviewMode = true;
      previewDashboardId = dashboardId || 'default';
      var existing = document.getElementById(PAGE_ID);
      if (existing) existing.remove();
      document.body.classList.remove('ra-do-active');

      (currentUser ? Promise.resolve() : fetchJSON('/me/').then(function (d) { currentUser = d; }))
        .then(function () {
          return loadDashboardConfig();
        })
        .then(function () {
          createPage();
          var page = document.getElementById(PAGE_ID);
          var bar = document.createElement('div');
          bar.id = 'ra-do-preview-bar';
          bar.style.cssText = 'background:#f59e0b;color:#000;padding:10px 20px;display:flex;align-items:center;justify-content:space-between;font-size:14px;font-weight:600;z-index:100000;';
          bar.innerHTML = '<span>ADMIN PREVIEW \u2014 This is what dashboard users see</span><button id="ra-do-preview-exit" title="Exit preview and return to Dashboard" style="background:#000;color:#fff;border:none;padding:8px 18px;border-radius:5px;font-size:13px;font-weight:600;cursor:pointer;">Exit Preview</button>';
          page.insertBefore(bar, page.firstChild);
          var lb = document.getElementById('ra-do-logout-btn');
          if (lb) lb.style.display = 'none';
          loadAndRender();
          document.getElementById('ra-do-preview-exit').addEventListener('click', function () {
            window.__raDashboardPreview.hide();
          });
        });
    },
    hide: function () {
      isPreviewMode = false;
      previewDashboardId = null;
      var page = document.getElementById(PAGE_ID);
      if (page) page.remove();
      document.body.classList.remove('ra-do-active');
      window.location.hash = '#/dashboard-admin';
    }
  };
})();

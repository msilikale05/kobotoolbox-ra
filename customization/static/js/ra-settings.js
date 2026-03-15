/**
 * Resilience Academy - Settings Page
 * ====================================
 * Adds a Settings nav icon (5th) below Map in the sidebar.
 * Central place for all platform configuration settings.
 * UPDATE-PROOF: Loaded via nginx sub_filter; does not modify core files.
 */
(function () {
  'use strict';

  var NAV_ID = 'ra-settings-nav';
  var PAGE_ID = 'ra-settings-page';
  var HASH = '#/settings';
  var BRAND_NAME = 'Ramani Yangu';
  var GEONODE_SETTINGS_KEY = 'ra_geonode_settings';
  var DEFAULT_GEONODE_URL = 'https://geonode.resilienceacademy.ac.tz';

  // ── Styles ──
  var style = document.createElement('style');
  style.textContent = [
    /* Nav icon */
    '#' + NAV_ID + ' {',
    '  display: flex;',
    '  align-items: center;',
    '  justify-content: center;',
    '  width: 100%;',
    '  height: 46px;',
    '  color: #8e9ba7;',
    '  text-decoration: none;',
    '  border-left: 3px solid transparent;',
    '  transition: color 0.2s, border-color 0.2s;',
    '  cursor: pointer;',
    '}',
    '#' + NAV_ID + ':hover { color: #54a8dc; }',
    '#' + NAV_ID + '.active { color: #54a8dc; border-left-color: #54a8dc; }',
    '#' + NAV_ID + ' svg { width: 26px; height: 26px; fill: currentColor; }',

    /* Page */
    '#' + PAGE_ID + ' {',
    '  position: fixed;',
    '  top: 64px;',
    '  left: 58px;',
    '  right: 0;',
    '  bottom: 0;',
    '  background: #f5f7fa;',
    '  z-index: 1001;',
    '  overflow-y: auto;',
    '  display: none;',
    '}',
    '#' + PAGE_ID + '.ra-st--visible { display: block; }',
    'body.ra-st-active .k-drawer { width: 58px !important; }',
    'body.ra-st-active .k-drawer__sidebar { display: none !important; }',

    /* Header */
    '.ra-st__header {',
    '  background: linear-gradient(135deg, #1a2a3a 0%, #54a8dc 100%);',
    '  color: #fff;',
    '  padding: 28px 40px 24px;',
    '}',
    '.ra-st__header h1 { margin: 0 0 6px; font-size: 22px; font-weight: 600; }',
    '.ra-st__header p { margin: 0; font-size: 13px; opacity: 0.85; }',

    /* Content */
    '.ra-st__content {',
    '  max-width: 800px;',
    '  margin: 0 auto;',
    '  padding: 24px 40px 60px;',
    '}',

    /* Section cards */
    '.ra-st__card {',
    '  background: #fff;',
    '  border-radius: 8px;',
    '  box-shadow: 0 1px 3px rgba(0,0,0,0.08);',
    '  margin-bottom: 20px;',
    '  overflow: hidden;',
    '}',
    '.ra-st__card-header {',
    '  display: flex;',
    '  align-items: center;',
    '  gap: 12px;',
    '  padding: 16px 20px;',
    '  border-bottom: 1px solid #f0f0f0;',
    '  cursor: pointer;',
    '}',
    '.ra-st__card-header:hover { background: #fafbfc; }',
    '.ra-st__card-icon {',
    '  width: 36px;',
    '  height: 36px;',
    '  border-radius: 8px;',
    '  display: flex;',
    '  align-items: center;',
    '  justify-content: center;',
    '  flex-shrink: 0;',
    '}',
    '.ra-st__card-icon svg { width: 20px; height: 20px; }',
    '.ra-st__card-title { font-size: 15px; font-weight: 600; color: #1a2a3a; }',
    '.ra-st__card-desc { font-size: 12px; color: #999; margin-top: 2px; }',
    '.ra-st__card-arrow {',
    '  margin-left: auto;',
    '  color: #ccc;',
    '  font-size: 18px;',
    '  transition: transform 0.2s;',
    '}',
    '.ra-st__card--open .ra-st__card-arrow { transform: rotate(90deg); }',
    '.ra-st__card-body {',
    '  padding: 0 20px 20px;',
    '  display: none;',
    '}',
    '.ra-st__card--open .ra-st__card-body { display: block; }',

    /* Form fields */
    '.ra-st__field { margin-bottom: 14px; }',
    '.ra-st__field label {',
    '  display: block; font-size: 12px; font-weight: 600;',
    '  color: #666; margin-bottom: 5px;',
    '}',
    '.ra-st__field input, .ra-st__field select {',
    '  width: 100%; padding: 10px 12px; font-size: 14px;',
    '  border: 1px solid #d0d5dd; border-radius: 6px;',
    '  box-sizing: border-box; background: #fff; color: #333;',
    '}',
    '.ra-st__field input:focus, .ra-st__field select:focus {',
    '  outline: none; border-color: #54a8dc;',
    '  box-shadow: 0 0 0 3px rgba(84,168,220,0.15);',
    '}',
    '.ra-st__field small { color: #999; font-size: 11px; }',
    '.ra-st__actions { display: flex; gap: 10px; margin-top: 16px; }',
    '.ra-st__btn {',
    '  padding: 10px 20px; border: none; border-radius: 6px;',
    '  font-size: 13px; font-weight: 600; cursor: pointer;',
    '}',
    '.ra-st__btn--primary { background: #54a8dc; color: #fff; }',
    '.ra-st__btn--primary:hover { background: #4090c0; }',
    '.ra-st__btn--secondary { background: #e5e7eb; color: #333; }',
    '.ra-st__btn--secondary:hover { background: #d0d5dd; }',
    '.ra-st__btn--success { background: #2ecc71; color: #fff; }',
    '.ra-st__btn--success:hover { background: #27ae60; }',

    /* Status messages */
    '.ra-st__status {',
    '  margin-top: 10px; padding: 10px 12px; border-radius: 6px;',
    '  font-size: 13px; display: none;',
    '}',
    '.ra-st__status--ok { display: block; background: #e8f8f0; color: #27ae60; }',
    '.ra-st__status--err { display: block; background: #fde8e8; color: #e74c3c; }',
    '.ra-st__status--info { display: block; background: #e8f4fd; color: #2980b9; }',

    /* Coming soon placeholder */
    '.ra-st__coming-soon {',
    '  padding: 20px;',
    '  text-align: center;',
    '  color: #bbb;',
    '  font-size: 13px;',
    '  font-style: italic;',
    '}',
    ''
  ].join('\n');
  document.head.appendChild(style);

  // ── Settings helpers ──
  function getGeoNodeSettings() {
    try { return JSON.parse(localStorage.getItem(GEONODE_SETTINGS_KEY)) || {}; } catch (e) { return {}; }
  }
  function saveGeoNodeSettings(s) {
    try { localStorage.setItem(GEONODE_SETTINGS_KEY, JSON.stringify(s)); } catch (e) {}
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str || ''));
    return div.innerHTML;
  }

  // ── Page ──
  function createPage() {
    if (document.getElementById(PAGE_ID)) return;

    var page = document.createElement('div');
    page.id = PAGE_ID;

    var gs = getGeoNodeSettings();

    page.innerHTML = [
      '<div class="ra-st__header">',
      '  <h1>Settings</h1>',
      '  <p>Configure platform integrations and preferences</p>',
      '</div>',
      '<div class="ra-st__content">',

      // ── GeoNode Card ──
      '  <div class="ra-st__card ra-st__card--open" id="ra-st-geonode">',
      '    <div class="ra-st__card-header">',
      '      <div class="ra-st__card-icon" style="background:#e8f8f0;">',
      '        <svg viewBox="0 0 24 24" fill="#2ecc71"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>',
      '      </div>',
      '      <div>',
      '        <div class="ra-st__card-title">GeoNode Connection</div>',
      '        <div class="ra-st__card-desc">Connect to GeoNode to pull/push spatial data layers</div>',
      '      </div>',
      '      <span class="ra-st__card-arrow">&#9656;</span>',
      '    </div>',
      '    <div class="ra-st__card-body">',
      '      <div class="ra-st__field">',
      '        <label>GeoNode URL</label>',
      '        <input type="url" id="ra-st-gn-url" value="' + escapeHtml(gs.url || DEFAULT_GEONODE_URL) + '" placeholder="https://geonode.example.com">',
      '        <small>The base URL of your GeoNode instance</small>',
      '      </div>',
      '      <div class="ra-st__field">',
      '        <label>API Token</label>',
      '        <input type="text" id="ra-st-gn-token" value="' + escapeHtml(gs.token || '') + '" placeholder="Bearer your-api-token">',
      '        <small>Leave empty for public layers only</small>',
      '      </div>',
      '      <div class="ra-st__field">',
      '        <label>Username</label>',
      '        <input type="text" id="ra-st-gn-user" value="' + escapeHtml(gs.username || '') + '" placeholder="admin">',
      '      </div>',
      '      <div class="ra-st__field">',
      '        <label>Password</label>',
      '        <input type="password" id="ra-st-gn-pass" value="' + escapeHtml(gs.password || '') + '">',
      '      </div>',
      '      <div class="ra-st__status" id="ra-st-gn-status"></div>',
      '      <div class="ra-st__actions">',
      '        <button class="ra-st__btn ra-st__btn--secondary" id="ra-st-gn-test">Test Connection</button>',
      '        <button class="ra-st__btn ra-st__btn--success" id="ra-st-gn-save">Save</button>',
      '      </div>',
      '    </div>',
      '  </div>',

      // ── Map Defaults Card ──
      '  <div class="ra-st__card" id="ra-st-map">',
      '    <div class="ra-st__card-header">',
      '      <div class="ra-st__card-icon" style="background:#e8f4fd;">',
      '        <svg viewBox="0 0 24 24" fill="#3498db"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>',
      '      </div>',
      '      <div>',
      '        <div class="ra-st__card-title">Map Defaults</div>',
      '        <div class="ra-st__card-desc">Default map center, zoom level, and base layer</div>',
      '      </div>',
      '      <span class="ra-st__card-arrow">&#9656;</span>',
      '    </div>',
      '    <div class="ra-st__card-body">',
      '      <div class="ra-st__coming-soon">Coming soon</div>',
      '    </div>',
      '  </div>',

      // ── Notifications Card ──
      '  <div class="ra-st__card" id="ra-st-notif">',
      '    <div class="ra-st__card-header">',
      '      <div class="ra-st__card-icon" style="background:#fef3e2;">',
      '        <svg viewBox="0 0 24 24" fill="#e67e22"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>',
      '      </div>',
      '      <div>',
      '        <div class="ra-st__card-title">Notifications</div>',
      '        <div class="ra-st__card-desc">Configure submission alerts and notification preferences</div>',
      '      </div>',
      '      <span class="ra-st__card-arrow">&#9656;</span>',
      '    </div>',
      '    <div class="ra-st__card-body">',
      '      <div class="ra-st__coming-soon">Coming soon</div>',
      '    </div>',
      '  </div>',

      // ── Data Export Defaults Card ──
      '  <div class="ra-st__card" id="ra-st-export">',
      '    <div class="ra-st__card-header">',
      '      <div class="ra-st__card-icon" style="background:#f0e8fd;">',
      '        <svg viewBox="0 0 24 24" fill="#9b59b6"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>',
      '      </div>',
      '      <div>',
      '        <div class="ra-st__card-title">Export Defaults</div>',
      '        <div class="ra-st__card-desc">Default export format and field selection</div>',
      '      </div>',
      '      <span class="ra-st__card-arrow">&#9656;</span>',
      '    </div>',
      '    <div class="ra-st__card-body">',
      '      <div class="ra-st__coming-soon">Coming soon</div>',
      '    </div>',
      '  </div>',

      '</div>'
    ].join('\n');

    document.body.appendChild(page);
    attachHandlers();
  }

  function attachHandlers() {
    // Card accordion toggle
    document.querySelectorAll('.ra-st__card-header').forEach(function (header) {
      header.addEventListener('click', function () {
        this.closest('.ra-st__card').classList.toggle('ra-st__card--open');
      });
    });

    // GeoNode: Test Connection
    document.getElementById('ra-st-gn-test').addEventListener('click', function () {
      var statusEl = document.getElementById('ra-st-gn-status');
      showStatus(statusEl, 'info', 'Testing connection...');

      var settings = readGeoNodeForm();
      saveGeoNodeSettings(settings);

      testGeoNodeConnection(settings).then(function (result) {
        if (result.ok) {
          showStatus(statusEl, 'ok', 'Connected to GeoNode! Found ' + (result.count || '?') + ' layers.');
        } else {
          showStatus(statusEl, 'err', 'Connection failed: ' + result.error);
        }
      });
    });

    // GeoNode: Save
    document.getElementById('ra-st-gn-save').addEventListener('click', function () {
      var statusEl = document.getElementById('ra-st-gn-status');
      var settings = readGeoNodeForm();
      saveGeoNodeSettings(settings);
      showStatus(statusEl, 'ok', 'Settings saved. GeoNode layers will load on the Map page.');
    });
  }

  function readGeoNodeForm() {
    return {
      url: document.getElementById('ra-st-gn-url').value.trim(),
      token: document.getElementById('ra-st-gn-token').value.trim(),
      username: document.getElementById('ra-st-gn-user').value.trim(),
      password: document.getElementById('ra-st-gn-pass').value.trim()
    };
  }

  function testGeoNodeConnection(settings) {
    var baseUrl = (settings.url || DEFAULT_GEONODE_URL).replace(/\/+$/, '');
    var headers = { 'Accept': 'application/json' };
    if (settings.token) {
      headers['Authorization'] = settings.token.indexOf(' ') !== -1 ? settings.token : 'Bearer ' + settings.token;
    } else if (settings.username && settings.password) {
      headers['Authorization'] = 'Basic ' + btoa(settings.username + ':' + settings.password);
    }

    return fetch(baseUrl + '/api/v2/layers/?page_size=1', { headers: headers })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (data) {
        var count = data.total || (data.layers || data.results || []).length;
        return { ok: true, count: count };
      })
      .catch(function (err) {
        return { ok: false, error: err.message };
      });
  }

  function showStatus(el, type, msg) {
    if (!el) return;
    el.style.display = 'block';
    el.className = 'ra-st__status' + (type === 'ok' ? ' ra-st__status--ok' : type === 'err' ? ' ra-st__status--err' : ' ra-st__status--info');
    el.textContent = msg;
  }

  // ── Navigation ──
  function showPage() {
    var page = document.getElementById(PAGE_ID);
    if (page) page.classList.add('ra-st--visible');
    document.body.classList.add('ra-st-active');
    document.title = 'Settings | ' + BRAND_NAME;
    var nav = document.getElementById(NAV_ID);
    if (nav) nav.classList.add('active');
    document.querySelectorAll('.k-drawer__link, [class*="drawer__link"]').forEach(function (link) {
      if (link.id !== NAV_ID) link.classList.remove('active');
    });
  }

  function hidePage() {
    var page = document.getElementById(PAGE_ID);
    if (page) page.classList.remove('ra-st--visible');
    document.body.classList.remove('ra-st-active');
    var nav = document.getElementById(NAV_ID);
    if (nav) nav.classList.remove('active');
  }

  function handleNavigation() {
    if (window.location.hash === HASH) {
      createPage();
      showPage();
    } else {
      hidePage();
    }
  }

  // ── Nav icon ──
  function injectNavIcon() {
    if (document.getElementById(NAV_ID)) return true;
    if (/\/accounts\/(login|signup|password)/.test(window.location.pathname)) return false;

    var primaryNav = document.querySelector('nav');
    if (!primaryNav) return false;
    var links = primaryNav.querySelectorAll('a');
    var hasProjects = false;
    links.forEach(function (l) {
      if (l.getAttribute('href') && l.getAttribute('href').indexOf('projects') !== -1) hasProjects = true;
    });
    if (!hasProjects) return false;

    var navLink = document.createElement('a');
    navLink.id = NAV_ID;
    navLink.href = HASH;
    navLink.setAttribute('data-tip', 'Settings');
    navLink.title = 'Platform Settings';
    navLink.innerHTML = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.488.488 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>';

    navLink.addEventListener('click', function (e) {
      e.preventDefault();
      window.location.hash = HASH;
    });

    primaryNav.appendChild(navLink);
    return true;
  }

  // ── Bootstrap ──
  function tryInject() {
    if (injectNavIcon()) {
      handleNavigation();
      return true;
    }
    return false;
  }

  function waitForNav() {
    if (tryInject()) return;
    var observer = new MutationObserver(function (mutations, obs) {
      if (tryInject()) obs.disconnect();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(function () { observer.disconnect(); }, 15000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForNav);
  } else {
    waitForNav();
  }

  window.addEventListener('hashchange', handleNavigation);
  document.addEventListener('click', function (e) {
    var link = e.target.closest('.k-drawer__link, [class*="drawer__link"]');
    if (link && link.id !== NAV_ID) setTimeout(hidePage, 100);
  }, true);
  var lastHash = window.location.hash;
  setInterval(function () {
    if (window.location.hash !== lastHash) { lastHash = window.location.hash; handleNavigation(); }
  }, 300);
})();

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
    '  position: absolute;',
    '  top: 64px;',
    '  left: 58px;',
    '  right: 0;',
    '  bottom: 0;',
    '  background: #fff;',
    '  z-index: 1001;',
    '  overflow-y: auto;',
    '  display: none;',
    '}',
    '#' + PAGE_ID + '.ra-st--visible { display: block; }',
    'body.ra-st-active .k-drawer { width: 58px !important; }',
    'body.ra-st-active .k-drawer__sidebar { display: none !important; }',

    /* Layout: sidebar + content like KoboToolbox Library page */
    '.ra-st__layout {',
    '  display: flex;',
    '  height: 100%;',
    '}',

    /* Sidebar submenu - matches KoboToolbox drawer sidebar */
    '.ra-st__sidebar {',
    '  width: 210px;',
    '  flex-shrink: 0;',
    '  background: #fff;',
    '  border-right: 1px solid #e8e8e8;',
    '  padding-top: 10px;',
    '  overflow-y: auto;',
    '}',
    '.ra-st__sidebar-item {',
    '  display: flex;',
    '  align-items: center;',
    '  gap: 12px;',
    '  padding: 11px 20px;',
    '  font-size: 14px;',
    '  line-height: 20px;',
    '  min-height: 42px;',
    '  box-sizing: border-box;',
    '  color: #555;',
    '  cursor: pointer;',
    '  text-decoration: none;',
    '  border-left: 3px solid transparent;',
    '  transition: background 0.15s, color 0.15s;',
    '  font-family: Roboto, sans-serif;',
    '}',
    '.ra-st__sidebar-item:hover { background: #f5f7fa; color: #333; }',
    '.ra-st__sidebar-item.active {',
    '  color: #54a8dc;',
    '  border-left-color: #54a8dc;',
    '  background: #f0f8ff;',
    '  font-weight: 600;',
    '}',
    '.ra-st__sidebar-item svg { width: 20px; height: 20px; fill: currentColor; flex-shrink: 0; }',

    /* Content area */
    '.ra-st__main {',
    '  flex: 1;',
    '  overflow-y: auto;',
    '  background: #fff;',
    '}',
    '.ra-st__page-title {',
    '  font-size: 24px;',
    '  font-weight: 700;',
    '  color: #29292a;',
    '  padding: 20px 30px 0;',
    '  margin: 0;',
    '  font-family: Roboto, sans-serif;',
    '}',
    '.ra-st__content {',
    '  padding: 20px 30px 60px;',
    '  max-width: 700px;',
    '}',
    '.ra-st__section-title {',
    '  font-size: 14px;',
    '  font-weight: 600;',
    '  color: #29292a;',
    '  margin: 0 0 16px;',
    '  padding-bottom: 8px;',
    '  border-bottom: 1px solid #eee;',
    '}',
    '.ra-st__card--open .ra-st__card-arrow { transform: rotate(90deg); }',
    '.ra-st__card-body {',
    '  padding: 0 16px 16px;',
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
    '.ra-st__btn--primary { background: #54a8dc; color: #29292a; }',
    '.ra-st__btn--primary:hover { background: #4090c0; }',
    '.ra-st__btn--secondary { background: #e5e7eb; color: #333; }',
    '.ra-st__btn--secondary:hover { background: #d0d5dd; }',
    '.ra-st__btn--success { background: #2ecc71; color: #29292a; }',
    '.ra-st__btn--success:hover { background: #27ae60; }',

    /* Status messages */
    '.ra-st__status {',
    '  margin-top: 10px; padding: 10px 12px; border-radius: 6px;',
    '  font-size: 13px; display: none;',
    '}',
    '.ra-st__status--ok { display: block; background: #e8f8f0; color: #27ae60; }',
    '.ra-st__status--err { display: block; background: #fde8e8; color: #e74c3c; }',
    '.ra-st__status--info { display: block; background: #e8f4fd; color: #2980b9; }',

    /* GeoNode connection list */
    '.ra-st__gn-conn { display: flex; align-items: center; padding: 12px; border: 1px solid #eee; border-radius: 8px; margin-bottom: 8px; }',
    '.ra-st__gn-conn-info { flex: 1; min-width: 0; }',
    '.ra-st__gn-conn-name { font-weight: 600; font-size: 14px; }',
    '.ra-st__gn-conn-url { font-size: 12px; color: #888; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }',
    '.ra-st__gn-conn-actions { display: flex; gap: 6px; flex-shrink: 0; }',
    '.ra-st__btn--small { padding: 4px 10px; font-size: 11px; }',
    '.ra-st__btn--danger { color: #e74c3c; border-color: #e74c3c; }',

    /* Coming soon placeholder */
    '.ra-st__coming-soon {',
    '  padding: 20px;',
    '  text-align: center;',
    '  color: #bbb;',
    '  font-size: 13px;',
    '  font-style: italic;',
    '}',

    /* Tab bar (like KoboToolbox project page) */
    '.ra-st__tabs {',
    '  display: flex;',
    '  border-bottom: 2px solid #e2e8f0;',
    '  margin: 0 0 20px;',
    '  padding: 0 30px;',
    '}',
    '.ra-st__tab {',
    '  padding: 12px 20px;',
    '  font-size: 14px;',
    '  font-weight: 500;',
    '  color: #64748b;',
    '  cursor: pointer;',
    '  border-bottom: 2px solid transparent;',
    '  margin-bottom: -2px;',
    '  transition: color 0.15s, border-color 0.15s;',
    '  background: none;',
    '  border-top: none;',
    '  border-left: none;',
    '  border-right: none;',
    '  font-family: Roboto, sans-serif;',
    '}',
    '.ra-st__tab:hover { color: #334155; }',
    '.ra-st__tab.active {',
    '  color: #54a8dc;',
    '  border-bottom-color: #54a8dc;',
    '  font-weight: 600;',
    '}',
    ''
  ].join('\n');
  document.head.appendChild(style);

  // ── Settings helpers ──
  function generateId() {
    return 'gn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
  }

  function getGeoNodeSettings() {
    var raw;
    try { raw = JSON.parse(localStorage.getItem(GEONODE_SETTINGS_KEY)); } catch (e) { raw = null; }
    if (!raw) return [];
    // Migrate old single-object format to array
    if (!Array.isArray(raw)) {
      if (raw.url) {
        raw.id = raw.id || generateId();
        raw.name = raw.name || 'GeoNode';
        return [raw];
      }
      return [];
    }
    return raw;
  }
  function saveGeoNodeSettings(s) {
    var arr = Array.isArray(s) ? s : [s];
    try { localStorage.setItem(GEONODE_SETTINGS_KEY, JSON.stringify(arr)); } catch (e) {}
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str || ''));
    return div.innerHTML;
  }

  // ── Settings sections (each is a submenu item) ──
  var SECTIONS = [
    { id: 'dashboard', label: 'Dashboard', icon: '<svg viewBox="0 0 24 24"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/></svg>' },
    { id: 'geonode', label: 'GeoNode', icon: '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>' },
    { id: 'export', label: 'Batch Export', icon: '<svg viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>' },
    { id: 'map', label: 'Map Defaults', icon: '<svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>' },
    { id: 'notifications', label: 'Notifications', icon: '<svg viewBox="0 0 24 24"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>' }
  ];

  var activeSection = 'dashboard';
  var activeDashTab = 'users';

  // ── Page ──
  function createPage() {
    if (document.getElementById(PAGE_ID)) return;

    var page = document.createElement('div');
    page.id = PAGE_ID;

    // Build sidebar submenu items
    var sidebarItems = SECTIONS.map(function (s) {
      var cls = s.id === activeSection ? ' active' : '';
      return '<div class="ra-st__sidebar-item' + cls + '" data-section="' + s.id + '">' +
        s.icon + '<span>' + s.label + '</span></div>';
    }).join('');

    page.innerHTML =
      '<div class="ra-st__layout">' +
        '<div class="ra-st__sidebar">' + sidebarItems + '</div>' +
        '<div class="ra-st__main" id="ra-st-main"></div>' +
      '</div>';

    document.body.appendChild(page);

    // Sidebar click handler
    page.querySelector('.ra-st__sidebar').addEventListener('click', function (e) {
      var item = e.target.closest('.ra-st__sidebar-item');
      if (!item) return;
      activeSection = item.getAttribute('data-section');
      page.querySelectorAll('.ra-st__sidebar-item').forEach(function (el) { el.classList.remove('active'); });
      item.classList.add('active');
      renderSection(activeSection);
    });

    renderSection(activeSection);
  }

  function renderSection(sectionId) {
    var main = document.getElementById('ra-st-main');
    if (!main) return;

    if (sectionId === 'dashboard') renderDashboardSection(main);
    else if (sectionId === 'geonode') renderGeoNodeSection(main);
    else if (sectionId === 'export') renderExportSection(main);
    else if (sectionId === 'map') renderComingSoon(main, 'Map Defaults', 'Default map center, zoom level, and base layer settings.');
    else if (sectionId === 'notifications') renderComingSoon(main, 'Notifications', 'Configure submission alerts and notification preferences.');
  }

  function renderComingSoon(main, title, desc) {
    main.innerHTML = '<h1 class="ra-st__page-title">' + title + '</h1>' +
      '<div class="ra-st__content"><p style="color:#888;">' + desc + '</p>' +
      '<p style="color:#bbb;font-style:italic;margin-top:24px;">Coming soon</p></div>';
  }

  // ── Dashboard Users Management ──
  // Cache for KoboToolbox users list
  var _allKoboUsers = null;

  // ── Dashboard Section (unified with tabs) ──
  function renderDashboardSection(main) {
    main.innerHTML =
      '<h1 class="ra-st__page-title">Dashboard</h1>' +
      '<div class="ra-st__tabs" id="ra-st-dash-tabs">' +
        '<button class="ra-st__tab' + (activeDashTab === 'users' ? ' active' : '') + '" data-tab="users">Users</button>' +
        '<button class="ra-st__tab' + (activeDashTab === 'layout' ? ' active' : '') + '" data-tab="layout">Layout</button>' +
        '<button class="ra-st__tab' + (activeDashTab === 'preview' ? ' active' : '') + '" data-tab="preview">Preview</button>' +
      '</div>' +
      '<div id="ra-st-dash-content"></div>';

    // Tab click handler
    document.getElementById('ra-st-dash-tabs').addEventListener('click', function (e) {
      var tab = e.target.closest('.ra-st__tab');
      if (!tab) return;
      activeDashTab = tab.dataset.tab;
      document.querySelectorAll('#ra-st-dash-tabs .ra-st__tab').forEach(function (t) { t.classList.remove('active'); });
      tab.classList.add('active');
      renderDashTabContent();
    });

    renderDashTabContent();
  }

  function renderDashTabContent() {
    var container = document.getElementById('ra-st-dash-content');
    if (!container) return;

    if (activeDashTab === 'users') renderDashUsersTab(container);
    else if (activeDashTab === 'layout') renderDashLayoutTab(container);
    else if (activeDashTab === 'preview') renderDashPreviewTab(container);
  }

  function renderDashPreviewTab(container) {
    container.innerHTML =
      '<div class="ra-st__content">' +
        '<p style="color:#666;margin:0 0 16px;font-size:14px;">Preview exactly what dashboard-only users see when they log in.</p>' +
        '<button class="ra-st__btn ra-st__btn--primary" id="ra-st-dash-preview-btn" style="font-size:15px;padding:14px 28px;">Open Dashboard Preview</button>' +
      '</div>';
    document.getElementById('ra-st-dash-preview-btn').addEventListener('click', function () {
      if (window.__raDashboardPreview) window.__raDashboardPreview.show();
    });
  }

  function renderDashUsersTab(container) {
    var main = container;
    renderDashboardUsersContent(main);
  }

  function renderDashLayoutTab(container) {
    var main = container;
    renderDashboardLayoutContent(main);
  }

  function renderDashboardUsersContent(main) {
    main.innerHTML =
      '<div class="ra-st__content">' +
        '<p style="color:#666;margin:0 0 16px;font-size:14px;">' +
          'Users listed here will <strong>only see a read-only summary dashboard</strong> when they log in. ' +
          'They cannot access forms, data, or settings — only submission summaries and charts.' +
        '</p>' +

        // Add user: select from existing KoboToolbox users
        '<div class="ra-st__field">' +
          '<label>Add Existing User to Dashboard View</label>' +
          '<div style="display:flex;gap:10px;">' +
            '<select id="ra-st-du-select" style="flex:1;padding:10px 12px;font-size:14px;border:1px solid #d0d5dd;border-radius:6px;background:#fff;">' +
              '<option value="">Loading users...</option>' +
            '</select>' +
            '<button class="ra-st__btn ra-st__btn--primary" id="ra-st-du-add">Add</button>' +
          '</div>' +
          '<small>Select a registered KoboToolbox user to restrict them to dashboard-only view</small>' +
        '</div>' +

        '<div class="ra-st__status" id="ra-st-du-status"></div>' +

        // Current dashboard users list
        '<div style="margin-top:8px;">' +
          '<label style="display:block;font-size:12px;font-weight:600;color:#666;margin-bottom:8px;">Current Dashboard-Only Users</label>' +
          '<div id="ra-st-du-list" style="border:1px solid #eee;border-radius:6px;">' +
            '<div style="padding:16px;text-align:center;color:#999;">Loading...</div>' +
          '</div>' +
        '</div>' +

        '<div style="margin-top:16px;padding:14px;background:#f0f8ff;border-radius:6px;border:1px solid #d0e8f5;">' +
          '<p style="margin:0;font-size:13px;color:#2980b9;">' +
            '<strong>How it works:</strong> Create users via normal KoboToolbox registration, ' +
            'then add them here. They will only see the dashboard. ' +
            'Use the <strong>Layout</strong> tab to customize widgets, and <strong>Preview</strong> to test.' +
          '</p>' +
        '</div>' +
      '</div>';

    loadKoboUsers();
    loadDashboardUsers();

    // Add button handler
    document.getElementById('ra-st-du-add').addEventListener('click', function () {
      var select = document.getElementById('ra-st-du-select');
      var username = select.value;
      if (!username) {
        showStatus(document.getElementById('ra-st-du-status'), 'err', 'Select a user first');
        return;
      }
      addDashboardUser(username);
    });

  }

  function loadKoboUsers() {
    var select = document.getElementById('ra-st-du-select');
    if (!select) return;

    fetch('/api/v2/users/?format=json&limit=200', { credentials: 'same-origin' })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (data) {
        _allKoboUsers = (data.results || []).filter(function (u) {
          return u.is_active && u.username !== 'AnonymousUser';
        });
        updateUserDropdown();
      })
      .catch(function () {
        // Fallback: if not superuser, show manual input instead
        select.parentNode.innerHTML =
          '<input type="text" id="ra-st-du-input" placeholder="Type username to add" ' +
            'style="flex:1;padding:10px 12px;font-size:14px;border:1px solid #d0d5dd;border-radius:6px;">' +
          '<button class="ra-st__btn ra-st__btn--primary" id="ra-st-du-add">Add</button>';

        document.getElementById('ra-st-du-add').addEventListener('click', function () {
          var input = document.getElementById('ra-st-du-input');
          var username = (input.value || '').trim();
          if (!username) {
            showStatus(document.getElementById('ra-st-du-status'), 'err', 'Enter a username');
            return;
          }
          addDashboardUser(username);
          input.value = '';
        });
      });
  }

  function updateUserDropdown() {
    var select = document.getElementById('ra-st-du-select');
    if (!select || !_allKoboUsers) return;

    // Get current dashboard users to mark them
    fetch('/webhook-api/dashboard-users', { credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var dashUsers = data.users || [];
        var available = _allKoboUsers.filter(function (u) {
          return dashUsers.indexOf(u.username) === -1;
        });

        if (!available.length) {
          select.innerHTML = '<option value="">All users are already dashboard users</option>';
          return;
        }

        select.innerHTML = '<option value="">-- Select a user --</option>' +
          available.map(function (u) {
            var name = (u.metadata && u.metadata.name) || '';
            var org = (u.metadata && u.metadata.organization) || '';
            var label = u.username;
            if (name) label += ' (' + name + ')';
            if (org) label += ' - ' + org;
            return '<option value="' + escapeHtml(u.username) + '">' + escapeHtml(label) + '</option>';
          }).join('');
      })
      .catch(function () {
        // If webhook-relay not available, just show all users
        select.innerHTML = '<option value="">-- Select a user --</option>' +
          _allKoboUsers.map(function (u) {
            return '<option value="' + escapeHtml(u.username) + '">' + escapeHtml(u.username) + '</option>';
          }).join('');
      });
  }

  function getUserDisplayInfo(username) {
    // Look up full name and org from cached KoboToolbox users
    if (!_allKoboUsers) return { name: '', org: '' };
    for (var i = 0; i < _allKoboUsers.length; i++) {
      if (_allKoboUsers[i].username === username) {
        var m = _allKoboUsers[i].metadata || {};
        return { name: m.name || '', org: m.organization || '' };
      }
    }
    return { name: '', org: '' };
  }

  function loadDashboardUsers() {
    var listEl = document.getElementById('ra-st-du-list');
    if (!listEl) return;

    fetch('/webhook-api/dashboard-users', { credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var users = data.users || [];
        if (!users.length) {
          listEl.innerHTML = '<div style="padding:16px;text-align:center;color:#999;font-size:13px;">No dashboard users configured yet. Select a user above to add them.</div>';
          return;
        }
        listEl.innerHTML = users.map(function (u) {
          var info = getUserDisplayInfo(u);
          var subtitle = [info.name, info.org].filter(function (s) { return s; }).join(' - ');
          return '<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-bottom:1px solid #f5f5f5;">' +
            '<div style="display:flex;align-items:center;gap:10px;">' +
              '<div style="width:36px;height:36px;border-radius:50%;background:#e0f2fe;color:#0284c7;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:15px;">' +
                escapeHtml(u.charAt(0).toUpperCase()) +
              '</div>' +
              '<div>' +
                '<div style="font-size:14px;font-weight:600;color:#1e293b;">' + escapeHtml(u) + '</div>' +
                (subtitle ? '<div style="font-size:12px;color:#94a3b8;">' + escapeHtml(subtitle) + '</div>' : '') +
              '</div>' +
            '</div>' +
            '<button class="ra-st__btn ra-st__btn--secondary ra-st-du-remove" data-user="' + escapeHtml(u) + '" ' +
              'style="padding:6px 12px;font-size:12px;color:#e74c3c;">Remove</button>' +
          '</div>';
        }).join('');

        // Attach remove handlers
        listEl.querySelectorAll('.ra-st-du-remove').forEach(function (btn) {
          btn.addEventListener('click', function () {
            removeDashboardUser(this.getAttribute('data-user'));
          });
        });
      })
      .catch(function () {
        // Fallback: read from the static config file
        fetch('/custom-static/config/dashboard-users.json')
          .then(function (r) { return r.json(); })
          .then(function (data) {
            var users = data.users || [];
            listEl.innerHTML = users.length
              ? users.map(function (u) {
                  return '<div style="padding:12px 14px;border-bottom:1px solid #f5f5f5;font-size:14px;">' + escapeHtml(u) + '</div>';
                }).join('')
              : '<div style="padding:16px;text-align:center;color:#999;">No dashboard users configured.</div>';
          })
          .catch(function () {
            listEl.innerHTML = '<div style="padding:16px;text-align:center;color:#e74c3c;">Could not load dashboard users. Is the webhook-relay service running?</div>';
          });
      });
  }

  function addDashboardUser(username) {
    var statusEl = document.getElementById('ra-st-du-status');
    showStatus(statusEl, 'info', 'Adding user...');

    fetch('/webhook-api/dashboard-users/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ username: username })
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.error) {
          showStatus(statusEl, 'err', data.error);
        } else {
          showStatus(statusEl, 'ok', '"' + username + '" added as dashboard-only user');
          loadDashboardUsers();
          updateUserDropdown(); // Refresh dropdown to remove added user
        }
      })
      .catch(function () {
        showStatus(statusEl, 'err', 'Failed to add user. Is the webhook-relay service running?');
      });
  }

  function removeDashboardUser(username) {
    var statusEl = document.getElementById('ra-st-du-status');
    showStatus(statusEl, 'info', 'Removing user...');

    fetch('/webhook-api/dashboard-users/remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ username: username })
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.error) {
          showStatus(statusEl, 'err', data.error);
        } else {
          showStatus(statusEl, 'ok', '"' + username + '" removed from dashboard users');
          loadDashboardUsers();
          updateUserDropdown(); // Refresh dropdown to show removed user again
        }
      })
      .catch(function () {
        showStatus(statusEl, 'err', 'Failed to remove user.');
      });
  }

  // ── Dashboard Layout Builder ──
  var WIDGET_TYPES = [
    { id: 'stat-cards', label: 'Summary Cards', desc: 'Overview numbers: total forms, submissions, today, contributors' },
    { id: 'chart', label: 'Bar Chart', desc: 'Submissions over time (configurable days)' },
    { id: 'form-table', label: 'Forms Table', desc: 'List of forms with submission counts' },
    { id: 'recent-feed', label: 'Recent Submissions', desc: 'Latest submissions with user and time' },
    { id: 'pie-chart', label: 'Pie Chart', desc: 'Breakdown by a field (e.g., district, submitted by)' },
    { id: 'single-stat', label: 'Single Number', desc: 'One big metric: count, today, or contributors' }
  ];

  var _layoutForms = null;
  var _currentLayout = null;

  function renderDashboardLayoutContent(main) {
    main.innerHTML =
      '<div class="ra-st__content" style="max-width:900px;">' +
        '<p style="color:#666;margin:0 0 16px;font-size:14px;">' +
          'Configure the widgets that dashboard users see. Add, remove, and reorder widgets. ' +
          'Each widget can pull data from specific forms or all forms.' +
        '</p>' +
        '<div class="ra-st__status" id="ra-st-dl-status"></div>' +
        '<div id="ra-st-dl-widgets" style="margin:16px 0;">' +
          '<div style="padding:20px;text-align:center;color:#999;">Loading layout...</div>' +
        '</div>' +
        '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:16px;">' +
          '<button class="ra-st__btn ra-st__btn--primary" id="ra-st-dl-add">+ Add Widget</button>' +
          '<button class="ra-st__btn ra-st__btn--success" id="ra-st-dl-save">Save Layout</button>' +
          '<button class="ra-st__btn ra-st__btn--secondary" id="ra-st-dl-reset">Reset to Default</button>' +
        '</div>' +
      '</div>';

    // Load forms for the form selector
    fetch('/api/v2/assets/?asset_type=survey&fields=["uid","name","deployment_status","deployment__submission_count","content"]&limit=200', { credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        _layoutForms = (data.results || []).filter(function (f) { return f.deployment_status === 'deployed'; });
        loadLayoutConfig();
      });

    document.getElementById('ra-st-dl-add').addEventListener('click', function () { addWidgetToLayout(); });
    document.getElementById('ra-st-dl-save').addEventListener('click', function () { saveLayout(); });
    document.getElementById('ra-st-dl-reset').addEventListener('click', function () {
      _currentLayout = { widgets: [] };
      renderWidgetList();
      showStatus(document.getElementById('ra-st-dl-status'), 'info', 'Layout reset to default. Click Save to apply.');
    });
  }

  function loadLayoutConfig() {
    fetch('/webhook-api/dashboard-layout', { credentials: 'same-origin' })
      .then(function (r) { return r.ok ? r.json() : { widgets: [] }; })
      .then(function (data) {
        _currentLayout = data;
        renderWidgetList();
      })
      .catch(function () {
        _currentLayout = { widgets: [] };
        renderWidgetList();
      });
  }

  function renderWidgetList() {
    var container = document.getElementById('ra-st-dl-widgets');
    if (!container || !_currentLayout) return;

    var widgets = _currentLayout.widgets || [];
    if (!widgets.length) {
      container.innerHTML = '<div style="padding:24px;text-align:center;color:#94a3b8;border:2px dashed #e2e8f0;border-radius:8px;">' +
        '<p style="font-size:14px;margin:0 0 8px;">No widgets configured</p>' +
        '<p style="font-size:12px;margin:0;">Click "Add Widget" to start building the dashboard. Default widgets will be shown until you save a custom layout.</p>' +
      '</div>';
      return;
    }

    container.innerHTML = widgets.map(function (w, idx) {
      var typeDef = WIDGET_TYPES.find(function (t) { return t.id === w.type; }) || { label: w.type, desc: '' };
      var formNames = getWidgetFormNames(w);
      var configSummary = getWidgetConfigSummary(w);

      return '<div style="border:1px solid #e2e8f0;border-radius:8px;margin-bottom:12px;background:#fff;" data-idx="' + idx + '">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid #f1f5f9;">' +
          '<div style="display:flex;align-items:center;gap:10px;">' +
            '<span style="color:#94a3b8;font-size:12px;font-weight:700;">#' + (idx + 1) + '</span>' +
            '<span style="font-weight:600;color:#1e293b;font-size:14px;">' + escapeHtml(w.title || typeDef.label) + '</span>' +
            '<span style="background:#e0f2fe;color:#0284c7;font-size:11px;padding:2px 8px;border-radius:10px;">' + escapeHtml(typeDef.label) + '</span>' +
            '<span style="color:#94a3b8;font-size:11px;">' + escapeHtml(w.width === 'full' ? 'Full width' : 'Half width') + '</span>' +
          '</div>' +
          '<div style="display:flex;gap:6px;">' +
            (idx > 0 ? '<button class="ra-st__btn ra-st__btn--secondary ra-dl-move-up" data-idx="' + idx + '" style="padding:4px 8px;font-size:11px;">Up</button>' : '') +
            (idx < widgets.length - 1 ? '<button class="ra-st__btn ra-st__btn--secondary ra-dl-move-down" data-idx="' + idx + '" style="padding:4px 8px;font-size:11px;">Down</button>' : '') +
            '<button class="ra-st__btn ra-st__btn--secondary ra-dl-edit" data-idx="' + idx + '" style="padding:4px 8px;font-size:11px;">Edit</button>' +
            '<button class="ra-st__btn ra-st__btn--secondary ra-dl-remove" data-idx="' + idx + '" style="padding:4px 8px;font-size:11px;color:#e74c3c;">Remove</button>' +
          '</div>' +
        '</div>' +
        '<div style="padding:10px 16px;font-size:12px;color:#64748b;">' +
          'Forms: ' + escapeHtml(formNames) +
          (configSummary ? ' &middot; ' + escapeHtml(configSummary) : '') +
        '</div>' +
      '</div>';
    }).join('');

    // Attach handlers
    container.querySelectorAll('.ra-dl-remove').forEach(function (btn) {
      btn.addEventListener('click', function () {
        _currentLayout.widgets.splice(parseInt(this.dataset.idx), 1);
        renderWidgetList();
      });
    });
    container.querySelectorAll('.ra-dl-move-up').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var i = parseInt(this.dataset.idx);
        var w = _currentLayout.widgets.splice(i, 1)[0];
        _currentLayout.widgets.splice(i - 1, 0, w);
        renderWidgetList();
      });
    });
    container.querySelectorAll('.ra-dl-move-down').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var i = parseInt(this.dataset.idx);
        var w = _currentLayout.widgets.splice(i, 1)[0];
        _currentLayout.widgets.splice(i + 1, 0, w);
        renderWidgetList();
      });
    });
    container.querySelectorAll('.ra-dl-edit').forEach(function (btn) {
      btn.addEventListener('click', function () {
        showWidgetEditor(parseInt(this.dataset.idx));
      });
    });
  }

  function getWidgetFormNames(w) {
    if (!w.forms || !w.forms.length || w.forms[0] === '__all__') return 'All forms';
    if (!_layoutForms) return w.forms.join(', ');
    return w.forms.map(function (uid) {
      var f = _layoutForms.find(function (ff) { return ff.uid === uid; });
      return f ? f.name : uid;
    }).join(', ');
  }

  function getWidgetConfigSummary(w) {
    var c = w.config || {};
    var parts = [];
    if (c.days) parts.push(c.days + ' days');
    if (c.limit) parts.push('Limit: ' + c.limit);
    if (c.field) parts.push('Field: ' + c.field);
    if (c.metric) parts.push('Metric: ' + c.metric);
    if (c.label) parts.push('Label: ' + c.label);
    return parts.join(', ');
  }

  function addWidgetToLayout() {
    showWidgetEditor(-1);
  }

  function showWidgetEditor(editIdx) {
    var isEdit = editIdx >= 0;
    var w = isEdit ? _currentLayout.widgets[editIdx] : { id: 'w' + Date.now(), type: 'stat-cards', title: '', width: 'full', forms: ['__all__'], config: {} };

    var formOptions = '<option value="__all__"' + ((!w.forms || !w.forms.length || w.forms[0] === '__all__') ? ' selected' : '') + '>All forms</option>';
    if (_layoutForms) {
      _layoutForms.forEach(function (f) {
        var sel = w.forms && w.forms.indexOf(f.uid) !== -1 ? ' selected' : '';
        formOptions += '<option value="' + escapeHtml(f.uid) + '"' + sel + '>' + escapeHtml(f.name) + ' (' + (f.deployment__submission_count || 0) + ')</option>';
      });
    }

    var typeOptions = WIDGET_TYPES.map(function (t) {
      return '<option value="' + t.id + '"' + (w.type === t.id ? ' selected' : '') + '>' + t.label + ' - ' + t.desc + '</option>';
    }).join('');

    // Get fields for pie chart
    var fieldOptions = '<option value="_submitted_by">Submitted By</option>';
    if (_layoutForms) {
      var allFields = {};
      _layoutForms.forEach(function (f) {
        var survey = (f.content || {}).survey || [];
        survey.forEach(function (row) {
          var t = row.type || '';
          if (t.indexOf('select') === 0 || t === 'text') {
            var name = row.name || row.$autoname || '';
            var label = (row.label && row.label[0]) || name;
            if (name && !allFields[name]) allFields[name] = label;
          }
        });
      });
      Object.keys(allFields).forEach(function (name) {
        var sel = (w.config || {}).field === name ? ' selected' : '';
        fieldOptions += '<option value="' + escapeHtml(name) + '"' + sel + '>' + escapeHtml(allFields[name]) + '</option>';
      });
    }

    var cfg = w.config || {};
    var modal = document.createElement('div');
    modal.id = 'ra-dl-modal';
    modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:100001;display:flex;align-items:center;justify-content:center;';
    modal.innerHTML =
      '<div style="background:#fff;border-radius:10px;width:500px;max-width:90vw;max-height:90vh;overflow-y:auto;box-shadow:0 10px 40px rgba(0,0,0,0.2);">' +
        '<div style="padding:18px 20px;border-bottom:1px solid #e2e8f0;font-size:16px;font-weight:600;color:#1e293b;display:flex;justify-content:space-between;align-items:center;">' +
          (isEdit ? 'Edit Widget' : 'Add Widget') +
          '<button id="ra-dl-modal-close" style="background:none;border:none;font-size:20px;cursor:pointer;color:#94a3b8;">&times;</button>' +
        '</div>' +
        '<div style="padding:20px;">' +
          '<div class="ra-st__field"><label>Widget Type</label><select id="ra-dl-type">' + typeOptions + '</select></div>' +
          '<div class="ra-st__field"><label>Title (optional)</label><input type="text" id="ra-dl-title" value="' + escapeHtml(w.title || '') + '" placeholder="Auto-generated if empty"></div>' +
          '<div class="ra-st__field"><label>Width</label><select id="ra-dl-width"><option value="full"' + (w.width === 'full' ? ' selected' : '') + '>Full width</option><option value="half"' + (w.width !== 'full' ? ' selected' : '') + '>Half width</option></select></div>' +
          '<div class="ra-st__field"><label>Data Source (forms)</label><select id="ra-dl-forms" multiple style="height:120px;">' + formOptions + '</select><small>Hold Ctrl/Cmd to select multiple. "All forms" overrides individual selections.</small></div>' +
          '<div id="ra-dl-extra-config">' +
            '<div class="ra-st__field" id="ra-dl-days-wrap"><label>Days (for chart)</label><input type="number" id="ra-dl-days" value="' + (cfg.days || 30) + '" min="7" max="90"></div>' +
            '<div class="ra-st__field" id="ra-dl-limit-wrap"><label>Max items (for feed)</label><input type="number" id="ra-dl-limit" value="' + (cfg.limit || 15) + '" min="5" max="50"></div>' +
            '<div class="ra-st__field" id="ra-dl-field-wrap"><label>Group by field (for pie chart)</label><select id="ra-dl-field">' + fieldOptions + '</select></div>' +
            '<div class="ra-st__field" id="ra-dl-metric-wrap"><label>Metric (for single stat)</label><select id="ra-dl-metric"><option value="count"' + (cfg.metric === 'count' ? ' selected' : '') + '>Total submissions</option><option value="today"' + (cfg.metric === 'today' ? ' selected' : '') + '>Submissions today</option><option value="contributors"' + (cfg.metric === 'contributors' ? ' selected' : '') + '>Unique contributors</option></select></div>' +
            '<div class="ra-st__field" id="ra-dl-label-wrap"><label>Display label (for single stat)</label><input type="text" id="ra-dl-label" value="' + escapeHtml(cfg.label || '') + '" placeholder="e.g., Total Records"></div>' +
          '</div>' +
          '<div style="display:flex;gap:10px;margin-top:20px;">' +
            '<button class="ra-st__btn ra-st__btn--primary" id="ra-dl-modal-save">' + (isEdit ? 'Update' : 'Add') + '</button>' +
            '<button class="ra-st__btn ra-st__btn--secondary" id="ra-dl-modal-cancel">Cancel</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    document.body.appendChild(modal);
    toggleExtraConfig();

    document.getElementById('ra-dl-type').addEventListener('change', toggleExtraConfig);
    document.getElementById('ra-dl-modal-close').addEventListener('click', function () { modal.remove(); });
    document.getElementById('ra-dl-modal-cancel').addEventListener('click', function () { modal.remove(); });
    document.getElementById('ra-dl-modal-save').addEventListener('click', function () {
      var newW = {
        id: w.id,
        type: document.getElementById('ra-dl-type').value,
        title: document.getElementById('ra-dl-title').value.trim(),
        width: document.getElementById('ra-dl-width').value,
        forms: getSelectedForms(),
        config: {}
      };
      var type = newW.type;
      if (type === 'chart') newW.config.days = parseInt(document.getElementById('ra-dl-days').value) || 30;
      if (type === 'recent-feed') newW.config.limit = parseInt(document.getElementById('ra-dl-limit').value) || 15;
      if (type === 'pie-chart') newW.config.field = document.getElementById('ra-dl-field').value;
      if (type === 'single-stat') {
        newW.config.metric = document.getElementById('ra-dl-metric').value;
        newW.config.label = document.getElementById('ra-dl-label').value.trim();
      }
      if (!newW.title) {
        var td = WIDGET_TYPES.find(function (t) { return t.id === type; });
        newW.title = td ? td.label : type;
      }

      if (isEdit) {
        _currentLayout.widgets[editIdx] = newW;
      } else {
        _currentLayout.widgets.push(newW);
      }
      modal.remove();
      renderWidgetList();
    });
  }

  function getSelectedForms() {
    var sel = document.getElementById('ra-dl-forms');
    var vals = Array.from(sel.selectedOptions).map(function (o) { return o.value; });
    if (vals.indexOf('__all__') !== -1) return ['__all__'];
    return vals;
  }

  function toggleExtraConfig() {
    var type = document.getElementById('ra-dl-type').value;
    var show = function (id, visible) {
      var el = document.getElementById(id);
      if (el) el.style.display = visible ? 'block' : 'none';
    };
    show('ra-dl-days-wrap', type === 'chart');
    show('ra-dl-limit-wrap', type === 'recent-feed');
    show('ra-dl-field-wrap', type === 'pie-chart');
    show('ra-dl-metric-wrap', type === 'single-stat');
    show('ra-dl-label-wrap', type === 'single-stat');
  }

  function saveLayout() {
    var statusEl = document.getElementById('ra-st-dl-status');
    showStatus(statusEl, 'info', 'Saving layout...');

    fetch('/webhook-api/dashboard-layout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(_currentLayout)
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.error) {
          showStatus(statusEl, 'err', data.error);
        } else {
          showStatus(statusEl, 'ok', 'Dashboard layout saved! Dashboard users will see the new layout.');
        }
      })
      .catch(function () {
        showStatus(statusEl, 'err', 'Failed to save. Is the webhook-relay running?');
      });
  }

  var _gnEditingId = null; // null = adding new, string = editing existing

  function renderGeoNodeSection(main) {
    var connections = getGeoNodeSettings();

    var listHtml = '';
    if (connections.length) {
      listHtml = connections.map(function (conn) {
        var truncUrl = (conn.url || '').length > 40 ? conn.url.substring(0, 40) + '...' : (conn.url || '');
        return '<div class="ra-st__gn-conn" data-conn-id="' + escapeHtml(conn.id) + '">' +
          '<div class="ra-st__gn-conn-info">' +
            '<div class="ra-st__gn-conn-name">' + escapeHtml(conn.name || 'Unnamed') + '</div>' +
            '<div class="ra-st__gn-conn-url">' + escapeHtml(truncUrl) + '</div>' +
          '</div>' +
          '<div class="ra-st__gn-conn-actions">' +
            '<button class="ra-st__btn ra-st__btn--small" data-action="test">Test</button>' +
            '<button class="ra-st__btn ra-st__btn--small" data-action="edit">Edit</button>' +
            '<button class="ra-st__btn ra-st__btn--small ra-st__btn--danger" data-action="delete">Delete</button>' +
          '</div>' +
        '</div>';
      }).join('');
    } else {
      listHtml = '<div style="padding:16px;text-align:center;color:#999;font-size:13px;">No GeoNode connections configured yet.</div>';
    }

    main.innerHTML =
      '<h1 class="ra-st__page-title">GeoNode Connections</h1>' +
      '<div class="ra-st__content">' +
        '<div id="ra-st-gn-list">' + listHtml + '</div>' +
        '<div class="ra-st__status" id="ra-st-gn-status"></div>' +
        '<div id="ra-st-gn-form" style="display:none;">' +
          '<div class="ra-st__field"><label>Connection Name</label><input type="text" id="ra-st-gn-name" placeholder="My GeoNode"></div>' +
          '<div class="ra-st__field"><label>GeoNode URL</label><input type="url" id="ra-st-gn-url" placeholder="https://geonode.example.com"></div>' +
          '<div class="ra-st__field"><label>API Token</label><input type="text" id="ra-st-gn-token" placeholder="Optional"></div>' +
          '<div class="ra-st__field"><label>Username</label><input type="text" id="ra-st-gn-user" placeholder="Optional"></div>' +
          '<div class="ra-st__field"><label>Password</label><input type="password" id="ra-st-gn-pass"></div>' +
          '<div class="ra-st__actions">' +
            '<button class="ra-st__btn" id="ra-st-gn-cancel">Cancel</button>' +
            '<button class="ra-st__btn ra-st__btn--success" id="ra-st-gn-save-conn">Save Connection</button>' +
          '</div>' +
        '</div>' +
        '<div style="margin-top:12px;">' +
          '<button class="ra-st__btn ra-st__btn--secondary" id="ra-st-gn-add">+ Add Connection</button>' +
        '</div>' +
      '</div>';

    attachGeoNodeHandlers();
  }

  function renderExportSection(main) {
    main.innerHTML =
      '<h1 class="ra-st__page-title">Batch Export</h1>' +
      '<div class="ra-st__content">' +
        '<p style="color:#888;margin:0 0 16px;">Export data, media, and geospatial files from your forms.</p>' +

        // Export Type
        '<div class="ra-st__field">' +
          '<label>Export Type</label>' +
          '<select id="ra-st-exp-type" style="width:100%;padding:10px;font-size:14px;border:1px solid #d0d5dd;border-radius:6px;">' +
            '<option value="data">Data Export (all submission data)</option>' +
            '<option value="partial">Partial Data (select specific fields)</option>' +
            '<option value="media">Media / Images</option>' +
            '<option value="geo">Geospatial Export</option>' +
          '</select>' +
        '</div>' +

        // Export Format (changes based on type)
        '<div class="ra-st__field">' +
          '<label>Export Format</label>' +
          '<select id="ra-st-exp-format" style="width:100%;padding:10px;font-size:14px;border:1px solid #d0d5dd;border-radius:6px;">' +
            '<option value="xlsx">Excel (.xlsx)</option>' +
            '<option value="csv">CSV (.csv)</option>' +
          '</select>' +
        '</div>' +

        // Select Forms
        '<div class="ra-st__field">' +
          '<label>Select Forms to Export</label>' +
          '<div id="ra-st-exp-forms" style="border:1px solid #eee;border-radius:6px;max-height:250px;overflow-y:auto;"></div>' +
        '</div>' +

        // Field selector (shown only for partial exports)
        '<div class="ra-st__field" id="ra-st-exp-fields-wrap" style="display:none;">' +
          '<label>Select Fields to Include</label>' +
          '<div id="ra-st-exp-fields" style="border:1px solid #eee;border-radius:6px;max-height:250px;overflow-y:auto;padding:8px;"></div>' +
        '</div>' +

        // Actions
        '<div class="ra-st__actions">' +
          '<button class="ra-st__btn ra-st__btn--secondary" id="ra-st-exp-selectall">Select All Forms</button>' +
          '<button class="ra-st__btn ra-st__btn--primary" id="ra-st-exp-go">Export</button>' +
        '</div>' +
        '<div class="ra-st__status" id="ra-st-exp-status"></div>' +
      '</div>';

    loadExportForms();
    setupExportTypeHandler();
  }

  function setupExportTypeHandler() {
    var typeSelect = document.getElementById('ra-st-exp-type');
    var formatSelect = document.getElementById('ra-st-exp-format');
    var fieldsWrap = document.getElementById('ra-st-exp-fields-wrap');

    typeSelect.addEventListener('change', function () {
      var type = this.value;
      // Update format options based on type
      if (type === 'data' || type === 'partial') {
        formatSelect.innerHTML =
          '<option value="xlsx">Excel (.xlsx)</option>' +
          '<option value="csv">CSV (.csv)</option>';
      } else if (type === 'media') {
        formatSelect.innerHTML =
          '<option value="zip_images">All Images (.zip)</option>' +
          '<option value="zip_all_media">All Media Files (.zip)</option>';
      } else if (type === 'geo') {
        formatSelect.innerHTML =
          '<option value="geojson">GeoJSON (.geojson)</option>' +
          '<option value="kml">KML (.kml)</option>' +
          '<option value="csv">CSV with coordinates (.csv)</option>' +
          '<option value="gpx">GPX (.gpx)</option>';
      }
      // Show/hide field selector
      fieldsWrap.style.display = type === 'partial' ? 'block' : 'none';
    });
  }

  function loadExportForms() {
    var container = document.getElementById('ra-st-exp-forms');
    if (!container) return;
    container.innerHTML = '<div style="padding:12px;color:#999;text-align:center;">Loading forms...</div>';

    fetch('/api/v2/assets/?asset_type=survey&fields=["uid","name","deployment_status","deployment__submission_count","content"]&limit=200', { credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var forms = (data.results || []).filter(function (a) {
          return a.deployment_status === 'deployed' && (a.deployment__submission_count || 0) > 0;
        });
        if (!forms.length) {
          container.innerHTML = '<div style="padding:12px;color:#999;text-align:center;">No deployed forms with data</div>';
          return;
        }
        // Store forms data for field selection
        window._raExportForms = forms;

        container.innerHTML = forms.map(function (f) {
          return '<label style="display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid #f5f5f5;cursor:pointer;">' +
            '<input type="checkbox" value="' + f.uid + '" class="ra-exp-form-cb" style="margin:0;">' +
            '<span style="flex:1;font-size:13px;">' + escapeHtml(f.name) + '</span>' +
            '<span style="color:#999;font-size:12px;">' + (f.deployment__submission_count || 0) + '</span>' +
          '</label>';
        }).join('');

        // When a form checkbox changes, update field list for partial export
        container.addEventListener('change', function () {
          if (document.getElementById('ra-st-exp-type').value === 'partial') {
            loadFieldsForSelectedForms();
          }
        });
      });

    // Select All
    document.getElementById('ra-st-exp-selectall').addEventListener('click', function () {
      var checkboxes = container.querySelectorAll('input[type="checkbox"]');
      var allChecked = Array.from(checkboxes).every(function (c) { return c.checked; });
      checkboxes.forEach(function (c) { c.checked = !allChecked; });
      if (document.getElementById('ra-st-exp-type').value === 'partial') {
        loadFieldsForSelectedForms();
      }
    });

    // Export button
    document.getElementById('ra-st-exp-go').addEventListener('click', function () {
      var exportType = document.getElementById('ra-st-exp-type').value;
      var format = document.getElementById('ra-st-exp-format').value;
      var selected = Array.from(container.querySelectorAll('input[type="checkbox"]:checked')).map(function (c) { return c.value; });
      if (!selected.length) {
        showStatus(document.getElementById('ra-st-exp-status'), 'err', 'Select at least one form');
        return;
      }
      showStatus(document.getElementById('ra-st-exp-status'), 'info', 'Exporting ' + selected.length + ' form(s)...');

      if (exportType === 'data') {
        batchExportData(selected, format);
      } else if (exportType === 'partial') {
        var selectedFields = Array.from(document.querySelectorAll('#ra-st-exp-fields input:checked')).map(function (c) { return c.value; });
        if (!selectedFields.length) {
          showStatus(document.getElementById('ra-st-exp-status'), 'err', 'Select at least one field');
          return;
        }
        batchExportPartial(selected, format, selectedFields);
      } else if (exportType === 'media') {
        batchExportMedia(selected, format);
      } else if (exportType === 'geo') {
        batchExport(selected, format);
      }
    });
  }

  function loadFieldsForSelectedForms() {
    var fieldsContainer = document.getElementById('ra-st-exp-fields');
    var selectedUids = Array.from(document.querySelectorAll('.ra-exp-form-cb:checked')).map(function (c) { return c.value; });
    var forms = window._raExportForms || [];

    if (!selectedUids.length) {
      fieldsContainer.innerHTML = '<div style="padding:8px;color:#999;">Select a form first</div>';
      return;
    }

    // Collect all fields from selected forms
    var allFields = {};
    forms.forEach(function (f) {
      if (selectedUids.indexOf(f.uid) === -1) return;
      var survey = (f.content || {}).survey || [];
      survey.forEach(function (row) {
        var t = row.type || '';
        if (t.indexOf('begin') === 0 || t.indexOf('end') === 0 || t === 'calculate' || t === 'hidden') return;
        var name = row.name || row.$autoname || '';
        var label = (row.label && row.label[0]) || name;
        if (name && !allFields[name]) {
          allFields[name] = label;
        }
      });
    });

    // Add system fields
    var systemFields = {
      '_submitted_by': 'Submitted By',
      '_submission_time': 'Submission Time',
      '_id': 'Submission ID'
    };
    Object.keys(systemFields).forEach(function (k) { allFields[k] = systemFields[k]; });

    fieldsContainer.innerHTML = Object.keys(allFields).map(function (name) {
      return '<label style="display:flex;align-items:center;gap:6px;padding:4px 0;font-size:13px;cursor:pointer;">' +
        '<input type="checkbox" value="' + escapeHtml(name) + '" checked style="margin:0;">' +
        escapeHtml(allFields[name]) +
      '</label>';
    }).join('');

    document.getElementById('ra-st-exp-fields-wrap').style.display = 'block';
  }

  function batchExport(uids, format) {
    var statusEl = document.getElementById('ra-st-exp-status');
    var promises = uids.map(function (uid) {
      return fetch('/api/v2/assets/' + uid + '/data/?limit=30000', { credentials: 'same-origin' })
        .then(function (r) { return r.json(); })
        .then(function (data) { return { uid: uid, results: data.results || [] }; })
        .catch(function () { return { uid: uid, results: [] }; });
    });

    Promise.all(promises).then(function (allData) {
      var allFeatures = [];
      allData.forEach(function (d) {
        (d.results || []).forEach(function (sub) {
          var geo = sub._geolocation;
          if (!geo || !geo[0] || !geo[1]) return;
          var props = {};
          Object.keys(sub).forEach(function (k) {
            if (k.indexOf('_') === 0 && k !== '_submitted_by' && k !== '_submission_time') return;
            if (k === '_geolocation' || k === 'meta' || k === 'formhub') return;
            props[k] = sub[k];
          });
          props._form_uid = d.uid;
          allFeatures.push({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [parseFloat(geo[1]), parseFloat(geo[0])] },
            properties: props
          });
        });
      });

      var geojson = { type: 'FeatureCollection', features: allFeatures };
      var filename = 'batch_export_' + uids.length + '_forms';

      if (format === 'geojson') {
        downloadFile(JSON.stringify(geojson, null, 2), filename + '.geojson', 'application/geo+json');
      } else if (format === 'csv') {
        exportBatchCSV(allFeatures, filename);
      } else if (format === 'kml') {
        exportBatchKML(allFeatures, filename);
      } else if (format === 'gpx') {
        exportBatchGPX(allFeatures, filename);
      }

      showStatus(statusEl, 'ok', 'Exported ' + allFeatures.length + ' locations from ' + uids.length + ' form(s)');
    });
  }

  function downloadFile(content, filename, mime) {
    var blob = new Blob([content], { type: mime });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function exportBatchCSV(features, filename) {
    var keys = {};
    features.forEach(function (f) { Object.keys(f.properties).forEach(function (k) { keys[k] = true; }); });
    var cols = ['latitude', 'longitude'].concat(Object.keys(keys));
    var lines = [cols.join(',')];
    features.forEach(function (f) {
      var row = [f.geometry.coordinates[1], f.geometry.coordinates[0]];
      Object.keys(keys).forEach(function (k) {
        row.push('"' + String(f.properties[k] || '').replace(/"/g, '""') + '"');
      });
      lines.push(row.join(','));
    });
    downloadFile(lines.join('\n'), filename + '.csv', 'text/csv');
  }

  function exportBatchKML(features, filename) {
    var placemarks = features.map(function (f) {
      return '<Placemark><name>' + escapeHtml(f.properties._submitted_by || '') + '</name>' +
        '<Point><coordinates>' + f.geometry.coordinates[0] + ',' + f.geometry.coordinates[1] + '</coordinates></Point></Placemark>';
    }).join('\n');
    downloadFile('<?xml version="1.0"?>\n<kml xmlns="http://www.opengis.net/kml/2.2"><Document>' + placemarks + '</Document></kml>', filename + '.kml', 'application/vnd.google-earth.kml+xml');
  }

  function exportBatchGPX(features, filename) {
    var wpts = features.map(function (f) {
      return '<wpt lat="' + f.geometry.coordinates[1] + '" lon="' + f.geometry.coordinates[0] + '"><name>' + escapeHtml(f.properties._submitted_by || '') + '</name></wpt>';
    }).join('\n');
    downloadFile('<?xml version="1.0"?>\n<gpx version="1.1" creator="Ramani Yangu">' + wpts + '</gpx>', filename + '.gpx', 'application/gpx+xml');
  }

  // ── Full Data Export (Excel/CSV) ──
  function batchExportData(uids, format) {
    var statusEl = document.getElementById('ra-st-exp-status');
    var promises = uids.map(function (uid) {
      return fetch('/api/v2/assets/' + uid + '/data/?limit=30000', { credentials: 'same-origin' })
        .then(function (r) { return r.json(); })
        .then(function (data) { return { uid: uid, results: data.results || [] }; })
        .catch(function () { return { uid: uid, results: [] }; });
    });

    Promise.all(promises).then(function (allData) {
      // Collect all keys
      var allKeys = {};
      var allRows = [];
      allData.forEach(function (d) {
        d.results.forEach(function (sub) {
          var row = { _form_uid: d.uid };
          Object.keys(sub).forEach(function (k) {
            if (k === 'formhub' || k === 'meta' || k === '_attachments' || k === '_xform_id_string') return;
            row[k] = typeof sub[k] === 'object' ? JSON.stringify(sub[k]) : sub[k];
            allKeys[k] = true;
          });
          allRows.push(row);
        });
      });

      allKeys['_form_uid'] = true;
      var cols = Object.keys(allKeys);
      var filename = 'data_export_' + uids.length + '_forms';

      if (format === 'csv') {
        var lines = [cols.join(',')];
        allRows.forEach(function (row) {
          lines.push(cols.map(function (c) {
            return '"' + String(row[c] || '').replace(/"/g, '""') + '"';
          }).join(','));
        });
        downloadFile(lines.join('\n'), filename + '.csv', 'text/csv');
      } else {
        // Excel via KoboToolbox API
        if (uids.length === 1) {
          window.open('/api/v2/assets/' + uids[0] + '/exports/', '_blank');
        } else {
          // For multiple forms, export as CSV (Excel not available for batch)
          var lines2 = [cols.join(',')];
          allRows.forEach(function (row) {
            lines2.push(cols.map(function (c) {
              return '"' + String(row[c] || '').replace(/"/g, '""') + '"';
            }).join(','));
          });
          downloadFile(lines2.join('\n'), filename + '.csv', 'text/csv');
        }
      }
      showStatus(statusEl, 'ok', 'Exported ' + allRows.length + ' records from ' + uids.length + ' form(s)');
    });
  }

  // ── Partial Data Export ──
  function batchExportPartial(uids, format, fields) {
    var statusEl = document.getElementById('ra-st-exp-status');
    var promises = uids.map(function (uid) {
      return fetch('/api/v2/assets/' + uid + '/data/?limit=30000', { credentials: 'same-origin' })
        .then(function (r) { return r.json(); })
        .then(function (data) { return { uid: uid, results: data.results || [] }; })
        .catch(function () { return { uid: uid, results: [] }; });
    });

    Promise.all(promises).then(function (allData) {
      var allRows = [];
      allData.forEach(function (d) {
        d.results.forEach(function (sub) {
          var row = {};
          fields.forEach(function (f) {
            var val = sub[f];
            // Handle nested fields (group/field)
            if (val === undefined) {
              Object.keys(sub).forEach(function (k) {
                if (k.endsWith('/' + f)) val = sub[k];
              });
            }
            row[f] = typeof val === 'object' ? JSON.stringify(val) : (val || '');
          });
          allRows.push(row);
        });
      });

      var filename = 'partial_export_' + fields.length + '_fields';
      var lines = [fields.join(',')];
      allRows.forEach(function (row) {
        lines.push(fields.map(function (f) {
          return '"' + String(row[f] || '').replace(/"/g, '""') + '"';
        }).join(','));
      });
      downloadFile(lines.join('\n'), filename + '.csv', 'text/csv');
      showStatus(statusEl, 'ok', 'Exported ' + allRows.length + ' records with ' + fields.length + ' fields');
    });
  }

  // ── Media/Image Export ──
  function batchExportMedia(uids, format) {
    var statusEl = document.getElementById('ra-st-exp-status');
    var imagesOnly = format === 'zip_images';

    var promises = uids.map(function (uid) {
      return fetch('/api/v2/assets/' + uid + '/data/?fields=["_attachments","_submitted_by","_submission_time"]&limit=30000', { credentials: 'same-origin' })
        .then(function (r) { return r.json(); })
        .then(function (data) { return { uid: uid, results: data.results || [] }; })
        .catch(function () { return { uid: uid, results: [] }; });
    });

    Promise.all(promises).then(function (allData) {
      var mediaUrls = [];
      allData.forEach(function (d) {
        d.results.forEach(function (sub) {
          var attachments = sub._attachments || [];
          attachments.forEach(function (att) {
            var url = att.download_url || att.download_medium_url || att.download_small_url;
            var mime = att.mimetype || '';
            var filename = att.filename || 'unknown';
            if (imagesOnly && mime.indexOf('image') === -1) return;
            if (url) {
              mediaUrls.push({ url: url, filename: filename, mime: mime, form: d.uid });
            }
          });
        });
      });

      if (!mediaUrls.length) {
        showStatus(statusEl, 'err', 'No ' + (imagesOnly ? 'images' : 'media files') + ' found in selected forms');
        return;
      }

      // Build CSV of all media URLs for download
      var csvLines = ['filename,url,mimetype,form_uid'];
      mediaUrls.forEach(function (m) {
        csvLines.push('"' + m.filename + '","' + m.url + '","' + m.mime + '","' + m.form + '"');
      });

      // Create a results container below status
      var resultsId = 'ra-st-exp-media-results';
      var existing = document.getElementById(resultsId);
      if (existing) existing.remove();

      var resultsDiv = document.createElement('div');
      resultsDiv.id = resultsId;
      resultsDiv.style.marginTop = '12px';

      var html = '<p><strong>' + mediaUrls.length + ' ' + (imagesOnly ? 'images' : 'media files') + ' found</strong></p>' +
        '<p style="color:#666;font-size:12px;">Click each link to download, or export the full list as CSV.</p>' +
        '<div style="max-height:300px;overflow-y:auto;border:1px solid #eee;border-radius:6px;margin-top:8px;">';

      mediaUrls.forEach(function (m, i) {
        html += '<div style="padding:8px 12px;border-bottom:1px solid #f5f5f5;display:flex;align-items:center;gap:8px;">' +
          '<span style="color:#999;font-size:11px;min-width:30px;">' + (i + 1) + '.</span>' +
          '<a href="' + m.url + '" target="_blank" download style="flex:1;font-size:13px;color:#54a8dc;text-decoration:none;word-break:break-all;">' +
            escapeHtml(m.filename) +
          '</a>' +
          '<span style="color:#999;font-size:11px;">' + (m.mime.split('/')[1] || '') + '</span>' +
        '</div>';
      });

      html += '</div>' +
        '<div style="margin-top:8px;"><button class="ra-st__btn ra-st__btn--secondary" id="ra-st-exp-media-csv">Download Media List as CSV</button></div>';

      resultsDiv.innerHTML = html;
      statusEl.parentNode.insertBefore(resultsDiv, statusEl.nextSibling);

      var csvBtn = document.getElementById('ra-st-exp-media-csv');
      if (csvBtn) {
        csvBtn.addEventListener('click', function () {
          downloadFile(csvLines.join('\n'), 'media_urls_' + uids.length + '_forms.csv', 'text/csv');
        });
      }

      showStatus(statusEl, 'ok', mediaUrls.length + ' ' + (imagesOnly ? 'images' : 'media files') + ' found.');
    });
  }

  function attachGeoNodeHandlers() {
    var listEl = document.getElementById('ra-st-gn-list');
    var formEl = document.getElementById('ra-st-gn-form');
    var statusEl = document.getElementById('ra-st-gn-status');

    // Connection list: Test / Edit / Delete buttons (delegated)
    listEl.addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-action]');
      if (!btn) return;
      var connEl = btn.closest('.ra-st__gn-conn');
      if (!connEl) return;
      var connId = connEl.getAttribute('data-conn-id');
      var connections = getGeoNodeSettings();
      var conn = connections.find(function (c) { return c.id === connId; });
      if (!conn) return;

      var action = btn.getAttribute('data-action');

      if (action === 'test') {
        showStatus(statusEl, 'info', 'Testing "' + (conn.name || 'Unnamed') + '"...');
        testGeoNodeConnection(conn).then(function (result) {
          if (result.ok) {
            showStatus(statusEl, 'ok', '"' + (conn.name || 'Unnamed') + '": Connected! Found ' + (result.count || '?') + ' layers.');
          } else {
            showStatus(statusEl, 'err', '"' + (conn.name || 'Unnamed') + '": ' + result.error);
          }
        });
      } else if (action === 'edit') {
        _gnEditingId = connId;
        document.getElementById('ra-st-gn-name').value = conn.name || '';
        document.getElementById('ra-st-gn-url').value = conn.url || '';
        document.getElementById('ra-st-gn-token').value = conn.token || '';
        document.getElementById('ra-st-gn-user').value = conn.username || '';
        document.getElementById('ra-st-gn-pass').value = conn.password || '';
        formEl.style.display = 'block';
      } else if (action === 'delete') {
        if (!confirm('Delete connection "' + (conn.name || 'Unnamed') + '"?')) return;
        var updated = connections.filter(function (c) { return c.id !== connId; });
        saveGeoNodeSettings(updated);
        showStatus(statusEl, 'ok', 'Connection deleted.');
        renderGeoNodeSection(document.getElementById('ra-st-main'));
      }
    });

    // Add Connection button
    document.getElementById('ra-st-gn-add').addEventListener('click', function () {
      _gnEditingId = null;
      document.getElementById('ra-st-gn-name').value = '';
      document.getElementById('ra-st-gn-url').value = '';
      document.getElementById('ra-st-gn-token').value = '';
      document.getElementById('ra-st-gn-user').value = '';
      document.getElementById('ra-st-gn-pass').value = '';
      formEl.style.display = 'block';
    });

    // Cancel button
    document.getElementById('ra-st-gn-cancel').addEventListener('click', function () {
      formEl.style.display = 'none';
      _gnEditingId = null;
    });

    // Save Connection button
    document.getElementById('ra-st-gn-save-conn').addEventListener('click', function () {
      var name = document.getElementById('ra-st-gn-name').value.trim();
      var url = document.getElementById('ra-st-gn-url').value.trim();
      if (!url) {
        showStatus(statusEl, 'err', 'GeoNode URL is required.');
        return;
      }
      var connData = {
        id: _gnEditingId || generateId(),
        name: name || 'GeoNode',
        url: url,
        token: document.getElementById('ra-st-gn-token').value.trim(),
        username: document.getElementById('ra-st-gn-user').value.trim(),
        password: document.getElementById('ra-st-gn-pass').value.trim()
      };

      var connections = getGeoNodeSettings();
      if (_gnEditingId) {
        for (var i = 0; i < connections.length; i++) {
          if (connections[i].id === _gnEditingId) {
            connections[i] = connData;
            break;
          }
        }
      } else {
        connections.push(connData);
      }
      saveGeoNodeSettings(connections);
      _gnEditingId = null;
      showStatus(statusEl, 'ok', 'Connection "' + connData.name + '" saved.');
      renderGeoNodeSection(document.getElementById('ra-st-main'));
    });
  }

  function testGeoNodeConnection(settings) {
    var baseUrl = (settings.url || DEFAULT_GEONODE_URL).replace(/\/+$/, '');
    var auth = '';
    if (settings.token) {
      auth = settings.token.indexOf(' ') !== -1 ? settings.token : 'Bearer ' + settings.token;
    } else if (settings.username && settings.password) {
      auth = 'Basic ' + btoa(settings.username + ':' + settings.password);
    }

    // Use server-side proxy (geonode-sync service) to avoid CORS issues
    var params = 'url=' + encodeURIComponent(baseUrl);
    if (settings.token) params += '&token=' + encodeURIComponent(settings.token);
    if (settings.username) params += '&username=' + encodeURIComponent(settings.username);
    if (settings.password) params += '&password=' + encodeURIComponent(settings.password);
    var proxyUrl = '/geonode-proxy/?' + params;

    return fetch(proxyUrl)
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (data) {
        // Response comes from geonode-sync service: {ok: bool, count: N, error: str}
        return data;
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

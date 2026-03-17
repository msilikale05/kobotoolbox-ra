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

    /* Dashboard nav icon */
    '#ra-dashadmin-nav {',
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
    '#ra-dashadmin-nav:hover { color: #54a8dc; }',
    '#ra-dashadmin-nav.active { color: #54a8dc; border-left-color: #54a8dc; }',
    '#ra-dashadmin-nav svg { width: 26px; height: 26px; fill: currentColor; }',

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
    '  width: 212px;',
    '  flex-shrink: 0;',
    '  background: #fff;',
    '  box-shadow: 0 0 8px 0 rgba(51,56,71,0.06), 0 8px 8px 0 rgba(51,56,71,0.12);',
    '  padding-top: 10px;',
    '  overflow-y: auto;',
    '  z-index: 2;',
    '  position: relative;',
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
    '  background: #edeef2;',
    '}',
    '.ra-st__page-title {',
    '  font-size: 24px;',
    '  font-weight: 700;',
    '  color: #333847;',
    '  padding: 30px 30px 0;',
    '  margin: 0 0 15px;',
    '  font-family: Roboto, sans-serif;',
    '}',
    '.ra-st__content {',
    '  padding: 0 30px 60px;',
    '  max-width: none;',
    '}',

    /* White card boxes for content sections */
    '.ra-st__box {',
    '  background: #fff; border: 1px solid #e1e3ea; border-radius: 4px;',
    '  padding: 24px; margin-bottom: 20px;',
    '}',
    '.ra-st__section-title {',
    '  font-size: 16px;',
    '  font-weight: 700;',
    '  color: #333847;',
    '  margin: 0 0 6px;',
    '}',
    '.ra-st__section-desc {',
    '  font-size: 13px; color: #64748b; margin: 0 0 20px;',
    '}',
    '.ra-st__card--open .ra-st__card-arrow { transform: rotate(90deg); }',
    '.ra-st__card-body {',
    '  padding: 0 16px 16px;',
    '  display: none;',
    '}',
    '.ra-st__card--open .ra-st__card-body { display: block; }',

    /* Form fields */
    '.ra-st__field { margin-bottom: 16px; }',
    '.ra-st__field label {',
    '  display: block; font-size: 13px; font-weight: 600;',
    '  color: #333847; margin-bottom: 6px;',
    '}',
    '.ra-st__field input, .ra-st__field select {',
    '  width: 100%; padding: 10px 12px; font-size: 14px;',
    '  border: 1px solid #e1e3ea; border-radius: 4px;',
    '  box-sizing: border-box; background: #fff; color: #333847;',
    '}',
    '.ra-st__field input:focus, .ra-st__field select:focus {',
    '  outline: none; border-color: #2095f3;',
    '  box-shadow: 0 0 0 3px rgba(32,149,243,0.12);',
    '}',
    '.ra-st__field small { color: #94a3b8; font-size: 12px; margin-top: 4px; display: block; }',
    '.ra-st__actions { display: flex; gap: 10px; margin-top: 20px; }',
    '.ra-st__btn {',
    '  padding: 10px 20px; border: 1px solid transparent; border-radius: 4px;',
    '  font-size: 13px; font-weight: 600; cursor: pointer;',
    '  transition: all 0.15s; box-shadow: 0 1px 2px rgba(0,0,0,0.06);',
    '}',
    '.ra-st__btn--primary { background: #2095f3; color: #fff; border-color: #2095f3; }',
    '.ra-st__btn--primary:hover { background: #1977c2; border-color: #1977c2; }',
    '.ra-st__btn--secondary { background: #fff; color: #333847; border-color: #e1e3ea; }',
    '.ra-st__btn--secondary:hover { background: #f5f6f8; border-color: #c8cad0; }',
    '.ra-st__btn--success { background: #10b981; color: #fff; border-color: #10b981; }',
    '.ra-st__btn--success:hover { background: #059669; border-color: #059669; }',

    /* Status messages */
    '.ra-st__status {',
    '  margin-top: 12px; padding: 10px 14px; border-radius: 4px;',
    '  font-size: 13px; display: none; border: 1px solid transparent;',
    '}',
    '.ra-st__status--ok { display: block; background: #ecfdf5; color: #065f46; border-color: #a7f3d0; }',
    '.ra-st__status--err { display: block; background: #fef2f2; color: #991b1b; border-color: #fecaca; }',
    '.ra-st__status--info { display: block; background: #eff6ff; color: #1e40af; border-color: #bfdbfe; }',

    /* GeoNode connection list */
    '.ra-st__gn-conn { display: flex; align-items: center; padding: 14px 16px; background: #fff; border: 1px solid #e1e3ea; border-radius: 4px; margin-bottom: 10px; }',
    '.ra-st__gn-conn-info { flex: 1; min-width: 0; }',
    '.ra-st__gn-conn-name { font-weight: 600; font-size: 14px; color: #333847; }',
    '.ra-st__gn-conn-url { font-size: 12px; color: #94a3b8; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }',
    '.ra-st__gn-conn-actions { display: flex; gap: 6px; flex-shrink: 0; }',
    '.ra-st__btn--small { padding: 6px 12px; font-size: 12px; }',
    '.ra-st__btn--danger { color: #dc2626; border-color: #fecaca; background: #fef2f2; }',
    '.ra-st__btn--danger:hover { background: #fee2e2; border-color: #fca5a5; }',

    /* Popup modal overlay */
    '.ra-st__popup-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 9999; display: flex; align-items: center; justify-content: center; }',
    '.ra-st__popup { background: #fff; border-radius: 12px; width: 480px; max-height: 85vh; display: flex; flex-direction: column; box-shadow: 0 12px 40px rgba(0,0,0,0.3); }',
    '.ra-st__popup-header { padding: 16px 20px; border-bottom: 1px solid #eee; display: flex; align-items: center; justify-content: space-between; }',
    '.ra-st__popup-header h3 { margin: 0; font-size: 16px; color: #1a2a3a; }',
    '.ra-st__popup-close { background: none; border: none; font-size: 22px; cursor: pointer; color: #999; padding: 4px 8px; }',
    '.ra-st__popup-close:hover { color: #333; }',
    '.ra-st__popup-body { padding: 16px 20px; overflow-y: auto; flex: 1; }',
    '.ra-st__popup-body .ra-st__field { margin-bottom: 12px; }',
    '.ra-st__popup-body label { display: block; font-size: 12px; font-weight: 600; color: #555; margin-bottom: 4px; }',
    '.ra-st__popup-body input, .ra-st__popup-body select { width: 100%; padding: 8px 10px; font-size: 13px; border: 1px solid #d0d5dd; border-radius: 6px; box-sizing: border-box; }',
    '.ra-st__popup-footer { padding: 12px 20px; border-top: 1px solid #eee; display: flex; justify-content: flex-end; gap: 8px; }',

    /* Coming soon placeholder */
    '.ra-st__coming-soon {',
    '  padding: 20px;',
    '  text-align: center;',
    '  color: #bbb;',
    '  font-size: 13px;',
    '  font-style: italic;',
    '}',

    /* Tab bar — matches KoboToolbox form-view tabs */
    '.ra-st__tabs {',
    '  display: flex;',
    '  background: #f5f5f5;',
    '  border-bottom: 1px solid #e8e8e8;',
    '  margin: 0;',
    '  padding: 0 30px;',
    '}',
    '.ra-st__tab {',
    '  padding: 14px 24px;',
    '  font-size: 13px;',
    '  font-weight: 500;',
    '  color: #888;',
    '  cursor: pointer;',
    '  border: none;',
    '  border-bottom: 3px solid transparent;',
    '  margin-bottom: -1px;',
    '  transition: color 0.15s, border-color 0.15s, background 0.15s;',
    '  background: none;',
    '  text-transform: uppercase;',
    '  letter-spacing: 0.5px;',
    '  font-family: Roboto, sans-serif;',
    '}',
    '.ra-st__tab:hover { color: #555; background: rgba(0,0,0,0.02); }',
    '.ra-st__tab.active {',
    '  color: #54a8dc;',
    '  border-bottom-color: #54a8dc;',
    '  font-weight: 700;',
    '  background: #fff;',
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
  // Working sections first, coming soon at the bottom
  var SECTIONS = [
    { id: 'geonode', label: 'Data Sources', icon: '<svg viewBox="0 0 24 24"><path d="M20 13H4c-.55 0-1 .45-1 1v6c0 .55.45 1 1 1h16c.55 0 1-.45 1-1v-6c0-.55-.45-1-1-1zM7 19c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM20 3H4c-.55 0-1 .45-1 1v6c0 .55.45 1 1 1h16c.55 0 1-.45 1-1V4c0-.55-.45-1-1-1zM7 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/></svg>' },
    { id: 'export', label: 'Batch Export', icon: '<svg viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>' },
    { id: 'announcements', label: 'Announcements', icon: '<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 9h-2V5h2v6zm0 4h-2v-2h2v2z"/></svg>' },
    { id: '_divider' },
    { id: 'assignments', label: 'Assignments', icon: '<svg viewBox="0 0 24 24"><path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>', comingSoon: true },
    { id: 'teams', label: 'Teams', icon: '<svg viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>', comingSoon: true },
    { id: 'map', label: 'Map Defaults', icon: '<svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>', comingSoon: true },
    { id: 'notifications', label: 'Notifications', icon: '<svg viewBox="0 0 24 24"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>', comingSoon: true },
    { id: 'scheduler', label: 'Form Scheduler', icon: '<svg viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>', comingSoon: true },
    { id: 'tags', label: 'Project Tags', icon: '<svg viewBox="0 0 24 24"><path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z"/></svg>', comingSoon: true }
  ];

  // Restore active section from sessionStorage (survives refresh)
  var activeSection = 'geonode';
  try { activeSection = sessionStorage.getItem('ra_settings_section') || 'geonode'; } catch (e) {}
  if (activeSection === 'dashboard') activeSection = 'geonode'; // migrated to standalone page
  var activeDashTab = 'users';
  try { activeDashTab = sessionStorage.getItem('ra_dash_tab') || 'users'; } catch (e) {}

  // ── Page ──
  function createPage() {
    if (document.getElementById(PAGE_ID)) return;

    var page = document.createElement('div');
    page.id = PAGE_ID;

    // Build sidebar submenu items
    var sidebarItems = SECTIONS.map(function (s) {
      if (s.id === '_divider') return '<div style="border-top:1px solid #e1e3ea;margin:8px 16px;"></div>';
      var cls = s.id === activeSection ? ' active' : '';
      var badge = s.comingSoon ? '<span style="font-size:9px;background:#e1e3ea;color:#94a3b8;padding:2px 6px;border-radius:3px;margin-left:auto;white-space:nowrap;">SOON</span>' : '';
      return '<div class="ra-st__sidebar-item' + cls + '" data-section="' + s.id + '"' + (s.comingSoon ? ' style="opacity:0.6;"' : '') + '>' +
        s.icon + '<span>' + s.label + '</span>' + badge + '</div>';
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
      try { sessionStorage.setItem('ra_settings_section', activeSection); } catch (e) {}
      page.querySelectorAll('.ra-st__sidebar-item').forEach(function (el) { el.classList.remove('active'); });
      item.classList.add('active');
      renderSection(activeSection);
    });

    renderSection(activeSection);
  }

  function renderSection(sectionId) {
    var main = document.getElementById('ra-st-main');
    if (!main) return;

    if (sectionId === 'geonode') renderGeoNodeSection(main);
    else if (sectionId === 'export') renderExportSection(main);
    else if (sectionId === 'map') renderComingSoon(main, 'Map Defaults', 'Default map center, zoom level, and base layer settings.');
    else if (sectionId === 'notifications') renderComingSoon(main, 'Notifications', 'Configure submission alerts and notification preferences.');
    else if (sectionId === 'scheduler') { if (window.raSettingsExtras) window.raSettingsExtras.renderScheduler(main); else renderComingSoon(main, 'Form Scheduler', 'Loading...'); }
    else if (sectionId === 'tags') { if (window.raSettingsExtras) window.raSettingsExtras.renderTags(main); else renderComingSoon(main, 'Project Tags', 'Loading...'); }
    else if (sectionId === 'assignments') renderAssignmentsSection(main);
    else if (sectionId === 'announcements') renderAnnouncementsSection(main);
    else if (sectionId === 'teams') renderTeamsSection(main);
  }

  function renderComingSoon(main, title, desc) {
    main.innerHTML = '<h1 class="ra-st__page-title">' + title + '</h1>' +
      '<div class="ra-st__content"><div class="ra-st__box" style="text-align:center;padding:48px 24px;">' +
      '<svg viewBox="0 0 24 24" style="width:40px;height:40px;fill:#c8cad0;margin-bottom:12px;"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>' +
      '<p style="color:#64748b;font-size:14px;margin:0 0 4px;">' + desc + '</p>' +
      '<p style="color:#94a3b8;font-size:13px;font-style:italic;margin:0;">Coming soon</p></div></div>';
  }

  // ── Multi-Dashboard Management ──
  var _allKoboUsers = null;
  var _dashConfig = null;  // { dashboards: {}, users: {} }

  var WIDGET_TYPES = [
    { id: 'stat-cards', label: 'Summary Cards', desc: 'Overview numbers: forms, submissions, today, contributors', group: 'General' },
    { id: 'chart', label: 'Submissions Chart', desc: 'Bar chart of submissions over time', group: 'General' },
    { id: 'form-table', label: 'Forms Table', desc: 'List of forms with submission counts', group: 'General' },
    { id: 'recent-feed', label: 'Recent Submissions', desc: 'Latest submissions with user and time', group: 'General' },
    { id: 'pie-chart', label: 'Pie Chart', desc: 'Breakdown by a field value', group: 'General' },
    { id: 'single-stat', label: 'Single Metric', desc: 'One number from a form field with aggregation (sum, avg, min, max)', group: 'General' },
    { id: 'submissions-by-hour', label: 'Submissions by Hour', desc: 'What time of day forms are submitted most', group: 'General' },
    { id: 'field-number', label: 'Number Field', desc: 'Sum, average, min, or max of a numeric field', group: 'Field Data' },
    { id: 'field-text-list', label: 'Text Values', desc: 'Unique values from a text field with counts', group: 'Field Data' },
    { id: 'field-select-bar', label: 'Choices Bar Chart', desc: 'Horizontal bar chart of select field choices', group: 'Field Data' },
    { id: 'field-counter', label: 'Conditional Counter', desc: 'Count submissions where a field matches a condition', group: 'Field Data' },
    { id: 'field-latest', label: 'Latest Value', desc: 'Most recent value of a specific field', group: 'Field Data' },
    { id: 'field-timeline', label: 'Field Timeline', desc: 'Line chart of a numeric field over time', group: 'Field Data' },
    { id: 'submissions-by-form', label: 'Submissions by Form', desc: 'Horizontal bar chart comparing submission counts across forms', group: 'KoboToolbox' },
    { id: 'top-contributors', label: 'Top Contributors', desc: 'Leaderboard of users with most submissions', group: 'KoboToolbox' },
    { id: 'submissions-by-day', label: 'Submissions by Day of Week', desc: 'When submissions happen most (Mon-Sun)', group: 'KoboToolbox' },
    { id: 'avg-per-day', label: 'Average Per Day', desc: 'Average number of submissions per day', group: 'KoboToolbox' },
    { id: 'submissions-period', label: 'Submissions by Period', desc: 'Tabbed chart: 7 days, 31 days, 3 months, 12 months (like KoboToolbox)', group: 'KoboToolbox' },
    { id: 'geo-coverage', label: 'Geographic Coverage', desc: 'Mini map showing submission locations', group: 'KoboToolbox' },
    { id: 'form-status', label: 'Form Status Overview', desc: 'Deployed, draft, and archived form counts', group: 'KoboToolbox' },
    { id: 'info-text', label: 'Info / Contact Card', desc: 'Rich text with formatting — add contact details, instructions, or announcements', group: 'General' }
  ];

  var _layoutForms = null;
  var _selectedDashboardId = 'default';

  // Try nginx proxy first, fall back to localhost:5050 for local dev
  var _apiBase = '/webhook-api';

  function apiUrl(path) { return _apiBase + path; }

  function loadDashConfig(cb) {
    fetch(apiUrl('/dashboard-config'), { credentials: 'same-origin' })
      .then(function (r) {
        if (!r.ok) throw new Error('not ok');
        return r.json();
      })
      .then(function (data) {
        _dashConfig = data;
        if (!_dashConfig.dashboards) _dashConfig.dashboards = {};
        if (!_dashConfig.users) _dashConfig.users = {};
        if (cb) cb();
      })
      .catch(function () {
        // Try local dev fallback
        if (_apiBase === '/webhook-api') {
          _apiBase = 'http://localhost:5050/api';
          return loadDashConfig(cb);
        }
        _dashConfig = { dashboards: {}, users: {} };
        _dashConfig._loadFailed = true;  // Mark as failed load — prevent saves from wiping data
        if (cb) cb();
      });
  }

  function saveDashConfig(cb) {
    // Never save if config failed to load — prevents wiping existing data
    if (_dashConfig && _dashConfig._loadFailed) {
      if (cb) cb('Config not loaded properly. Refresh the page and try again.');
      return;
    }
    fetch(apiUrl('/dashboard-config'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(_dashConfig)
    })
      .then(function (r) { return r.json(); })
      .then(function (data) { if (cb) cb(data.error || null); })
      .catch(function () { if (cb) cb('Failed to save. Is the webhook-relay running?'); });
  }

  function getDashboardNames() {
    if (!_dashConfig || !_dashConfig.dashboards) return [];
    return Object.keys(_dashConfig.dashboards).map(function (id) {
      return { id: id, name: (_dashConfig.dashboards[id] && _dashConfig.dashboards[id].name) || id };
    });
  }

  // ── Dashboard Section (unified with tabs) ──
  function renderDashboardSection(main) {
    main.innerHTML =
      '<h1 class="ra-st__page-title">Dashboard</h1>' +
      '<div class="ra-st__tabs" id="ra-st-dash-tabs">' +
        '<button class="ra-st__tab' + (activeDashTab === 'users' ? ' active' : '') + '" data-tab="users">Assigned Users</button>' +
        '<button class="ra-st__tab' + (activeDashTab === 'layout' ? ' active' : '') + '" data-tab="layout">Layout</button>' +
      '</div>' +
      '<div id="ra-st-dash-content"></div>';

    document.getElementById('ra-st-dash-tabs').addEventListener('click', function (e) {
      var tab = e.target.closest('.ra-st__tab');
      if (!tab) return;
      activeDashTab = tab.getAttribute('data-tab');
      try { sessionStorage.setItem('ra_dash_tab', activeDashTab); } catch (e) {}
      document.querySelectorAll('#ra-st-dash-tabs .ra-st__tab').forEach(function (t) { t.classList.remove('active'); });
      tab.classList.add('active');
      renderDashTabContent();
    });

    renderDashTabContent();
  }

  function renderDashTabContent() {
    var container = document.getElementById('ra-da-content') || document.getElementById('ra-st-dash-content');
    if (!container) return;

    if (activeDashTab === 'users') renderDashUsersTab(container);
    else if (activeDashTab === 'layout') renderDashLayoutTab(container);
  }

  // ── Users Tab ──
  function renderDashUsersTab(container) {
    container.innerHTML =
      '<div class="ra-st__content" style="max-width:none;">' +
        // Assign user box
        '<div class="ra-st__box">' +
          '<div class="ra-st__section-title">Assign User to Dashboard</div>' +
          '<p class="ra-st__section-desc">' +
            'Users added here will <strong>only see their assigned dashboard</strong> when they log in. ' +
            'They cannot access forms, data, or settings.' +
          '</p>' +
          '<div class="ra-st__field">' +
            '<label>User</label>' +
            '<div style="display:flex;gap:10px;flex-wrap:wrap;">' +
              '<select id="ra-st-du-select" class="ra-st__field" style="flex:1;min-width:200px;padding:10px 12px;font-size:14px;border:1px solid #e1e3ea;border-radius:4px;background:#fff;margin:0;">' +
                '<option value="">Loading users...</option>' +
              '</select>' +
              '<select id="ra-st-du-dash-select" class="ra-st__field" style="width:220px;padding:10px 12px;font-size:14px;border:1px solid #e1e3ea;border-radius:4px;background:#fff;margin:0;">' +
                '<option value="">Loading...</option>' +
              '</select>' +
              '<button class="ra-st__btn ra-st__btn--primary" id="ra-st-du-add">Add</button>' +
            '</div>' +
            '<small>Select a user and the dashboard to assign them to</small>' +
          '</div>' +
          '<div class="ra-st__status" id="ra-st-du-status"></div>' +
        '</div>' +

        // Current users box
        '<div class="ra-st__box">' +
          '<div class="ra-st__section-title">Current Dashboard Users</div>' +
          '<p class="ra-st__section-desc">Users currently assigned to dashboards. Remove a user to give them full KoboToolbox access.</p>' +
          '<div id="ra-st-du-list">' +
            '<div style="padding:16px;text-align:center;color:#94a3b8;font-size:13px;">Loading...</div>' +
          '</div>' +
        '</div>' +

        // Info box
        '<div style="padding:16px 20px;background:#eff6ff;border-radius:4px;border:1px solid #bfdbfe;">' +
          '<p style="margin:0;font-size:13px;color:#1e40af;">' +
            '<strong>How it works:</strong> Create users via normal KoboToolbox registration, ' +
            'then add them here and assign a dashboard. They will only see their assigned dashboard. ' +
            'Use the <strong>Dashboards</strong> tab to create and customize dashboards.' +
          '</p>' +
        '</div>' +
      '</div>';

    loadDashConfig(function () {
      loadKoboUsers();
      loadDashboardUsers();
      populateDashboardDropdown();
    });

    document.getElementById('ra-st-du-add').addEventListener('click', function () {
      var select = document.getElementById('ra-st-du-select');
      var dashSelect = document.getElementById('ra-st-du-dash-select');
      var username = select ? select.value : '';
      var dashId = dashSelect ? dashSelect.value : '';

      // Check for text input fallback
      if (!username) {
        var input = document.getElementById('ra-st-du-input');
        if (input) username = (input.value || '').trim();
      }
      if (!username) {
        showStatus(document.getElementById('ra-st-du-status'), 'err', 'Select a user first');
        return;
      }
      if (!dashId) {
        showStatus(document.getElementById('ra-st-du-status'), 'err', 'Select a dashboard to assign');
        return;
      }
      addDashboardUser(username, dashId);
    });
  }

  function populateDashboardDropdown() {
    var sel = document.getElementById('ra-st-du-dash-select');
    if (!sel) return;
    var names = getDashboardNames();
    if (!names.length) {
      sel.innerHTML = '<option value="">-- No dashboards created yet --</option>';
      return;
    }
    sel.innerHTML = '<option value="">-- Select a dashboard --</option>' +
      names.map(function (d) {
        return '<option value="' + escapeHtml(d.id) + '">' + escapeHtml(d.name) + '</option>';
      }).join('');
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
        select.parentNode.innerHTML =
          '<input type="text" id="ra-st-du-input" placeholder="Type username to add" ' +
            'style="flex:1;padding:10px 12px;font-size:14px;border:1px solid #d0d5dd;border-radius:6px;">' +
          '<select id="ra-st-du-dash-select" style="width:200px;padding:10px 12px;font-size:14px;border:1px solid #d0d5dd;border-radius:6px;background:#fff;">' +
            '<option value="">Loading...</option>' +
          '</select>' +
          '<button class="ra-st__btn ra-st__btn--primary" id="ra-st-du-add">Add</button>';
        populateDashboardDropdown();

        document.getElementById('ra-st-du-add').addEventListener('click', function () {
          var input = document.getElementById('ra-st-du-input');
          var dashSelect = document.getElementById('ra-st-du-dash-select');
          var username = (input.value || '').trim();
          var dashId = dashSelect ? dashSelect.value : '';
          if (!username) {
            showStatus(document.getElementById('ra-st-du-status'), 'err', 'Enter a username');
            return;
          }
          if (!dashId) {
            showStatus(document.getElementById('ra-st-du-status'), 'err', 'Select a dashboard');
            return;
          }
          addDashboardUser(username, dashId);
          input.value = '';
        });
      });
  }

  function updateUserDropdown() {
    var select = document.getElementById('ra-st-du-select');
    if (!select || !_allKoboUsers) return;

    var dashUsers = (_dashConfig && _dashConfig.users) ? _dashConfig.users : {};
    var available = _allKoboUsers.filter(function (u) {
      return !dashUsers[u.username];
    });

    if (!available.length) {
      select.innerHTML = '<option value="">All users are already assigned</option>';
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
  }

  function getUserDisplayInfo(username) {
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
    if (!listEl || !_dashConfig) return;

    var users = _dashConfig.users || {};
    var usernames = Object.keys(users);
    if (!usernames.length) {
      listEl.innerHTML = '<div style="padding:16px;text-align:center;color:#999;font-size:13px;">No dashboard users configured yet. Select a user above to add them.</div>';
      return;
    }
    var allDashNames = getDashboardNames();
    listEl.innerHTML = usernames.map(function (u) {
      var dashId = users[u];
      var info = getUserDisplayInfo(u);
      var subtitle = [info.name, info.org].filter(function (s) { return s; }).join(' - ');
      var dashOptions = allDashNames.map(function (d) {
        var selected = (d.id === dashId) ? ' selected' : '';
        return '<option value="' + escapeHtml(d.id) + '"' + selected + '>' + escapeHtml(d.name) + '</option>';
      }).join('');
      return '<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-bottom:1px solid #f5f5f5;">' +
        '<div style="display:flex;align-items:center;gap:10px;">' +
          '<img src="/webhook-api/avatar/' + escapeHtml(u) + '" style="width:36px;height:36px;border-radius:50%;object-fit:cover;" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\';">' +
          '<div style="width:36px;height:36px;border-radius:50%;background:#e0f2fe;color:#0284c7;display:none;align-items:center;justify-content:center;font-weight:700;font-size:15px;">' +
            escapeHtml(u.charAt(0).toUpperCase()) +
          '</div>' +
          '<div>' +
            '<div style="font-size:14px;font-weight:600;color:#1e293b;">' + escapeHtml(u) + '</div>' +
            (subtitle ? '<div style="font-size:12px;color:#94a3b8;">' + escapeHtml(subtitle) + '</div>' : '') +
          '</div>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:8px;">' +
          '<select class="ra-st-du-reassign" data-user="' + escapeHtml(u) + '" ' +
            'style="padding:6px 10px;font-size:12px;border:1px solid #e1e3ea;border-radius:4px;background:#fff;min-width:140px;">' +
            dashOptions +
          '</select>' +
          '<button class="ra-st__btn ra-st__btn--secondary ra-st-du-remove" data-user="' + escapeHtml(u) + '" ' +
            'style="padding:6px 12px;font-size:12px;color:#e74c3c;">Remove</button>' +
        '</div>' +
      '</div>';
    }).join('');

    listEl.querySelectorAll('.ra-st-du-reassign').forEach(function (sel) {
      sel.addEventListener('change', function () {
        var username = this.getAttribute('data-user');
        var newDashId = this.value;
        if (username && newDashId) {
          reassignDashboardUser(username, newDashId);
        }
      });
    });

    listEl.querySelectorAll('.ra-st-du-remove').forEach(function (btn) {
      btn.addEventListener('click', function () {
        removeDashboardUser(this.getAttribute('data-user'));
      });
    });
  }

  function addDashboardUser(username, dashboardId) {
    var statusEl = document.getElementById('ra-st-du-status');
    showStatus(statusEl, 'info', 'Adding user...');

    if (!_dashConfig) _dashConfig = { dashboards: {}, users: {} };
    _dashConfig.users[username] = dashboardId;

    saveDashConfig(function (err) {
      if (err) {
        showStatus(statusEl, 'err', err);
      } else {
        showStatus(statusEl, 'ok', '"' + username + '" assigned to dashboard "' + dashboardId + '"');
        loadDashboardUsers();
        updateUserDropdown();
      }
    });
  }

  function removeDashboardUser(username) {
    var statusEl = document.getElementById('ra-st-du-status');
    showStatus(statusEl, 'info', 'Removing user...');

    if (_dashConfig && _dashConfig.users) {
      delete _dashConfig.users[username];
    }

    saveDashConfig(function (err) {
      if (err) {
        showStatus(statusEl, 'err', err);
      } else {
        showStatus(statusEl, 'ok', '"' + username + '" removed from dashboard users');
        loadDashboardUsers();
        updateUserDropdown();
      }
    });
  }

  function reassignDashboardUser(username, newDashId) {
    var statusEl = document.getElementById('ra-st-du-status');
    var dashName = (_dashConfig.dashboards && _dashConfig.dashboards[newDashId] && _dashConfig.dashboards[newDashId].name) ? _dashConfig.dashboards[newDashId].name : newDashId;
    showStatus(statusEl, 'info', 'Reassigning...');

    if (!_dashConfig) _dashConfig = { dashboards: {}, users: {} };
    _dashConfig.users[username] = newDashId;

    saveDashConfig(function (err) {
      if (err) {
        showStatus(statusEl, 'err', err);
      } else {
        showStatus(statusEl, 'ok', '"' + username + '" reassigned to "' + dashName + '"');
      }
    });
  }

  // ── Layout Tab ──
  var _editingDashboardId = null;
  try { _editingDashboardId = sessionStorage.getItem("ra_editing_dashboard") || null; } catch (e) {}

  function renderDashLayoutTab(container) {
    if (_editingDashboardId) {
      renderDashboardEditor(container, _editingDashboardId);
      return;
    }
    renderDashboardList(container);
  }

  // ── Dashboard List View ──
  function renderDashboardList(container) {
    container.innerHTML =
      '<div class="ra-st__content" style="max-width:none;">' +
        '<p style="color:#64748b;margin:0 0 16px;font-size:13px;">' +
          'Create and manage dashboards. Each dashboard has its own widget layout. ' +
          'Assign users to dashboards in the <strong>Users</strong> tab.' +
        '</p>' +
        '<div class="ra-st__status" id="ra-st-dl-status"></div>' +
        '<div id="ra-st-dl-dash-list"></div>' +
      '</div>';

    loadDashConfig(function () {
      renderDashCards();
      // Load forms list first, then fetch content for each form
      fetch('/api/v2/assets/?asset_type=survey&fields=["uid","name","deployment_status","deployment__submission_count"]&limit=200', { credentials: 'same-origin' })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          _layoutForms = (data.results || []).filter(function (f) { return f.deployment_status === 'deployed'; });
          // Fetch content for each form individually (list endpoint doesn't include content)
          var contentPromises = _layoutForms.map(function (f) {
            return fetch('/api/v2/assets/' + f.uid + '/?fields=["content"]', { credentials: 'same-origin' })
              .then(function (r) { return r.ok ? r.json() : {}; })
              .then(function (detail) { f.content = detail.content || {}; })
              .catch(function () { f.content = {}; });
          });
          return Promise.all(contentPromises);
        })
        .catch(function () { _layoutForms = []; });
    });
  }

  function renderDashCards() {
    var listEl = document.getElementById('ra-st-dl-dash-list');
    if (!listEl) return;

    var names = getDashboardNames();
    if (!names.length) {
      listEl.innerHTML = '<div style="padding:32px;text-align:center;color:#94a3b8;border:2px dashed #e2e8f0;border-radius:8px;">' +
        '<p style="font-size:14px;margin:0 0 8px;">No dashboards created yet</p>' +
        '<p style="font-size:12px;margin:0;">Click "+ New Dashboard" to get started.</p></div>';
      return;
    }

    listEl.innerHTML = names.map(function (d) {
      var userCount = 0;
      if (_dashConfig && _dashConfig.users) {
        Object.keys(_dashConfig.users).forEach(function (u) {
          if (_dashConfig.users[u] === d.id) userCount++;
        });
      }
      var widgetCount = (_dashConfig.dashboards[d.id] && _dashConfig.dashboards[d.id].widgets) ? _dashConfig.dashboards[d.id].widgets.length : 0;

      return '<div style="border:1px solid #e2e8f0;border-radius:8px;margin-bottom:12px;background:#fff;overflow:hidden;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;">' +
          '<div>' +
            '<div style="font-size:16px;font-weight:600;color:#1e293b;">' + escapeHtml(d.name) + '</div>' +
            '<div style="font-size:12px;color:#94a3b8;margin-top:4px;">' + escapeHtml(d.id) + ' &middot; ' + widgetCount + ' widgets &middot; ' + userCount + ' users assigned</div>' +
          '</div>' +
          '<div style="display:flex;gap:8px;">' +
            '<button class="ra-st__btn ra-st__btn--primary ra-dl-edit-dash" data-id="' + escapeHtml(d.id) + '" style="padding:8px 16px;font-size:13px;" title="Edit dashboard widgets">Edit</button>' +
            '<button class="ra-st__btn ra-st__btn--secondary ra-dl-rename-dash" data-id="' + escapeHtml(d.id) + '" data-name="' + escapeHtml(d.name) + '" style="padding:8px 16px;font-size:13px;" title="Rename this dashboard">Rename</button>' +
            '<button class="ra-st__btn ra-st__btn--secondary ra-dl-share-dash" data-id="' + escapeHtml(d.id) + '" data-name="' + escapeHtml(d.name) + '" style="padding:8px 16px;font-size:13px;">Share</button>' +
            '<button class="ra-st__btn ra-st__btn--secondary ra-dl-preview-dash" data-id="' + escapeHtml(d.id) + '" style="padding:8px 16px;font-size:13px;" title="Preview dashboard">Preview</button>' +
            '<button class="ra-st__btn ra-st__btn--secondary ra-dl-delete-dash" data-id="' + escapeHtml(d.id) + '" style="padding:8px 16px;font-size:13px;color:#e74c3c;" title="Delete this dashboard">Delete</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    }).join('');

    listEl.querySelectorAll('.ra-dl-edit-dash').forEach(function (btn) {
      btn.addEventListener('click', function () {
        _editingDashboardId = this.getAttribute("data-id"); try { sessionStorage.setItem("ra_editing_dashboard", _editingDashboardId); } catch (e) {}
        renderDashTabContent();
      });
    });
    listEl.querySelectorAll('.ra-dl-share-dash').forEach(function (btn) {
      btn.addEventListener('click', function () {
        showShareModal(this.getAttribute('data-id'), this.getAttribute('data-name'));
      });
    });
    listEl.querySelectorAll('.ra-dl-preview-dash').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (window.__raDashboardPreview) window.__raDashboardPreview.show(this.getAttribute('data-id'));
      });
    });
    listEl.querySelectorAll('.ra-dl-delete-dash').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var dashId = this.getAttribute('data-id');
        if (!confirm('Delete dashboard "' + dashId + '"? Users assigned to it will need to be reassigned.')) return;
        delete _dashConfig.dashboards[dashId];
        var users = _dashConfig.users || {};
        Object.keys(users).forEach(function (u) { if (users[u] === dashId) delete users[u]; });
        saveDashConfig(function (err) {
          if (err) {
            showStatus(document.getElementById('ra-st-dl-status'), 'err', err);
          } else {
            showStatus(document.getElementById('ra-st-dl-status'), 'ok', 'Dashboard deleted.');
            renderDashCards();
          }
        });
      });
    });
    listEl.querySelectorAll('.ra-dl-rename-dash').forEach(function (btn) {
      btn.addEventListener('click', function () {
        showRenameDashboardModal(this.getAttribute('data-id'), this.getAttribute('data-name'));
      });
    });
  }

  function showRenameDashboardModal(dashId, currentName, onRenamed) {
    var modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:100001;display:flex;align-items:center;justify-content:center;';
    modal.innerHTML =
      '<div style="background:#fff;border-radius:10px;width:400px;max-width:90vw;box-shadow:0 10px 40px rgba(0,0,0,0.2);">' +
        '<div style="padding:18px 20px;border-bottom:1px solid #e2e8f0;font-size:16px;font-weight:600;display:flex;justify-content:space-between;align-items:center;">' +
          'Rename Dashboard<button id="ra-dl-rn-close" style="background:none;border:none;font-size:20px;cursor:pointer;color:#94a3b8;" title="Close">&times;</button>' +
        '</div>' +
        '<div style="padding:20px;">' +
          '<div class="ra-st__field"><label>Dashboard Name</label><input type="text" id="ra-dl-rn-name" value="' + escapeHtml(currentName) + '"></div>' +
          '<div style="display:flex;gap:10px;margin-top:16px;">' +
            '<button class="ra-st__btn ra-st__btn--primary" id="ra-dl-rn-save">Save</button>' +
            '<button class="ra-st__btn ra-st__btn--secondary" id="ra-dl-rn-cancel">Cancel</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(modal);

    var nameInput = document.getElementById('ra-dl-rn-name');
    nameInput.focus();
    nameInput.select();

    function closeModal() { modal.remove(); }
    document.getElementById('ra-dl-rn-close').addEventListener('click', closeModal);
    document.getElementById('ra-dl-rn-cancel').addEventListener('click', closeModal);
    modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });

    document.getElementById('ra-dl-rn-save').addEventListener('click', function () {
      var newName = nameInput.value.trim();
      if (!newName) { nameInput.style.borderColor = '#e74c3c'; return; }
      if (_dashConfig && _dashConfig.dashboards && _dashConfig.dashboards[dashId]) {
        _dashConfig.dashboards[dashId].name = newName;
        saveDashConfig(function (err) {
          if (err) {
            showStatus(document.getElementById('ra-st-dl-status'), 'err', err);
          } else {
            showStatus(document.getElementById('ra-st-dl-status'), 'ok', 'Dashboard renamed.');
            renderDashCards();
            if (typeof onRenamed === 'function') onRenamed(newName);
          }
        });
      }
      closeModal();
    });

    nameInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') document.getElementById('ra-dl-rn-save').click();
      if (e.key === 'Escape') closeModal();
    });
  }

  function generateSlug(name) {
    return name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  }

  function showNewDashboardModal() {
    var modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:100001;display:flex;align-items:center;justify-content:center;';
    modal.innerHTML =
      '<div style="background:#fff;border-radius:10px;width:400px;max-width:90vw;box-shadow:0 10px 40px rgba(0,0,0,0.2);">' +
        '<div style="padding:18px 20px;border-bottom:1px solid #e2e8f0;font-size:16px;font-weight:600;display:flex;justify-content:space-between;align-items:center;">' +
          'New Dashboard<button id="ra-dl-nd-close" style="background:none;border:none;font-size:20px;cursor:pointer;color:#94a3b8;" title="Close">&times;</button>' +
        '</div>' +
        '<div style="padding:20px;">' +
          '<div class="ra-st__field"><label>Dashboard Name</label><input type="text" id="ra-dl-nd-name" placeholder="e.g., Field Team Dashboard"></div>' +
          '<div style="display:flex;gap:10px;margin-top:16px;">' +
            '<button class="ra-st__btn ra-st__btn--primary" id="ra-dl-nd-create">Create</button>' +
            '<button class="ra-st__btn ra-st__btn--secondary" id="ra-dl-nd-cancel">Cancel</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    document.body.appendChild(modal);
    document.getElementById('ra-dl-nd-name').focus();
    document.getElementById('ra-dl-nd-close').addEventListener('click', function () { modal.remove(); });
    document.getElementById('ra-dl-nd-cancel').addEventListener('click', function () { modal.remove(); });
    // Click outside modal to close
    modal.addEventListener('click', function (e) { if (e.target === modal) modal.remove(); });
    // Escape key to close
    document.getElementById('ra-dl-nd-name').addEventListener('keydown', function (e) {
      if (e.key === 'Escape') modal.remove();
      if (e.key === 'Enter') document.getElementById('ra-dl-nd-create').click();
    });
    document.getElementById('ra-dl-nd-create').addEventListener('click', function () {
      var nameVal = (document.getElementById('ra-dl-nd-name').value || '').trim();
      if (!nameVal) { alert('Dashboard name is required'); return; }
      var idVal = generateSlug(nameVal);
      if (!idVal) idVal = 'dashboard-' + Date.now();
      // Avoid conflicts (max 20 attempts to prevent any loop)
      var base = idVal; var counter = 1;
      var maxAttempts = 20;
      while (_dashConfig && _dashConfig.dashboards && _dashConfig.dashboards[idVal] && counter < maxAttempts) { idVal = base + '-' + counter; counter++; }
      if (!idVal) { alert('Could not generate a valid ID'); return; }
      _dashConfig.dashboards[idVal] = { name: nameVal, widgets: [] };
      saveDashConfig(function (err) {
        if (err) {
          alert('Error: ' + err);
        } else {
          renderDashCards();
          populateDashboardDropdown(); // refresh Users tab dropdown too
        }
      });
      modal.remove();
    });
  }

  // ── Dashboard Editor View (opened when clicking Edit on a dashboard) ──
  function renderDashboardEditor(container, dashId) {
    var dash = (_dashConfig && _dashConfig.dashboards) ? _dashConfig.dashboards[dashId] : null;
    if (!dash) { _editingDashboardId = null; try { sessionStorage.removeItem("ra_editing_dashboard"); } catch (e) {} renderDashboardList(container); return; }

    container.innerHTML =
      '<div style="max-width:none;">' +
        // Header row — back button + title + rename
        '<div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">' +
          '<button id="ra-dl-back" style="background:none;border:1px solid #e1e3ea;border-radius:4px;padding:6px 10px;cursor:pointer;color:#64748b;font-size:13px;display:flex;align-items:center;gap:4px;" title="Back to dashboard list">' +
            '<svg viewBox="0 0 24 24" style="width:16px;height:16px;fill:currentColor;"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>' +
            'Back' +
          '</button>' +
        '</div>' +
        '<div style="font-size:24px;font-weight:700;color:#333847;margin:0 0 6px;display:flex;align-items:center;gap:10px;">' +
          '<span id="ra-dl-editor-name">' + escapeHtml(dash.name) + '</span>' +
          '<button id="ra-dl-editor-rename" style="background:none;border:none;cursor:pointer;font-size:16px;color:#94a3b8;padding:2px;" title="Rename dashboard">&#9998;</button>' +
        '</div>' +
        '<div style="font-size:12px;color:#94a3b8;margin-bottom:24px;">' + escapeHtml(dashId) + '</div>' +
        '<div class="ra-st__status" id="ra-st-dl-status"></div>' +
        // Action bar — matches form summary top toolbar style
        '<div style="background:#fff;border:1px solid #e1e3ea;border-radius:6px;padding:12px 16px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">' +
          '<div style="display:flex;gap:8px;">' +
            '<button class="ra-de__btn ra-de__btn--primary" id="ra-st-dl-add" title="Add a new widget">' +
              '<svg viewBox="0 0 24 24" style="width:15px;height:15px;fill:#fff;"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>' +
              'Add Widget' +
            '</button>' +
            '<button class="ra-de__btn ra-de__btn--outline" id="ra-st-dl-preview" title="Preview this dashboard">' +
              '<svg viewBox="0 0 24 24" style="width:15px;height:15px;fill:currentColor;"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>' +
              'Preview' +
            '</button>' +
            '<button class="ra-de__btn ra-de__btn--outline" id="ra-st-dl-save" title="Save dashboard">' +
              '<svg viewBox="0 0 24 24" style="width:15px;height:15px;fill:currentColor;"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>' +
              'Save' +
            '</button>' +
          '</div>' +
          '<button class="ra-de__btn ra-de__btn--ghost" id="ra-st-dl-reset" title="Remove all widgets from this dashboard">Clear All</button>' +
        '</div>' +
        // Widget grid
        '<div id="ra-st-dl-widgets" style="min-height:80px;"></div>' +
      '</div>' +
      // Editor button styles
      '<style>' +
        '.ra-de__btn { display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:4px;font-size:13px;font-weight:500;cursor:pointer;transition:all 0.15s;border:1px solid transparent; }' +
        '.ra-de__btn--primary { background:#2095f3;color:#fff;border-color:#2095f3;box-shadow:0 1px 3px rgba(0,0,0,0.12); }' +
        '.ra-de__btn--primary:hover { background:#1977c2;border-color:#1977c2; }' +
        '.ra-de__btn--outline { background:#fff;color:#333847;border-color:#e1e3ea; }' +
        '.ra-de__btn--outline:hover { background:#f5f6f8;border-color:#c8cad0; }' +
        '.ra-de__btn--ghost { background:none;color:#94a3b8;border:none;font-size:12px; }' +
        '.ra-de__btn--ghost:hover { color:#e74c3c; }' +
      '</style>';

    _selectedDashboardId = dashId;
    renderWidgetList();

    document.getElementById('ra-dl-back').addEventListener('click', function () {
      _editingDashboardId = null; try { sessionStorage.removeItem("ra_editing_dashboard"); } catch (e) {}
      renderDashTabContent();
    });
    document.getElementById('ra-st-dl-add').addEventListener('click', function () { showWidgetEditor(-1); });
    document.getElementById('ra-st-dl-save').addEventListener('click', function () { saveLayout(); });
    document.getElementById('ra-st-dl-preview').addEventListener('click', function () {
      if (window.__raDashboardPreview) window.__raDashboardPreview.show(dashId);
    });
    document.getElementById('ra-st-dl-reset').addEventListener('click', function () {
      if (confirm('Remove all widgets from this dashboard?')) {
        dash.widgets = [];
        renderWidgetList();
        autoSaveDashConfig();
      }
    });
    document.getElementById('ra-dl-editor-rename').addEventListener('click', function () {
      showRenameDashboardModal(dashId, dash.name, function (newName) {
        var nameEl = document.getElementById('ra-dl-editor-name');
        if (nameEl) nameEl.textContent = newName;
      });
    });
  }

  function getCurrentDashboard() {
    if (!_dashConfig || !_dashConfig.dashboards) return null;
    return _dashConfig.dashboards[_selectedDashboardId] || null;
  }

  // Auto-save after any change (debounced)
  var _autoSaveTimer = null;
  function autoSaveDashConfig() {
    if (_autoSaveTimer) clearTimeout(_autoSaveTimer);
    _autoSaveTimer = setTimeout(function () {
      saveDashConfig(function (err) {
        var statusEl = document.getElementById('ra-st-dl-status');
        if (err) {
          if (statusEl) showStatus(statusEl, 'err', 'Auto-save failed: ' + err);
        } else {
          if (statusEl) showStatus(statusEl, 'ok', 'Saved');
          // Clear the "Saved" message after 2 seconds
          setTimeout(function () {
            if (statusEl && statusEl.textContent === 'Saved') statusEl.style.display = 'none';
          }, 2000);
        }
      });
    }, 500);
  }

  function renderWidgetList() {
    var container = document.getElementById('ra-st-dl-widgets');
    if (!container) return;
    var dash = getCurrentDashboard();
    if (!dash) return;

    var widgets = dash.widgets || [];
    if (!widgets.length) {
      container.style.display = 'block';
      container.innerHTML = '<div style="padding:32px;text-align:center;color:#94a3b8;border:2px dashed #e2e8f0;border-radius:8px;">' +
        '<p style="font-size:14px;margin:0 0 8px;">No widgets yet</p>' +
        '<p style="font-size:12px;margin:0;">Click "+ Add Widget" to build this dashboard.</p></div>';
      return;
    }

    container.style.display = 'grid';
    container.style.gridTemplateColumns = 'repeat(4, 1fr)';
    container.style.gap = '10px';
    container.style.alignItems = 'start';

    var spanMap = { full: 4, half: 2, 'three-quarter': 3, quarter: 1 };
    var widthLabel = { full: 'Full (4)', half: 'Half (2)', 'three-quarter': '3/4 (3)', quarter: '1/4 (1)' };

    // Build widget cards + drop zone placeholders
    var html = '';
    widgets.forEach(function (w, idx) {
      var typeDef = null;
      for (var t = 0; t < WIDGET_TYPES.length; t++) { if (WIDGET_TYPES[t].id === w.type) { typeDef = WIDGET_TYPES[t]; break; } }
      if (!typeDef) typeDef = { label: w.type };
      var span = spanMap[w.width] || 1;

      html += '<div class="ra-dl-widget-item" draggable="true" data-idx="' + idx + '" style="' +
        'grid-column:span ' + span + ';' +
        'border:2px solid #e2e8f0;border-radius:8px;background:#fff;cursor:grab;transition:all 0.15s;overflow:hidden;">' +
        '<div style="background:#f8fafc;padding:8px 12px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between;">' +
          '<div style="display:flex;align-items:center;gap:6px;min-width:0;">' +
            '<span style="color:#cbd5e1;font-size:14px;cursor:grab;flex-shrink:0;">&#9776;</span>' +
            '<span style="font-weight:600;color:#1e293b;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + escapeHtml(w.title || typeDef.label) + '</span>' +
          '</div>' +
          '<div style="display:flex;gap:3px;flex-shrink:0;">' +
            '<button class="ra-st__btn ra-st__btn--secondary ra-dl-edit" data-idx="' + idx + '" style="padding:2px 6px;font-size:10px;">Edit</button>' +
            '<button class="ra-st__btn ra-st__btn--secondary ra-dl-remove" data-idx="' + idx + '" style="padding:2px 6px;font-size:10px;color:#e74c3c;">&#10005;</button>' +
          '</div>' +
        '</div>' +
        '<div style="padding:12px;min-height:50px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#94a3b8;">' +
          '<div style="font-size:20px;margin-bottom:4px;">' + getWidgetIcon(w.type) + '</div>' +
          '<div style="font-size:11px;font-weight:600;color:#64748b;">' + escapeHtml(typeDef.label) + '</div>' +
          '<div style="font-size:10px;color:#b0b8c4;margin-top:2px;">' + (widthLabel[w.width] || w.width) + '</div>' +
        '</div>' +
      '</div>';
    });

    container.innerHTML = html;

    // ── Drag and Drop with insert-before logic ──
    var dragSrcIdx = null;

    function clearHighlights() {
      container.querySelectorAll('.ra-dl-widget-item').forEach(function (el) {
        el.style.borderColor = '#e2e8f0';
        el.style.boxShadow = 'none';
      });
      // Remove drop indicators
      container.querySelectorAll('.ra-dl-drop-indicator').forEach(function (el) { el.remove(); });
    }

    container.querySelectorAll('.ra-dl-widget-item').forEach(function (item) {
      item.addEventListener('dragstart', function (e) {
        dragSrcIdx = parseInt(this.getAttribute('data-idx'));
        this.style.opacity = '0.3';
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', String(dragSrcIdx));
      });

      item.addEventListener('dragend', function () {
        this.style.opacity = '1';
        clearHighlights();
        dragSrcIdx = null;
      });

      item.addEventListener('dragover', function (e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        clearHighlights();
        var idx = parseInt(this.getAttribute('data-idx'));
        if (idx !== dragSrcIdx) {
          // Show drop indicator — blue left border
          var rect = this.getBoundingClientRect();
          var mouseX = e.clientX;
          var midX = rect.left + rect.width / 2;
          if (mouseX < midX) {
            this.style.borderLeftColor = '#54a8dc';
            this.style.borderLeftWidth = '4px';
          } else {
            this.style.borderRightColor = '#54a8dc';
            this.style.borderRightWidth = '4px';
          }
          this.style.boxShadow = '0 0 0 1px rgba(84,168,220,0.2)';
        }
      });

      item.addEventListener('dragleave', function () {
        this.style.borderColor = '#e2e8f0';
        this.style.borderWidth = '2px';
        this.style.boxShadow = 'none';
      });

      item.addEventListener('drop', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var dropIdx = parseInt(this.getAttribute('data-idx'));
        if (dragSrcIdx === null || dragSrcIdx === dropIdx) return;

        var d = getCurrentDashboard();
        if (d && d.widgets) {
          // Move widget from dragSrcIdx to dropIdx position
          var widget = d.widgets.splice(dragSrcIdx, 1)[0];
          var insertAt = dropIdx > dragSrcIdx ? dropIdx : dropIdx;
          d.widgets.splice(insertAt, 0, widget);
          renderWidgetList();
          autoSaveDashConfig();
        }
        dragSrcIdx = null;
      });
    });

    // Also allow dropping on the container itself (empty space)
    container.addEventListener('dragover', function (e) {
      if (e.target === container) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        // Show a dashed outline at the end
        if (!container.querySelector('.ra-dl-drop-end')) {
          var indicator = document.createElement('div');
          indicator.className = 'ra-dl-drop-end';
          indicator.style.cssText = 'grid-column:span 1;border:2px dashed #54a8dc;border-radius:8px;min-height:80px;display:flex;align-items:center;justify-content:center;color:#54a8dc;font-size:12px;';
          indicator.textContent = 'Drop here';
          container.appendChild(indicator);
        }
      }
    });

    container.addEventListener('dragleave', function (e) {
      if (e.target === container) {
        var endIndicator = container.querySelector('.ra-dl-drop-end');
        if (endIndicator) endIndicator.remove();
      }
    });

    container.addEventListener('drop', function (e) {
      if (e.target === container || e.target.classList.contains('ra-dl-drop-end')) {
        e.preventDefault();
        var endIndicator = container.querySelector('.ra-dl-drop-end');
        if (endIndicator) endIndicator.remove();

        if (dragSrcIdx === null) return;
        var d = getCurrentDashboard();
        if (d && d.widgets) {
          // Move to end
          var widget = d.widgets.splice(dragSrcIdx, 1)[0];
          d.widgets.push(widget);
          renderWidgetList();
          autoSaveDashConfig();
        }
        dragSrcIdx = null;
      }
    });

    container.querySelectorAll('.ra-dl-remove').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var d = getCurrentDashboard();
        if (d) { d.widgets.splice(parseInt(this.getAttribute('data-idx')), 1); renderWidgetList(); autoSaveDashConfig(); }
      });
    });
    container.querySelectorAll('.ra-dl-edit').forEach(function (btn) {
      btn.addEventListener('click', function () { showWidgetEditor(parseInt(this.getAttribute('data-idx'))); });
    });
  }

  function getWidgetIcon(type) {
    var icons = {
      'stat-cards': '&#128202;',
      'chart': '&#128200;',
      'form-table': '&#128203;',
      'recent-feed': '&#128172;',
      'pie-chart': '&#127856;',
      'single-stat': '&#128290;',
      'field-number': '&#128290;',
      'field-text-list': '&#128196;',
      'field-select-bar': '&#128202;',
      'field-counter': '&#9989;',
      'field-latest': '&#128337;',
      'field-timeline': '&#128200;',
      'submissions-by-form': '&#128202;',
      'top-contributors': '&#127942;',
      'submissions-by-day': '&#128197;',
      'avg-per-day': '&#128200;',
      'submissions-period': '&#128202;',
      'geo-coverage': '&#127758;',
      'form-status': '&#128203;',
      'info-text': '&#128172;'
    };
    return icons[type] || '&#9632;';
  }

  /**
   * Build <option> HTML for the field dropdown.
   * @param {Array} forms - list of form objects (from _layoutForms)
   * @param {Array} selectedFormUids - UIDs selected in the forms multi-select (or ['__all__'])
   * @param {string} currentValue - currently selected field value
   * @returns {string} HTML options string
   */
  function buildFieldOptions(forms, selectedFormUids, currentValue) {
    var sysSel_by = currentValue === '_submitted_by' ? ' selected' : '';
    var sysSel_time = currentValue === '_submission_time' ? ' selected' : '';
    var html = '<optgroup label="System Fields">' +
      '<option value="_submitted_by"' + sysSel_by + '>Submitted By  [_submitted_by]</option>' +
      '<option value="_submission_time"' + sysSel_time + '>Submission Time  [_submission_time]</option>' +
      '</optgroup>';

    if (!forms || !forms.length) return html;

    // Determine which forms to include
    var useAll = !selectedFormUids || !selectedFormUids.length || selectedFormUids[0] === '__all__';
    var formsToScan = [];
    if (useAll) {
      formsToScan = forms;
    } else {
      for (var fi = 0; fi < forms.length; fi++) {
        if (selectedFormUids.indexOf(forms[fi].uid) !== -1) {
          formsToScan.push(forms[fi]);
        }
      }
    }

    // Collect fields from matching forms, tracking which forms each field appears in
    var fieldMap = {}; // name -> { label, type, formNames[] }
    for (var i = 0; i < formsToScan.length; i++) {
      var f = formsToScan[i];
      var survey = (f.content || {}).survey || [];
      for (var j = 0; j < survey.length; j++) {
        var row = survey[j];
        var t = row.type || '';
        // Skip structural/hidden types
        if (t.indexOf('begin') === 0 || t.indexOf('end') === 0 || t === 'calculate' || t === 'hidden' || t === 'note') continue;
        var name = row.name || row.$autoname || '';
        if (!name) continue;
        var label = (row.label && row.label[0]) || name;
        if (!fieldMap[name]) {
          fieldMap[name] = { label: label, type: t, formNames: [] };
        }
        if (fieldMap[name].formNames.indexOf(f.name) === -1) {
          fieldMap[name].formNames.push(f.name);
        }
      }
    }

    // Sort fields alphabetically by label
    var fieldNames = Object.keys(fieldMap);
    fieldNames.sort(function (a, b) {
      return fieldMap[a].label.toLowerCase().localeCompare(fieldMap[b].label.toLowerCase());
    });

    if (fieldNames.length) {
      html += '<optgroup label="Form Fields (' + fieldNames.length + ')">';
      for (var k = 0; k < fieldNames.length; k++) {
        var fname = fieldNames[k];
        var fd = fieldMap[fname];
        var sel = currentValue === fname ? ' selected' : '';
        var displayText = fd.label + '  [' + fname + ']  (' + fd.type + ')';
        html += '<option value="' + escapeHtml(fname) + '"' + sel + '>' + escapeHtml(displayText) + '</option>';
      }
      html += '</optgroup>';
    }

    return html;
  }

  function getWidgetFormNames(w) {
    if (!w.forms || !w.forms.length || w.forms[0] === '__all__') return 'All forms';
    if (!_layoutForms) return w.forms.join(', ');
    return w.forms.map(function (uid) {
      for (var i = 0; i < _layoutForms.length; i++) { if (_layoutForms[i].uid === uid) return _layoutForms[i].name; }
      return uid;
    }).join(', ');
  }

  function getWidgetConfigSummary(w) {
    var c = w.config || {};
    var parts = [];
    if (c.days) parts.push(c.days + ' days');
    if (c.limit) parts.push('Limit: ' + c.limit);
    if (c.field) parts.push('Field: ' + c.field);
    if (c.metric) parts.push('Metric: ' + c.metric);
    return parts.join(', ');
  }

  function showWidgetEditor(editIdx) {
    var dash = getCurrentDashboard();
    if (!dash) { alert('Select a dashboard first'); return; }

    var isEdit = editIdx >= 0;
    var w = isEdit ? dash.widgets[editIdx] : { id: 'w' + Date.now() + '_' + Math.random().toString(36).substr(2, 4), type: 'stat-cards', title: '', width: 'full', forms: ['__all__'], config: {} };

    var formOptions = '<option value="__all__"' + ((!w.forms || !w.forms.length || w.forms[0] === '__all__') ? ' selected' : '') + '>All forms</option>';
    if (_layoutForms) {
      _layoutForms.forEach(function (f) {
        var sel = w.forms && w.forms.indexOf(f.uid) !== -1 ? ' selected' : '';
        formOptions += '<option value="' + escapeHtml(f.uid) + '"' + sel + '>' + escapeHtml(f.name) + ' (' + (f.deployment__submission_count || 0) + ')</option>';
      });
    }

    // Build type options with optgroups
    var lastGroup = '';
    var typeOptions = '';
    WIDGET_TYPES.forEach(function (t) {
      if (t.group && t.group !== lastGroup) {
        if (lastGroup) typeOptions += '</optgroup>';
        typeOptions += '<optgroup label="' + escapeHtml(t.group) + '">';
        lastGroup = t.group;
      }
      typeOptions += '<option value="' + t.id + '"' + (w.type === t.id ? ' selected' : '') + '>' + t.label + ' - ' + t.desc + '</option>';
    });
    if (lastGroup) typeOptions += '</optgroup>';

    // Build field options filtered by selected forms
    var currentFieldValue = (w.config || {}).field || '';
    var fieldOptions = buildFieldOptions(_layoutForms, w.forms, currentFieldValue);

    var cfg = w.config || {};
    var modal = document.createElement('div');
    modal.id = 'ra-dl-modal';
    modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:100001;display:flex;align-items:center;justify-content:center;';
    modal.innerHTML =
      '<div style="background:#fff;border-radius:10px;width:500px;max-width:90vw;max-height:90vh;overflow-y:auto;box-shadow:0 10px 40px rgba(0,0,0,0.2);">' +
        '<div style="padding:18px 20px;border-bottom:1px solid #e2e8f0;font-size:16px;font-weight:600;color:#1e293b;display:flex;justify-content:space-between;align-items:center;">' +
          (isEdit ? 'Edit Widget' : 'Add Widget') +
          '<button id="ra-dl-modal-close" style="background:none;border:none;font-size:20px;cursor:pointer;color:#94a3b8;" title="Close">&times;</button>' +
        '</div>' +
        '<div style="padding:20px;">' +
          '<div class="ra-st__field"><label>Widget Title <span style="font-weight:400;color:#94a3b8;">(shown on dashboard)</span></label><input type="text" id="ra-dl-title" value="' + escapeHtml(w.title || '') + '" placeholder="Leave empty for default title">' +
            '<label style="display:flex;align-items:center;gap:6px;margin-top:6px;cursor:pointer;font-size:12px;color:#64748b;user-select:none;"><input type="checkbox" id="ra-dl-hidetitle"' + (cfg.hideTitle ? ' checked' : '') + ' style="width:15px;height:15px;accent-color:#54a8dc;cursor:pointer;"> Hide title on dashboard</label></div>' +
          '<div class="ra-st__field"><label>Widget Type</label><select id="ra-dl-type">' + typeOptions + '</select></div>' +
          '<div style="display:flex;gap:12px;">' +
            '<div class="ra-st__field" style="flex:1;"><label>Width</label><select id="ra-dl-width"><option value="quarter"' + (w.width === "quarter" ? " selected" : "") + '>Quarter (1 col)</option><option value="half"' + (w.width === "half" ? " selected" : "") + '>Half (2 cols)</option><option value="three-quarter"' + (w.width === "three-quarter" ? " selected" : "") + '>Three Quarter (3 cols)</option><option value="full"' + (w.width === "full" ? " selected" : "") + '>Full (4 cols)</option></select></div>' +
          '</div>' +
          '<div class="ra-st__field"><label>Data Source (forms)</label><select id="ra-dl-forms" multiple style="height:120px;">' + formOptions + '</select><small>Hold Ctrl/Cmd to select multiple. "All forms" overrides individual selections.</small></div>' +
          '<div id="ra-dl-extra-config">' +
            '<div class="ra-st__field" id="ra-dl-days-wrap"><label>Time Period (days)</label><input type="number" id="ra-dl-days" value="' + (cfg.days || 30) + '" min="7" max="90"></div>' +
            '<div class="ra-st__field" id="ra-dl-limit-wrap"><label>Max items</label><input type="number" id="ra-dl-limit" value="' + (cfg.limit || 15) + '" min="5" max="50"></div>' +
            '<div class="ra-st__field" id="ra-dl-field-wrap"><label>Field</label><select id="ra-dl-field">' + fieldOptions + '</select></div>' +
            '<div class="ra-st__field" id="ra-dl-metric-wrap"><label>Metric</label><select id="ra-dl-metric"><option value="count"' + (cfg.metric === 'count' ? ' selected' : '') + '>Total submissions</option><option value="today"' + (cfg.metric === 'today' ? ' selected' : '') + '>Submissions today</option><option value="contributors"' + (cfg.metric === 'contributors' ? ' selected' : '') + '>Unique contributors</option></select></div>' +
            '<div class="ra-st__field" id="ra-dl-operation-wrap"><label>Operation</label><select id="ra-dl-operation"><option value="sum"' + (cfg.operation === 'sum' ? ' selected' : '') + '>Sum</option><option value="average"' + (cfg.operation === 'average' ? ' selected' : '') + '>Average</option><option value="min"' + (cfg.operation === 'min' ? ' selected' : '') + '>Min</option><option value="max"' + (cfg.operation === 'max' ? ' selected' : '') + '>Max</option><option value="count"' + (cfg.operation === 'count' ? ' selected' : '') + '>Count (non-empty)</option></select></div>' +
            '<div class="ra-st__field" id="ra-dl-matchop-wrap"><label>Condition</label><select id="ra-dl-matchop"><option value="equals"' + (cfg.matchOp === 'equals' ? ' selected' : '') + '>Equals</option><option value="contains"' + (cfg.matchOp === 'contains' ? ' selected' : '') + '>Contains</option><option value="not_empty"' + (cfg.matchOp === 'not_empty' ? ' selected' : '') + '>Not empty</option><option value="greater_than"' + (cfg.matchOp === 'greater_than' ? ' selected' : '') + '>Greater than</option><option value="less_than"' + (cfg.matchOp === 'less_than' ? ' selected' : '') + '>Less than</option></select></div>' +
            '<div class="ra-st__field" id="ra-dl-matchval-wrap"><label>Match Value</label><input type="text" id="ra-dl-matchval" value="' + escapeHtml(cfg.matchValue || '') + '" placeholder="e.g., yes, 100, Dar es Salaam"></div>' +
            '<div class="ra-st__field" id="ra-dl-label-wrap"><label>Display Label</label><input type="text" id="ra-dl-label" value="' + escapeHtml(cfg.label || '') + '" placeholder="e.g., Total Records"></div>' +
            '<div class="ra-st__field" id="ra-dl-namefield-wrap"><label>Name Field (who submitted)</label><select id="ra-dl-namefield"><option value="">(Auto-detect)</option>' + fieldOptions + '</select><small>Pick the form field that contains the person\'s name. "Auto-detect" checks common fields like collector_name, enumerator_name, etc.</small></div>' +
            '<div class="ra-st__field" id="ra-dl-sortby-wrap"><label>Sort By</label><select id="ra-dl-sortby"><option value="count"' + (cfg.sortBy === 'count' ? ' selected' : '') + '>Submission count (high to low)</option><option value="count-asc"' + (cfg.sortBy === 'count-asc' ? ' selected' : '') + '>Submission count (low to high)</option><option value="name"' + (cfg.sortBy === 'name' ? ' selected' : '') + '>Name (A-Z)</option><option value="name-desc"' + (cfg.sortBy === 'name-desc' ? ' selected' : '') + '>Name (Z-A)</option></select></div>' +
            '<div class="ra-st__field" id="ra-dl-groupby-wrap"><label>Group By</label><select id="ra-dl-groupby"><option value="day"' + (cfg.groupBy === 'day' || !cfg.groupBy ? ' selected' : '') + '>Day</option><option value="week"' + (cfg.groupBy === 'week' ? ' selected' : '') + '>Week</option><option value="month"' + (cfg.groupBy === 'month' ? ' selected' : '') + '>Month</option></select></div>' +
            '<div class="ra-st__field" id="ra-dl-aggregation-wrap"><label>Daily Aggregation</label><select id="ra-dl-aggregation"><option value="average"' + (cfg.aggregation === 'average' || !cfg.aggregation ? ' selected' : '') + '>Average per day</option><option value="sum"' + (cfg.aggregation === 'sum' ? ' selected' : '') + '>Sum per day</option><option value="min"' + (cfg.aggregation === 'min' ? ' selected' : '') + '>Min per day</option><option value="max"' + (cfg.aggregation === 'max' ? ' selected' : '') + '>Max per day</option></select></div>' +
            '<div class="ra-st__field" id="ra-dl-hours-wrap"><label>Hours to Display</label><select id="ra-dl-hours"><option value="24"' + (cfg.hours == 24 || !cfg.hours ? ' selected' : '') + '>24 hours (full day)</option><option value="12"' + (cfg.hours == 12 ? ' selected' : '') + '>12 hours</option><option value="6"' + (cfg.hours == 6 ? ' selected' : '') + '>6 hours</option><option value="3"' + (cfg.hours == 3 ? ' selected' : '') + '>3 hours</option><option value="2"' + (cfg.hours == 2 ? ' selected' : '') + '>2 hours</option></select><small>Number of hours to show. Dashboard users can also filter by form and date.</small></div>' +
            '<div class="ra-st__field" id="ra-dl-charttype-wrap"><label>Chart Type</label><select id="ra-dl-charttype"><option value="bar"' + (cfg.chartType === 'bar' || !cfg.chartType ? ' selected' : '') + '>Bar Chart</option><option value="line"' + (cfg.chartType === 'line' ? ' selected' : '') + '>Line Chart</option></select></div>' +
            '<div class="ra-st__field" id="ra-dl-prefix-wrap"><label>Prefix / Suffix</label><div style="display:flex;gap:8px;"><input type="text" id="ra-dl-prefix" value="' + escapeHtml(cfg.prefix || '') + '" placeholder="e.g., $, TZS" style="flex:1;"><input type="text" id="ra-dl-suffix" value="' + escapeHtml(cfg.suffix || '') + '" placeholder="e.g., km, %" style="flex:1;"></div></div>' +
            '<div class="ra-st__field" id="ra-dl-colors-wrap">' +
              '<label>Widget Colors <span style="font-weight:400;color:#94a3b8;">(optional)</span></label>' +
              '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:6px;">' +
                '<div style="display:flex;align-items:center;gap:4px;">' +
                  '<span style="font-size:11px;color:#475569;min-width:65px;">Background</span>' +
                  '<input type="color" id="ra-dl-bgcolor" value="' + escapeHtml(cfg.bgColor || '#ffffff') + '" style="width:28px;height:24px;border:1px solid #d0d5dd;border-radius:3px;padding:0;cursor:pointer;">' +
                  '<input type="text" id="ra-dl-bgcolor-hex" value="' + escapeHtml(cfg.bgColor || '#ffffff') + '" style="width:75px;padding:3px 6px;font-size:11px;font-family:monospace;border:1px solid #d0d5dd;border-radius:3px;" placeholder="#ffffff">' +
                '</div>' +
                '<div style="display:flex;align-items:center;gap:4px;">' +
                  '<span style="font-size:11px;color:#475569;min-width:30px;">Text</span>' +
                  '<input type="color" id="ra-dl-textcolor" value="' + escapeHtml(cfg.textColor || '#1e293b') + '" style="width:28px;height:24px;border:1px solid #d0d5dd;border-radius:3px;padding:0;cursor:pointer;">' +
                  '<input type="text" id="ra-dl-textcolor-hex" value="' + escapeHtml(cfg.textColor || '#1e293b') + '" style="width:75px;padding:3px 6px;font-size:11px;font-family:monospace;border:1px solid #d0d5dd;border-radius:3px;" placeholder="#1e293b">' +
                '</div>' +
                '<div style="display:flex;align-items:center;gap:4px;">' +
                  '<span style="font-size:11px;color:#475569;min-width:42px;">Header</span>' +
                  '<input type="color" id="ra-dl-headercolor" value="' + escapeHtml(cfg.headerColor || '#1e293b') + '" style="width:28px;height:24px;border:1px solid #d0d5dd;border-radius:3px;padding:0;cursor:pointer;">' +
                  '<input type="text" id="ra-dl-headercolor-hex" value="' + escapeHtml(cfg.headerColor || '#1e293b') + '" style="width:75px;padding:3px 6px;font-size:11px;font-family:monospace;border:1px solid #d0d5dd;border-radius:3px;" placeholder="#1e293b">' +
                '</div>' +
              '</div>' +
              '<button type="button" id="ra-dl-colors-reset" class="ra-st__btn ra-st__btn--secondary" style="padding:4px 10px;font-size:11px;" title="Reset to default colors">Reset</button>' +
              '<small style="display:block;margin-top:6px;">Pick a color or paste a hex code (e.g. #54a8dc). Click Reset for defaults.</small>' +
            '</div>' +
            '<div class="ra-st__field" id="ra-dl-richtext-wrap">' +
              '<label>Content</label>' +
              '<div style="border:1px solid #d0d5dd;border-radius:6px;overflow:hidden;">' +
                '<div id="ra-dl-toolbar" style="display:flex;gap:2px;padding:6px 8px;border-bottom:1px solid #e2e8f0;background:#f8fafc;flex-wrap:wrap;">' +
                  '<button type="button" data-cmd="bold" style="padding:4px 8px;border:1px solid #d0d5dd;border-radius:3px;background:#fff;cursor:pointer;font-weight:700;" title="Bold">B</button>' +
                  '<button type="button" data-cmd="italic" style="padding:4px 8px;border:1px solid #d0d5dd;border-radius:3px;background:#fff;cursor:pointer;font-style:italic;" title="Italic">I</button>' +
                  '<button type="button" data-cmd="underline" style="padding:4px 8px;border:1px solid #d0d5dd;border-radius:3px;background:#fff;cursor:pointer;text-decoration:underline;" title="Underline">U</button>' +
                  '<span style="width:1px;background:#d0d5dd;margin:0 4px;"></span>' +
                  '<button type="button" data-cmd="fontSize" data-val="5" style="padding:4px 8px;border:1px solid #d0d5dd;border-radius:3px;background:#fff;cursor:pointer;font-size:16px;" title="Large text">A</button>' +
                  '<button type="button" data-cmd="fontSize" data-val="3" style="padding:4px 8px;border:1px solid #d0d5dd;border-radius:3px;background:#fff;cursor:pointer;font-size:13px;" title="Medium text">A</button>' +
                  '<button type="button" data-cmd="fontSize" data-val="1" style="padding:4px 8px;border:1px solid #d0d5dd;border-radius:3px;background:#fff;cursor:pointer;font-size:10px;" title="Small text">a</button>' +
                  '<span style="width:1px;background:#d0d5dd;margin:0 4px;"></span>' +
                  '<button type="button" data-cmd="justifyLeft" style="padding:4px 8px;border:1px solid #d0d5dd;border-radius:3px;background:#fff;cursor:pointer;" title="Align Left">&#8676;</button>' +
                  '<button type="button" data-cmd="justifyCenter" style="padding:4px 8px;border:1px solid #d0d5dd;border-radius:3px;background:#fff;cursor:pointer;" title="Align Center">&#8596;</button>' +
                  '<button type="button" data-cmd="justifyRight" style="padding:4px 8px;border:1px solid #d0d5dd;border-radius:3px;background:#fff;cursor:pointer;" title="Align Right">&#8677;</button>' +
                  '<span style="width:1px;background:#d0d5dd;margin:0 4px;"></span>' +
                  '<label style="padding:4px 6px;border:1px solid #d0d5dd;border-radius:3px;background:#fff;cursor:pointer;display:flex;align-items:center;gap:4px;font-size:11px;" title="Text Color">A<input type="color" data-cmd="foreColor" value="#000000" style="width:16px;height:16px;border:none;padding:0;cursor:pointer;"></label>' +
                  '<label style="padding:4px 6px;border:1px solid #d0d5dd;border-radius:3px;background:#fff;cursor:pointer;display:flex;align-items:center;gap:4px;font-size:11px;" title="Highlight Color">&#9608;<input type="color" data-cmd="hiliteColor" value="#ffff00" style="width:16px;height:16px;border:none;padding:0;cursor:pointer;"></label>' +
                  '<span style="width:1px;background:#d0d5dd;margin:0 4px;"></span>' +
                  '<button type="button" data-cmd="insertUnorderedList" style="padding:4px 8px;border:1px solid #d0d5dd;border-radius:3px;background:#fff;cursor:pointer;" title="Bullet list">&#8226; List</button>' +
                  '<button type="button" data-cmd="insertOrderedList" style="padding:4px 8px;border:1px solid #d0d5dd;border-radius:3px;background:#fff;cursor:pointer;" title="Numbered list">1. List</button>' +
                  '<button type="button" data-cmd="createLink" style="padding:4px 8px;border:1px solid #d0d5dd;border-radius:3px;background:#fff;cursor:pointer;" title="Insert link">&#128279; Link</button>' +
                  '<button type="button" data-cmd="removeFormat" style="padding:4px 8px;border:1px solid #d0d5dd;border-radius:3px;background:#fff;cursor:pointer;" title="Clear Formatting">&#10060;</button>' +
                '</div>' +
                '<div id="ra-dl-richtext" contenteditable="true" style="min-height:120px;padding:12px;font-size:14px;line-height:1.6;outline:none;">' +
                  (cfg.html || '<p>Contact the administrator at <b>info@ramaniyangu.com</b> for any questions.</p>') +
                '</div>' +
              '</div>' +
              '<small>Format text using the toolbar. Supports bold, italic, alignment, text colors, highlight, links, and lists. You can also paste HTML directly.</small>' +
            '</div>' +
          '</div>' +
          '<div style="display:flex;gap:10px;margin-top:20px;">' +
            '<button class="ra-st__btn ra-st__btn--primary" id="ra-dl-modal-save">' + (isEdit ? 'Update' : 'Add') + '</button>' +
            '<button class="ra-st__btn ra-st__btn--secondary" id="ra-dl-modal-cancel">Cancel</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    document.body.appendChild(modal);
    toggleExtraConfig();

    // Set nameField selection if editing
    var nameFieldEl = document.getElementById('ra-dl-namefield');
    if (nameFieldEl && cfg.nameField) nameFieldEl.value = cfg.nameField;

    // Update title placeholder to show default based on widget type
    function updateTitlePlaceholder() {
      var typeVal = document.getElementById('ra-dl-type').value;
      var td = null;
      for (var t = 0; t < WIDGET_TYPES.length; t++) {
        if (WIDGET_TYPES[t].id === typeVal) { td = WIDGET_TYPES[t]; break; }
      }
      var titleInput = document.getElementById('ra-dl-title');
      if (titleInput) titleInput.placeholder = 'Default: ' + (td ? td.label : typeVal);
    }
    updateTitlePlaceholder();

    document.getElementById('ra-dl-type').addEventListener('change', function () { toggleExtraConfig(); updateTitlePlaceholder(); });
    document.getElementById('ra-dl-modal-close').addEventListener('click', function () { modal.remove(); });
    document.getElementById('ra-dl-modal-cancel').addEventListener('click', function () { modal.remove(); });

    // Update field dropdowns when forms selection changes
    var formsSelect = document.getElementById('ra-dl-forms');
    if (formsSelect) {
      formsSelect.addEventListener('change', function () {
        var selectedUids = [];
        var opts = formsSelect.options;
        for (var i = 0; i < opts.length; i++) {
          if (opts[i].selected) selectedUids.push(opts[i].value);
        }
        if (selectedUids.indexOf('__all__') !== -1) selectedUids = ['__all__'];

        // Rebuild field dropdown preserving current selection
        var fieldEl = document.getElementById('ra-dl-field');
        var nameFieldEl2 = document.getElementById('ra-dl-namefield');
        var curField = fieldEl ? fieldEl.value : '';
        var curNameField = nameFieldEl2 ? nameFieldEl2.value : '';

        var newFieldOpts = buildFieldOptions(_layoutForms, selectedUids, curField);
        if (fieldEl) fieldEl.innerHTML = newFieldOpts;

        // Rebuild nameField dropdown too (has an extra auto-detect option)
        var newNameFieldOpts = '<option value="">(Auto-detect)</option>' + buildFieldOptions(_layoutForms, selectedUids, curNameField);
        if (nameFieldEl2) nameFieldEl2.innerHTML = newNameFieldOpts;
      });
    }

    // Rich text toolbar handlers
    var toolbar = document.getElementById('ra-dl-toolbar');
    if (toolbar) {
      // Button clicks (bold, italic, align, list, etc.)
      toolbar.addEventListener('click', function (e) {
        var btn = e.target.closest('button[data-cmd]');
        if (!btn) return;
        e.preventDefault();
        var cmd = btn.getAttribute('data-cmd');
        var val = btn.getAttribute('data-val') || null;
        if (cmd === 'createLink') {
          val = prompt('Enter URL:', 'https://');
          if (!val) return;
        }
        document.execCommand(cmd, false, val);
        document.getElementById('ra-dl-richtext').focus();
      });
      // Color picker inputs (foreColor, hiliteColor)
      toolbar.querySelectorAll('input[type="color"]').forEach(function (inp) {
        inp.addEventListener('input', function () {
          var cmd = this.getAttribute('data-cmd');
          document.execCommand(cmd, false, this.value);
          document.getElementById('ra-dl-richtext').focus();
        });
      });
    }
    // Sync color pickers ↔ hex text inputs
    function syncColorPair(colorId, hexId) {
      var colorEl = document.getElementById(colorId);
      var hexEl = document.getElementById(hexId);
      if (!colorEl || !hexEl) return;
      colorEl.addEventListener('input', function () { hexEl.value = this.value; });
      hexEl.addEventListener('input', function () {
        var v = this.value.trim();
        if (/^#[0-9a-fA-F]{6}$/.test(v)) colorEl.value = v;
      });
      hexEl.addEventListener('change', function () {
        var v = this.value.trim();
        if (!v.startsWith('#')) v = '#' + v;
        if (/^#[0-9a-fA-F]{6}$/.test(v)) { this.value = v; colorEl.value = v; }
      });
    }
    syncColorPair('ra-dl-bgcolor', 'ra-dl-bgcolor-hex');
    syncColorPair('ra-dl-textcolor', 'ra-dl-textcolor-hex');
    syncColorPair('ra-dl-headercolor', 'ra-dl-headercolor-hex');

    // Widget color reset button
    var colResetBtn = document.getElementById('ra-dl-colors-reset');
    if (colResetBtn) {
      colResetBtn.addEventListener('click', function () {
        document.getElementById('ra-dl-bgcolor').value = '#ffffff';
        document.getElementById('ra-dl-bgcolor-hex').value = '#ffffff';
        document.getElementById('ra-dl-textcolor').value = '#1e293b';
        document.getElementById('ra-dl-textcolor-hex').value = '#1e293b';
        document.getElementById('ra-dl-headercolor').value = '#1e293b';
        document.getElementById('ra-dl-headercolor-hex').value = '#1e293b';
      });
    }
    document.getElementById('ra-dl-modal-save').addEventListener('click', function () {
      var newW = {
        id: w.id,
        type: document.getElementById('ra-dl-type').value,
        title: document.getElementById('ra-dl-title').value.trim(),
        width: document.getElementById('ra-dl-width').value,
        forms: getSelectedForms(),
        config: {}
      };
      // Hide title checkbox — applies to all widgets
      if (document.getElementById('ra-dl-hidetitle').checked) newW.config.hideTitle = true;
      var type = newW.type;
      var needsDays = ['chart', 'field-timeline', 'stat-cards', 'submissions-by-day', 'avg-per-day'];
      var needsHours = ['submissions-by-hour'];
      var needsLimit = ['recent-feed', 'field-text-list', 'top-contributors', 'form-table', 'submissions-by-form', 'field-select-bar'];
      var needsSortBy = ['form-table', 'submissions-by-form', 'field-text-list'];
      var needsGroupBy = ['chart', 'submissions-period'];
      var needsAggregation = ['field-timeline'];
      var needsPrefix = ['single-stat', 'field-number', 'avg-per-day'];
      // Days
      if (needsDays.indexOf(type) !== -1) newW.config.days = parseInt(document.getElementById('ra-dl-days').value) || 30;
      // Hours
      if (needsHours.indexOf(type) !== -1) {
        newW.config.hours = parseInt(document.getElementById('ra-dl-hours').value) || 24;
      }
      // Chart type (bar or line) — applies to all chart widgets
      var chartTypeWidgets = ['submissions-by-hour', 'chart', 'submissions-by-day', 'submissions-period', 'field-timeline', 'field-select-bar'];
      if (chartTypeWidgets.indexOf(type) !== -1) {
        newW.config.chartType = document.getElementById('ra-dl-charttype').value || 'bar';
      }
      // Limit
      if (needsLimit.indexOf(type) !== -1) newW.config.limit = parseInt(document.getElementById('ra-dl-limit').value) || 15;
      // Sort by
      if (needsSortBy.indexOf(type) !== -1) newW.config.sortBy = document.getElementById('ra-dl-sortby').value;
      // Group by
      if (needsGroupBy.indexOf(type) !== -1) newW.config.groupBy = document.getElementById('ra-dl-groupby').value;
      // Aggregation
      if (needsAggregation.indexOf(type) !== -1) newW.config.aggregation = document.getElementById('ra-dl-aggregation').value;
      // Prefix/Suffix
      if (needsPrefix.indexOf(type) !== -1) {
        var px = document.getElementById('ra-dl-prefix').value.trim();
        var sx = document.getElementById('ra-dl-suffix').value.trim();
        if (px) newW.config.prefix = px;
        if (sx) newW.config.suffix = sx;
      }
      // Name field (who submitted)
      if (type === 'top-contributors' || type === 'recent-feed') {
        var nf = document.getElementById('ra-dl-namefield').value;
        if (nf) newW.config.nameField = nf;
      }
      // Field (for all field-based widgets + pie chart + single-stat)
      if (type === 'pie-chart' || type === 'single-stat' || type.indexOf('field-') === 0) newW.config.field = document.getElementById('ra-dl-field').value;
      // Operation (for number and single-stat)
      if (type === 'field-number' || type === 'single-stat') newW.config.operation = document.getElementById('ra-dl-operation').value;
      // Counter condition
      if (type === 'field-counter') {
        newW.config.matchOp = document.getElementById('ra-dl-matchop').value;
        newW.config.matchValue = document.getElementById('ra-dl-matchval').value.trim();
      }
      // Label
      var labelEl = document.getElementById('ra-dl-label');
      if (labelEl && labelEl.value.trim()) newW.config.label = labelEl.value.trim();
      // Rich text content
      if (type === 'info-text') {
        var rtEl = document.getElementById('ra-dl-richtext');
        if (rtEl) newW.config.html = rtEl.innerHTML;
      }
      // Widget colors (apply to all widget types) — read from hex inputs
      var bgc = document.getElementById('ra-dl-bgcolor-hex').value.trim() || document.getElementById('ra-dl-bgcolor').value;
      var txc = document.getElementById('ra-dl-textcolor-hex').value.trim() || document.getElementById('ra-dl-textcolor').value;
      var hdc = document.getElementById('ra-dl-headercolor-hex').value.trim() || document.getElementById('ra-dl-headercolor').value;
      if (bgc && bgc !== '#ffffff') newW.config.bgColor = bgc;
      if (txc && txc !== '#1e293b') newW.config.textColor = txc;
      if (hdc && hdc !== '#1e293b') newW.config.headerColor = hdc;
      // Title is optional — leave empty to use default widget type name on dashboard

      var dash2 = getCurrentDashboard();
      if (dash2) {
        if (isEdit) {
          dash2.widgets[editIdx] = newW;
        } else {
          dash2.widgets.push(newW);
        }
      }
      modal.remove();
      renderWidgetList();
      autoSaveDashConfig();
    });
  }

  function getSelectedForms() {
    var sel = document.getElementById('ra-dl-forms');
    var opts = sel.selectedOptions || sel.options;
    var vals = [];
    for (var i = 0; i < opts.length; i++) {
      if (opts[i].selected) vals.push(opts[i].value);
    }
    if (vals.indexOf('__all__') !== -1) return ['__all__'];
    return vals;
  }

  function toggleExtraConfig() {
    var type = document.getElementById('ra-dl-type').value;
    var show = function (id, visible) {
      var el = document.getElementById(id);
      if (el) el.style.display = visible ? 'block' : 'none';
    };
    var needsField = ['pie-chart', 'field-number', 'field-text-list', 'field-select-bar', 'field-counter', 'field-latest', 'field-timeline', 'single-stat'];
    var needsDays = ['chart', 'field-timeline', 'stat-cards', 'submissions-by-day', 'avg-per-day'];
    var needsHoursToggle = ['submissions-by-hour'];
    var needsLimit = ['recent-feed', 'field-text-list', 'top-contributors', 'form-table', 'submissions-by-form', 'field-select-bar'];
    var needsNameField = ['top-contributors', 'recent-feed'];
    var needsOperation = ['field-number', 'single-stat'];
    var needsMatch = ['field-counter'];
    var needsLabel = ['single-stat', 'field-number', 'field-counter', 'field-latest'];
    var needsSortBy = ['form-table', 'submissions-by-form', 'field-text-list'];
    var needsGroupBy = ['chart', 'submissions-period'];
    var needsAggregation = ['field-timeline'];
    var needsPrefix = ['single-stat', 'field-number', 'avg-per-day'];

    show('ra-dl-field-wrap', needsField.indexOf(type) !== -1);
    show('ra-dl-days-wrap', needsDays.indexOf(type) !== -1);
    var needsChartType = ['submissions-by-hour', 'chart', 'submissions-by-day', 'submissions-period', 'field-timeline', 'field-select-bar'];
    show('ra-dl-hours-wrap', needsHoursToggle.indexOf(type) !== -1);
    show('ra-dl-charttype-wrap', needsChartType.indexOf(type) !== -1);
    show('ra-dl-limit-wrap', needsLimit.indexOf(type) !== -1);
    show('ra-dl-metric-wrap', false); // Replaced by field + operation for single-stat
    show('ra-dl-operation-wrap', needsOperation.indexOf(type) !== -1);
    show('ra-dl-matchop-wrap', needsMatch.indexOf(type) !== -1);
    show('ra-dl-matchval-wrap', needsMatch.indexOf(type) !== -1);
    show('ra-dl-label-wrap', needsLabel.indexOf(type) !== -1);
    show('ra-dl-namefield-wrap', needsNameField.indexOf(type) !== -1);
    show('ra-dl-sortby-wrap', needsSortBy.indexOf(type) !== -1);
    show('ra-dl-groupby-wrap', needsGroupBy.indexOf(type) !== -1);
    show('ra-dl-aggregation-wrap', needsAggregation.indexOf(type) !== -1);
    show('ra-dl-prefix-wrap', needsPrefix.indexOf(type) !== -1);
    show('ra-dl-richtext-wrap', type === 'info-text');
  }

  // ── Share Modal ──
  function showShareModal(dashId, dashName) {
    var old = document.getElementById('ra-share-modal');
    if (old) old.remove();

    var baseUrl = window.location.origin;
    var modal = document.createElement('div');
    modal.id = 'ra-share-modal';
    modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:100001;display:flex;align-items:center;justify-content:center;';
    modal.innerHTML =
      '<div style="background:#fff;border-radius:10px;width:520px;max-width:90vw;max-height:90vh;overflow-y:auto;box-shadow:0 10px 40px rgba(0,0,0,0.2);">' +
        '<div style="padding:18px 20px;border-bottom:1px solid #e2e8f0;font-size:16px;font-weight:600;color:#1e293b;display:flex;justify-content:space-between;align-items:center;">' +
          'Share Dashboard: ' + escapeHtml(dashName) +
          '<button id="ra-share-close" style="background:none;border:none;font-size:20px;cursor:pointer;color:#94a3b8;" title="Close">&times;</button>' +
        '</div>' +
        '<div style="padding:20px;" id="ra-share-body">' +
          '<div style="text-align:center;padding:20px;color:#94a3b8;">Loading share links...</div>' +
        '</div>' +
      '</div>';

    document.body.appendChild(modal);
    modal.querySelector('#ra-share-close').addEventListener('click', function () { modal.remove(); });
    modal.addEventListener('click', function (e) { if (e.target === modal) modal.remove(); });

    // Load existing shares
    fetch('/webhook-api/dashboard-shares/' + encodeURIComponent(dashId))
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var shares = data.shares || [];
        renderShareBody(dashId, dashName, shares, baseUrl);
      })
      .catch(function () {
        renderShareBody(dashId, dashName, [], baseUrl);
      });
  }

  function renderShareBody(dashId, dashName, shares, baseUrl) {
    var body = document.getElementById('ra-share-body');
    if (!body) return;

    var html = '';

    if (shares.length) {
      shares.forEach(function (s) {
        var publicUrl = baseUrl + '/dashboard/public/' + s.token;
        var embedUrl = baseUrl + '/dashboard/embed/' + s.token;
        var embedCode = '<iframe src="' + embedUrl + '" width="100%" height="600" frameborder="0"></iframe>';

        html += '<div style="margin-bottom:16px;padding:16px;border:1px solid #e2e8f0;border-radius:8px;">' +
          '<div style="font-size:12px;color:#94a3b8;margin-bottom:8px;">Created: ' + escapeHtml(s.created_at) + '</div>' +

          '<div class="ra-st__field"><label>Public Link</label>' +
          '<div style="display:flex;gap:6px;">' +
          '<input type="text" value="' + escapeHtml(publicUrl) + '" readonly style="flex:1;font-size:12px;padding:8px;" onclick="this.select()">' +
          '<button class="ra-st__btn ra-st__btn--secondary ra-share-copy" data-text="' + escapeHtml(publicUrl) + '" style="padding:8px 12px;font-size:12px;white-space:nowrap;">Copy</button>' +
          '</div></div>' +

          '<div class="ra-st__field"><label>Embed Code</label>' +
          '<div style="display:flex;gap:6px;">' +
          '<input type="text" id="ra-share-embed-' + escapeHtml(s.token) + '" value="" readonly style="flex:1;font-size:11px;padding:8px;" onclick="this.select()">' +
          '<button class="ra-st__btn ra-st__btn--secondary ra-share-copy-embed" data-token="' + escapeHtml(s.token) + '" data-embed-url="' + escapeHtml(embedUrl) + '" style="padding:8px 12px;font-size:12px;white-space:nowrap;">Copy</button>' +
          '</div></div>' +

          '<button class="ra-st__btn ra-st__btn--secondary ra-share-revoke" data-token="' + escapeHtml(s.token) + '" style="color:#e74c3c;font-size:12px;margin-top:8px;">Revoke Access</button>' +
        '</div>';
      });
    } else {
      html += '<div style="text-align:center;padding:20px;color:#94a3b8;border:2px dashed #e2e8f0;border-radius:8px;margin-bottom:16px;">' +
        '<p style="margin:0 0 4px;font-size:14px;">No share links yet</p>' +
        '<p style="margin:0;font-size:12px;">Generate a link to share this dashboard publicly.</p></div>';
    }

    html += '<button class="ra-st__btn ra-st__btn--primary" id="ra-share-create" style="width:100%;">Generate Public Link</button>';
    body.innerHTML = html;

    // Populate embed input fields with raw iframe code (not HTML-escaped)
    body.querySelectorAll('[id^="ra-share-embed-"]').forEach(function (inp) {
      var token = inp.id.replace('ra-share-embed-', '');
      inp.value = '<iframe src="' + baseUrl + '/dashboard/embed/' + token + '" width="100%" height="600" frameborder="0"></iframe>';
    });

    // Copy handlers for public link
    body.querySelectorAll('.ra-share-copy').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var text = this.getAttribute('data-text');
        navigator.clipboard.writeText(text).then(function () {
          btn.textContent = 'Copied!';
          setTimeout(function () { btn.textContent = 'Copy'; }, 2000);
        });
      });
    });

    // Copy handlers for embed code
    body.querySelectorAll('.ra-share-copy-embed').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var embedUrl = this.getAttribute('data-embed-url');
        var iframeCode = '<iframe src="' + embedUrl + '" width="100%" height="600" frameborder="0"></iframe>';
        navigator.clipboard.writeText(iframeCode).then(function () {
          btn.textContent = 'Copied!';
          setTimeout(function () { btn.textContent = 'Copy'; }, 2000);
        });
      });
    });

    // Revoke handler
    body.querySelectorAll('.ra-share-revoke').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (!confirm('Revoke this share link? Anyone using it will lose access.')) return;
        var token = this.getAttribute('data-token');
        fetch('/webhook-api/dashboard-share', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dashboard_id: dashId, action: 'revoke', token: token })
        }).then(function () {
          // Reload shares
          fetch('/webhook-api/dashboard-shares/' + encodeURIComponent(dashId))
            .then(function (r) { return r.json(); })
            .then(function (data) { renderShareBody(dashId, '', data.shares || [], baseUrl); });
        });
      });
    });

    // Create handler
    document.getElementById('ra-share-create').addEventListener('click', function () {
      this.disabled = true;
      this.textContent = 'Generating...';
      fetch('/webhook-api/dashboard-share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dashboard_id: dashId, action: 'create' })
      }).then(function (r) { return r.json(); })
        .then(function () {
          // Reload shares
          fetch('/webhook-api/dashboard-shares/' + encodeURIComponent(dashId))
            .then(function (r) { return r.json(); })
            .then(function (data) { renderShareBody(dashId, '', data.shares || [], baseUrl); });
        });
    });
  }

  function saveLayout() {
    var statusEl = document.getElementById('ra-st-dl-status');
    showStatus(statusEl, 'info', 'Saving...');

    saveDashConfig(function (err) {
      if (err) {
        showStatus(statusEl, 'err', err);
      } else {
        showStatus(statusEl, 'ok', 'Dashboard saved! Users assigned to this dashboard will see the new layout.');
      }
    });
  }

  var _gnEditingId = null; // null = adding new, string = editing existing

  // Source type definitions with all tile presets
  var SOURCE_TYPES = {
    geonode: { label: 'GeoNode', fields: ['url', 'token', 'username', 'password'], testable: true },
    wms: { label: 'WMS Service', fields: ['url'], testable: false },
    wfs: { label: 'WFS Service', fields: ['url'], testable: false },
    xyz: { label: 'XYZ Tiles (Custom URL)', fields: ['url'], testable: false },
    google: { label: 'Google Maps', fields: [], testable: false, presets: [
      { name: 'Google Satellite', url: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}' },
      { name: 'Google Hybrid', url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}' },
      { name: 'Google Terrain', url: 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}' },
      { name: 'Google Streets', url: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}' }
    ]},
    esri: { label: 'Esri / ArcGIS', fields: [], testable: false, presets: [
      { name: 'Esri Imagery', url: 'https://server.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}' },
      { name: 'Esri Streets', url: 'https://server.arcgisonline.com/arcgis/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}' },
      { name: 'Esri Topo', url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}' },
      { name: 'Esri Terrain', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer/tile/{z}/{y}/{x}' },
      { name: 'Esri Gray Light', url: 'https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}' },
      { name: 'Esri Gray Dark', url: 'https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}' },
      { name: 'Esri National Geographic', url: 'https://services.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}' },
      { name: 'Esri Ocean', url: 'https://services.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}' }
    ]},
    osm: { label: 'OpenStreetMap', fields: [], testable: false, presets: [
      { name: 'OSM Standard', url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png' },
      { name: 'OSM Humanitarian (HOT)', url: 'https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png' }
    ]},
    carto: { label: 'Carto / MapBox', fields: [], testable: false, presets: [
      { name: 'Carto Light (Positron)', url: 'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png' },
      { name: 'Carto Dark', url: 'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png' },
      { name: 'Carto Voyager', url: 'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png' }
    ]},
    stamen: { label: 'Stamen / Stadia', fields: [], testable: false, presets: [
      { name: 'Stamen Terrain', url: 'https://tiles.stadiamaps.com/tiles/stamen_terrain/{z}/{x}/{y}.png' },
      { name: 'Stamen Toner', url: 'https://tiles.stadiamaps.com/tiles/stamen_toner/{z}/{x}/{y}.png' },
      { name: 'Stamen Toner Light', url: 'https://tiles.stadiamaps.com/tiles/stamen_toner_lite/{z}/{x}/{y}.png' },
      { name: 'Stamen Watercolor', url: 'https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.jpg' }
    ]},
    weather: { label: 'Weather Overlays', fields: [], testable: false, presets: [
      { name: 'OpenWeather Clouds', url: 'https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?APPID=ef3c5137f6c31db50c4c6f1ce4e7e9dd' },
      { name: 'OpenWeather Temperature', url: 'https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?APPID=1c3e4ef8e25596946ee1f3846b53218a' },
      { name: 'OpenWeather Wind', url: 'https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?APPID=f9d0069aa69438d52276ae25c1ee9893' }
    ]}
  };

  function sourceTypeIcon(type) {
    if (type === 'geonode') return '<svg viewBox="0 0 24 24" style="width:16px;height:16px;fill:#54a8dc;"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>';
    if (type === 'wms' || type === 'wfs') return '<svg viewBox="0 0 24 24" style="width:16px;height:16px;fill:#e67e22;"><path d="M20 13H4c-.55 0-1 .45-1 1v6c0 .55.45 1 1 1h16c.55 0 1-.45 1-1v-6c0-.55-.45-1-1-1zM7 19c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM20 3H4c-.55 0-1 .45-1 1v6c0 .55.45 1 1 1h16c.55 0 1-.45 1-1V4c0-.55-.45-1-1-1zM7 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/></svg>';
    if (type === 'xyz') return '<svg viewBox="0 0 24 24" style="width:16px;height:16px;fill:#9b59b6;"><path d="M4 4h7V2H2v9h2V4zm0 16h7v2H2v-9h2v7zm16 0h-7v2h9v-9h-2v7zM20 4h-7V2h9v9h-2V4z"/></svg>';
    if (type === 'google') return '<svg viewBox="0 0 24 24" style="width:16px;height:16px;fill:#4285f4;"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/></svg>';
    if (type === 'esri') return '<svg viewBox="0 0 24 24" style="width:16px;height:16px;fill:#2ecc71;"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>';
    return '<svg viewBox="0 0 24 24" style="width:16px;height:16px;fill:#999;"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/></svg>';
  }

  function renderGeoNodeSection(main) {
    var connections = getGeoNodeSettings();

    var listHtml = '';
    if (connections.length) {
      listHtml = connections.map(function (conn) {
        var typeLabel = SOURCE_TYPES[conn.type] ? SOURCE_TYPES[conn.type].label : 'GeoNode';
        var truncUrl = (conn.url || '').length > 45 ? conn.url.substring(0, 45) + '...' : (conn.url || '');
        return '<div class="ra-st__gn-conn" data-conn-id="' + escapeHtml(conn.id) + '">' +
          '<div style="margin-right:10px;">' + sourceTypeIcon(conn.type || 'geonode') + '</div>' +
          '<div class="ra-st__gn-conn-info">' +
            '<div class="ra-st__gn-conn-name">' + escapeHtml(conn.name || 'Unnamed') +
              ' <span style="font-size:10px;color:#999;font-weight:400;">(' + typeLabel + ')</span></div>' +
            '<div class="ra-st__gn-conn-url">' + escapeHtml(truncUrl) + '</div>' +
          '</div>' +
          '<div class="ra-st__gn-conn-actions">' +
            (SOURCE_TYPES[conn.type || 'geonode'].testable ? '<button class="ra-st__btn ra-st__btn--small" data-action="test">Test</button>' : '') +
            '<button class="ra-st__btn ra-st__btn--small" data-action="edit">Edit</button>' +
            '<button class="ra-st__btn ra-st__btn--small ra-st__btn--danger" data-action="delete">Delete</button>' +
          '</div>' +
        '</div>';
      }).join('');
    } else {
      listHtml = '<div style="padding:16px;text-align:center;color:#999;font-size:13px;">No data sources configured yet.</div>';
    }

    var typeOptions = Object.keys(SOURCE_TYPES).map(function (key) {
      return '<option value="' + key + '">' + SOURCE_TYPES[key].label + '</option>';
    }).join('');

    main.innerHTML =
      '<h1 class="ra-st__page-title">Data Sources</h1>' +
      '<div class="ra-st__content">' +
        '<div class="ra-st__box">' +
          '<div class="ra-st__section-title">Connected Sources</div>' +
          '<p class="ra-st__section-desc">Connect to GeoNode, WMS/WFS services, XYZ tiles, Google Maps, or Esri basemaps.</p>' +
          '<div id="ra-st-gn-list">' + listHtml + '</div>' +
          '<div class="ra-st__status" id="ra-st-gn-status"></div>' +
          '<div style="margin-top:16px;">' +
            '<button class="ra-st__btn ra-st__btn--primary" id="ra-st-gn-add">+ Add Data Source</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    attachGeoNodeHandlers();
  }

  function openDataSourcePopup(connToEdit) {
    // Remove existing popup
    var old = document.querySelector('.ra-st__popup-overlay');
    if (old) old.remove();

    var typeOptions = Object.keys(SOURCE_TYPES).map(function (key) {
      var sel = connToEdit && connToEdit.type === key ? ' selected' : '';
      return '<option value="' + key + '"' + sel + '>' + SOURCE_TYPES[key].label + '</option>';
    }).join('');

    var overlay = document.createElement('div');
    overlay.className = 'ra-st__popup-overlay';
    overlay.innerHTML =
      '<div class="ra-st__popup">' +
        '<div class="ra-st__popup-header">' +
          '<h3>' + (connToEdit ? 'Edit Data Source' : 'Add Data Source') + '</h3>' +
          '<button class="ra-st__popup-close" title="Close">&times;</button>' +
        '</div>' +
        '<div class="ra-st__popup-body">' +
          '<div class="ra-st__field"><label>Source Type</label>' +
            '<select id="ra-st-gn-type" style="width:100%;padding:8px;font-size:13px;border:1px solid #d0d5dd;border-radius:6px;">' +
              typeOptions +
            '</select></div>' +
          '<div id="ra-st-gn-presets" style="display:none;"></div>' +
          '<div class="ra-st__field"><label>Connection Name</label>' +
            '<input type="text" id="ra-st-gn-name" value="' + escapeHtml((connToEdit && connToEdit.name) || '') + '" placeholder="My Data Source"></div>' +
          '<div id="ra-st-gn-url-field" class="ra-st__field"><label>URL</label>' +
            '<input type="url" id="ra-st-gn-url" value="' + escapeHtml((connToEdit && connToEdit.url) || '') + '" placeholder="https://example.com"></div>' +
          '<div id="ra-st-gn-auth-fields">' +
            '<div class="ra-st__field"><label>API Token</label>' +
              '<input type="text" id="ra-st-gn-token" value="' + escapeHtml((connToEdit && connToEdit.token) || '') + '" placeholder="Optional"></div>' +
            '<div class="ra-st__field"><label>Username</label>' +
              '<input type="text" id="ra-st-gn-user" value="' + escapeHtml((connToEdit && connToEdit.username) || '') + '" placeholder="Optional"></div>' +
            '<div class="ra-st__field"><label>Password</label>' +
              '<input type="password" id="ra-st-gn-pass" value="' + escapeHtml((connToEdit && connToEdit.password) || '') + '"></div>' +
          '</div>' +
          '<div class="ra-st__status" id="ra-st-gn-popup-status"></div>' +
        '</div>' +
        '<div class="ra-st__popup-footer">' +
          '<button class="ra-st__btn" id="ra-st-gn-popup-cancel">Cancel</button>' +
          '<button class="ra-st__btn ra-st__btn--success" id="ra-st-gn-popup-save">Save</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(overlay);

    // Close handlers
    overlay.querySelector('.ra-st__popup-close').addEventListener('click', function () { overlay.remove(); });
    overlay.querySelector('#ra-st-gn-popup-cancel').addEventListener('click', function () { overlay.remove(); });
    overlay.addEventListener('click', function (e) { if (e.target === overlay) overlay.remove(); });

    // Type dropdown logic
    var typeSelect = overlay.querySelector('#ra-st-gn-type');
    function updateFormForType() {
      var type = typeSelect.value;
      var def = SOURCE_TYPES[type] || {};
      var urlField = overlay.querySelector('#ra-st-gn-url-field');
      var authFields = overlay.querySelector('#ra-st-gn-auth-fields');
      var presetsEl = overlay.querySelector('#ra-st-gn-presets');

      urlField.style.display = (def.fields && def.fields.indexOf('url') !== -1) || (!def.presets) ? 'block' : 'none';
      authFields.style.display = def.fields && def.fields.indexOf('token') !== -1 ? 'block' : 'none';

      if (def.presets) {
        urlField.style.display = 'none';
        var html = '<div class="ra-st__field"><label>Select Preset</label>' +
          '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:4px;">';
        def.presets.forEach(function (p) {
          html += '<button type="button" class="ra-st__btn ra-st__btn--small ra-st-gn-preset" ' +
            'data-preset-name="' + escapeHtml(p.name) + '" data-preset-url="' + escapeHtml(p.url) + '">' +
            escapeHtml(p.name) + '</button>';
        });
        html += '</div></div>';
        presetsEl.innerHTML = html;
        presetsEl.style.display = 'block';
      } else {
        presetsEl.innerHTML = '';
        presetsEl.style.display = 'none';
      }
    }
    typeSelect.addEventListener('change', updateFormForType);
    updateFormForType();

    // Preset clicks
    overlay.addEventListener('click', function (e) {
      var preset = e.target.closest('.ra-st-gn-preset');
      if (!preset) return;
      overlay.querySelector('#ra-st-gn-name').value = preset.getAttribute('data-preset-name');
      overlay.querySelector('#ra-st-gn-url').value = preset.getAttribute('data-preset-url');
      overlay.querySelectorAll('.ra-st-gn-preset').forEach(function (b) { b.style.background = ''; b.style.color = ''; });
      preset.style.background = '#54a8dc';
      preset.style.color = '#fff';
    });

    // Save handler
    overlay.querySelector('#ra-st-gn-popup-save').addEventListener('click', function () {
      var name = overlay.querySelector('#ra-st-gn-name').value.trim();
      var url = overlay.querySelector('#ra-st-gn-url').value.trim();
      var type = typeSelect.value;
      var defaultName = SOURCE_TYPES[type] ? SOURCE_TYPES[type].label : 'Data Source';

      if (!url && !(SOURCE_TYPES[type] && SOURCE_TYPES[type].presets)) {
        showStatus(overlay.querySelector('#ra-st-gn-popup-status'), 'err', 'URL is required.');
        return;
      }

      var connData = {
        id: connToEdit ? connToEdit.id : generateId(),
        type: type,
        name: name || defaultName,
        url: url,
        token: overlay.querySelector('#ra-st-gn-token').value.trim(),
        username: overlay.querySelector('#ra-st-gn-user').value.trim(),
        password: overlay.querySelector('#ra-st-gn-pass').value.trim()
      };

      var connections = getGeoNodeSettings();
      if (connToEdit) {
        for (var i = 0; i < connections.length; i++) {
          if (connections[i].id === connToEdit.id) { connections[i] = connData; break; }
        }
      } else {
        connections.push(connData);
      }
      saveGeoNodeSettings(connections);
      overlay.remove();
      var statusEl = document.getElementById('ra-st-gn-status');
      if (statusEl) showStatus(statusEl, 'ok', '"' + connData.name + '" saved.');
      renderGeoNodeSection(document.getElementById('ra-st-main'));
    });
  }

  var _exportTab = 'images';
  try { _exportTab = sessionStorage.getItem('ra_export_tab') || 'images'; } catch (e) {}

  function renderExportSection(main) {
    var tabs = [
      { id: 'images', label: 'Images', icon: '&#128247;' },
      { id: 'data', label: 'Data', icon: '&#128196;' },
      { id: 'geo', label: 'Geospatial', icon: '&#127758;' }
    ];

    main.innerHTML =
      '<h1 class="ra-st__page-title">Batch Export</h1>' +
      '<div class="ra-st__tabs" id="ra-exp-tabs">' +
        tabs.map(function (t) {
          return '<button class="ra-st__tab' + (t.id === _exportTab ? ' active' : '') + '" data-tab="' + t.id + '">' + t.icon + ' ' + t.label + '</button>';
        }).join('') +
      '</div>' +
      '<div id="ra-exp-tab-content"></div>';

    document.getElementById('ra-exp-tabs').addEventListener('click', function (e) {
      var tab = e.target.closest('.ra-st__tab');
      if (!tab) return;
      _exportTab = tab.getAttribute('data-tab');
      try { sessionStorage.setItem('ra_export_tab', _exportTab); } catch (e) {}
      document.querySelectorAll('#ra-exp-tabs .ra-st__tab').forEach(function (t) { t.classList.remove('active'); });
      tab.classList.add('active');
      renderExportTabContent();
    });

    renderExportTabContent();
  }

  function renderExportTabContent() {
    var container = document.getElementById('ra-exp-tab-content');
    if (!container) return;
    if (_exportTab === 'images') renderImagesTab(container);
    else if (_exportTab === 'data') renderDataTab(container);
    else if (_exportTab === 'geo') renderGeoTab(container);
  }

  // ── Images Tab ──
  var _imgForms = [];
  var _imgData = [];
  var _imgSelected = new Set();
  var _imgFormFields = {};

  function renderImagesTab(container) {
    container.innerHTML =
      '<div class="ra-st__content" style="max-width:900px;">' +
        // Form selector
        '<div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-bottom:16px;">' +
          '<select id="ra-img-form" style="flex:1;min-width:200px;padding:10px 12px;font-size:14px;border:1px solid #d0d5dd;border-radius:6px;background:#fff;">' +
            '<option value="">Loading forms...</option>' +
          '</select>' +
          '<div id="ra-img-stats" style="display:flex;gap:16px;font-size:13px;color:#666;"></div>' +
        '</div>' +

        // Filters — field-based dropdown + value + date range
        '<div id="ra-img-filters" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;align-items:flex-end;">' +
          '<div style="min-width:130px;">' +
            '<label style="font-size:10px;font-weight:600;color:#888;display:block;margin-bottom:3px;">Filter by field</label>' +
            '<select id="ra-img-filter-field" style="width:100%;padding:8px;font-size:12px;border:1px solid #d0d5dd;border-radius:4px;">' +
              '<option value="">No filter</option><option value="_submitted_by">Submitted By</option>' +
            '</select>' +
          '</div>' +
          '<div style="flex:1;min-width:120px;">' +
            '<label style="font-size:10px;font-weight:600;color:#888;display:block;margin-bottom:3px;">Value</label>' +
            '<select id="ra-img-filter-value" style="width:100%;padding:8px;font-size:12px;border:1px solid #d0d5dd;border-radius:4px;">' +
              '<option value="">All</option>' +
            '</select>' +
          '</div>' +
          '<div style="min-width:120px;">' +
            '<label style="font-size:10px;font-weight:600;color:#888;display:block;margin-bottom:3px;">From date</label>' +
            '<input type="date" id="ra-img-date-from" onclick="this.showPicker&&this.showPicker()" style="width:100%;padding:8px 10px;font-size:13px;cursor:pointer;border:1px solid #d0d5dd;border-radius:4px;box-sizing:border-box;">' +
          '</div>' +
          '<div style="min-width:120px;">' +
            '<label style="font-size:10px;font-weight:600;color:#888;display:block;margin-bottom:3px;">To date</label>' +
            '<input type="date" id="ra-img-date-to" onclick="this.showPicker&&this.showPicker()" style="width:100%;padding:8px 10px;font-size:13px;cursor:pointer;border:1px solid #d0d5dd;border-radius:4px;box-sizing:border-box;">' +
          '</div>' +
          '<button class="ra-st__btn ra-st__btn--secondary" id="ra-img-filter-clear" style="font-size:12px;padding:8px 12px;height:36px;">Clear</button>' +
        '</div>' +

        // Selection controls
        '<div style="display:flex;gap:6px;align-items:center;margin-bottom:10px;">' +
          '<button class="ra-st__btn ra-st__btn--secondary" id="ra-img-sel-all" style="font-size:12px;padding:6px 10px;">Select All</button>' +
          '<button class="ra-st__btn ra-st__btn--secondary" id="ra-img-sel-none" style="font-size:12px;padding:6px 10px;">Deselect All</button>' +
          '<span style="flex:1;"></span>' +
          '<span id="ra-img-sel-count" style="font-size:12px;color:#54a8dc;font-weight:600;"></span>' +
        '</div>' +

        // Image grid
        '<div id="ra-img-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px;border:1px solid #eee;border-radius:6px;padding:8px;min-height:150px;"></div>' +

        // Naming config
        '<div style="border:1px solid #e2e8f0;border-radius:8px;padding:14px;margin-top:16px;">' +
          '<div style="font-size:13px;font-weight:600;color:#29292a;margin-bottom:10px;">Rename Images Before Export</div>' +
          '<div style="display:flex;gap:10px;flex-wrap:wrap;">' +
            '<div style="flex:1;min-width:120px;">' +
              '<label style="font-size:11px;font-weight:600;color:#666;display:block;margin-bottom:4px;">Prefix</label>' +
              '<input type="text" id="ra-img-prefix" placeholder="e.g., RA_" style="width:100%;padding:8px;border:1px solid #d0d5dd;border-radius:4px;font-size:13px;box-sizing:border-box;">' +
            '</div>' +
            '<div style="flex:1;min-width:150px;">' +
              '<label style="font-size:11px;font-weight:600;color:#666;display:block;margin-bottom:4px;">Name by field</label>' +
              '<select id="ra-img-namefield" style="width:100%;padding:8px;border:1px solid #d0d5dd;border-radius:4px;font-size:13px;">' +
                '<option value="_id">Submission ID</option><option value="_submitted_by">Submitted By</option><option value="_submission_time">Date</option>' +
              '</select>' +
            '</div>' +
            '<div style="flex:1;min-width:120px;">' +
              '<label style="font-size:11px;font-weight:600;color:#666;display:block;margin-bottom:4px;">Add sequence #</label>' +
              '<select id="ra-img-seq" style="width:100%;padding:8px;border:1px solid #d0d5dd;border-radius:4px;font-size:13px;">' +
                '<option value="yes">Yes (_001, _002)</option><option value="no">No</option>' +
              '</select>' +
            '</div>' +
          '</div>' +
          '<div style="margin-top:6px;font-size:12px;color:#94a3b8;">Preview: <strong id="ra-img-preview">image_001.jpg</strong></div>' +
        '</div>' +

        // Export buttons — actual image downloads
        '<div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap;">' +
          '<button class="ra-st__btn ra-st__btn--primary" id="ra-img-export-zip" style="flex:1;min-width:180px;">&#128230; Download as ZIP</button>' +
          '<button class="ra-st__btn ra-st__btn--primary" id="ra-img-export-single" style="flex:1;min-width:180px;background:#10b981;">&#128247; Download Selected Images</button>' +
          '<button class="ra-st__btn ra-st__btn--secondary" id="ra-img-export-csv" style="min-width:120px;">Export List (CSV)</button>' +
        '</div>' +
        '<div id="ra-img-progress" style="margin-top:8px;display:none;">' +
          '<div style="background:#f1f5f9;border-radius:4px;height:20px;overflow:hidden;">' +
            '<div id="ra-img-progress-bar" style="height:100%;background:#54a8dc;border-radius:4px;transition:width 0.3s;width:0%;"></div>' +
          '</div>' +
          '<div id="ra-img-progress-text" style="font-size:12px;color:#666;margin-top:4px;text-align:center;"></div>' +
        '</div>' +
        '<div class="ra-st__status" id="ra-img-status" style="margin-top:8px;"></div>' +
      '</div>';

    loadImageForms();
    setupImageFilters();
    setupImageExport();
  }

  function loadImageForms() {
    var sel = document.getElementById('ra-img-form');
    fetch('/api/v2/assets/?asset_type=survey&fields=["uid","name","deployment_status","deployment__submission_count","content"]&limit=200', { credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        _imgForms = (data.results || []).filter(function (f) { return f.deployment_status === 'deployed' && (f.deployment__submission_count || 0) > 0; });
        sel.innerHTML = '<option value="">-- Select a form --</option>' +
          _imgForms.map(function (f) {
            return '<option value="' + f.uid + '">' + escapeHtml(f.name) + ' (' + (f.deployment__submission_count || 0) + ')</option>';
          }).join('');

        sel.addEventListener('change', function () {
          if (this.value) loadImagesForForm(this.value);
          else { _imgData = []; _imgSelected = new Set(); renderImageGrid(); updateImageStats(); }
        });
      });
  }

  function loadImagesForForm(uid) {
    var grid = document.getElementById('ra-img-grid');
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:30px;color:#94a3b8;">Loading images...</div>';

    // Get form fields for naming
    var form = _imgForms.find(function (f) { return f.uid === uid; });
    _imgFormFields = {};
    if (form && form.content && form.content.survey) {
      form.content.survey.forEach(function (row) {
        var t = row.type || '';
        if (t.indexOf('begin') === 0 || t.indexOf('end') === 0 || t === 'calculate' || t === 'note' || t === 'hidden') return;
        var name = row.name || row.$autoname || '';
        var label = (row.label && row.label[0]) || name;
        if (name) _imgFormFields[name] = label;
      });
    }
    // Update naming field dropdown
    var nameSelect = document.getElementById('ra-img-namefield');
    if (nameSelect) {
      nameSelect.innerHTML = '<option value="_id">Submission ID</option>' +
        '<option value="_submitted_by">Submitted By</option>' +
        '<option value="_submission_time">Date</option>';
      Object.keys(_imgFormFields).forEach(function (name) {
        nameSelect.innerHTML += '<option value="' + escapeHtml(name) + '">' + escapeHtml(_imgFormFields[name]) + '</option>';
      });
    }

    fetch('/api/v2/assets/' + uid + '/data/?limit=30000', { credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        _imgData = [];
        (data.results || []).forEach(function (sub) {
          (sub._attachments || []).forEach(function (att) {
            var url = att.download_url || att.download_medium_url || att.download_small_url;
            var mime = att.mimetype || '';
            if (mime.indexOf('image') === -1) return;
            if (url) {
              _imgData.push({
                url: url,
                thumb: att.download_small_url || att.download_medium_url || url,
                filename: att.filename || 'image',
                mime: mime,
                sub: sub,
                subId: sub._id,
                submittedBy: sub._submitted_by || 'anonymous',
                time: sub._submission_time || ''
              });
            }
          });
        });
        _imgSelected = new Set(_imgData.map(function (m, i) { return i; }));
        renderImageGrid();
        updateImageStats();
        updateImagePreview();
      });
  }

  function renderImageGrid(filter) {
    var grid = document.getElementById('ra-img-grid');
    if (!grid) return;

    var filtered = _imgData;
    if (filter) {
      var fField = filter.filterField || '';
      var fValue = filter.filterValue || '';
      var dateFrom = filter.dateFrom ? new Date(filter.dateFrom + 'T00:00:00') : null;
      var dateTo = filter.dateTo ? new Date(filter.dateTo + 'T23:59:59') : null;

      filtered = _imgData.filter(function (m) {
        // Field/value filter
        if (fField && fValue) {
          var val = '';
          if (fField === '_submitted_by') val = m.submittedBy;
          else if (fField === '_submission_time') val = (m.time || '').split('T')[0];
          else {
            val = m.sub[fField];
            if (val === undefined) {
              for (var k in m.sub) { if (k.endsWith('/' + fField)) { val = m.sub[k]; break; } }
            }
          }
          if (String(val || '') !== fValue) return false;
        }
        // Date filter
        if (dateFrom && m.time && new Date(m.time) < dateFrom) return false;
        if (dateTo && m.time && new Date(m.time) > dateTo) return false;
        return true;
      });
    }

    if (!filtered.length) {
      grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:#94a3b8;">' +
        (_imgData.length ? 'No images match the filter' : 'Select a form to view images') + '</div>';
      return;
    }

    grid.innerHTML = filtered.map(function (m) {
      var origIdx = _imgData.indexOf(m);
      var isSel = _imgSelected.has(origIdx);
      return '<div data-idx="' + origIdx + '" class="ra-img-card" style="position:relative;border:2px solid ' + (isSel ? '#54a8dc' : '#e2e8f0') + ';border-radius:6px;overflow:hidden;cursor:pointer;background:#f8fafc;">' +
        '<img src="' + m.thumb + '" style="width:100%;aspect-ratio:1;object-fit:cover;display:block;" loading="lazy" onerror="this.style.display=\'none\'">' +
        '<div style="position:absolute;top:4px;left:4px;width:20px;height:20px;border-radius:4px;background:' + (isSel ? '#54a8dc' : 'rgba(255,255,255,0.85)') + ';border:1.5px solid ' + (isSel ? '#54a8dc' : '#bbb') + ';display:flex;align-items:center;justify-content:center;">' +
          (isSel ? '<span style="color:#fff;font-size:13px;">&#10003;</span>' : '') +
        '</div>' +
        '<div style="padding:4px 6px;font-size:10px;color:#666;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="' + escapeHtml(m.submittedBy) + ' &middot; ' + (m.time ? m.time.split('T')[0] : '') + '">' +
          escapeHtml(m.submittedBy) +
        '</div>' +
      '</div>';
    }).join('');

    // Click to toggle selection
    grid.querySelectorAll('.ra-img-card').forEach(function (card) {
      card.addEventListener('click', function () {
        var idx = parseInt(this.getAttribute('data-idx'));
        if (_imgSelected.has(idx)) _imgSelected.delete(idx);
        else _imgSelected.add(idx);
        renderImageGrid(getCurrentImageFilter());
        updateImageStats();
      });
    });
  }

  function getCurrentImageFilter() {
    var filterField = (document.getElementById('ra-img-filter-field') || {}).value || '';
    var filterValue = (document.getElementById('ra-img-filter-value') || {}).value || '';
    var dateFrom = (document.getElementById('ra-img-date-from') || {}).value || '';
    var dateTo = (document.getElementById('ra-img-date-to') || {}).value || '';
    if (!filterField && !filterValue && !dateFrom && !dateTo) return null;
    return { filterField: filterField, filterValue: filterValue, dateFrom: dateFrom, dateTo: dateTo };
  }

  function updateImageStats() {
    var stats = document.getElementById('ra-img-stats');
    if (!stats) return;
    stats.innerHTML =
      '<div><strong style="color:#54a8dc;font-size:16px;">' + _imgData.length + '</strong> images</div>' +
      '<div><strong style="color:#10b981;font-size:16px;">' + _imgSelected.size + '</strong> selected</div>';
    var countEl = document.getElementById('ra-img-sel-count');
    if (countEl) countEl.textContent = _imgSelected.size + ' of ' + _imgData.length + ' selected';
  }

  function setupImageFilters() {
    // Field-based filter: when field changes, populate value dropdown
    var fieldSel = document.getElementById('ra-img-filter-field');
    var valueSel = document.getElementById('ra-img-filter-value');

    if (fieldSel) {
      fieldSel.addEventListener('change', function () {
        populateFilterValues(this.value);
        // Reset value selection when field changes
        var vs = document.getElementById('ra-img-filter-value');
        if (vs) vs.value = '';
        applyImageFilter();
      });
    }
    // Use delegated event on the parent since innerHTML replaces the select options
    var filterWrap = document.getElementById('ra-img-filters');
    if (filterWrap) {
      filterWrap.addEventListener('change', function (e) {
        if (e.target.id === 'ra-img-filter-value') applyImageFilter();
      });
    }

    ['ra-img-date-from', 'ra-img-date-to'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('change', applyImageFilter);
    });

    document.getElementById('ra-img-filter-clear')?.addEventListener('click', function () {
      if (fieldSel) fieldSel.value = '';
      if (valueSel) valueSel.innerHTML = '<option value="">All</option>';
      document.getElementById('ra-img-date-from').value = '';
      document.getElementById('ra-img-date-to').value = '';
      renderImageGrid();
    });

    document.getElementById('ra-img-sel-all')?.addEventListener('click', function () {
      _imgSelected = new Set(_imgData.map(function (m, i) { return i; }));
      renderImageGrid(getCurrentImageFilter());
      updateImageStats();
    });

    document.getElementById('ra-img-sel-none')?.addEventListener('click', function () {
      _imgSelected = new Set();
      renderImageGrid(getCurrentImageFilter());
      updateImageStats();
    });

    document.getElementById('ra-img-prefix')?.addEventListener('input', updateImagePreview);
    document.getElementById('ra-img-namefield')?.addEventListener('change', updateImagePreview);
    document.getElementById('ra-img-seq')?.addEventListener('change', updateImagePreview);
  }

  function populateFilterValues(fieldName) {
    var valueSel = document.getElementById('ra-img-filter-value');
    if (!valueSel) return;
    valueSel.innerHTML = '<option value="">All</option>';
    if (!fieldName) return;

    var values = {};
    _imgData.forEach(function (m) {
      var val = '';
      if (fieldName === '_submitted_by') val = m.submittedBy;
      else if (fieldName === '_submission_time') val = (m.time || '').split('T')[0];
      else {
        val = m.sub[fieldName];
        if (val === undefined) {
          for (var k in m.sub) { if (k.endsWith('/' + fieldName)) { val = m.sub[k]; break; } }
        }
      }
      val = String(val || '');
      if (val) values[val] = (values[val] || 0) + 1;
    });

    Object.keys(values).sort().forEach(function (v) {
      valueSel.innerHTML += '<option value="' + escapeHtml(v) + '">' + escapeHtml(v) + ' (' + values[v] + ')</option>';
    });
  }

  function applyImageFilter() {
    renderImageGrid(getCurrentImageFilter());
  }

  // Update filter field dropdown when form fields load
  function updateFilterFieldOptions() {
    var fieldSel = document.getElementById('ra-img-filter-field');
    if (!fieldSel) return;
    fieldSel.innerHTML = '<option value="">No filter</option><option value="_submitted_by">Submitted By</option>';
    Object.keys(_imgFormFields).forEach(function (name) {
      fieldSel.innerHTML += '<option value="' + escapeHtml(name) + '">' + escapeHtml(_imgFormFields[name]) + '</option>';
    });
  }

  function generateImageName(m, idx) {
    var prefix = (document.getElementById('ra-img-prefix') || {}).value || '';
    var field = (document.getElementById('ra-img-namefield') || {}).value || '_id';
    var useSeq = ((document.getElementById('ra-img-seq') || {}).value || 'yes') === 'yes';

    var val = '';
    if (field === '_id') val = m.subId || idx;
    else if (field === '_submitted_by') val = m.submittedBy;
    else if (field === '_submission_time') val = (m.time || '').split('T')[0];
    else {
      val = m.sub[field];
      if (val === undefined) {
        for (var k in m.sub) { if (k.endsWith('/' + field)) { val = m.sub[k]; break; } }
      }
    }
    val = String(val || '').replace(/[^a-zA-Z0-9_.-]/g, '_').substring(0, 50);
    var ext = m.filename.split('.').pop() || 'jpg';
    var parts = [];
    if (prefix) parts.push(prefix.replace(/[^a-zA-Z0-9_.-]/g, '_'));
    if (val) parts.push(val);
    if (useSeq) parts.push(String(idx + 1).padStart(3, '0'));
    return (parts.join('_') || 'image_' + (idx + 1)) + '.' + ext;
  }

  function updateImagePreview() {
    var el = document.getElementById('ra-img-preview');
    if (el && _imgData.length) el.textContent = generateImageName(_imgData[0], 0);
  }

  function setupImageExport() {
    // Download as ZIP
    document.getElementById('ra-img-export-zip')?.addEventListener('click', function () {
      var selected = Array.from(_imgSelected).sort();
      if (!selected.length) { alert('Select at least one image'); return; }
      downloadImagesAsZip(selected);
    });

    // Download individual images (one by one with custom names)
    document.getElementById('ra-img-export-single')?.addEventListener('click', function () {
      var selected = Array.from(_imgSelected).sort();
      if (!selected.length) { alert('Select at least one image'); return; }
      if (selected.length === 1) {
        // Single image — direct download
        downloadSingleImage(selected[0]);
      } else {
        // Multiple — download one by one with small delay
        downloadImagesSequentially(selected);
      }
    });

    // CSV list (keep as secondary option)
    document.getElementById('ra-img-export-csv')?.addEventListener('click', function () {
      var selected = Array.from(_imgSelected).sort();
      if (!selected.length) { alert('Select at least one image'); return; }
      var lines = ['custom_name,original_filename,download_url,submitted_by,date'];
      selected.forEach(function (idx) {
        var m = _imgData[idx];
        lines.push('"' + generateImageName(m, idx) + '","' + m.filename.replace(/"/g, '""') + '","' + m.url + '","' + m.submittedBy + '","' + (m.time || '').split('T')[0] + '"');
      });
      var blob = new Blob([lines.join('\n')], { type: 'text/csv' });
      var a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = 'images_export.csv'; document.body.appendChild(a); a.click(); document.body.removeChild(a);
      showStatus(document.getElementById('ra-img-status'), 'ok', 'Exported CSV with ' + selected.length + ' image records');
    });
  }

  // ── Image Download Functions ──
  function showImageProgress(pct, text) {
    var wrap = document.getElementById('ra-img-progress');
    var bar = document.getElementById('ra-img-progress-bar');
    var txt = document.getElementById('ra-img-progress-text');
    if (wrap) wrap.style.display = 'block';
    if (bar) bar.style.width = pct + '%';
    if (txt) txt.textContent = text;
  }

  function hideImageProgress() {
    var wrap = document.getElementById('ra-img-progress');
    if (wrap) wrap.style.display = 'none';
  }

  function downloadSingleImage(idx) {
    var m = _imgData[idx];
    var customName = generateImageName(m, idx);
    showImageProgress(50, 'Downloading ' + customName + '...');
    fetch(m.url, { credentials: 'same-origin' })
      .then(function (r) { return r.blob(); })
      .then(function (blob) {
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = customName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
        showImageProgress(100, 'Downloaded!');
        setTimeout(hideImageProgress, 2000);
      })
      .catch(function (err) {
        showImageProgress(0, 'Error: ' + err.message);
      });
  }

  function downloadImagesSequentially(indices) {
    var total = indices.length;
    var current = 0;
    showImageProgress(0, 'Downloading 0 of ' + total + '...');

    function next() {
      if (current >= total) {
        showImageProgress(100, 'Downloaded ' + total + ' images!');
        setTimeout(hideImageProgress, 3000);
        return;
      }
      var idx = indices[current];
      var m = _imgData[idx];
      var customName = generateImageName(m, idx);
      var pct = Math.round((current / total) * 100);
      showImageProgress(pct, 'Downloading ' + (current + 1) + ' of ' + total + ': ' + customName);

      fetch(m.url, { credentials: 'same-origin' })
        .then(function (r) { return r.blob(); })
        .then(function (blob) {
          var a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = customName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(a.href);
          current++;
          setTimeout(next, 500); // Small delay between downloads
        })
        .catch(function () {
          current++;
          setTimeout(next, 200);
        });
    }
    next();
  }

  function downloadImagesAsZip(indices) {
    // Load JSZip from CDN
    if (!window.JSZip) {
      showImageProgress(0, 'Loading ZIP library...');
      var script = document.createElement('script');
      script.src = 'https://unpkg.com/jszip@3.10.1/dist/jszip.min.js';
      script.onload = function () { buildZip(indices); };
      script.onerror = function () {
        showImageProgress(0, 'Failed to load ZIP library. Try "Download Selected Images" instead.');
      };
      document.head.appendChild(script);
    } else {
      buildZip(indices);
    }
  }

  function buildZip(indices) {
    var zip = new JSZip();
    var total = indices.length;
    var loaded = 0;
    showImageProgress(0, 'Fetching images 0 of ' + total + '...');

    var fetchPromises = indices.map(function (idx) {
      var m = _imgData[idx];
      var customName = generateImageName(m, idx);
      return fetch(m.url, { credentials: 'same-origin' })
        .then(function (r) { return r.blob(); })
        .then(function (blob) {
          zip.file(customName, blob);
          loaded++;
          showImageProgress(Math.round((loaded / total) * 80), 'Fetching images ' + loaded + ' of ' + total + '...');
        })
        .catch(function () { loaded++; }); // skip failed images
    });

    Promise.all(fetchPromises).then(function () {
      showImageProgress(85, 'Creating ZIP file...');
      return zip.generateAsync({ type: 'blob' }, function (meta) {
        showImageProgress(85 + Math.round(meta.percent * 0.15), 'Compressing... ' + Math.round(meta.percent) + '%');
      });
    }).then(function (blob) {
      showImageProgress(100, 'ZIP ready! Downloading...');
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'images_export_' + total + '.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
      setTimeout(function () {
        showImageProgress(100, 'Done! Downloaded ' + total + ' images as ZIP.');
        setTimeout(hideImageProgress, 3000);
      }, 500);
    }).catch(function (err) {
      showImageProgress(0, 'ZIP error: ' + err.message);
    });
  }

  // Also call updateFilterFieldOptions when form images load
  var _origLoadImagesForForm = loadImagesForForm;
  loadImagesForForm = function (uid) {
    _origLoadImagesForForm(uid);
    setTimeout(updateFilterFieldOptions, 500);
  };

  // ── Data Tab (simplified from old export) ──
  function renderDataTab(container) {
    container.innerHTML =
      '<div class="ra-st__content">' +
        '<p style="color:#888;margin:0 0 16px;">Export submission data from your forms.</p>' +
        '<div class="ra-st__field"><label>Format</label>' +
          '<select id="ra-st-exp-format" style="width:100%;padding:10px;font-size:14px;border:1px solid #d0d5dd;border-radius:6px;">' +
            '<option value="csv">CSV (.csv)</option><option value="xlsx">Excel (.xlsx)</option></select></div>' +
        '<div class="ra-st__field"><label>Select Forms</label>' +
          '<div id="ra-st-exp-forms" style="border:1px solid #eee;border-radius:6px;max-height:250px;overflow-y:auto;"></div></div>' +
        '<div class="ra-st__actions">' +
          '<button class="ra-st__btn ra-st__btn--secondary" id="ra-st-exp-selectall">Select All</button>' +
          '<button class="ra-st__btn ra-st__btn--primary" id="ra-st-exp-go">Export Data</button></div>' +
        '<div class="ra-st__status" id="ra-st-exp-status"></div>' +
      '</div>';
    loadExportForms();
    document.getElementById('ra-st-exp-selectall')?.addEventListener('click', function () {
      var cbs = document.querySelectorAll('#ra-st-exp-forms input[type="checkbox"]');
      var all = Array.from(cbs).every(function (c) { return c.checked; });
      cbs.forEach(function (c) { c.checked = !all; });
    });
    document.getElementById('ra-st-exp-go')?.addEventListener('click', function () {
      var fmt = document.getElementById('ra-st-exp-format').value;
      var sel = Array.from(document.querySelectorAll('#ra-st-exp-forms input:checked')).map(function (c) { return c.value; });
      if (!sel.length) { showStatus(document.getElementById('ra-st-exp-status'), 'err', 'Select at least one form'); return; }
      showStatus(document.getElementById('ra-st-exp-status'), 'info', 'Exporting...');
      batchExportData(sel, fmt);
    });
  }

  // ── Geo Tab ──
  function renderGeoTab(container) {
    container.innerHTML =
      '<div class="ra-st__content">' +
        '<p style="color:#888;margin:0 0 16px;">Export geospatial data from your forms.</p>' +
        '<div class="ra-st__field"><label>Format</label>' +
          '<select id="ra-st-exp-format" style="width:100%;padding:10px;font-size:14px;border:1px solid #d0d5dd;border-radius:6px;">' +
            '<option value="geojson">GeoJSON (.geojson)</option><option value="kml">KML (.kml)</option>' +
            '<option value="csv">CSV with coordinates (.csv)</option><option value="gpx">GPX (.gpx)</option></select></div>' +
        '<div class="ra-st__field"><label>Select Forms</label>' +
          '<div id="ra-st-exp-forms" style="border:1px solid #eee;border-radius:6px;max-height:250px;overflow-y:auto;"></div></div>' +
        '<div class="ra-st__actions">' +
          '<button class="ra-st__btn ra-st__btn--secondary" id="ra-st-exp-selectall">Select All</button>' +
          '<button class="ra-st__btn ra-st__btn--primary" id="ra-st-exp-go">Export Geospatial</button></div>' +
        '<div class="ra-st__status" id="ra-st-exp-status"></div>' +
      '</div>';
    loadExportForms();
    document.getElementById('ra-st-exp-selectall')?.addEventListener('click', function () {
      var cbs = document.querySelectorAll('#ra-st-exp-forms input[type="checkbox"]');
      var all = Array.from(cbs).every(function (c) { return c.checked; });
      cbs.forEach(function (c) { c.checked = !all; });
    });
    document.getElementById('ra-st-exp-go')?.addEventListener('click', function () {
      var fmt = document.getElementById('ra-st-exp-format').value;
      var sel = Array.from(document.querySelectorAll('#ra-st-exp-forms input:checked')).map(function (c) { return c.value; });
      if (!sel.length) { showStatus(document.getElementById('ra-st-exp-status'), 'err', 'Select at least one form'); return; }
      showStatus(document.getElementById('ra-st-exp-status'), 'info', 'Exporting...');
      batchExport(sel, fmt);
    });
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
          return '<label style="display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid #f5f5f5;cursor:pointer;min-height:40px;">' +
            '<input type="checkbox" value="' + f.uid + '" class="ra-exp-form-cb" style="margin:0;flex-shrink:0;width:16px;height:16px;">' +
            '<span style="flex:1;font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0;">' + escapeHtml(f.name) + '</span>' +
            '<span style="color:#999;font-size:12px;flex-shrink:0;margin-left:8px;">' + (f.deployment__submission_count || 0) + ' submissions</span>' +
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
        if (window.raMediaExport) { window.raMediaExport.run(selected, format, document.getElementById("ra-st-exp-status")); } else { batchExportMedia(selected, format); }
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
        openDataSourcePopup(conn);
      } else if (action === 'delete') {
        if (!confirm('Delete "' + (conn.name || 'Unnamed') + '"?')) return;
        var updated = connections.filter(function (c) { return c.id !== connId; });
        saveGeoNodeSettings(updated);
        showStatus(statusEl, 'ok', 'Deleted.');
        renderGeoNodeSection(document.getElementById('ra-st-main'));
      }
    });

    // Add button opens popup
    document.getElementById('ra-st-gn-add').addEventListener('click', function () {
      openDataSourcePopup(null);
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

  // ── Assignments Section ──
  var _assignmentsData = null;
  var _assignmentsForms = null;
  var _assignmentsUsers = null;

  function loadAssignmentsData(cb) {
    fetch(apiUrl('/assignments'), { credentials: 'same-origin' })
      .then(function (r) {
        if (!r.ok) throw new Error('not ok');
        return r.json();
      })
      .then(function (data) {
        _assignmentsData = data;
        if (cb) cb();
      })
      .catch(function () {
        if (_apiBase === '/webhook-api') {
          _apiBase = 'http://localhost:5050/api';
          return loadAssignmentsData(cb);
        }
        _assignmentsData = { assignments: [] };
        if (cb) cb();
      });
  }

  function renderAssignmentsSection(main) {
    main.innerHTML =
      '<h1 class="ra-st__page-title">Assignments</h1>' +
      '<div class="ra-st__content" style="max-width:900px;">' +
        '<p style="color:#666;margin:0 0 16px;font-size:14px;">' +
          'Assign forms to users with deadlines. Track progress by comparing submission counts against expectations.' +
        '</p>' +
        '<div style="margin-bottom:20px;">' +
          '<button class="ra-st__btn ra-st__btn--primary" id="ra-asgn-new">+ New Assignment</button>' +
        '</div>' +
        '<div class="ra-st__status" id="ra-asgn-status"></div>' +
        '<div id="ra-asgn-list"><div style="padding:16px;text-align:center;color:#999;">Loading...</div></div>' +
      '</div>';

    document.getElementById('ra-asgn-new').addEventListener('click', function () {
      showAssignmentModal();
    });

    loadAssignmentsData(function () {
      renderAssignmentsList();
    });

    // Preload forms and users for the create modal
    if (!_assignmentsForms) {
      fetch('/api/v2/assets/?asset_type=survey&fields=["uid","name","deployment_status","deployment__submission_count"]&limit=200', { credentials: 'same-origin' })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          _assignmentsForms = (data.results || []).filter(function (f) { return f.deployment_status === 'deployed'; });
        })
        .catch(function () { _assignmentsForms = []; });
    }
    if (!_assignmentsUsers) {
      fetch('/api/v2/users/?format=json&limit=200', { credentials: 'same-origin' })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          _assignmentsUsers = (data.results || []).filter(function (u) {
            return u.is_active && u.username !== 'AnonymousUser';
          });
        })
        .catch(function () { _assignmentsUsers = []; });
    }
  }

  function renderAssignmentsList() {
    var listEl = document.getElementById('ra-asgn-list');
    if (!listEl || !_assignmentsData) return;

    var assignments = _assignmentsData.assignments || [];
    if (!assignments.length) {
      listEl.innerHTML = '<div style="padding:32px;text-align:center;color:#94a3b8;border:2px dashed #e2e8f0;border-radius:8px;">' +
        '<p style="font-size:14px;margin:0 0 8px;">No assignments yet</p>' +
        '<p style="font-size:12px;margin:0;">Click "+ New Assignment" to assign a form to users.</p></div>';
      return;
    }

    listEl.innerHTML = assignments.map(function (a) {
      var userCount = (a.assigned_to || []).length;
      var subCount = a.submission_count || 0;
      var deadline = a.deadline || 'No deadline';
      var statusColor = a.status === 'completed' ? '#10b981' : '#f59e0b';
      var statusLabel = a.status === 'completed' ? 'Completed' : 'Active';

      return '<div style="border:1px solid #e2e8f0;border-radius:8px;margin-bottom:12px;background:#fff;overflow:hidden;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;">' +
          '<div style="flex:1;min-width:0;">' +
            '<div style="display:flex;align-items:center;gap:8px;">' +
              '<div style="font-size:16px;font-weight:600;color:#1e293b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + escapeHtml(a.form_name || a.form_uid || 'Unknown Form') + '</div>' +
              '<span style="font-size:11px;padding:2px 8px;border-radius:10px;background:' + statusColor + '20;color:' + statusColor + ';font-weight:600;">' + statusLabel + '</span>' +
            '</div>' +
            '<div style="font-size:12px;color:#94a3b8;margin-top:4px;">' +
              userCount + ' user(s) assigned &middot; Deadline: ' + escapeHtml(deadline) + ' &middot; Created by: ' + escapeHtml(a.created_by || 'admin') +
            '</div>' +
            '<div style="margin-top:8px;">' +
              '<div style="font-size:11px;color:#64748b;margin-bottom:4px;">Assigned to: ' + escapeHtml((a.assigned_to || []).join(', ')) + '</div>' +
              '<div style="background:#e2e8f0;border-radius:4px;height:8px;overflow:hidden;">' +
                '<div style="background:#54a8dc;height:100%;width:' + Math.min(100, Math.round((subCount / Math.max(userCount, 1)) * 100)) + '%;border-radius:4px;transition:width 0.3s;"></div>' +
              '</div>' +
              '<div style="font-size:10px;color:#94a3b8;margin-top:2px;">' + subCount + ' submissions</div>' +
            '</div>' +
          '</div>' +
          '<div style="display:flex;gap:8px;flex-shrink:0;margin-left:16px;">' +
            '<button class="ra-st__btn ra-st__btn--secondary ra-asgn-toggle" data-id="' + escapeHtml(a.id) + '" data-status="' + escapeHtml(a.status) + '" style="padding:8px 16px;font-size:13px;">' + (a.status === 'completed' ? 'Reactivate' : 'Complete') + '</button>' +
            '<button class="ra-st__btn ra-st__btn--secondary ra-asgn-delete" data-id="' + escapeHtml(a.id) + '" style="padding:8px 16px;font-size:13px;color:#e74c3c;">Delete</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    }).join('');

    listEl.querySelectorAll('.ra-asgn-delete').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = this.getAttribute('data-id');
        if (!confirm('Delete this assignment?')) return;
        fetch(apiUrl('/assignments/' + id), { method: 'DELETE', credentials: 'same-origin' })
          .then(function (r) { return r.json(); })
          .then(function () {
            loadAssignmentsData(function () { renderAssignmentsList(); });
            showStatus(document.getElementById('ra-asgn-status'), 'ok', 'Assignment deleted.');
          })
          .catch(function () {
            showStatus(document.getElementById('ra-asgn-status'), 'err', 'Failed to delete assignment.');
          });
      });
    });

    listEl.querySelectorAll('.ra-asgn-toggle').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = this.getAttribute('data-id');
        var currentStatus = this.getAttribute('data-status');
        var newStatus = currentStatus === 'completed' ? 'active' : 'completed';
        var asgn = null;
        for (var i = 0; i < _assignmentsData.assignments.length; i++) {
          if (_assignmentsData.assignments[i].id === id) { asgn = _assignmentsData.assignments[i]; break; }
        }
        if (!asgn) return;
        asgn.status = newStatus;
        fetch(apiUrl('/assignments'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify(asgn)
        }).then(function () {
          loadAssignmentsData(function () { renderAssignmentsList(); });
        });
      });
    });
  }

  function showAssignmentModal() {
    var modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:100001;display:flex;align-items:center;justify-content:center;';

    var formOptions = '<option value="">Loading forms...</option>';
    if (_assignmentsForms && _assignmentsForms.length) {
      formOptions = '<option value="">-- Select a form --</option>' +
        _assignmentsForms.map(function (f) {
          return '<option value="' + escapeHtml(f.uid) + '" data-name="' + escapeHtml(f.name) + '">' + escapeHtml(f.name) + ' (' + (f.deployment__submission_count || 0) + ' submissions)</option>';
        }).join('');
    }

    var userCheckboxes = '<div style="color:#999;font-size:13px;">Loading users...</div>';
    if (_assignmentsUsers && _assignmentsUsers.length) {
      userCheckboxes = _assignmentsUsers.map(function (u) {
        var label = u.username;
        if (u.metadata && u.metadata.name) label += ' (' + u.metadata.name + ')';
        return '<label style="display:flex;align-items:center;gap:8px;padding:6px 0;font-size:13px;cursor:pointer;">' +
          '<input type="checkbox" value="' + escapeHtml(u.username) + '" class="ra-asgn-user-cb" style="width:16px;height:16px;">' +
          escapeHtml(label) +
        '</label>';
      }).join('');
    }

    modal.innerHTML =
      '<div style="background:#fff;border-radius:10px;width:500px;max-width:90vw;max-height:90vh;overflow-y:auto;box-shadow:0 10px 40px rgba(0,0,0,0.2);">' +
        '<div style="padding:18px 20px;border-bottom:1px solid #e2e8f0;font-size:16px;font-weight:600;display:flex;justify-content:space-between;align-items:center;">' +
          'New Assignment' +
          '<button id="ra-asgn-modal-close" style="background:none;border:none;font-size:20px;cursor:pointer;color:#94a3b8;">&times;</button>' +
        '</div>' +
        '<div style="padding:20px;">' +
          '<div class="ra-st__field"><label>Form</label><select id="ra-asgn-form">' + formOptions + '</select></div>' +
          '<div class="ra-st__field"><label>Assign to Users</label><div id="ra-asgn-users" style="max-height:200px;overflow-y:auto;border:1px solid #e2e8f0;border-radius:6px;padding:8px 12px;">' + userCheckboxes + '</div></div>' +
          '<div class="ra-st__field"><label>Deadline</label><input type="date" id="ra-asgn-deadline"></div>' +
          '<div style="display:flex;gap:10px;margin-top:20px;">' +
            '<button class="ra-st__btn ra-st__btn--primary" id="ra-asgn-modal-save">Create Assignment</button>' +
            '<button class="ra-st__btn ra-st__btn--secondary" id="ra-asgn-modal-cancel">Cancel</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    document.body.appendChild(modal);

    function closeModal() { modal.remove(); }
    document.getElementById('ra-asgn-modal-close').addEventListener('click', closeModal);
    document.getElementById('ra-asgn-modal-cancel').addEventListener('click', closeModal);
    modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });

    document.getElementById('ra-asgn-modal-save').addEventListener('click', function () {
      var formSelect = document.getElementById('ra-asgn-form');
      var formUid = formSelect.value;
      var formName = formSelect.options[formSelect.selectedIndex] ? formSelect.options[formSelect.selectedIndex].getAttribute('data-name') || '' : '';
      var deadline = document.getElementById('ra-asgn-deadline').value;
      var users = [];
      modal.querySelectorAll('.ra-asgn-user-cb:checked').forEach(function (cb) {
        users.push(cb.value);
      });

      if (!formUid) { alert('Select a form'); return; }
      if (!users.length) { alert('Select at least one user'); return; }

      var payload = {
        form_uid: formUid,
        form_name: formName,
        assigned_to: users,
        deadline: deadline,
        created_by: 'admin'
      };

      fetch(apiUrl('/assignments'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(payload)
      })
        .then(function (r) { return r.json(); })
        .then(function () {
          closeModal();
          loadAssignmentsData(function () { renderAssignmentsList(); });
          showStatus(document.getElementById('ra-asgn-status'), 'ok', 'Assignment created.');
        })
        .catch(function () {
          alert('Failed to create assignment');
        });
    });
  }


  // ── Announcements Section ──
  var _announcementsData = null;

  function loadAnnouncementsData(cb) {
    fetch(apiUrl('/announcements'), { credentials: 'same-origin' })
      .then(function (r) {
        if (!r.ok) throw new Error('not ok');
        return r.json();
      })
      .then(function (data) {
        _announcementsData = data;
        if (cb) cb();
      })
      .catch(function () {
        if (_apiBase === '/webhook-api') {
          _apiBase = 'http://localhost:5050/api';
          return loadAnnouncementsData(cb);
        }
        _announcementsData = { announcements: [] };
        if (cb) cb();
      });
  }

  function renderAnnouncementsSection(main) {
    main.innerHTML =
      '<h1 class="ra-st__page-title">Announcements</h1>' +
      '<div class="ra-st__content" style="max-width:900px;">' +
        '<p style="color:#666;margin:0 0 16px;font-size:14px;">' +
          'Create announcements that appear as banners on all pages for all users. Use different types for different urgency levels.' +
        '</p>' +
        '<div style="margin-bottom:20px;">' +
          '<button class="ra-st__btn ra-st__btn--primary" id="ra-ann-new">+ New Announcement</button>' +
        '</div>' +
        '<div class="ra-st__status" id="ra-ann-status"></div>' +
        '<div id="ra-ann-list"><div style="padding:16px;text-align:center;color:#999;">Loading...</div></div>' +
      '</div>';

    document.getElementById('ra-ann-new').addEventListener('click', function () {
      showAnnouncementModal();
    });

    loadAnnouncementsData(function () {
      renderAnnouncementsList();
    });
  }

  function renderAnnouncementsList() {
    var listEl = document.getElementById('ra-ann-list');
    if (!listEl || !_announcementsData) return;

    var announcements = _announcementsData.announcements || [];
    if (!announcements.length) {
      listEl.innerHTML = '<div style="padding:32px;text-align:center;color:#94a3b8;border:2px dashed #e2e8f0;border-radius:8px;">' +
        '<p style="font-size:14px;margin:0 0 8px;">No active announcements</p>' +
        '<p style="font-size:12px;margin:0;">Click "+ New Announcement" to create one.</p></div>';
      return;
    }

    var typeColors = { info: '#3b82f6', warning: '#f59e0b', urgent: '#ef4444' };
    var typeBgColors = { info: '#eff6ff', warning: '#fffbeb', urgent: '#fef2f2' };
    var typeLabels = { info: 'Info', warning: 'Warning', urgent: 'Urgent' };

    listEl.innerHTML = announcements.map(function (a) {
      var color = typeColors[a.type] || typeColors.info;
      var bg = typeBgColors[a.type] || typeBgColors.info;
      var label = typeLabels[a.type] || 'Info';
      var expires = a.expires_at ? 'Expires: ' + a.expires_at.split('T')[0] : 'No expiry';

      return '<div style="border:1px solid ' + color + '40;border-left:4px solid ' + color + ';border-radius:8px;margin-bottom:12px;background:' + bg + ';overflow:hidden;">' +
        '<div style="display:flex;align-items:flex-start;justify-content:space-between;padding:16px 20px;">' +
          '<div style="flex:1;min-width:0;">' +
            '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">' +
              '<span style="font-size:11px;padding:2px 8px;border-radius:10px;background:' + color + ';color:#fff;font-weight:600;text-transform:uppercase;">' + label + '</span>' +
              '<span style="font-size:16px;font-weight:600;color:#1e293b;">' + escapeHtml(a.title) + '</span>' +
            '</div>' +
            '<div style="font-size:14px;color:#475569;margin-bottom:6px;">' + escapeHtml(a.message) + '</div>' +
            '<div style="font-size:11px;color:#94a3b8;">' +
              escapeHtml(expires) + ' &middot; Created: ' + escapeHtml((a.created_at || '').split('T')[0]) +
              (a.created_by ? ' by ' + escapeHtml(a.created_by) : '') +
            '</div>' +
          '</div>' +
          '<button class="ra-st__btn ra-st__btn--secondary ra-ann-delete" data-id="' + escapeHtml(a.id) + '" style="padding:8px 16px;font-size:13px;color:#e74c3c;flex-shrink:0;margin-left:16px;">Delete</button>' +
        '</div>' +
      '</div>';
    }).join('');

    listEl.querySelectorAll('.ra-ann-delete').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = this.getAttribute('data-id');
        if (!confirm('Delete this announcement?')) return;
        fetch(apiUrl('/announcements/' + id), { method: 'DELETE', credentials: 'same-origin' })
          .then(function (r) { return r.json(); })
          .then(function () {
            loadAnnouncementsData(function () { renderAnnouncementsList(); });
            showStatus(document.getElementById('ra-ann-status'), 'ok', 'Announcement deleted.');
          })
          .catch(function () {
            showStatus(document.getElementById('ra-ann-status'), 'err', 'Failed to delete.');
          });
      });
    });
  }

  function showAnnouncementModal() {
    var modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:100001;display:flex;align-items:center;justify-content:center;';
    modal.innerHTML =
      '<div style="background:#fff;border-radius:10px;width:480px;max-width:90vw;box-shadow:0 10px 40px rgba(0,0,0,0.2);">' +
        '<div style="padding:18px 20px;border-bottom:1px solid #e2e8f0;font-size:16px;font-weight:600;display:flex;justify-content:space-between;align-items:center;">' +
          'New Announcement' +
          '<button id="ra-ann-modal-close" style="background:none;border:none;font-size:20px;cursor:pointer;color:#94a3b8;">&times;</button>' +
        '</div>' +
        '<div style="padding:20px;">' +
          '<div class="ra-st__field"><label>Title</label><input type="text" id="ra-ann-title" placeholder="e.g., System Maintenance"></div>' +
          '<div class="ra-st__field"><label>Message</label><textarea id="ra-ann-message" rows="3" style="width:100%;padding:10px 12px;font-size:14px;border:1px solid #d0d5dd;border-radius:6px;box-sizing:border-box;resize:vertical;font-family:inherit;" placeholder="Describe the announcement..."></textarea></div>' +
          '<div style="display:flex;gap:12px;">' +
            '<div class="ra-st__field" style="flex:1;"><label>Type</label><select id="ra-ann-type"><option value="info">Info (blue)</option><option value="warning">Warning (yellow)</option><option value="urgent">Urgent (red)</option></select></div>' +
            '<div class="ra-st__field" style="flex:1;"><label>Expires</label><input type="date" id="ra-ann-expires"></div>' +
          '</div>' +
          '<div style="display:flex;gap:10px;margin-top:20px;">' +
            '<button class="ra-st__btn ra-st__btn--primary" id="ra-ann-modal-save">Create Announcement</button>' +
            '<button class="ra-st__btn ra-st__btn--secondary" id="ra-ann-modal-cancel">Cancel</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    document.body.appendChild(modal);

    function closeModal() { modal.remove(); }
    document.getElementById('ra-ann-modal-close').addEventListener('click', closeModal);
    document.getElementById('ra-ann-modal-cancel').addEventListener('click', closeModal);
    modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });

    document.getElementById('ra-ann-modal-save').addEventListener('click', function () {
      var title = document.getElementById('ra-ann-title').value.trim();
      var message = document.getElementById('ra-ann-message').value.trim();
      var type = document.getElementById('ra-ann-type').value;
      var expires = document.getElementById('ra-ann-expires').value;

      if (!title || !message) { alert('Title and message are required'); return; }

      var payload = {
        title: title,
        message: message,
        type: type,
        expires_at: expires ? expires + 'T23:59:59Z' : '',
        created_by: 'admin'
      };

      fetch(apiUrl('/announcements'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(payload)
      })
        .then(function (r) { return r.json(); })
        .then(function () {
          closeModal();
          loadAnnouncementsData(function () { renderAnnouncementsList(); });
          showStatus(document.getElementById('ra-ann-status'), 'ok', 'Announcement created.');
        })
        .catch(function () {
          alert('Failed to create announcement');
        });
    });
  }


  // ── Teams Section ──
  var _teamsData = null;
  var _teamsForms = null;
  var _teamsUsers = null;

  function loadTeamsData(cb) {
    fetch(apiUrl('/teams'), { credentials: 'same-origin' })
      .then(function (r) {
        if (!r.ok) throw new Error('not ok');
        return r.json();
      })
      .then(function (data) {
        _teamsData = data;
        if (cb) cb();
      })
      .catch(function () {
        if (_apiBase === '/webhook-api') {
          _apiBase = 'http://localhost:5050/api';
          return loadTeamsData(cb);
        }
        _teamsData = { teams: [] };
        if (cb) cb();
      });
  }

  // ══════════════════════════════════════════════════════════
  // ── USER MANAGEMENT SECTION ──
  // ══════════════════════════════════════════════════════════
  var _umUsers = null;
  var _umForms = null;
  var _umSubCounts = {};
  var _umAllSubs = null;
  var _umSearchTerm = '';
  var _umFilterRole = 'all';
  var _umFilterStatus = 'all';
  var _umFilterInactive = '0';
  var _umActiveTab = 'users';
  var _umSelectedRows = {};

  function renderUserManagementTab(container) {
    container.innerHTML =
      '<div class="ra-st__content" style="max-width:1200px;">' +

        // Stats bar — 5 cards
        '<div id="ra-um-stats" style="display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:20px;">' +
          '<div style="background:#fff;border:1px solid #e1e3ea;border-radius:6px;padding:16px;text-align:center;">' +
            '<div style="font-size:28px;font-weight:700;color:#54a8dc;" id="ra-um-total">-</div>' +
            '<div style="font-size:11px;color:#94a3b8;">Total Users</div>' +
          '</div>' +
          '<div style="background:#fff;border:1px solid #e1e3ea;border-radius:6px;padding:16px;text-align:center;">' +
            '<div style="font-size:28px;font-weight:700;color:#10b981;" id="ra-um-active">-</div>' +
            '<div style="font-size:11px;color:#94a3b8;">Active Users</div>' +
          '</div>' +
          '<div style="background:#fff;border:1px solid #e1e3ea;border-radius:6px;padding:16px;text-align:center;">' +
            '<div style="font-size:28px;font-weight:700;color:#8b5cf6;" id="ra-um-dashboard">-</div>' +
            '<div style="font-size:11px;color:#94a3b8;">Dashboard Users</div>' +
          '</div>' +
          '<div style="background:#fff;border:1px solid #e1e3ea;border-radius:6px;padding:16px;text-align:center;">' +
            '<div style="font-size:28px;font-weight:700;color:#f59e0b;" id="ra-um-new-week">-</div>' +
            '<div style="font-size:11px;color:#94a3b8;">New This Week</div>' +
          '</div>' +
          '<div style="background:#fff;border:1px solid #e1e3ea;border-radius:6px;padding:16px;text-align:center;">' +
            '<div style="font-size:28px;font-weight:700;color:#ef4444;" id="ra-um-inactive30">-</div>' +
            '<div style="font-size:11px;color:#94a3b8;">Inactive 30d+</div>' +
          '</div>' +
        '</div>' +

        // Sub-tabs
        '<div style="display:flex;gap:0;border-bottom:2px solid #e1e3ea;margin-bottom:16px;">' +
          '<button class="ra-um-subtab" data-tab="users" style="padding:10px 24px;border:none;background:none;font-size:13px;font-weight:600;cursor:pointer;border-bottom:2px solid #54a8dc;margin-bottom:-2px;color:#54a8dc;">Users</button>' +
          '<button class="ra-um-subtab" data-tab="activity" style="padding:10px 24px;border:none;background:none;font-size:13px;font-weight:600;cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-2px;color:#64748b;">Activity</button>' +
          '<button class="ra-um-subtab" data-tab="analytics" style="padding:10px 24px;border:none;background:none;font-size:13px;font-weight:600;cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-2px;color:#64748b;">Analytics</button>' +
        '</div>' +

        // Sub-tab content area
        '<div id="ra-um-subtab-content"></div>' +

        '<div class="ra-st__status" id="ra-um-status"></div>' +
      '</div>';

    // Sub-tab switching
    container.querySelectorAll('.ra-um-subtab').forEach(function (btn) {
      btn.addEventListener('click', function () {
        _umActiveTab = this.getAttribute('data-tab');
        container.querySelectorAll('.ra-um-subtab').forEach(function (b) {
          b.style.borderBottomColor = 'transparent';
          b.style.color = '#64748b';
        });
        this.style.borderBottomColor = '#54a8dc';
        this.style.color = '#54a8dc';
        renderUMActiveSubTab();
      });
    });

    loadUMData();
  }

  function renderUMActiveSubTab() {
    if (_umActiveTab === 'users') renderUMUsersSubTab();
    else if (_umActiveTab === 'activity') renderUMActivitySubTab();
    else if (_umActiveTab === 'analytics') renderUMAnalyticsSubTab();
  }

  // ── Users Sub-Tab ──
  function renderUMUsersSubTab() {
    var wrap = document.getElementById('ra-um-subtab-content');
    if (!wrap) return;

    wrap.innerHTML =
      // Controls bar
      '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px;align-items:center;">' +
        '<input type="text" id="ra-um-search" placeholder="Search users..." value="' + escapeHtml(_umSearchTerm) + '" style="flex:1;min-width:180px;padding:9px 14px;border:1px solid #e1e3ea;border-radius:4px;font-size:13px;">' +
        '<select id="ra-um-filter-role" style="padding:9px 12px;border:1px solid #e1e3ea;border-radius:4px;font-size:13px;background:#fff;">' +
          '<option value="all"' + (_umFilterRole === 'all' ? ' selected' : '') + '>All Roles</option>' +
          '<option value="admin"' + (_umFilterRole === 'admin' ? ' selected' : '') + '>Admins</option>' +
          '<option value="dashboard"' + (_umFilterRole === 'dashboard' ? ' selected' : '') + '>Dashboard Only</option>' +
          '<option value="regular"' + (_umFilterRole === 'regular' ? ' selected' : '') + '>Regular Users</option>' +
        '</select>' +
        '<select id="ra-um-filter-status" style="padding:9px 12px;border:1px solid #e1e3ea;border-radius:4px;font-size:13px;background:#fff;">' +
          '<option value="all"' + (_umFilterStatus === 'all' ? ' selected' : '') + '>All Status</option>' +
          '<option value="active"' + (_umFilterStatus === 'active' ? ' selected' : '') + '>Active</option>' +
          '<option value="inactive"' + (_umFilterStatus === 'inactive' ? ' selected' : '') + '>Inactive</option>' +
        '</select>' +
        '<select id="ra-um-filter-inactive" style="padding:9px 12px;border:1px solid #e1e3ea;border-radius:4px;font-size:13px;background:#fff;">' +
          '<option value="0"' + (_umFilterInactive === '0' ? ' selected' : '') + '>No Login Filter</option>' +
          '<option value="7"' + (_umFilterInactive === '7' ? ' selected' : '') + '>No login 7d+</option>' +
          '<option value="30"' + (_umFilterInactive === '30' ? ' selected' : '') + '>No login 30d+</option>' +
          '<option value="90"' + (_umFilterInactive === '90' ? ' selected' : '') + '>No login 90d+</option>' +
        '</select>' +
      '</div>' +

      // Bulk actions + add + export row
      '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px;align-items:center;">' +
        '<button id="ra-um-add-btn" style="padding:9px 18px;background:#54a8dc;color:#fff;border:none;border-radius:4px;font-size:13px;font-weight:600;cursor:pointer;white-space:nowrap;">+ Add User</button>' +
        '<button id="ra-um-export-btn" style="padding:9px 18px;background:#10b981;color:#fff;border:none;border-radius:4px;font-size:13px;font-weight:600;cursor:pointer;white-space:nowrap;">Export Excel</button>' +
        '<span id="ra-um-bulk-wrap" style="display:none;margin-left:8px;">' +
          '<span id="ra-um-sel-count" style="font-size:12px;color:#64748b;margin-right:8px;">0 selected</span>' +
          '<button class="ra-um-bulk-btn" data-action="activate" style="padding:5px 12px;background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0;border-radius:4px;font-size:11px;font-weight:600;cursor:pointer;margin-right:4px;">Activate</button>' +
          '<button class="ra-um-bulk-btn" data-action="deactivate" style="padding:5px 12px;background:#fef2f2;color:#dc2626;border:1px solid #fecaca;border-radius:4px;font-size:11px;font-weight:600;cursor:pointer;margin-right:4px;">Deactivate</button>' +
          '<button class="ra-um-bulk-btn" data-action="dashboard" style="padding:5px 12px;background:#eff6ff;color:#1e40af;border:1px solid #bfdbfe;border-radius:4px;font-size:11px;font-weight:600;cursor:pointer;margin-right:4px;">Assign Dashboard</button>' +
          '<button class="ra-um-bulk-btn" data-action="export" style="padding:5px 12px;background:#f5f3ff;color:#6d28d9;border:1px solid #ddd6fe;border-radius:4px;font-size:11px;font-weight:600;cursor:pointer;">Export Selected</button>' +
        '</span>' +
        '<span style="flex:1;"></span>' +
        '<span id="ra-um-count" style="font-size:12px;color:#94a3b8;white-space:nowrap;"></span>' +
      '</div>' +

      // Table
      '<div id="ra-um-table-wrap">' +
        '<div style="padding:24px;text-align:center;color:#94a3b8;">Loading users...</div>' +
      '</div>';

    // Bind events
    document.getElementById('ra-um-search').addEventListener('input', function () {
      _umSearchTerm = this.value.toLowerCase();
      renderUMTable();
    });
    document.getElementById('ra-um-filter-role').addEventListener('change', function () {
      _umFilterRole = this.value;
      renderUMTable();
    });
    document.getElementById('ra-um-filter-status').addEventListener('change', function () {
      _umFilterStatus = this.value;
      renderUMTable();
    });
    document.getElementById('ra-um-filter-inactive').addEventListener('change', function () {
      _umFilterInactive = this.value;
      renderUMTable();
    });
    document.getElementById('ra-um-add-btn').addEventListener('click', function () {
      showUserModal(null);
    });
    document.getElementById('ra-um-export-btn').addEventListener('click', function () {
      exportUsersExcel(false);
    });
    wrap.querySelectorAll('.ra-um-bulk-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        umBulkAction(this.getAttribute('data-action'));
      });
    });

    if (_umUsers) {
      renderUMTable();
    }
  }

  // ── Activity Sub-Tab ──
  function renderUMActivitySubTab() {
    var wrap = document.getElementById('ra-um-subtab-content');
    if (!wrap) return;

    wrap.innerHTML =
      '<div style="display:flex;gap:20px;flex-wrap:wrap;">' +
        // Recent submissions panel
        '<div style="flex:2;min-width:300px;">' +
          '<div style="background:#fff;border:1px solid #e1e3ea;border-radius:6px;padding:16px;">' +
            '<div style="font-size:14px;font-weight:700;color:#1e293b;margin-bottom:12px;">Recent Submissions (last 50)</div>' +
            '<div id="ra-um-recent-subs" style="font-size:13px;color:#94a3b8;">Loading...</div>' +
          '</div>' +
        '</div>' +
        // User timeline panel
        '<div style="flex:1;min-width:260px;">' +
          '<div style="background:#fff;border:1px solid #e1e3ea;border-radius:6px;padding:16px;">' +
            '<div style="font-size:14px;font-weight:700;color:#1e293b;margin-bottom:12px;">User Submission Timeline</div>' +
            '<div style="margin-bottom:10px;">' +
              '<select id="ra-um-activity-user" style="width:100%;padding:8px 12px;border:1px solid #e1e3ea;border-radius:4px;font-size:13px;background:#fff;">' +
                '<option value="">Select a user...</option>' +
              '</select>' +
            '</div>' +
            '<div id="ra-um-user-timeline" style="font-size:12px;color:#94a3b8;">Select a user to view timeline</div>' +
          '</div>' +
          '<div style="background:#fff;border:1px solid #e1e3ea;border-radius:6px;padding:16px;margin-top:16px;">' +
            '<div style="font-size:14px;font-weight:700;color:#1e293b;margin-bottom:12px;">Login History</div>' +
            '<div id="ra-um-login-history" style="font-size:12px;color:#94a3b8;">Select a user above</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    // Populate user dropdown
    var sel = document.getElementById('ra-um-activity-user');
    if (_umUsers) {
      _umUsers.forEach(function (u) {
        if (u.username === 'AnonymousUser') return;
        var opt = document.createElement('option');
        opt.value = u.username;
        opt.textContent = u.username;
        sel.appendChild(opt);
      });
    }
    sel.addEventListener('change', function () {
      var username = this.value;
      if (username) {
        loadUserTimeline(username);
        renderLoginHistory(username);
      } else {
        document.getElementById('ra-um-user-timeline').innerHTML = 'Select a user to view timeline';
        document.getElementById('ra-um-login-history').innerHTML = 'Select a user above';
      }
    });

    // Load recent submissions
    loadRecentSubmissions();
  }

  function loadRecentSubmissions() {
    var el = document.getElementById('ra-um-recent-subs');
    if (!el) return;

    fetch('/api/v2/submissions/?limit=50&sort={"_submission_time":-1}&fields=["_submitted_by","_submission_time","_xform_id_string"]', { credentials: 'same-origin' })
      .then(function (r) { return r.ok ? r.json() : { results: [] }; })
      .then(function (data) {
        var subs = data.results || [];
        _umAllSubs = subs;
        if (!subs.length) {
          el.innerHTML = '<div style="padding:12px;font-style:italic;">No recent submissions found</div>';
          return;
        }
        var html = '<table style="width:100%;border-collapse:collapse;font-size:13px;">' +
          '<thead><tr style="border-bottom:1px solid #e1e3ea;">' +
            '<th style="text-align:left;padding:8px;font-size:11px;font-weight:600;text-transform:uppercase;color:#64748b;">User</th>' +
            '<th style="text-align:left;padding:8px;font-size:11px;font-weight:600;text-transform:uppercase;color:#64748b;">Form</th>' +
            '<th style="text-align:right;padding:8px;font-size:11px;font-weight:600;text-transform:uppercase;color:#64748b;">Time</th>' +
          '</tr></thead><tbody>';
        subs.forEach(function (s) {
          var user = s._submitted_by || 'anonymous';
          var form = s._xform_id_string || '-';
          var time = s._submission_time ? formatLastLogin(s._submission_time) : '-';
          html += '<tr style="border-bottom:1px solid #f0f0f0;cursor:pointer;" class="ra-um-sub-row" data-user="' + escapeHtml(user) + '">' +
            '<td style="padding:8px;">' +
              '<div style="display:flex;align-items:center;gap:8px;">' +
                '<img src="/webhook-api/avatar/' + escapeHtml(user) + '" style="width:24px;height:24px;border-radius:50%;object-fit:cover;flex-shrink:0;" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\';">' +
                '<div style="width:24px;height:24px;border-radius:50%;background:#e0f2fe;color:#0284c7;display:none;align-items:center;justify-content:center;font-weight:700;font-size:11px;flex-shrink:0;">' + user.charAt(0).toUpperCase() + '</div>' +
                '<span style="font-weight:500;">' + escapeHtml(user) + '</span>' +
              '</div>' +
            '</td>' +
            '<td style="padding:8px;color:#64748b;">' + escapeHtml(form) + '</td>' +
            '<td style="padding:8px;text-align:right;color:#94a3b8;font-size:12px;">' + time + '</td>' +
          '</tr>';
        });
        html += '</tbody></table>';
        el.innerHTML = html;

        // Click on a submission row to load that user's timeline
        el.querySelectorAll('.ra-um-sub-row').forEach(function (row) {
          row.addEventListener('click', function () {
            var username = this.getAttribute('data-user');
            var sel2 = document.getElementById('ra-um-activity-user');
            if (sel2) sel2.value = username;
            loadUserTimeline(username);
            renderLoginHistory(username);
          });
        });
      })
      .catch(function () {
        el.innerHTML = '<div style="padding:12px;color:#e74c3c;">Failed to load submissions</div>';
      });
  }

  function loadUserTimeline(username) {
    var el = document.getElementById('ra-um-user-timeline');
    if (!el) return;
    el.innerHTML = '<span style="color:#94a3b8;">Loading...</span>';

    fetch('/api/v2/submissions/?query={"_submitted_by":"' + encodeURIComponent(username) + '"}&limit=30&sort={"_submission_time":-1}&fields=["_submission_time","_xform_id_string"]', { credentials: 'same-origin' })
      .then(function (r) { return r.ok ? r.json() : { results: [] }; })
      .then(function (data) {
        var subs = data.results || [];
        if (!subs.length) {
          el.innerHTML = '<div style="font-style:italic;">No submissions from this user</div>';
          return;
        }
        var html = '';
        subs.forEach(function (s, i) {
          var time = s._submission_time ? formatLastLogin(s._submission_time) : '-';
          var form = s._xform_id_string || '-';
          html += '<div style="display:flex;align-items:flex-start;gap:10px;padding:6px 0;' + (i < subs.length - 1 ? 'border-bottom:1px solid #f0f0f0;' : '') + '">' +
            '<div style="width:8px;height:8px;border-radius:50%;background:#54a8dc;margin-top:4px;flex-shrink:0;"></div>' +
            '<div style="flex:1;min-width:0;">' +
              '<div style="font-size:12px;color:#1e293b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + escapeHtml(form) + '</div>' +
              '<div style="font-size:11px;color:#94a3b8;">' + time + '</div>' +
            '</div>' +
          '</div>';
        });
        el.innerHTML = html;
      })
      .catch(function () {
        el.innerHTML = '<div style="color:#e74c3c;">Failed to load timeline</div>';
      });
  }

  function renderLoginHistory(username) {
    var el = document.getElementById('ra-um-login-history');
    if (!el) return;
    var u = _umUsers ? _umUsers.find(function (usr) { return usr.username === username; }) : null;
    if (!u) {
      el.innerHTML = 'User not found';
      return;
    }
    var lastLogin = u.last_login ? formatLastLogin(u.last_login) : 'Never';
    var joined = formatDate(u.date_joined);
    el.innerHTML =
      '<div style="padding:6px 0;border-bottom:1px solid #f0f0f0;display:flex;justify-content:space-between;">' +
        '<span style="color:#64748b;">Last Login</span>' +
        '<span style="color:#1e293b;font-weight:500;">' + lastLogin + '</span>' +
      '</div>' +
      '<div style="padding:6px 0;display:flex;justify-content:space-between;">' +
        '<span style="color:#64748b;">Date Joined</span>' +
        '<span style="color:#1e293b;font-weight:500;">' + joined + '</span>' +
      '</div>' +
      '<div style="padding:6px 0;display:flex;justify-content:space-between;">' +
        '<span style="color:#64748b;">Status</span>' +
        '<span>' + getStatusBadge(u.is_active) + '</span>' +
      '</div>';
  }

  // ── Analytics Sub-Tab ──
  function renderUMAnalyticsSubTab() {
    var wrap = document.getElementById('ra-um-subtab-content');
    if (!wrap) return;

    wrap.innerHTML =
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">' +
        // Active Users Chart
        '<div style="background:#fff;border:1px solid #e1e3ea;border-radius:6px;padding:16px;">' +
          '<div style="font-size:14px;font-weight:700;color:#1e293b;margin-bottom:12px;">Daily Active Users (30 days)</div>' +
          '<div id="ra-um-chart-active" style="min-height:200px;color:#94a3b8;font-size:12px;">Loading...</div>' +
        '</div>' +
        // Submissions Trend
        '<div style="background:#fff;border:1px solid #e1e3ea;border-radius:6px;padding:16px;">' +
          '<div style="font-size:14px;font-weight:700;color:#1e293b;margin-bottom:12px;">Submissions Trend (30 days)</div>' +
          '<div id="ra-um-chart-subs" style="min-height:200px;color:#94a3b8;font-size:12px;">Loading...</div>' +
        '</div>' +
        // Top Contributors
        '<div style="background:#fff;border:1px solid #e1e3ea;border-radius:6px;padding:16px;">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">' +
            '<div style="font-size:14px;font-weight:700;color:#1e293b;">Top Contributors</div>' +
            '<select id="ra-um-contrib-period" style="padding:4px 8px;border:1px solid #e1e3ea;border-radius:4px;font-size:12px;background:#fff;">' +
              '<option value="7">This Week</option>' +
              '<option value="30">This Month</option>' +
            '</select>' +
          '</div>' +
          '<div id="ra-um-top-contrib" style="font-size:13px;color:#94a3b8;">Loading...</div>' +
        '</div>' +
        // Inactive Users Report
        '<div style="background:#fff;border:1px solid #e1e3ea;border-radius:6px;padding:16px;">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">' +
            '<div style="font-size:14px;font-weight:700;color:#1e293b;">Inactive Users Report</div>' +
            '<select id="ra-um-inactive-period" style="padding:4px 8px;border:1px solid #e1e3ea;border-radius:4px;font-size:12px;background:#fff;">' +
              '<option value="7">7 days</option>' +
              '<option value="30" selected>30 days</option>' +
              '<option value="90">90 days</option>' +
            '</select>' +
          '</div>' +
          '<div id="ra-um-inactive-report" style="font-size:13px;color:#94a3b8;">Loading...</div>' +
        '</div>' +
        // New Registrations Chart — full width
        '<div style="background:#fff;border:1px solid #e1e3ea;border-radius:6px;padding:16px;grid-column:1/-1;">' +
          '<div style="font-size:14px;font-weight:700;color:#1e293b;margin-bottom:12px;">New Registrations (30 days)</div>' +
          '<div id="ra-um-chart-regs" style="min-height:180px;color:#94a3b8;font-size:12px;">Loading...</div>' +
        '</div>' +
      '</div>';

    // Load analytics data
    loadUMAnalytics();

    // Period change listeners
    var contribSel = document.getElementById('ra-um-contrib-period');
    if (contribSel) {
      contribSel.addEventListener('change', function () {
        renderUMTopContributors(document.getElementById('ra-um-top-contrib'), parseInt(this.value, 10));
      });
    }
    var inactiveSel = document.getElementById('ra-um-inactive-period');
    if (inactiveSel) {
      inactiveSel.addEventListener('change', function () {
        renderUMInactiveReport(document.getElementById('ra-um-inactive-report'), parseInt(this.value, 10));
      });
    }
  }

  function loadUMAnalytics() {
    // Fetch 30 days of submissions for charts
    var thirtyAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
    fetch('/api/v2/submissions/?query={"_submission_time":{"$gte":"' + thirtyAgo + '"}}&limit=5000&sort={"_submission_time":-1}&fields=["_submitted_by","_submission_time"]', { credentials: 'same-origin' })
      .then(function (r) { return r.ok ? r.json() : { results: [] }; })
      .then(function (data) {
        var subs = data.results || [];
        renderUMActiveUsersChart(document.getElementById('ra-um-chart-active'), subs);
        renderUMSubsTrendChart(document.getElementById('ra-um-chart-subs'), subs);
        renderUMTopContributors(document.getElementById('ra-um-top-contrib'), 7, subs);
        renderUMNewRegsChart(document.getElementById('ra-um-chart-regs'));
        renderUMInactiveReport(document.getElementById('ra-um-inactive-report'), 30);
        // Store for period switching
        _umAllSubs = subs;
      })
      .catch(function () {
        var ids = ['ra-um-chart-active', 'ra-um-chart-subs', 'ra-um-top-contrib', 'ra-um-inactive-report', 'ra-um-chart-regs'];
        ids.forEach(function (id) {
          var el = document.getElementById(id);
          if (el) el.innerHTML = '<div style="color:#e74c3c;">Failed to load data</div>';
        });
      });
  }

  function renderUMActiveUsersChart(el, subs) {
    if (!el) return;
    var days = 30;
    var labels = [];
    var buckets = {};
    for (var i = days - 1; i >= 0; i--) {
      var d = new Date(Date.now() - i * 86400000);
      var key = d.toISOString().split('T')[0];
      labels.push(key);
      buckets[key] = {};
    }
    subs.forEach(function (s) {
      if (!s._submission_time || !s._submitted_by) return;
      var key = s._submission_time.split('T')[0];
      if (buckets[key]) buckets[key][s._submitted_by] = true;
    });
    var values = labels.map(function (l) { return Object.keys(buckets[l]).length; });
    renderUMBarChart(el, labels, values, '#54a8dc');
  }

  function renderUMSubsTrendChart(el, subs) {
    if (!el) return;
    var days = 30;
    var labels = [];
    var buckets = {};
    for (var i = days - 1; i >= 0; i--) {
      var d = new Date(Date.now() - i * 86400000);
      var key = d.toISOString().split('T')[0];
      labels.push(key);
      buckets[key] = 0;
    }
    subs.forEach(function (s) {
      if (!s._submission_time) return;
      var key = s._submission_time.split('T')[0];
      if (buckets[key] !== undefined) buckets[key]++;
    });
    var values = labels.map(function (l) { return buckets[l]; });
    renderUMLineChart(el, labels, values, '#10b981');
  }

  function renderUMNewRegsChart(el) {
    if (!el || !_umUsers) return;
    var days = 30;
    var labels = [];
    var buckets = {};
    for (var i = days - 1; i >= 0; i--) {
      var d = new Date(Date.now() - i * 86400000);
      var key = d.toISOString().split('T')[0];
      labels.push(key);
      buckets[key] = 0;
    }
    _umUsers.forEach(function (u) {
      if (!u.date_joined || u.username === 'AnonymousUser') return;
      var key = u.date_joined.split('T')[0];
      if (buckets[key] !== undefined) buckets[key]++;
    });
    var values = labels.map(function (l) { return buckets[l]; });
    renderUMBarChart(el, labels, values, '#f59e0b');
  }

  function renderUMBarChart(el, labels, values, color) {
    if (!el) return;
    var maxVal = Math.max.apply(null, values) || 1;
    var svgW = 700, svgH = 180, padL = 35, padR = 10, padT = 15, padB = 25;
    var chartW = svgW - padL - padR, chartH = svgH - padT - padB;
    var barW = chartW / labels.length, gap = 1;

    var bars = '', lbls = '';
    for (var j = 0; j < labels.length; j++) {
      var barH = (values[j] / maxVal) * chartH;
      var x = padL + j * barW, y = padT + chartH - barH;
      bars += '<rect x="' + (x + gap) + '" y="' + y + '" width="' + (barW - gap * 2) + '" height="' + barH + '" rx="1" fill="' + color + '" opacity="0.8"><title>' + labels[j] + ': ' + values[j] + '</title></rect>';
      if (values[j] > 0 && labels.length <= 31) bars += '<text x="' + (x + barW / 2) + '" y="' + (y - 2) + '" text-anchor="middle" fill="#64748b" font-size="9">' + values[j] + '</text>';
      if (j % 5 === 0 || j === labels.length - 1) lbls += '<text x="' + (x + barW / 2) + '" y="' + (svgH - 4) + '" text-anchor="middle" fill="#94a3b8" font-size="9">' + labels[j].substring(5) + '</text>';
    }
    var yLines = '';
    for (var k = 0; k <= 3; k++) {
      var yP = padT + chartH - (chartH * k / 3);
      yLines += '<text x="' + (padL - 4) + '" y="' + (yP + 3) + '" text-anchor="end" fill="#94a3b8" font-size="9">' + Math.round(maxVal * k / 3) + '</text>';
      yLines += '<line x1="' + padL + '" y1="' + yP + '" x2="' + (svgW - padR) + '" y2="' + yP + '" stroke="#f1f5f9" stroke-width="1"/>';
    }
    el.innerHTML = '<svg viewBox="0 0 ' + svgW + ' ' + svgH + '" style="width:100%;height:auto;" preserveAspectRatio="xMidYMid meet">' + yLines + bars + lbls + '</svg>';
  }

  function renderUMLineChart(el, labels, values, color) {
    if (!el) return;
    var maxVal = Math.max.apply(null, values) || 1;
    var svgW = 700, svgH = 180, padL = 35, padR = 10, padT = 15, padB = 25;
    var chartW = svgW - padL - padR, chartH = svgH - padT - padB;
    var stepX = labels.length > 1 ? chartW / (labels.length - 1) : chartW;

    var points = [];
    var dots = '';
    for (var j = 0; j < labels.length; j++) {
      var x = padL + j * stepX;
      var y = padT + chartH - ((values[j] / maxVal) * chartH);
      points.push(x + ',' + y);
      dots += '<circle cx="' + x + '" cy="' + y + '" r="3" fill="' + color + '"><title>' + labels[j] + ': ' + values[j] + '</title></circle>';
    }
    var line = points.length > 1 ? '<polyline points="' + points.join(' ') + '" fill="none" stroke="' + color + '" stroke-width="2" stroke-linejoin="round"/>' : '';

    var yLines = '';
    for (var k = 0; k <= 3; k++) {
      var yP = padT + chartH - (chartH * k / 3);
      yLines += '<text x="' + (padL - 4) + '" y="' + (yP + 3) + '" text-anchor="end" fill="#94a3b8" font-size="9">' + Math.round(maxVal * k / 3) + '</text>';
      yLines += '<line x1="' + padL + '" y1="' + yP + '" x2="' + (svgW - padR) + '" y2="' + yP + '" stroke="#f1f5f9" stroke-width="1"/>';
    }
    var xLabels = '';
    for (var m = 0; m < labels.length; m++) {
      if (m % 5 === 0 || m === labels.length - 1) {
        var xPos = padL + m * stepX;
        xLabels += '<text x="' + xPos + '" y="' + (svgH - 4) + '" text-anchor="middle" fill="#94a3b8" font-size="9">' + labels[m].substring(5) + '</text>';
      }
    }
    el.innerHTML = '<svg viewBox="0 0 ' + svgW + ' ' + svgH + '" style="width:100%;height:auto;" preserveAspectRatio="xMidYMid meet">' + yLines + xLabels + line + dots + '</svg>';
  }

  function renderUMTopContributors(el, days, subs) {
    if (!el) return;
    subs = subs || _umAllSubs || [];
    var cutoff = new Date(Date.now() - days * 86400000).toISOString();
    var counts = {};
    subs.forEach(function (s) {
      if (!s._submitted_by || !s._submission_time) return;
      if (s._submission_time >= cutoff) {
        counts[s._submitted_by] = (counts[s._submitted_by] || 0) + 1;
      }
    });
    var sorted = Object.keys(counts).map(function (u) {
      return { username: u, count: counts[u] };
    }).sort(function (a, b) { return b.count - a.count; }).slice(0, 10);

    if (!sorted.length) {
      el.innerHTML = '<div style="font-style:italic;">No submissions in this period</div>';
      return;
    }
    var maxC = sorted[0].count || 1;
    var html = '';
    sorted.forEach(function (item, idx) {
      var pct = Math.round((item.count / maxC) * 100);
      var medal = '';
      if (idx === 0) medal = '<span style="color:#f59e0b;">&#9733;</span> ';
      else if (idx === 1) medal = '<span style="color:#94a3b8;">&#9733;</span> ';
      else if (idx === 2) medal = '<span style="color:#cd7f32;">&#9733;</span> ';
      html += '<div style="display:flex;align-items:center;gap:10px;padding:6px 0;' + (idx < sorted.length - 1 ? 'border-bottom:1px solid #f0f0f0;' : '') + '">' +
        '<div style="width:24px;text-align:center;font-size:12px;font-weight:700;color:#64748b;">' + (idx + 1) + '</div>' +
        '<div style="flex:1;min-width:0;">' +
          '<div style="font-size:13px;font-weight:500;color:#1e293b;">' + medal + escapeHtml(item.username) + '</div>' +
          '<div style="height:4px;background:#f1f5f9;border-radius:2px;margin-top:3px;">' +
            '<div style="height:4px;background:#54a8dc;border-radius:2px;width:' + pct + '%;"></div>' +
          '</div>' +
        '</div>' +
        '<div style="font-size:13px;font-weight:700;color:#1e293b;min-width:40px;text-align:right;">' + item.count + '</div>' +
      '</div>';
    });
    el.innerHTML = html;
  }

  function renderUMInactiveReport(el, days) {
    if (!el || !_umUsers) return;
    var cutoff = Date.now() - days * 86400000;
    var inactive = _umUsers.filter(function (u) {
      if (u.username === 'AnonymousUser') return false;
      if (!u.is_active) return false;
      if (!u.last_login) return true;
      return new Date(u.last_login).getTime() < cutoff;
    }).sort(function (a, b) {
      var aT = a.last_login ? new Date(a.last_login).getTime() : 0;
      var bT = b.last_login ? new Date(b.last_login).getTime() : 0;
      return aT - bT;
    });

    if (!inactive.length) {
      el.innerHTML = '<div style="font-style:italic;">No inactive users for this period</div>';
      return;
    }

    var html = '<div style="margin-bottom:8px;font-size:12px;color:#64748b;">' + inactive.length + ' user' + (inactive.length !== 1 ? 's' : '') + ' with no login in ' + days + '+ days</div>';
    html += '<div style="max-height:220px;overflow-y:auto;">';
    inactive.slice(0, 30).forEach(function (u) {
      var lastLogin = u.last_login ? formatLastLogin(u.last_login) : 'Never';
      html += '<div style="display:flex;align-items:center;justify-content:space-between;padding:5px 0;border-bottom:1px solid #f0f0f0;">' +
        '<div style="display:flex;align-items:center;gap:8px;">' +
          '<img src="/webhook-api/avatar/' + escapeHtml(u.username) + '" style="width:24px;height:24px;border-radius:50%;object-fit:cover;flex-shrink:0;" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\';">' +
          '<div style="width:24px;height:24px;border-radius:50%;background:#fef2f2;color:#ef4444;display:none;align-items:center;justify-content:center;font-weight:700;font-size:10px;flex-shrink:0;">' + u.username.charAt(0).toUpperCase() + '</div>' +
          '<span style="font-size:12px;font-weight:500;color:#1e293b;">' + escapeHtml(u.username) + '</span>' +
        '</div>' +
        '<span style="font-size:11px;color:#94a3b8;">' + lastLogin + '</span>' +
      '</div>';
    });
    if (inactive.length > 30) {
      html += '<div style="padding:6px 0;font-size:11px;color:#94a3b8;text-align:center;">...and ' + (inactive.length - 30) + ' more</div>';
    }
    html += '</div>';
    el.innerHTML = html;
  }

  // ── Data Loading ──
  function loadUMData() {
    var usersPromise = fetch('/api/v2/users/?format=json&limit=1000', { credentials: 'same-origin' })
      .then(function (r) { return r.ok ? r.json() : { results: [] }; })
      .then(function (data) { return data.results || []; });

    var formsPromise = fetch('/api/v2/assets/?q=asset_type:survey&limit=500&fields=["uid","name","deployment__submission_count","owner__username"]', { credentials: 'same-origin' })
      .then(function (r) { return r.ok ? r.json() : { results: [] }; })
      .then(function (data) { return data.results || []; });

    var configPromise = loadDashConfig ? new Promise(function (resolve) {
      if (_dashConfig) { resolve(); return; }
      loadDashConfig(resolve);
    }) : Promise.resolve();

    Promise.all([usersPromise, formsPromise, configPromise]).then(function (results) {
      _umUsers = results[0];
      _umForms = results[1];
      updateUMStats();
      renderUMActiveSubTab();
      // Load submission counts async
      loadUMSubmissionCounts();
    }).catch(function () {
      var wrap = document.getElementById('ra-um-subtab-content');
      if (wrap) wrap.innerHTML = '<div style="padding:24px;text-align:center;color:#e74c3c;">Failed to load users. Please try again.</div>';
    });
  }

  function loadUMSubmissionCounts() {
    if (!_umUsers || !_umForms) return;
    // Build per-user submission count from forms
    _umSubCounts = {};
    _umForms.forEach(function (f) {
      var owner = f.owner__username;
      if (owner) {
        _umSubCounts[owner] = (_umSubCounts[owner] || 0) + (f.deployment__submission_count || 0);
      }
    });
    // Also fetch submission counts per user via a broader approach
    // We already have form counts; update the table if visible
    renderUMTable();
  }

  // ── User Role / Badge / Status helpers ──
  function getUserRole(username) {
    var u = _umUsers ? _umUsers.find(function (usr) { return usr.username === username; }) : null;
    if (u && (u.is_superuser || u.is_staff)) return 'admin';
    if (_dashConfig && _dashConfig.users && _dashConfig.users[username]) return 'dashboard';
    return 'regular';
  }

  function getRoleBadge(role) {
    if (role === 'admin') return '<span style="display:inline-block;padding:2px 8px;border-radius:3px;font-size:10px;font-weight:600;background:#fef3c7;color:#92400e;">Admin</span>';
    if (role === 'dashboard') return '<span style="display:inline-block;padding:2px 8px;border-radius:3px;font-size:10px;font-weight:600;background:#dbeafe;color:#1e40af;">Dashboard</span>';
    return '<span style="display:inline-block;padding:2px 8px;border-radius:3px;font-size:10px;font-weight:600;background:#f1f5f9;color:#64748b;">Regular</span>';
  }

  function getStatusBadge(isActive) {
    if (isActive) return '<span style="display:inline-flex;align-items:center;gap:4px;font-size:11px;color:#10b981;"><span style="width:6px;height:6px;border-radius:50%;background:#10b981;"></span>Active</span>';
    return '<span style="display:inline-flex;align-items:center;gap:4px;font-size:11px;color:#ef4444;"><span style="width:6px;height:6px;border-radius:50%;background:#ef4444;"></span>Inactive</span>';
  }

  function updateUMStats() {
    if (!_umUsers) return;
    var total = _umUsers.filter(function (u) { return u.username !== 'AnonymousUser'; }).length;
    var active = _umUsers.filter(function (u) { return u.is_active && u.username !== 'AnonymousUser'; }).length;
    var dashUsers = (_dashConfig && _dashConfig.users) ? Object.keys(_dashConfig.users).length : 0;

    var weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    var newThisWeek = _umUsers.filter(function (u) {
      return u.date_joined && u.date_joined >= weekAgo && u.username !== 'AnonymousUser';
    }).length;

    var thirtyAgo = Date.now() - 30 * 86400000;
    var inactive30 = _umUsers.filter(function (u) {
      if (u.username === 'AnonymousUser' || !u.is_active) return false;
      if (!u.last_login) return true;
      return new Date(u.last_login).getTime() < thirtyAgo;
    }).length;

    var el;
    el = document.getElementById('ra-um-total'); if (el) el.textContent = total;
    el = document.getElementById('ra-um-active'); if (el) el.textContent = active;
    el = document.getElementById('ra-um-dashboard'); if (el) el.textContent = dashUsers;
    el = document.getElementById('ra-um-new-week'); if (el) el.textContent = newThisWeek;
    el = document.getElementById('ra-um-inactive30'); if (el) el.textContent = inactive30;
  }

  function getFilteredUMUsers() {
    if (!_umUsers) return [];
    return _umUsers.filter(function (u) {
      if (u.username === 'AnonymousUser') return false;

      // Search filter
      if (_umSearchTerm) {
        var searchStr = (u.username + ' ' + ((u.metadata && u.metadata.name) || '') + ' ' + ((u.metadata && u.metadata.organization) || '') + ' ' + (u.email || '')).toLowerCase();
        if (searchStr.indexOf(_umSearchTerm) === -1) return false;
      }

      // Role filter
      if (_umFilterRole !== 'all') {
        var role = getUserRole(u.username);
        if (role !== _umFilterRole) return false;
      }

      // Status filter
      if (_umFilterStatus === 'active' && !u.is_active) return false;
      if (_umFilterStatus === 'inactive' && u.is_active) return false;

      // Inactive days filter
      if (_umFilterInactive !== '0') {
        var daysThresh = parseInt(_umFilterInactive, 10);
        var cutoff = Date.now() - daysThresh * 86400000;
        if (u.last_login && new Date(u.last_login).getTime() >= cutoff) return false;
      }

      return true;
    });
  }

  function formatDate(dateStr) {
    if (!dateStr) return '-';
    var d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function formatLastLogin(dateStr) {
    if (!dateStr) return '<span style="color:#94a3b8;">Never</span>';
    var diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    if (diff < 604800) return Math.floor(diff / 86400) + 'd ago';
    return formatDate(dateStr);
  }

  // ── Table Rendering ──
  function renderUMTable() {
    var wrap = document.getElementById('ra-um-table-wrap');
    if (!wrap) return;
    var users = getFilteredUMUsers();

    var countEl = document.getElementById('ra-um-count');
    if (countEl) countEl.textContent = users.length + ' user' + (users.length !== 1 ? 's' : '');

    // Update bulk wrap visibility
    updateBulkWrap();

    if (!users.length) {
      wrap.innerHTML = '<div style="background:#fff;border:1px solid #e1e3ea;border-radius:6px;padding:32px;text-align:center;color:#94a3b8;font-size:13px;">No users match your filters.</div>';
      return;
    }

    var allChecked = true;
    users.forEach(function (u) { if (!_umSelectedRows[u.username]) allChecked = false; });

    var html = '<table style="width:100%;border-collapse:collapse;background:#fff;border:1px solid #e1e3ea;border-radius:6px;overflow:hidden;font-size:13px;">' +
      '<thead><tr style="background:#f9f9fb;border-bottom:1px solid #e1e3ea;">' +
        '<th style="width:36px;padding:10px 8px;text-align:center;"><input type="checkbox" id="ra-um-check-all"' + (allChecked && users.length ? ' checked' : '') + '></th>' +
        '<th style="text-align:left;padding:10px 14px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#64748b;">User</th>' +
        '<th style="text-align:left;padding:10px 14px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#64748b;">Role</th>' +
        '<th style="text-align:left;padding:10px 14px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#64748b;">Status</th>' +
        '<th style="text-align:left;padding:10px 14px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#64748b;">Joined</th>' +
        '<th style="text-align:left;padding:10px 14px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#64748b;">Last Login</th>' +
        '<th style="text-align:left;padding:10px 14px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#64748b;">Dashboard</th>' +
        '<th style="text-align:right;padding:10px 14px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#64748b;">Submissions</th>' +
        '<th style="text-align:right;padding:10px 14px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#64748b;">Actions</th>' +
      '</tr></thead><tbody>';

    users.forEach(function (u) {
      var role = getUserRole(u.username);
      var displayName = [u.first_name || '', u.last_name || ''].filter(Boolean).join(' ') || (u.metadata && u.metadata.name) || '';
      var org = (u.metadata && u.metadata.organization) || '';
      var initial = u.username.charAt(0).toUpperCase();
      var subCount = _umSubCounts[u.username] || 0;
      var isChecked = !!_umSelectedRows[u.username];

      html += '<tr class="ra-um-row" data-username="' + escapeHtml(u.username) + '" style="border-bottom:1px solid #f0f0f0;cursor:pointer;transition:background 0.15s;" onmouseover="this.style.background=\'#f7f9fb\'" onmouseout="this.style.background=\'\'">' +
        '<td style="padding:10px 8px;text-align:center;" onclick="event.stopPropagation()"><input type="checkbox" class="ra-um-row-check" data-username="' + escapeHtml(u.username) + '"' + (isChecked ? ' checked' : '') + '></td>' +
        '<td style="padding:10px 14px;">' +
          '<div style="display:flex;align-items:center;gap:10px;">' +
            '<img src="/webhook-api/avatar/' + escapeHtml(u.username) + '" style="width:32px;height:32px;border-radius:50%;object-fit:cover;flex-shrink:0;" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\';">' +
            '<div style="width:32px;height:32px;border-radius:50%;background:#e0f2fe;color:#0284c7;display:none;align-items:center;justify-content:center;font-weight:700;font-size:14px;flex-shrink:0;">' + initial + '</div>' +
            '<div style="min-width:0;">' +
              '<div style="font-weight:600;color:#1e293b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + escapeHtml(u.username) + '</div>' +
              (displayName ? '<div style="font-size:11px;color:#94a3b8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + escapeHtml(displayName) + (org ? ' - ' + escapeHtml(org) : '') + '</div>' : '') +
            '</div>' +
          '</div>' +
        '</td>' +
        '<td style="padding:10px 14px;">' + getRoleBadge(role) + '</td>' +
        '<td style="padding:10px 14px;">' + getStatusBadge(u.is_active) + '</td>' +
        '<td style="padding:10px 14px;font-size:12px;color:#64748b;">' + formatDate(u.date_joined) + '</td>' +
        '<td style="padding:10px 14px;font-size:12px;color:#64748b;">' + formatLastLogin(u.last_login) + '</td>' +
        '<td style="padding:10px 14px;font-size:12px;color:#64748b;">' + (function () {
          var dashId = (_dashConfig && _dashConfig.users && _dashConfig.users[u.username]) ? _dashConfig.users[u.username] : '';
          if (!dashId) return '<span style="color:#cbd5e1;">-</span>';
          var dashName = (_dashConfig.dashboards && _dashConfig.dashboards[dashId] && _dashConfig.dashboards[dashId].name) ? _dashConfig.dashboards[dashId].name : dashId;
          return '<span style="display:inline-block;padding:2px 8px;border-radius:3px;font-size:10px;font-weight:600;background:#dbeafe;color:#1e40af;">' + escapeHtml(dashName) + '</span>';
        })() + '</td>' +
        '<td style="padding:10px 14px;text-align:right;font-size:12px;color:#64748b;">' + subCount + '</td>' +
        '<td style="padding:10px 14px;text-align:right;">' +
          '<button class="ra-um-action-btn" data-action="toggle" data-user="' + escapeHtml(u.username) + '" title="' + (u.is_active ? 'Deactivate' : 'Activate') + '" style="background:none;border:1px solid #e1e3ea;border-radius:4px;padding:4px 8px;cursor:pointer;font-size:11px;color:' + (u.is_active ? '#ef4444' : '#10b981') + ';margin-right:4px;">' +
            (u.is_active ? 'Deactivate' : 'Activate') +
          '</button>' +
        '</td>' +
      '</tr>';
    });

    html += '</tbody></table>';
    wrap.innerHTML = html;

    // Check all checkbox
    var checkAll = document.getElementById('ra-um-check-all');
    if (checkAll) {
      checkAll.addEventListener('change', function () {
        var checked = this.checked;
        var filtered = getFilteredUMUsers();
        filtered.forEach(function (u) {
          if (checked) _umSelectedRows[u.username] = true;
          else delete _umSelectedRows[u.username];
        });
        renderUMTable();
      });
    }

    // Individual row checkboxes
    wrap.querySelectorAll('.ra-um-row-check').forEach(function (cb) {
      cb.addEventListener('change', function () {
        var uname = this.getAttribute('data-username');
        if (this.checked) _umSelectedRows[uname] = true;
        else delete _umSelectedRows[uname];
        updateBulkWrap();
      });
    });

    // Row click — show user popup
    wrap.querySelectorAll('.ra-um-row').forEach(function (row) {
      row.addEventListener('click', function (e) {
        if (e.target.closest('.ra-um-action-btn') || e.target.tagName === 'INPUT') return;
        var username = this.getAttribute('data-username');
        showUserModal(username);
      });
    });

    // Action buttons
    wrap.querySelectorAll('.ra-um-action-btn').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var action = this.getAttribute('data-action');
        var username = this.getAttribute('data-user');
        if (action === 'toggle') toggleUserActive(username);
      });
    });
  }

  function updateBulkWrap() {
    var bulkWrap = document.getElementById('ra-um-bulk-wrap');
    var selCount = document.getElementById('ra-um-sel-count');
    var count = Object.keys(_umSelectedRows).length;
    if (bulkWrap) bulkWrap.style.display = count > 0 ? 'inline' : 'none';
    if (selCount) selCount.textContent = count + ' selected';
  }

  // ── Bulk Actions ──
  function umBulkAction(action) {
    var selected = Object.keys(_umSelectedRows);
    if (!selected.length) return;

    if (action === 'activate' || action === 'deactivate') {
      var newStatus = action === 'activate';
      if (!confirm(action.charAt(0).toUpperCase() + action.slice(1) + ' ' + selected.length + ' user(s)?')) return;
      var done = 0;
      var errors = 0;
      selected.forEach(function (username) {
        fetch('/api/v2/users/' + encodeURIComponent(username) + '/', {
          method: 'PATCH',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCSRFToken() },
          body: JSON.stringify({ is_active: newStatus })
        }).then(function (r) {
          if (!r.ok) throw new Error('fail');
          return r.json();
        }).then(function () {
          var u = _umUsers ? _umUsers.find(function (usr) { return usr.username === username; }) : null;
          if (u) u.is_active = newStatus;
          done++;
          if (done + errors === selected.length) {
            _umSelectedRows = {};
            updateUMStats();
            renderUMTable();
            showStatus(document.getElementById('ra-um-status'), 'ok', done + ' user(s) ' + (newStatus ? 'activated' : 'deactivated') + (errors ? ', ' + errors + ' failed' : ''));
          }
        }).catch(function () {
          errors++;
          if (done + errors === selected.length) {
            _umSelectedRows = {};
            updateUMStats();
            renderUMTable();
            showStatus(document.getElementById('ra-um-status'), 'err', errors + ' of ' + selected.length + ' failed');
          }
        });
      });
    } else if (action === 'dashboard') {
      showBulkDashboardModal(selected);
    } else if (action === 'export') {
      exportUsersExcel(true);
    }
  }

  function showBulkDashboardModal(usernames) {
    var old = document.getElementById('ra-um-bulk-dash-modal');
    if (old) old.remove();

    var dashNames = getDashboardNames();
    var dashOpts = '<option value="">(Remove dashboard)</option>';
    dashNames.forEach(function (d) {
      dashOpts += '<option value="' + escapeHtml(d.id) + '">' + escapeHtml(d.name) + '</option>';
    });

    var modal = document.createElement('div');
    modal.id = 'ra-um-bulk-dash-modal';
    modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:100001;display:flex;align-items:center;justify-content:center;';
    modal.innerHTML =
      '<div style="background:#fff;border-radius:10px;width:420px;max-width:92vw;padding:24px;box-shadow:0 10px 40px rgba(0,0,0,0.25);">' +
        '<div style="font-size:16px;font-weight:700;color:#1e293b;margin-bottom:16px;">Assign Dashboard to ' + usernames.length + ' user(s)</div>' +
        '<select id="ra-um-bulk-dash-sel" style="width:100%;padding:10px 12px;border:1px solid #e1e3ea;border-radius:4px;font-size:13px;background:#fff;margin-bottom:16px;">' + dashOpts + '</select>' +
        '<div style="display:flex;gap:10px;">' +
          '<button id="ra-um-bulk-dash-save" style="flex:1;padding:10px;background:#54a8dc;color:#fff;border:none;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;">Apply</button>' +
          '<button id="ra-um-bulk-dash-cancel" style="padding:10px 20px;border:1px solid #e1e3ea;background:#fff;color:#64748b;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;">Cancel</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(modal);

    modal.querySelector('#ra-um-bulk-dash-cancel').addEventListener('click', function () { modal.remove(); });
    modal.addEventListener('click', function (e) { if (e.target === modal) modal.remove(); });

    modal.querySelector('#ra-um-bulk-dash-save').addEventListener('click', function () {
      var dashId = document.getElementById('ra-um-bulk-dash-sel').value;
      if (!_dashConfig) _dashConfig = { dashboards: {}, users: {} };
      if (!_dashConfig.users) _dashConfig.users = {};
      usernames.forEach(function (uname) {
        if (dashId) _dashConfig.users[uname] = dashId;
        else delete _dashConfig.users[uname];
      });
      saveDashConfig(function (err) {
        if (err) {
          showStatus(document.getElementById('ra-um-status'), 'err', 'Failed: ' + err);
        } else {
          _umSelectedRows = {};
          updateUMStats();
          renderUMTable();
          showStatus(document.getElementById('ra-um-status'), 'ok', 'Dashboard assigned to ' + usernames.length + ' user(s)');
        }
        modal.remove();
      });
    });
  }

  // ── Export to Excel ──
  function exportUsersExcel(selectedOnly) {
    var users = selectedOnly ? _umUsers.filter(function (u) { return _umSelectedRows[u.username]; }) : getFilteredUMUsers();
    if (!users.length) {
      showStatus(document.getElementById('ra-um-status'), 'err', 'No users to export');
      return;
    }

    var dateStr = new Date().toISOString().split('T')[0];
    var fileName = 'Users_' + dateStr + '.xls';

    var excelHtml = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">' +
      '<head><meta charset="utf-8">' +
      '<style>td,th{padding:6px 10px;border:1px solid #ccc;font-family:Calibri,sans-serif;font-size:11pt;}' +
      'th{background:#4472C4;color:#fff;font-weight:bold;}' +
      'tr:nth-child(even) td{background:#D9E2F3;}</style></head><body>' +
      '<table>' +
      '<tr><th>Username</th><th>First Name</th><th>Last Name</th><th>Email</th><th>Organization</th><th>Role</th><th>Dashboard</th><th>Status</th><th>Date Joined</th><th>Last Login</th><th>Submissions</th><th>Notes</th></tr>';

    users.forEach(function (u) {
      var role = getUserRole(u.username);
      var org = (u.metadata && u.metadata.organization) || '';
      var subCount = _umSubCounts[u.username] || 0;
      var notes = (_dashConfig && _dashConfig.userNotes && _dashConfig.userNotes[u.username]) || '';
      excelHtml += '<tr>' +
        '<td>' + escapeHtml(u.username) + '</td>' +
        '<td>' + escapeHtml(u.first_name || '') + '</td>' +
        '<td>' + escapeHtml(u.last_name || '') + '</td>' +
        '<td>' + escapeHtml(u.email || '') + '</td>' +
        '<td>' + escapeHtml(org) + '</td>' +
        '<td>' + escapeHtml(role) + '</td>' +
        '<td>' + (function () {
          var did = (_dashConfig && _dashConfig.users && _dashConfig.users[u.username]) ? _dashConfig.users[u.username] : '';
          if (!did) return '-';
          return (_dashConfig.dashboards && _dashConfig.dashboards[did] && _dashConfig.dashboards[did].name) ? escapeHtml(_dashConfig.dashboards[did].name) : did;
        })() + '</td>' +
        '<td>' + (u.is_active ? 'Active' : 'Inactive') + '</td>' +
        '<td>' + escapeHtml(formatDate(u.date_joined)) + '</td>' +
        '<td>' + escapeHtml(u.last_login ? formatDate(u.last_login) : 'Never') + '</td>' +
        '<td>' + subCount + '</td>' +
        '<td>' + escapeHtml(notes) + '</td>' +
      '</tr>';
    });

    excelHtml += '</table></body></html>';

    var blob = new Blob([excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);

    showStatus(document.getElementById('ra-um-status'), 'ok', 'Exported ' + users.length + ' user(s)');
  }

  // ── User Modal (enhanced — view existing user OR add new user) ──
  function showUserModal(username) {
    var old = document.getElementById('ra-um-modal');
    if (old) old.remove();

    var isNew = !username;
    var u = isNew ? null : (_umUsers ? _umUsers.find(function (usr) { return usr.username === username; }) : null);
    if (!isNew && !u) return;

    var firstName = isNew ? '' : (u.first_name || '');
    var lastName = isNew ? '' : (u.last_name || '');
    var fullName = isNew ? '' : ((u.metadata && u.metadata.name) || [firstName, lastName].filter(Boolean).join(' ') || '');
    var org = isNew ? '' : ((u.metadata && u.metadata.organization) || '');
    var email = isNew ? '' : (u.email || '');
    var initial = isNew ? '+' : username.charAt(0).toUpperCase();
    var role = isNew ? 'regular' : getUserRole(username);

    // Dashboard assignment options
    var dashNames = getDashboardNames();
    var assignedDashId = (!isNew && _dashConfig && _dashConfig.users) ? (_dashConfig.users[username] || '') : '';
    var dashOpts = '<option value="">(None - regular user)</option>';
    dashNames.forEach(function (d) {
      dashOpts += '<option value="' + escapeHtml(d.id) + '"' + (d.id === assignedDashId ? ' selected' : '') + '>' + escapeHtml(d.name) + '</option>';
    });

    // User notes
    var userNotes = (!isNew && _dashConfig && _dashConfig.userNotes && _dashConfig.userNotes[username]) ? _dashConfig.userNotes[username] : '';

    var modal = document.createElement('div');
    modal.id = 'ra-um-modal';
    modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:100001;display:flex;align-items:center;justify-content:center;';

    var bodyHtml = '';

    if (isNew) {
      // ── New User Form ──
      bodyHtml =
        '<div style="display:flex;gap:12px;margin-bottom:14px;">' +
          '<div style="flex:1;"><label style="font-size:11px;font-weight:600;color:#64748b;display:block;margin-bottom:4px;">Username *</label>' +
            '<input type="text" id="ra-um-f-username" style="width:100%;padding:8px 12px;border:1px solid #e1e3ea;border-radius:4px;font-size:13px;" placeholder="username"></div>' +
          '<div style="flex:1;"><label style="font-size:11px;font-weight:600;color:#64748b;display:block;margin-bottom:4px;">Password *</label>' +
            '<input type="password" id="ra-um-f-password" style="width:100%;padding:8px 12px;border:1px solid #e1e3ea;border-radius:4px;font-size:13px;" placeholder="password"></div>' +
        '</div>' +
        '<div style="display:flex;gap:12px;margin-bottom:14px;">' +
          '<div style="flex:1;"><label style="font-size:11px;font-weight:600;color:#64748b;display:block;margin-bottom:4px;">First Name</label>' +
            '<input type="text" id="ra-um-f-fname" style="width:100%;padding:8px 12px;border:1px solid #e1e3ea;border-radius:4px;font-size:13px;" placeholder="First name"></div>' +
          '<div style="flex:1;"><label style="font-size:11px;font-weight:600;color:#64748b;display:block;margin-bottom:4px;">Last Name</label>' +
            '<input type="text" id="ra-um-f-lname" style="width:100%;padding:8px 12px;border:1px solid #e1e3ea;border-radius:4px;font-size:13px;" placeholder="Last name"></div>' +
        '</div>' +
        '<div style="margin-bottom:14px;"><label style="font-size:11px;font-weight:600;color:#64748b;display:block;margin-bottom:4px;">Email</label>' +
          '<input type="email" id="ra-um-f-email" style="width:100%;padding:8px 12px;border:1px solid #e1e3ea;border-radius:4px;font-size:13px;" placeholder="user@example.com"></div>' +
        '<div style="margin-bottom:14px;"><label style="font-size:11px;font-weight:600;color:#64748b;display:block;margin-bottom:4px;">Organization</label>' +
          '<input type="text" id="ra-um-f-org" style="width:100%;padding:8px 12px;border:1px solid #e1e3ea;border-radius:4px;font-size:13px;" placeholder="Organization name"></div>' +
        '<div style="margin-bottom:14px;"><label style="font-size:11px;font-weight:600;color:#64748b;display:block;margin-bottom:4px;">Dashboard Assignment</label>' +
          '<select id="ra-um-f-dash" style="width:100%;padding:8px 12px;border:1px solid #e1e3ea;border-radius:4px;font-size:13px;background:#fff;">' + dashOpts + '</select></div>' +
        '<div id="ra-um-modal-status" class="ra-st__status"></div>' +
        '<div style="display:flex;gap:10px;margin-top:16px;">' +
          '<button id="ra-um-modal-save" style="flex:1;padding:10px;background:#54a8dc;color:#fff;border:none;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;">Create User</button>' +
        '</div>';
    } else {
      // ── Existing User Detail ──
      var infoRow = function (label, value) {
        return '<div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #f0f0f0;">' +
          '<span style="font-size:12px;color:#94a3b8;">' + label + '</span>' +
          '<span style="font-size:13px;font-weight:500;color:#1e293b;">' + escapeHtml(value || '-') + '</span></div>';
      };

      // Submission counts per form for this user
      var perFormHtml = '';
      if (_umForms) {
        var userForms = _umForms.filter(function (f) { return f.owner__username === username; });
        if (userForms.length) {
          perFormHtml = '<div style="margin-bottom:14px;">' +
            '<div style="font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">Submissions per Form</div>' +
            '<div style="background:#f8fafc;border-radius:6px;padding:4px 14px;max-height:160px;overflow-y:auto;">';
          userForms.forEach(function (f) {
            perFormHtml += '<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f0f0f0;">' +
              '<span style="font-size:12px;color:#1e293b;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:280px;">' + escapeHtml(f.name || f.uid) + '</span>' +
              '<span style="font-size:12px;font-weight:600;color:#54a8dc;">' + (f.deployment__submission_count || 0) + '</span>' +
            '</div>';
          });
          perFormHtml += '</div></div>';
        }
      }

      bodyHtml =
        // User details (read-only)
        '<div style="background:#f8fafc;border-radius:6px;padding:4px 14px;margin-bottom:16px;">' +
          infoRow('First Name', firstName) +
          infoRow('Last Name', lastName) +
          (fullName && fullName !== [firstName, lastName].filter(Boolean).join(' ') ? infoRow('Display Name', fullName) : '') +
          infoRow('Email', email) +
          infoRow('Organization', org) +
          infoRow('Date Joined', formatDate(u.date_joined)) +
          infoRow('Last Login', u.last_login ? formatLastLogin(u.last_login) : 'Never') +
        '</div>' +

        // Submissions per form (owned)
        perFormHtml +

        // Forms shared with this user (loaded async)
        '<div style="margin-bottom:14px;">' +
          '<div style="font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">Forms Shared With User</div>' +
          '<div id="ra-um-shared-forms" style="background:#f8fafc;border-radius:6px;padding:8px 14px;max-height:180px;overflow-y:auto;font-size:12px;color:#94a3b8;">Loading...</div>' +
        '</div>' +

        // Editable: Dashboard assignment
        '<div style="margin-bottom:14px;"><label style="font-size:11px;font-weight:600;color:#64748b;display:block;margin-bottom:4px;">Dashboard Assignment</label>' +
          '<select id="ra-um-f-dash" style="width:100%;padding:8px 12px;border:1px solid #e1e3ea;border-radius:4px;font-size:13px;background:#fff;">' + dashOpts + '</select></div>' +

        // User notes
        '<div style="margin-bottom:14px;"><label style="font-size:11px;font-weight:600;color:#64748b;display:block;margin-bottom:4px;">Notes</label>' +
          '<textarea id="ra-um-f-notes" rows="3" style="width:100%;padding:8px 12px;border:1px solid #e1e3ea;border-radius:4px;font-size:13px;resize:vertical;font-family:inherit;" placeholder="Add notes about this user...">' + escapeHtml(userNotes) + '</textarea></div>' +

        // Recent activity
        '<div style="margin-bottom:14px;padding:12px;background:#f8fafc;border-radius:6px;">' +
          '<div style="font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">Recent Activity</div>' +
          '<div id="ra-um-activity" style="font-size:12px;color:#94a3b8;">Loading...</div>' +
        '</div>' +

        '<div id="ra-um-modal-status" class="ra-st__status"></div>' +

        // Actions row
        '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:16px;">' +
          '<button id="ra-um-modal-save" style="flex:1;padding:10px;background:#54a8dc;color:#fff;border:none;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;">Save Changes</button>' +
          '<button id="ra-um-modal-toggle" style="padding:10px 16px;border:1px solid ' + (u.is_active ? '#fecaca' : '#bbf7d0') + ';background:' + (u.is_active ? '#fef2f2' : '#f0fdf4') + ';color:' + (u.is_active ? '#dc2626' : '#16a34a') + ';border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;">' +
            (u.is_active ? 'Deactivate' : 'Activate') + '</button>' +
        '</div>' +

        // Second action row — impersonate, password reset, admin edit
        '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:10px;">' +
          '<button id="ra-um-modal-impersonate" style="padding:8px 14px;border:1px solid #dbeafe;background:#eff6ff;color:#1e40af;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap;" title="Open this user\'s view in a new tab">Switch to User</button>' +
          (email ? '<a href="/accounts/password/reset/?email=' + encodeURIComponent(email) + '" target="_blank" style="display:flex;align-items:center;padding:8px 14px;border:1px solid #fef3c7;background:#fffbeb;color:#92400e;border-radius:6px;font-size:12px;font-weight:600;text-decoration:none;white-space:nowrap;">Password Reset</a>' : '') +
          '<a href="/admin/auth/user/?q=' + encodeURIComponent(username) + '" target="_blank" style="display:flex;align-items:center;padding:8px 14px;border:1px solid #e1e3ea;background:#f9fafb;color:#64748b;border-radius:6px;font-size:12px;font-weight:600;text-decoration:none;white-space:nowrap;">Edit in Admin</a>' +
        '</div>';
    }

    modal.innerHTML =
      '<div style="background:#fff;border-radius:10px;width:560px;max-width:92vw;max-height:90vh;overflow-y:auto;box-shadow:0 10px 40px rgba(0,0,0,0.25);">' +
        '<div style="background:linear-gradient(135deg,#1a2a3a 0%,#54a8dc 100%);padding:24px;text-align:center;border-radius:10px 10px 0 0;position:relative;">' +
          '<button id="ra-um-modal-close" style="position:absolute;top:10px;right:14px;background:none;border:none;color:rgba(255,255,255,0.7);font-size:22px;cursor:pointer;">&times;</button>' +
          '<div id="ra-um-modal-avatar-wrap" style="position:relative;width:80px;height:80px;margin:0 auto 10px;">' +
            '<img id="ra-um-modal-avatar-img" src="/webhook-api/avatar/' + escapeHtml(username) + '" style="width:80px;height:80px;border-radius:50%;object-fit:cover;border:2px solid rgba(255,255,255,0.4);" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\';">' +
            '<div style="width:80px;height:80px;border-radius:50%;background:rgba(255,255,255,0.2);color:#fff;display:none;align-items:center;justify-content:center;font-weight:700;font-size:' + (isNew ? '28' : '24') + 'px;border:2px solid rgba(255,255,255,0.4);">' + initial + '</div>' +
          '</div>' +
          '<div style="color:#fff;font-weight:700;font-size:17px;">' + (isNew ? 'Add New User' : escapeHtml(username)) + '</div>' +
          (isNew ? '' : '<div style="margin-top:6px;">' + getRoleBadge(role) + ' ' + getStatusBadge(u.is_active) + '</div>') +
        '</div>' +
        (!isNew ? '<div id="ra-um-avatar-upload" style="display:flex;align-items:center;justify-content:center;gap:10px;padding:12px 20px;background:#f8fafc;border-bottom:1px solid #f0f0f0;">' +
          '<button id="ra-um-avatar-upload-btn" style="padding:6px 14px;border:1px solid #dbeafe;background:#eff6ff;color:#1e40af;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;">Upload Photo</button>' +
          '<button id="ra-um-avatar-remove-btn" style="padding:6px 14px;border:1px solid #fecaca;background:#fef2f2;color:#dc2626;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;">Remove Photo</button>' +
          '<input type="file" id="ra-um-avatar-file" accept="image/*" style="display:none;">' +
          '<span id="ra-um-avatar-status" style="font-size:11px;color:#64748b;"></span>' +
        '</div>' : '') +
        '<div style="padding:20px;">' + bodyHtml + '</div>' +
      '</div>';

    document.body.appendChild(modal);

    // Close
    modal.querySelector('#ra-um-modal-close').addEventListener('click', function () { modal.remove(); });
    modal.addEventListener('click', function (e) { if (e.target === modal) modal.remove(); });

    // Avatar upload/remove handlers
    var avatarUploadBtn = modal.querySelector('#ra-um-avatar-upload-btn');
    var avatarRemoveBtn = modal.querySelector('#ra-um-avatar-remove-btn');
    var avatarFileInput = modal.querySelector('#ra-um-avatar-file');
    var avatarStatus = modal.querySelector('#ra-um-avatar-status');

    if (avatarUploadBtn && avatarFileInput) {
      avatarUploadBtn.addEventListener('click', function () {
        avatarFileInput.click();
      });

      avatarFileInput.addEventListener('change', function () {
        var file = avatarFileInput.files && avatarFileInput.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
          if (avatarStatus) avatarStatus.textContent = 'File too large (max 5MB)';
          return;
        }
        var fd = new FormData();
        fd.append('avatar', file);
        if (avatarStatus) avatarStatus.textContent = 'Uploading...';
        avatarUploadBtn.disabled = true;

        var xhr = new XMLHttpRequest();
        xhr.open('POST', '/webhook-api/avatar/' + encodeURIComponent(username));
        xhr.onload = function () {
          avatarUploadBtn.disabled = false;
          if (xhr.status === 200) {
            if (avatarStatus) avatarStatus.textContent = 'Uploaded!';
            // Refresh the avatar image in the modal header
            var avatarImg = modal.querySelector('#ra-um-modal-avatar-img');
            if (avatarImg) {
              avatarImg.style.display = '';
              avatarImg.src = '/webhook-api/avatar/' + encodeURIComponent(username) + '?v=' + Date.now();
              var fallback = avatarImg.nextElementSibling;
              if (fallback) fallback.style.display = 'none';
            }
            setTimeout(function () { if (avatarStatus) avatarStatus.textContent = ''; }, 2000);
          } else {
            if (avatarStatus) avatarStatus.textContent = 'Upload failed';
          }
        };
        xhr.onerror = function () {
          avatarUploadBtn.disabled = false;
          if (avatarStatus) avatarStatus.textContent = 'Upload failed';
        };
        xhr.send(fd);
      });
    }

    if (avatarRemoveBtn) {
      avatarRemoveBtn.addEventListener('click', function () {
        if (avatarStatus) avatarStatus.textContent = 'Removing...';
        avatarRemoveBtn.disabled = true;

        var xhr = new XMLHttpRequest();
        xhr.open('DELETE', '/webhook-api/avatar/' + encodeURIComponent(username));
        xhr.onload = function () {
          avatarRemoveBtn.disabled = false;
          if (xhr.status === 200) {
            if (avatarStatus) avatarStatus.textContent = 'Removed!';
            var avatarImg = modal.querySelector('#ra-um-modal-avatar-img');
            if (avatarImg) {
              avatarImg.src = '/webhook-api/avatar/' + encodeURIComponent(username) + '?v=' + Date.now();
              avatarImg.style.display = '';
              var fallback = avatarImg.nextElementSibling;
              if (fallback) fallback.style.display = 'none';
            }
            setTimeout(function () { if (avatarStatus) avatarStatus.textContent = ''; }, 2000);
          } else {
            if (avatarStatus) avatarStatus.textContent = 'Remove failed';
          }
        };
        xhr.onerror = function () {
          avatarRemoveBtn.disabled = false;
          if (avatarStatus) avatarStatus.textContent = 'Remove failed';
        };
        xhr.send();
      });
    }

    // Impersonate button
    var impBtn = modal.querySelector('#ra-um-modal-impersonate');
    if (impBtn && !isNew) {
      impBtn.addEventListener('click', function () {
        impersonateUser(username);
      });
    }

    // Save handler
    modal.querySelector('#ra-um-modal-save').addEventListener('click', function () {
      var statusEl = document.getElementById('ra-um-modal-status');

      if (isNew) {
        // ── Create new user via KoboToolbox signup ──
        var newUsername = (document.getElementById('ra-um-f-username').value || '').trim();
        var newPassword = (document.getElementById('ra-um-f-password').value || '').trim();
        var newEmail = (document.getElementById('ra-um-f-email').value || '').trim();
        if (!newUsername || !newPassword) {
          showStatus(statusEl, 'err', 'Username and password are required');
          return;
        }
        showStatus(statusEl, 'info', 'Creating user...');

        var formData = new FormData();
        formData.append('username', newUsername);
        formData.append('password1', newPassword);
        formData.append('password2', newPassword);
        formData.append('first_name', (document.getElementById('ra-um-f-fname').value || '').trim());
        formData.append('last_name', (document.getElementById('ra-um-f-lname').value || '').trim());
        formData.append('email', newEmail);
        formData.append('organization', (document.getElementById('ra-um-f-org').value || '').trim());

        fetch('/accounts/signup/', { credentials: 'same-origin' })
          .then(function (r) { return r.text(); })
          .then(function (html) {
            var match = html.match(/name="csrfmiddlewaretoken" value="([^"]+)"/);
            var csrf = match ? match[1] : getCSRFToken();
            formData.append('csrfmiddlewaretoken', csrf);

            return fetch('/accounts/signup/', {
              method: 'POST',
              credentials: 'same-origin',
              body: formData
            });
          })
          .then(function (r) {
            if (r.redirected || r.status === 302 || r.status === 301) {
              var dashId = document.getElementById('ra-um-f-dash').value;
              if (dashId) {
                if (!_dashConfig) _dashConfig = { dashboards: {}, users: {} };
                if (!_dashConfig.users) _dashConfig.users = {};
                _dashConfig.users[newUsername] = dashId;
                saveDashConfig(function () {});
              }
              showStatus(statusEl, 'ok', 'User "' + newUsername + '" created!');
              setTimeout(function () { modal.remove(); loadUMData(); }, 1000);
              return;
            }
            return r.text().then(function (html) {
              var errMatch = html.match(/class="[^"]*error[^"]*"[^>]*>([^<]+)/i);
              var errMsg = errMatch ? errMatch[1].trim() : '';
              if (!errMsg && html.indexOf('already exists') !== -1) errMsg = 'Username already exists';
              if (!errMsg && html.indexOf('too short') !== -1) errMsg = 'Password is too short';
              if (!errMsg && html.indexOf('too common') !== -1) errMsg = 'Password is too common';
              if (!errMsg && r.ok) {
                if (html.indexOf('accounts/login') !== -1 || html.indexOf('Verify') !== -1) {
                  var dashId2 = document.getElementById('ra-um-f-dash').value;
                  if (dashId2) {
                    if (!_dashConfig) _dashConfig = { dashboards: {}, users: {} };
                    if (!_dashConfig.users) _dashConfig.users = {};
                    _dashConfig.users[newUsername] = dashId2;
                    saveDashConfig(function () {});
                  }
                  showStatus(statusEl, 'ok', 'User "' + newUsername + '" created!');
                  setTimeout(function () { modal.remove(); loadUMData(); }, 1000);
                  return;
                }
              }
              throw new Error(errMsg || 'Registration failed. Try a stronger password.');
            });
          })
          .catch(function (err) {
            showStatus(statusEl, 'err', err.message);
          });
      } else {
        // ── Existing user: save dashboard assignment + notes ──
        var dashId = document.getElementById('ra-um-f-dash').value;
        var notes = (document.getElementById('ra-um-f-notes').value || '').trim();

        if (!_dashConfig) _dashConfig = { dashboards: {}, users: {} };
        if (!_dashConfig.users) _dashConfig.users = {};
        if (!_dashConfig.userNotes) _dashConfig.userNotes = {};

        if (dashId) { _dashConfig.users[username] = dashId; }
        else { delete _dashConfig.users[username]; }

        if (notes) { _dashConfig.userNotes[username] = notes; }
        else { delete _dashConfig.userNotes[username]; }

        showStatus(statusEl, 'info', 'Saving...');
        saveDashConfig(function (err) {
          if (err) {
            showStatus(statusEl, 'err', err);
          } else {
            showStatus(statusEl, 'ok', 'Changes saved!');
            updateUMStats();
            renderUMTable();
            setTimeout(function () { modal.remove(); }, 600);
          }
        });
      }
    });

    // Toggle active (existing users only)
    var toggleBtn = modal.querySelector('#ra-um-modal-toggle');
    if (toggleBtn && !isNew) {
      toggleBtn.addEventListener('click', function () {
        modal.remove();
        toggleUserActive(username);
      });
    }

    // Load activity for existing users
    if (!isNew) {
      loadUserActivity(username);
      loadUserSharedForms(username);
    }
  }

  // ── Impersonate User ──
  function impersonateUser(username) {
    // Open the user's KoboToolbox view in a new tab via Django admin
    // We use the admin "log in as" approach by opening admin with a return URL
    var adminUrl = '/admin/auth/user/?q=' + encodeURIComponent(username);
    var userTab = window.open(adminUrl, '_blank');

    // Show a helpful notification
    showStatus(document.getElementById('ra-um-status'), 'info',
      'Admin panel opened. Find "' + username + '" and use the "Log in as" action to switch. ' +
      'To return, log out and log back in as admin.');

    // Also try to set a marker so the user knows to return
    try {
      sessionStorage.setItem('ra-um-impersonating', username);
      sessionStorage.setItem('ra-um-return-admin', 'true');
    } catch (e) { /* ignore */ }
  }

  // ── Load User Activity (for modal) ──
  function loadUserActivity(username) {
    var actEl = document.getElementById('ra-um-activity');
    if (!actEl) return;

    fetch('/api/v2/submissions/?query={"_submitted_by":"' + encodeURIComponent(username) + '"}&limit=5&sort={"_submission_time":-1}&fields=["_submission_time","_xform_id_string"]', { credentials: 'same-origin' })
      .then(function (r) { return r.ok ? r.json() : { results: [] }; })
      .then(function (data) {
        var subs = data.results || [];
        if (!subs.length) {
          actEl.innerHTML = '<span style="font-style:italic;">No recent submissions</span>';
          return;
        }
        actEl.innerHTML = subs.map(function (s) {
          var time = s._submission_time ? formatLastLogin(s._submission_time) : '-';
          var form = s._xform_id_string || 'Submission';
          return '<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #f0f0f0;">' +
            '<span style="color:#1e293b;font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:250px;">' + escapeHtml(form) + '</span>' +
            '<span style="color:#94a3b8;font-size:11px;">' + time + '</span></div>';
        }).join('');
      })
      .catch(function () {
        actEl.innerHTML = '<span style="font-style:italic;">Activity data not available</span>';
      });
  }

  // ── Load Forms Shared With User ──
  function loadUserSharedForms(username) {
    var container = document.getElementById('ra-um-shared-forms');
    if (!container) return;

    // Fetch all forms then check permissions for each that the user doesn't own
    fetch('/api/v2/assets/?asset_type=survey&fields=["uid","name","owner__username","deployment_status"]&limit=200', { credentials: 'same-origin' })
      .then(function (r) { return r.ok ? r.json() : { results: [] }; })
      .then(function (data) {
        var forms = data.results || [];
        // Forms owned by this user
        var ownedForms = forms.filter(function (f) { return f.owner__username === username; });
        // Forms NOT owned by this user — need to check permissions
        var otherForms = forms.filter(function (f) { return f.owner__username !== username; });

        if (!otherForms.length && !ownedForms.length) {
          container.innerHTML = '<span style="font-style:italic;">No forms found</span>';
          return;
        }

        // Check permissions for other forms (batch — up to 20 at a time to avoid too many requests)
        var formsToCheck = otherForms.slice(0, 20);
        var sharedWithUser = [];
        var pending = formsToCheck.length;

        if (!pending) {
          renderSharedForms(container, sharedWithUser, ownedForms);
          return;
        }

        formsToCheck.forEach(function (f) {
          fetch('/api/v2/assets/' + f.uid + '/permission-assignments/?format=json', { credentials: 'same-origin' })
            .then(function (r) { return r.ok ? r.json() : []; })
            .then(function (perms) {
              var permList = Array.isArray(perms) ? perms : (perms.results || []);
              var userPerms = permList.filter(function (p) {
                // Match by username in the user URL
                var userUrl = p.user || '';
                return userUrl.indexOf('/' + username + '/') !== -1 || userUrl.endsWith('/' + username);
              });
              if (userPerms.length) {
                var permNames = userPerms.map(function (p) {
                  var code = (p.permission || '').split('/').pop().replace('.json', '').replace('_', ' ');
                  // Clean up permission names
                  if (code.indexOf('view_asset') !== -1) return 'View';
                  if (code.indexOf('change_asset') !== -1) return 'Edit';
                  if (code.indexOf('add_submissions') !== -1) return 'Submit';
                  if (code.indexOf('view_submissions') !== -1) return 'View Data';
                  if (code.indexOf('change_submissions') !== -1) return 'Edit Data';
                  if (code.indexOf('delete_submissions') !== -1) return 'Delete Data';
                  if (code.indexOf('manage_asset') !== -1) return 'Manage';
                  return code;
                });
                sharedWithUser.push({
                  name: f.name || f.uid,
                  uid: f.uid,
                  owner: f.owner__username,
                  status: f.deployment_status,
                  permissions: permNames
                });
              }
            })
            .catch(function () {})
            .then(function () {
              pending--;
              if (pending <= 0) {
                renderSharedForms(container, sharedWithUser, ownedForms);
              }
            });
        });
      })
      .catch(function () {
        container.innerHTML = '<span style="font-style:italic;">Could not load form data</span>';
      });
  }

  function renderSharedForms(container, sharedForms, ownedForms) {
    var html = '';

    if (ownedForms.length) {
      html += '<div style="font-size:11px;font-weight:600;color:#10b981;margin-bottom:4px;">Owns ' + ownedForms.length + ' form' + (ownedForms.length !== 1 ? 's' : '') + '</div>';
      ownedForms.forEach(function (f) {
        html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid #f0f0f0;">' +
          '<span style="color:#1e293b;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:260px;">' + escapeHtml(f.name || f.uid) + '</span>' +
          '<span style="display:inline-block;padding:1px 6px;border-radius:3px;font-size:9px;font-weight:600;background:#e8f8f0;color:#10b981;">Owner</span>' +
        '</div>';
      });
    }

    if (sharedForms.length) {
      html += '<div style="font-size:11px;font-weight:600;color:#54a8dc;margin:' + (ownedForms.length ? '10px' : '0') + ' 0 4px;">Shared with: ' + sharedForms.length + ' form' + (sharedForms.length !== 1 ? 's' : '') + '</div>';
      sharedForms.forEach(function (f) {
        var permText = f.permissions.join(', ');
        html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid #f0f0f0;">' +
          '<div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:220px;">' +
            '<span style="color:#1e293b;font-size:12px;">' + escapeHtml(f.name) + '</span>' +
            '<span style="color:#94a3b8;font-size:10px;margin-left:4px;">by ' + escapeHtml(f.owner) + '</span>' +
          '</div>' +
          '<span style="display:inline-block;padding:1px 6px;border-radius:3px;font-size:9px;font-weight:600;background:#dbeafe;color:#1e40af;white-space:nowrap;">' + escapeHtml(permText) + '</span>' +
        '</div>';
      });
    }

    if (!ownedForms.length && !sharedForms.length) {
      html = '<span style="font-style:italic;">No forms shared with this user</span>';
    }

    container.innerHTML = html;
  }

  // ── Toggle User Active ──
  function toggleUserActive(username) {
    var u = _umUsers ? _umUsers.find(function (usr) { return usr.username === username; }) : null;
    if (!u) return;

    var newStatus = !u.is_active;
    var action = newStatus ? 'activate' : 'deactivate';

    if (!confirm((newStatus ? 'Activate' : 'Deactivate') + ' user "' + username + '"?')) return;

    fetch('/api/v2/users/' + encodeURIComponent(username) + '/', {
      method: 'PATCH',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCSRFToken()
      },
      body: JSON.stringify({ is_active: newStatus })
    })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function () {
        u.is_active = newStatus;
        showStatus(document.getElementById('ra-um-status'), 'ok', '"' + username + '" ' + (newStatus ? 'activated' : 'deactivated'));
        updateUMStats();
        renderUMTable();
      })
      .catch(function (err) {
        showStatus(document.getElementById('ra-um-status'), 'err', 'Failed to ' + action + ': ' + err.message);
      });
  }

  function getCSRFToken() {
    var match = document.cookie.match(/csrftoken=([^;]+)/);
    return match ? match[1] : '';
  }

  function renderTeamsSection(main) {
    main.innerHTML =
      '<h1 class="ra-st__page-title">Teams</h1>' +
      '<div class="ra-st__content" style="max-width:900px;">' +
        '<p style="color:#666;margin:0 0 16px;font-size:14px;">' +
          'Organize users into teams with leaders, geographic zones, and assigned forms. Track team performance and submission stats.' +
        '</p>' +
        '<div style="margin-bottom:20px;">' +
          '<button class="ra-st__btn ra-st__btn--primary" id="ra-team-new">+ New Team</button>' +
        '</div>' +
        '<div class="ra-st__status" id="ra-team-status"></div>' +
        '<div id="ra-team-list"><div style="padding:16px;text-align:center;color:#999;">Loading...</div></div>' +
      '</div>';

    document.getElementById('ra-team-new').addEventListener('click', function () {
      showTeamModal();
    });

    loadTeamsData(function () {
      renderTeamsList();
    });

    // Preload forms and users
    if (!_teamsForms) {
      fetch('/api/v2/assets/?asset_type=survey&fields=["uid","name","deployment_status"]&limit=200', { credentials: 'same-origin' })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          _teamsForms = (data.results || []).filter(function (f) { return f.deployment_status === 'deployed'; });
        })
        .catch(function () { _teamsForms = []; });
    }
    if (!_teamsUsers) {
      fetch('/api/v2/users/?format=json&limit=200', { credentials: 'same-origin' })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          _teamsUsers = (data.results || []).filter(function (u) {
            return u.is_active && u.username !== 'AnonymousUser';
          });
        })
        .catch(function () { _teamsUsers = []; });
    }
  }

  function renderTeamsList() {
    var listEl = document.getElementById('ra-team-list');
    if (!listEl || !_teamsData) return;

    var teams = _teamsData.teams || [];
    if (!teams.length) {
      listEl.innerHTML = '<div style="padding:32px;text-align:center;color:#94a3b8;border:2px dashed #e2e8f0;border-radius:8px;">' +
        '<p style="font-size:14px;margin:0 0 8px;">No teams yet</p>' +
        '<p style="font-size:12px;margin:0;">Click "+ New Team" to organize your users into teams.</p></div>';
      return;
    }

    var teamColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

    listEl.innerHTML = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;">' +
      teams.map(function (t, idx) {
        var memberCount = (t.members || []).length;
        var formCount = (t.forms || []).length;
        var color = teamColors[idx % teamColors.length];

        return '<div style="border:1px solid #e2e8f0;border-radius:12px;background:#fff;overflow:hidden;">' +
          '<div style="height:6px;background:' + color + ';"></div>' +
          '<div style="padding:20px;">' +
            '<div style="font-size:18px;font-weight:700;color:#1e293b;margin-bottom:8px;">' + escapeHtml(t.name) + '</div>' +
            '<div style="display:flex;gap:16px;margin-bottom:12px;">' +
              '<div style="text-align:center;">' +
                '<div style="font-size:22px;font-weight:700;color:' + color + ';">' + memberCount + '</div>' +
                '<div style="font-size:10px;color:#94a3b8;text-transform:uppercase;">Members</div>' +
              '</div>' +
              '<div style="text-align:center;">' +
                '<div style="font-size:22px;font-weight:700;color:' + color + ';">' + formCount + '</div>' +
                '<div style="font-size:10px;color:#94a3b8;text-transform:uppercase;">Forms</div>' +
              '</div>' +
            '</div>' +
            '<div style="font-size:12px;color:#64748b;margin-bottom:4px;">' +
              '<strong>Leader:</strong> ' + escapeHtml(t.leader || 'Not assigned') +
            '</div>' +
            '<div style="font-size:12px;color:#64748b;margin-bottom:4px;">' +
              '<strong>Zone:</strong> ' + escapeHtml(t.zone || 'Not specified') +
            '</div>' +
            '<div style="font-size:11px;color:#94a3b8;margin-bottom:12px;">' +
              'Members: ' + escapeHtml((t.members || []).join(', ') || 'None') +
            '</div>' +
            '<div style="display:flex;gap:8px;">' +
              '<button class="ra-st__btn ra-st__btn--secondary ra-team-edit" data-id="' + escapeHtml(t.id) + '" style="padding:6px 14px;font-size:12px;flex:1;">Edit</button>' +
              '<button class="ra-st__btn ra-st__btn--secondary ra-team-delete" data-id="' + escapeHtml(t.id) + '" style="padding:6px 14px;font-size:12px;color:#e74c3c;">Delete</button>' +
            '</div>' +
          '</div>' +
        '</div>';
      }).join('') +
    '</div>';

    listEl.querySelectorAll('.ra-team-delete').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = this.getAttribute('data-id');
        if (!confirm('Delete this team?')) return;
        fetch(apiUrl('/teams/' + id), { method: 'DELETE', credentials: 'same-origin' })
          .then(function (r) { return r.json(); })
          .then(function () {
            loadTeamsData(function () { renderTeamsList(); });
            showStatus(document.getElementById('ra-team-status'), 'ok', 'Team deleted.');
          })
          .catch(function () {
            showStatus(document.getElementById('ra-team-status'), 'err', 'Failed to delete team.');
          });
      });
    });

    listEl.querySelectorAll('.ra-team-edit').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = this.getAttribute('data-id');
        var team = null;
        for (var i = 0; i < _teamsData.teams.length; i++) {
          if (_teamsData.teams[i].id === id) { team = _teamsData.teams[i]; break; }
        }
        if (team) showTeamModal(team);
      });
    });
  }

  function showTeamModal(existingTeam) {
    var isEdit = !!existingTeam;
    var t = existingTeam || { name: '', leader: '', members: [], zone: '', forms: [] };

    var modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:100001;display:flex;align-items:center;justify-content:center;';

    var userOptions = '<option value="">-- Select leader --</option>';
    var memberCheckboxes = '<div style="color:#999;font-size:13px;">Loading users...</div>';
    if (_teamsUsers && _teamsUsers.length) {
      userOptions += _teamsUsers.map(function (u) {
        var sel = t.leader === u.username ? ' selected' : '';
        return '<option value="' + escapeHtml(u.username) + '"' + sel + '>' + escapeHtml(u.username) + '</option>';
      }).join('');

      memberCheckboxes = _teamsUsers.map(function (u) {
        var checked = (t.members || []).indexOf(u.username) !== -1 ? ' checked' : '';
        var label = u.username;
        if (u.metadata && u.metadata.name) label += ' (' + u.metadata.name + ')';
        return '<label style="display:flex;align-items:center;gap:8px;padding:4px 0;font-size:13px;cursor:pointer;">' +
          '<input type="checkbox" value="' + escapeHtml(u.username) + '" class="ra-team-member-cb"' + checked + ' style="width:16px;height:16px;">' +
          escapeHtml(label) +
        '</label>';
      }).join('');
    }

    var formCheckboxes = '<div style="color:#999;font-size:13px;">Loading forms...</div>';
    if (_teamsForms && _teamsForms.length) {
      formCheckboxes = _teamsForms.map(function (f) {
        var checked = (t.forms || []).indexOf(f.uid) !== -1 ? ' checked' : '';
        return '<label style="display:flex;align-items:center;gap:8px;padding:4px 0;font-size:13px;cursor:pointer;">' +
          '<input type="checkbox" value="' + escapeHtml(f.uid) + '" class="ra-team-form-cb"' + checked + ' style="width:16px;height:16px;">' +
          escapeHtml(f.name) +
        '</label>';
      }).join('');
    }

    modal.innerHTML =
      '<div style="background:#fff;border-radius:10px;width:500px;max-width:90vw;max-height:90vh;overflow-y:auto;box-shadow:0 10px 40px rgba(0,0,0,0.2);">' +
        '<div style="padding:18px 20px;border-bottom:1px solid #e2e8f0;font-size:16px;font-weight:600;display:flex;justify-content:space-between;align-items:center;">' +
          (isEdit ? 'Edit Team' : 'New Team') +
          '<button id="ra-team-modal-close" style="background:none;border:none;font-size:20px;cursor:pointer;color:#94a3b8;">&times;</button>' +
        '</div>' +
        '<div style="padding:20px;">' +
          '<div class="ra-st__field"><label>Team Name</label><input type="text" id="ra-team-name" value="' + escapeHtml(t.name) + '" placeholder="e.g., Kinondoni Field Team"></div>' +
          '<div class="ra-st__field"><label>Team Leader</label><select id="ra-team-leader">' + userOptions + '</select></div>' +
          '<div class="ra-st__field"><label>Members</label><div style="max-height:160px;overflow-y:auto;border:1px solid #e2e8f0;border-radius:6px;padding:8px 12px;">' + memberCheckboxes + '</div></div>' +
          '<div class="ra-st__field"><label>Geographic Zone</label><input type="text" id="ra-team-zone" value="' + escapeHtml(t.zone || '') + '" placeholder="e.g., Kinondoni District"></div>' +
          '<div class="ra-st__field"><label>Assigned Forms</label><div style="max-height:160px;overflow-y:auto;border:1px solid #e2e8f0;border-radius:6px;padding:8px 12px;">' + formCheckboxes + '</div></div>' +
          '<div style="display:flex;gap:10px;margin-top:20px;">' +
            '<button class="ra-st__btn ra-st__btn--primary" id="ra-team-modal-save">' + (isEdit ? 'Update Team' : 'Create Team') + '</button>' +
            '<button class="ra-st__btn ra-st__btn--secondary" id="ra-team-modal-cancel">Cancel</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    document.body.appendChild(modal);

    function closeModal() { modal.remove(); }
    document.getElementById('ra-team-modal-close').addEventListener('click', closeModal);
    document.getElementById('ra-team-modal-cancel').addEventListener('click', closeModal);
    modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });

    document.getElementById('ra-team-modal-save').addEventListener('click', function () {
      var name = document.getElementById('ra-team-name').value.trim();
      var leader = document.getElementById('ra-team-leader').value;
      var zone = document.getElementById('ra-team-zone').value.trim();
      var members = [];
      modal.querySelectorAll('.ra-team-member-cb:checked').forEach(function (cb) { members.push(cb.value); });
      var forms = [];
      modal.querySelectorAll('.ra-team-form-cb:checked').forEach(function (cb) { forms.push(cb.value); });

      if (!name) { alert('Team name is required'); return; }

      var payload = {
        name: name,
        leader: leader,
        members: members,
        zone: zone,
        forms: forms
      };
      if (isEdit) payload.id = t.id;

      fetch(apiUrl('/teams'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(payload)
      })
        .then(function (r) { return r.json(); })
        .then(function () {
          closeModal();
          loadTeamsData(function () { renderTeamsList(); });
          showStatus(document.getElementById('ra-team-status'), 'ok', isEdit ? 'Team updated.' : 'Team created.');
        })
        .catch(function () {
          alert('Failed to save team');
        });
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

  var DASH_ADMIN_PAGE_ID = 'ra-dashadmin-page';
  var DASH_ADMIN_HASH = '#/dashboard-admin';

  function createDashAdminPage() {
    if (document.getElementById(DASH_ADMIN_PAGE_ID)) return;

    var page = document.createElement('div');
    page.id = DASH_ADMIN_PAGE_ID;
    page.style.cssText = 'display:none;position:absolute;top:64px;left:58px;right:0;bottom:0;z-index:1001;';

    var daActiveDashTab = 'layout';
    try { daActiveDashTab = sessionStorage.getItem('ra_dash_tab') || 'layout'; } catch (e) {}

    page.innerHTML =
      // Left sidebar — matches KoboToolbox form-sidebar pattern
      '<div class="ra-da__sidebar">' +
        '<div class="ra-da__sidebar-new">' +
          '<button id="ra-da-new-btn" class="ra-da__new-btn" title="Create a new dashboard">' +
            '<svg viewBox="0 0 24 24" style="width:18px;height:18px;fill:#fff;"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>' +
            'NEW' +
          '</button>' +
        '</div>' +
        '<div class="ra-da__sidebar-nav">' +
          '<div class="ra-da__nav-item' + (daActiveDashTab === 'layout' ? ' ra-da__nav-item--active' : '') + '" data-tab="layout">' +
            '<svg viewBox="0 0 24 24"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/></svg>' +
            '<span>Dashboards</span>' +
          '</div>' +
          '<div class="ra-da__nav-item' + (daActiveDashTab === 'users' ? ' ra-da__nav-item--active' : '') + '" data-tab="users">' +
            '<svg viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>' +
            '<span>Assigned Users</span>' +
          '</div>' +
          '<div class="ra-da__nav-item' + (daActiveDashTab === 'user-management' ? ' ra-da__nav-item--active' : '') + '" data-tab="user-management">' +
            '<svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/><path d="M19 3v2h2V3h-2zm0 4v2h2V7h-2zm0 4v2h2v-2h-2z" opacity=".5"/></svg>' +
            '<span>User Management</span>' +
          '</div>' +
        '</div>' +
      '</div>' +
      // Main content area
      '<div class="ra-da__main" id="ra-da-content"></div>';

    // Styles
    var daStyle = document.createElement('style');
    daStyle.textContent = [
      '.ra-da__sidebar {',
      '  width: 212px; background: #fff;',
      '  box-shadow: 0 0 8px 0 rgba(51,56,71,0.06), 0 8px 8px 0 rgba(51,56,71,0.12);',
      '  height: 100%; display: flex; flex-direction: column; position: absolute;',
      '  left: 0; top: 0; bottom: 0; overflow-y: auto; z-index: 2;',
      '}',
      '.ra-da__sidebar-new { padding: 20px 14px 12px; }',
      '.ra-da__new-btn {',
      '  display: flex; align-items: center; justify-content: center; gap: 8px;',
      '  width: 100%; padding: 10px 16px; background: #2095f3; color: #fff;',
      '  border: none; border-radius: 6px; font-size: 14px; font-weight: 600;',
      '  cursor: pointer; transition: background 0.15s;',
      '  box-shadow: 0 2px 4px 0 rgba(0,0,0,0.25);',
      '}',
      '.ra-da__new-btn:hover { background: #1977c2; }',
      '.ra-da__sidebar-nav { padding: 8px 0; }',
      '.ra-da__nav-item {',
      '  display: flex; align-items: center; gap: 12px; padding: 10px 20px;',
      '  font-size: 14px; color: #64748b; cursor: pointer;',
      '  border-left: 3px solid transparent; transition: all 0.15s;',
      '}',
      '.ra-da__nav-item svg { width: 20px; height: 20px; fill: currentColor; flex-shrink: 0; }',
      '.ra-da__nav-item:hover { color: #1e293b; background: #f8fafc; }',
      '.ra-da__nav-item--active {',
      '  color: #1e293b; font-weight: 600; border-left-color: #54a8dc;',
      '  background: #f0f9ff;',
      '}',
      '.ra-da__main {',
      '  position: absolute; left: 212px; top: 0; right: 0; bottom: 0;',
      '  overflow-y: auto; background: #edeef2; padding: 30px 30px 40px;',
      '}',
      '@media (max-width: 768px) {',
      '  .ra-da__sidebar { width: 180px; }',
      '  .ra-da__main { left: 180px; padding: 16px; }',
      '}',
      '@media (max-width: 600px) {',
      '  .ra-da__sidebar { width: 56px; overflow: hidden; }',
      '  .ra-da__sidebar-new { padding: 12px 8px 8px; }',
      '  .ra-da__new-btn { padding: 8px; font-size: 0; gap: 0; }',
      '  .ra-da__new-btn svg { width: 22px; height: 22px; }',
      '  .ra-da__nav-item { padding: 12px 0; justify-content: center; }',
      '  .ra-da__nav-item span { display: none; }',
      '  .ra-da__nav-item svg { width: 24px; height: 24px; }',
      '  .ra-da__main { left: 56px; padding: 12px; }',
      '}'
    ].join('\n');
    page.appendChild(daStyle);

    document.body.appendChild(page);

    // Nav item click handlers
    page.querySelectorAll('.ra-da__nav-item').forEach(function (item) {
      item.addEventListener('click', function () {
        daActiveDashTab = this.getAttribute('data-tab');
        activeDashTab = daActiveDashTab;
        try { sessionStorage.setItem('ra_dash_tab', daActiveDashTab); } catch (e) {}
        page.querySelectorAll('.ra-da__nav-item').forEach(function (t) { t.classList.remove('ra-da__nav-item--active'); });
        this.classList.add('ra-da__nav-item--active');
        renderDaContent();
      });
    });

    // NEW button → open new dashboard modal
    document.getElementById('ra-da-new-btn').addEventListener('click', function () {
      showNewDashboardModal();
    });

    function renderDaContent() {
      var container = document.getElementById('ra-da-content');
      if (!container) return;
      activeDashTab = daActiveDashTab;
      if (daActiveDashTab === 'users') renderDashUsersTab(container);
      else if (daActiveDashTab === 'layout') renderDashLayoutTab(container);
      else if (daActiveDashTab === 'user-management') renderUserManagementTab(container);
    }

    renderDaContent();
  }

  function showDashAdminPage() {
    createDashAdminPage();
    var page = document.getElementById(DASH_ADMIN_PAGE_ID);
    if (page) page.style.display = 'block';
    document.body.classList.add('ra-st-active');
    document.title = 'Dashboard | ' + BRAND_NAME;
    var nav = document.getElementById('ra-dashadmin-nav');
    if (nav) nav.classList.add('active');
    // Deactivate other nav items
    document.querySelectorAll('.k-drawer__link, [class*="drawer__link"]').forEach(function (link) {
      if (link.id !== 'ra-dashadmin-nav') link.classList.remove('active');
    });
    var settingsNav = document.getElementById(NAV_ID);
    if (settingsNav) settingsNav.classList.remove('active');
  }

  function hideDashAdminPage() {
    var page = document.getElementById(DASH_ADMIN_PAGE_ID);
    if (page) page.style.display = 'none';
    var nav = document.getElementById('ra-dashadmin-nav');
    if (nav) nav.classList.remove('active');
  }

  function handleNavigation() {
    if (window.location.hash === HASH) {
      hideDashAdminPage();
      createPage();
      showPage();
    } else if (window.location.hash === DASH_ADMIN_HASH) {
      hidePage();
      showDashAdminPage();
    } else {
      hidePage();
      hideDashAdminPage();
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

    // Also inject Dashboard nav icon — positioned after Library (2nd native link)
    if (!document.getElementById('ra-dashadmin-nav')) {
      var dashNav = document.createElement('a');
      dashNav.id = 'ra-dashadmin-nav';
      dashNav.href = '#/dashboard-admin';
      dashNav.setAttribute('data-tip', 'Dashboard');
      dashNav.title = 'Dashboard';
      dashNav.innerHTML = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/></svg>';
      dashNav.addEventListener('click', function (e) {
        e.preventDefault();
        window.location.hash = '#/dashboard-admin';
      });
      // Find the Library link (2nd native nav link) and insert after it
      var navLinks = primaryNav.querySelectorAll('a');
      var libraryLink = navLinks.length >= 2 ? navLinks[1] : null;
      if (libraryLink && libraryLink.nextSibling) {
        primaryNav.insertBefore(dashNav, libraryLink.nextSibling);
      } else if (libraryLink) {
        primaryNav.appendChild(dashNav);
      } else {
        primaryNav.insertBefore(dashNav, navLink);
      }
    }

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

// ── Form Scheduler (appended) ──
// This code is appended to ra-settings.js via the build process.
// It adds form scheduling and project tags functionality.

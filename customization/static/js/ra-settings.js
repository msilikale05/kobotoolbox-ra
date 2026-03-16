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

  // ── Settings sections (each is a submenu item) ──
  var SECTIONS = [
    { id: 'geonode', label: 'GeoNode', icon: '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>' },
    { id: 'export', label: 'Batch Export', icon: '<svg viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>' },
    { id: 'map', label: 'Map Defaults', icon: '<svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>' },
    { id: 'notifications', label: 'Notifications', icon: '<svg viewBox="0 0 24 24"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>' }
  ];

  var activeSection = 'geonode';

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

    if (sectionId === 'geonode') renderGeoNodeSection(main);
    else if (sectionId === 'export') renderExportSection(main);
    else if (sectionId === 'map') renderComingSoon(main, 'Map Defaults', 'Default map center, zoom level, and base layer settings.');
    else if (sectionId === 'notifications') renderComingSoon(main, 'Notifications', 'Configure submission alerts and notification preferences.');
  }

  function renderComingSoon(main, title, desc) {
    main.innerHTML = '<h1 class="ra-st__page-title">' + title + '</h1>' +
      '<div class="ra-st__content"><p style="color:#888;">' + desc + '</p>' +
      '<p style="color:#bbb;font-style:italic;margin-top:24px;">Coming soon</p></div>';
  }

  function renderGeoNodeSection(main) {
    var gs = getGeoNodeSettings();
    main.innerHTML =
      '<h1 class="ra-st__page-title">GeoNode Connection</h1>' +
      '<div class="ra-st__content">' +
        '<div class="ra-st__field">' +
          '<label>GeoNode URL</label>' +
          '<input type="url" id="ra-st-gn-url" value="' + escapeHtml(gs.url || DEFAULT_GEONODE_URL) + '" placeholder="https://geonode.example.com">' +
          '<small>The base URL of your GeoNode instance</small>' +
        '</div>' +
        '<div class="ra-st__field">' +
          '<label>API Token</label>' +
          '<input type="text" id="ra-st-gn-token" value="' + escapeHtml(gs.token || '') + '" placeholder="Bearer your-api-token">' +
          '<small>Leave empty for public layers only</small>' +
        '</div>' +
        '<div class="ra-st__field">' +
          '<label>Username</label>' +
          '<input type="text" id="ra-st-gn-user" value="' + escapeHtml(gs.username || '') + '" placeholder="admin">' +
        '</div>' +
        '<div class="ra-st__field">' +
          '<label>Password</label>' +
          '<input type="password" id="ra-st-gn-pass" value="' + escapeHtml(gs.password || '') + '">' +
        '</div>' +
        '<div class="ra-st__status" id="ra-st-gn-status"></div>' +
        '<div class="ra-st__actions">' +
          '<button class="ra-st__btn ra-st__btn--secondary" id="ra-st-gn-test">Test Connection</button>' +
          '<button class="ra-st__btn ra-st__btn--success" id="ra-st-gn-save">Save</button>' +
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

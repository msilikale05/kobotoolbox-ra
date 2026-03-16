/**
 * Resilience Academy - Combined Map View
 * ========================================
 * Adds a Map nav icon (4th) below Leaderboard in the sidebar.
 * Shows all geospatial submissions from ALL deployed forms on one map.
 * Supports geopoint, geotrace, and geoshape field types.
 * UPDATE-PROOF: Loaded via nginx sub_filter; does not modify core files.
 */
(function () {
  'use strict';

  var NAV_ID = 'ra-map-nav';
  var PAGE_ID = 'ra-map-page';
  var MAP_ID = 'ra-map-container';
  var HASH = '#/map';
  var BRAND_NAME = 'Ramani Yangu';
  var leafletLoaded = false;
  var map = null;
  var layerGroups = {};

  // Colors for different forms
  var POLL_INTERVAL = 30000; // refresh every 30 seconds
  var pollTimer = null;
  var knownSubmissionIds = {}; // track seen submissions to add only new ones
  var formColorMap = {}; // uid -> color mapping persists across refreshes
  var formGeoFieldsMap = {}; // uid -> geoFields cache

  var COLORS = [
    '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6',
    '#1abc9c', '#e67e22', '#34495e', '#e91e63', '#00bcd4',
    '#8bc34a', '#ff5722', '#607d8b', '#795548', '#cddc39'
  ];

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

    /* Page container */
    '#' + PAGE_ID + ' {',
    '  position: absolute;',
    '  top: 64px;',
    '  left: 58px;',
    '  right: 0;',
    '  bottom: 0;',
    '  background: #f5f7fa;',
    '  z-index: 1001;',
    '  display: none;',
    '}',
    '#' + PAGE_ID + '.ra-map--visible { display: block; }',
    'body.ra-map-active .k-drawer { width: 58px !important; }',
    'body.ra-map-active .k-drawer__sidebar { display: none !important; }',

    /* Map container */
    '#' + MAP_ID + ' {',
    '  width: 100%;',
    '  height: 100%;',
    '}',

    /* Legend */
    '.ra-map__legend {',
    '  position: absolute;',
    '  top: 12px;',
    '  right: 12px;',
    '  background: #fff;',
    '  border-radius: 8px;',
    '  box-shadow: 0 2px 12px rgba(0,0,0,0.15);',
    '  padding: 14px 16px;',
    '  z-index: 1000;',
    '  max-width: 320px;',
    '  max-height: calc(100vh - 120px);',
    '  overflow-y: auto;',
    '  font-size: 13px;',
    '}',
    '.ra-map__legend h3 {',
    '  margin: 0 0 10px;',
    '  font-size: 14px;',
    '  font-weight: 700;',
    '  color: #1a2a3a;',
    '}',
    '.ra-map__legend-item {',
    '  display: flex;',
    '  align-items: center;',
    '  gap: 8px;',
    '  padding: 6px 4px;',
    '  border-radius: 4px;',
    '  transition: background 0.15s;',
    '}',
    '.ra-map__legend-item:hover { background: #f0f4f8; }',
    '.ra-map__legend-icon {',
    '  width: 28px;',
    '  height: 28px;',
    '  flex-shrink: 0;',
    '  display: flex;',
    '  align-items: center;',
    '  justify-content: center;',
    '  border-radius: 4px;',
    '  background: rgba(0,0,0,0.04);',
    '}',
    '.ra-map__legend-icon svg {',
    '  width: 18px;',
    '  height: 18px;',
    '}',
    '.ra-map__legend-name {',
    '  flex: 1;',
    '  overflow: hidden;',
    '  text-overflow: ellipsis;',
    '  white-space: nowrap;',
    '  color: #333;',
    '  cursor: pointer;',
    '}',
    '.ra-map__legend-icon { cursor: pointer; }',
    '.ra-map__legend-count {',
    '  color: #999;',
    '  font-size: 12px;',
    '  flex-shrink: 0;',
    '}',
    '.ra-map__legend-item.ra-map__legend-item--hidden {',
    '  opacity: 0.4;',
    '}',

    /* Three-dot menu button */
    '.ra-map__legend-menu-btn {',
    '  flex-shrink: 0;',
    '  width: 24px;',
    '  height: 24px;',
    '  display: flex;',
    '  align-items: center;',
    '  justify-content: center;',
    '  border: none;',
    '  background: none;',
    '  cursor: pointer;',
    '  color: #999;',
    '  font-size: 16px;',
    '  border-radius: 4px;',
    '  padding: 0;',
    '  line-height: 1;',
    '  letter-spacing: 1px;',
    '}',
    '.ra-map__legend-menu-btn:hover {',
    '  background: #e0e5ea;',
    '  color: #333;',
    '}',

    /* Context menu dropdown - fixed to viewport, pops out of panel */
    '.ra-map__ctx-menu {',
    '  position: fixed;',
    '  background: #fff;',
    '  border-radius: 8px;',
    '  box-shadow: 0 8px 30px rgba(0,0,0,0.22);',
    '  z-index: 9999;',
    '  min-width: 200px;',
    '  padding: 6px 0;',
    '  display: none;',
    '}',
    '.ra-map__ctx-menu--open { display: block; }',
    '.ra-map__ctx-menu-item {',
    '  display: flex;',
    '  align-items: center;',
    '  gap: 10px;',
    '  padding: 8px 14px;',
    '  font-size: 13px;',
    '  color: #333;',
    '  cursor: pointer;',
    '  border: none;',
    '  background: none;',
    '  width: 100%;',
    '  text-align: left;',
    '}',
    '.ra-map__ctx-menu-item:hover { background: #f0f4f8; }',
    '.ra-map__ctx-menu-item svg {',
    '  width: 16px;',
    '  height: 16px;',
    '  flex-shrink: 0;',
    '  fill: #666;',
    '}',
    '.ra-map__ctx-sep {',
    '  height: 1px;',
    '  background: #eee;',
    '  margin: 4px 0;',
    '}',

    /* Color picker inline */
    '.ra-map__color-row {',
    '  display: flex;',
    '  gap: 6px;',
    '  padding: 8px 14px;',
    '  flex-wrap: wrap;',
    '}',
    '.ra-map__color-swatch {',
    '  width: 22px;',
    '  height: 22px;',
    '  border-radius: 50%;',
    '  cursor: pointer;',
    '  border: 2px solid transparent;',
    '  transition: border-color 0.15s, transform 0.15s;',
    '}',
    '.ra-map__color-swatch:hover { transform: scale(1.2); }',
    '.ra-map__color-swatch--selected { border-color: #333; }',

    /* Export modal */
    '.ra-map__export-overlay {',
    '  position: fixed;',
    '  top: 0; left: 0; right: 0; bottom: 0;',
    '  background: rgba(0,0,0,0.4);',
    '  z-index: 10000;',
    '  display: flex;',
    '  align-items: center;',
    '  justify-content: center;',
    '}',
    '.ra-map__export-modal {',
    '  background: #fff;',
    '  border-radius: 12px;',
    '  box-shadow: 0 12px 40px rgba(0,0,0,0.25);',
    '  width: 420px;',
    '  max-width: 90vw;',
    '  overflow: hidden;',
    '  cursor: move;',
    '}',
    '.ra-map__export-header {',
    '  background: linear-gradient(135deg, #1a2a3a 0%, #54a8dc 100%);',
    '  color: #fff;',
    '  padding: 16px 20px;',
    '  display: flex;',
    '  justify-content: space-between;',
    '  align-items: center;',
    '}',
    '.ra-map__export-header h3 { margin: 0; font-size: 16px; font-weight: 600; }',
    '.ra-map__export-close {',
    '  background: none; border: none; color: #fff; font-size: 20px;',
    '  cursor: pointer; padding: 0; line-height: 1; opacity: 0.8;',
    '}',
    '.ra-map__export-close:hover { opacity: 1; }',
    '.ra-map__export-body { padding: 20px; }',
    '.ra-map__export-field { margin-bottom: 16px; }',
    '.ra-map__export-field label {',
    '  display: block; font-size: 12px; font-weight: 600;',
    '  color: #666; text-transform: uppercase; letter-spacing: 0.5px;',
    '  margin-bottom: 6px;',
    '}',
    '.ra-map__export-field select, .ra-map__export-field input {',
    '  width: 100%; padding: 10px 12px; font-size: 14px;',
    '  border: 1px solid #d0d5dd; border-radius: 6px; background: #fff;',
    '  color: #333;',
    '}',
    '.ra-map__export-field select:focus, .ra-map__export-field input:focus {',
    '  outline: none; border-color: #54a8dc;',
    '  box-shadow: 0 0 0 3px rgba(84,168,220,0.15);',
    '}',
    '.ra-map__export-info {',
    '  background: #f7f9fb; border-radius: 6px; padding: 12px;',
    '  font-size: 12px; color: #666; margin-bottom: 16px;',
    '  display: flex; gap: 12px; flex-wrap: wrap;',
    '}',
    '.ra-map__export-info div { display: flex; gap: 4px; }',
    '.ra-map__export-info strong { color: #1a2a3a; }',
    '.ra-map__export-formats {',
    '  display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 16px;',
    '}',
    '.ra-map__export-fmt {',
    '  padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px;',
    '  cursor: pointer; text-align: center; transition: all 0.15s;',
    '}',
    '.ra-map__export-fmt:hover { border-color: #54a8dc; background: #f7f9fb; }',
    '.ra-map__export-fmt--selected {',
    '  border-color: #54a8dc !important; background: #eff8ff !important;',
    '}',
    '.ra-map__export-fmt-icon { font-size: 24px; margin-bottom: 4px; }',
    '.ra-map__export-fmt-name { font-size: 13px; font-weight: 600; color: #333; }',
    '.ra-map__export-fmt-desc { font-size: 11px; color: #999; }',
    '.ra-map__export-btn {',
    '  width: 100%; padding: 12px; border: none; border-radius: 6px;',
    '  background: #54a8dc; color: #fff; font-size: 14px; font-weight: 600;',
    '  cursor: pointer; transition: background 0.15s;',
    '}',
    '.ra-map__export-btn:hover { background: #4090c0; }',
    '.ra-map__export-btn:disabled {',
    '  background: #ccc; cursor: not-allowed;',
    '}',
    '.ra-map__export-progress {',
    '  text-align: center; padding: 20px; color: #666; font-size: 13px;',
    '}',

    /* Loading overlay */
    '.ra-map__loading {',
    '  position: absolute;',
    '  top: 50%;',
    '  left: 50%;',
    '  transform: translate(-50%, -50%);',
    '  background: rgba(255,255,255,0.95);',
    '  padding: 24px 40px;',
    '  border-radius: 8px;',
    '  box-shadow: 0 4px 20px rgba(0,0,0,0.15);',
    '  z-index: 1000;',
    '  text-align: center;',
    '  color: #666;',
    '  font-size: 14px;',
    '}',
    '.ra-map__loading::before {',
    '  content: "";',
    '  display: block;',
    '  width: 28px;',
    '  height: 28px;',
    '  border: 3px solid #e0e0e0;',
    '  border-top-color: #54a8dc;',
    '  border-radius: 50%;',
    '  animation: ra-map-spin 0.8s linear infinite;',
    '  margin: 0 auto 12px;',
    '}',
    '@keyframes ra-map-spin { to { transform: rotate(360deg); } }',

    /* Stats bar */
    '.ra-map__stats {',
    '  position: absolute;',
    '  bottom: 20px;',
    '  left: 50%;',
    '  transform: translateX(-50%);',
    '  background: rgba(26,42,58,0.9);',
    '  color: #fff;',
    '  padding: 10px 24px;',
    '  border-radius: 24px;',
    '  font-size: 13px;',
    '  z-index: 1000;',
    '  display: flex;',
    '  gap: 20px;',
    '  box-shadow: 0 2px 12px rgba(0,0,0,0.3);',
    '}',
    '.ra-map__stats strong { color: #54a8dc; }',
    '.ra-map__live {',
    '  display: inline-flex;',
    '  align-items: center;',
    '  gap: 6px;',
    '}',
    '.ra-map__live-dot {',
    '  width: 8px;',
    '  height: 8px;',
    '  border-radius: 50%;',
    '  background: #2ecc71;',
    '  animation: ra-map-pulse 2s ease-in-out infinite;',
    '}',
    '@keyframes ra-map-pulse {',
    '  0%, 100% { opacity: 1; }',
    '  50% { opacity: 0.3; }',
    '}',

    /* Map toolbar */
    '.ra-map__toolbar { position: absolute; top: 12px; left: 60px; z-index: 1000; display: flex; gap: 8px; }',
    '.ra-map__toolbar-btn { background: #fff; border: none; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); padding: 8px 14px; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 6px; color: #333; transition: background 0.15s; }',
    '.ra-map__toolbar-btn:hover { background: #f0f4f8; }',
    '.ra-map__toolbar-btn svg { width: 18px; height: 18px; fill: #54a8dc; }',

    /* GeoNode browser modal */
    '.ra-gn__overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 9999; display: flex; align-items: center; justify-content: center; }',
    '.ra-gn__modal { background: #fff; border-radius: 12px; width: 560px; max-height: 80vh; display: flex; flex-direction: column; box-shadow: 0 12px 40px rgba(0,0,0,0.3); }',
    '.ra-gn__header { padding: 16px 20px; border-bottom: 1px solid #eee; display: flex; align-items: center; justify-content: space-between; }',
    '.ra-gn__header h3 { margin: 0; font-size: 16px; color: #1a2a3a; }',
    '.ra-gn__close { background: none; border: none; font-size: 22px; cursor: pointer; color: #999; padding: 4px 8px; }',
    '.ra-gn__close:hover { color: #333; }',
    '.ra-gn__search { padding: 12px 20px; border-bottom: 1px solid #eee; }',
    '.ra-gn__search input { width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 13px; outline: none; box-sizing: border-box; }',
    '.ra-gn__search input:focus { border-color: #54a8dc; }',
    '.ra-gn__list { flex: 1; overflow-y: auto; padding: 8px 0; }',
    '.ra-gn__item { display: flex; align-items: center; padding: 10px 20px; gap: 12px; border-bottom: 1px solid #f5f5f5; transition: background 0.1s; }',
    '.ra-gn__item:hover { background: #f8fafc; }',
    '.ra-gn__item-info { flex: 1; min-width: 0; }',
    '.ra-gn__item-name { font-size: 13px; font-weight: 600; color: #333; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }',
    '.ra-gn__item-desc { font-size: 11px; color: #888; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }',
    '.ra-gn__item-type { font-size: 10px; color: #54a8dc; background: #eef6fc; padding: 2px 6px; border-radius: 3px; flex-shrink: 0; }',
    '.ra-gn__add-btn { background: #54a8dc; color: #fff; border: none; border-radius: 6px; padding: 6px 12px; font-size: 12px; cursor: pointer; flex-shrink: 0; }',
    '.ra-gn__add-btn:hover { background: #3d8abf; }',
    '.ra-gn__add-btn:disabled { background: #ccc; cursor: default; }',
    '.ra-gn__loading { padding: 24px; text-align: center; color: #888; }',
    '.ra-gn__empty { padding: 24px; text-align: center; color: #999; }',
    '.ra-gn__load-more { padding: 12px 20px; text-align: center; }',
    '.ra-gn__load-more button { background: none; border: 1px solid #ddd; border-radius: 6px; padding: 6px 16px; font-size: 12px; cursor: pointer; color: #666; }',
    '.ra-gn__load-more button:hover { background: #f5f5f5; }',

    /* GeoNode badge in legend */
    '.ra-map__legend-badge { font-size: 9px; background: #54a8dc; color: #fff; padding: 1px 5px; border-radius: 3px; margin-left: 4px; vertical-align: middle; }',

    /* GeoNode source selector */
    '.ra-gn__source { padding: 8px 20px; border-bottom: 1px solid #eee; }',
    '.ra-gn__source select { width: 100%; padding: 6px 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 13px; background: #f8fafc; }',
    ''
  ].join('\n');
  document.head.appendChild(style);

  // ── Load Leaflet ──
  function loadLeaflet(callback) {
    if (window.L && window.L.map) {
      leafletLoaded = true;
      callback();
      return;
    }

    // CSS
    if (!document.querySelector('link[href*="leaflet"]')) {
      var css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(css);
    }

    // JS
    if (!document.querySelector('script[src*="leaflet"]')) {
      var script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = function () {
        waitForL(callback);
      };
      script.onerror = function () {
        var loading = document.getElementById('ra-map-loading');
        if (loading) loading.textContent = 'Error: Could not load map library. Check internet connection.';
      };
      document.head.appendChild(script);
    } else {
      waitForL(callback);
    }
  }

  function waitForL(callback) {
    var attempts = 0;
    var check = setInterval(function () {
      attempts++;
      if (window.L && window.L.map) {
        clearInterval(check);
        leafletLoaded = true;
        callback();
      } else if (attempts > 50) { // 5 seconds max
        clearInterval(check);
        var loading = document.getElementById('ra-map-loading');
        if (loading) loading.textContent = 'Error: Map library failed to initialize.';
      }
    }, 100);
  }

  // ── API ──
  function fetchJSON(url) {
    return fetch(url, { credentials: 'same-origin' })
      .then(function (r) {
        if (!r.ok) throw new Error(r.status);
        return r.json();
      });
  }

  function fetchDeployedForms() {
    return fetchJSON(
      '/api/v2/assets/?asset_type=survey&fields=["uid","name","deployment_status","deployment__submission_count","content"]&limit=200'
    ).then(function (data) {
      return (data.results || []).filter(function (a) {
        return a.deployment_status === 'deployed' && (a.deployment__submission_count || 0) > 0;
      });
    });
  }

  function fetchAllSubmissions(uid) {
    return fetchJSON(
      '/api/v2/assets/' + uid + '/data/?fields=["_id","_submitted_by","_submission_time","_geolocation"]&limit=30000'
    ).then(function (data) {
      return data.results || [];
    });
  }

  // ── Geo parsing ──
  function findGeoFields(content) {
    var geoFields = [];
    if (!content || !content.survey) return geoFields;
    content.survey.forEach(function (row) {
      var t = row.type || '';
      if (t === 'geopoint' || t === 'geotrace' || t === 'geoshape') {
        geoFields.push({ name: row.name || row.$autoname, type: t });
      }
    });
    return geoFields;
  }

  function parseGeopoint(val) {
    if (!val) return null;
    if (Array.isArray(val)) {
      if (val.length >= 2 && val[0] !== null && val[1] !== null) {
        return [parseFloat(val[0]), parseFloat(val[1])];
      }
      return null;
    }
    var parts = String(val).trim().split(/[\s,;]+/);
    if (parts.length >= 2) {
      var lat = parseFloat(parts[0]);
      var lon = parseFloat(parts[1]);
      if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
        return [lat, lon];
      }
    }
    return null;
  }

  function parseGeotrace(val) {
    if (!val) return null;
    var points = String(val).trim().split(';').map(function (p) {
      return parseGeopoint(p.trim());
    }).filter(Boolean);
    return points.length >= 2 ? points : null;
  }

  function parseGeoshape(val) {
    var points = parseGeotrace(val);
    return points && points.length >= 3 ? points : null;
  }

  // ── Map ──
  function createPage() {
    if (document.getElementById(PAGE_ID)) return;

    var page = document.createElement('div');
    page.id = PAGE_ID;
    page.innerHTML = [
      '<div id="' + MAP_ID + '"></div>',
      '<div class="ra-map__loading" id="ra-map-loading">Loading map data from all forms...</div>'
    ].join('');
    document.body.appendChild(page);
  }

  // ── GeoNode Layer Management ──
  var GEONODE_LAYERS_KEY = 'ra_map_geonode_layers';
  var geonodeLayers = {}; // id -> { layer, name, wmsUrl, ... }

  function getGeoNodeSettings() {
    try {
        var data = JSON.parse(localStorage.getItem('ra_geonode_settings'));
        if (!data) return [];
        // Migration: if old single-object format, convert to array
        if (!Array.isArray(data)) {
            var conn = data;
            conn.id = conn.id || 'conn_migrated';
            conn.name = conn.name || 'GeoNode';
            data = [conn];
            localStorage.setItem('ra_geonode_settings', JSON.stringify(data));
        }
        return data;
    } catch (e) { return []; }
  }

  function getSavedGeoNodeLayers() {
    try {
      return JSON.parse(localStorage.getItem(GEONODE_LAYERS_KEY)) || [];
    } catch (e) { return []; }
  }

  function saveGeoNodeLayers(layers) {
    try {
      localStorage.setItem(GEONODE_LAYERS_KEY, JSON.stringify(layers));
    } catch (e) {}
  }

  function createToolbar() {
    var page = document.getElementById(PAGE_ID);
    var old = page.querySelector('.ra-map__toolbar');
    if (old) old.remove();

    var toolbar = document.createElement('div');
    toolbar.className = 'ra-map__toolbar';
    toolbar.innerHTML =
      '<button class="ra-map__toolbar-btn" id="ra-gn-browse-btn" title="Add GeoNode Layer">' +
        '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>' +
        'Add GeoNode Layer' +
      '</button>';

    toolbar.querySelector('#ra-gn-browse-btn').addEventListener('click', openGeoNodeBrowser);
    page.appendChild(toolbar);
  }

  function openGeoNodeBrowser() {
    var connections = getGeoNodeSettings();
    if (!connections.length) {
        alert('No GeoNode connections configured. Go to Settings > GeoNode to add one.');
        return;
    }

    var activeConn = connections[0];

    var overlay = document.createElement('div');
    overlay.className = 'ra-gn__overlay';

    var sourceSelector = '';
    if (connections.length > 1) {
        var options = connections.map(function(c) {
            return '<option value="' + c.id + '">' + escapeHtml(c.name || c.url) + '</option>';
        }).join('');
        sourceSelector = '<div class="ra-gn__source">' +
            '<select id="ra-gn-source-select">' + options + '</select>' +
            '</div>';
    }

    overlay.innerHTML =
        '<div class="ra-gn__modal">' +
            '<div class="ra-gn__header">' +
                '<h3>Add Layer</h3>' +
                '<button class="ra-gn__close">&times;</button>' +
            '</div>' +
            sourceSelector +
            '<div class="ra-gn__search">' +
                '<input type="text" placeholder="Search datasets..." id="ra-gn-search-input">' +
            '</div>' +
            '<div class="ra-gn__list" id="ra-gn-list">' +
                '<div class="ra-gn__loading">Loading datasets...</div>' +
            '</div>' +
        '</div>';

    overlay.querySelector('.ra-gn__close').addEventListener('click', function() { overlay.remove(); });
    overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });

    document.body.appendChild(overlay);

    fetchGeoNodeDatasets(activeConn, '', 1);

    // Source selector
    var select = overlay.querySelector('#ra-gn-source-select');
    if (select) {
        select.addEventListener('change', function() {
            var connId = this.value;
            activeConn = connections.find(function(c) { return c.id === connId; }) || connections[0];
            fetchGeoNodeDatasets(activeConn, overlay.querySelector('#ra-gn-search-input').value, 1);
        });
    }

    // Search with debounce
    var searchTimer = null;
    overlay.querySelector('#ra-gn-search-input').addEventListener('input', function(e) {
        clearTimeout(searchTimer);
        var term = e.target.value;
        searchTimer = setTimeout(function() { fetchGeoNodeDatasets(activeConn, term, 1); }, 400);
    });
  }

  function fetchGeoNodeDatasets(gs, search, page) {
    var listEl = document.getElementById('ra-gn-list');
    if (page === 1) {
      listEl.innerHTML = '<div class="ra-gn__loading">Loading datasets...</div>';
    }

    var baseUrl = gs.url.replace(/\/+$/, '');
    var params = 'url=' + encodeURIComponent(baseUrl) +
      '&action=list&page=' + page;
    if (search) params += '&search=' + encodeURIComponent(search);
    if (gs.token) params += '&token=' + encodeURIComponent(gs.token);
    if (gs.username) params += '&username=' + encodeURIComponent(gs.username);
    if (gs.password) params += '&password=' + encodeURIComponent(gs.password);

    fetch('/geonode-proxy/?' + params)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!data.ok) {
          listEl.innerHTML = '<div class="ra-gn__empty">Error: ' + escapeHtml(data.error || 'Unknown error') + '</div>';
          return;
        }
        renderGeoNodeDatasets(listEl, data.datasets, data.total, page, gs, search);
      })
      .catch(function (err) {
        listEl.innerHTML = '<div class="ra-gn__empty">Failed to load: ' + escapeHtml(err.message) + '</div>';
      });
  }

  function renderGeoNodeDatasets(listEl, datasets, total, page, gs, search) {
    if (page === 1) listEl.innerHTML = '';

    if (!datasets || datasets.length === 0) {
      if (page === 1) {
        listEl.innerHTML = '<div class="ra-gn__empty">No datasets found</div>';
      }
      return;
    }

    var savedLayers = getSavedGeoNodeLayers();
    var addedIds = savedLayers.map(function (l) { return l.id; });

    datasets.forEach(function (ds) {
      var dsId = ds.pk || ds.id;
      var isAdded = addedIds.indexOf(dsId) !== -1;
      var item = document.createElement('div');
      item.className = 'ra-gn__item';
      item.innerHTML =
        '<div class="ra-gn__item-info">' +
          '<div class="ra-gn__item-name">' + escapeHtml(ds.title || ds.name || 'Untitled') + '</div>' +
          '<div class="ra-gn__item-desc">' + escapeHtml((ds.abstract || ds.raw_abstract || '').substring(0, 100)) + '</div>' +
        '</div>' +
        (ds.subtype ? '<span class="ra-gn__item-type">' + escapeHtml(ds.subtype) + '</span>' : '') +
        '<button class="ra-gn__add-btn"' + (isAdded ? ' disabled' : '') + '>' +
          (isAdded ? 'Added' : 'Add') +
        '</button>';

      if (!isAdded) {
        item.querySelector('.ra-gn__add-btn').addEventListener('click', function () {
          addGeoNodeWMSLayer(ds, gs);
          this.disabled = true;
          this.textContent = 'Added';
        });
      }
      listEl.appendChild(item);
    });

    // Load more button
    var pageSize = 20;
    if (datasets.length >= pageSize) {
      var more = document.createElement('div');
      more.className = 'ra-gn__load-more';
      more.innerHTML = '<button>Load more...</button>';
      more.querySelector('button').addEventListener('click', function () {
        more.remove();
        fetchGeoNodeDatasets(gs, search, page + 1);
      });
      listEl.appendChild(more);
    }
  }

  function addGeoNodeWMSLayer(dataset, gs) {
    var L = window.L;
    if (!L || !map) return;

    var baseUrl = gs.url.replace(/\/+$/, '');
    // GeoNode WMS endpoint
    var wmsUrl = baseUrl + '/geoserver/ows';
    var layerName = dataset.alternate || dataset.typename || dataset.name;
    var displayName = dataset.title || dataset.name || layerName;
    var dsId = dataset.pk || dataset.id || layerName;

    var wmsLayer = L.tileLayer.wms(wmsUrl, {
      layers: layerName,
      format: 'image/png',
      transparent: true,
      version: '1.1.1',
      attribution: 'GeoNode',
      uppercase: true,
      maxZoom: 20,
      zIndex: 500
    });

    wmsLayer.on('tileerror', function() {
        if (wmsUrl.indexOf('/geoserver/ows') !== -1) {
            var altUrl = baseUrl + '/geoserver/wms';
            wmsLayer.setUrl(altUrl);
        }
    });

    wmsLayer.addTo(map);

    // Store in geonodeLayers
    var gnId = 'gn_' + dsId;
    var bounds = null;
    if (dataset.bbox && dataset.bbox.x0 != null) {
        bounds = [[dataset.bbox.y0, dataset.bbox.x0], [dataset.bbox.y1, dataset.bbox.x1]];
    }
    geonodeLayers[gnId] = {
      layer: wmsLayer,
      name: displayName,
      color: '#54a8dc',
      count: 0,
      isGeoNode: true,
      wmsUrl: wmsUrl,
      layerName: layerName,
      bounds: bounds,
      sourceId: gs ? (gs.id || '') : '',
      sourceName: gs ? (gs.name || 'GeoNode') : 'GeoNode'
    };

    // Also add to layerGroups for legend compatibility
    layerGroups[gnId] = geonodeLayers[gnId];

    // Save to localStorage
    var saved = getSavedGeoNodeLayers();
    saved.push({
      id: dsId,
      name: displayName,
      layerName: layerName,
      wmsUrl: wmsUrl,
      bounds: bounds,
      sourceId: gs ? (gs.id || '') : '',
      sourceName: gs ? (gs.name || 'GeoNode') : 'GeoNode'
    });
    saveGeoNodeLayers(saved);

    // Refresh legend
    createLegend(layerGroups);
  }

  function loadSavedGeoNodeLayers() {
    var L = window.L;
    if (!L || !map) return;

    var saved = getSavedGeoNodeLayers();
    saved.forEach(function (sl) {
      var gnId = 'gn_' + sl.id;
      var wmsLayer = L.tileLayer.wms(sl.wmsUrl, {
        layers: sl.layerName,
        format: 'image/png',
        transparent: true,
        version: '1.1.1',
        attribution: 'GeoNode',
        uppercase: true,
        maxZoom: 20,
        zIndex: 500
      });

      wmsLayer.on('tileerror', function() {
          if (sl.wmsUrl.indexOf('/geoserver/ows') !== -1) {
              var altUrl = sl.wmsUrl.replace('/geoserver/ows', '/geoserver/wms');
              wmsLayer.setUrl(altUrl);
          }
      });

      var hidden = getHiddenLayers();
      if (hidden.indexOf(gnId) === -1) {
        wmsLayer.addTo(map);
      }

      geonodeLayers[gnId] = {
        layer: wmsLayer,
        name: sl.name,
        color: '#54a8dc',
        count: 0,
        isGeoNode: true,
        wmsUrl: sl.wmsUrl,
        layerName: sl.layerName,
        bounds: sl.bounds || null,
        sourceId: sl.sourceId || '',
        sourceName: sl.sourceName || 'GeoNode'
      };
      layerGroups[gnId] = geonodeLayers[gnId];
    });
  }

  function removeGeoNodeLayer(gnId) {
    if (geonodeLayers[gnId]) {
      map.removeLayer(geonodeLayers[gnId].layer);
      delete geonodeLayers[gnId];
      delete layerGroups[gnId];
    }
    // Remove from saved
    var dsId = gnId.replace('gn_', '');
    var saved = getSavedGeoNodeLayers().filter(function (l) {
      return String(l.id) !== String(dsId);
    });
    saveGeoNodeLayers(saved);
    createLegend(layerGroups);
  }

  function initMap() {
    if (map) return;

    try {
      var L = window.L;
      var container = document.getElementById(MAP_ID);
      if (!container || !L || !L.map) {
        throw new Error('Map container or Leaflet not ready');
      }

      // Ensure container has dimensions before initializing
      if (container.offsetWidth === 0 || container.offsetHeight === 0) {
        setTimeout(initMap, 200);
        return;
      }

      map = L.map(MAP_ID, {
        center: [-6.8, 39.28], // Dar es Salaam
        zoom: 12,
        zoomControl: true
      });

      // Tile layers
      var osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
      });

      var satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: '&copy; Esri',
        maxZoom: 18
      });

      osm.addTo(map);

      L.control.layers({
        'Streets': osm,
        'Satellite': satellite
      }, null, { position: 'topleft' }).addTo(map);

      // Fix map size after display
      setTimeout(function () { map.invalidateSize(); }, 300);
      setTimeout(function () { map.invalidateSize(); }, 1000);
    } catch (err) {
      var loading = document.getElementById('ra-map-loading');
      if (loading) loading.textContent = 'Error initializing map: ' + err.message;
    }
  }

  function loadAllGeoData() {
    var loading = document.getElementById('ra-map-loading');
    if (loading) { loading.style.display = ''; loading.textContent = 'Loading map data from all forms...'; }

    fetchDeployedForms().then(function (forms) {
      if (!forms.length) {
        if (loading) loading.textContent = 'No deployed forms with submissions found.';
        return Promise.resolve(null);
      }

      if (loading) loading.textContent = 'Loading submissions from ' + forms.length + ' form(s)...';

      var savedColors = getSavedColors();
      var promises = forms.map(function (form, idx) {
        var color = savedColors[form.uid] || COLORS[idx % COLORS.length];
        var geoFields = findGeoFields(form.content);

        // If content wasn't in list response, fetch it separately
        var contentPromise = geoFields.length > 0
          ? Promise.resolve(geoFields)
          : fetchJSON('/api/v2/assets/' + form.uid + '/?fields=["content"]')
              .then(function (d) { return findGeoFields(d.content); })
              .catch(function () { return []; });

        return contentPromise.then(function (fields) {
          return fetchAllSubmissions(form.uid).then(function (submissions) {
            return {
              uid: form.uid,
              name: form.name,
              color: color,
              geoFields: fields,
              submissions: submissions
            };
          });
        }).catch(function () {
          return { uid: form.uid, name: form.name, color: color, geoFields: [], submissions: [] };
        });
      });

      return Promise.all(promises);
    }).then(function (formDataList) {
      if (!formDataList) return;
      try {
        if (map) map.invalidateSize();
        renderGeoData(formDataList);
        if (loading) loading.style.display = 'none';
      } catch (err) {
        if (loading) loading.textContent = 'Error rendering map: ' + err.message;
      }
    }).catch(function (err) {
      if (loading) loading.textContent = 'Error loading data: ' + err.message;
    });
  }

  function renderGeoData(formDataList) {
    var L = window.L;
    var allBounds = [];
    var totalPoints = 0;
    var totalForms = 0;

    // Clear existing layers
    Object.keys(layerGroups).forEach(function (key) {
      map.removeLayer(layerGroups[key]);
    });
    layerGroups = {};

    // Remove existing legend and stats
    document.querySelectorAll('.ra-map__legend, .ra-map__stats').forEach(function (el) { el.remove(); });

    formDataList.forEach(function (formData) {
      var group = L.layerGroup();
      var count = 0;

      // Cache color and geo fields for live refresh
      formColorMap[formData.uid] = formData.color;
      if (formData.geoFields.length) formGeoFieldsMap[formData.uid] = formData.geoFields;

      formData.submissions.forEach(function (sub) {
        // Track this submission
        if (sub._id) knownSubmissionIds[sub._id] = true;

        // Try _geolocation first (KPI always provides this for geopoint)
        var geoloc = sub._geolocation;
        if (geoloc && Array.isArray(geoloc) && geoloc[0] !== null && geoloc[1] !== null) {
          var lat = parseFloat(geoloc[0]);
          var lon = parseFloat(geoloc[1]);
          if (!isNaN(lat) && !isNaN(lon) && lat !== 0 && lon !== 0) {
            var marker = L.circleMarker([lat, lon], {
              radius: 7,
              fillColor: formData.color,
              color: '#fff',
              weight: 2,
              opacity: 1,
              fillOpacity: 0.85
            });

            var popupContent = '<b>' + escapeHtml(formData.name) + '</b><br>' +
              '<small>Submitted by: ' + escapeHtml(sub._submitted_by || 'anonymous') + '</small><br>' +
              '<small>' + formatTime(sub._submission_time) + '</small><br>' +
              '<small>Lat: ' + lat.toFixed(5) + ', Lon: ' + lon.toFixed(5) + '</small>';

            marker.bindPopup(popupContent);
            group.addLayer(marker);
            allBounds.push([lat, lon]);
            count++;
          }
        }

        // Also check for geotrace/geoshape fields
        formData.geoFields.forEach(function (field) {
          var val = sub[field.name];
          if (!val) return;

          if (field.type === 'geotrace') {
            var tracePoints = parseGeotrace(val);
            if (tracePoints) {
              var polyline = L.polyline(tracePoints, {
                color: formData.color,
                weight: 3,
                opacity: 0.8
              });
              polyline.bindPopup('<b>' + escapeHtml(formData.name) + '</b><br><small>Trace by: ' + escapeHtml(sub._submitted_by || 'anonymous') + '</small>');
              group.addLayer(polyline);
              tracePoints.forEach(function (p) { allBounds.push(p); });
              count++;
            }
          } else if (field.type === 'geoshape') {
            var shapePoints = parseGeoshape(val);
            if (shapePoints) {
              var polygon = L.polygon(shapePoints, {
                color: formData.color,
                fillColor: formData.color,
                fillOpacity: 0.2,
                weight: 2
              });
              polygon.bindPopup('<b>' + escapeHtml(formData.name) + '</b><br><small>Shape by: ' + escapeHtml(sub._submitted_by || 'anonymous') + '</small>');
              group.addLayer(polygon);
              shapePoints.forEach(function (p) { allBounds.push(p); });
              count++;
            }
          }
        });
      });

      if (count > 0) {
        var hidden = getHiddenLayers();
        if (hidden.indexOf(formData.uid) === -1) {
          group.addTo(map);
        }
        layerGroups[formData.uid] = { layer: group, name: formData.name, color: formData.color, count: count };
        totalPoints += count;
        totalForms++;
      }
    });

    // Fit bounds
    if (allBounds.length > 0) {
      map.fitBounds(allBounds, { padding: [40, 40], maxZoom: 15 });
    }

    // Create legend
    createLegend(layerGroups);

    // Create stats bar
    createStats(totalForms, totalPoints);
  }

  function createLegend(groups) {
    var page = document.getElementById(PAGE_ID);

    // Remove existing legend
    var old = page.querySelector('.ra-map__legend');
    if (old) old.remove();

    var legend = document.createElement('div');
    legend.className = 'ra-map__legend';

    var html = '<h3>Layers</h3>';
    var formKeys = Object.keys(groups).filter(function (k) { return k.indexOf('gn_') !== 0; });
    var gnKeys = Object.keys(groups).filter(function (k) { return k.indexOf('gn_') === 0; });

    // Form layers
    formKeys.forEach(function (uid) {
      var g = groups[uid];
      var visible = map.hasLayer(g.layer);
      var hiddenClass = visible ? '' : ' ra-map__legend-item--hidden';
      var fields = formGeoFieldsMap[uid] || [];

      // Determine primary geo type for the icon
      var geoType = 'geopoint'; // default
      if (fields.length) geoType = fields[0].type;

      var icon = geoTypeIcon(geoType, g.color);

      html += '<div class="ra-map__legend-item' + hiddenClass + '" data-uid="' + uid + '" style="position:relative;">' +
        '<input type="checkbox"' + (visible ? ' checked' : '') + ' style="margin:0;cursor:pointer;flex-shrink:0;"> ' +
        '<span class="ra-map__legend-icon">' + icon + '</span>' +
        '<span class="ra-map__legend-name">' + escapeHtml(g.name) + '</span>' +
        '<span class="ra-map__legend-count">' + g.count + '</span>' +
        '<button class="ra-map__legend-menu-btn" data-menu-uid="' + uid + '" title="More options">&#8942;</button>' +
        '</div>';
    });

    // GeoNode layers section
    if (gnKeys.length > 0) {
      html += '<div style="margin-top:8px;padding-top:8px;border-top:1px solid #eee;">' +
        '<div style="font-size:11px;color:#999;font-weight:600;margin-bottom:4px;">GEONODE LAYERS</div></div>';

      gnKeys.forEach(function (gnId) {
        var g = groups[gnId];
        var visible = map.hasLayer(g.layer);
        var hiddenClass = visible ? '' : ' ra-map__legend-item--hidden';
        var gnIcon = '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" fill="#54a8dc"/></svg>';

        html += '<div class="ra-map__legend-item' + hiddenClass + '" data-uid="' + gnId + '" style="position:relative;">' +
          '<input type="checkbox"' + (visible ? ' checked' : '') + ' style="margin:0;cursor:pointer;flex-shrink:0;"> ' +
          '<span class="ra-map__legend-icon">' + gnIcon + '</span>' +
          '<span class="ra-map__legend-name">' + escapeHtml(g.name) + '<span class="ra-map__legend-badge">GeoNode</span></span>' +
          '<button class="ra-map__legend-menu-btn" data-menu-uid="' + gnId + '" title="More options">&#8942;</button>' +
          '</div>';
      });
    }

    legend.innerHTML = html;

    // Checkbox toggles layer visibility and saves state
    legend.addEventListener('change', function (e) {
      if (e.target.tagName !== 'INPUT') return;
      var item = e.target.closest('.ra-map__legend-item');
      if (!item) return;
      var uid = item.getAttribute('data-uid');
      var g = groups[uid];
      if (!g) return;

      if (e.target.checked) {
        g.layer.addTo(map);
        item.classList.remove('ra-map__legend-item--hidden');
        toggleHiddenLayer(uid, false);
      } else {
        map.removeLayer(g.layer);
        item.classList.add('ra-map__legend-item--hidden');
        toggleHiddenLayer(uid, true);
      }
    });

    // Clicking form name zooms to that form's data
    legend.addEventListener('click', function (e) {
      if (e.target.tagName === 'INPUT') return; // let checkbox handle its own
      var nameEl = e.target.closest('.ra-map__legend-name, .ra-map__legend-icon');
      if (!nameEl) return;
      var item = nameEl.closest('.ra-map__legend-item');
      if (!item) return;
      var uid = item.getAttribute('data-uid');
      var g = groups[uid];
      if (!g) return;

      // Only zoom if the layer is visible (ticked)
      if (!map.hasLayer(g.layer)) return;

      // Zoom to this form's bounds
      var bounds = g.layer.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
      }

      // Highlight the selected row
      legend.querySelectorAll('.ra-map__legend-item').forEach(function (el) {
        el.style.background = '';
      });
      item.style.background = '#e8f4fd';
    });

    // Three-dot menu handler
    legend.addEventListener('click', function (e) {
      var menuBtn = e.target.closest('.ra-map__legend-menu-btn');
      if (!menuBtn) return;
      e.stopPropagation();

      var uid = menuBtn.getAttribute('data-menu-uid');
      var g = groups[uid];
      if (!g) return;

      // Close any open menu
      closeContextMenu();

      // Create context menu — fixed position, attached to body
      var rect = menuBtn.getBoundingClientRect();

      var menu = document.createElement('div');
      menu.className = 'ra-map__ctx-menu ra-map__ctx-menu--open';
      menu.id = 'ra-map-ctx-menu';
      menu.setAttribute('data-uid', uid);

      // Position to the left of the button, below it
      menu.style.top = rect.bottom + 4 + 'px';
      menu.style.right = (window.innerWidth - rect.right) + 'px';

      var isGeoNodeLayer = uid.indexOf('gn_') === 0;

      if (isGeoNodeLayer) {
        // Simplified menu for GeoNode WMS layers
        menu.innerHTML =
          '<button class="ra-map__ctx-menu-item" data-action="zoom">' +
            '<svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>' +
            'Zoom to layer</button>' +
          '<button class="ra-map__ctx-menu-item" data-action="opacity">' +
            '<svg viewBox="0 0 24 24"><path d="M17.66 8L12 2.35 6.34 8A8.02 8.02 0 004 13.64c0 2 .78 4.11 2.34 5.67a7.99 7.99 0 0011.32 0c1.56-1.56 2.34-3.67 2.34-5.67S19.22 9.56 17.66 8zM6 14c.01-2 .62-3.27 1.76-4.4L12 5.27l4.24 4.38C17.38 10.77 17.99 12 18 14H6z"/></svg>' +
            'Change opacity</button>' +
          '<div class="ra-map__ctx-sep"></div>' +
          '<button class="ra-map__ctx-menu-item" data-action="only">' +
            '<svg viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>' +
            'Show only this</button>' +
          '<button class="ra-map__ctx-menu-item" data-action="showall">' +
            '<svg viewBox="0 0 24 24"><path d="M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z"/></svg>' +
            'Show all layers</button>' +
          '<div class="ra-map__ctx-sep"></div>' +
          '<button class="ra-map__ctx-menu-item" data-action="remove" style="color:#e74c3c;">' +
            '<svg viewBox="0 0 24 24" fill="#e74c3c"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>' +
            'Remove layer</button>';
      } else {
        var swatches = COLORS.map(function (c) {
          var sel = c === g.color ? ' ra-map__color-swatch--selected' : '';
          return '<span class="ra-map__color-swatch' + sel + '" data-color="' + c + '" style="background:' + c + '"></span>';
        }).join('');

        menu.innerHTML =
          '<button class="ra-map__ctx-menu-item" data-action="zoom">' +
            '<svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>' +
            'Zoom to layer</button>' +
          '<button class="ra-map__ctx-menu-item" data-action="opacity">' +
            '<svg viewBox="0 0 24 24"><path d="M17.66 8L12 2.35 6.34 8A8.02 8.02 0 004 13.64c0 2 .78 4.11 2.34 5.67a7.99 7.99 0 0011.32 0c1.56-1.56 2.34-3.67 2.34-5.67S19.22 9.56 17.66 8zM6 14c.01-2 .62-3.27 1.76-4.4L12 5.27l4.24 4.38C17.38 10.77 17.99 12 18 14H6z"/></svg>' +
            'Change opacity</button>' +
          '<div class="ra-map__ctx-sep"></div>' +
          '<div style="padding:4px 14px;font-size:11px;color:#999;font-weight:600;">CHANGE COLOR</div>' +
          '<div class="ra-map__color-row">' + swatches + '</div>' +
          '<div class="ra-map__ctx-sep"></div>' +
          '<button class="ra-map__ctx-menu-item" data-action="only">' +
            '<svg viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>' +
            'Show only this</button>' +
          '<button class="ra-map__ctx-menu-item" data-action="showall">' +
            '<svg viewBox="0 0 24 24"><path d="M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z"/></svg>' +
            'Show all forms</button>' +
          '<button class="ra-map__ctx-menu-item" data-action="export">' +
            '<svg viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>' +
            'Export data</button>' +
          '<button class="ra-map__ctx-menu-item" data-action="data" style="color:#54a8dc;">' +
            '<svg viewBox="0 0 24 24" fill="#54a8dc"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>' +
            'View data table</button>';
      }

      document.body.appendChild(menu);

      // Menu action handlers
      menu.addEventListener('click', function (ev) {
        var action = ev.target.closest('[data-action]');
        var swatch = ev.target.closest('.ra-map__color-swatch');

        if (swatch) {
          // Change color
          var newColor = swatch.getAttribute('data-color');
          changeLayerColor(uid, newColor, groups);
          closeContextMenu();
          return;
        }

        if (!action) return;
        var act = action.getAttribute('data-action');

        if (act === 'zoom') {
          if (g.isGeoNode && geonodeLayers[uid] && geonodeLayers[uid].bounds) {
            map.fitBounds(geonodeLayers[uid].bounds, { padding: [50, 50], maxZoom: 16 });
          } else if (map.hasLayer(g.layer)) {
            var bounds = g.layer.getBounds();
            if (bounds.isValid()) map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
          }
        } else if (act === 'opacity') {
          cycleOpacity(uid, groups);
        } else if (act === 'only') {
          // Show only this, hide all others
          Object.keys(groups).forEach(function (id) {
            var gi = groups[id];
            var row = legend.querySelector('[data-uid="' + id + '"]');
            var cb = row ? row.querySelector('input[type="checkbox"]') : null;
            if (id === uid) {
              if (!map.hasLayer(gi.layer)) gi.layer.addTo(map);
              if (row) row.classList.remove('ra-map__legend-item--hidden');
              if (cb) cb.checked = true;
              toggleHiddenLayer(id, false);
            } else {
              if (map.hasLayer(gi.layer)) map.removeLayer(gi.layer);
              if (row) row.classList.add('ra-map__legend-item--hidden');
              if (cb) cb.checked = false;
              toggleHiddenLayer(id, true);
            }
          });
        } else if (act === 'showall') {
          saveHiddenLayers([]); // clear all hidden
          Object.keys(groups).forEach(function (id) {
            var gi = groups[id];
            var row = legend.querySelector('[data-uid="' + id + '"]');
            var cb = row ? row.querySelector('input[type="checkbox"]') : null;
            if (!map.hasLayer(gi.layer)) gi.layer.addTo(map);
            if (row) row.classList.remove('ra-map__legend-item--hidden');
            if (cb) cb.checked = true;
          });
        } else if (act === 'export') {
          openExportModal(uid, g.name, g.count);
        } else if (act === 'data') {
          window.location.hash = '#/forms/' + uid + '/data/table';
        } else if (act === 'remove') {
          removeGeoNodeLayer(uid);
        }

        closeContextMenu();
      });
    });

    // Close context menu on outside click
    document.addEventListener('mousedown', function (e) {
      if (e.target.closest('.ra-map__ctx-menu') || e.target.closest('.ra-map__legend-menu-btn')) return;
      closeContextMenu();
    });

    page.appendChild(legend);
  }

  // ── Persistence ──
  var HIDDEN_KEY = 'ra_map_hidden_layers';
  var COLORS_KEY = 'ra_map_layer_colors';

  function getHiddenLayers() {
    try {
      return JSON.parse(localStorage.getItem(HIDDEN_KEY)) || [];
    } catch (e) { return []; }
  }

  function saveHiddenLayers(hiddenUids) {
    try {
      localStorage.setItem(HIDDEN_KEY, JSON.stringify(hiddenUids));
    } catch (e) { /* ignore */ }
  }

  function toggleHiddenLayer(uid, hidden) {
    var list = getHiddenLayers();
    if (hidden && list.indexOf(uid) === -1) {
      list.push(uid);
    } else if (!hidden) {
      list = list.filter(function (id) { return id !== uid; });
    }
    saveHiddenLayers(list);
  }

  function getSavedColors() {
    try {
      return JSON.parse(localStorage.getItem(COLORS_KEY)) || {};
    } catch (e) { return {}; }
  }

  function saveColor(uid, color) {
    try {
      var colors = getSavedColors();
      colors[uid] = color;
      localStorage.setItem(COLORS_KEY, JSON.stringify(colors));
    } catch (e) { /* ignore */ }
  }

  // ── Export Modal ──
  function openExportModal(uid, formName, pointCount) {
    // Remove any existing modal
    var old = document.querySelector('.ra-map__export-overlay');
    if (old) old.remove();

    var geoFields = formGeoFieldsMap[uid] || [];
    var geoTypes = geoFields.map(function (f) {
      return f.type === 'geopoint' ? 'Points' : f.type === 'geotrace' ? 'Lines' : 'Polygons';
    });
    if (!geoTypes.length) geoTypes = ['Points'];

    var overlay = document.createElement('div');
    overlay.className = 'ra-map__export-overlay';
    overlay.innerHTML =
      '<div class="ra-map__export-modal" id="ra-export-modal">' +
        '<div class="ra-map__export-header">' +
          '<h3>Export Data</h3>' +
          '<button class="ra-map__export-close">&times;</button>' +
        '</div>' +
        '<div class="ra-map__export-body">' +
          '<div class="ra-map__export-info">' +
            '<div><strong>' + escapeHtml(formName) + '</strong></div>' +
            '<div>Locations: <strong>' + pointCount + '</strong></div>' +
            '<div>Type: <strong>' + geoTypes.join(', ') + '</strong></div>' +
          '</div>' +
          '<div class="ra-map__export-field">' +
            '<label>Export Format</label>' +
          '</div>' +
          '<div class="ra-map__export-formats" id="ra-export-formats">' +
            '<div class="ra-map__export-fmt ra-map__export-fmt--selected" data-format="geojson">' +
              '<div class="ra-map__export-fmt-icon">{}</div>' +
              '<div class="ra-map__export-fmt-name">GeoJSON</div>' +
              '<div class="ra-map__export-fmt-desc">For QGIS, web maps</div>' +
            '</div>' +
            '<div class="ra-map__export-fmt" data-format="kml">' +
              '<div class="ra-map__export-fmt-icon">&#127758;</div>' +
              '<div class="ra-map__export-fmt-name">KML</div>' +
              '<div class="ra-map__export-fmt-desc">For Google Earth</div>' +
            '</div>' +
            '<div class="ra-map__export-fmt" data-format="csv">' +
              '<div class="ra-map__export-fmt-icon">&#128196;</div>' +
              '<div class="ra-map__export-fmt-name">CSV</div>' +
              '<div class="ra-map__export-fmt-desc">Spreadsheet with coords</div>' +
            '</div>' +
            '<div class="ra-map__export-fmt" data-format="gpx">' +
              '<div class="ra-map__export-fmt-icon">&#128204;</div>' +
              '<div class="ra-map__export-fmt-name">GPX</div>' +
              '<div class="ra-map__export-fmt-desc">For GPS devices</div>' +
            '</div>' +
          '</div>' +
          '<div class="ra-map__export-field">' +
            '<label>Include Fields</label>' +
            '<select id="ra-export-fields">' +
              '<option value="all">All fields</option>' +
              '<option value="geo">Coordinates only</option>' +
            '</select>' +
          '</div>' +
          '<button class="ra-map__export-btn" id="ra-export-go">Export</button>' +
          '<div class="ra-map__export-progress" id="ra-export-progress" style="display:none;"></div>' +
        '</div>' +
      '</div>';

    document.body.appendChild(overlay);

    var selectedFormat = 'geojson';

    // Format selection
    overlay.querySelector('#ra-export-formats').addEventListener('click', function (e) {
      var fmt = e.target.closest('.ra-map__export-fmt');
      if (!fmt) return;
      overlay.querySelectorAll('.ra-map__export-fmt').forEach(function (f) {
        f.classList.remove('ra-map__export-fmt--selected');
      });
      fmt.classList.add('ra-map__export-fmt--selected');
      selectedFormat = fmt.getAttribute('data-format');
    });

    // Close button
    overlay.querySelector('.ra-map__export-close').addEventListener('click', function () {
      overlay.remove();
    });

    // Click overlay background to close
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) overlay.remove();
    });

    // Make modal draggable
    makeDraggable(overlay.querySelector('#ra-export-modal'));

    // Export button
    overlay.querySelector('#ra-export-go').addEventListener('click', function () {
      var btn = this;
      var progress = overlay.querySelector('#ra-export-progress');
      var fieldsOpt = overlay.querySelector('#ra-export-fields').value;
      btn.disabled = true;
      btn.textContent = 'Exporting...';
      progress.style.display = 'block';
      progress.textContent = 'Fetching all submissions...';

      // Fetch full submission data
      fetchJSON('/api/v2/assets/' + uid + '/data/?limit=30000')
        .then(function (data) {
          var subs = data.results || [];
          progress.textContent = 'Processing ' + subs.length + ' submissions...';

          var geoFieldNames = geoFields.map(function (f) { return f.name; });

          if (selectedFormat === 'geojson') {
            exportGeoJSON(subs, geoFieldNames, formName, fieldsOpt);
          } else if (selectedFormat === 'kml') {
            exportKML(subs, geoFieldNames, formName, fieldsOpt);
          } else if (selectedFormat === 'csv') {
            exportCSV(subs, formName, fieldsOpt);
          } else if (selectedFormat === 'gpx') {
            exportGPX(subs, geoFieldNames, formName);
          }

          progress.textContent = 'Export complete!';
          setTimeout(function () { overlay.remove(); }, 1500);
        })
        .catch(function (err) {
          progress.textContent = 'Error: ' + err.message;
          btn.disabled = false;
          btn.textContent = 'Export';
        });
    });
  }

  function makeDraggable(el) {
    var header = el.querySelector('.ra-map__export-header');
    var offsetX = 0, offsetY = 0, isDragging = false;

    header.addEventListener('mousedown', function (e) {
      if (e.target.closest('.ra-map__export-close')) return;
      isDragging = true;
      offsetX = e.clientX - el.getBoundingClientRect().left;
      offsetY = e.clientY - el.getBoundingClientRect().top;
      el.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', function (e) {
      if (!isDragging) return;
      el.style.position = 'fixed';
      el.style.left = (e.clientX - offsetX) + 'px';
      el.style.top = (e.clientY - offsetY) + 'px';
      el.style.margin = '0';
    });

    document.addEventListener('mouseup', function () {
      isDragging = false;
      if (el) el.style.cursor = 'move';
    });
  }

  // ── Export functions ──
  function downloadFile(content, filename, mimeType) {
    var blob = new Blob([content], { type: mimeType });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function getSubFields(sub, fieldsOpt) {
    if (fieldsOpt === 'geo') return {};
    var props = {};
    Object.keys(sub).forEach(function (k) {
      if (k.indexOf('_') === 0 && k !== '_submitted_by' && k !== '_submission_time' && k !== '_id') return;
      if (k === '_geolocation' || k === 'meta' || k === 'formhub') return;
      props[k] = sub[k];
    });
    return props;
  }

  function exportGeoJSON(subs, geoFieldNames, formName, fieldsOpt) {
    var features = [];
    subs.forEach(function (sub) {
      var geoloc = sub._geolocation;
      if (!geoloc || !geoloc[0] || !geoloc[1]) return;
      var lat = parseFloat(geoloc[0]);
      var lon = parseFloat(geoloc[1]);
      if (isNaN(lat) || isNaN(lon)) return;

      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [lon, lat] },
        properties: getSubFields(sub, fieldsOpt)
      });
    });

    var geojson = { type: 'FeatureCollection', features: features };
    var safe = formName.replace(/[^a-zA-Z0-9_-]/g, '_');
    downloadFile(JSON.stringify(geojson, null, 2), safe + '.geojson', 'application/geo+json');
  }

  function exportKML(subs, geoFieldNames, formName, fieldsOpt) {
    var placemarks = '';
    subs.forEach(function (sub) {
      var geoloc = sub._geolocation;
      if (!geoloc || !geoloc[0] || !geoloc[1]) return;
      var lat = parseFloat(geoloc[0]);
      var lon = parseFloat(geoloc[1]);
      if (isNaN(lat) || isNaN(lon)) return;

      var name = sub._submitted_by || sub._id || 'Submission';
      var desc = Object.keys(getSubFields(sub, fieldsOpt)).map(function (k) {
        return k + ': ' + sub[k];
      }).join('\n');

      placemarks += '<Placemark><name>' + escapeHtml(String(name)) + '</name>' +
        '<description>' + escapeHtml(desc) + '</description>' +
        '<Point><coordinates>' + lon + ',' + lat + ',0</coordinates></Point></Placemark>\n';
    });

    var kml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<kml xmlns="http://www.opengis.net/kml/2.2">\n<Document>\n' +
      '<name>' + escapeHtml(formName) + '</name>\n' +
      placemarks + '</Document>\n</kml>';

    var safe = formName.replace(/[^a-zA-Z0-9_-]/g, '_');
    downloadFile(kml, safe + '.kml', 'application/vnd.google-earth.kml+xml');
  }

  function exportCSV(subs, formName, fieldsOpt) {
    if (!subs.length) return;
    // Collect all field keys
    var allKeys = {};
    subs.forEach(function (sub) {
      Object.keys(getSubFields(sub, fieldsOpt)).forEach(function (k) { allKeys[k] = true; });
    });
    var keys = ['latitude', 'longitude'].concat(Object.keys(allKeys));

    var lines = [keys.join(',')];
    subs.forEach(function (sub) {
      var geoloc = sub._geolocation;
      if (!geoloc || !geoloc[0] || !geoloc[1]) return;
      var row = [geoloc[0], geoloc[1]];
      var fields = getSubFields(sub, fieldsOpt);
      Object.keys(allKeys).forEach(function (k) {
        var val = fields[k] !== undefined ? String(fields[k]).replace(/"/g, '""') : '';
        row.push('"' + val + '"');
      });
      lines.push(row.join(','));
    });

    var safe = formName.replace(/[^a-zA-Z0-9_-]/g, '_');
    downloadFile(lines.join('\n'), safe + '.csv', 'text/csv');
  }

  function exportGPX(subs, geoFieldNames, formName) {
    var wpts = '';
    subs.forEach(function (sub) {
      var geoloc = sub._geolocation;
      if (!geoloc || !geoloc[0] || !geoloc[1]) return;
      var lat = parseFloat(geoloc[0]);
      var lon = parseFloat(geoloc[1]);
      if (isNaN(lat) || isNaN(lon)) return;

      var name = sub._submitted_by || sub._id || 'Point';
      var time = sub._submission_time || '';
      wpts += '<wpt lat="' + lat + '" lon="' + lon + '">' +
        '<name>' + escapeHtml(String(name)) + '</name>' +
        (time ? '<time>' + time + '</time>' : '') +
        '</wpt>\n';
    });

    var gpx = '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<gpx version="1.1" creator="Ramani Yangu">\n' +
      '<metadata><name>' + escapeHtml(formName) + '</name></metadata>\n' +
      wpts + '</gpx>';

    var safe = formName.replace(/[^a-zA-Z0-9_-]/g, '_');
    downloadFile(gpx, safe + '.gpx', 'application/gpx+xml');
  }

  function closeContextMenu() {
    var existing = document.getElementById('ra-map-ctx-menu');
    if (existing) existing.remove();
  }

  function changeLayerColor(uid, newColor, groups) {
    var g = groups[uid];
    if (!g) return;
    g.color = newColor;
    formColorMap[uid] = newColor;
    saveColor(uid, newColor);

    // Update all markers/shapes in the layer
    g.layer.eachLayer(function (layer) {
      if (layer.setStyle) {
        layer.setStyle({ fillColor: newColor, color: layer.options.weight > 2 ? newColor : '#fff' });
      }
    });

    // Rebuild legend to reflect new color
    createLegend(groups);
  }

  function cycleOpacity(uid, groups) {
    var g = groups[uid];
    if (!g) return;
    // Cycle through opacity levels: 0.85 -> 0.5 -> 0.25 -> 0.85
    var current = -1;
    g.layer.eachLayer(function (layer) {
      if (current === -1 && layer.options) current = layer.options.fillOpacity || 0.85;
    });
    var next = current > 0.7 ? 0.5 : (current > 0.3 ? 0.25 : 0.85);
    g.layer.eachLayer(function (layer) {
      if (layer.setStyle) layer.setStyle({ fillOpacity: next, opacity: next + 0.15 });
    });
  }

  function createStats(formCount, pointCount) {
    var page = document.getElementById(PAGE_ID);
    // Remove existing stats
    var old = page.querySelector('.ra-map__stats');
    if (old) old.remove();

    var stats = document.createElement('div');
    stats.className = 'ra-map__stats';
    stats.innerHTML = '<div><strong>' + formCount + '</strong> forms</div>' +
      '<div><strong>' + pointCount + '</strong> locations</div>' +
      '<div class="ra-map__live"><span class="ra-map__live-dot"></span> Live</div>';
    page.appendChild(stats);
  }

  // ── Live refresh ──
  function refreshNewSubmissions() {
    fetchDeployedForms().then(function (forms) {
      if (!forms.length) return;

      var savedColors = getSavedColors();
      var promises = forms.map(function (form) {
        var color = formColorMap[form.uid] || savedColors[form.uid];
        if (!color) {
          color = COLORS[Object.keys(formColorMap).length % COLORS.length];
          formColorMap[form.uid] = color;
        }

        // Get geo fields from cache or fetch
        var fieldsPromise = formGeoFieldsMap[form.uid]
          ? Promise.resolve(formGeoFieldsMap[form.uid])
          : fetchJSON('/api/v2/assets/' + form.uid + '/?fields=["content"]')
              .then(function (d) {
                var f = findGeoFields(d.content);
                formGeoFieldsMap[form.uid] = f;
                return f;
              })
              .catch(function () { return []; });

        return fieldsPromise.then(function (geoFields) {
          return fetchAllSubmissions(form.uid).then(function (submissions) {
            return { uid: form.uid, name: form.name, color: color, geoFields: geoFields, submissions: submissions };
          });
        }).catch(function () {
          return null;
        });
      });

      return Promise.all(promises);
    }).then(function (formDataList) {
      if (!formDataList) return;
      var newCount = 0;
      var L = window.L;

      formDataList.forEach(function (formData) {
        if (!formData) return;

        formData.submissions.forEach(function (sub) {
          var subId = sub._id;
          if (knownSubmissionIds[subId]) return; // already on map

          var geoloc = sub._geolocation;
          if (geoloc && Array.isArray(geoloc) && geoloc[0] !== null && geoloc[1] !== null) {
            var lat = parseFloat(geoloc[0]);
            var lon = parseFloat(geoloc[1]);
            if (!isNaN(lat) && !isNaN(lon) && lat !== 0 && lon !== 0) {
              var marker = L.circleMarker([lat, lon], {
                radius: 7,
                fillColor: formData.color,
                color: '#fff',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.85
              });
              marker.bindPopup(
                '<b>' + escapeHtml(formData.name) + '</b><br>' +
                '<small>By: ' + escapeHtml(sub._submitted_by || 'anonymous') + '</small><br>' +
                '<small>' + formatTime(sub._submission_time) + '</small>'
              );

              // Add to existing layer group or create new one
              if (!layerGroups[formData.uid]) {
                var group = L.layerGroup().addTo(map);
                layerGroups[formData.uid] = { layer: group, name: formData.name, color: formData.color, count: 0 };
              }
              layerGroups[formData.uid].layer.addLayer(marker);
              layerGroups[formData.uid].count++;
              knownSubmissionIds[subId] = true;
              newCount++;
            }
          }
        });
      });

      if (newCount > 0) {
        // Update legend and stats
        createLegend(layerGroups);
        var totalPoints = 0;
        var totalForms = 0;
        Object.keys(layerGroups).forEach(function (uid) {
          totalPoints += layerGroups[uid].count;
          totalForms++;
        });
        createStats(totalForms, totalPoints);
      }
    }).catch(function () {
      // Silent fail on refresh
    });
  }

  function geoTypeIcon(type, color) {
    if (type === 'geotrace') {
      // Line icon
      return '<svg viewBox="0 0 24 24"><path d="M3 17l4-4 4 4 4-4 4 4" fill="none" stroke="' + color + '" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    }
    if (type === 'geoshape') {
      // Polygon icon
      return '<svg viewBox="0 0 24 24"><polygon points="12,3 21,10 18,20 6,20 3,10" fill="' + color + '" fill-opacity="0.3" stroke="' + color + '" stroke-width="2" stroke-linejoin="round"/></svg>';
    }
    // Default: Point (circle with pin)
    return '<svg viewBox="0 0 24 24"><circle cx="12" cy="10" r="6" fill="' + color + '" stroke="#fff" stroke-width="2"/><path d="M12 16l-1 4h2l-1-4z" fill="' + color + '"/></svg>';
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str || ''));
    return div.innerHTML;
  }

  function formatTime(dateStr) {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleString();
    } catch (e) {
      return dateStr;
    }
  }

  // ── Navigation ──
  function isMapPage() {
    return window.location.hash === HASH;
  }

  function showPage() {
    var page = document.getElementById(PAGE_ID);
    if (page) page.classList.add('ra-map--visible');
    document.body.classList.add('ra-map-active');
    document.title = 'Map | ' + BRAND_NAME;

    var nav = document.getElementById(NAV_ID);
    if (nav) nav.classList.add('active');

    document.querySelectorAll('.k-drawer__link, [class*="drawer__link"]').forEach(function (link) {
      if (link.id !== NAV_ID) link.classList.remove('active');
    });

    // Initialize map AFTER page is visible (needs dimensions)
    setTimeout(function () {
      loadLeaflet(function () {
        initMap();
        // Wait for map to be ready before loading data
        setTimeout(function () {
          if (map) {
            map.invalidateSize();
            createToolbar();
            loadSavedGeoNodeLayers();
            loadAllGeoData();
            startLivePolling();
          }
        }, 500);
      });
    }, 100);
  }

  function hidePage() {
    var page = document.getElementById(PAGE_ID);
    if (page) page.classList.remove('ra-map--visible');
    document.body.classList.remove('ra-map-active');
    stopLivePolling();

    var nav = document.getElementById(NAV_ID);
    if (nav) nav.classList.remove('active');
  }

  function startLivePolling() {
    stopLivePolling();
    pollTimer = setInterval(function () {
      if (isMapPage() && map) {
        refreshNewSubmissions();
      }
    }, POLL_INTERVAL);
  }

  function stopLivePolling() {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  }

  function handleNavigation() {
    if (isMapPage()) {
      createPage();
      showPage();
    } else {
      hidePage();
    }
  }

  // ── Nav icon injection ──
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
    navLink.setAttribute('data-tip', 'Map');
    navLink.title = 'Combined Map View';
    navLink.innerHTML = [
      '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">',
      '<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>',
      '</svg>'
    ].join('');

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

  // Hide map when other nav is clicked
  document.addEventListener('click', function (e) {
    var link = e.target.closest('.k-drawer__link, [class*="drawer__link"]');
    if (link && link.id !== NAV_ID) {
      setTimeout(hidePage, 100);
    }
  }, true);

  var lastHash = window.location.hash;
  setInterval(function () {
    if (window.location.hash !== lastHash) {
      lastHash = window.location.hash;
      handleNavigation();
    }
  }, 300);
})();

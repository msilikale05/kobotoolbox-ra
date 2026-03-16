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
    '.ra-gn__item-icon { width: 32px; height: 32px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; background: #f0f4f8; border-radius: 6px; }',
    '.ra-gn__item-icon svg { width: 20px; height: 20px; }',
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
      '<button class="ra-map__toolbar-btn" id="ra-gn-browse-btn" title="Add Layer">' +
        '<svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>' +
        'Add Layer' +
      '</button>';

    toolbar.querySelector('#ra-gn-browse-btn').addEventListener('click', openGeoNodeBrowser);
    page.appendChild(toolbar);
  }

  function openGeoNodeBrowser() {
    var connections = getGeoNodeSettings();
    if (!connections.length) {
        alert('No data sources configured. Go to Settings > Data Sources to add one.');
        return;
    }

    // Tile sources go to basemap switcher; only GeoNode/WMS are browsable here
    var tileTypes = ['xyz', 'google', 'esri', 'osm', 'carto', 'stamen', 'weather'];
    var browsable = connections.filter(function (c) { return !c.type || c.type === 'geonode' || c.type === 'wms' || c.type === 'wfs'; });
    var directAdd = connections.filter(function (c) { return tileTypes.indexOf(c.type) !== -1; });

    var activeConn = browsable.length ? browsable[0] : null;

    var overlay = document.createElement('div');
    overlay.className = 'ra-gn__overlay';

    // Source selector for browsable sources
    var sourceSelector = '';
    if (browsable.length > 1) {
        var options = browsable.map(function(c) {
            return '<option value="' + c.id + '">' + escapeHtml(c.name || c.url) + '</option>';
        }).join('');
        sourceSelector = '<div class="ra-gn__source">' +
            '<select id="ra-gn-source-select">' + options + '</select>' +
            '</div>';
    }

    // Note about basemaps if tile sources are configured
    var basemapNote = '';
    if (directAdd.length) {
        basemapNote = '<div style="padding:8px 20px;font-size:11px;color:#888;background:#f8fafc;border-bottom:1px solid #eee;">' +
            'Tip: Your tile sources (' + directAdd.map(function(c) { return c.name; }).join(', ') +
            ') are available as background maps in the layer switcher (top-left of map).</div>';
    }

    overlay.innerHTML =
        '<div class="ra-gn__modal">' +
            '<div class="ra-gn__header">' +
                '<h3>Add Data Layer</h3>' +
                '<button class="ra-gn__close">&times;</button>' +
            '</div>' +
            basemapNote +
            sourceSelector +
            '<div class="ra-gn__search">' +
                '<input type="text" placeholder="Search datasets..." id="ra-gn-search-input">' +
            '</div>' +
            '<div class="ra-gn__list" id="ra-gn-list">' +
                (activeConn ? '<div class="ra-gn__loading">Loading datasets...</div>' : '<div class="ra-gn__empty">No GeoNode or WMS sources configured. Go to Settings > Data Sources to add one.</div>') +
            '</div>' +
        '</div>';

    overlay.querySelector('.ra-gn__close').addEventListener('click', function() { overlay.remove(); });
    overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });

    document.body.appendChild(overlay);

    if (activeConn) fetchGeoNodeDatasets(activeConn, '', 1);

    // Source selector
    var select = overlay.querySelector('#ra-gn-source-select');
    if (select) {
        select.addEventListener('change', function() {
            var connId = this.value;
            activeConn = browsable.find(function(c) { return c.id === connId; }) || browsable[0];
            fetchGeoNodeDatasets(activeConn, overlay.querySelector('#ra-gn-search-input').value, 1);
        });
    }

    // Search with debounce
    var searchTimer = null;
    overlay.querySelector('#ra-gn-search-input').addEventListener('input', function(e) {
        clearTimeout(searchTimer);
        var term = e.target.value;
        searchTimer = setTimeout(function() { if (activeConn) fetchGeoNodeDatasets(activeConn, term, 1); }, 400);
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
      var geomType = ds.geom_type || ds.subtype || 'vector';
      var geomIcon = gnGeomIcon(geomType);
      var geomLabel = geomType === 'point' ? 'Point' : geomType === 'line' ? 'Line' : geomType === 'polygon' ? 'Polygon' : geomType === 'raster' ? 'Raster' : 'Vector';

      item.innerHTML =
        '<span class="ra-gn__item-icon">' + geomIcon + '</span>' +
        '<div class="ra-gn__item-info">' +
          '<div class="ra-gn__item-name">' + escapeHtml(ds.title || ds.name || 'Untitled') + '</div>' +
          '<div class="ra-gn__item-desc">' + escapeHtml((ds.abstract || ds.raw_abstract || '').substring(0, 100)) + '</div>' +
        '</div>' +
        '<span class="ra-gn__item-type">' + geomLabel + '</span>' +
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

  function addTileLayer(conn) {
    var L = window.L;
    if (!L || !map) return;

    var tileLayer = L.tileLayer(conn.url, {
      maxZoom: 20,
      attribution: conn.name || conn.type || 'Tiles',
      zIndex: 400
    });
    tileLayer.addTo(map);

    var gnId = 'gn_' + conn.id;
    geonodeLayers[gnId] = {
      layer: tileLayer,
      name: conn.name,
      color: '#9b59b6',
      count: 0,
      isGeoNode: true,
      isTile: true,
      wmsUrl: conn.url,
      layerName: conn.name,
      bounds: null,
      geomType: 'raster',
      sourceId: conn.id,
      sourceName: conn.name
    };
    layerGroups[gnId] = geonodeLayers[gnId];

    var saved = getSavedGeoNodeLayers();
    saved.push({
      id: conn.id,
      name: conn.name,
      layerName: conn.name,
      wmsUrl: conn.url,
      isTile: true,
      bounds: null,
      geomType: 'raster',
      sourceId: conn.id,
      sourceName: conn.name
    });
    saveGeoNodeLayers(saved);
    createLegend(layerGroups);
  }

  function parseBounds(dataset) {
    var bounds = null;
    if (dataset.bbox) {
      var bb = dataset.bbox;
      if (bb.x0 != null && bb.y0 != null) bounds = [[bb.y0, bb.x0], [bb.y1, bb.x1]];
      else if (Array.isArray(bb) && bb.length >= 4) bounds = [[bb[1], bb[0]], [bb[3], bb[2]]];
      else if (bb.minx != null) bounds = [[bb.miny, bb.minx], [bb.maxy, bb.maxx]];
    }
    if (!bounds && dataset.ll_bbox_polygon) {
      try {
        var coords = dataset.ll_bbox_polygon.coordinates || dataset.ll_bbox_polygon;
        if (Array.isArray(coords) && coords[0] && coords[0].length >= 4) {
          var lats = coords[0].map(function (c) { return c[1]; });
          var lons = coords[0].map(function (c) { return c[0]; });
          bounds = [[Math.min.apply(null, lats), Math.min.apply(null, lons)], [Math.max.apply(null, lats), Math.max.apply(null, lons)]];
        }
      } catch (e) {}
    }
    return bounds;
  }

  function addGeoNodeWMSLayer(dataset, gs) {
    var L = window.L;
    if (!L || !map) return;

    var baseUrl = gs.url.replace(/\/+$/, '');
    var layerName = dataset.alternate || dataset.typename || dataset.name;
    var displayName = dataset.title || dataset.name || layerName;
    var dsId = dataset.pk || dataset.id || layerName;
    var gnId = 'gn_' + dsId;
    var bounds = parseBounds(dataset);
    var geomType = (dataset.geom_type || 'vector').toLowerCase();
    var defaultColor = '#54a8dc';
    var defaultStroke = '#2980b9';

    // Determine if this is raster (use WMS) or vector (try WFS first)
    var isRaster = geomType === 'raster' || geomType === 'coverage';

    if (isRaster) {
      // Raster data — must use WMS
      addAsWMS(baseUrl, layerName, displayName, dsId, gnId, bounds, geomType, gs);
    } else {
      // Vector data — try WFS (GeoJSON) first for proper styling, fallback to WMS
      var wfsUrls = [
        baseUrl + '/geoserver/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=' + encodeURIComponent(layerName) + '&outputFormat=application/json&maxFeatures=5000',
        baseUrl + '/geoserver/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=' + encodeURIComponent(layerName) + '&outputFormat=application/json&maxFeatures=5000',
        baseUrl + '/gs/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=' + encodeURIComponent(layerName) + '&outputFormat=application/json&maxFeatures=5000'
      ];

      tryWFS(wfsUrls, 0, function (geojson) {
        if (geojson && geojson.features && geojson.features.length > 0) {
          addAsVector(geojson, displayName, dsId, gnId, bounds, geomType, gs, defaultColor, defaultStroke);
        } else {
          // WFS failed or empty — fall back to WMS
          addAsWMS(baseUrl, layerName, displayName, dsId, gnId, bounds, geomType, gs);
        }
      });
    }
  }

  function tryWFS(urls, idx, callback) {
    if (idx >= urls.length) { callback(null); return; }
    fetch(urls[idx])
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (data) {
        if (data && data.type === 'FeatureCollection') {
          callback(data);
        } else {
          tryWFS(urls, idx + 1, callback);
        }
      })
      .catch(function () {
        tryWFS(urls, idx + 1, callback);
      });
  }

  function addAsVector(geojson, displayName, dsId, gnId, bounds, geomType, gs, fillColor, strokeColor) {
    var L = window.L;
    var featureCount = geojson.features.length;

    var vectorLayer = L.geoJSON(geojson, {
      style: function (feature) {
        var gType = feature.geometry ? feature.geometry.type : '';
        if (gType === 'Polygon' || gType === 'MultiPolygon') {
          return { color: strokeColor, fillColor: fillColor, fillOpacity: 0.3, weight: 2, opacity: 0.8 };
        } else if (gType === 'LineString' || gType === 'MultiLineString') {
          return { color: fillColor, weight: 3, opacity: 0.8 };
        }
        return { color: fillColor, fillColor: fillColor, fillOpacity: 0.8 };
      },
      pointToLayer: function (feature, latlng) {
        return L.circleMarker(latlng, {
          radius: 6, fillColor: fillColor, color: '#fff', weight: 2, fillOpacity: 0.85
        });
      },
      onEachFeature: function (feature, layer) {
        if (feature.properties) {
          var props = feature.properties;
          var popupHtml = '<div style="max-height:200px;overflow-y:auto;font-size:12px;">';
          popupHtml += '<div style="font-weight:600;margin-bottom:6px;color:#1e293b;">' + escapeHtml(displayName) + '</div>';
          var keys = Object.keys(props);
          for (var i = 0; i < keys.length && i < 10; i++) {
            var val = props[keys[i]];
            if (val !== null && val !== undefined && val !== '') {
              popupHtml += '<div><span style="color:#64748b;">' + escapeHtml(keys[i]) + ':</span> ' + escapeHtml(String(val)) + '</div>';
            }
          }
          if (keys.length > 10) popupHtml += '<div style="color:#94a3b8;">... ' + (keys.length - 10) + ' more fields</div>';
          popupHtml += '</div>';
          layer.bindPopup(popupHtml, { maxWidth: 300 });
        }
      }
    });

    vectorLayer.addTo(map);

    // Detect actual geometry type from features
    var detectedType = geomType;
    if (geojson.features.length > 0) {
      var firstGeom = geojson.features[0].geometry;
      if (firstGeom) {
        var gt = firstGeom.type.toLowerCase();
        if (gt.indexOf('polygon') !== -1) detectedType = 'polygon';
        else if (gt.indexOf('line') !== -1) detectedType = 'line';
        else if (gt.indexOf('point') !== -1) detectedType = 'point';
      }
    }

    // Use vector layer bounds if parsed bounds missing
    if (!bounds) {
      try {
        var vBounds = vectorLayer.getBounds();
        if (vBounds.isValid()) bounds = vBounds;
      } catch (e) {}
    }

    geonodeLayers[gnId] = {
      layer: vectorLayer,
      name: displayName,
      color: fillColor,
      strokeColor: strokeColor,
      count: featureCount,
      isGeoNode: true,
      isVector: true,
      layerName: dsId,
      bounds: bounds,
      geomType: detectedType,
      sourceId: gs ? (gs.id || '') : '',
      sourceName: gs ? (gs.name || 'GeoNode') : 'GeoNode'
    };
    layerGroups[gnId] = geonodeLayers[gnId];

    var saved = getSavedGeoNodeLayers();
    saved.push({
      id: dsId, name: displayName, layerName: dsId,
      wmsUrl: gs.url.replace(/\/+$/, '') + '/geoserver/ows',
      bounds: bounds, geomType: detectedType,
      sourceId: gs ? (gs.id || '') : '',
      sourceName: gs ? (gs.name || 'GeoNode') : 'GeoNode'
    });
    saveGeoNodeLayers(saved);
    createLegend(layerGroups);

    // Zoom to new layer
    if (bounds) {
      try { map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 }); } catch (e) {}
    }
  }

  function addAsWMS(baseUrl, layerName, displayName, dsId, gnId, bounds, geomType, gs) {
    var L = window.L;
    var wmsEndpoints = [
      baseUrl + '/geoserver/ows',
      baseUrl + '/geoserver/wms',
      baseUrl + '/gs/ows',
      baseUrl + '/gs/wms'
    ];
    var currentEndpointIdx = 0;
    var errorCount = 0;

    var wmsLayer = L.tileLayer.wms(wmsEndpoints[0], {
      layers: layerName,
      format: 'image/png',
      transparent: true,
      version: '1.1.1',
      attribution: 'GeoNode',
      uppercase: true,
      maxZoom: 20,
      zIndex: 500
    });

    wmsLayer.on('tileerror', function () {
      errorCount++;
      if (errorCount >= 3 && currentEndpointIdx < wmsEndpoints.length - 1) {
        currentEndpointIdx++;
        errorCount = 0;
        wmsLayer.setUrl(wmsEndpoints[currentEndpointIdx]);
      }
    });

    wmsLayer.addTo(map);

    geonodeLayers[gnId] = {
      layer: wmsLayer,
      name: displayName,
      color: '#54a8dc',
      count: 0,
      isGeoNode: true,
      isVector: false,
      wmsUrl: wmsEndpoints[0],
      layerName: layerName,
      bounds: bounds,
      geomType: geomType,
      sourceId: gs ? (gs.id || '') : '',
      sourceName: gs ? (gs.name || 'GeoNode') : 'GeoNode'
    };
    layerGroups[gnId] = geonodeLayers[gnId];

    var saved = getSavedGeoNodeLayers();
    saved.push({
      id: dsId, name: displayName, layerName: layerName,
      wmsUrl: wmsEndpoints[0], bounds: bounds, geomType: geomType,
      sourceId: gs ? (gs.id || '') : '',
      sourceName: gs ? (gs.name || 'GeoNode') : 'GeoNode'
    });
    saveGeoNodeLayers(saved);
    createLegend(layerGroups);

    if (bounds) {
      try { map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 }); } catch (e) {}
    }
  }

  function loadSavedGeoNodeLayers() {
    var L = window.L;
    if (!L || !map) return;

    var saved = getSavedGeoNodeLayers();
    var hidden = getHiddenLayers();

    saved.forEach(function (sl) {
      var gnId = 'gn_' + sl.id;
      var isHidden = hidden.indexOf(gnId) !== -1;
      var geomType = (sl.geomType || 'vector').toLowerCase();
      var isRaster = geomType === 'raster' || geomType === 'coverage';

      if (sl.isTile) {
        // XYZ tile layer
        var tileLayer = L.tileLayer(sl.wmsUrl, { maxZoom: 20, attribution: sl.name || 'Tiles', zIndex: 400 });
        if (!isHidden) tileLayer.addTo(map);
        geonodeLayers[gnId] = {
          layer: tileLayer, name: sl.name, color: '#54a8dc', count: 0,
          isGeoNode: true, isVector: false, wmsUrl: sl.wmsUrl, layerName: sl.layerName,
          bounds: sl.bounds || null, geomType: sl.geomType || 'vector',
          sourceId: sl.sourceId || '', sourceName: sl.sourceName || 'GeoNode'
        };
        layerGroups[gnId] = geonodeLayers[gnId];
      } else if (!isRaster && sl.wmsUrl) {
        // Vector — try WFS first
        var baseUrl = sl.wmsUrl.replace(/\/geoserver\/(ows|wms).*$/, '');
        var layerName = sl.layerName || sl.id;
        var wfsUrls = [
          baseUrl + '/geoserver/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=' + encodeURIComponent(layerName) + '&outputFormat=application/json&maxFeatures=5000',
          baseUrl + '/geoserver/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=' + encodeURIComponent(layerName) + '&outputFormat=application/json&maxFeatures=5000'
        ];

        (function (savedLayer, geoNodeId, isLayerHidden) {
          tryWFS(wfsUrls, 0, function (geojson) {
            if (geojson && geojson.features && geojson.features.length > 0) {
              var fillColor = '#54a8dc';
              var strokeColor = '#2980b9';
              var vectorLayer = L.geoJSON(geojson, {
                style: function (feature) {
                  var gType = feature.geometry ? feature.geometry.type : '';
                  if (gType === 'Polygon' || gType === 'MultiPolygon') return { color: strokeColor, fillColor: fillColor, fillOpacity: 0.3, weight: 2, opacity: 0.8 };
                  if (gType === 'LineString' || gType === 'MultiLineString') return { color: fillColor, weight: 3, opacity: 0.8 };
                  return { color: fillColor, fillColor: fillColor, fillOpacity: 0.8 };
                },
                pointToLayer: function (feature, latlng) {
                  return L.circleMarker(latlng, { radius: 6, fillColor: fillColor, color: '#fff', weight: 2, fillOpacity: 0.85 });
                },
                onEachFeature: function (feature, layer) {
                  if (feature.properties) {
                    var props = feature.properties;
                    var html = '<div style="max-height:200px;overflow-y:auto;font-size:12px;">';
                    html += '<div style="font-weight:600;margin-bottom:6px;">' + escapeHtml(savedLayer.name) + '</div>';
                    var keys = Object.keys(props);
                    for (var i = 0; i < keys.length && i < 10; i++) {
                      if (props[keys[i]] != null && props[keys[i]] !== '') html += '<div><span style="color:#64748b;">' + escapeHtml(keys[i]) + ':</span> ' + escapeHtml(String(props[keys[i]])) + '</div>';
                    }
                    html += '</div>';
                    layer.bindPopup(html, { maxWidth: 300 });
                  }
                }
              });
              if (!isLayerHidden) vectorLayer.addTo(map);
              var detectedType = geojson.features[0] && geojson.features[0].geometry ? geojson.features[0].geometry.type.toLowerCase() : 'point';
              if (detectedType.indexOf('polygon') !== -1) detectedType = 'polygon';
              else if (detectedType.indexOf('line') !== -1) detectedType = 'line';
              else detectedType = 'point';
              geonodeLayers[geoNodeId] = {
                layer: vectorLayer, name: savedLayer.name, color: fillColor, strokeColor: strokeColor,
                count: geojson.features.length, isGeoNode: true, isVector: true,
                layerName: savedLayer.layerName, bounds: savedLayer.bounds || null, geomType: detectedType,
                sourceId: savedLayer.sourceId || '', sourceName: savedLayer.sourceName || 'GeoNode'
              };
              layerGroups[geoNodeId] = geonodeLayers[geoNodeId];
              createLegend(layerGroups);
            } else {
              // WFS failed — fall back to WMS
              loadAsWMS(savedLayer, geoNodeId, isLayerHidden);
            }
          });
        })(sl, gnId, isHidden);
      } else {
        // Raster or no WMS URL — use WMS directly
        loadAsWMS(sl, gnId, isHidden);
      }
    });

    function loadAsWMS(sl, gnId, isHidden) {
      var layer = L.tileLayer.wms(sl.wmsUrl, {
        layers: sl.layerName, format: 'image/png', transparent: true,
        version: '1.1.1', attribution: 'GeoNode', uppercase: true, maxZoom: 20, zIndex: 500
      });
      layer.on('tileerror', function () {
        if (sl.wmsUrl.indexOf('/geoserver/ows') !== -1) layer.setUrl(sl.wmsUrl.replace('/geoserver/ows', '/geoserver/wms'));
      });
      if (!isHidden) layer.addTo(map);
      geonodeLayers[gnId] = {
        layer: layer, name: sl.name, color: '#54a8dc', count: 0,
        isGeoNode: true, isVector: false, wmsUrl: sl.wmsUrl, layerName: sl.layerName,
        bounds: sl.bounds || null, geomType: sl.geomType || 'vector',
        sourceId: sl.sourceId || '', sourceName: sl.sourceName || 'GeoNode'
      };
      layerGroups[gnId] = geonodeLayers[gnId];
      createLegend(layerGroups);
    }
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

      // Build basemap options from default + user-configured tile sources
      var baseMaps = {
        'Streets': osm,
        'Satellite': satellite
      };

      // Basemap types (radio selection — only one active at a time)
      var basemapTypes = ['xyz', 'google', 'esri', 'osm', 'carto', 'stamen'];
      // Overlay types (checkboxes — can stack on top of basemap)
      var overlayTypes = ['weather'];
      var overlays = {};

      var connections = getGeoNodeSettings();
      connections.forEach(function (conn) {
        if (basemapTypes.indexOf(conn.type) !== -1) {
          baseMaps[conn.name] = L.tileLayer(conn.url, {
            attribution: conn.name || conn.type,
            maxZoom: 20,
            tileSize: 256,
            zoomOffset: 0
          });
        } else if (overlayTypes.indexOf(conn.type) !== -1) {
          overlays[conn.name] = L.tileLayer(conn.url, {
            attribution: conn.name || conn.type,
            maxZoom: 20,
            tileSize: 256,
            opacity: 0.6
          });
        }
      });

      // When basemap changes, maintain current view
      map.on('baselayerchange', function () {
        setTimeout(function () { map.invalidateSize(); }, 100);
      });

      var layerControl = L.control.layers(baseMaps, overlays, { position: 'topleft' });
      layerControl.addTo(map);
      // Store reference for adding overlay layers later
      map._raLayerControl = layerControl;

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

    // Clear existing form layers (preserve GeoNode layers)
    Object.keys(layerGroups).forEach(function (key) {
      if (key.indexOf('gn_') === 0) return; // skip GeoNode layers
      if (layerGroups[key].layer) {
        map.removeLayer(layerGroups[key].layer);
      } else {
        map.removeLayer(layerGroups[key]);
      }
    });
    // Keep only GeoNode layers
    var preserved = {};
    Object.keys(layerGroups).forEach(function (key) {
      if (key.indexOf('gn_') === 0) preserved[key] = layerGroups[key];
    });
    layerGroups = preserved;

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
          // Validate: must be real coords, not 0,0, and within valid range
          if (!isNaN(lat) && !isNaN(lon) && lat !== 0 && lon !== 0 && Math.abs(lat) <= 90 && Math.abs(lon) <= 180) {
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

    // Build ordered layer list — use saved order if available, otherwise forms first then GeoNode
    var savedOrder = getLayerOrder();
    var formKeys = Object.keys(groups).filter(function (k) { return k.indexOf('gn_') !== 0; });
    var gnKeys = Object.keys(groups).filter(function (k) { return k.indexOf('gn_') === 0; });
    var allKeys = formKeys.concat(gnKeys);

    // Sort by saved order if available
    if (savedOrder.length > 0) {
      allKeys.sort(function (a, b) {
        var ia = savedOrder.indexOf(a);
        var ib = savedOrder.indexOf(b);
        if (ia === -1) ia = 9999;
        if (ib === -1) ib = 9999;
        return ia - ib;
      });
    }

    var html = '<h3>Layers</h3>';

    allKeys.forEach(function (uid) {
      var g = groups[uid];
      if (!g) return;
      var visible = map.hasLayer(g.layer);
      var hiddenClass = visible ? '' : ' ra-map__legend-item--hidden';
      var isGN = uid.indexOf('gn_') === 0;

      var icon;
      if (isGN) {
        var gnData = geonodeLayers[uid];
        var geomType = (gnData && gnData.geomType) || 'vector';
        icon = gnGeomIcon(geomType, g.color || '#54a8dc');
      } else {
        var fields = formGeoFieldsMap[uid] || [];
        var geoType = 'geopoint';
        if (fields.length) geoType = fields[0].type;
        icon = geoTypeIcon(geoType, g.color);
      }

      var badge = isGN ? '<span class="ra-map__legend-badge">GeoNode</span>' : '';
      var countSpan = !isGN ? '<span class="ra-map__legend-count">' + g.count + '</span>' : '';

      html += '<div class="ra-map__legend-item' + hiddenClass + '" data-uid="' + uid + '" draggable="true" style="position:relative;cursor:grab;">' +
        '<span class="ra-map__legend-drag" title="Drag to reorder" style="color:#cbd5e1;font-size:12px;cursor:grab;flex-shrink:0;margin-right:2px;">&#9776;</span>' +
        '<input type="checkbox"' + (visible ? ' checked' : '') + ' style="margin:0;cursor:pointer;flex-shrink:0;"> ' +
        '<span class="ra-map__legend-icon">' + icon + '</span>' +
        '<span class="ra-map__legend-name">' + escapeHtml(g.name) + badge + '</span>' +
        countSpan +
        '<button class="ra-map__legend-menu-btn" data-menu-uid="' + uid + '" title="More options">&#8942;</button>' +
        '</div>';
    });

    legend.innerHTML = html;

    // Apply z-index based on layer order (top of legend = highest z-index on map)
    applyLayerZOrder(allKeys, groups);

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
        var gnData = geonodeLayers[uid];
        var gnIsVector = gnData && gnData.isVector;
        var gnGeomType = (gnData && gnData.geomType) || 'point';

        // Color edit option (only for vector GeoNode layers)
        var colorOption = gnIsVector ?
          '<button class="ra-map__ctx-menu-item" data-action="editcolor">' +
            '<svg viewBox="0 0 24 24"><path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-1.01 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>' +
            'Edit Color</button>' : '';

        menu.innerHTML =
          '<button class="ra-map__ctx-menu-item" data-action="zoom">' +
            '<svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>' +
            'Zoom to layer</button>' +
          '<button class="ra-map__ctx-menu-item" data-action="opacity">' +
            '<svg viewBox="0 0 24 24"><path d="M17.66 8L12 2.35 6.34 8A8.02 8.02 0 004 13.64c0 2 .78 4.11 2.34 5.67a7.99 7.99 0 0011.32 0c1.56-1.56 2.34-3.67 2.34-5.67S19.22 9.56 17.66 8zM6 14c.01-2 .62-3.27 1.76-4.4L12 5.27l4.24 4.38C17.38 10.77 17.99 12 18 14H6z"/></svg>' +
            'Change opacity</button>' +
          colorOption +
          '<div class="ra-map__ctx-sep"></div>' +
          '<button class="ra-map__ctx-menu-item" data-action="only">' +
            '<svg viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>' +
            'Show only this</button>' +
          '<button class="ra-map__ctx-menu-item" data-action="showall">' +
            '<svg viewBox="0 0 24 24"><path d="M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z"/></svg>' +
            'Show all layers</button>' +
          '<button class="ra-map__ctx-menu-item" data-action="export">' +
            '<svg viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>' +
            'Export Layer</button>' +
          '<div class="ra-map__ctx-sep"></div>' +
          '<button class="ra-map__ctx-menu-item" data-action="remove" style="color:#e74c3c;">' +
            '<svg viewBox="0 0 24 24" fill="#e74c3c"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>' +
            'Remove layer</button>';

        // Store geo type for the editcolor action
        var layerGeoType = gnGeomType;
      } else {
        // Detect geometry type for this layer
        var layerGeoType = 'point';
        var geoFields = formGeoFieldsMap[uid] || [];
        if (geoFields.length) {
          var ft = geoFields[0].type || '';
          if (ft.indexOf('shape') !== -1 || ft.indexOf('polygon') !== -1) layerGeoType = 'polygon';
          else if (ft.indexOf('trace') !== -1 || ft.indexOf('line') !== -1) layerGeoType = 'line';
        }

        menu.innerHTML =
          '<button class="ra-map__ctx-menu-item" data-action="zoom">' +
            '<svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>' +
            'Zoom to layer</button>' +
          '<button class="ra-map__ctx-menu-item" data-action="opacity">' +
            '<svg viewBox="0 0 24 24"><path d="M17.66 8L12 2.35 6.34 8A8.02 8.02 0 004 13.64c0 2 .78 4.11 2.34 5.67a7.99 7.99 0 0011.32 0c1.56-1.56 2.34-3.67 2.34-5.67S19.22 9.56 17.66 8zM6 14c.01-2 .62-3.27 1.76-4.4L12 5.27l4.24 4.38C17.38 10.77 17.99 12 18 14H6z"/></svg>' +
            'Change opacity</button>' +
          '<button class="ra-map__ctx-menu-item" data-action="editcolor">' +
            '<svg viewBox="0 0 24 24"><path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-1.01 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>' +
            'Edit Color</button>' +
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
        } else if (act === 'editcolor') {
          closeContextMenu();
          showColorEditorModal(uid, layerGeoType, groups);
          return; // don't close again
        } else if (act === 'export') {
          if (isGeoNodeLayer && g.isGeoNode) {
            openGeoNodeExportModal(uid, g);
          } else {
            openExportModal(uid, g.name, g.count);
          }
        } else if (act === 'data') {
          window.location.hash = '#/forms/' + uid + '/data/table';
        } else if (act === 'remove') {
          removeGeoNodeLayer(uid);
        }

        closeContextMenu();
      });
    });

    // Right-click context menu on legend items (same options as three-dot menu)
    legend.addEventListener('contextmenu', function (e) {
      var item = e.target.closest('.ra-map__legend-item');
      if (!item) return;
      e.preventDefault();
      e.stopPropagation();

      var uid = item.getAttribute('data-uid');
      // Simulate clicking the three-dot button for this item
      var menuBtn = item.querySelector('.ra-map__legend-menu-btn');
      if (menuBtn) menuBtn.click();
    });

    // ── Double-click to zoom to layer ──
    legend.addEventListener('dblclick', function (e) {
      var item = e.target.closest('.ra-map__legend-item');
      if (!item) return;
      if (e.target.tagName === 'INPUT' || e.target.closest('.ra-map__legend-menu-btn')) return;
      e.preventDefault();

      var uid = item.getAttribute('data-uid');
      var g = groups[uid];
      if (!g) return;

      // Zoom to layer bounds
      if (g.isGeoNode && geonodeLayers[uid] && geonodeLayers[uid].bounds) {
        var b = geonodeLayers[uid].bounds;
        if (b instanceof window.L.LatLngBounds) {
          map.fitBounds(b, { padding: [50, 50], maxZoom: 16 });
        } else if (Array.isArray(b)) {
          map.fitBounds(b, { padding: [50, 50], maxZoom: 16 });
        }
      } else if (map.hasLayer(g.layer)) {
        try {
          var bounds = g.layer.getBounds();
          if (bounds && bounds.isValid()) map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
        } catch (ex) {}
      }

      // Visual feedback
      legend.querySelectorAll('.ra-map__legend-item').forEach(function (el) { el.style.background = ''; });
      item.style.background = '#e8f4fd';
      setTimeout(function () { item.style.background = ''; }, 1500);
    });

    // ── Drag and drop to reorder layers ──
    var dragSrcUid = null;
    var legendItems = legend.querySelectorAll('.ra-map__legend-item');

    legendItems.forEach(function (item) {
      item.addEventListener('dragstart', function (e) {
        dragSrcUid = this.getAttribute('data-uid');
        this.style.opacity = '0.3';
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', dragSrcUid);
      });
      item.addEventListener('dragend', function () {
        this.style.opacity = '1';
        legendItems.forEach(function (el) {
          el.style.borderTop = '';
          el.style.borderBottom = '';
        });
      });
      item.addEventListener('dragover', function (e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        legendItems.forEach(function (el) { el.style.borderTop = ''; el.style.borderBottom = ''; });
        // Show drop indicator
        var rect = this.getBoundingClientRect();
        var midY = rect.top + rect.height / 2;
        if (e.clientY < midY) {
          this.style.borderTop = '2px solid #54a8dc';
        } else {
          this.style.borderBottom = '2px solid #54a8dc';
        }
      });
      item.addEventListener('dragleave', function () {
        this.style.borderTop = '';
        this.style.borderBottom = '';
      });
      item.addEventListener('drop', function (e) {
        e.preventDefault();
        var dropUid = this.getAttribute('data-uid');
        if (!dragSrcUid || dragSrcUid === dropUid) return;

        // Get current order from DOM
        var items = legend.querySelectorAll('.ra-map__legend-item');
        var order = [];
        items.forEach(function (el) { order.push(el.getAttribute('data-uid')); });

        // Move dragSrcUid to dropUid position
        var fromIdx = order.indexOf(dragSrcUid);
        var toIdx = order.indexOf(dropUid);
        if (fromIdx === -1 || toIdx === -1) return;

        // Determine if dropping above or below
        var rect = this.getBoundingClientRect();
        var midY = rect.top + rect.height / 2;
        if (e.clientY > midY) toIdx++;

        order.splice(fromIdx, 1);
        if (toIdx > fromIdx) toIdx--;
        order.splice(toIdx, 0, dragSrcUid);

        // Save order and rebuild legend
        saveLayerOrder(order);
        createLegend(groups);
        dragSrcUid = null;
      });
    });

    // Close context menu on outside click
    document.addEventListener('mousedown', function (e) {
      if (e.target.closest('.ra-map__ctx-menu') || e.target.closest('.ra-map__legend-menu-btn')) return;
      closeContextMenu();
    });

    page.appendChild(legend);
  }

  // ── Layer z-order (top of legend = drawn on top of map) ──
  function applyLayerZOrder(orderedKeys, groups) {
    // Top of legend list = highest z-index = drawn on top
    var baseZ = 200;
    for (var i = 0; i < orderedKeys.length; i++) {
      var uid = orderedKeys[i];
      var g = groups[uid];
      if (!g || !g.layer) continue;
      var zIndex = baseZ + (orderedKeys.length - i) * 10;

      // Set z-index based on layer type
      if (g.layer.setZIndex) {
        // WMS tile layer
        g.layer.setZIndex(zIndex);
      } else if (g.layer.eachLayer) {
        // FeatureGroup/LayerGroup — bring to front or set z-index on pane
        try {
          if (g.layer.bringToFront) g.layer.bringToFront();
        } catch (ex) {}
      }
    }

    // For vector layers, bring them to front in reverse order (last = top)
    for (var j = orderedKeys.length - 1; j >= 0; j--) {
      var g2 = groups[orderedKeys[j]];
      if (g2 && g2.layer && g2.layer.bringToFront && map.hasLayer(g2.layer)) {
        try { g2.layer.bringToFront(); } catch (ex) {}
      }
    }
  }

  // ── Persistence ──
  var HIDDEN_KEY = 'ra_map_hidden_layers';
  var COLORS_KEY = 'ra_map_layer_colors';
  var ORDER_KEY = 'ra_map_layer_order';

  function getLayerOrder() {
    try { return JSON.parse(localStorage.getItem(ORDER_KEY)) || []; } catch (e) { return []; }
  }
  function saveLayerOrder(order) {
    try { localStorage.setItem(ORDER_KEY, JSON.stringify(order)); } catch (e) {}
  }

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

  // ── GeoNode Layer Export ──
  function openGeoNodeExportModal(uid, g) {
    var old = document.querySelector('.ra-map__export-overlay');
    if (old) old.remove();

    var isVector = g.isVector && g.layer && g.layer.toGeoJSON;
    var featureCount = g.count || 0;

    var overlay = document.createElement('div');
    overlay.className = 'ra-map__export-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:100001;display:flex;align-items:center;justify-content:center;';

    overlay.innerHTML =
      '<div style="background:#fff;border-radius:10px;width:420px;max-width:90vw;box-shadow:0 10px 40px rgba(0,0,0,0.2);">' +
        '<div style="padding:16px 20px;border-bottom:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;">' +
          '<div><div style="font-size:16px;font-weight:600;color:#1e293b;">Export Layer</div>' +
          '<div style="font-size:12px;color:#94a3b8;">' + escapeHtml(g.name) + ' &middot; ' + featureCount + ' features</div></div>' +
          '<button class="ra-gn-export-close" style="background:none;border:none;font-size:20px;cursor:pointer;color:#94a3b8;">&times;</button>' +
        '</div>' +
        '<div style="padding:20px;">' +
          (isVector ?
            '<p style="color:#666;font-size:13px;margin:0 0 16px;">Choose an export format. The data will be downloaded directly from the layer visible on the map.</p>' +
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">' +
              '<button class="ra-gn-export-btn" data-format="geojson" style="padding:14px;border:1px solid #e2e8f0;border-radius:8px;background:#fff;cursor:pointer;text-align:center;">' +
                '<div style="font-size:20px;margin-bottom:4px;">&#127758;</div>' +
                '<div style="font-size:13px;font-weight:600;color:#1e293b;">GeoJSON</div>' +
                '<div style="font-size:11px;color:#94a3b8;">Web mapping standard</div>' +
              '</button>' +
              '<button class="ra-gn-export-btn" data-format="kml" style="padding:14px;border:1px solid #e2e8f0;border-radius:8px;background:#fff;cursor:pointer;text-align:center;">' +
                '<div style="font-size:20px;margin-bottom:4px;">&#127759;</div>' +
                '<div style="font-size:13px;font-weight:600;color:#1e293b;">KML</div>' +
                '<div style="font-size:11px;color:#94a3b8;">Google Earth</div>' +
              '</button>' +
              '<button class="ra-gn-export-btn" data-format="csv" style="padding:14px;border:1px solid #e2e8f0;border-radius:8px;background:#fff;cursor:pointer;text-align:center;">' +
                '<div style="font-size:20px;margin-bottom:4px;">&#128196;</div>' +
                '<div style="font-size:13px;font-weight:600;color:#1e293b;">CSV</div>' +
                '<div style="font-size:11px;color:#94a3b8;">With coordinates</div>' +
              '</button>' +
              '<button class="ra-gn-export-btn" data-format="gpx" style="padding:14px;border:1px solid #e2e8f0;border-radius:8px;background:#fff;cursor:pointer;text-align:center;">' +
                '<div style="font-size:20px;margin-bottom:4px;">&#128204;</div>' +
                '<div style="font-size:13px;font-weight:600;color:#1e293b;">GPX</div>' +
                '<div style="font-size:11px;color:#94a3b8;">GPS devices</div>' +
              '</button>' +
            '</div>'
          :
            '<p style="color:#666;font-size:13px;margin:0 0 16px;">This is a WMS raster layer. You can download it directly from GeoNode.</p>' +
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">' +
              '<button class="ra-gn-export-btn" data-format="wfs-shp" style="padding:14px;border:1px solid #e2e8f0;border-radius:8px;background:#fff;cursor:pointer;text-align:center;">' +
                '<div style="font-size:20px;margin-bottom:4px;">&#128230;</div>' +
                '<div style="font-size:13px;font-weight:600;color:#1e293b;">Shapefile</div>' +
                '<div style="font-size:11px;color:#94a3b8;">Via GeoServer</div>' +
              '</button>' +
              '<button class="ra-gn-export-btn" data-format="wfs-geojson" style="padding:14px;border:1px solid #e2e8f0;border-radius:8px;background:#fff;cursor:pointer;text-align:center;">' +
                '<div style="font-size:20px;margin-bottom:4px;">&#127758;</div>' +
                '<div style="font-size:13px;font-weight:600;color:#1e293b;">GeoJSON</div>' +
                '<div style="font-size:11px;color:#94a3b8;">Via GeoServer</div>' +
              '</button>' +
              '<button class="ra-gn-export-btn" data-format="wfs-csv" style="padding:14px;border:1px solid #e2e8f0;border-radius:8px;background:#fff;cursor:pointer;text-align:center;">' +
                '<div style="font-size:20px;margin-bottom:4px;">&#128196;</div>' +
                '<div style="font-size:13px;font-weight:600;color:#1e293b;">CSV</div>' +
                '<div style="font-size:11px;color:#94a3b8;">Via GeoServer</div>' +
              '</button>' +
              '<button class="ra-gn-export-btn" data-format="wfs-kml" style="padding:14px;border:1px solid #e2e8f0;border-radius:8px;background:#fff;cursor:pointer;text-align:center;">' +
                '<div style="font-size:20px;margin-bottom:4px;">&#127759;</div>' +
                '<div style="font-size:13px;font-weight:600;color:#1e293b;">KML</div>' +
                '<div style="font-size:11px;color:#94a3b8;">Via GeoServer</div>' +
              '</button>' +
            '</div>'
          ) +
          '<div class="ra-gn-export-status" style="margin-top:12px;display:none;"></div>' +
        '</div>' +
      '</div>';

    document.body.appendChild(overlay);

    overlay.querySelector('.ra-gn-export-close').addEventListener('click', function () { overlay.remove(); });
    overlay.addEventListener('click', function (e) { if (e.target === overlay) overlay.remove(); });

    overlay.querySelectorAll('.ra-gn-export-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var format = this.getAttribute('data-format');
        var statusEl = overlay.querySelector('.ra-gn-export-status');
        statusEl.style.display = 'block';
        statusEl.style.cssText = 'margin-top:12px;padding:10px;background:#e8f4fd;color:#2980b9;border-radius:6px;font-size:13px;text-align:center;';
        statusEl.textContent = 'Preparing export...';

        if (isVector && g.layer.toGeoJSON) {
          // Export from local vector data
          var geojson = g.layer.toGeoJSON();
          var filename = (g.name || 'layer').replace(/[^a-zA-Z0-9_-]/g, '_');

          if (format === 'geojson') {
            downloadFile(JSON.stringify(geojson, null, 2), filename + '.geojson', 'application/geo+json');
            statusEl.textContent = 'Downloaded ' + geojson.features.length + ' features as GeoJSON';
          } else if (format === 'kml') {
            downloadFile(geojsonToKML(geojson, g.name), filename + '.kml', 'application/vnd.google-earth.kml+xml');
            statusEl.textContent = 'Downloaded as KML';
          } else if (format === 'csv') {
            downloadFile(geojsonToCSV(geojson), filename + '.csv', 'text/csv');
            statusEl.textContent = 'Downloaded as CSV with coordinates';
          } else if (format === 'gpx') {
            downloadFile(geojsonToGPX(geojson, g.name), filename + '.gpx', 'application/gpx+xml');
            statusEl.textContent = 'Downloaded as GPX';
          }
        } else {
          // WMS/non-vector — download via GeoServer WFS
          var gnData = geonodeLayers[uid];
          var wmsUrl = (gnData && gnData.wmsUrl) || '';
          var layerName = (gnData && gnData.layerName) || '';
          var baseGS = wmsUrl.replace(/\/(ows|wms)(\?.*)?$/, '');

          var dlUrl = '';
          if (format === 'wfs-shp') {
            dlUrl = baseGS + '/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=' + encodeURIComponent(layerName) + '&outputFormat=SHAPE-ZIP';
          } else if (format === 'wfs-geojson') {
            dlUrl = baseGS + '/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=' + encodeURIComponent(layerName) + '&outputFormat=application/json';
          } else if (format === 'wfs-csv') {
            dlUrl = baseGS + '/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=' + encodeURIComponent(layerName) + '&outputFormat=csv';
          } else if (format === 'wfs-kml') {
            dlUrl = baseGS + '/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=' + encodeURIComponent(layerName) + '&outputFormat=application/vnd.google-earth.kml+xml';
          }

          if (dlUrl) {
            window.open(dlUrl, '_blank');
            statusEl.textContent = 'Download started from GeoServer';
          } else {
            statusEl.style.background = '#fde8e8';
            statusEl.style.color = '#e74c3c';
            statusEl.textContent = 'Export format not supported for this layer type';
          }
        }
      });
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

  function geojsonToKML(geojson, name) {
    var placemarks = (geojson.features || []).map(function (f) {
      var geom = f.geometry;
      var props = f.properties || {};
      var pName = Object.values(props)[0] || '';
      var coordStr = '';

      if (geom.type === 'Point') {
        coordStr = '<Point><coordinates>' + geom.coordinates[0] + ',' + geom.coordinates[1] + '</coordinates></Point>';
      } else if (geom.type === 'LineString') {
        coordStr = '<LineString><coordinates>' + geom.coordinates.map(function (c) { return c[0] + ',' + c[1]; }).join(' ') + '</coordinates></LineString>';
      } else if (geom.type === 'Polygon') {
        coordStr = '<Polygon><outerBoundaryIs><LinearRing><coordinates>' + geom.coordinates[0].map(function (c) { return c[0] + ',' + c[1]; }).join(' ') + '</coordinates></LinearRing></outerBoundaryIs></Polygon>';
      } else if (geom.type === 'MultiPolygon') {
        coordStr = geom.coordinates.map(function (poly) {
          return '<Polygon><outerBoundaryIs><LinearRing><coordinates>' + poly[0].map(function (c) { return c[0] + ',' + c[1]; }).join(' ') + '</coordinates></LinearRing></outerBoundaryIs></Polygon>';
        }).join('');
        coordStr = '<MultiGeometry>' + coordStr + '</MultiGeometry>';
      } else if (geom.type === 'MultiLineString') {
        coordStr = geom.coordinates.map(function (line) {
          return '<LineString><coordinates>' + line.map(function (c) { return c[0] + ',' + c[1]; }).join(' ') + '</coordinates></LineString>';
        }).join('');
        coordStr = '<MultiGeometry>' + coordStr + '</MultiGeometry>';
      } else if (geom.type === 'MultiPoint') {
        coordStr = geom.coordinates.map(function (c) {
          return '<Point><coordinates>' + c[0] + ',' + c[1] + '</coordinates></Point>';
        }).join('');
        coordStr = '<MultiGeometry>' + coordStr + '</MultiGeometry>';
      }

      var desc = Object.keys(props).map(function (k) { return k + ': ' + props[k]; }).join('\n');
      return '<Placemark><name>' + escapeHtml(String(pName)) + '</name><description>' + escapeHtml(desc) + '</description>' + coordStr + '</Placemark>';
    }).join('\n');

    return '<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>' + escapeHtml(name || 'Export') + '</name>\n' + placemarks + '\n</Document></kml>';
  }

  function geojsonToCSV(geojson) {
    var features = geojson.features || [];
    if (!features.length) return 'No data';

    // Collect all property keys
    var allKeys = {};
    features.forEach(function (f) {
      Object.keys(f.properties || {}).forEach(function (k) { allKeys[k] = true; });
    });
    var cols = ['latitude', 'longitude', 'geometry_type'].concat(Object.keys(allKeys));
    var lines = [cols.join(',')];

    features.forEach(function (f) {
      var geom = f.geometry;
      var lat = '', lon = '';
      if (geom.type === 'Point') { lat = geom.coordinates[1]; lon = geom.coordinates[0]; }
      else if (geom.coordinates && geom.coordinates[0]) {
        // Use centroid for non-point
        var flat = [];
        function flatten(arr) { if (typeof arr[0] === 'number') flat.push(arr); else arr.forEach(flatten); }
        flatten(geom.coordinates);
        if (flat.length) {
          var sumLat = 0, sumLon = 0;
          flat.forEach(function (c) { sumLon += c[0]; sumLat += c[1]; });
          lat = (sumLat / flat.length).toFixed(6);
          lon = (sumLon / flat.length).toFixed(6);
        }
      }
      var row = [lat, lon, geom.type];
      Object.keys(allKeys).forEach(function (k) {
        var v = (f.properties || {})[k];
        row.push('"' + String(v !== undefined && v !== null ? v : '').replace(/"/g, '""') + '"');
      });
      lines.push(row.join(','));
    });
    return lines.join('\n');
  }

  function geojsonToGPX(geojson, name) {
    var wpts = (geojson.features || []).map(function (f) {
      var geom = f.geometry;
      if (geom.type === 'Point') {
        var pName = Object.values(f.properties || {})[0] || '';
        return '<wpt lat="' + geom.coordinates[1] + '" lon="' + geom.coordinates[0] + '"><name>' + escapeHtml(String(pName)) + '</name></wpt>';
      }
      return '';
    }).filter(function (s) { return s; }).join('\n');

    var trks = (geojson.features || []).map(function (f) {
      var geom = f.geometry;
      if (geom.type === 'LineString') {
        var pts = geom.coordinates.map(function (c) { return '<trkpt lat="' + c[1] + '" lon="' + c[0] + '"/>'; }).join('');
        return '<trk><name>' + escapeHtml(String(Object.values(f.properties || {})[0] || '')) + '</name><trkseg>' + pts + '</trkseg></trk>';
      }
      return '';
    }).filter(function (s) { return s; }).join('\n');

    return '<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="Ramani Yangu">\n' + wpts + '\n' + trks + '\n</gpx>';
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

  function changeLayerColor(uid, newColor, groups, strokeColor) {
    var g = groups[uid];
    if (!g) return;
    g.color = newColor;
    if (strokeColor) g.strokeColor = strokeColor;
    formColorMap[uid] = newColor;
    saveColor(uid, newColor);

    // Update all markers/shapes in the layer
    g.layer.eachLayer(function (layer) {
      if (layer.setStyle) {
        var style = { fillColor: newColor };
        // For polygons: separate stroke color; for points/lines: use fill color
        if (strokeColor) {
          style.color = strokeColor;
        } else if (layer.options && layer.options.weight > 2) {
          style.color = newColor;
        }
        layer.setStyle(style);
      }
    });

    // Rebuild legend to reflect new color
    createLegend(groups);
  }

  function showColorEditorModal(uid, geoType, groups) {
    var g = groups[uid];
    if (!g) return;

    var currentFill = g.color || '#54a8dc';
    var currentStroke = g.strokeColor || g.color || '#54a8dc';

    // Detect actual geo type from first layer feature
    var detectedType = geoType || 'point';
    if (g.layer && g.layer.eachLayer) {
      g.layer.eachLayer(function (layer) {
        if (layer instanceof window.L.Polygon) detectedType = 'polygon';
        else if (layer instanceof window.L.Polyline) detectedType = 'line';
      });
    }

    var isPolygon = detectedType === 'polygon';

    var swatchRow = function (selectedColor, dataAttr) {
      return COLORS.map(function (c) {
        var sel = c === selectedColor ? 'border:2px solid #1e293b;transform:scale(1.2);' : 'border:2px solid transparent;';
        return '<span class="ra-map__color-swatch" data-' + dataAttr + '="' + c + '" style="background:' + c + ';width:24px;height:24px;border-radius:50%;display:inline-block;cursor:pointer;margin:3px;' + sel + '"></span>';
      }).join('');
    };

    var modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:100001;display:flex;align-items:center;justify-content:center;';
    modal.innerHTML =
      '<div style="background:#fff;border-radius:10px;width:380px;max-width:90vw;box-shadow:0 10px 40px rgba(0,0,0,0.2);">' +
        '<div style="padding:16px 20px;border-bottom:1px solid #e2e8f0;font-size:15px;font-weight:600;color:#1e293b;display:flex;justify-content:space-between;align-items:center;">' +
          'Edit Color — ' + escapeHtml(g.name) +
          '<button id="ra-color-close" style="background:none;border:none;font-size:20px;cursor:pointer;color:#94a3b8;">&times;</button>' +
        '</div>' +
        '<div style="padding:20px;">' +
          // Fill color (for all types)
          '<div style="margin-bottom:16px;">' +
            '<label style="display:block;font-size:12px;font-weight:600;color:#64748b;margin-bottom:8px;">' +
              (isPolygon ? 'Fill Color (inside)' : 'Color') +
            '</label>' +
            '<div style="display:flex;flex-wrap:wrap;gap:0;" id="ra-color-fill-row">' + swatchRow(currentFill, 'fillcolor') + '</div>' +
            '<div style="margin-top:8px;display:flex;align-items:center;gap:8px;">' +
              '<label style="font-size:11px;color:#94a3b8;">Custom:</label>' +
              '<input type="color" id="ra-color-fill-custom" value="' + currentFill + '" style="width:36px;height:28px;border:1px solid #ddd;border-radius:4px;cursor:pointer;padding:0;">' +
              '<span id="ra-color-fill-hex" style="font-size:12px;color:#64748b;font-family:monospace;">' + currentFill + '</span>' +
            '</div>' +
          '</div>' +
          // Stroke color (only for polygons)
          (isPolygon ?
            '<div style="margin-bottom:16px;">' +
              '<label style="display:block;font-size:12px;font-weight:600;color:#64748b;margin-bottom:8px;">Stroke Color (outline)</label>' +
              '<div style="display:flex;flex-wrap:wrap;gap:0;" id="ra-color-stroke-row">' + swatchRow(currentStroke, 'strokecolor') + '</div>' +
              '<div style="margin-top:8px;display:flex;align-items:center;gap:8px;">' +
                '<label style="font-size:11px;color:#94a3b8;">Custom:</label>' +
                '<input type="color" id="ra-color-stroke-custom" value="' + currentStroke + '" style="width:36px;height:28px;border:1px solid #ddd;border-radius:4px;cursor:pointer;padding:0;">' +
                '<span id="ra-color-stroke-hex" style="font-size:12px;color:#64748b;font-family:monospace;">' + currentStroke + '</span>' +
              '</div>' +
            '</div>'
          : '') +
          // Preview
          '<div style="margin-bottom:16px;padding:12px;background:#f8fafc;border-radius:6px;border:1px solid #e2e8f0;text-align:center;">' +
            '<div style="font-size:11px;color:#94a3b8;margin-bottom:8px;">Preview</div>' +
            '<div id="ra-color-preview" style="display:inline-block;">' +
              getColorPreview(detectedType, currentFill, currentStroke) +
            '</div>' +
          '</div>' +
          // Buttons
          '<div style="display:flex;gap:10px;">' +
            '<button id="ra-color-apply" style="flex:1;padding:10px;background:#54a8dc;color:#fff;border:none;border-radius:6px;font-size:14px;font-weight:600;cursor:pointer;">Apply</button>' +
            '<button id="ra-color-cancel" style="padding:10px 20px;background:#f1f5f9;color:#475569;border:none;border-radius:6px;font-size:14px;cursor:pointer;">Cancel</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    document.body.appendChild(modal);

    var selectedFill = currentFill;
    var selectedStroke = currentStroke;

    function updatePreview() {
      var prev = document.getElementById('ra-color-preview');
      if (prev) prev.innerHTML = getColorPreview(detectedType, selectedFill, selectedStroke);
      var fillHex = document.getElementById('ra-color-fill-hex');
      if (fillHex) fillHex.textContent = selectedFill;
      var strokeHex = document.getElementById('ra-color-stroke-hex');
      if (strokeHex) strokeHex.textContent = selectedStroke;
    }

    // Fill swatch clicks
    modal.addEventListener('click', function (e) {
      var fc = e.target.getAttribute('data-fillcolor');
      if (fc) {
        selectedFill = fc;
        var customInput = document.getElementById('ra-color-fill-custom');
        if (customInput) customInput.value = fc;
        // Update swatch selection
        var row = document.getElementById('ra-color-fill-row');
        if (row) row.querySelectorAll('.ra-map__color-swatch').forEach(function (s) {
          s.style.border = s.getAttribute('data-fillcolor') === fc ? '2px solid #1e293b' : '2px solid transparent';
          s.style.transform = s.getAttribute('data-fillcolor') === fc ? 'scale(1.2)' : '';
        });
        updatePreview();
      }
      var sc = e.target.getAttribute('data-strokecolor');
      if (sc) {
        selectedStroke = sc;
        var customInput2 = document.getElementById('ra-color-stroke-custom');
        if (customInput2) customInput2.value = sc;
        var row2 = document.getElementById('ra-color-stroke-row');
        if (row2) row2.querySelectorAll('.ra-map__color-swatch').forEach(function (s) {
          s.style.border = s.getAttribute('data-strokecolor') === sc ? '2px solid #1e293b' : '2px solid transparent';
          s.style.transform = s.getAttribute('data-strokecolor') === sc ? 'scale(1.2)' : '';
        });
        updatePreview();
      }
    });

    // Custom color inputs
    var fillInput = document.getElementById('ra-color-fill-custom');
    if (fillInput) fillInput.addEventListener('input', function () { selectedFill = this.value; updatePreview(); });
    var strokeInput = document.getElementById('ra-color-stroke-custom');
    if (strokeInput) strokeInput.addEventListener('input', function () { selectedStroke = this.value; updatePreview(); });

    document.getElementById('ra-color-close').addEventListener('click', function () { modal.remove(); });
    document.getElementById('ra-color-cancel').addEventListener('click', function () { modal.remove(); });
    document.getElementById('ra-color-apply').addEventListener('click', function () {
      changeLayerColor(uid, selectedFill, groups, isPolygon ? selectedStroke : null);
      modal.remove();
    });
  }

  function getColorPreview(geoType, fill, stroke) {
    if (geoType === 'polygon') {
      return '<svg width="80" height="60" viewBox="0 0 80 60">' +
        '<polygon points="10,50 40,5 70,50" fill="' + fill + '" fill-opacity="0.4" stroke="' + stroke + '" stroke-width="3"/>' +
      '</svg>';
    } else if (geoType === 'line') {
      return '<svg width="80" height="40" viewBox="0 0 80 40">' +
        '<polyline points="5,35 25,10 50,30 75,5" fill="none" stroke="' + fill + '" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>' +
      '</svg>';
    } else {
      return '<svg width="40" height="40" viewBox="0 0 40 40">' +
        '<circle cx="20" cy="20" r="12" fill="' + fill + '" stroke="#fff" stroke-width="2"/>' +
      '</svg>';
    }
  }

  function cycleOpacity(uid, groups) {
    var g = groups[uid];
    if (!g) return;

    var isWMS = g.isGeoNode || (g.layer && g.layer.setOpacity && !g.layer.eachLayer);

    if (isWMS || (g.layer && g.layer.setOpacity && typeof g.layer.eachLayer !== 'function')) {
      // WMS layer — use setOpacity directly
      var currentOp = g.layer.options ? (g.layer.options.opacity || 1) : 1;
      var nextOp = currentOp > 0.7 ? 0.5 : (currentOp > 0.3 ? 0.2 : 1);
      g.layer.setOpacity(nextOp);
    } else {
      // Vector layer (LayerGroup/FeatureGroup) — use setStyle
      var current = -1;
      g.layer.eachLayer(function (layer) {
        if (current === -1 && layer.options) current = layer.options.fillOpacity || 0.85;
      });
      var next = current > 0.7 ? 0.5 : (current > 0.3 ? 0.25 : 0.85);
      g.layer.eachLayer(function (layer) {
        if (layer.setStyle) layer.setStyle({ fillOpacity: next, opacity: next + 0.15 });
      });
    }
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

  function gnGeomIcon(geomType, color) {
    color = color || '#54a8dc';
    if (geomType === 'point') {
      return '<svg viewBox="0 0 24 24"><circle cx="12" cy="10" r="6" fill="' + color + '" stroke="#fff" stroke-width="2"/><path d="M12 16l-1 4h2l-1-4z" fill="' + color + '"/></svg>';
    }
    if (geomType === 'line') {
      return '<svg viewBox="0 0 24 24"><path d="M3 17l4-4 4 4 4-4 4 4" fill="none" stroke="' + color + '" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    }
    if (geomType === 'polygon') {
      return '<svg viewBox="0 0 24 24"><polygon points="12,3 21,10 18,20 6,20 3,10" fill="' + color + '" fill-opacity="0.3" stroke="' + color + '" stroke-width="2" stroke-linejoin="round"/></svg>';
    }
    if (geomType === 'raster') {
      return '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" fill="' + color + '" fill-opacity="0.2" stroke="' + color + '" stroke-width="2"/><line x1="3" y1="12" x2="21" y2="12" stroke="' + color + '" stroke-width="1" opacity="0.4"/><line x1="12" y1="3" x2="12" y2="21" stroke="' + color + '" stroke-width="1" opacity="0.4"/></svg>';
    }
    // Default: globe icon for unknown vector type
    return '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" fill="' + color + '"/></svg>';
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

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
    '  position: fixed;',
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
    '  padding: 4px 0;',
    '  cursor: pointer;',
    '}',
    '.ra-map__legend-item:hover { opacity: 0.8; }',
    '.ra-map__legend-dot {',
    '  width: 14px;',
    '  height: 14px;',
    '  border-radius: 50%;',
    '  flex-shrink: 0;',
    '  border: 2px solid #fff;',
    '  box-shadow: 0 0 0 1px rgba(0,0,0,0.2);',
    '}',
    '.ra-map__legend-name {',
    '  flex: 1;',
    '  overflow: hidden;',
    '  text-overflow: ellipsis;',
    '  white-space: nowrap;',
    '  color: #333;',
    '}',
    '.ra-map__legend-count {',
    '  color: #999;',
    '  font-size: 12px;',
    '  flex-shrink: 0;',
    '}',
    '.ra-map__legend-item.ra-map__legend-item--hidden {',
    '  opacity: 0.4;',
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
    ''
  ].join('\n');
  document.head.appendChild(style);

  // ── Load Leaflet ──
  function loadLeaflet(callback) {
    if (leafletLoaded && window.L) { callback(); return; }

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
        leafletLoaded = true;
        // Small delay to ensure L is fully available
        setTimeout(callback, 100);
      };
      document.head.appendChild(script);
    } else {
      // Script tag exists but may still be loading
      var check = setInterval(function () {
        if (window.L) {
          clearInterval(check);
          leafletLoaded = true;
          callback();
        }
      }, 100);
    }
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

  function initMap() {
    if (map) return;

    var L = window.L;
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
    setTimeout(function () { map.invalidateSize(); }, 200);
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

      var promises = forms.map(function (form, idx) {
        var color = COLORS[idx % COLORS.length];
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
      renderGeoData(formDataList);
      if (loading) loading.style.display = 'none';
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
        group.addTo(map);
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

    var html = '<h3>Forms</h3>';
    Object.keys(groups).forEach(function (uid) {
      var g = groups[uid];
      var visible = map.hasLayer(g.layer);
      var hiddenClass = visible ? '' : ' ra-map__legend-item--hidden';
      var geoType = '';
      var fields = formGeoFieldsMap[uid] || [];
      if (fields.length) {
        geoType = fields.map(function (f) {
          if (f.type === 'geopoint') return '<span title="Points">&#9679;</span>';
          if (f.type === 'geotrace') return '<span title="Lines">&#9588;</span>';
          if (f.type === 'geoshape') return '<span title="Polygons">&#9632;</span>';
          return '';
        }).join(' ');
      }

      html += '<div class="ra-map__legend-item' + hiddenClass + '" data-uid="' + uid + '">' +
        '<input type="checkbox"' + (visible ? ' checked' : '') + ' style="margin:0;cursor:pointer;"> ' +
        '<span class="ra-map__legend-dot" style="background:' + g.color + '"></span>' +
        '<span class="ra-map__legend-name">' + escapeHtml(g.name) + ' ' + geoType + '</span>' +
        '<span class="ra-map__legend-count">' + g.count + '</span>' +
        '</div>';
    });
    legend.innerHTML = html;

    // Toggle layer visibility on click
    legend.addEventListener('click', function (e) {
      var item = e.target.closest('.ra-map__legend-item');
      if (!item) return;
      var uid = item.getAttribute('data-uid');
      var g = groups[uid];
      if (!g) return;
      var checkbox = item.querySelector('input[type="checkbox"]');

      if (map.hasLayer(g.layer)) {
        map.removeLayer(g.layer);
        item.classList.add('ra-map__legend-item--hidden');
        if (checkbox) checkbox.checked = false;
      } else {
        g.layer.addTo(map);
        item.classList.remove('ra-map__legend-item--hidden');
        if (checkbox) checkbox.checked = true;
      }
    });

    page.appendChild(legend);
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

      var promises = forms.map(function (form) {
        var color = formColorMap[form.uid];
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

    // Initialize map if needed
    loadLeaflet(function () {
      initMap();
      loadAllGeoData();
      startLivePolling();
    });
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

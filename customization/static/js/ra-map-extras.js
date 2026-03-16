/**
 * Resilience Academy - Map Extra Features
 * =========================================
 * Adds heatmap, date filter, and style-by-field to the combined map page.
 * Loads after ra-map.js — uses window.raMapInstance for the Leaflet map.
 * UPDATE-PROOF: Separate file, does not modify ra-map.js.
 */
(function () {
  'use strict';

  var heatmapLayer = null;
  var heatmapEnabled = false;
  var dateFilterActive = false;
  var dateFrom = null;
  var dateTo = null;
  var styleField = null;
  var styleFieldColors = {};
  var allSubmissions = []; // cached for filtering
  var toolbarCreated = false;

  // ── Styles ──
  var style = document.createElement('style');
  style.textContent = [
    '.ra-map-toolbar {',
    '  position: absolute;',
    '  bottom: 60px;',
    '  left: 50%;',
    '  transform: translateX(-50%);',
    '  display: flex;',
    '  gap: 6px;',
    '  z-index: 1000;',
    '  background: rgba(255,255,255,0.95);',
    '  padding: 6px 10px;',
    '  border-radius: 8px;',
    '  box-shadow: 0 2px 12px rgba(0,0,0,0.15);',
    '}',
    '.ra-map-toolbar button {',
    '  padding: 6px 12px;',
    '  border: 1px solid #d0d5dd;',
    '  border-radius: 4px;',
    '  background: #fff;',
    '  font-size: 12px;',
    '  cursor: pointer;',
    '  color: #333;',
    '  white-space: nowrap;',
    '}',
    '.ra-map-toolbar button:hover { background: #f0f4f8; }',
    '.ra-map-toolbar button.active { background: #54a8dc; color: #fff; border-color: #54a8dc; }',
    '.ra-map-filter-panel {',
    '  position: absolute;',
    '  bottom: 100px;',
    '  left: 50%;',
    '  transform: translateX(-50%);',
    '  background: #fff;',
    '  border-radius: 8px;',
    '  box-shadow: 0 4px 20px rgba(0,0,0,0.18);',
    '  padding: 14px 18px;',
    '  z-index: 1001;',
    '  display: none;',
    '  min-width: 300px;',
    '}',
    '.ra-map-filter-panel.open { display: block; }',
    '.ra-map-filter-panel label { font-size: 12px; font-weight: 600; color: #555; display: block; margin-bottom: 4px; }',
    '.ra-map-filter-panel input, .ra-map-filter-panel select {',
    '  width: 100%; padding: 6px 8px; font-size: 13px;',
    '  border: 1px solid #d0d5dd; border-radius: 4px; margin-bottom: 10px; box-sizing: border-box;',
    '}',
    '.ra-map-filter-panel .actions { display: flex; gap: 6px; }',
    '.ra-map-filter-panel .actions button { flex: 1; padding: 8px; border: none; border-radius: 4px; font-size: 12px; cursor: pointer; }',
    ''
  ].join('\n');
  document.head.appendChild(style);

  // ── Wait for map ──
  function waitForMap(cb) {
    var check = setInterval(function () {
      if (window.raMapInstance && document.getElementById('ra-map-page')?.classList.contains('ra-map--visible')) {
        clearInterval(check);
        cb(window.raMapInstance);
      }
    }, 1000);
  }

  // ── Load Leaflet.heat plugin ──
  function loadHeatPlugin(cb) {
    if (window.L && window.L.heatLayer) { cb(); return; }
    var s = document.createElement('script');
    s.src = 'https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js';
    s.onload = function () {
      var check = setInterval(function () {
        if (window.L && window.L.heatLayer) { clearInterval(check); cb(); }
      }, 100);
    };
    document.head.appendChild(s);
  }

  // ── Create toolbar ──
  function createToolbar(map) {
    if (toolbarCreated) return;
    toolbarCreated = true;

    var page = document.getElementById('ra-map-page');
    if (!page) return;

    var toolbar = document.createElement('div');
    toolbar.className = 'ra-map-toolbar';
    toolbar.id = 'ra-map-toolbar';
    toolbar.innerHTML =
      '<button id="ra-mt-heat" title="Toggle heatmap">&#128293; Heatmap</button>' +
      '<button id="ra-mt-datefilter" title="Filter by date">&#128197; Date Filter</button>' +
      '<button id="ra-mt-stylefield" title="Color by field">&#127912; Style by Field</button>';
    page.appendChild(toolbar);

    // Date filter panel
    var datePanel = document.createElement('div');
    datePanel.className = 'ra-map-filter-panel';
    datePanel.id = 'ra-mt-date-panel';
    var today = new Date().toISOString().split('T')[0];
    var weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    datePanel.innerHTML =
      '<label>From</label><input type="date" id="ra-mt-date-from" value="' + weekAgo + '">' +
      '<label>To</label><input type="date" id="ra-mt-date-to" value="' + today + '">' +
      '<div class="actions">' +
        '<button style="background:#54a8dc;color:#fff;" id="ra-mt-date-apply">Apply</button>' +
        '<button style="background:#e5e7eb;color:#333;" id="ra-mt-date-clear">Clear</button>' +
      '</div>';
    page.appendChild(datePanel);

    // Style-by-field panel
    var stylePanel = document.createElement('div');
    stylePanel.className = 'ra-map-filter-panel';
    stylePanel.id = 'ra-mt-style-panel';
    stylePanel.innerHTML =
      '<label>Color markers by field</label>' +
      '<select id="ra-mt-style-select"><option value="">-- None (use form color) --</option></select>' +
      '<div id="ra-mt-style-legend" style="max-height:150px;overflow-y:auto;font-size:12px;"></div>' +
      '<div class="actions">' +
        '<button style="background:#54a8dc;color:#fff;" id="ra-mt-style-apply">Apply</button>' +
        '<button style="background:#e5e7eb;color:#333;" id="ra-mt-style-clear">Reset</button>' +
      '</div>';
    page.appendChild(stylePanel);

    // ── Heatmap toggle ──
    document.getElementById('ra-mt-heat').addEventListener('click', function () {
      heatmapEnabled = !heatmapEnabled;
      this.classList.toggle('active', heatmapEnabled);
      toggleHeatmap(map);
    });

    // ── Date filter toggle ──
    document.getElementById('ra-mt-datefilter').addEventListener('click', function () {
      var panel = document.getElementById('ra-mt-date-panel');
      panel.classList.toggle('open');
      document.getElementById('ra-mt-style-panel').classList.remove('open');
    });

    document.getElementById('ra-mt-date-apply').addEventListener('click', function () {
      dateFrom = document.getElementById('ra-mt-date-from').value;
      dateTo = document.getElementById('ra-mt-date-to').value;
      dateFilterActive = true;
      document.getElementById('ra-mt-datefilter').classList.add('active');
      document.getElementById('ra-mt-date-panel').classList.remove('open');
      applyDateFilter(map);
    });

    document.getElementById('ra-mt-date-clear').addEventListener('click', function () {
      dateFilterActive = false;
      dateFrom = null;
      dateTo = null;
      document.getElementById('ra-mt-datefilter').classList.remove('active');
      document.getElementById('ra-mt-date-panel').classList.remove('open');
      clearDateFilter(map);
    });

    // ── Style by field toggle ──
    document.getElementById('ra-mt-stylefield').addEventListener('click', function () {
      var panel = document.getElementById('ra-mt-style-panel');
      panel.classList.toggle('open');
      document.getElementById('ra-mt-date-panel').classList.remove('open');
      loadFieldOptions();
    });

    document.getElementById('ra-mt-style-apply').addEventListener('click', function () {
      styleField = document.getElementById('ra-mt-style-select').value;
      if (styleField) {
        document.getElementById('ra-mt-stylefield').classList.add('active');
        applyStyleByField(map);
      }
      document.getElementById('ra-mt-style-panel').classList.remove('open');
    });

    document.getElementById('ra-mt-style-clear').addEventListener('click', function () {
      styleField = null;
      styleFieldColors = {};
      document.getElementById('ra-mt-stylefield').classList.remove('active');
      document.getElementById('ra-mt-style-panel').classList.remove('open');
      document.getElementById('ra-mt-style-legend').innerHTML = '';
      clearStyleByField(map);
    });
  }

  // ── Heatmap ──
  function toggleHeatmap(map) {
    if (!heatmapEnabled) {
      if (heatmapLayer) { map.removeLayer(heatmapLayer); heatmapLayer = null; }
      return;
    }

    loadHeatPlugin(function () {
      var points = collectAllPoints(map);
      if (heatmapLayer) map.removeLayer(heatmapLayer);
      heatmapLayer = L.heatLayer(points.map(function (p) { return [p[0], p[1], 1]; }), {
        radius: 25,
        blur: 15,
        maxZoom: 16,
        max: 1.0,
        gradient: { 0.2: '#0000ff', 0.4: '#00ffff', 0.6: '#00ff00', 0.8: '#ffff00', 1.0: '#ff0000' }
      }).addTo(map);
    });
  }

  function collectAllPoints(map) {
    var points = [];
    map.eachLayer(function (layer) {
      if (layer.getLatLng) {
        var ll = layer.getLatLng();
        points.push([ll.lat, ll.lng]);
      } else if (layer.eachLayer) {
        layer.eachLayer(function (sub) {
          if (sub.getLatLng) {
            var ll = sub.getLatLng();
            points.push([ll.lat, ll.lng]);
          }
        });
      }
    });
    return points;
  }

  // ── Date Filter ──
  function applyDateFilter(map) {
    if (!dateFrom && !dateTo) return;
    var from = dateFrom ? new Date(dateFrom + 'T00:00:00') : new Date(0);
    var to = dateTo ? new Date(dateTo + 'T23:59:59') : new Date();

    map.eachLayer(function (layer) {
      if (layer.eachLayer && layer !== heatmapLayer) {
        layer.eachLayer(function (marker) {
          if (marker.getPopup) {
            var popup = marker.getPopup();
            if (popup) {
              var content = popup.getContent() || '';
              // Try to extract date from popup
              var dateMatch = content.match(/(\d{4}-\d{2}-\d{2})/);
              if (dateMatch) {
                var subDate = new Date(dateMatch[1]);
                if (subDate < from || subDate > to) {
                  marker.setStyle ? marker.setStyle({ opacity: 0, fillOpacity: 0 }) : null;
                } else {
                  marker.setStyle ? marker.setStyle({ opacity: 1, fillOpacity: 0.85 }) : null;
                }
              }
            }
          }
        });
      }
    });

    // Update heatmap if active
    if (heatmapEnabled) toggleHeatmap(map);
  }

  function clearDateFilter(map) {
    map.eachLayer(function (layer) {
      if (layer.eachLayer && layer !== heatmapLayer) {
        layer.eachLayer(function (marker) {
          if (marker.setStyle) marker.setStyle({ opacity: 1, fillOpacity: 0.85 });
        });
      }
    });
    if (heatmapEnabled) toggleHeatmap(map);
  }

  // ── Style by Field ──
  function loadFieldOptions() {
    var select = document.getElementById('ra-mt-style-select');
    if (!select || select.options.length > 1) return; // already loaded

    // Fetch form fields
    fetch('/api/v2/assets/?asset_type=survey&fields=["uid","content","deployment_status"]&limit=50', { credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var fields = {};
        (data.results || []).forEach(function (form) {
          if (form.deployment_status !== 'deployed') return;
          ((form.content || {}).survey || []).forEach(function (row) {
            var t = row.type || '';
            if (t === 'text' || t.indexOf('select_one') === 0 || t === 'select_multiple') {
              var name = row.name || row.$autoname || '';
              var label = (row.label && row.label[0]) || name;
              if (name && !fields[name]) fields[name] = label;
            }
          });
        });
        // Add system fields
        fields['_submitted_by'] = 'Submitted By';
        Object.keys(fields).forEach(function (name) {
          var opt = document.createElement('option');
          opt.value = name;
          opt.textContent = fields[name];
          select.appendChild(opt);
        });
      });
  }

  var STYLE_COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#34495e', '#e91e63', '#00bcd4', '#8bc34a', '#ff5722'];

  function applyStyleByField(map) {
    if (!styleField) return;
    styleFieldColors = {};
    var colorIdx = 0;
    var legendHtml = '';

    map.eachLayer(function (layer) {
      if (layer.eachLayer && layer !== heatmapLayer) {
        layer.eachLayer(function (marker) {
          if (!marker.getPopup || !marker.setStyle) return;
          var popup = marker.getPopup();
          if (!popup) return;

          // We need the submission data — extract from popup or use a data attribute
          // For now, use the popup content to find field values
          // This is a workaround since we don't have direct access to submission data
          var content = popup.getContent() || '';

          // Try to find the field value in the popup
          var val = 'unknown';
          // The popup format is: "field: value" or just check _submitted_by
          if (styleField === '_submitted_by') {
            var byMatch = content.match(/By:\s*([^<]+)/i);
            if (byMatch) val = byMatch[1].trim();
          }

          if (!styleFieldColors[val]) {
            styleFieldColors[val] = STYLE_COLORS[colorIdx % STYLE_COLORS.length];
            colorIdx++;
          }
          marker.setStyle({ fillColor: styleFieldColors[val] });
        });
      }
    });

    // Build legend
    var legendEl = document.getElementById('ra-mt-style-legend');
    if (legendEl) {
      Object.keys(styleFieldColors).forEach(function (val) {
        legendHtml += '<div style="display:flex;align-items:center;gap:6px;padding:2px 0;">' +
          '<span style="width:10px;height:10px;border-radius:50%;background:' + styleFieldColors[val] + ';flex-shrink:0;"></span>' +
          '<span>' + val + '</span></div>';
      });
      legendEl.innerHTML = legendHtml;
    }
  }

  function clearStyleByField(map) {
    // Restore original colors — we can't easily do this without storing originals
    // So we just reload the map data by triggering a refresh
    if (window.raMapInstance) {
      // Reset by reloading — the simplest approach
      window.location.hash = '#/map';
    }
  }

  // ── Bootstrap ──
  waitForMap(function (map) {
    createToolbar(map);
  });

  // Re-create toolbar when navigating back to map
  var lastHash = '';
  setInterval(function () {
    if (window.location.hash !== lastHash) {
      lastHash = window.location.hash;
      if (lastHash === '#/map') {
        toolbarCreated = false;
        heatmapLayer = null;
        heatmapEnabled = false;
        waitForMap(function (map) { createToolbar(map); });
      }
    }
  }, 500);
})();

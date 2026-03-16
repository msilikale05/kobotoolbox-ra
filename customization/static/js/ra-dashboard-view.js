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

  // ── INSTANT SCREEN HIDE ──
  var screenCover = document.createElement('div');
  screenCover.id = 'ra-do-screencover';
  screenCover.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:#f1f5f9;z-index:9999;display:flex;align-items:center;justify-content:center;';
  screenCover.innerHTML = '<div style="text-align:center;"><img src="/custom-static/images/ra-logo-dark.png" alt="" style="height:48px;display:block;margin:0 auto 12px;"><div style="color:#94a3b8;font-size:14px;">Loading...</div></div>';
  document.documentElement.appendChild(screenCover);

  function removeScreenCover() {
    var c = document.getElementById('ra-do-screencover');
    if (c) c.remove();
  }

  // ── Styles ──
  var style = document.createElement('style');
  style.textContent = [
    '#' + PAGE_ID + ' {',
    '  position: fixed; top: 0; left: 0; right: 0; bottom: 0;',
    '  background: #f1f5f9; z-index: 99999; overflow-y: auto;',
    '  display: none;',
    '  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;',
    '}',
    '#' + PAGE_ID + '.ra-do--visible { display: block; }',
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
    '  color: #fff; padding: 16px 30px; display: flex;',
    '  align-items: center; justify-content: space-between;',
    '  position: sticky; top: 0; z-index: 10;',
    '  box-shadow: 0 2px 8px rgba(0,0,0,0.15);',
    '}',
    '.ra-do__header-left { display: flex; align-items: center; gap: 14px; }',
    '.ra-do__header img { height: 32px; width: auto; }',
    '.ra-do__header h1 { font-size: 18px; font-weight: 600; margin: 0; }',
    '.ra-do__header-right { display: flex; align-items: center; gap: 16px; font-size: 13px; }',
    '.ra-do__logout {',
    '  background: rgba(255,255,255,0.2); color: #fff; border: none;',
    '  padding: 7px 16px; border-radius: 5px; font-size: 13px; cursor: pointer;',
    '}',
    '.ra-do__logout:hover { background: rgba(255,255,255,0.3); }',
    '.ra-do__content { max-width: 1200px; margin: 0 auto; padding: 24px 24px 60px; }',

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

    '@media (max-width: 768px) {',
    '  .ra-do__grid { grid-template-columns: 1fr; }',
    '  .ra-do__content { padding: 16px 12px 40px; }',
    '  .ra-do__stat-value { font-size: 22px; }',
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
        } else {
          isDashboardOnly = false;
          activeDashboardId = null;
        }
        return isDashboardOnly;
      });
    }).catch(function () { return false; });
  }

  function loadDashboardConfig() {
    return fetch(CONFIG_URL, { credentials: 'same-origin' })
      .then(function (r) {
        if (!r.ok) throw new Error('not ok');
        return r.json();
      })
      .then(function (c) { dashConfig = c; })
      .catch(function () {
        // Fallback for local dev
        return fetch(CONFIG_URL_FALLBACK)
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
        '<div class="ra-do__header-left">' +
          '<img src="/custom-static/images/ra-logo.png" alt="' + BRAND_NAME + '">' +
          '<h1>' + esc(dashName) + '</h1>' +
        '</div>' +
        '<div class="ra-do__header-right">' +
          '<span>Welcome, <strong>' + esc(currentUser ? currentUser.username : '') + '</strong></span>' +
          '<button class="ra-do__logout" id="ra-do-logout-btn">Logout</button>' +
        '</div>' +
      '</div>' +
      '<div class="ra-do__content">' +
        '<div class="ra-do__grid" id="ra-do-grid"></div>' +
        '<div class="ra-do__refresh" id="ra-do-refresh"></div>' +
      '</div>';

    document.body.appendChild(page);
    page.classList.add('ra-do--visible');
    if (!isPreviewMode) document.body.classList.add('ra-do-active');

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

    grid.innerHTML = widgets.map(function (w) {
      var cls = w.width === 'full' ? ' ra-do__widget--full' : '';
      return '<div class="ra-do__widget' + cls + '" data-wid="' + esc(w.id) + '">' +
        '<div class="ra-do__widget-header">' + esc(w.title || w.type) + '</div>' +
        '<div class="ra-do__widget-body" id="ra-do-wb-' + esc(w.id) + '"></div>' +
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
    var totalForms = formsCache.length;
    var totalSubs = 0;
    formsCache.forEach(function (f) { totalSubs += (f.deployment__submission_count || 0); });

    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var todayCount = subs.filter(function (s) { return new Date(s._submission_time) >= today; }).length;

    var weekAgo = new Date(Date.now() - 7 * 86400000);
    var contributors = {};
    subs.forEach(function (s) {
      if (new Date(s._submission_time) >= weekAgo) contributors[s._submitted_by || 'anon'] = true;
    });

    el.innerHTML = '<div class="ra-do__stats">' +
      stat(totalForms, 'Active Forms') +
      stat(totalSubs, 'Total Submissions') +
      stat(todayCount, 'Today') +
      stat(Object.keys(contributors).length, 'Contributors (7d)') +
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
    var forms = formsCache.slice().sort(function (a, b) { return (b.deployment__submission_count || 0) - (a.deployment__submission_count || 0); });
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
    var items = subs.slice(0, limit);
    if (!items.length) { el.innerHTML = '<p style="color:#94a3b8;">No recent submissions</p>'; return; }
    el.innerHTML = items.map(function (s) {
      var user = s._submitted_by || 'anonymous';
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
      subs.forEach(function (s) { c[s._submitted_by || 'anon'] = true; });
      value = Object.keys(c).length;
    }

    el.innerHTML = '<div style="text-align:center;padding:20px;">' +
      '<div style="font-size:48px;font-weight:700;color:#1e293b;">' + value + '</div>' +
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

    el.innerHTML = '<div style="text-align:center;padding:20px;">' +
      '<div style="font-size:42px;font-weight:700;color:#1e293b;">' + displayVal + '</div>' +
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

    var entries = Object.keys(counts).map(function (k) { return { label: k, count: counts[k] }; });
    entries.sort(function (a, b) { return b.count - a.count; });
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
    if (entries.length > 12) entries = entries.slice(0, 12);

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
        latestBy = subs[i]._submitted_by || 'anonymous';
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
      buckets[key] = { sum: 0, count: 0 };
      labels.push(key);
    }

    subs.forEach(function (s) {
      if (!s._submission_time) return;
      var key = s._submission_time.split('T')[0];
      var v = parseFloat(getFieldValue(s, field));
      if (buckets[key] && !isNaN(v)) {
        buckets[key].sum += v;
        buckets[key].count++;
      }
    });

    var values = labels.map(function (l) {
      var b = buckets[l];
      return b.count ? Math.round(b.sum / b.count * 100) / 100 : null;
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
    el.innerHTML = '<div style="line-height:1.7;font-size:14px;color:#334155;">' + html + '</div>';
    // Make links open in new tab
    el.querySelectorAll('a').forEach(function (a) {
      a.target = '_blank';
      a.rel = 'noopener';
      a.style.color = '#54a8dc';
    });
  }

  // ── Widget: Submissions by Form (KoboToolbox) ──
  function renderSubmissionsByForm(el, w) {
    var html = '';
    var maxCount = 0;
    formsCache.forEach(function (f) { if ((f.deployment__submission_count || 0) > maxCount) maxCount = f.deployment__submission_count; });
    if (!maxCount) maxCount = 1;

    formsCache.forEach(function (f) {
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
    var users = {};
    subs.forEach(function (s) {
      var u = s._submitted_by || 'anonymous';
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
    var days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    var counts = [0, 0, 0, 0, 0, 0, 0];
    subs.forEach(function (s) {
      if (!s._submission_time) return;
      var d = new Date(s._submission_time).getDay();
      counts[d]++;
    });
    var maxC = Math.max.apply(null, counts) || 1;

    el.innerHTML = '<div style="display:flex;align-items:flex-end;gap:8px;height:120px;padding-top:10px;">' +
      days.map(function (day, i) {
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

    var dates = {};
    subs.forEach(function (s) {
      if (!s._submission_time) return;
      var d = s._submission_time.split('T')[0];
      dates[d] = (dates[d] || 0) + 1;
    });
    var dayCount = Object.keys(dates).length || 1;
    var avg = (subs.length / dayCount).toFixed(1);
    var maxDay = Object.keys(dates).reduce(function (a, b) { return dates[a] > dates[b] ? a : b; }, Object.keys(dates)[0]);
    var minDay = Object.keys(dates).reduce(function (a, b) { return dates[a] < dates[b] ? a : b; }, Object.keys(dates)[0]);

    el.innerHTML = '<div style="text-align:center;">' +
      '<div style="font-size:48px;font-weight:700;color:#54a8dc;">' + avg + '</div>' +
      '<div style="font-size:13px;color:#64748b;margin-bottom:16px;">submissions per day</div>' +
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
    detectUser().then(function (isDashOnly) {
      if (!isDashOnly) { removeScreenCover(); return; }
      createPage();
      removeScreenCover();
      loadAndRender();
      startRefresh();
      window.addEventListener('hashchange', enforceAccess);
      setInterval(enforceAccess, 500);
    }).catch(function () { removeScreenCover(); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }
  setTimeout(removeScreenCover, 5000);

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
          bar.innerHTML = '<span>ADMIN PREVIEW \u2014 This is what dashboard users see</span><button id="ra-do-preview-exit" style="background:#000;color:#fff;border:none;padding:8px 18px;border-radius:5px;font-size:13px;font-weight:600;cursor:pointer;">Exit Preview</button>';
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
      window.location.hash = '#/settings';
    }
  };
})();

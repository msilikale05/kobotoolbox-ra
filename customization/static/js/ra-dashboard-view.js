/**
 * Resilience Academy - Dashboard-Only View
 * ==========================================
 * For designated "viewer" users: replaces the full KoboToolbox UI with
 * a read-only summary dashboard showing submission counts, charts, and
 * recent activity across all shared forms.
 *
 * Normal users are completely unaffected — the script exits immediately.
 *
 * Configuration: edit DASHBOARD_USERS below or use the JSON config file.
 * UPDATE-PROOF: Loaded via nginx sub_filter; does not modify core files.
 */
(function () {
  'use strict';

  // ── Configuration ──
  // Usernames that should ONLY see the dashboard (no form builder, data, etc.)
  // Can also be loaded from /custom-static/config/dashboard-users.json
  var DASHBOARD_USERS = [];
  var CONFIG_URL = '/custom-static/config/dashboard-users.json';

  var PAGE_ID = 'ra-dashonly-page';
  var BRAND_NAME = 'Ramani Yangu';
  var REFRESH_INTERVAL = 30000; // 30 seconds

  // ── State ──
  var currentUser = null;
  var isDashboardOnly = false;
  var refreshTimer = null;
  var dashboardData = { forms: [], submissions: [] };

  // ── Skip login/signup pages ──
  if (/\/accounts\/(login|signup|password)/.test(window.location.pathname)) return;

  // ── INSTANT SCREEN HIDE ──
  // Immediately hide the entire page with a white cover while we check
  // if this user is dashboard-only. This prevents any KoboToolbox UI flash.
  // For normal users, this is removed within ~200ms (imperceptible).
  var screenCover = document.createElement('div');
  screenCover.id = 'ra-do-screencover';
  screenCover.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:#f1f5f9;z-index:9999;display:flex;align-items:center;justify-content:center;';
  screenCover.innerHTML = '<div style="text-align:center;"><img src="/custom-static/images/ra-logo-dark.png" alt="" style="height:48px;margin-bottom:12px;display:block;margin:0 auto 12px;"><div style="color:#94a3b8;font-size:14px;">Loading...</div></div>';
  document.documentElement.appendChild(screenCover);

  function removeScreenCover() {
    var cover = document.getElementById('ra-do-screencover');
    if (cover) cover.remove();
  }

  // ── Styles ──
  var style = document.createElement('style');
  style.textContent = [
    '#' + PAGE_ID + ' {',
    '  position: fixed;',
    '  top: 0; left: 0; right: 0; bottom: 0;',
    '  background: #f1f5f9;',
    '  z-index: 99999;',
    '  overflow-y: auto;',
    '  display: none;',
    '  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;',
    '}',
    '#' + PAGE_ID + '.ra-do--visible { display: block; }',

    'body.ra-do-active #kpi-app { display: none !important; }',
    'body.ra-do-active .main-header { display: none !important; }',
    'body.ra-do-active header { display: none !important; }',
    'body.ra-do-active nav { display: none !important; }',
    'body.ra-do-active .k-drawer { display: none !important; }',
    'body.ra-do-active [class*="drawer"] { display: none !important; }',
    'body.ra-do-active .form-view { display: none !important; }',
    'body.ra-do-active #ra-welcome-panel { display: none !important; }',
    'body.ra-do-active #ra-leaderboard-page { display: none !important; }',
    'body.ra-do-active #ra-map-page { display: none !important; }',
    'body.ra-do-active #ra-settings-page { display: none !important; }',

    /* Header bar */
    '.ra-do__header {',
    '  background: linear-gradient(135deg, #1a2a3a 0%, #54a8dc 100%);',
    '  color: #fff;',
    '  padding: 16px 30px;',
    '  display: flex;',
    '  align-items: center;',
    '  justify-content: space-between;',
    '  position: sticky; top: 0; z-index: 10;',
    '  box-shadow: 0 2px 8px rgba(0,0,0,0.15);',
    '}',
    '.ra-do__header-left { display: flex; align-items: center; gap: 14px; }',
    '.ra-do__header img { height: 32px; width: auto; }',
    '.ra-do__header h1 { font-size: 18px; font-weight: 600; margin: 0; }',
    '.ra-do__header-right { display: flex; align-items: center; gap: 16px; font-size: 13px; }',
    '.ra-do__header-right span { opacity: 0.85; }',
    '.ra-do__logout {',
    '  background: rgba(255,255,255,0.2); color: #fff; border: none;',
    '  padding: 7px 16px; border-radius: 5px; font-size: 13px; cursor: pointer;',
    '}',
    '.ra-do__logout:hover { background: rgba(255,255,255,0.3); }',

    /* Content */
    '.ra-do__content {',
    '  max-width: 1200px;',
    '  margin: 0 auto;',
    '  padding: 24px 24px 60px;',
    '}',

    /* Summary cards */
    '.ra-do__cards {',
    '  display: grid;',
    '  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));',
    '  gap: 16px;',
    '  margin-bottom: 24px;',
    '}',
    '.ra-do__card {',
    '  background: #fff;',
    '  border-radius: 8px;',
    '  padding: 20px;',
    '  box-shadow: 0 1px 3px rgba(0,0,0,0.08);',
    '}',
    '.ra-do__card-label {',
    '  font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;',
    '  color: #64748b; margin: 0 0 8px; font-weight: 600;',
    '}',
    '.ra-do__card-value {',
    '  font-size: 32px; font-weight: 700; color: #1e293b; margin: 0;',
    '}',
    '.ra-do__card-sub {',
    '  font-size: 12px; color: #94a3b8; margin: 4px 0 0;',
    '}',

    /* Chart section */
    '.ra-do__section {',
    '  background: #fff;',
    '  border-radius: 8px;',
    '  padding: 20px;',
    '  box-shadow: 0 1px 3px rgba(0,0,0,0.08);',
    '  margin-bottom: 24px;',
    '}',
    '.ra-do__section-title {',
    '  font-size: 15px; font-weight: 600; color: #1e293b;',
    '  margin: 0 0 16px; padding-bottom: 10px; border-bottom: 1px solid #f1f5f9;',
    '}',

    /* Chart */
    '.ra-do__chart { width: 100%; overflow-x: auto; }',
    '.ra-do__chart svg { width: 100%; height: 200px; }',
    '.ra-do__bar { fill: #54a8dc; transition: fill 0.15s; cursor: default; }',
    '.ra-do__bar:hover { fill: #3b8abf; }',
    '.ra-do__chart-label { font-size: 10px; fill: #94a3b8; }',
    '.ra-do__chart-val { font-size: 10px; fill: #475569; text-anchor: middle; }',

    /* Form table */
    '.ra-do__table { width: 100%; border-collapse: collapse; }',
    '.ra-do__table th {',
    '  text-align: left; font-size: 11px; text-transform: uppercase;',
    '  letter-spacing: 0.5px; color: #64748b; padding: 10px 12px;',
    '  border-bottom: 2px solid #e2e8f0; font-weight: 600;',
    '}',
    '.ra-do__table td {',
    '  padding: 12px; border-bottom: 1px solid #f1f5f9;',
    '  font-size: 14px; color: #334155;',
    '}',
    '.ra-do__table tr:hover td { background: #f8fafc; }',
    '.ra-do__form-name { font-weight: 600; color: #1e293b; }',
    '.ra-do__badge {',
    '  display: inline-block; padding: 3px 8px; border-radius: 10px;',
    '  font-size: 11px; font-weight: 600;',
    '}',
    '.ra-do__badge--active { background: #dcfce7; color: #16a34a; }',
    '.ra-do__badge--draft { background: #fef3c7; color: #d97706; }',

    /* Recent feed */
    '.ra-do__feed-item {',
    '  display: flex; gap: 12px; padding: 12px 0;',
    '  border-bottom: 1px solid #f1f5f9;',
    '}',
    '.ra-do__feed-avatar {',
    '  width: 36px; height: 36px; border-radius: 50%;',
    '  background: #e0f2fe; color: #0284c7; display: flex;',
    '  align-items: center; justify-content: center;',
    '  font-size: 14px; font-weight: 700; flex-shrink: 0;',
    '}',
    '.ra-do__feed-info { flex: 1; min-width: 0; }',
    '.ra-do__feed-user { font-weight: 600; color: #1e293b; font-size: 13px; }',
    '.ra-do__feed-form { color: #64748b; font-size: 12px; }',
    '.ra-do__feed-time { color: #94a3b8; font-size: 12px; white-space: nowrap; }',
    '.ra-do__feed-fields { font-size: 12px; color: #475569; margin-top: 4px; }',

    /* Loading */
    '.ra-do__loading {',
    '  text-align: center; padding: 60px 20px; color: #94a3b8; font-size: 14px;',
    '}',

    /* Refresh indicator */
    '.ra-do__refresh {',
    '  font-size: 11px; color: #94a3b8; text-align: right; margin-top: 8px;',
    '}',

    /* Mobile */
    '@media (max-width: 768px) {',
    '  .ra-do__content { padding: 16px 12px 40px; }',
    '  .ra-do__cards { grid-template-columns: repeat(2, 1fr); gap: 10px; }',
    '  .ra-do__card { padding: 14px; }',
    '  .ra-do__card-value { font-size: 24px; }',
    '  .ra-do__header { padding: 12px 16px; }',
    '  .ra-do__header h1 { font-size: 15px; }',
    '  .ra-do__table { font-size: 12px; }',
    '}',
    ''
  ].join('\n');
  document.head.appendChild(style);

  // ── Helpers ──
  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str || ''));
    return div.innerHTML;
  }

  function timeAgo(dateStr) {
    if (!dateStr) return '';
    var diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    if (diff < 604800) return Math.floor(diff / 86400) + 'd ago';
    return new Date(dateStr).toLocaleDateString();
  }

  function fetchJSON(url) {
    return fetch(url, { credentials: 'same-origin' })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); });
  }

  // ── User Detection ──
  function detectUser() {
    return fetchJSON('/me/')
      .then(function (data) {
        currentUser = data;
        return loadDashboardConfig().then(function () {
          isDashboardOnly = DASHBOARD_USERS.indexOf(data.username) !== -1;
          return isDashboardOnly;
        });
      })
      .catch(function () {
        return false;
      });
  }

  function loadDashboardConfig() {
    return fetch(CONFIG_URL)
      .then(function (r) { return r.ok ? r.json() : {}; })
      .then(function (config) {
        if (config.users && Array.isArray(config.users)) {
          DASHBOARD_USERS = config.users;
        }
      })
      .catch(function () {
        // Config file not found — use hardcoded list
      });
  }

  // ── Access Control ──
  function enforceAccess() {
    if (!isDashboardOnly) return;
    var page = document.getElementById(PAGE_ID);
    if (page) page.classList.add('ra-do--visible');
    document.body.classList.add('ra-do-active');
  }

  // ── Dashboard Page ──
  function createDashboardPage() {
    if (document.getElementById(PAGE_ID)) return;

    var page = document.createElement('div');
    page.id = PAGE_ID;
    page.innerHTML =
      '<div class="ra-do__header">' +
        '<div class="ra-do__header-left">' +
          '<img src="/custom-static/images/ra-logo.png" alt="' + BRAND_NAME + '">' +
          '<h1>Data Collection Dashboard</h1>' +
        '</div>' +
        '<div class="ra-do__header-right">' +
          '<span>Welcome, <strong>' + escapeHtml(currentUser ? currentUser.username : '') + '</strong></span>' +
          '<button class="ra-do__logout" id="ra-do-logout-btn">Logout</button>' +
        '</div>' +
      '</div>' +
      '<div class="ra-do__content">' +
        '<div class="ra-do__loading">Loading dashboard data...</div>' +
      '</div>';

    document.body.appendChild(page);
    page.classList.add('ra-do--visible');
    document.body.classList.add('ra-do-active');

    // Logout handler — KoboToolbox requires POST with CSRF token
    document.getElementById('ra-do-logout-btn').addEventListener('click', function () {
      // Get CSRF token from cookie
      var csrfToken = '';
      var cookies = document.cookie.split(';');
      for (var i = 0; i < cookies.length; i++) {
        var c = cookies[i].trim();
        if (c.indexOf('csrftoken=') === 0) {
          csrfToken = c.substring('csrftoken='.length);
          break;
        }
      }

      // Submit a POST form to logout
      var form = document.createElement('form');
      form.method = 'POST';
      form.action = '/accounts/logout/';
      var csrf = document.createElement('input');
      csrf.type = 'hidden';
      csrf.name = 'csrfmiddlewaretoken';
      csrf.value = csrfToken;
      form.appendChild(csrf);
      document.body.appendChild(form);
      form.submit();
    });
  }

  // ── Load Data ──
  function loadDashboardData() {
    fetchJSON('/api/v2/assets/?asset_type=survey&fields=["uid","name","deployment_status","deployment__submission_count","date_modified"]&limit=200')
      .then(function (data) {
        var forms = (data.results || []).filter(function (f) {
          return f.deployment_status === 'deployed';
        });
        dashboardData.forms = forms;

        // Fetch recent submissions from each form (last 20 per form)
        var promises = forms.slice(0, 20).map(function (f) {
          return fetchJSON('/api/v2/assets/' + f.uid + '/data/?limit=20&sort={"_submission_time":-1}')
            .then(function (d) {
              return (d.results || []).map(function (sub) {
                sub._form_name = f.name;
                sub._form_uid = f.uid;
                return sub;
              });
            })
            .catch(function () { return []; });
        });

        return Promise.all(promises).then(function (allSubs) {
          var flat = [];
          allSubs.forEach(function (arr) { flat = flat.concat(arr); });
          flat.sort(function (a, b) {
            return new Date(b._submission_time) - new Date(a._submission_time);
          });
          dashboardData.submissions = flat;
          renderDashboard();
        });
      })
      .catch(function (err) {
        var content = document.querySelector('#' + PAGE_ID + ' .ra-do__content');
        if (content) {
          content.innerHTML = '<div class="ra-do__loading">Failed to load data. Please refresh.</div>';
        }
      });
  }

  // ── Render Dashboard ──
  function renderDashboard() {
    var content = document.querySelector('#' + PAGE_ID + ' .ra-do__content');
    if (!content) return;

    var forms = dashboardData.forms;
    var subs = dashboardData.submissions;

    // Compute metrics
    var totalForms = forms.length;
    var totalSubmissions = 0;
    forms.forEach(function (f) { totalSubmissions += (f.deployment__submission_count || 0); });

    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var submissionsToday = subs.filter(function (s) {
      return new Date(s._submission_time) >= today;
    }).length;

    var weekAgo = new Date(Date.now() - 7 * 86400000);
    var recentContributors = {};
    subs.forEach(function (s) {
      if (new Date(s._submission_time) >= weekAgo) {
        recentContributors[s._submitted_by || 'anonymous'] = true;
      }
    });
    var activeContributors = Object.keys(recentContributors).length;

    content.innerHTML =
      // Summary cards
      '<div class="ra-do__cards">' +
        renderCard('Active Forms', totalForms, 'deployed surveys') +
        renderCard('Total Submissions', totalSubmissions, 'across all forms') +
        renderCard('Today', submissionsToday, 'submissions today') +
        renderCard('Contributors', activeContributors, 'active this week') +
      '</div>' +

      // Chart
      '<div class="ra-do__section">' +
        '<div class="ra-do__section-title">Submissions (Last 30 Days)</div>' +
        '<div class="ra-do__chart" id="ra-do-chart"></div>' +
      '</div>' +

      // Two-column: forms table + recent feed
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">' +
        '<div class="ra-do__section">' +
          '<div class="ra-do__section-title">Forms Overview</div>' +
          renderFormTable(forms) +
        '</div>' +
        '<div class="ra-do__section">' +
          '<div class="ra-do__section-title">Recent Submissions</div>' +
          renderRecentFeed(subs.slice(0, 15)) +
        '</div>' +
      '</div>' +

      '<div class="ra-do__refresh">Auto-refreshes every 30s &middot; Last updated: ' +
        new Date().toLocaleTimeString() +
      '</div>';

    renderChart(subs);
  }

  function renderCard(label, value, sub) {
    return '<div class="ra-do__card">' +
      '<p class="ra-do__card-label">' + label + '</p>' +
      '<p class="ra-do__card-value">' + value + '</p>' +
      '<p class="ra-do__card-sub">' + sub + '</p>' +
    '</div>';
  }

  function renderFormTable(forms) {
    if (!forms.length) return '<p style="color:#94a3b8;">No forms available</p>';

    var sorted = forms.slice().sort(function (a, b) {
      return (b.deployment__submission_count || 0) - (a.deployment__submission_count || 0);
    });

    var rows = sorted.map(function (f) {
      var count = f.deployment__submission_count || 0;
      var badge = f.deployment_status === 'deployed'
        ? '<span class="ra-do__badge ra-do__badge--active">Active</span>'
        : '<span class="ra-do__badge ra-do__badge--draft">Draft</span>';
      return '<tr>' +
        '<td class="ra-do__form-name">' + escapeHtml(f.name) + '</td>' +
        '<td style="text-align:right;font-weight:600;">' + count + '</td>' +
        '<td style="text-align:center;">' + badge + '</td>' +
      '</tr>';
    }).join('');

    return '<table class="ra-do__table">' +
      '<thead><tr><th>Form</th><th style="text-align:right;">Submissions</th><th style="text-align:center;">Status</th></tr></thead>' +
      '<tbody>' + rows + '</tbody></table>';
  }

  function renderRecentFeed(subs) {
    if (!subs.length) return '<p style="color:#94a3b8;">No recent submissions</p>';

    return subs.map(function (sub) {
      var user = sub._submitted_by || 'anonymous';
      var initial = user.charAt(0).toUpperCase();
      var formName = sub._form_name || '';
      var time = timeAgo(sub._submission_time);

      // Get first 2 data fields as preview
      var preview = [];
      var keys = Object.keys(sub);
      for (var i = 0; i < keys.length && preview.length < 2; i++) {
        var k = keys[i];
        if (k.charAt(0) === '_' || k === 'meta' || k === 'formhub') continue;
        if (typeof sub[k] === 'object') continue;
        if (sub[k]) {
          var label = k.replace(/_/g, ' ').replace(/\//g, ' > ');
          preview.push(label + ': ' + String(sub[k]).substring(0, 50));
        }
      }

      return '<div class="ra-do__feed-item">' +
        '<div class="ra-do__feed-avatar">' + initial + '</div>' +
        '<div class="ra-do__feed-info">' +
          '<span class="ra-do__feed-user">' + escapeHtml(user) + '</span> ' +
          '<span class="ra-do__feed-form">' + escapeHtml(formName) + '</span>' +
          (preview.length ? '<div class="ra-do__feed-fields">' + escapeHtml(preview.join(' | ')) + '</div>' : '') +
        '</div>' +
        '<span class="ra-do__feed-time">' + time + '</span>' +
      '</div>';
    }).join('');
  }

  // ── SVG Bar Chart (30 days) ──
  function renderChart(submissions) {
    var container = document.getElementById('ra-do-chart');
    if (!container) return;

    // Group by day for last 30 days
    var days = 30;
    var buckets = {};
    var labels = [];
    for (var i = days - 1; i >= 0; i--) {
      var d = new Date(Date.now() - i * 86400000);
      var key = d.toISOString().split('T')[0];
      buckets[key] = 0;
      labels.push(key);
    }

    submissions.forEach(function (sub) {
      if (!sub._submission_time) return;
      var key = sub._submission_time.split('T')[0];
      if (buckets[key] !== undefined) buckets[key]++;
    });

    var values = labels.map(function (l) { return buckets[l]; });
    var maxVal = Math.max.apply(null, values) || 1;

    // SVG dimensions
    var svgW = 800;
    var svgH = 200;
    var padL = 35;
    var padR = 10;
    var padT = 20;
    var padB = 30;
    var chartW = svgW - padL - padR;
    var chartH = svgH - padT - padB;
    var barW = chartW / days;
    var gap = 2;

    var bars = '';
    var labelsSvg = '';
    for (var j = 0; j < days; j++) {
      var barH = (values[j] / maxVal) * chartH;
      var x = padL + j * barW;
      var y = padT + chartH - barH;

      bars += '<rect class="ra-do__bar" x="' + (x + gap) + '" y="' + y + '" ' +
        'width="' + (barW - gap * 2) + '" height="' + barH + '" rx="2">' +
        '<title>' + labels[j] + ': ' + values[j] + ' submissions</title></rect>';

      // Show value on top if > 0
      if (values[j] > 0) {
        bars += '<text class="ra-do__chart-val" x="' + (x + barW / 2) + '" y="' + (y - 4) + '">' + values[j] + '</text>';
      }

      // Show date label every 5 days
      if (j % 5 === 0 || j === days - 1) {
        var dateLabel = labels[j].substring(5); // MM-DD
        labelsSvg += '<text class="ra-do__chart-label" x="' + (x + barW / 2) + '" y="' + (svgH - 5) + '" text-anchor="middle">' + dateLabel + '</text>';
      }
    }

    // Y-axis labels
    var yLabels = '';
    for (var k = 0; k <= 4; k++) {
      var yVal = Math.round(maxVal * k / 4);
      var yPos = padT + chartH - (chartH * k / 4);
      yLabels += '<text class="ra-do__chart-label" x="' + (padL - 5) + '" y="' + (yPos + 3) + '" text-anchor="end">' + yVal + '</text>';
      yLabels += '<line x1="' + padL + '" y1="' + yPos + '" x2="' + (svgW - padR) + '" y2="' + yPos + '" stroke="#f1f5f9" stroke-width="1"/>';
    }

    container.innerHTML = '<svg viewBox="0 0 ' + svgW + ' ' + svgH + '" preserveAspectRatio="xMidYMid meet">' +
      yLabels + bars + labelsSvg + '</svg>';
  }

  // ── Auto Refresh ──
  function startRefresh() {
    if (refreshTimer) clearInterval(refreshTimer);
    refreshTimer = setInterval(function () {
      loadDashboardData();
    }, REFRESH_INTERVAL);
  }

  // ── Bootstrap ──
  function bootstrap() {
    detectUser().then(function (isDashOnly) {
      if (!isDashOnly) {
        // Normal user — remove the screen cover immediately and do nothing
        removeScreenCover();
        return;
      }

      // Dashboard user — create the dashboard, then remove the cover
      createDashboardPage();
      removeScreenCover(); // Now the dashboard is visible, cover can go
      loadDashboardData();
      startRefresh();

      // Block all navigation for dashboard-only users
      window.addEventListener('hashchange', enforceAccess);
      setInterval(enforceAccess, 500);
    }).catch(function () {
      // If detection fails, remove cover and let normal KoboToolbox load
      removeScreenCover();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }

  // Safety timeout: if detection takes too long (>5s), remove cover anyway
  setTimeout(function () {
    removeScreenCover();
  }, 5000);
})();

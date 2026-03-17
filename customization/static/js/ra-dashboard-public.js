/**
 * Resilience Academy - Public Dashboard Renderer
 * ================================================
 * Standalone renderer for publicly shared dashboards.
 * Reads share token from URL, fetches data from webhook-relay API,
 * renders widgets without requiring KoboToolbox login.
 */
(function () {
  'use strict';

  var REFRESH_INTERVAL = 60000; // 60s for public pages
  var dashboardData = null;

  // ── Detect mode and token ──
  var path = window.location.pathname;
  var match = path.match(/\/dashboard\/(public|embed)\/([a-f0-9]+)/);
  if (!match) {
    document.getElementById('ra-pub-content').innerHTML =
      '<div style="text-align:center;padding:60px 24px;">' +
        '<img src="/custom-static/images/ra-logo-dark.png" alt="Ramani Yangu" style="width:180px;margin:0 auto 24px;display:block;">' +
        '<h2 style="font-size:22px;font-weight:700;color:#1e293b;margin:0 0 8px;">Invalid Dashboard Link</h2>' +
        '<p style="font-size:14px;color:#64748b;margin:0 0 24px;max-width:400px;margin-left:auto;margin-right:auto;line-height:1.5;">This link is not valid or has expired. Please check the URL or contact the person who shared it with you.</p>' +
        '<a href="/" style="display:inline-block;padding:10px 24px;background:#54a8dc;color:#fff;border-radius:6px;text-decoration:none;font-size:14px;font-weight:600;">Go to Home</a>' +
        '<p style="margin-top:20px;font-size:12px;color:#94a3b8;">Need help? <a href="mailto:info@ramaniyangu.com" style="color:#54a8dc;text-decoration:none;">info@ramaniyangu.com</a></p>' +
      '</div>';
    return;
  }
  var mode = match[1]; // 'public' or 'embed'
  var token = match[2];

  if (mode === 'embed') {
    document.body.classList.add('embed');
  }

  // ── Helpers ──
  function esc(s) {
    var d = document.createElement('div');
    d.appendChild(document.createTextNode(s || ''));
    return d.innerHTML;
  }

  function timeAgo(dateStr) {
    if (!dateStr) return '-';
    var diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    return Math.floor(diff / 86400) + 'd ago';
  }

  // ── Fetch dashboard data ──
  function fetchDashboard(cb) {
    fetch('/webhook-api/dashboard-public/' + token)
      .then(function (r) {
        if (!r.ok) throw new Error(r.status === 404 ? 'Dashboard not found or link revoked' : 'Error ' + r.status);
        return r.json();
      })
      .then(function (data) {
        dashboardData = data;
        cb(null, data);
      })
      .catch(function (err) { cb(err); });
  }

  // ── Get submissions for a widget ──
  function getSubsForWidget(w) {
    if (!dashboardData) return [];
    var uids = w.forms || ['__all__'];
    var all = [];
    var subs = dashboardData.submissions || {};

    if (uids[0] === '__all__') {
      Object.keys(subs).forEach(function (uid) {
        var formName = '';
        (dashboardData.forms || []).forEach(function (f) { if (f.uid === uid) formName = f.name; });
        subs[uid].forEach(function (s) { s._form_uid = uid; s._form_name = formName; all.push(s); });
      });
    } else {
      uids.forEach(function (uid) {
        var formName = '';
        (dashboardData.forms || []).forEach(function (f) { if (f.uid === uid) formName = f.name; });
        (subs[uid] || []).forEach(function (s) { s._form_uid = uid; s._form_name = formName; all.push(s); });
      });
    }
    return all;
  }

  function getFieldValue(sub, field) {
    if (sub[field] !== undefined) return sub[field];
    for (var k in sub) { if (k.endsWith('/' + field)) return sub[k]; }
    return undefined;
  }

  // ── Render all widgets ──
  function render(data) {
    var title = document.getElementById('ra-pub-title');
    if (title) title.textContent = data.dashboard.name || 'Dashboard';
    document.title = (data.dashboard.name || 'Dashboard') + ' | Ramani Yangu';

    var content = document.getElementById('ra-pub-content');
    var widgets = data.dashboard.widgets || [];
    if (!widgets.length) {
      content.innerHTML = '<div class="ra-pub-error">This dashboard has no widgets configured.</div>';
      return;
    }

    content.innerHTML = '<div class="ra-pub-grid" id="ra-pub-grid"></div>';
    var grid = document.getElementById('ra-pub-grid');

    grid.innerHTML = widgets.map(function (w) {
      var wm = { 'full': '--full', 'half': '--half', 'three-quarter': '--three-quarter', 'quarter': '--quarter' };
      var cls = wm[w.width] ? ' ra-pub-widget' + wm[w.width] : '';
      return '<div class="ra-pub-widget' + cls + '">' +
        '<div class="ra-pub-widget-header">' + esc(w.title || w.type) + '</div>' +
        '<div class="ra-pub-widget-body" id="ra-pub-w-' + esc(w.id) + '"></div></div>';
    }).join('');

    widgets.forEach(function (w) {
      var el = document.getElementById('ra-pub-w-' + w.id);
      if (!el) return;
      var subs = getSubsForWidget(w);
      try {
        renderWidget(el, w, subs, data);
      } catch (e) {
        el.innerHTML = '<p style="color:#94a3b8;">Widget error: ' + esc(e.message) + '</p>';
      }
    });
  }

  function renderWidget(el, w, subs, data) {
    switch (w.type) {
      case 'stat-cards': renderStatCards(el, subs, data); break;
      case 'chart': renderChart(el, w, subs); break;
      case 'form-table': renderFormTable(el, data); break;
      case 'recent-feed': renderRecentFeed(el, w, subs); break;
      case 'pie-chart': renderPieChart(el, w, subs); break;
      case 'single-stat': renderSingleStat(el, w, subs); break;
      case 'submissions-by-form': renderSubmissionsByForm(el, data); break;
      case 'top-contributors': renderTopContributors(el, w, subs); break;
      case 'submissions-by-day': renderSubmissionsByDay(el, subs); break;
      case 'avg-per-day': renderAvgPerDay(el, subs); break;
      case 'submissions-period': renderSubmissionsPeriod(el, subs); break;
      case 'geo-coverage': renderGeoCoverage(el, w, subs); break;
      case 'form-status': renderFormStatus(el, data); break;
      case 'info-text': renderInfoText(el, w); break;
      default: el.innerHTML = '<p style="color:#94a3b8;">Unsupported widget: ' + esc(w.type) + '</p>';
    }
  }

  // ── Widget Renderers ──

  function renderStatCards(el, subs, data) {
    var forms = data.forms || [];
    var today = new Date().toISOString().split('T')[0];
    var todayCount = subs.filter(function (s) { return s._submission_time && s._submission_time.indexOf(today) === 0; }).length;
    var users = {};
    subs.forEach(function (s) { users[s._submitted_by || 'anon'] = true; });

    el.innerHTML = '<div style="display:flex;gap:12px;flex-wrap:wrap;">' +
      card('Forms', forms.length, '#54a8dc') +
      card('Submissions', subs.length, '#10b981') +
      card('Today', todayCount, '#f59e0b') +
      card('Contributors', Object.keys(users).length, '#8b5cf6') +
      '</div>';
  }
  function card(label, value, color) {
    return '<div style="flex:1;min-width:100px;text-align:center;padding:16px 12px;border-radius:6px;background:' + color + '10;border:1px solid ' + color + '20;">' +
      '<div style="font-size:28px;font-weight:700;color:' + color + ';">' + value + '</div>' +
      '<div style="font-size:12px;color:#64748b;">' + label + '</div></div>';
  }

  function renderChart(el, w, subs) {
    var days = (w.config || {}).days || 30;
    var buckets = {};
    for (var i = days - 1; i >= 0; i--) {
      var d = new Date(Date.now() - i * 86400000);
      buckets[d.toISOString().split('T')[0]] = 0;
    }
    subs.forEach(function (s) {
      if (!s._submission_time) return;
      var key = s._submission_time.split('T')[0];
      if (buckets[key] !== undefined) buckets[key]++;
    });
    var labels = Object.keys(buckets);
    var values = labels.map(function (l) { return buckets[l]; });
    var max = Math.max.apply(null, values) || 1;

    el.innerHTML = '<div style="display:flex;align-items:flex-end;height:120px;gap:2px;">' +
      values.map(function (v) {
        var h = Math.max(Math.round((v / max) * 100), 2);
        return '<div style="flex:1;background:#54a8dc;height:' + h + '%;border-radius:2px 2px 0 0;" title="' + v + '"></div>';
      }).join('') + '</div>';
  }

  function renderFormTable(el, data) {
    var forms = data.forms || [];
    el.innerHTML = '<table style="width:100%;font-size:13px;border-collapse:collapse;">' +
      '<tr style="border-bottom:1px solid #e2e8f0;"><th style="text-align:left;padding:6px 8px;color:#64748b;">Form</th><th style="text-align:right;padding:6px 8px;color:#64748b;">Submissions</th></tr>' +
      forms.map(function (f) {
        return '<tr style="border-bottom:1px solid #f8fafc;"><td style="padding:6px 8px;">' + esc(f.name) + '</td><td style="text-align:right;padding:6px 8px;font-weight:600;color:#54a8dc;">' + (f.deployment__submission_count || 0) + '</td></tr>';
      }).join('') + '</table>';
  }

  function renderRecentFeed(el, w, subs) {
    var limit = (w.config || {}).limit || 10;
    var recent = subs.slice(0, limit);
    el.innerHTML = recent.map(function (s) {
      return '<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f8fafc;font-size:13px;">' +
        '<span>' + esc(s._submitted_by || 'anonymous') + '</span>' +
        '<span style="color:#94a3b8;">' + timeAgo(s._submission_time) + '</span></div>';
    }).join('') || '<p style="color:#94a3b8;">No submissions</p>';
  }

  function renderPieChart(el, w, subs) {
    var field = (w.config || {}).field || '_submitted_by';
    var counts = {};
    subs.forEach(function (s) {
      var v = getFieldValue(s, field) || 'unknown';
      counts[v] = (counts[v] || 0) + 1;
    });
    var items = Object.keys(counts).map(function (k) { return { label: k, count: counts[k] }; })
      .sort(function (a, b) { return b.count - a.count; }).slice(0, 8);
    var total = items.reduce(function (s, i) { return s + i.count; }, 0) || 1;
    var colors = ['#54a8dc', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

    el.innerHTML = items.map(function (item, i) {
      var pct = Math.round((item.count / total) * 100);
      return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">' +
        '<span style="width:10px;height:10px;border-radius:50%;background:' + colors[i % colors.length] + ';flex-shrink:0;"></span>' +
        '<span style="flex:1;font-size:13px;">' + esc(item.label) + '</span>' +
        '<span style="font-size:12px;color:#64748b;">' + pct + '% (' + item.count + ')</span></div>';
    }).join('');
  }

  function renderSingleStat(el, w, subs) {
    var metric = (w.config || {}).metric || 'count';
    var label = (w.config || {}).label || metric;
    var value = 0;
    if (metric === 'count') value = subs.length;
    else if (metric === 'today') {
      var today = new Date().toISOString().split('T')[0];
      value = subs.filter(function (s) { return s._submission_time && s._submission_time.indexOf(today) === 0; }).length;
    } else if (metric === 'contributors') {
      var u = {}; subs.forEach(function (s) { u[s._submitted_by || ''] = true; }); value = Object.keys(u).length;
    }
    el.innerHTML = '<div style="text-align:center;"><div style="font-size:48px;font-weight:700;color:#54a8dc;">' + value + '</div><div style="font-size:13px;color:#64748b;">' + esc(label) + '</div></div>';
  }

  function renderSubmissionsByForm(el, data) {
    var forms = data.forms || [];
    var max = 0;
    forms.forEach(function (f) { if ((f.deployment__submission_count || 0) > max) max = f.deployment__submission_count; });
    if (!max) max = 1;
    el.innerHTML = forms.map(function (f) {
      var c = f.deployment__submission_count || 0;
      var pct = Math.round((c / max) * 100);
      return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">' +
        '<span style="width:150px;font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + esc(f.name) + '</span>' +
        '<div style="flex:1;height:16px;background:#f1f5f9;border-radius:3px;overflow:hidden;">' +
        '<div style="width:' + pct + '%;height:100%;background:#54a8dc;border-radius:3px;"></div></div>' +
        '<span style="font-weight:700;font-size:13px;min-width:30px;text-align:right;">' + c + '</span></div>';
    }).join('') || '<p style="color:#94a3b8;">No forms</p>';
  }

  function renderTopContributors(el, w, subs) {
    var limit = (w.config || {}).limit || 10;
    var users = {};
    subs.forEach(function (s) { var u = s._submitted_by || 'anonymous'; users[u] = (users[u] || 0) + 1; });
    var sorted = Object.keys(users).map(function (u) { return { name: u, count: users[u] }; })
      .sort(function (a, b) { return b.count - a.count; }).slice(0, limit);
    if (!sorted.length) { el.innerHTML = '<p style="color:#94a3b8;">No submissions</p>'; return; }
    var max = sorted[0].count;
    el.innerHTML = sorted.map(function (u, i) {
      var pct = Math.round((u.count / max) * 100);
      return '<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">' +
        '<span style="width:20px;font-size:11px;color:#94a3b8;text-align:center;">' + (i + 1) + '</span>' +
        '<span style="width:100px;font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + esc(u.name) + '</span>' +
        '<div style="flex:1;height:12px;background:#f1f5f9;border-radius:3px;overflow:hidden;">' +
        '<div style="width:' + pct + '%;height:100%;background:#54a8dc;border-radius:3px;"></div></div>' +
        '<span style="font-weight:600;font-size:12px;min-width:25px;text-align:right;">' + u.count + '</span></div>';
    }).join('');
  }

  function renderSubmissionsByDay(el, subs) {
    var days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    var counts = [0, 0, 0, 0, 0, 0, 0];
    subs.forEach(function (s) { if (s._submission_time) counts[new Date(s._submission_time).getDay()]++; });
    var max = Math.max.apply(null, counts) || 1;
    el.innerHTML = '<div style="display:flex;align-items:flex-end;gap:6px;height:100px;">' +
      days.map(function (day, i) {
        var h = Math.max(Math.round((counts[i] / max) * 100), 3);
        return '<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;">' +
          '<span style="font-size:10px;font-weight:600;">' + counts[i] + '</span>' +
          '<div style="width:100%;background:' + (counts[i] === max && counts[i] > 0 ? '#54a8dc' : '#cbd5e1') + ';height:' + h + '%;border-radius:2px 2px 0 0;"></div>' +
          '<span style="font-size:10px;color:#64748b;">' + day + '</span></div>';
      }).join('') + '</div>';
  }

  function renderAvgPerDay(el, subs) {
    if (!subs.length) { el.innerHTML = '<p style="color:#94a3b8;text-align:center;">No data</p>'; return; }
    var dates = {};
    subs.forEach(function (s) { if (s._submission_time) { var d = s._submission_time.split('T')[0]; dates[d] = (dates[d] || 0) + 1; } });
    var avg = (subs.length / (Object.keys(dates).length || 1)).toFixed(1);
    el.innerHTML = '<div style="text-align:center;"><div style="font-size:48px;font-weight:700;color:#54a8dc;">' + avg + '</div><div style="font-size:13px;color:#64748b;">submissions per day</div></div>';
  }

  function renderSubmissionsPeriod(el, subs) {
    var periods = [{ label: '7 days', days: 7 }, { label: '31 days', days: 31 }, { label: '3 months', days: 90 }];
    var active = 0;
    function draw(idx) {
      var p = periods[idx];
      var cutoff = new Date(Date.now() - p.days * 86400000);
      var filtered = subs.filter(function (s) { return s._submission_time && new Date(s._submission_time) >= cutoff; });
      var tabs = periods.map(function (pp, i) {
        return '<button style="padding:5px 10px;border:none;border-radius:3px;font-size:11px;cursor:pointer;' +
          (i === idx ? 'background:#54a8dc;color:#fff;' : 'background:#f1f5f9;color:#64748b;') + '" data-i="' + i + '">' + pp.label + '</button>';
      }).join('');
      el.innerHTML = '<div style="display:flex;gap:6px;margin-bottom:10px;">' + tabs + '</div>' +
        '<div style="display:flex;gap:16px;"><div style="flex:1;text-align:center;padding:12px;background:#f8fafc;border-radius:6px;">' +
        '<div style="font-size:28px;font-weight:700;color:#54a8dc;">' + filtered.length + '</div><div style="font-size:11px;color:#94a3b8;">' + p.label + '</div></div>' +
        '<div style="flex:1;text-align:center;padding:12px;background:#f8fafc;border-radius:6px;">' +
        '<div style="font-size:28px;font-weight:700;color:#54a8dc;">' + subs.length + '</div><div style="font-size:11px;color:#94a3b8;">all time</div></div></div>';
      el.querySelectorAll('[data-i]').forEach(function (b) { b.addEventListener('click', function () { draw(parseInt(this.getAttribute('data-i'))); }); });
    }
    draw(active);
  }

  function renderGeoCoverage(el, w, subs) {
    var points = [];
    subs.forEach(function (s) { var g = s._geolocation; if (g && g[0] && g[1]) points.push([parseFloat(g[0]), parseFloat(g[1])]); });
    if (!points.length) { el.innerHTML = '<p style="color:#94a3b8;text-align:center;">No GPS data</p>'; return; }

    var mapId = 'ra-pub-map-' + w.id;
    el.innerHTML = '<div id="' + mapId + '" style="width:100%;height:280px;border-radius:6px;"></div>' +
      '<div style="font-size:11px;color:#94a3b8;margin-top:4px;text-align:center;">' + points.length + ' locations</div>';

    setTimeout(function () {
      if (!window.L) return;
      var map = L.map(mapId).setView([-6.8, 39.28], 10);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OSM', maxZoom: 18 }).addTo(map);
      var bounds = [];
      points.forEach(function (p) {
        L.circleMarker(p, { radius: 5, fillColor: '#54a8dc', color: '#fff', weight: 1.5, fillOpacity: 0.8 }).addTo(map);
        bounds.push(p);
      });
      if (bounds.length) map.fitBounds(bounds, { padding: [20, 20], maxZoom: 14 });
      setTimeout(function () { map.invalidateSize(); }, 300);
    }, 200);
  }

  function renderFormStatus(el, data) {
    var d = 0, dr = 0;
    (data.forms || []).forEach(function (f) { if (f.deployment_status === 'deployed') d++; else dr++; });
    el.innerHTML = '<div style="display:flex;gap:10px;">' +
      '<div style="flex:1;text-align:center;padding:14px;background:#e8f8f0;border-radius:6px;"><div style="font-size:24px;font-weight:700;color:#27ae60;">' + d + '</div><div style="font-size:11px;color:#27ae60;">Deployed</div></div>' +
      '<div style="flex:1;text-align:center;padding:14px;background:#fef3e2;border-radius:6px;"><div style="font-size:24px;font-weight:700;color:#f39c12;">' + dr + '</div><div style="font-size:11px;color:#f39c12;">Draft</div></div></div>';
  }

  function renderInfoText(el, w) {
    el.innerHTML = '<div style="line-height:1.7;font-size:14px;color:#334155;">' + ((w.config || {}).html || '') + '</div>';
    el.querySelectorAll('a').forEach(function (a) { a.target = '_blank'; a.style.color = '#54a8dc'; });
  }

  // ── Bootstrap ──
  fetchDashboard(function (err, data) {
    if (err) {
      document.getElementById('ra-pub-content').innerHTML =
        '<div style="text-align:center;padding:60px 24px;">' +
          '<img src="/custom-static/images/ra-logo-dark.png" alt="Ramani Yangu" style="width:180px;margin:0 auto 24px;display:block;">' +
          '<h2 style="font-size:22px;font-weight:700;color:#1e293b;margin:0 0 8px;">Dashboard Unavailable</h2>' +
          '<p style="font-size:14px;color:#64748b;margin:0 0 24px;max-width:440px;margin-left:auto;margin-right:auto;line-height:1.5;">' +
            'This dashboard link may have been revoked or the dashboard no longer exists. Please contact the person who shared it with you.' +
          '</p>' +
          '<a href="/" style="display:inline-block;padding:10px 24px;background:#54a8dc;color:#fff;border-radius:6px;text-decoration:none;font-size:14px;font-weight:600;">Go to Home</a>' +
          '<p style="margin-top:20px;font-size:12px;color:#94a3b8;">Need help? <a href="mailto:info@ramaniyangu.com" style="color:#54a8dc;text-decoration:none;">info@ramaniyangu.com</a></p>' +
        '</div>';
      return;
    }
    render(data);

    // Auto-refresh
    setInterval(function () {
      fetchDashboard(function (err2, data2) {
        if (!err2 && data2) render(data2);
      });
    }, REFRESH_INTERVAL);
  });
})();

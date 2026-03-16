/**
 * Resilience Academy - Submission Leaderboard
 * =============================================
 * Adds a Leaderboard nav icon below Projects/Library in the sidebar.
 * Shows a per-form breakdown of contributors and their submission counts.
 * UPDATE-PROOF: Loaded via nginx sub_filter; does not modify core files.
 */
(function () {
  'use strict';

  var NAV_ID = 'ra-leaderboard-nav';
  var PAGE_ID = 'ra-leaderboard-page';
  var HASH = '#/leaderboard';

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
    '#' + NAV_ID + ':hover {',
    '  color: #54a8dc;',
    '}',
    '#' + NAV_ID + '.active {',
    '  color: #54a8dc;',
    '  border-left-color: #54a8dc;',
    '}',
    '#' + NAV_ID + ' svg {',
    '  width: 26px;',
    '  height: 26px;',
    '  fill: currentColor;',
    '}',

    /* Page container */
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
    '  padding: 0;',
    '}',
    '#' + PAGE_ID + '.ra-lb--visible {',
    '  display: block;',
    '}',
    /* Collapse the drawer sidebar when leaderboard is open */
    'body.ra-lb-active .k-drawer {',
    '  width: 58px !important;',
    '}',
    'body.ra-lb-active .k-drawer__sidebar {',
    '  display: none !important;',
    '}',

    /* Header */
    '.ra-lb__header {',
    '  padding: 20px 30px 0;',
    '}',
    '.ra-lb__header h1 {',
    '  margin: 0 0 6px;',
    '  font-size: 22px;',
    '  font-weight: 600;',
    '}',
    '.ra-lb__header p {',
    '  margin: 0;',
    '  font-size: 13px;',
    '  opacity: 0.85;',
    '}',

    /* Controls */
    '.ra-lb__controls {',
    '  padding: 16px 30px;',
    '  display: flex;',
    '  align-items: center;',
    '  gap: 16px;',
    '  flex-wrap: wrap;',
    '}',
    '.ra-lb__select {',
    '  flex: 1;',
    '  min-width: 250px;',
    '  max-width: 500px;',
    '  padding: 10px 14px;',
    '  font-size: 14px;',
    '  border: 1px solid #d0d5dd;',
    '  border-radius: 6px;',
    '  background: #fff;',
    '  color: #333;',
    '  cursor: pointer;',
    '  appearance: none;',
    '  background-image: url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath d=\'M6 8L1 3h10z\' fill=\'%23666\'/%3E%3C/svg%3E");',
    '  background-repeat: no-repeat;',
    '  background-position: right 12px center;',
    '  padding-right: 32px;',
    '}',
    '.ra-lb__select:focus {',
    '  outline: none;',
    '  border-color: #54a8dc;',
    '  box-shadow: 0 0 0 3px rgba(84,168,220,0.15);',
    '}',
    '.ra-lb__stats {',
    '  display: flex;',
    '  gap: 24px;',
    '  font-size: 13px;',
    '  color: #666;',
    '}',
    '.ra-lb__stat-value {',
    '  font-weight: 700;',
    '  color: #29292a;',
    '  font-size: 16px;',
    '  margin-right: 4px;',
    '}',

    /* Table */
    '.ra-lb__table-wrap {',
    '  padding: 0 30px 40px;',
    '}',
    '.ra-lb__table {',
    '  width: 100%;',
    '  border-collapse: collapse;',
    '  border-spacing: 0;',
    '  background: #fff;',
    '  border-radius: 8px;',
    '  overflow: hidden;',
    '  box-shadow: 0 1px 3px rgba(0,0,0,0.08);',
    '}',
    '.ra-lb__table th {',
    '  text-align: left;',
    '  padding: 12px 16px;',
    '  font-size: 12px;',
    '  font-weight: 600;',
    '  text-transform: uppercase;',
    '  letter-spacing: 0.5px;',
    '  color: #666;',
    '  background: transparent;',
    '  border-bottom: 1px solid #eee;',
    '}',
    '.ra-lb__table th:last-child {',
    '  text-align: right;',
    '}',
    '.ra-lb__table td {',
    '  padding: 12px 16px;',
    '  font-size: 14px;',
    '  color: #333;',
    '  border-bottom: 1px solid #f0f0f0;',
    '}',
    '.ra-lb__table td:last-child {',
    '  text-align: right;',
    '  font-weight: 700;',
    '  color: #54a8dc;',
    '  font-size: 16px;',
    '}',
    '.ra-lb__table tr:last-child td {',
    '  border-bottom: none;',
    '}',
    '.ra-lb__table tr:hover td {',
    '  background: #f7f9fb;',
    '}',

    /* Rank badges */
    '.ra-lb__rank {',
    '  display: inline-flex;',
    '  align-items: center;',
    '  justify-content: center;',
    '  width: 28px;',
    '  height: 28px;',
    '  border-radius: 50%;',
    '  font-size: 12px;',
    '  font-weight: 700;',
    '  color: #666;',
    '  background: #f0f0f0;',
    '}',
    '.ra-lb__rank--1 { background: #ffd700; color: #7a6100; }',
    '.ra-lb__rank--2 { background: #c0c0c0; color: #555; }',
    '.ra-lb__rank--3 { background: #cd7f32; color: #29292a; }',

    /* Progress bar */
    '.ra-lb__bar-wrap {',
    '  width: 120px;',
    '  height: 8px;',
    '  background: #e9ecef;',
    '  border-radius: 4px;',
    '  overflow: hidden;',
    '  display: inline-block;',
    '  vertical-align: middle;',
    '  margin-left: 10px;',
    '}',
    '.ra-lb__bar {',
    '  height: 100%;',
    '  background: #54a8dc;',
    '  border-radius: 4px;',
    '  transition: width 0.4s ease;',
    '}',

    /* Loading / empty states */
    '.ra-lb__loading, .ra-lb__empty {',
    '  padding: 60px 40px;',
    '  text-align: center;',
    '  color: #999;',
    '  font-size: 14px;',
    '}',
    '.ra-lb__loading::before {',
    '  content: "";',
    '  display: block;',
    '  width: 32px;',
    '  height: 32px;',
    '  border: 3px solid #e0e0e0;',
    '  border-top-color: #54a8dc;',
    '  border-radius: 50%;',
    '  animation: ra-spin 0.8s linear infinite;',
    '  margin: 0 auto 16px;',
    '}',
    '@keyframes ra-spin {',
    '  to { transform: rotate(360deg); }',
    '}',
    ''
  ].join('\n');
  document.head.appendChild(style);

  // ── API helpers ──
  function fetchJSON(url) {
    return fetch(url, { credentials: 'same-origin' })
      .then(function (r) {
        if (!r.ok) throw new Error(r.status);
        return r.json();
      });
  }

  function fetchDeployedForms() {
    return fetchJSON(
      '/api/v2/assets/?asset_type=survey&fields=["uid","name","deployment_status","deployment__submission_count"]&limit=200'
    ).then(function (data) {
      return (data.results || []).filter(function (a) {
        return a.deployment_status === 'deployed';
      });
    });
  }

  function fetchSubmissions(uid) {
    // Fetch all submissions — no field filter so any field can be used as identifier
    return fetchJSON(
      '/api/v2/assets/' + uid + '/data/?limit=10000&sort={"_submission_time":-1}'
    ).then(function (data) {
      return data.results || [];
    });
  }

  // ── Build leaderboard data ──
  function buildLeaderboard(submissions) {
    // Use the selected field as the contributor identifier
    var fieldSelect = document.getElementById('ra-lb-field-select');
    selectedField = fieldSelect ? fieldSelect.value : '_submitted_by';
    var numeric = isNumericField(selectedField);

    var contributors = {};
    submissions.forEach(function (sub) {
      // Determine the contributor name — always use _submitted_by for grouping
      var user = sub._submitted_by || 'anonymous';

      // If a non-default text field is selected, use that as the name instead
      if (selectedField !== '_submitted_by' && !numeric) {
        var fieldVal = getFieldValue(sub, selectedField);
        user = fieldVal || 'unknown';
      }

      if (!contributors[user]) {
        contributors[user] = {
          username: user,
          count: 0,
          total: 0,
          lastSubmission: null
        };
      }
      contributors[user].count++;

      // If numeric field selected, sum the value
      if (numeric) {
        var numVal = parseFloat(getFieldValue(sub, selectedField));
        if (!isNaN(numVal)) {
          contributors[user].total += numVal;
        }
      }

      var time = sub._submission_time;
      if (time && (!contributors[user].lastSubmission || time > contributors[user].lastSubmission)) {
        contributors[user].lastSubmission = time;
      }
    });

    // Sort by total (for numeric) or count (for text) descending
    var sorted = Object.values(contributors).sort(function (a, b) {
      if (numeric) return b.total - a.total;
      return b.count - a.count;
    });

    // Attach mode for rendering
    sorted._numeric = numeric;
    return sorted;
  }

  function getFieldValue(sub, fieldName) {
    var val = sub[fieldName];
    if (val !== undefined && val !== null) return val;
    // Try nested path
    var keys = Object.keys(sub);
    for (var i = 0; i < keys.length; i++) {
      if (keys[i] === fieldName || keys[i].endsWith('/' + fieldName)) {
        return sub[keys[i]];
      }
    }
    return undefined;
  }

  function timeAgo(dateStr) {
    if (!dateStr) return '-';
    var diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    if (diff < 604800) return Math.floor(diff / 86400) + 'd ago';
    return new Date(dateStr).toLocaleDateString();
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  // ── Page rendering ──
  function createPage() {
    if (document.getElementById(PAGE_ID)) return;

    var page = document.createElement('div');
    page.id = PAGE_ID;
    page.innerHTML = [
      '<div class="ra-lb__header">',
      '  <h1>Submission Leaderboard</h1>',
      '  <p>Track data collection progress across all deployed forms</p>',
      '</div>',
      '<div class="ra-lb__controls">',
      '  <select class="ra-lb__select" id="ra-lb-form-select">',
      '    <option value="">Loading forms...</option>',
      '  </select>',
      '  <select class="ra-lb__select" id="ra-lb-field-select" style="max-width:250px;min-width:180px;">',
      '    <option value="_submitted_by">Submitted by (default)</option>',
      '  </select>',
      '  <div class="ra-lb__stats" id="ra-lb-stats"></div>',
      '</div>',
      '<div class="ra-lb__table-wrap" id="ra-lb-content">',
      '  <div class="ra-lb__loading">Loading leaderboard...</div>',
      '</div>'
    ].join('\n');

    document.body.appendChild(page);

    // Load forms into dropdown
    loadForms();

    // Persist selections in localStorage
    var LB_STORAGE_KEY = 'ra_leaderboard_prefs';
    function saveLbPrefs() {
      var formSelect = document.getElementById('ra-lb-form-select');
      var fieldSelect = document.getElementById('ra-lb-field-select');
      try {
        localStorage.setItem(LB_STORAGE_KEY, JSON.stringify({
          form: formSelect ? formSelect.value : '',
          field: fieldSelect ? fieldSelect.value : '_submitted_by'
        }));
      } catch (e) {}
    }
    function getLbPrefs() {
      try { return JSON.parse(localStorage.getItem(LB_STORAGE_KEY)) || {}; } catch (e) { return {}; }
    }

    // Form change handler
    document.getElementById('ra-lb-form-select').addEventListener('change', function () {
      var uid = this.value;
      if (uid) {
        loadFormFields(uid);
        loadLeaderboard(uid);
        saveLbPrefs();
      } else {
        document.getElementById('ra-lb-content').innerHTML =
          '<div class="ra-lb__empty">Select a form above to view the submission leaderboard.</div>';
        document.getElementById('ra-lb-stats').innerHTML = '';
      }
    });

    // Field selector change handler
    document.getElementById('ra-lb-field-select').addEventListener('change', function () {
      var formSelect = document.getElementById('ra-lb-form-select');
      if (formSelect.value) loadLeaderboard(formSelect.value);
      saveLbPrefs();
    });
  }

  var selectedField = '_submitted_by';
  var fieldTypeMap = {}; // field name -> type (text, integer, decimal, etc.)

  function isNumericField(fieldName) {
    var t = fieldTypeMap[fieldName] || '';
    return t === 'integer' || t === 'decimal' || t === 'calculate' || t === 'range';
  }

  function loadFormFields(uid, callback) {
    var fieldSelect = document.getElementById('ra-lb-field-select');
    if (!fieldSelect) { if (callback) callback(); return; }

    if (uid === '__all__') {
      fieldSelect.innerHTML = '<option value="_submitted_by" data-type="text">Submitted by (default)</option>';
      selectedField = '_submitted_by';
      fieldTypeMap = {};
      if (callback) callback();
      return;
    }

    // Fetch form content to get field names and types
    fetchJSON('/api/v2/assets/' + uid + '/?fields=["content"]')
      .then(function (data) {
        var survey = (data.content || {}).survey || [];
        fieldTypeMap = {};
        var options = '<option value="_submitted_by" data-type="text">Submitted by (default)</option>';
        survey.forEach(function (row) {
          var t = row.type || '';
          var name = row.name || row.$autoname || '';
          var label = (row.label && row.label[0]) || name;

          // Text-like fields (count submissions)
          if (t === 'text' || t.indexOf('select_one') === 0) {
            fieldTypeMap[name] = 'text';
            options += '<option value="' + escapeHtml(name) + '" data-type="text">' +
              escapeHtml(label) + '</option>';
          }
          // Number fields (sum values)
          if (t === 'integer' || t === 'decimal' || t === 'calculate' || t === 'range') {
            fieldTypeMap[name] = t;
            options += '<option value="' + escapeHtml(name) + '" data-type="number">' +
              escapeHtml(label) + ' (sum)</option>';
          }
        });
        fieldSelect.innerHTML = options;
        selectedField = '_submitted_by';
        if (callback) callback();
      })
      .catch(function () {
        fieldSelect.innerHTML = '<option value="_submitted_by" data-type="text">Submitted by (default)</option>';
        if (callback) callback();
      });
  }

  function loadForms() {
    var select = document.getElementById('ra-lb-form-select');
    fetchDeployedForms().then(function (forms) {
      if (!forms.length) {
        select.innerHTML = '<option value="">No deployed forms found</option>';
        document.getElementById('ra-lb-content').innerHTML =
          '<div class="ra-lb__empty">No deployed forms. Deploy a form to see the leaderboard.</div>';
        return;
      }

      var totalSubs = 0;
      forms.forEach(function (f) { totalSubs += (f.deployment__submission_count || 0); });

      var options = '<option value="__all__">All Forms (' + totalSubs + ' total submissions)</option>';
      forms.forEach(function (f) {
        var count = f.deployment__submission_count || 0;
        options += '<option value="' + f.uid + '">' +
          escapeHtml(f.name) + ' (' + count + ' submissions)</option>';
      });
      select.innerHTML = options;

      // Restore saved form selection or default to "All Forms"
      var prefs = getLbPrefs();
      var savedForm = prefs.form || '__all__';
      // Verify the saved form still exists in the options
      if (savedForm !== '__all__' && !select.querySelector('option[value="' + savedForm + '"]')) {
        savedForm = '__all__';
      }
      select.value = savedForm;
      if (savedForm !== '__all__') {
        // Load fields for the saved form, then restore saved field selection
        loadFormFields(savedForm, function () {
          var savedField = prefs.field || '_submitted_by';
          var fieldSelect = document.getElementById('ra-lb-field-select');
          if (fieldSelect && fieldSelect.querySelector('option[value="' + savedField + '"]')) {
            fieldSelect.value = savedField;
            selectedField = savedField;
          }
          loadLeaderboard(savedForm);
        });
      } else {
        loadLeaderboard('__all__');
      }
    }).catch(function () {
      select.innerHTML = '<option value="">Error loading forms</option>';
    });
  }

  var refreshTimer = null;
  var currentFormUid = null;

  function loadLeaderboard(uid) {
    currentFormUid = uid;
    var content = document.getElementById('ra-lb-content');
    var stats = document.getElementById('ra-lb-stats');

    // Show loading only on first load (not refresh)
    if (!content.querySelector('.ra-lb__table')) {
      content.innerHTML = '<div class="ra-lb__loading">Loading submissions...</div>';
    }
    stats.innerHTML = '';

    var fetchPromise;
    if (uid === '__all__') {
      // Aggregate all forms
      fetchPromise = fetchDeployedForms().then(function (forms) {
        var allPromises = forms.map(function (f) {
          return fetchSubmissions(f.uid).catch(function () { return []; });
        });
        return Promise.all(allPromises).then(function (results) {
          var all = [];
          results.forEach(function (subs) { all = all.concat(subs); });
          return all;
        });
      });
    } else {
      fetchPromise = fetchSubmissions(uid);
    }

    fetchPromise.then(function (submissions) {
      var leaders = buildLeaderboard(submissions);
      var numeric = leaders._numeric || false;
      var totalSubmissions = submissions.length;
      var totalContributors = leaders.length;

      // Column header and value label based on mode
      var valueLabel = numeric ? 'Total' : 'Submissions';
      var grandTotal = numeric
        ? leaders.reduce(function (s, l) { return s + l.total; }, 0)
        : totalSubmissions;

      // Stats
      stats.innerHTML = [
        '<div><span class="ra-lb__stat-value">' + totalSubmissions + '</span> submissions</div>',
        '<div><span class="ra-lb__stat-value">' + totalContributors + '</span> contributors</div>',
        numeric ? '<div><span class="ra-lb__stat-value">' + grandTotal.toLocaleString() + '</span> total</div>' : '',
        '<div style="font-size:11px;color:#999;">Updated: ' + new Date().toLocaleTimeString() + '</div>'
      ].join('');

      if (!leaders.length) {
        content.innerHTML = '<div class="ra-lb__empty">No submissions yet. Data will appear here as forms are submitted.</div>';
        return;
      }

      var maxValue = numeric ? (leaders[0].total || 1) : (leaders[0].count || 1);

      var html = [
        '<table class="ra-lb__table">',
        '<thead><tr>',
        '<th style="width:60px">Rank</th>',
        '<th>Contributor</th>',
        numeric ? '<th>Submissions</th>' : '',
        '<th>Last Submission</th>',
        '<th style="width:200px">Progress</th>',
        '<th style="width:120px">' + valueLabel + '</th>',
        '</tr></thead>',
        '<tbody>'
      ];

      leaders.forEach(function (leader, i) {
        var rank = i + 1;
        var rankClass = rank <= 3 ? ' ra-lb__rank--' + rank : '';
        var displayValue = numeric ? leader.total.toLocaleString() : leader.count;
        var pct = Math.round(((numeric ? leader.total : leader.count) / maxValue) * 100);

        html.push('<tr>');
        html.push('<td><span class="ra-lb__rank' + rankClass + '">' + rank + '</span></td>');
        html.push('<td>' + escapeHtml(leader.username) + '</td>');
        if (numeric) html.push('<td>' + leader.count + '</td>');
        html.push('<td>' + timeAgo(leader.lastSubmission) + '</td>');
        html.push('<td><div class="ra-lb__bar-wrap"><div class="ra-lb__bar" style="width:' + pct + '%"></div></div></td>');
        html.push('<td>' + displayValue + '</td>');
        html.push('</tr>');
      });

      html.push('</tbody></table>');
      content.innerHTML = html.join('');
    }).catch(function (err) {
      content.innerHTML = '<div class="ra-lb__empty">Error loading submissions. ' + escapeHtml(String(err)) + '</div>';
    });

    // Auto-refresh every 30 seconds
    clearInterval(refreshTimer);
    refreshTimer = setInterval(function () {
      if (isLeaderboardPage() && currentFormUid) {
        loadLeaderboard(currentFormUid);
      } else {
        clearInterval(refreshTimer);
      }
    }, 30000);
  }

  // ── Navigation ──
  function isLeaderboardPage() {
    return window.location.hash === HASH;
  }

  var BRAND_NAME = 'Ramani Yangu';

  function showPage() {
    var page = document.getElementById(PAGE_ID);
    if (page) page.classList.add('ra-lb--visible');
    document.body.classList.add('ra-lb-active');
    document.title = 'Leaderboard | ' + BRAND_NAME;
    var nav = document.getElementById(NAV_ID);
    if (nav) nav.classList.add('active');

    // Deactivate other nav links
    document.querySelectorAll('.k-drawer__link, [class*="drawer__link"]').forEach(function (link) {
      if (link.id !== NAV_ID) link.classList.remove('active');
    });

    // Hide the sidebar content panel and main content
    var sidebar = document.querySelector('aside, [class*="drawer__sidebar"]');
    if (sidebar) sidebar.style.display = 'none';
    var mainContent = document.querySelector('[class*="drawer"] ~ div, .main__content');
    if (mainContent) mainContent.style.display = 'none';
  }

  function hidePage() {
    var page = document.getElementById(PAGE_ID);
    if (page) page.classList.remove('ra-lb--visible');
    document.body.classList.remove('ra-lb-active');
    var nav = document.getElementById(NAV_ID);
    if (nav) nav.classList.remove('active');

    // Restore sidebar and main content
    var sidebar = document.querySelector('aside, [class*="drawer__sidebar"]');
    if (sidebar) sidebar.style.display = '';
    var mainContent = document.querySelector('[class*="drawer"] ~ div, .main__content');
    if (mainContent) mainContent.style.display = '';
  }

  function handleNavigation() {
    if (isLeaderboardPage()) {
      createPage();
      showPage();
    } else {
      hidePage();
    }
  }

  // ── Nav icon injection ──
  function injectNavIcon() {
    if (document.getElementById(NAV_ID)) return true;

    // Skip on login/signup pages
    if (/\/accounts\/(login|signup|password)/.test(window.location.pathname)) return false;

    // Find the primary nav icons container
    var primaryNav = document.querySelector('nav');
    if (!primaryNav) return false;

    // Verify it has the Projects/Library links
    var links = primaryNav.querySelectorAll('a');
    var hasProjects = false;
    links.forEach(function (l) {
      if (l.getAttribute('href') && l.getAttribute('href').indexOf('projects') !== -1) hasProjects = true;
    });
    if (!hasProjects) return false;

    // Create the leaderboard nav icon
    var navLink = document.createElement('a');
    navLink.id = NAV_ID;
    navLink.href = HASH;
    navLink.setAttribute('data-tip', 'Leaderboard');
    navLink.title = 'Submission Leaderboard';
    navLink.innerHTML = [
      '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">',
      '<path d="M4 14h4v7H4v-7zm6-5h4v12h-4V9zm6-4h4v16h-4V5z"/>',
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

  // Listen for hash changes and clicks on other nav links
  window.addEventListener('hashchange', handleNavigation);

  // Also intercept clicks on the other nav links (Projects, Library)
  document.addEventListener('click', function (e) {
    var link = e.target.closest('.k-drawer__link, [class*="drawer__link"]');
    if (link && link.id !== NAV_ID) {
      // Clicked a different nav link — hide leaderboard
      setTimeout(hidePage, 100);
    }
  }, true);

  // Poll for hash changes that hashchange event misses (React Router)
  var lastHash = window.location.hash;
  setInterval(function () {
    if (window.location.hash !== lastHash) {
      lastHash = window.location.hash;
      handleNavigation();
    }
  }, 300);
})();

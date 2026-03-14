/**
 * Resilience Academy - Submission Counter Badge
 * ==============================================
 * Injects a live submission counter badge into the KPI header nav,
 * next to "Projects". Shows today's submission count across all forms.
 * Click to see per-form breakdown.
 * UPDATE-PROOF: Loaded via nginx sub_filter; does not modify core files.
 */
(function () {
  'use strict';

  var BADGE_ID = 'ra-submission-badge';
  var DROPDOWN_ID = 'ra-submission-dropdown';
  var POLL_INTERVAL = 60000; // refresh every 60 seconds
  var CACHE_KEY = 'ra_sub_badge_cache';
  var pollTimer = null;

  // ── Styles ──
  var style = document.createElement('style');
  style.textContent = [
    '#' + BADGE_ID + ' {',
    '  position: relative;',
    '  display: inline-flex;',
    '  align-items: center;',
    '  margin-right: 16px;',
    '  cursor: pointer;',
    '  user-select: none;',
    '  vertical-align: middle;',
    '}',
    '#' + BADGE_ID + ' .ra-badge__bell {',
    '  font-size: 18px;',
    '  line-height: 1;',
    '  color: rgba(255,255,255,0.75);',
    '  transition: color 0.2s;',
    '}',
    '#' + BADGE_ID + ':hover .ra-badge__bell {',
    '  color: #fff;',
    '}',
    '#' + BADGE_ID + ' .ra-badge__count {',
    '  position: absolute;',
    '  top: -6px;',
    '  right: -10px;',
    '  min-width: 18px;',
    '  height: 18px;',
    '  padding: 0 5px;',
    '  border-radius: 9px;',
    '  background: #e74c3c;',
    '  color: #fff;',
    '  font-size: 11px;',
    '  font-weight: 700;',
    '  line-height: 18px;',
    '  text-align: center;',
    '  box-shadow: 0 1px 3px rgba(0,0,0,0.3);',
    '  transition: transform 0.2s;',
    '}',
    '#' + BADGE_ID + ' .ra-badge__count--zero {',
    '  background: #6c757d;',
    '}',
    '#' + BADGE_ID + ' .ra-badge__count--pulse {',
    '  animation: ra-pulse 0.4s ease-out;',
    '}',
    '@keyframes ra-pulse {',
    '  0% { transform: scale(1); }',
    '  50% { transform: scale(1.3); }',
    '  100% { transform: scale(1); }',
    '}',
    '',
    '#' + DROPDOWN_ID + ' {',
    '  position: absolute;',
    '  top: calc(100% + 8px);',
    '  right: 0;',
    '  width: 320px;',
    '  max-height: 400px;',
    '  overflow-y: auto;',
    '  background: #fff;',
    '  border-radius: 8px;',
    '  box-shadow: 0 8px 24px rgba(0,0,0,0.18);',
    '  z-index: 9999;',
    '  display: none;',
    '  color: #333;',
    '}',
    '#' + DROPDOWN_ID + '.ra-dropdown--open {',
    '  display: block;',
    '}',
    '#' + DROPDOWN_ID + ' .ra-dropdown__header {',
    '  padding: 14px 16px 10px;',
    '  font-size: 13px;',
    '  font-weight: 700;',
    '  color: #1a2a3a;',
    '  border-bottom: 1px solid #eee;',
    '  display: flex;',
    '  justify-content: space-between;',
    '  align-items: center;',
    '}',
    '#' + DROPDOWN_ID + ' .ra-dropdown__header span {',
    '  font-size: 11px;',
    '  font-weight: 400;',
    '  color: #999;',
    '}',
    '#' + DROPDOWN_ID + ' .ra-dropdown__item {',
    '  display: flex;',
    '  justify-content: space-between;',
    '  align-items: center;',
    '  padding: 10px 16px;',
    '  border-bottom: 1px solid #f5f5f5;',
    '  text-decoration: none;',
    '  color: #333;',
    '  transition: background 0.15s;',
    '}',
    '#' + DROPDOWN_ID + ' .ra-dropdown__item:hover {',
    '  background: #f7f9fb;',
    '  text-decoration: none;',
    '}',
    '#' + DROPDOWN_ID + ' .ra-dropdown__item-name {',
    '  font-size: 13px;',
    '  font-weight: 500;',
    '  max-width: 220px;',
    '  overflow: hidden;',
    '  text-overflow: ellipsis;',
    '  white-space: nowrap;',
    '}',
    '#' + DROPDOWN_ID + ' .ra-dropdown__item-count {',
    '  font-size: 13px;',
    '  font-weight: 700;',
    '  color: #54a8dc;',
    '  min-width: 30px;',
    '  text-align: right;',
    '}',
    '#' + DROPDOWN_ID + ' .ra-dropdown__item-count--zero {',
    '  color: #ccc;',
    '  font-weight: 400;',
    '}',
    '#' + DROPDOWN_ID + ' .ra-dropdown__empty {',
    '  padding: 24px 16px;',
    '  text-align: center;',
    '  color: #999;',
    '  font-size: 13px;',
    '}',
    '#' + DROPDOWN_ID + ' .ra-dropdown__total {',
    '  padding: 12px 16px;',
    '  font-size: 12px;',
    '  color: #666;',
    '  background: #f7f9fb;',
    '  border-radius: 0 0 8px 8px;',
    '  display: flex;',
    '  justify-content: space-between;',
    '}',
    '#' + DROPDOWN_ID + ' .ra-dropdown__total strong {',
    '  color: #1a2a3a;',
    '}',
    '#' + DROPDOWN_ID + ' .ra-dropdown__loading {',
    '  padding: 24px 16px;',
    '  text-align: center;',
    '  color: #999;',
    '  font-size: 13px;',
    '}'
  ].join('\n');
  document.head.appendChild(style);

  // ── Helpers ──
  function todayISO() {
    var d = new Date();
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }

  function timeAgo(dateStr) {
    var diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    return Math.floor(diff / 86400) + 'd ago';
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
      '/api/v2/assets/?asset_type=survey&fields=["uid","name","deployment_status","deployment__submission_count"]&limit=200'
    ).then(function (data) {
      return (data.results || []).filter(function (a) {
        return a.deployment_status === 'deployed';
      });
    });
  }

  function fetchTodayCount(uid) {
    var today = todayISO();
    var query = encodeURIComponent(JSON.stringify({
      _submission_time: { $gte: today + 'T00:00:00' }
    }));
    return fetchJSON(
      '/api/v2/assets/' + uid + '/data/?query=' + query + '&limit=1'
    ).then(function (data) {
      return data.count || 0;
    }).catch(function () {
      return 0;
    });
  }

  function fetchAllData() {
    return fetchDeployedForms().then(function (forms) {
      if (!forms.length) return { forms: [], todayTotal: 0, allTotal: 0 };

      var promises = forms.map(function (f) {
        return fetchTodayCount(f.uid).then(function (count) {
          return {
            uid: f.uid,
            name: f.name,
            todayCount: count,
            totalCount: f.deployment__submission_count || 0
          };
        });
      });

      return Promise.all(promises).then(function (results) {
        // Sort: most today submissions first, then by name
        results.sort(function (a, b) {
          if (b.todayCount !== a.todayCount) return b.todayCount - a.todayCount;
          return a.name.localeCompare(b.name);
        });

        var todayTotal = results.reduce(function (sum, r) { return sum + r.todayCount; }, 0);
        var allTotal = results.reduce(function (sum, r) { return sum + r.totalCount; }, 0);

        return { forms: results, todayTotal: todayTotal, allTotal: allTotal };
      });
    });
  }

  // ── Badge DOM ──
  var lastCount = -1;

  function createBadge() {
    if (document.getElementById(BADGE_ID)) return true;

    // Target the header row's account section area (right side of top bar)
    // KPI layout: .mdl-layout__header-row > ... > .accountSection (with badgeWrapper)
    var accountSection = document.querySelector('[class*="accountSection"]')
      || document.querySelector('[class*="badgeWrapper"]');

    // Fallback: find the header row itself
    var headerRow = document.querySelector('.mdl-layout__header-row');

    if (!accountSection && !headerRow) return false;

    // Insert before the account section, or append to header row
    var navLinks = accountSection ? accountSection.parentElement : headerRow;

    var badge = document.createElement('div');
    badge.id = BADGE_ID;
    badge.title = "Today's submissions";
    badge.innerHTML = [
      '<span class="ra-badge__bell">&#9993;</span>',
      '<span class="ra-badge__count ra-badge__count--zero">-</span>',
      '<div id="' + DROPDOWN_ID + '">',
      '  <div class="ra-dropdown__loading">Loading submissions...</div>',
      '</div>'
    ].join('');

    // Place before account section so it sits left of the avatar
    if (accountSection) {
      navLinks.insertBefore(badge, accountSection);
    } else {
      navLinks.appendChild(badge);
    }

    // Toggle dropdown on click
    badge.addEventListener('click', function (e) {
      e.stopPropagation();
      var dd = document.getElementById(DROPDOWN_ID);
      var isOpen = dd.classList.contains('ra-dropdown--open');
      dd.classList.toggle('ra-dropdown--open');
      if (!isOpen) refreshDropdown();
    });

    // Close dropdown on outside click
    document.addEventListener('click', function () {
      var dd = document.getElementById(DROPDOWN_ID);
      if (dd) dd.classList.remove('ra-dropdown--open');
    });

    return true;
  }

  function updateBadgeCount(count) {
    var countEl = document.querySelector('#' + BADGE_ID + ' .ra-badge__count');
    if (!countEl) return;

    countEl.textContent = count > 99 ? '99+' : String(count);

    if (count === 0) {
      countEl.classList.add('ra-badge__count--zero');
    } else {
      countEl.classList.remove('ra-badge__count--zero');
    }

    // Pulse animation when count changes
    if (lastCount !== -1 && count !== lastCount) {
      countEl.classList.remove('ra-badge__count--pulse');
      void countEl.offsetWidth; // reflow
      countEl.classList.add('ra-badge__count--pulse');
    }
    lastCount = count;
  }

  function refreshDropdown() {
    var dd = document.getElementById(DROPDOWN_ID);
    if (!dd) return;
    dd.innerHTML = '<div class="ra-dropdown__loading">Loading submissions...</div>';

    fetchAllData().then(function (data) {
      renderDropdown(dd, data);
    }).catch(function () {
      dd.innerHTML = '<div class="ra-dropdown__empty">Could not load submissions</div>';
    });
  }

  function renderDropdown(dd, data) {
    var html = [];

    html.push('<div class="ra-dropdown__header">');
    html.push("Today's Submissions");
    html.push('<span>' + todayISO() + '</span>');
    html.push('</div>');

    if (!data.forms.length) {
      html.push('<div class="ra-dropdown__empty">No deployed forms found</div>');
    } else {
      data.forms.forEach(function (f) {
        var countClass = f.todayCount === 0 ? ' ra-dropdown__item-count--zero' : '';
        html.push(
          '<a class="ra-dropdown__item" href="/#/forms/' + f.uid + '/landing" title="' +
          f.name.replace(/"/g, '&quot;') + '">' +
          '<span class="ra-dropdown__item-name">' + escapeHtml(f.name) + '</span>' +
          '<span class="ra-dropdown__item-count' + countClass + '">' + f.todayCount + '</span>' +
          '</a>'
        );
      });
    }

    html.push('<div class="ra-dropdown__total">');
    html.push('<span>Today: <strong>' + data.todayTotal + '</strong></span>');
    html.push('<span>All time: <strong>' + data.allTotal.toLocaleString() + '</strong></span>');
    html.push('</div>');

    dd.innerHTML = html.join('');
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  // ── Polling ──
  function refreshBadge() {
    // Use cached data for badge count (fast), full refresh on dropdown open
    fetchAllData().then(function (data) {
      updateBadgeCount(data.todayTotal);
      try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({
          time: Date.now(),
          count: data.todayTotal
        }));
      } catch (e) { /* ignore */ }
    }).catch(function () {
      // silent fail - keep last known count
    });
  }

  function startPolling() {
    // Load cached count immediately for fast render
    try {
      var cached = JSON.parse(sessionStorage.getItem(CACHE_KEY));
      if (cached && (Date.now() - cached.time) < POLL_INTERVAL) {
        updateBadgeCount(cached.count);
      }
    } catch (e) { /* ignore */ }

    // Fetch fresh data
    refreshBadge();

    // Poll periodically
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = setInterval(refreshBadge, POLL_INTERVAL);
  }

  // ── Bootstrap ──
  function tryInject() {
    if (createBadge()) {
      startPolling();
      return true;
    }
    return false;
  }

  function waitForHeader() {
    if (tryInject()) return;

    var observer = new MutationObserver(function (mutations, obs) {
      if (tryInject()) obs.disconnect();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });

    // Safety: stop trying after 15 seconds
    setTimeout(function () { observer.disconnect(); }, 15000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForHeader);
  } else {
    waitForHeader();
  }
})();

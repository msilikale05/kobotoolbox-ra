/**
 * Resilience Academy - Per-Form Scheduler
 * =========================================
 * Injects a Form Scheduler section into each KoboToolbox form's settings page.
 * Supports: auto-deploy, auto-archive, and recurring email reminders.
 * UPDATE-PROOF: Loaded via nginx sub_filter; does not modify core files.
 */
(function () {
  'use strict';

  var BRAND_COLOR = '#54a8dc';
  var API_BASE = '/webhook-api/form-schedules';
  var INJECTED_ID = 'ra-form-scheduler';
  var POLL_INTERVAL = 800;
  var MAX_POLLS = 40;

  // ── Styles ──
  var style = document.createElement('style');
  style.textContent = [
    '#' + INJECTED_ID + ' {',
    '  margin: 30px 0 40px;',
    '  padding: 0;',
    '}',
    '.ra-fs__card {',
    '  background: #fff;',
    '  border: 1px solid #e2e8f0;',
    '  border-radius: 6px;',
    '  margin: 0 0 20px;',
    '  overflow: hidden;',
    '}',
    '.ra-fs__header {',
    '  display: flex;',
    '  align-items: center;',
    '  gap: 8px;',
    '  padding: 16px 20px;',
    '  background: ' + BRAND_COLOR + ';',
    '  color: #fff;',
    '  font-size: 16px;',
    '  font-weight: 600;',
    '  letter-spacing: 0.3px;',
    '}',
    '.ra-fs__header svg {',
    '  width: 20px;',
    '  height: 20px;',
    '  fill: #fff;',
    '  flex-shrink: 0;',
    '}',
    '.ra-fs__body {',
    '  padding: 20px;',
    '}',
    '.ra-fs__section-title {',
    '  font-size: 14px;',
    '  font-weight: 600;',
    '  color: #1e293b;',
    '  margin: 0 0 12px;',
    '  padding-bottom: 8px;',
    '  border-bottom: 1px solid #f1f5f9;',
    '}',
    '.ra-fs__row {',
    '  display: flex;',
    '  align-items: center;',
    '  gap: 12px;',
    '  margin: 0 0 10px;',
    '  flex-wrap: wrap;',
    '}',
    '.ra-fs__label {',
    '  font-size: 13px;',
    '  color: #64748b;',
    '  min-width: 90px;',
    '  flex-shrink: 0;',
    '}',
    '.ra-fs__input {',
    '  padding: 7px 10px;',
    '  border: 1px solid #cbd5e1;',
    '  border-radius: 4px;',
    '  font-size: 13px;',
    '  color: #1e293b;',
    '  background: #fff;',
    '  outline: none;',
    '  transition: border-color 0.2s;',
    '}',
    '.ra-fs__input:focus {',
    '  border-color: ' + BRAND_COLOR + ';',
    '}',
    '.ra-fs__input--wide {',
    '  flex: 1;',
    '  min-width: 200px;',
    '}',
    '.ra-fs__btn {',
    '  display: inline-block;',
    '  padding: 8px 18px;',
    '  border: none;',
    '  border-radius: 4px;',
    '  font-size: 13px;',
    '  font-weight: 600;',
    '  cursor: pointer;',
    '  transition: background 0.2s, opacity 0.2s;',
    '}',
    '.ra-fs__btn--primary {',
    '  background: ' + BRAND_COLOR + ';',
    '  color: #fff;',
    '}',
    '.ra-fs__btn--primary:hover {',
    '  background: #3d8ec0;',
    '}',
    '.ra-fs__btn--danger {',
    '  background: #ef4444;',
    '  color: #fff;',
    '  padding: 4px 12px;',
    '  font-size: 12px;',
    '}',
    '.ra-fs__btn--danger:hover {',
    '  background: #dc2626;',
    '}',
    '.ra-fs__btn:disabled {',
    '  opacity: 0.5;',
    '  cursor: not-allowed;',
    '}',
    '.ra-fs__msg {',
    '  font-size: 12px;',
    '  padding: 6px 0;',
    '  min-height: 20px;',
    '}',
    '.ra-fs__msg--ok { color: #16a34a; }',
    '.ra-fs__msg--err { color: #ef4444; }',
    '.ra-fs__divider {',
    '  border: none;',
    '  border-top: 1px solid #f1f5f9;',
    '  margin: 18px 0;',
    '}',
    '.ra-fs__schedule-item {',
    '  display: flex;',
    '  align-items: center;',
    '  justify-content: space-between;',
    '  padding: 10px 14px;',
    '  background: #f8fafc;',
    '  border: 1px solid #e2e8f0;',
    '  border-radius: 4px;',
    '  margin: 0 0 8px;',
    '  font-size: 13px;',
    '  color: #1e293b;',
    '}',
    '.ra-fs__schedule-item--executed {',
    '  opacity: 0.6;',
    '  background: #f0fdf4;',
    '  border-color: #bbf7d0;',
    '}',
    '.ra-fs__empty {',
    '  padding: 20px;',
    '  text-align: center;',
    '  color: #94a3b8;',
    '  font-size: 13px;',
    '  border: 2px dashed #e2e8f0;',
    '  border-radius: 6px;',
    '}',
    '.ra-fs__select {',
    '  padding: 7px 10px;',
    '  border: 1px solid #cbd5e1;',
    '  border-radius: 4px;',
    '  font-size: 13px;',
    '  color: #1e293b;',
    '  background: #fff;',
    '  outline: none;',
    '}',
    '.ra-fs__select:focus {',
    '  border-color: ' + BRAND_COLOR + ';',
    '}',
    '.ra-fs__day-row {',
    '  display: none;',
    '}',
    '.ra-fs__day-row--visible {',
    '  display: flex;',
    '}'
  ].join('\n');
  document.head.appendChild(style);

  // ── Helpers ──

  function getCSRFToken() {
    var match = document.cookie.match(/(^|;\s*)csrftoken=([^;]*)/);
    return match ? decodeURIComponent(match[2]) : '';
  }

  function escapeHtml(s) {
    var d = document.createElement('div');
    d.appendChild(document.createTextNode(s || ''));
    return d.innerHTML;
  }

  function getFormUid() {
    var hash = window.location.hash || '';
    var m = hash.match(/#\/forms\/([a-zA-Z0-9]+)\/settings/);
    return m ? m[1] : null;
  }

  function formatScheduleDate(dtStr) {
    try {
      var d = new Date(dtStr);
      if (isNaN(d.getTime())) return dtStr;
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dtStr;
    }
  }

  function apiRequest(method, url, body, callback) {
    var opts = {
      method: method,
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    var csrf = getCSRFToken();
    if (csrf) {
      opts.headers['X-CSRFToken'] = csrf;
    }
    if (body) {
      opts.body = JSON.stringify(body);
    }
    fetch(url, opts)
      .then(function (resp) {
        return resp.json().then(function (data) {
          return { ok: resp.ok, status: resp.status, data: data };
        });
      })
      .then(function (result) {
        callback(null, result);
      })
      .catch(function (err) {
        callback(err, null);
      });
  }

  // ── Clock icon SVG ──
  var CLOCK_SVG = '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"/></svg>';

  // ── Main render ──

  function renderScheduler(container, formUid) {
    container.innerHTML =
      '<div class="ra-fs__card">' +
        '<div class="ra-fs__header">' + CLOCK_SVG + ' Form Scheduler</div>' +
        '<div class="ra-fs__body">' +
          // Auto Deploy/Archive section
          '<div class="ra-fs__section-title">Auto Deploy / Archive</div>' +
          '<div class="ra-fs__row">' +
            '<span class="ra-fs__label">Deploy on:</span>' +
            '<input type="datetime-local" class="ra-fs__input ra-fs__input--wide" id="ra-fs-deploy-dt" />' +
          '</div>' +
          '<div class="ra-fs__row">' +
            '<span class="ra-fs__label">Archive on:</span>' +
            '<input type="datetime-local" class="ra-fs__input ra-fs__input--wide" id="ra-fs-archive-dt" />' +
          '</div>' +
          '<div class="ra-fs__row">' +
            '<button class="ra-fs__btn ra-fs__btn--primary" id="ra-fs-save-schedule">Save Schedule</button>' +
          '</div>' +
          '<div class="ra-fs__msg" id="ra-fs-deploy-msg"></div>' +

          '<hr class="ra-fs__divider" />' +

          // Email Reminders section
          '<div class="ra-fs__section-title">Email Reminders</div>' +
          '<div class="ra-fs__row">' +
            '<span class="ra-fs__label">Send to:</span>' +
            '<input type="email" class="ra-fs__input ra-fs__input--wide" id="ra-fs-remind-email" placeholder="user@example.com" />' +
          '</div>' +
          '<div class="ra-fs__row">' +
            '<span class="ra-fs__label">Frequency:</span>' +
            '<select class="ra-fs__select" id="ra-fs-remind-freq">' +
              '<option value="daily">Daily</option>' +
              '<option value="weekly" selected>Weekly</option>' +
              '<option value="monthly">Monthly</option>' +
            '</select>' +
          '</div>' +
          '<div class="ra-fs__row ra-fs__day-row ra-fs__day-row--visible" id="ra-fs-day-row">' +
            '<span class="ra-fs__label">Day:</span>' +
            '<select class="ra-fs__select" id="ra-fs-remind-day">' +
              '<option value="monday">Monday</option>' +
              '<option value="tuesday">Tuesday</option>' +
              '<option value="wednesday">Wednesday</option>' +
              '<option value="thursday">Thursday</option>' +
              '<option value="friday">Friday</option>' +
              '<option value="saturday">Saturday</option>' +
              '<option value="sunday">Sunday</option>' +
            '</select>' +
          '</div>' +
          '<div class="ra-fs__row">' +
            '<span class="ra-fs__label">Time:</span>' +
            '<input type="time" class="ra-fs__input" id="ra-fs-remind-time" value="09:00" />' +
          '</div>' +
          '<div class="ra-fs__row">' +
            '<span class="ra-fs__label">Message:</span>' +
            '<input type="text" class="ra-fs__input ra-fs__input--wide" id="ra-fs-remind-msg" placeholder="Please submit your data" />' +
          '</div>' +
          '<div class="ra-fs__row">' +
            '<button class="ra-fs__btn ra-fs__btn--primary" id="ra-fs-add-reminder">Add Reminder</button>' +
          '</div>' +
          '<div class="ra-fs__msg" id="ra-fs-remind-status"></div>' +

          '<hr class="ra-fs__divider" />' +

          // Active Schedules section
          '<div class="ra-fs__section-title">Active Schedules</div>' +
          '<div id="ra-fs-schedule-list"></div>' +

        '</div>' +
      '</div>';

    // Wire up frequency change to show/hide day selector
    var freqSelect = document.getElementById('ra-fs-remind-freq');
    var dayRow = document.getElementById('ra-fs-day-row');
    if (freqSelect && dayRow) {
      freqSelect.addEventListener('change', function () {
        if (freqSelect.value === 'weekly') {
          dayRow.className = 'ra-fs__row ra-fs__day-row ra-fs__day-row--visible';
        } else {
          dayRow.className = 'ra-fs__row ra-fs__day-row';
        }
      });
    }

    // Save schedule button (deploy/archive)
    var saveBtn = document.getElementById('ra-fs-save-schedule');
    if (saveBtn) {
      saveBtn.addEventListener('click', function () {
        var deployDt = document.getElementById('ra-fs-deploy-dt').value;
        var archiveDt = document.getElementById('ra-fs-archive-dt').value;
        var msgEl = document.getElementById('ra-fs-deploy-msg');

        if (!deployDt && !archiveDt) {
          msgEl.className = 'ra-fs__msg ra-fs__msg--err';
          msgEl.textContent = 'Please set at least one date.';
          return;
        }

        saveBtn.disabled = true;
        var pending = 0;
        var errors = [];

        function onDone() {
          pending--;
          if (pending <= 0) {
            saveBtn.disabled = false;
            if (errors.length) {
              msgEl.className = 'ra-fs__msg ra-fs__msg--err';
              msgEl.textContent = errors.join('; ');
            } else {
              msgEl.className = 'ra-fs__msg ra-fs__msg--ok';
              msgEl.textContent = 'Schedule(s) saved.';
              document.getElementById('ra-fs-deploy-dt').value = '';
              document.getElementById('ra-fs-archive-dt').value = '';
              loadScheduleList(formUid);
            }
          }
        }

        if (deployDt) {
          pending++;
          apiRequest('POST', API_BASE + '/' + formUid, {
            type: 'auto_deploy',
            datetime: deployDt
          }, function (err, result) {
            if (err || !result.ok) {
              errors.push('Deploy: ' + (err ? err.message : (result.data.error || 'Failed')));
            }
            onDone();
          });
        }

        if (archiveDt) {
          pending++;
          apiRequest('POST', API_BASE + '/' + formUid, {
            type: 'auto_archive',
            datetime: archiveDt
          }, function (err, result) {
            if (err || !result.ok) {
              errors.push('Archive: ' + (err ? err.message : (result.data.error || 'Failed')));
            }
            onDone();
          });
        }
      });
    }

    // Add reminder button
    var addReminderBtn = document.getElementById('ra-fs-add-reminder');
    if (addReminderBtn) {
      addReminderBtn.addEventListener('click', function () {
        var emailInput = document.getElementById('ra-fs-remind-email');
        var freqInput = document.getElementById('ra-fs-remind-freq');
        var dayInput = document.getElementById('ra-fs-remind-day');
        var timeInput = document.getElementById('ra-fs-remind-time');
        var msgInput = document.getElementById('ra-fs-remind-msg');
        var statusEl = document.getElementById('ra-fs-remind-status');

        var email = emailInput ? emailInput.value.trim() : '';
        if (!email) {
          statusEl.className = 'ra-fs__msg ra-fs__msg--err';
          statusEl.textContent = 'Please enter an email address.';
          return;
        }

        addReminderBtn.disabled = true;
        apiRequest('POST', API_BASE + '/' + formUid, {
          type: 'reminder',
          recurring: true,
          recurrence: freqInput ? freqInput.value : 'weekly',
          day: dayInput ? dayInput.value : 'monday',
          time: timeInput ? timeInput.value : '09:00',
          email_recipients: email,
          message: msgInput ? msgInput.value : 'Please submit your data'
        }, function (err, result) {
          addReminderBtn.disabled = false;
          if (err || !result.ok) {
            statusEl.className = 'ra-fs__msg ra-fs__msg--err';
            statusEl.textContent = err ? err.message : (result.data.error || 'Failed to add reminder');
          } else {
            statusEl.className = 'ra-fs__msg ra-fs__msg--ok';
            statusEl.textContent = 'Reminder added.';
            if (emailInput) emailInput.value = '';
            if (msgInput) msgInput.value = '';
            loadScheduleList(formUid);
          }
        });
      });
    }

    // Load existing schedules
    loadScheduleList(formUid);
  }

  function loadScheduleList(formUid) {
    var listEl = document.getElementById('ra-fs-schedule-list');
    if (!listEl) return;

    listEl.innerHTML = '<div style="padding:10px;color:#94a3b8;font-size:13px;">Loading...</div>';

    apiRequest('GET', API_BASE + '/' + formUid, null, function (err, result) {
      if (err || !result.ok) {
        listEl.innerHTML = '<div class="ra-fs__empty">Failed to load schedules.</div>';
        return;
      }

      var schedules = result.data.schedules || [];
      if (!schedules.length) {
        listEl.innerHTML = '<div class="ra-fs__empty">No schedules configured for this form.</div>';
        return;
      }

      var html = '';
      for (var i = 0; i < schedules.length; i++) {
        var s = schedules[i];
        var icon = '';
        var label = '';
        var extraClass = s.executed ? ' ra-fs__schedule-item--executed' : '';

        if (s.type === 'auto_deploy') {
          icon = '&#x1F4C5;';
          label = 'Auto-deploy: ' + escapeHtml(formatScheduleDate(s.datetime));
          if (s.executed) label += ' (done)';
        } else if (s.type === 'auto_archive') {
          icon = '&#x1F4C5;';
          label = 'Auto-archive: ' + escapeHtml(formatScheduleDate(s.datetime));
          if (s.executed) label += ' (done)';
        } else if (s.type === 'reminder') {
          icon = '&#x1F4E7;';
          var freqLabel = (s.recurrence || 'weekly').charAt(0).toUpperCase() + (s.recurrence || 'weekly').slice(1);
          label = freqLabel + ' reminder';
          if (s.recurrence === 'weekly') {
            var dayStr = s.day || 'monday';
            label += ' (' + dayStr.charAt(0).toUpperCase() + dayStr.slice(1) + ')';
          }
          label += ' at ' + escapeHtml(s.time || '09:00');
          label += ' to ' + escapeHtml(s.email_recipients || '');
        }

        html +=
          '<div class="ra-fs__schedule-item' + extraClass + '" data-sid="' + escapeHtml(s.id) + '">' +
            '<span>' + icon + ' ' + label + '</span>' +
            '<button class="ra-fs__btn ra-fs__btn--danger ra-fs-delete-btn" data-schedule-id="' + escapeHtml(s.id) + '">Delete</button>' +
          '</div>';
      }

      listEl.innerHTML = html;

      // Wire delete buttons
      var deleteBtns = listEl.querySelectorAll('.ra-fs-delete-btn');
      for (var j = 0; j < deleteBtns.length; j++) {
        (function (btn) {
          btn.addEventListener('click', function () {
            var scheduleId = btn.getAttribute('data-schedule-id');
            btn.disabled = true;
            btn.textContent = '...';
            apiRequest('DELETE', API_BASE + '/' + formUid + '/' + scheduleId, null, function (err, result) {
              if (err || !result.ok) {
                btn.disabled = false;
                btn.textContent = 'Delete';
                alert('Failed to delete schedule.');
              } else {
                loadScheduleList(formUid);
              }
            });
          });
        })(deleteBtns[j]);
      }
    });
  }

  // ── Injection Logic ──

  var _injected = false;
  var _observer = null;

  function tryInject() {
    var formUid = getFormUid();
    if (!formUid) {
      removeInjected();
      return;
    }

    // Already injected for this form?
    var existing = document.getElementById(INJECTED_ID);
    if (existing) return;

    // Find the settings page content container
    // KoboToolbox renders form settings inside .form-view or .form-modal
    var settingsContainer = findSettingsContainer();
    if (!settingsContainer) return;

    // Create our section
    var wrapper = document.createElement('div');
    wrapper.id = INJECTED_ID;
    settingsContainer.appendChild(wrapper);

    renderScheduler(wrapper, formUid);
    _injected = true;
  }

  function findSettingsContainer() {
    // KoboToolbox form settings page uses these containers
    // Try multiple selectors for compatibility
    var selectors = [
      '.form-view__cell--page-title',     // The main settings page wrapper
      '.form-view__row',                   // Settings rows
      '.form-view',                        // Form view container
      '.form-modal__item',                 // Modal-style settings
      '[data-cy="form-settings"]'          // Data attribute selector
    ];

    // We want to find the main scrollable parent of the settings page
    // and append our section at the bottom
    var formView = document.querySelector('.form-view');
    if (formView) {
      // Find the last .form-view__row or the form-view itself
      var rows = formView.querySelectorAll('.form-view__row');
      if (rows.length > 0) {
        return rows[rows.length - 1].parentNode;
      }
      return formView;
    }

    // Fallback: look for any settings-like container
    var content = document.querySelector('.form-view__cell--settings') ||
                  document.querySelector('.asset-settings') ||
                  document.querySelector('[class*="settings"]');
    if (content) return content;

    return null;
  }

  function removeInjected() {
    var el = document.getElementById(INJECTED_ID);
    if (el) {
      el.parentNode.removeChild(el);
    }
    _injected = false;
  }

  function isOnFormSettings() {
    return !!getFormUid();
  }

  // ── Polling with MutationObserver ──

  function startObserving() {
    if (_observer) return;

    // Poll initially to catch pages that already rendered
    var pollCount = 0;
    var pollTimer = setInterval(function () {
      pollCount++;
      if (isOnFormSettings()) {
        tryInject();
        if (_injected || pollCount >= MAX_POLLS) {
          clearInterval(pollTimer);
        }
      } else {
        removeInjected();
        clearInterval(pollTimer);
      }
    }, POLL_INTERVAL);

    // Also use MutationObserver for React re-renders
    _observer = new MutationObserver(function () {
      if (isOnFormSettings()) {
        tryInject();
      } else {
        removeInjected();
      }
    });

    _observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  function stopObserving() {
    if (_observer) {
      _observer.disconnect();
      _observer = null;
    }
  }

  // ── Hash change handler ──

  function onHashChange() {
    if (isOnFormSettings()) {
      _injected = false; // Reset so we re-inject for new form
      startObserving();
    } else {
      removeInjected();
      stopObserving();
    }
  }

  // ── Initialize ──
  window.addEventListener('hashchange', onHashChange);

  // Check on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onHashChange);
  } else {
    onHashChange();
  }

})();

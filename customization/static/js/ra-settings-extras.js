/**
 * Resilience Academy - Settings Extras
 * ======================================
 * Adds Form Scheduler and Project Tags to the Settings page.
 * Hooks into ra-settings.js via the window.raSettingsExtras interface.
 * UPDATE-PROOF: Separate file, does not modify ra-settings.js.
 */
(function () {
  'use strict';

  // ── Form Scheduler ──
  var SCHEDULER_KEY = 'ra_form_schedules';

  function getSchedules() {
    try { return JSON.parse(localStorage.getItem(SCHEDULER_KEY)) || []; } catch (e) { return []; }
  }
  function saveSchedules(list) {
    try { localStorage.setItem(SCHEDULER_KEY, JSON.stringify(list)); } catch (e) {}
  }
  function esc(s) {
    var d = document.createElement('div');
    d.appendChild(document.createTextNode(s || ''));
    return d.innerHTML;
  }

  function renderSchedulerSection(main) {
    main.innerHTML =
      '<h1 class="ra-st__page-title">Form Scheduler</h1>' +
      '<div class="ra-st__content">' +
        '<p style="color:#888;margin:0 0 16px;">Schedule forms to automatically deploy or close at specific dates and times.</p>' +
        '<div id="ra-st-sched-list"></div>' +
        '<button class="ra-st__btn ra-st__btn--primary" id="ra-st-sched-add" style="margin-top:12px;">+ Add Schedule</button>' +
        '<div class="ra-st__status" id="ra-st-sched-status"></div>' +
      '</div>';

    renderScheduleList();

    document.getElementById('ra-st-sched-add').addEventListener('click', function () {
      showScheduleEditor();
    });
    checkSchedules();
  }

  function renderScheduleList() {
    var container = document.getElementById('ra-st-sched-list');
    if (!container) return;
    var schedules = getSchedules();

    if (!schedules.length) {
      container.innerHTML = '<div style="padding:24px;text-align:center;color:#94a3b8;border:2px dashed #e2e8f0;border-radius:8px;">' +
        '<p style="margin:0 0 4px;font-size:14px;">No schedules configured</p>' +
        '<p style="margin:0;font-size:12px;">Click "+ Add Schedule" to set up automatic form deployment or archiving.</p></div>';
      return;
    }

    container.innerHTML = schedules.map(function (s, i) {
      var actionLabel = s.action === 'deploy' ? '<span style="color:#27ae60;">Deploy</span>' : '<span style="color:#e74c3c;">Archive</span>';
      var isPast = new Date(s.datetime) < new Date();
      var statusLabel = s.executed ? '<span style="color:#94a3b8;">Executed</span>' : isPast ? '<span style="color:#f39c12;">Overdue</span>' : '<span style="color:#54a8dc;">Pending</span>';
      return '<div style="display:flex;align-items:center;gap:12px;padding:12px 16px;border:1px solid #e2e8f0;border-radius:6px;margin-bottom:8px;">' +
        '<div style="flex:1;">' +
          '<div style="font-size:14px;font-weight:600;">' + esc(s.formName || s.formUid) + '</div>' +
          '<div style="font-size:12px;color:#666;margin-top:2px;">' + actionLabel + ' at <strong>' + esc(s.datetime.replace('T', ' ')) + '</strong> &middot; ' + statusLabel + '</div>' +
        '</div>' +
        '<button class="ra-st__btn ra-st__btn--secondary ra-sched-delete" data-idx="' + i + '" style="padding:6px 12px;font-size:12px;color:#e74c3c;">Remove</button>' +
      '</div>';
    }).join('');

    container.querySelectorAll('.ra-sched-delete').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var list = getSchedules();
        list.splice(parseInt(this.getAttribute('data-idx')), 1);
        saveSchedules(list);
        renderScheduleList();
      });
    });
  }

  function showScheduleEditor() {
    fetch('/api/v2/assets/?asset_type=survey&fields=["uid","name","deployment_status"]&limit=100', { credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var forms = data.results || [];
        var formOptions = forms.map(function (f) {
          return '<option value="' + f.uid + '" data-name="' + esc(f.name) + '">' + esc(f.name) + ' (' + f.deployment_status + ')</option>';
        }).join('');

        var defaultDT = new Date(Date.now() + 3600000).toISOString().slice(0, 16);

        var modal = document.createElement('div');
        modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:100001;display:flex;align-items:center;justify-content:center;';
        modal.innerHTML =
          '<div style="background:#fff;border-radius:10px;width:420px;max-width:90vw;box-shadow:0 10px 40px rgba(0,0,0,0.2);">' +
            '<div style="padding:16px 20px;border-bottom:1px solid #e2e8f0;font-size:16px;font-weight:600;">Add Schedule</div>' +
            '<div style="padding:20px;">' +
              '<div class="ra-st__field"><label>Form</label><select id="ra-sched-form" style="width:100%;padding:10px;border:1px solid #d0d5dd;border-radius:6px;">' + formOptions + '</select></div>' +
              '<div class="ra-st__field"><label>Action</label><select id="ra-sched-action" style="width:100%;padding:10px;border:1px solid #d0d5dd;border-radius:6px;"><option value="deploy">Deploy (open for submissions)</option><option value="archive">Archive (close submissions)</option></select></div>' +
              '<div class="ra-st__field"><label>Date & Time</label><input type="datetime-local" id="ra-sched-dt" value="' + defaultDT + '" style="width:100%;padding:10px;border:1px solid #d0d5dd;border-radius:6px;"></div>' +
              '<div style="display:flex;gap:10px;margin-top:16px;">' +
                '<button class="ra-st__btn ra-st__btn--primary" id="ra-sched-save">Save Schedule</button>' +
                '<button class="ra-st__btn ra-st__btn--secondary" id="ra-sched-cancel">Cancel</button>' +
              '</div>' +
            '</div>' +
          '</div>';

        document.body.appendChild(modal);
        modal.querySelector('#ra-sched-cancel').addEventListener('click', function () { modal.remove(); });
        modal.addEventListener('click', function (e) { if (e.target === modal) modal.remove(); });

        modal.querySelector('#ra-sched-save').addEventListener('click', function () {
          var sel = modal.querySelector('#ra-sched-form');
          var schedule = {
            formUid: sel.value,
            formName: sel.options[sel.selectedIndex].getAttribute('data-name'),
            action: modal.querySelector('#ra-sched-action').value,
            datetime: modal.querySelector('#ra-sched-dt').value,
            executed: false
          };
          var list = getSchedules();
          list.push(schedule);
          saveSchedules(list);
          modal.remove();
          renderScheduleList();
        });
      });
  }

  function checkSchedules() {
    var schedules = getSchedules();
    var now = new Date();
    schedules.forEach(function (s) {
      if (s.executed) return;
      if (new Date(s.datetime) <= now) {
        fetch('/api/v2/assets/' + s.formUid + '/deployment/', {
          method: 'PATCH',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ active: s.action === 'deploy' })
        }).then(function () {
          s.executed = true;
          saveSchedules(schedules);
        }).catch(function () {});
      }
    });
  }
  setInterval(checkSchedules, 60000);

  // ── Project Tags ──
  var TAGS_KEY = 'ra_project_tags';

  function getTags() {
    try { return JSON.parse(localStorage.getItem(TAGS_KEY)) || {}; } catch (e) { return {}; }
  }
  function saveTags(tags) {
    try { localStorage.setItem(TAGS_KEY, JSON.stringify(tags)); } catch (e) {}
  }

  function renderTagsSection(main) {
    main.innerHTML =
      '<h1 class="ra-st__page-title">Project Tags</h1>' +
      '<div class="ra-st__content">' +
        '<p style="color:#888;margin:0 0 16px;">Organize your forms into categories using tags. Tags appear as color-coded labels.</p>' +
        '<div class="ra-st__field">' +
          '<label>Add New Tag</label>' +
          '<div style="display:flex;gap:8px;">' +
            '<input type="text" id="ra-st-tag-input" placeholder="e.g., Water, Education, Health" style="flex:1;padding:10px;border:1px solid #d0d5dd;border-radius:6px;">' +
            '<input type="color" id="ra-st-tag-color" value="#54a8dc" style="width:44px;height:42px;padding:4px;border:1px solid #d0d5dd;border-radius:6px;cursor:pointer;">' +
            '<button class="ra-st__btn ra-st__btn--primary" id="ra-st-tag-add">Add Tag</button>' +
          '</div>' +
        '</div>' +
        '<div id="ra-st-tag-list" style="margin-bottom:20px;"></div>' +
        '<h2 style="font-size:14px;font-weight:600;color:#29292a;margin:24px 0 12px;padding-bottom:8px;border-bottom:1px solid #eee;">Assign Tags to Forms</h2>' +
        '<div id="ra-st-tag-forms"></div>' +
      '</div>';

    renderTagList();
    renderTagFormAssignment();

    document.getElementById('ra-st-tag-add').addEventListener('click', function () {
      var input = document.getElementById('ra-st-tag-input');
      var color = document.getElementById('ra-st-tag-color').value;
      var name = input.value.trim();
      if (!name) return;
      var tags = getTags();
      var id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      tags[id] = { name: name, color: color, forms: tags[id] ? tags[id].forms : [] };
      saveTags(tags);
      input.value = '';
      renderTagList();
      renderTagFormAssignment();
    });
  }

  function renderTagList() {
    var container = document.getElementById('ra-st-tag-list');
    if (!container) return;
    var tags = getTags();
    var keys = Object.keys(tags);
    if (!keys.length) {
      container.innerHTML = '<div style="color:#94a3b8;font-size:13px;padding:8px 0;">No tags created yet.</div>';
      return;
    }
    container.innerHTML = '<div style="display:flex;flex-wrap:wrap;gap:8px;padding:8px 0;">' +
      keys.map(function (id) {
        var t = tags[id];
        return '<span style="display:inline-flex;align-items:center;gap:6px;padding:6px 14px;border-radius:20px;background:' + t.color + '15;border:1px solid ' + t.color + '40;font-size:13px;">' +
          '<span style="width:8px;height:8px;border-radius:50%;background:' + t.color + ';"></span>' +
          esc(t.name) +
          ' <span style="color:' + t.color + ';font-size:11px;">(' + (t.forms || []).length + ')</span>' +
          '<button style="background:none;border:none;cursor:pointer;color:#e74c3c;font-size:14px;padding:0 2px;" data-tag="' + esc(id) + '" class="ra-tag-del">&times;</button>' +
        '</span>';
      }).join('') + '</div>';

    container.querySelectorAll('.ra-tag-del').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var tags = getTags();
        delete tags[this.getAttribute('data-tag')];
        saveTags(tags);
        renderTagList();
        renderTagFormAssignment();
      });
    });
  }

  function renderTagFormAssignment() {
    var container = document.getElementById('ra-st-tag-forms');
    if (!container) return;
    container.innerHTML = '<div style="color:#94a3b8;text-align:center;padding:12px;">Loading forms...</div>';

    var tags = getTags();
    var tagKeys = Object.keys(tags);

    fetch('/api/v2/assets/?asset_type=survey&fields=["uid","name","deployment_status"]&limit=100', { credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var forms = data.results || [];
        if (!forms.length || !tagKeys.length) {
          container.innerHTML = '<div style="color:#94a3b8;font-size:13px;">' +
            (tagKeys.length ? 'No forms found.' : 'Create tags above first.') + '</div>';
          return;
        }

        container.innerHTML = forms.map(function (f) {
          var checkboxes = tagKeys.map(function (tagId) {
            var isAssigned = (tags[tagId].forms || []).indexOf(f.uid) !== -1;
            return '<label style="display:inline-flex;align-items:center;gap:4px;margin-right:12px;font-size:12px;cursor:pointer;">' +
              '<input type="checkbox" class="ra-tag-assign" data-form="' + f.uid + '" data-tag="' + tagId + '"' + (isAssigned ? ' checked' : '') + '>' +
              '<span style="color:' + tags[tagId].color + ';">' + esc(tags[tagId].name) + '</span></label>';
          }).join('');
          return '<div style="padding:10px 0;border-bottom:1px solid #f5f5f5;">' +
            '<div style="font-size:14px;font-weight:500;margin-bottom:4px;">' + esc(f.name) + '</div>' +
            '<div>' + checkboxes + '</div></div>';
        }).join('');

        container.querySelectorAll('.ra-tag-assign').forEach(function (cb) {
          cb.addEventListener('change', function () {
            var formUid = this.getAttribute('data-form');
            var tagId = this.getAttribute('data-tag');
            var tags = getTags();
            if (!tags[tagId]) return;
            if (!tags[tagId].forms) tags[tagId].forms = [];
            if (this.checked) {
              if (tags[tagId].forms.indexOf(formUid) === -1) tags[tagId].forms.push(formUid);
            } else {
              tags[tagId].forms = tags[tagId].forms.filter(function (u) { return u !== formUid; });
            }
            saveTags(tags);
            renderTagList();
          });
        });
      });
  }

  // ── Expose for ra-settings.js to call ──
  window.raSettingsExtras = {
    renderScheduler: renderSchedulerSection,
    renderTags: renderTagsSection
  };
})();

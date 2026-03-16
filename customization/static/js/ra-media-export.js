/**
 * Resilience Academy - Advanced Media/Image Export
 * ==================================================
 * Enhances the Batch Export media functionality with:
 *   - Image naming by form field (location, ID, custom field)
 *   - Image preview grid with select/deselect
 *   - Bulk download with custom naming
 * Hooks into the export page via window.raMediaExport.
 * UPDATE-PROOF: Separate file.
 */
(function () {
  'use strict';

  var _mediaData = []; // {url, filename, mime, formUid, formName, sub}
  var _selectedMedia = new Set();
  var _namingField = '_id';
  var _namingPrefix = '';
  var _formFields = {};

  function esc(s) {
    var d = document.createElement('div');
    d.appendChild(document.createTextNode(s || ''));
    return d.innerHTML;
  }

  function getFieldValue(sub, field) {
    if (sub[field] !== undefined && sub[field] !== null) return String(sub[field]);
    for (var k in sub) {
      if (k.endsWith('/' + field)) return String(sub[k]);
    }
    return '';
  }

  // ── Main export function — replaces batchExportMedia ──
  function advancedMediaExport(uids, format, statusEl) {
    var imagesOnly = format === 'zip_images';
    statusEl.textContent = 'Fetching media from ' + uids.length + ' form(s)...';
    statusEl.style.display = 'block';
    statusEl.style.background = '#e8f4fd';
    statusEl.style.color = '#2980b9';

    // Fetch full submission data (need all fields for naming)
    var promises = uids.map(function (uid) {
      return fetch('/api/v2/assets/' + uid + '/?fields=["name","content"]', { credentials: 'same-origin' })
        .then(function (r) { return r.json(); })
        .then(function (formData) {
          return fetch('/api/v2/assets/' + uid + '/data/?limit=30000', { credentials: 'same-origin' })
            .then(function (r) { return r.json(); })
            .then(function (data) {
              return { uid: uid, name: formData.name, content: formData.content, results: data.results || [] };
            });
        })
        .catch(function () { return { uid: uid, name: uid, content: {}, results: [] }; });
    });

    Promise.all(promises).then(function (allData) {
      _mediaData = [];
      _formFields = {};

      allData.forEach(function (d) {
        // Collect field names for naming options
        var survey = (d.content || {}).survey || [];
        survey.forEach(function (row) {
          var t = row.type || '';
          if (t.indexOf('begin') === 0 || t.indexOf('end') === 0 || t === 'calculate' || t === 'note') return;
          var name = row.name || row.$autoname || '';
          var label = (row.label && row.label[0]) || name;
          if (name) _formFields[name] = label;
        });

        d.results.forEach(function (sub) {
          var attachments = sub._attachments || [];
          attachments.forEach(function (att) {
            var url = att.download_url || att.download_medium_url || att.download_small_url;
            var mime = att.mimetype || '';
            var filename = att.filename || 'unknown';
            if (imagesOnly && mime.indexOf('image') === -1) return;
            if (url) {
              _mediaData.push({
                url: url,
                filename: filename,
                mime: mime,
                formUid: d.uid,
                formName: d.name,
                sub: sub,
                subId: sub._id,
                submittedBy: sub._submitted_by || 'anonymous',
                time: sub._submission_time || ''
              });
            }
          });
        });
      });

      if (!_mediaData.length) {
        statusEl.textContent = 'No ' + (imagesOnly ? 'images' : 'media files') + ' found.';
        statusEl.style.background = '#fde8e8';
        statusEl.style.color = '#e74c3c';
        return;
      }

      // Select all by default
      _selectedMedia = new Set(_mediaData.map(function (m, i) { return i; }));

      renderMediaExportUI(statusEl, imagesOnly);
    });
  }

  function renderMediaExportUI(statusEl, imagesOnly) {
    // Remove previous results
    var oldResults = document.getElementById('ra-media-export-ui');
    if (oldResults) oldResults.remove();

    var container = document.createElement('div');
    container.id = 'ra-media-export-ui';
    container.style.marginTop = '16px';

    // Build field options for naming
    var fieldOpts = '<option value="_id">Submission ID</option>' +
      '<option value="_submitted_by">Submitted By</option>' +
      '<option value="_submission_time">Date</option>';
    Object.keys(_formFields).forEach(function (name) {
      fieldOpts += '<option value="' + esc(name) + '">' + esc(_formFields[name]) + '</option>';
    });

    container.innerHTML =
      // Stats
      '<div style="display:flex;gap:16px;margin-bottom:16px;padding:12px;background:#f8fafc;border-radius:6px;">' +
        '<div><strong style="font-size:20px;color:#54a8dc;">' + _mediaData.length + '</strong><div style="font-size:11px;color:#94a3b8;">' + (imagesOnly ? 'images' : 'media files') + ' found</div></div>' +
        '<div><strong style="font-size:20px;color:#10b981;" id="ra-me-selected">' + _selectedMedia.size + '</strong><div style="font-size:11px;color:#94a3b8;">selected</div></div>' +
      '</div>' +

      // Naming configuration
      '<div style="border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin-bottom:16px;">' +
        '<div style="font-size:13px;font-weight:600;color:#29292a;margin-bottom:10px;">Image Naming</div>' +
        '<div style="display:flex;gap:10px;flex-wrap:wrap;">' +
          '<div style="flex:1;min-width:150px;">' +
            '<label style="font-size:11px;font-weight:600;color:#666;display:block;margin-bottom:4px;">Prefix (optional)</label>' +
            '<input type="text" id="ra-me-prefix" value="" placeholder="e.g., RA_Survey_" style="width:100%;padding:8px;border:1px solid #d0d5dd;border-radius:4px;font-size:13px;box-sizing:border-box;">' +
          '</div>' +
          '<div style="flex:1;min-width:150px;">' +
            '<label style="font-size:11px;font-weight:600;color:#666;display:block;margin-bottom:4px;">Name images by</label>' +
            '<select id="ra-me-namefield" style="width:100%;padding:8px;border:1px solid #d0d5dd;border-radius:4px;font-size:13px;">' + fieldOpts + '</select>' +
          '</div>' +
          '<div style="flex:1;min-width:150px;">' +
            '<label style="font-size:11px;font-weight:600;color:#666;display:block;margin-bottom:4px;">Include sequence number</label>' +
            '<select id="ra-me-seq" style="width:100%;padding:8px;border:1px solid #d0d5dd;border-radius:4px;font-size:13px;">' +
              '<option value="yes">Yes (prefix_name_001.jpg)</option>' +
              '<option value="no">No (prefix_name.jpg)</option>' +
            '</select>' +
          '</div>' +
        '</div>' +
        '<div style="margin-top:8px;font-size:12px;color:#94a3b8;">Preview: <strong id="ra-me-preview">image_001.jpg</strong></div>' +
      '</div>' +

      // Selection controls
      '<div style="display:flex;gap:8px;margin-bottom:10px;">' +
        '<button class="ra-st__btn ra-st__btn--secondary" id="ra-me-selectall" style="font-size:12px;padding:6px 12px;">Select All</button>' +
        '<button class="ra-st__btn ra-st__btn--secondary" id="ra-me-selectnone" style="font-size:12px;padding:6px 12px;">Select None</button>' +
        '<span style="flex:1;"></span>' +
        '<button class="ra-st__btn ra-st__btn--secondary" id="ra-me-view-grid" style="font-size:12px;padding:6px 12px;">Grid View</button>' +
        '<button class="ra-st__btn ra-st__btn--secondary" id="ra-me-view-list" style="font-size:12px;padding:6px 12px;">List View</button>' +
      '</div>' +

      // Media list
      '<div id="ra-me-list" style="max-height:400px;overflow-y:auto;border:1px solid #eee;border-radius:6px;"></div>' +

      // Export actions
      '<div style="display:flex;gap:8px;margin-top:12px;">' +
        '<button class="ra-st__btn ra-st__btn--primary" id="ra-me-download">Download Selected as List (CSV)</button>' +
        '<button class="ra-st__btn ra-st__btn--primary" id="ra-me-download-links" style="background:#10b981;">Generate Download Links</button>' +
      '</div>';

    statusEl.parentNode.insertBefore(container, statusEl.nextSibling);
    statusEl.style.display = 'none';

    renderMediaList('list');
    updatePreview();

    // Event handlers
    document.getElementById('ra-me-selectall').addEventListener('click', function () {
      _selectedMedia = new Set(_mediaData.map(function (m, i) { return i; }));
      renderMediaList(getCurrentView());
      updateSelectedCount();
    });

    document.getElementById('ra-me-selectnone').addEventListener('click', function () {
      _selectedMedia = new Set();
      renderMediaList(getCurrentView());
      updateSelectedCount();
    });

    document.getElementById('ra-me-view-grid').addEventListener('click', function () { renderMediaList('grid'); });
    document.getElementById('ra-me-view-list').addEventListener('click', function () { renderMediaList('list'); });

    document.getElementById('ra-me-prefix').addEventListener('input', updatePreview);
    document.getElementById('ra-me-namefield').addEventListener('change', updatePreview);
    document.getElementById('ra-me-seq').addEventListener('change', updatePreview);

    document.getElementById('ra-me-download').addEventListener('click', exportAsCSV);
    document.getElementById('ra-me-download-links').addEventListener('click', generateDownloadLinks);
  }

  var _currentView = 'list';
  function getCurrentView() { return _currentView; }

  function renderMediaList(viewType) {
    _currentView = viewType;
    var listEl = document.getElementById('ra-me-list');
    if (!listEl) return;

    if (viewType === 'grid') {
      listEl.style.display = 'grid';
      listEl.style.gridTemplateColumns = 'repeat(auto-fill, minmax(120px, 1fr))';
      listEl.style.gap = '6px';
      listEl.style.padding = '8px';

      listEl.innerHTML = _mediaData.map(function (m, i) {
        var isSelected = _selectedMedia.has(i);
        var isImage = m.mime.indexOf('image') !== -1;
        return '<div style="position:relative;border:2px solid ' + (isSelected ? '#54a8dc' : '#e2e8f0') + ';border-radius:6px;overflow:hidden;cursor:pointer;aspect-ratio:1;" data-idx="' + i + '" class="ra-me-item">' +
          (isImage
            ? '<img src="' + m.url + '" style="width:100%;height:100%;object-fit:cover;" loading="lazy" onerror="this.style.display=\'none\'">'
            : '<div style="display:flex;align-items:center;justify-content:center;height:100%;background:#f8fafc;font-size:10px;color:#94a3b8;">' + (m.mime.split('/')[1] || 'file') + '</div>') +
          '<div style="position:absolute;top:4px;left:4px;width:18px;height:18px;border-radius:3px;background:' + (isSelected ? '#54a8dc' : 'rgba(255,255,255,0.8)') + ';border:1px solid ' + (isSelected ? '#54a8dc' : '#ccc') + ';display:flex;align-items:center;justify-content:center;">' +
            (isSelected ? '<span style="color:#fff;font-size:12px;">&#10003;</span>' : '') +
          '</div>' +
        '</div>';
      }).join('');
    } else {
      listEl.style.display = 'block';
      listEl.style.gridTemplateColumns = '';
      listEl.style.gap = '';
      listEl.style.padding = '';

      listEl.innerHTML = _mediaData.map(function (m, i) {
        var isSelected = _selectedMedia.has(i);
        var customName = generateName(m, i);
        return '<div style="display:flex;align-items:center;gap:8px;padding:8px 12px;border-bottom:1px solid #f5f5f5;cursor:pointer;background:' + (isSelected ? '#f0f8ff' : '#fff') + ';" data-idx="' + i + '" class="ra-me-item">' +
          '<input type="checkbox"' + (isSelected ? ' checked' : '') + ' style="margin:0;pointer-events:none;">' +
          '<span style="width:30px;text-align:center;color:#94a3b8;font-size:11px;">' + (i + 1) + '</span>' +
          '<div style="flex:1;min-width:0;">' +
            '<div style="font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="' + esc(m.filename) + '">' + esc(m.filename) + '</div>' +
            '<div style="font-size:11px;color:#94a3b8;">&#8594; <strong>' + esc(customName) + '</strong> &middot; ' + esc(m.submittedBy) + '</div>' +
          '</div>' +
          '<span style="font-size:11px;color:#94a3b8;">' + (m.mime.split('/')[1] || '') + '</span>' +
        '</div>';
      }).join('');
    }

    // Click handler for selection
    listEl.addEventListener('click', function (e) {
      var item = e.target.closest('.ra-me-item');
      if (!item) return;
      var idx = parseInt(item.getAttribute('data-idx'));
      if (_selectedMedia.has(idx)) {
        _selectedMedia.delete(idx);
      } else {
        _selectedMedia.add(idx);
      }
      renderMediaList(_currentView);
      updateSelectedCount();
    });
  }

  function generateName(media, index) {
    var prefix = (document.getElementById('ra-me-prefix') || {}).value || '';
    var field = (document.getElementById('ra-me-namefield') || {}).value || '_id';
    var useSeq = ((document.getElementById('ra-me-seq') || {}).value || 'yes') === 'yes';

    var fieldVal = '';
    if (field === '_id') fieldVal = media.subId || index;
    else if (field === '_submitted_by') fieldVal = media.submittedBy;
    else if (field === '_submission_time') fieldVal = (media.time || '').split('T')[0];
    else fieldVal = getFieldValue(media.sub, field);

    fieldVal = String(fieldVal).replace(/[^a-zA-Z0-9_.-]/g, '_').substring(0, 50);

    var ext = media.filename.split('.').pop() || 'jpg';
    var parts = [];
    if (prefix) parts.push(prefix.replace(/[^a-zA-Z0-9_.-]/g, '_'));
    if (fieldVal) parts.push(fieldVal);
    if (useSeq) parts.push(String(index + 1).padStart(3, '0'));

    return (parts.join('_') || 'image_' + (index + 1)) + '.' + ext;
  }

  function updatePreview() {
    var el = document.getElementById('ra-me-preview');
    if (!el || !_mediaData.length) return;
    el.textContent = generateName(_mediaData[0], 0);
    // Also update list to show new names
    if (document.getElementById('ra-me-list') && _currentView === 'list') {
      renderMediaList('list');
    }
  }

  function updateSelectedCount() {
    var el = document.getElementById('ra-me-selected');
    if (el) el.textContent = _selectedMedia.size;
  }

  function exportAsCSV() {
    var selected = Array.from(_selectedMedia).sort();
    if (!selected.length) { alert('Select at least one image'); return; }

    var lines = ['original_filename,download_url,custom_name,submitted_by,submission_time,form'];
    selected.forEach(function (idx) {
      var m = _mediaData[idx];
      var customName = generateName(m, idx);
      lines.push([
        '"' + m.filename.replace(/"/g, '""') + '"',
        '"' + m.url + '"',
        '"' + customName + '"',
        '"' + m.submittedBy + '"',
        '"' + m.time + '"',
        '"' + m.formName + '"'
      ].join(','));
    });

    var blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'media_export_' + selected.length + '_files.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function generateDownloadLinks() {
    var selected = Array.from(_selectedMedia).sort();
    if (!selected.length) { alert('Select at least one image'); return; }

    // Generate an HTML page with download links and renamed files
    var html = '<!DOCTYPE html><html><head><title>Media Downloads</title>' +
      '<style>body{font-family:sans-serif;padding:20px;max-width:800px;margin:0 auto}' +
      'a{color:#54a8dc;display:block;padding:8px 0;border-bottom:1px solid #f0f0f0}' +
      '.info{color:#666;font-size:12px;margin-top:2px}</style></head><body>' +
      '<h1>Media Download Links (' + selected.length + ' files)</h1>' +
      '<p style="color:#666;">Right-click each link and "Save As" with the suggested name, or use a download manager.</p>';

    selected.forEach(function (idx) {
      var m = _mediaData[idx];
      var customName = generateName(m, idx);
      html += '<div><a href="' + m.url + '" download="' + esc(customName) + '">' + esc(customName) + '</a>' +
        '<div class="info">Original: ' + esc(m.filename) + ' &middot; ' + esc(m.submittedBy) + '</div></div>';
    });

    html += '</body></html>';

    var blob = new Blob([html], { type: 'text/html' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'media_download_links.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  // ── Expose globally ──
  window.raMediaExport = {
    run: advancedMediaExport
  };
})();

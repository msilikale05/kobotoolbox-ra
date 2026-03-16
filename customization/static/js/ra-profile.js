/**
 * Resilience Academy - User Profile Menu
 * ========================================
 * Adds a profile dropdown to the user's name in the header.
 * Provides: Edit Profile, Change Password, Logout.
 * UPDATE-PROOF: Loaded via nginx sub_filter; does not modify core files.
 */
(function () {
  'use strict';

  var PROFILE_MENU_ID = 'ra-profile-menu';
  var PROFILE_OVERLAY_ID = 'ra-profile-overlay';

  // ── CSS ──
  var style = document.createElement('style');
  style.textContent = [
    /* Profile trigger in header */
    '.ra-profile-trigger {',
    '  cursor: pointer;',
    '  position: relative;',
    '  display: flex;',
    '  align-items: center;',
    '  gap: 6px;',
    '  padding: 4px 8px;',
    '  border-radius: 6px;',
    '  transition: background 0.15s;',
    '}',
    '.ra-profile-trigger:hover { background: rgba(255,255,255,0.1); }',
    '.ra-profile-trigger__arrow {',
    '  width: 0; height: 0;',
    '  border-left: 4px solid transparent;',
    '  border-right: 4px solid transparent;',
    '  border-top: 5px solid currentColor;',
    '  opacity: 0.6;',
    '}',

    /* Dropdown menu */
    '.ra-profile-dropdown {',
    '  position: absolute;',
    '  top: 100%;',
    '  right: 0;',
    '  margin-top: 4px;',
    '  background: #fff;',
    '  border-radius: 8px;',
    '  box-shadow: 0 8px 30px rgba(0,0,0,0.2);',
    '  min-width: 220px;',
    '  z-index: 9999;',
    '  padding: 6px 0;',
    '  display: none;',
    '}',
    '.ra-profile-dropdown--open { display: block; }',

    /* User info at top */
    '.ra-profile-dropdown__user {',
    '  padding: 12px 16px;',
    '  border-bottom: 1px solid #f0f0f0;',
    '}',
    '.ra-profile-dropdown__name {',
    '  font-size: 14px;',
    '  font-weight: 600;',
    '  color: #1a2a3a;',
    '}',
    '.ra-profile-dropdown__email {',
    '  font-size: 12px;',
    '  color: #888;',
    '  margin-top: 2px;',
    '}',

    /* Menu items */
    '.ra-profile-dropdown__item {',
    '  display: flex;',
    '  align-items: center;',
    '  gap: 10px;',
    '  padding: 10px 16px;',
    '  font-size: 13px;',
    '  color: #333;',
    '  cursor: pointer;',
    '  text-decoration: none;',
    '  border: none;',
    '  background: none;',
    '  width: 100%;',
    '  text-align: left;',
    '}',
    '.ra-profile-dropdown__item:hover { background: #f5f7fa; }',
    '.ra-profile-dropdown__item svg {',
    '  width: 18px;',
    '  height: 18px;',
    '  fill: #666;',
    '  flex-shrink: 0;',
    '}',
    '.ra-profile-dropdown__sep {',
    '  height: 1px;',
    '  background: #f0f0f0;',
    '  margin: 4px 0;',
    '}',
    '.ra-profile-dropdown__item--danger { color: #e74c3c; }',
    '.ra-profile-dropdown__item--danger svg { fill: #e74c3c; }',

    /* Profile edit popup */
    '.ra-profile-popup {',
    '  position: fixed;',
    '  top: 0; left: 0; right: 0; bottom: 0;',
    '  background: rgba(0,0,0,0.5);',
    '  z-index: 99999;',
    '  display: flex;',
    '  align-items: center;',
    '  justify-content: center;',
    '}',
    '.ra-profile-modal {',
    '  background: #fff;',
    '  border-radius: 12px;',
    '  width: 440px;',
    '  max-height: 85vh;',
    '  display: flex;',
    '  flex-direction: column;',
    '  box-shadow: 0 12px 40px rgba(0,0,0,0.3);',
    '}',
    '.ra-profile-modal__header {',
    '  padding: 16px 20px;',
    '  border-bottom: 1px solid #eee;',
    '  display: flex;',
    '  align-items: center;',
    '  justify-content: space-between;',
    '}',
    '.ra-profile-modal__header h3 { margin: 0; font-size: 16px; color: #1a2a3a; }',
    '.ra-profile-modal__close {',
    '  background: none; border: none; font-size: 22px;',
    '  cursor: pointer; color: #999; padding: 4px 8px;',
    '}',
    '.ra-profile-modal__close:hover { color: #333; }',
    '.ra-profile-modal__body {',
    '  padding: 16px 20px;',
    '  overflow-y: auto;',
    '  flex: 1;',
    '}',
    '.ra-profile-modal__field {',
    '  margin-bottom: 14px;',
    '}',
    '.ra-profile-modal__field label {',
    '  display: block;',
    '  font-size: 12px;',
    '  font-weight: 600;',
    '  color: #555;',
    '  margin-bottom: 4px;',
    '}',
    '.ra-profile-modal__field input, .ra-profile-modal__field textarea {',
    '  width: 100%;',
    '  padding: 8px 10px;',
    '  font-size: 13px;',
    '  border: 1px solid #d0d5dd;',
    '  border-radius: 6px;',
    '  box-sizing: border-box;',
    '  font-family: inherit;',
    '}',
    '.ra-profile-modal__field textarea { resize: vertical; min-height: 60px; }',
    '.ra-profile-modal__field input:focus, .ra-profile-modal__field textarea:focus {',
    '  border-color: #54a8dc;',
    '  outline: none;',
    '}',
    '.ra-profile-modal__footer {',
    '  padding: 12px 20px;',
    '  border-top: 1px solid #eee;',
    '  display: flex;',
    '  justify-content: flex-end;',
    '  gap: 8px;',
    '}',
    '.ra-profile-modal__btn {',
    '  padding: 8px 16px;',
    '  border-radius: 6px;',
    '  font-size: 13px;',
    '  cursor: pointer;',
    '  border: 1px solid #d0d5dd;',
    '  background: #fff;',
    '  color: #333;',
    '}',
    '.ra-profile-modal__btn:hover { background: #f5f7fa; }',
    '.ra-profile-modal__btn--primary {',
    '  background: #54a8dc;',
    '  color: #fff;',
    '  border-color: #54a8dc;',
    '}',
    '.ra-profile-modal__btn--primary:hover { background: #3d8abf; }',
    '.ra-profile-modal__status {',
    '  padding: 8px 12px;',
    '  border-radius: 6px;',
    '  font-size: 12px;',
    '  margin-top: 8px;',
    '  display: none;',
    '}',
    '.ra-profile-modal__status--ok { display: block; background: #e8f5e9; color: #2e7d32; }',
    '.ra-profile-modal__status--err { display: block; background: #fbe9e7; color: #c62828; }',

    /* Avatar circle */
    '.ra-profile-avatar {',
    '  width: 28px; height: 28px;',
    '  border-radius: 50%;',
    '  background: #54a8dc;',
    '  color: #fff;',
    '  display: flex;',
    '  align-items: center;',
    '  justify-content: center;',
    '  font-size: 13px;',
    '  font-weight: 600;',
    '  flex-shrink: 0;',
    '}',
    '.ra-profile-avatar--large {',
    '  width: 48px; height: 48px;',
    '  font-size: 20px;',
    '  margin: 0 auto 8px;',
    '}'
  ].join('\n');
  document.head.appendChild(style);

  // ── State ──
  var currentUser = null;

  // ── Fetch current user ──
  function fetchCurrentUser() {
    return fetch('/me/', { credentials: 'same-origin' })
      .then(function (r) {
        if (!r.ok) return null;
        return r.json();
      })
      .then(function (data) {
        currentUser = data;
        return data;
      })
      .catch(function () { return null; });
  }

  // ── Inject profile trigger into header ──
  function injectProfileMenu() {
    // Find the account section in the KoboToolbox header
    var accountBox = document.querySelector('.account-box');
    if (!accountBox) {
      // Try React-rendered header
      accountBox = document.querySelector('[class*="accountSection"], [class*="account-box"]');
    }
    if (!accountBox || document.getElementById(PROFILE_MENU_ID)) return;

    fetchCurrentUser().then(function (user) {
      if (!user || !user.username) return;

      var displayName = (user.extra_details && user.extra_details.name) || user.username;
      var initial = displayName.charAt(0).toUpperCase();
      var email = user.email || '';

      // Create the profile trigger wrapper
      var trigger = document.createElement('div');
      trigger.id = PROFILE_MENU_ID;
      trigger.className = 'ra-profile-trigger';
      trigger.innerHTML =
        '<span class="ra-profile-avatar">' + escapeHtml(initial) + '</span>' +
        '<span class="ra-profile-trigger__arrow"></span>';

      // Create dropdown
      var dropdown = document.createElement('div');
      dropdown.className = 'ra-profile-dropdown';
      dropdown.innerHTML =
        '<div class="ra-profile-dropdown__user">' +
          '<div class="ra-profile-dropdown__name">' + escapeHtml(displayName) + '</div>' +
          '<div class="ra-profile-dropdown__email">' + escapeHtml(email) + '</div>' +
        '</div>' +
        '<button class="ra-profile-dropdown__item" data-action="edit-profile">' +
          '<svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>' +
          'Edit Profile</button>' +
        '<button class="ra-profile-dropdown__item" data-action="change-password">' +
          '<svg viewBox="0 0 24 24"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>' +
          'Change Password</button>' +
        '<div class="ra-profile-dropdown__sep"></div>' +
        '<a class="ra-profile-dropdown__item ra-profile-dropdown__item--danger" href="/accounts/logout/">' +
          '<svg viewBox="0 0 24 24"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg>' +
          'Sign Out</a>';

      trigger.appendChild(dropdown);

      // Toggle dropdown on click
      trigger.addEventListener('click', function (e) {
        e.stopPropagation();
        dropdown.classList.toggle('ra-profile-dropdown--open');
      });

      // Close on outside click
      document.addEventListener('click', function () {
        dropdown.classList.remove('ra-profile-dropdown--open');
      });

      // Action handlers
      dropdown.addEventListener('click', function (e) {
        var action = e.target.closest('[data-action]');
        if (!action) return;
        e.stopPropagation();
        dropdown.classList.remove('ra-profile-dropdown--open');

        var act = action.getAttribute('data-action');
        if (act === 'edit-profile') openEditProfile();
        else if (act === 'change-password') openChangePassword();
      });

      // Insert into header — try to place near the account box
      accountBox.style.display = 'flex';
      accountBox.style.alignItems = 'center';
      accountBox.style.gap = '8px';
      accountBox.appendChild(trigger);
    });
  }

  // ── Edit Profile Popup ──
  function openEditProfile() {
    if (!currentUser) return;

    var extra = currentUser.extra_details || {};
    var overlay = document.createElement('div');
    overlay.className = 'ra-profile-popup';
    overlay.id = PROFILE_OVERLAY_ID;

    var initial = ((extra.name || currentUser.username).charAt(0)).toUpperCase();

    overlay.innerHTML =
      '<div class="ra-profile-modal">' +
        '<div class="ra-profile-modal__header">' +
          '<h3>Edit Profile</h3>' +
          '<button class="ra-profile-modal__close">&times;</button>' +
        '</div>' +
        '<div class="ra-profile-modal__body">' +
          '<div style="text-align:center;margin-bottom:16px;">' +
            '<div class="ra-profile-avatar ra-profile-avatar--large">' + escapeHtml(initial) + '</div>' +
            '<div style="font-size:13px;color:#888;">@' + escapeHtml(currentUser.username) + '</div>' +
          '</div>' +
          '<div class="ra-profile-modal__field">' +
            '<label>Full Name</label>' +
            '<input type="text" id="ra-pf-name" value="' + escapeHtml(extra.name || '') + '" placeholder="Your full name">' +
          '</div>' +
          '<div class="ra-profile-modal__field">' +
            '<label>Organization</label>' +
            '<input type="text" id="ra-pf-org" value="' + escapeHtml(extra.organization || '') + '" placeholder="Your organization">' +
          '</div>' +
          '<div class="ra-profile-modal__field">' +
            '<label>Bio</label>' +
            '<textarea id="ra-pf-bio" placeholder="Tell us about yourself...">' + escapeHtml(extra.bio || '') + '</textarea>' +
          '</div>' +
          '<div class="ra-profile-modal__field">' +
            '<label>City</label>' +
            '<input type="text" id="ra-pf-city" value="' + escapeHtml(extra.city || '') + '" placeholder="Your city">' +
          '</div>' +
          '<div class="ra-profile-modal__field">' +
            '<label>Country</label>' +
            '<input type="text" id="ra-pf-country" value="' + escapeHtml(extra.country || '') + '" placeholder="Your country">' +
          '</div>' +
          '<div class="ra-profile-modal__status" id="ra-pf-status"></div>' +
        '</div>' +
        '<div class="ra-profile-modal__footer">' +
          '<button class="ra-profile-modal__btn" id="ra-pf-cancel">Cancel</button>' +
          '<button class="ra-profile-modal__btn ra-profile-modal__btn--primary" id="ra-pf-save">Save Changes</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(overlay);

    // Close handlers
    overlay.querySelector('.ra-profile-modal__close').addEventListener('click', function () { overlay.remove(); });
    overlay.querySelector('#ra-pf-cancel').addEventListener('click', function () { overlay.remove(); });
    overlay.addEventListener('click', function (e) { if (e.target === overlay) overlay.remove(); });

    // Save handler
    overlay.querySelector('#ra-pf-save').addEventListener('click', function () {
      var statusEl = overlay.querySelector('#ra-pf-status');
      var data = {
        extra_details: {
          name: overlay.querySelector('#ra-pf-name').value.trim(),
          organization: overlay.querySelector('#ra-pf-org').value.trim(),
          bio: overlay.querySelector('#ra-pf-bio').value.trim(),
          city: overlay.querySelector('#ra-pf-city').value.trim(),
          country: overlay.querySelector('#ra-pf-country').value.trim()
        }
      };

      // Get CSRF token
      var csrfToken = getCsrfToken();

      fetch('/me/', {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken
        },
        body: JSON.stringify(data)
      })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (updated) {
        currentUser = updated;
        statusEl.className = 'ra-profile-modal__status ra-profile-modal__status--ok';
        statusEl.textContent = 'Profile updated successfully!';
        // Update the avatar initial and name in dropdown
        var nameEl = document.querySelector('.ra-profile-dropdown__name');
        if (nameEl) {
          var newName = (updated.extra_details && updated.extra_details.name) || updated.username;
          nameEl.textContent = newName;
        }
        setTimeout(function () { overlay.remove(); }, 1500);
      })
      .catch(function (err) {
        statusEl.className = 'ra-profile-modal__status ra-profile-modal__status--err';
        statusEl.textContent = 'Failed to save: ' + err.message;
      });
    });
  }

  // ── Change Password Popup ──
  function openChangePassword() {
    var overlay = document.createElement('div');
    overlay.className = 'ra-profile-popup';

    overlay.innerHTML =
      '<div class="ra-profile-modal">' +
        '<div class="ra-profile-modal__header">' +
          '<h3>Change Password</h3>' +
          '<button class="ra-profile-modal__close">&times;</button>' +
        '</div>' +
        '<div class="ra-profile-modal__body">' +
          '<div class="ra-profile-modal__field">' +
            '<label>Current Password</label>' +
            '<input type="password" id="ra-pw-old" placeholder="Enter current password">' +
          '</div>' +
          '<div class="ra-profile-modal__field">' +
            '<label>New Password</label>' +
            '<input type="password" id="ra-pw-new1" placeholder="Enter new password">' +
          '</div>' +
          '<div class="ra-profile-modal__field">' +
            '<label>Confirm New Password</label>' +
            '<input type="password" id="ra-pw-new2" placeholder="Confirm new password">' +
          '</div>' +
          '<div class="ra-profile-modal__status" id="ra-pw-status"></div>' +
        '</div>' +
        '<div class="ra-profile-modal__footer">' +
          '<button class="ra-profile-modal__btn" id="ra-pw-cancel">Cancel</button>' +
          '<button class="ra-profile-modal__btn ra-profile-modal__btn--primary" id="ra-pw-save">Update Password</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(overlay);

    overlay.querySelector('.ra-profile-modal__close').addEventListener('click', function () { overlay.remove(); });
    overlay.querySelector('#ra-pw-cancel').addEventListener('click', function () { overlay.remove(); });
    overlay.addEventListener('click', function (e) { if (e.target === overlay) overlay.remove(); });

    overlay.querySelector('#ra-pw-save').addEventListener('click', function () {
      var statusEl = overlay.querySelector('#ra-pw-status');
      var oldPw = overlay.querySelector('#ra-pw-old').value;
      var newPw1 = overlay.querySelector('#ra-pw-new1').value;
      var newPw2 = overlay.querySelector('#ra-pw-new2').value;

      if (!oldPw || !newPw1 || !newPw2) {
        statusEl.className = 'ra-profile-modal__status ra-profile-modal__status--err';
        statusEl.textContent = 'All fields are required.';
        return;
      }
      if (newPw1 !== newPw2) {
        statusEl.className = 'ra-profile-modal__status ra-profile-modal__status--err';
        statusEl.textContent = 'New passwords do not match.';
        return;
      }
      if (newPw1.length < 8) {
        statusEl.className = 'ra-profile-modal__status ra-profile-modal__status--err';
        statusEl.textContent = 'Password must be at least 8 characters.';
        return;
      }

      var csrfToken = getCsrfToken();
      var formData = new FormData();
      formData.append('oldpassword', oldPw);
      formData.append('password1', newPw1);
      formData.append('password2', newPw2);

      fetch('/accounts/password/change/', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'X-CSRFToken': csrfToken
        },
        body: formData
      })
      .then(function (r) {
        if (r.ok || r.status === 302) {
          statusEl.className = 'ra-profile-modal__status ra-profile-modal__status--ok';
          statusEl.textContent = 'Password changed successfully!';
          setTimeout(function () { overlay.remove(); }, 1500);
        } else {
          return r.text().then(function (text) {
            // Parse errors from the response
            if (text.indexOf('Please type your current password') !== -1) {
              throw new Error('Current password is incorrect.');
            } else if (text.indexOf('too common') !== -1 || text.indexOf('too short') !== -1) {
              throw new Error('New password is too common or too short.');
            } else {
              throw new Error('Failed to change password.');
            }
          });
        }
      })
      .catch(function (err) {
        statusEl.className = 'ra-profile-modal__status ra-profile-modal__status--err';
        statusEl.textContent = err.message;
      });
    });
  }

  // ── Helpers ──
  function getCsrfToken() {
    var cookie = document.cookie.split(';').find(function (c) {
      return c.trim().indexOf('csrftoken=') === 0;
    });
    return cookie ? cookie.split('=')[1] : '';
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str || ''));
    return div.innerHTML;
  }

  // ── Init ──
  function init() {
    // Only run on authenticated pages (not login/signup)
    if (/\/accounts\/(login|signup)/.test(window.location.pathname)) return;

    // Wait for header to render
    var attempts = 0;
    var interval = setInterval(function () {
      attempts++;
      if (attempts > 30) { clearInterval(interval); return; }

      var accountBox = document.querySelector('.account-box, [class*="accountSection"]');
      if (accountBox && !document.getElementById(PROFILE_MENU_ID)) {
        clearInterval(interval);
        injectProfileMenu();
      }
    }, 500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

/**
 * Resilience Academy - Welcome Dashboard Injection
 * ==================================================
 * Injects a welcome panel with quick links on the KoboToolbox project list page.
 * UPDATE-PROOF: Loaded via nginx sub_filter; does not modify core files.
 */
(function () {
  'use strict';

  var PANEL_ID = 'ra-welcome-panel';
  var MAX_RETRIES = 20;
  var retryCount = 0;
  var BRAND_NAME = 'Ramani Yangu';

  // Override favicon
  (function setFavicon() {
    var link = document.querySelector("link[rel*='icon']") || document.createElement('link');
    link.type = 'image/png';
    link.rel = 'icon';
    link.href = '/custom-static/images/favicon.png';
    document.head.appendChild(link);
  })();

  // Replace header logo with RA logo
  (function overrideLogo() {
    function replaceLogo() {
      // Find the header logo - try multiple selectors for different KPI versions
      var logoSelectors = [
        '.main-header .header__logo',
        '.main-header__logo',
        'a[href="#/"] img',
        'a[href="/"] img',
        'header a img',
        'header svg'
      ];
      var replaced = false;
      logoSelectors.forEach(function (sel) {
        var els = document.querySelectorAll(sel);
        els.forEach(function (el) {
          if (el.tagName === 'IMG') {
            el.src = '/custom-static/images/ra-logo.png';
            el.alt = 'Ramani Yangu';
            replaced = true;
          } else if (el.tagName === 'SVG') {
            el.style.display = 'none';
            var parent = el.parentElement;
            if (parent && !parent.querySelector('.ra-logo-override')) {
              var img = document.createElement('img');
              img.src = '/custom-static/images/ra-logo.png';
              img.alt = 'Ramani Yangu';
              img.className = 'ra-logo-override';
              img.style.cssText = 'height:32px;width:auto;';
              parent.appendChild(img);
              replaced = true;
            }
          }
        });
      });
      return replaced;
    }
    // Try immediately and retry a few times for React rendering
    replaceLogo();
    setTimeout(replaceLogo, 500);
    setTimeout(replaceLogo, 1500);
    setTimeout(replaceLogo, 3000);
    setTimeout(replaceLogo, 5000);
  })();

  // ── Browser title: replace "KoboToolbox" with "Ramani Yangu" ──
  // React dynamically sets document.title, overriding the nginx sub_filter.
  // We use a MutationObserver on the <title> element to catch changes safely.
  (function overrideTitle() {
    function fixTitle() {
      var t = document.title;
      if (t.indexOf('KoboToolbox') !== -1) {
        document.title = t.replace(/KoboToolbox/g, BRAND_NAME);
      }
    }

    // Fix on load
    fixTitle();

    // Watch for React title changes via MutationObserver on <title> element
    var titleEl = document.querySelector('title');
    if (titleEl) {
      var titleObs = new MutationObserver(function () {
        // Only fix if it still contains KoboToolbox (prevents infinite loop)
        if (document.title.indexOf('KoboToolbox') !== -1) {
          fixTitle();
        }
      });
      titleObs.observe(titleEl, { childList: true, characterData: true, subtree: true });
    }

    // Also fix on hash change (SPA navigation)
    window.addEventListener('hashchange', function () {
      setTimeout(fixTitle, 100);
      setTimeout(fixTitle, 500);
    });
  })();

  function isProjectListPage() {
    var hash = window.location.hash;
    return hash === '' || hash === '#/' || hash === '#/forms';
  }

  function createWelcomePanel() {
    if (document.getElementById(PANEL_ID)) return true;

    var target = document.querySelector('.form-view__cell--page-title')
      || document.querySelector('.forms-list')
      || document.querySelector('#kpi-app > div > div');

    if (!target) return false;

    var panel = document.createElement('div');
    panel.id = PANEL_ID;
    panel.innerHTML = [
      '<div class="ra-welcome">',
      '  <div class="ra-welcome__header">',
      '    <h2 class="ra-welcome__title">Welcome to Resilience Academy Data Collection</h2>',
      '    <p class="ra-welcome__subtitle">Collect, manage, and analyze urban resilience data across Tanzania</p>',
      '  </div>',
      '  <div class="ra-welcome__cards">',
      '    <a href="/#/forms" class="ra-welcome__card">',
      '      <div class="ra-welcome__card-icon" role="img" aria-label="Surveys">&#128203;</div>',
      '      <div class="ra-welcome__card-title">My Surveys</div>',
      '      <div class="ra-welcome__card-desc">View and manage your data collection forms</div>',
      '    </a>',
      '    <a href="/#/library" class="ra-welcome__card">',
      '      <div class="ra-welcome__card-icon" role="img" aria-label="Library">&#128218;</div>',
      '      <div class="ra-welcome__card-title">Form Library</div>',
      '      <div class="ra-welcome__card-desc">Browse survey templates and question blocks</div>',
      '    </a>',
      '    <a href="/#/forms" class="ra-welcome__card" data-action="new">',
      '      <div class="ra-welcome__card-icon" role="img" aria-label="New">&#10133;</div>',
      '      <div class="ra-welcome__card-title">New Survey</div>',
      '      <div class="ra-welcome__card-desc">Create a new data collection form</div>',
      '    </a>',
      '    <a href="https://ramaniyangu.com" target="_blank" rel="noopener" class="ra-welcome__card">',
      '      <div class="ra-welcome__card-icon" role="img" aria-label="Portal">&#127758;</div>',
      '      <div class="ra-welcome__card-title">RA Portal</div>',
      '      <div class="ra-welcome__card-desc">Visit the Resilience Academy main site</div>',
      '    </a>',
      '  </div>',
      '</div>'
    ].join('\n');

    target.parentNode.insertBefore(panel, target);
    return true;
  }

  // Style the welcome panel
  var style = document.createElement('style');
  style.textContent = [
    '.ra-welcome {',
    '  max-width: 1200px;',
    '  margin: 24px auto;',
    '  padding: 0 20px;',
    '}',
    '.ra-welcome__header {',
    '  background: linear-gradient(135deg, #1a2a3a 0%, #54a8dc 100%);',
    '  color: #fff;',
    '  padding: 32px 36px;',
    '  border-radius: 8px 8px 0 0;',
    '}',
    '.ra-welcome__title {',
    '  margin: 0 0 8px;',
    '  font-size: 22px;',
    '  font-weight: 600;',
    '}',
    '.ra-welcome__subtitle {',
    '  margin: 0;',
    '  font-size: 14px;',
    '  opacity: 0.9;',
    '}',
    '.ra-welcome__cards {',
    '  display: grid;',
    '  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));',
    '  gap: 16px;',
    '  padding: 20px;',
    '  background: #f7f9fb;',
    '  border-radius: 0 0 8px 8px;',
    '  border: 1px solid #e1e5ea;',
    '  border-top: none;',
    '}',
    '.ra-welcome__card {',
    '  display: block;',
    '  padding: 20px;',
    '  background: #fff;',
    '  border: 1px solid #e1e5ea;',
    '  border-radius: 6px;',
    '  text-decoration: none;',
    '  color: #2c3e50;',
    '  transition: box-shadow 0.2s, border-color 0.2s;',
    '}',
    '.ra-welcome__card:hover {',
    '  border-color: #54a8dc;',
    '  box-shadow: 0 4px 12px rgba(84, 168, 220, 0.15);',
    '  text-decoration: none;',
    '  color: #2c3e50;',
    '}',
    '.ra-welcome__card-icon {',
    '  font-size: 28px;',
    '  margin-bottom: 8px;',
    '}',
    '.ra-welcome__card-title {',
    '  font-size: 15px;',
    '  font-weight: 600;',
    '  margin-bottom: 4px;',
    '}',
    '.ra-welcome__card-desc {',
    '  font-size: 12px;',
    '  color: #6c757d;',
    '}'
  ].join('\n');
  document.head.appendChild(style);

  // Use MutationObserver to detect when React app renders
  function waitForApp(callback) {
    var app = document.getElementById('kpi-app');
    if (!app) {
      // App container not yet in DOM, wait for it
      var bodyObserver = new MutationObserver(function (mutations, obs) {
        var el = document.getElementById('kpi-app');
        if (el) {
          obs.disconnect();
          observeApp(el, callback);
        }
      });
      bodyObserver.observe(document.body, { childList: true, subtree: true });
      return;
    }
    observeApp(app, callback);
  }

  function observeApp(app, callback) {
    // If content is already rendered, inject immediately
    if (callback()) return;

    var observer = new MutationObserver(function (mutations, obs) {
      retryCount++;
      if (callback() || retryCount > MAX_RETRIES) {
        obs.disconnect();
      }
    });
    observer.observe(app, { childList: true, subtree: true });
  }

  function tryInject() {
    if (!isProjectListPage()) return false;
    return createWelcomePanel();
  }

  // Initial injection
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      waitForApp(tryInject);
    });
  } else {
    waitForApp(tryInject);
  }

  // Re-inject on SPA navigation
  window.addEventListener('hashchange', function () {
    var existing = document.getElementById(PANEL_ID);
    if (existing) existing.remove();
    retryCount = 0;
    if (isProjectListPage()) {
      waitForApp(tryInject);
    }
  });

  // ── Login page: "Remember me" checkbox ──
  (function rememberMe() {
    if (!/\/accounts\/login\/?$/.test(window.location.pathname)) return;

    function inject() {
      var form = document.querySelector('form.registration--login');
      if (!form || form.querySelector('.ra-remember-me')) return;

      var submitBtn = form.querySelector('button[type="submit"]');
      if (!submitBtn) return;

      var wrapper = document.createElement('div');
      wrapper.className = 'ra-remember-me';
      wrapper.style.cssText = 'display:flex;align-items:center;margin:12px 0 4px;';
      wrapper.innerHTML =
        '<label style="display:flex;align-items:center;cursor:pointer;font-size:13px;color:#2c3e50;gap:8px;user-select:none;">' +
        '<input type="checkbox" name="remember" checked style="width:16px;height:16px;accent-color:#54a8dc;cursor:pointer;">' +
        'Remember me</label>';

      submitBtn.parentNode.insertBefore(wrapper, submitBtn);
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', inject);
    } else {
      inject();
    }
  })();

  // ── Auth pages: add contact info + navigation links ──
  (function authPageFooter() {
    if (!/\/accounts\/(login|signup|password)/.test(window.location.pathname)) return;

    function inject() {
      var reg = document.querySelector('.registration');
      if (!reg || reg.querySelector('.ra-auth-footer')) return;

      var footer = document.createElement('div');
      footer.className = 'ra-auth-footer';
      footer.style.cssText = 'text-align:center;margin-top:20px;padding-top:16px;border-top:1px solid #e2e8f0;';

      var isLogin = /\/login\/?$/.test(window.location.pathname);

      var html = '';
      if (!isLogin) html += '<a href="/accounts/login/" class="ra-auth-btn">Log In</a>';
      html += '<div style="font-size:12px;color:#64748b;margin-top:12px;">Need help? <a href="mailto:info@ramaniyangu.com" style="color:#3d8abf;text-decoration:none;font-weight:500;">info@ramaniyangu.com</a></div>';

      footer.innerHTML = html;

      reg.appendChild(footer);
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', inject);
    } else {
      inject();
    }
  })();

  // ── Custom Access Denied / 404 page ──
  function customizeAccessDenied() {
    var el = document.querySelector('.access-denied');
    if (!el || el.getAttribute('data-ra-custom')) return;
    el.setAttribute('data-ra-custom', 'true');

    // REMOVE (not just hide) all navigation, menus, tabs, sidebar from the DOM
    var removeSelectors = [
      'nav',
      '.k-drawer',
      '[class*="drawer"]',
      '[class*="form-view__tab"]',
      '[class*="toptabs"]',
      '[class*="sidebar"]',
      '[class*="page-title"]',
      '.form-view__sidetabs',
      '#ra-welcome-panel',
      '#ra-leaderboard-page',
      '#ra-map-page',
      '#ra-settings-page'
    ];
    removeSelectors.forEach(function (sel) {
      var els = document.querySelectorAll(sel);
      els.forEach(function (e) { e.remove(); });
    });

    // Also add body class for any CSS-based hiding
    document.body.classList.add('ra-access-denied-active');

    // Make the access-denied page full-screen centered
    el.style.cssText = 'position:fixed;top:64px;left:0;right:0;bottom:0;z-index:1000;background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:40px 20px;';

    // Update support link
    var links = el.querySelectorAll('a');
    for (var i = 0; i < links.length; i++) {
      if (links[i].textContent.indexOf('contact') !== -1 || links[i].textContent.indexOf('support') !== -1) {
        links[i].href = 'mailto:info@ramaniyangu.com';
        links[i].textContent = 'contact the support team';
      }
    }

    // Update body text
    var body = el.querySelector('.access-denied__body');
    if (body) {
      body.innerHTML = 'Either you don\'t have access to this page or it doesn\'t exist. ' +
        'Please try <a href="/accounts/login/">logging in</a> or ' +
        '<a href="mailto:info@ramaniyangu.com">contact the support team</a> if you think this is an error.';
    }

    // Add buttons
    if (!el.querySelector('.ra-ad-btns')) {
      var btns = document.createElement('div');
      btns.className = 'ra-ad-btns';
      btns.style.cssText = 'display:flex;gap:12px;justify-content:center;margin-top:20px;';
      btns.innerHTML =
        '<a href="/" style="display:inline-block;padding:12px 28px;background:#54a8dc;color:#fff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:600;">Go to Home</a>' +
        '<a href="mailto:info@ramaniyangu.com" style="display:inline-block;padding:12px 28px;background:#f1f5f9;color:#475569;text-decoration:none;border-radius:6px;font-size:14px;font-weight:600;">Contact Support</a>';
      el.appendChild(btns);
    }
  }

  // Poll for access-denied page (React renders async)
  setInterval(customizeAccessDenied, 1000);

  // ── Remove help/support elements from DOM (not just hidden) ──
  function removeHelpElements() {
    var selectors = [
      '.intercom-lightweight-app',
      '.intercom-lightweight-app-launcher',
      '[class*="intercom"]',
      '[class*="help-bubble"]',
      '[class*="helpBubble"]',
      '.help-bubble',
      '.kobo-help-icon',
      '.main-header__help',
      '[data-tip="Help"]',
      'iframe[title*="Intercom"]',
      'iframe[src*="intercom"]'
    ];
    selectors.forEach(function (sel) {
      var els = document.querySelectorAll(sel);
      els.forEach(function (el) { el.remove(); });
    });
  }
  removeHelpElements();
  setInterval(removeHelpElements, 2000);

  // ── Announcement Banner System ──
  (function announcementBanner() {
    // Skip login/signup pages
    if (/\/accounts\/(login|signup|password)/.test(window.location.pathname)) return;

    var BANNER_CONTAINER_ID = 'ra-announcement-banners';
    var DISMISSED_KEY = 'ra_dismissed_announcements';
    var POLL_MS = 120000; // re-fetch every 2 minutes

    // Announcement banner styles
    var annStyle = document.createElement('style');
    annStyle.textContent = [
      '#' + BANNER_CONTAINER_ID + ' {',
      '  position: fixed;',
      '  top: 64px;',
      '  left: 0;',
      '  right: 0;',
      '  z-index: 1050;',
      '  display: flex;',
      '  flex-direction: column;',
      '  pointer-events: none;',
      '}',
      '.ra-ann-banner {',
      '  display: flex;',
      '  align-items: center;',
      '  justify-content: space-between;',
      '  padding: 10px 20px;',
      '  font-size: 13px;',
      '  line-height: 1.4;',
      '  pointer-events: auto;',
      '  animation: ra-ann-slide-in 0.3s ease-out;',
      '}',
      '.ra-ann-banner--info {',
      '  background: #eff6ff;',
      '  color: #1e40af;',
      '  border-bottom: 1px solid #bfdbfe;',
      '}',
      '.ra-ann-banner--warning {',
      '  background: #fffbeb;',
      '  color: #92400e;',
      '  border-bottom: 1px solid #fde68a;',
      '}',
      '.ra-ann-banner--urgent {',
      '  background: #fef2f2;',
      '  color: #991b1b;',
      '  border-bottom: 1px solid #fecaca;',
      '}',
      '.ra-ann-banner__content {',
      '  display: flex;',
      '  align-items: center;',
      '  gap: 10px;',
      '  flex: 1;',
      '  min-width: 0;',
      '}',
      '.ra-ann-banner__title {',
      '  font-weight: 700;',
      '  white-space: nowrap;',
      '}',
      '.ra-ann-banner__message {',
      '  overflow: hidden;',
      '  text-overflow: ellipsis;',
      '  white-space: nowrap;',
      '}',
      '.ra-ann-banner__close {',
      '  background: none;',
      '  border: none;',
      '  cursor: pointer;',
      '  font-size: 18px;',
      '  opacity: 0.5;',
      '  padding: 0 4px;',
      '  line-height: 1;',
      '  color: inherit;',
      '  flex-shrink: 0;',
      '}',
      '.ra-ann-banner__close:hover { opacity: 1; }',
      '@keyframes ra-ann-slide-in {',
      '  from { transform: translateY(-100%); opacity: 0; }',
      '  to { transform: translateY(0); opacity: 1; }',
      '}'
    ].join('\n');
    document.head.appendChild(annStyle);

    function getDismissed() {
      try {
        return JSON.parse(sessionStorage.getItem(DISMISSED_KEY)) || {};
      } catch (e) { return {}; }
    }

    function setDismissed(id) {
      var d = getDismissed();
      d[id] = true;
      try { sessionStorage.setItem(DISMISSED_KEY, JSON.stringify(d)); } catch (e) {}
    }

    function fetchAnnouncements() {
      fetch('/webhook-api/announcements', { credentials: 'same-origin' })
        .then(function (r) {
          if (!r.ok) throw new Error('not ok');
          return r.json();
        })
        .then(function (data) {
          renderBanners(data.announcements || []);
        })
        .catch(function () {
          // Try local dev fallback
          fetch('http://localhost:5050/api/announcements')
            .then(function (r) { return r.json(); })
            .then(function (data) { renderBanners(data.announcements || []); })
            .catch(function () { /* silently fail */ });
        });
    }

    function renderBanners(announcements) {
      var container = document.getElementById(BANNER_CONTAINER_ID);
      if (!container) {
        container = document.createElement('div');
        container.id = BANNER_CONTAINER_ID;
        document.body.appendChild(container);
      }
      container.innerHTML = '';

      var dismissed = getDismissed();

      announcements.forEach(function (a) {
        if (dismissed[a.id]) return;

        var typeClass = 'ra-ann-banner--' + (a.type || 'info');
        var typeIcon = a.type === 'urgent' ? '&#9888;' : a.type === 'warning' ? '&#9888;' : '&#8505;';

        var banner = document.createElement('div');
        banner.className = 'ra-ann-banner ' + typeClass;
        banner.innerHTML =
          '<div class="ra-ann-banner__content">' +
            '<span>' + typeIcon + '</span>' +
            '<span class="ra-ann-banner__title">' + escapeHtmlBanner(a.title) + '</span>' +
            '<span class="ra-ann-banner__message">' + escapeHtmlBanner(a.message) + '</span>' +
          '</div>' +
          '<button class="ra-ann-banner__close" title="Dismiss">&times;</button>';

        banner.querySelector('.ra-ann-banner__close').addEventListener('click', function () {
          setDismissed(a.id);
          banner.style.animation = 'none';
          banner.style.transition = 'opacity 0.2s, max-height 0.2s';
          banner.style.opacity = '0';
          banner.style.maxHeight = '0';
          banner.style.overflow = 'hidden';
          banner.style.padding = '0 20px';
          setTimeout(function () { banner.remove(); }, 250);
        });

        container.appendChild(banner);
      });
    }

    function escapeHtmlBanner(str) {
      var div = document.createElement('div');
      div.appendChild(document.createTextNode(str || ''));
      return div.innerHTML;
    }

    // Initial fetch after page loads
    function initBanners() {
      setTimeout(fetchAnnouncements, 1500);
      setInterval(fetchAnnouncements, POLL_MS);
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initBanners);
    } else {
      initBanners();
    }
  })();

  // ── Logout Confirmation Modal (matches login page design) ──
  (function logoutConfirmation() {
    if (/\/accounts\/(login|signup|password)/.test(window.location.pathname)) return;

    function getCSRF() {
      var match = document.cookie.match(/csrftoken=([^;]+)/);
      return match ? match[1] : '';
    }

    function doLogoutPost() {
      var form = document.createElement('form');
      form.method = 'POST';
      form.action = '/accounts/logout/';
      form.style.display = 'none';
      var inp = document.createElement('input');
      inp.type = 'hidden';
      inp.name = 'csrfmiddlewaretoken';
      inp.value = getCSRF();
      form.appendChild(inp);
      document.body.appendChild(form);
      form.submit();
    }

    function showLogoutModal() {
      var existing = document.getElementById('ra-logout-modal');
      if (existing) existing.remove();

      var overlay = document.createElement('div');
      overlay.id = 'ra-logout-modal';
      overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(26,42,58,0.6);z-index:2147483646;display:flex;align-items:center;justify-content:center;animation:ra-lo-fi 0.2s ease;';

      overlay.innerHTML =
        '<style>@keyframes ra-lo-fi{from{opacity:0}to{opacity:1}}@keyframes ra-lo-si{from{transform:translateY(16px);opacity:0}to{transform:translateY(0);opacity:1}}</style>' +
        '<div style="background:rgba(255,255,255,0.95);border-radius:8px;width:380px;max-width:90vw;box-shadow:0 8px 32px rgba(0,0,0,0.3);overflow:hidden;animation:ra-lo-si 0.25s ease;text-align:center;">' +
          // Logo section — matches login page
          '<div style="padding:28px 24px 12px;">' +
            '<img src="/custom-static/images/ra-logo-dark.png" alt="Ramani Yangu" style="width:200px;height:auto;margin:0 auto 10px;display:block;">' +
            '<p style="font-size:13px;color:#64748b;margin:0;font-weight:500;">Data Collection Platform</p>' +
          '</div>' +
          // Content
          '<div style="padding:16px 28px 28px;">' +
            '<h3 style="margin:0 0 8px;font-size:18px;font-weight:700;color:#1a2a3a;">Log out of your account?</h3>' +
            '<p style="margin:0 0 24px;font-size:13px;color:#94a3b8;line-height:1.5;">You will need to sign in again to access the platform.</p>' +
            '<div style="display:flex;gap:10px;">' +
              '<button id="ra-logout-cancel" style="flex:1;padding:11px;border-radius:4px;font-size:14px;font-weight:600;cursor:pointer;border:1px solid #ccc;background:#fff;color:#475569;font-family:inherit;transition:background 0.15s;">Cancel</button>' +
              '<button id="ra-logout-confirm" style="flex:1;padding:11px;border-radius:4px;font-size:14px;font-weight:600;cursor:pointer;border:none;background:#54a8dc;color:#fff;font-family:inherit;transition:background 0.15s;">Log Out</button>' +
            '</div>' +
          '</div>' +
        '</div>';

      document.body.appendChild(overlay);

      overlay.querySelector('#ra-logout-cancel').addEventListener('click', function () { overlay.remove(); });
      overlay.addEventListener('click', function (e) { if (e.target === overlay) overlay.remove(); });
      var escH = function (e) { if (e.key === 'Escape') { overlay.remove(); document.removeEventListener('keydown', escH); } };
      document.addEventListener('keydown', escH);
      overlay.querySelector('#ra-logout-confirm').addEventListener('click', function () {
        this.textContent = 'Logging out...';
        this.disabled = true;
        doLogoutPost();
      });
    }

    // Intercept all logout link clicks globally
    document.addEventListener('click', function (e) {
      var link = e.target.closest('a[href*="/accounts/logout"], a[href*="logout"]');
      if (!link) return;
      var href = link.getAttribute('href') || '';
      if (href.indexOf('logout') === -1) return;
      if (link.closest('#ra-logout-modal')) return;
      e.preventDefault();
      e.stopPropagation();
      showLogoutModal();
    }, true);

    // Intercept logout buttons
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('button');
      if (!btn) return;
      var text = (btn.textContent || '').trim().toLowerCase();
      if (text === 'logout' || text === 'log out' || text === 'sign out') {
        if (btn.closest('#ra-logout-modal')) return;
        e.preventDefault();
        e.stopPropagation();
        showLogoutModal();
      }
    }, true);

    window.__raShowLogoutModal = showLogoutModal;
  })();

  // ── Global Avatar URL Helper ──
  window.__raAvatarUrl = function (username) {
    return '/webhook-api/avatar/' + encodeURIComponent(username) + '?v=' + Date.now();
  };

  // ── Inactive Account Detection (Pending Approval) ──
  // Detects when a user tries to log in but their account is inactive (pending approval).
  // KoboToolbox/allauth shows various messages for inactive accounts. We intercept these
  // and show our branded "Pending Approval" overlay instead.
  (function pendingApprovalDetection() {
    // Only run on login page
    if (!/\/accounts\/login\/?/.test(window.location.pathname)) return;

    // Patterns that indicate an inactive/unverified account
    var INACTIVE_PATTERNS = [
      'not yet activated',
      'account is inactive',
      'account has been deactivated',
      'not active',
      'account is not active',
      'this account is inactive',
      'please activate your account',
      'account has not been activated',
      'unable to log in with provided credentials'
    ];

    function isInactiveMessage(text) {
      var lower = (text || '').toLowerCase();
      for (var i = 0; i < INACTIVE_PATTERNS.length; i++) {
        if (lower.indexOf(INACTIVE_PATTERNS[i]) !== -1) return true;
      }
      return false;
    }

    function showPendingApprovalOverlay() {
      // Avoid duplicates
      if (document.getElementById('ra-pending-approval-overlay')) return;

      var overlay = document.createElement('div');
      overlay.id = 'ra-pending-approval-overlay';
      overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(241,245,249,0.98);z-index:2147483647;display:flex;align-items:center;justify-content:center;animation:ra-pa-fi 0.3s ease;';

      overlay.innerHTML =
        '<style>' +
          '@keyframes ra-pa-fi{from{opacity:0}to{opacity:1}}' +
          '@keyframes ra-pa-si{from{transform:translateY(16px);opacity:0}to{transform:translateY(0);opacity:1}}' +
        '</style>' +
        '<div style="background:#fff;border-radius:12px;width:460px;max-width:92vw;box-shadow:0 8px 32px rgba(0,0,0,0.15);overflow:hidden;animation:ra-pa-si 0.3s ease;text-align:center;">' +
          '<!-- Header -->' +
          '<div style="background:linear-gradient(135deg,#1a2a3a 0%,#54a8dc 100%);padding:28px 24px 20px;">' +
            '<img src="/custom-static/images/ra-logo.png" alt="Ramani Yangu" style="height:44px;width:auto;margin-bottom:12px;">' +
            '<p style="margin:0;color:rgba(255,255,255,0.8);font-size:12px;font-weight:500;">Data Collection Platform</p>' +
          '</div>' +
          '<div style="height:4px;background:linear-gradient(90deg,#54a8dc,#1a2a3a);"></div>' +
          '<!-- Content -->' +
          '<div style="padding:28px 32px 8px;">' +
            '<div style="width:64px;height:64px;background:linear-gradient(135deg,#f59e0b,#d97706);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;box-shadow:0 4px 12px rgba(245,158,11,0.3);">' +
              '<svg viewBox="0 0 24 24" width="32" height="32" fill="#fff"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-2h2v2h-2zm0-4V7h2v6h-2z"/></svg>' +
            '</div>' +
            '<h2 style="margin:0 0 10px;font-size:20px;font-weight:700;color:#1e293b;">Account Pending Approval</h2>' +
            '<p style="margin:0 0 8px;font-size:14px;color:#64748b;line-height:1.6;">Your registration has been received. An administrator will review your account shortly.</p>' +
            '<p style="margin:0 0 20px;font-size:12px;color:#94a3b8;line-height:1.5;">This typically takes 1-2 business days. For urgent access, contact <a href="mailto:info@ramaniyangu.com" style="color:#54a8dc;text-decoration:none;font-weight:600;">info@ramaniyangu.com</a></p>' +
          '</div>' +
          '<!-- Steps -->' +
          '<div style="margin:0 32px 20px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px 20px;text-align:left;">' +
            '<p style="margin:0 0 10px;font-size:11px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:0.5px;">What happens next?</p>' +
            '<div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:8px;">' +
              '<span style="display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;min-width:20px;background:#eff6ff;color:#3b82f6;border-radius:50%;font-size:10px;font-weight:700;">1</span>' +
              '<span style="font-size:12px;color:#64748b;">Your request has been sent to the administrators.</span>' +
            '</div>' +
            '<div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:8px;">' +
              '<span style="display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;min-width:20px;background:#eff6ff;color:#3b82f6;border-radius:50%;font-size:10px;font-weight:700;">2</span>' +
              '<span style="font-size:12px;color:#64748b;">An admin will review and verify your information.</span>' +
            '</div>' +
            '<div style="display:flex;align-items:flex-start;gap:10px;">' +
              '<span style="display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;min-width:20px;background:#eff6ff;color:#3b82f6;border-radius:50%;font-size:10px;font-weight:700;">3</span>' +
              '<span style="font-size:12px;color:#64748b;">Once approved, you can log in and use the platform.</span>' +
            '</div>' +
          '</div>' +
          '<!-- Buttons -->' +
          '<div style="padding:0 32px 28px;display:flex;gap:10px;">' +
            '<a href="/accounts/login/" id="ra-pa-back" style="flex:1;display:inline-block;padding:11px;border-radius:6px;font-size:14px;font-weight:600;text-decoration:none;background:#54a8dc;color:#fff;text-align:center;transition:background 0.15s;">Back to Login</a>' +
            '<a href="mailto:info@ramaniyangu.com" style="flex:1;display:inline-block;padding:11px;border-radius:6px;font-size:14px;font-weight:600;text-decoration:none;background:#1a2a3a;color:#fff;text-align:center;transition:background 0.15s;">Contact Support</a>' +
          '</div>' +
        '</div>';

      document.body.appendChild(overlay);

      // "Back to Login" just removes the overlay and clears the form
      var backBtn = overlay.querySelector('#ra-pa-back');
      if (backBtn) {
        backBtn.addEventListener('click', function (e) {
          e.preventDefault();
          overlay.remove();
          // Clear form errors
          var errors = document.querySelectorAll('.errorlist, .alert, .messages li');
          for (var i = 0; i < errors.length; i++) errors[i].remove();
          // Clear password field
          var pwField = document.querySelector('input[type="password"]');
          if (pwField) pwField.value = '';
        });
      }
    }

    function checkForInactiveErrors() {
      // Check Django/allauth error messages
      var errorElements = document.querySelectorAll(
        '.errorlist li, .alert, .messages li, .login-form__messages, ' +
        '.registration__error, .registration .errorlist, ' +
        'form .errorlist li, .non-field-errors li, .form-error, ' +
        '[class*="error"] li, [class*="message"] li'
      );

      for (var i = 0; i < errorElements.length; i++) {
        var text = errorElements[i].textContent || errorElements[i].innerText || '';
        if (isInactiveMessage(text)) {
          showPendingApprovalOverlay();
          return true;
        }
      }
      return false;
    }

    // Check immediately (page may have been rendered with errors)
    function init() {
      checkForInactiveErrors();

      // Also observe for dynamically added error messages (after form submit via AJAX)
      var form = document.querySelector('form.registration--login') ||
                 document.querySelector('form[action*="login"]') ||
                 document.querySelector('.registration form');

      if (form) {
        var observer = new MutationObserver(function () {
          checkForInactiveErrors();
        });
        observer.observe(form.parentElement || form, { childList: true, subtree: true });
      }

      // Also observe body for any error messages
      var bodyObserver = new MutationObserver(function () {
        checkForInactiveErrors();
      });
      bodyObserver.observe(document.body, { childList: true, subtree: true });
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  })();

  // ── Post-Signup Notification ──
  // After a successful signup, notify the webhook-relay so admin gets an email immediately.
  (function postSignupNotify() {
    // Only run on signup success/confirmation pages
    if (!/\/accounts\/signup\/?/.test(window.location.pathname) &&
        !/\/accounts\/confirm/.test(window.location.pathname) &&
        !/\/accounts\/inactive/.test(window.location.pathname)) return;

    function checkAndNotify() {
      // Look for success messages or "check your email" type content
      var pageText = (document.body.textContent || '').toLowerCase();
      var isPostSignup = pageText.indexOf('verification') !== -1 ||
                         pageText.indexOf('confirm') !== -1 ||
                         pageText.indexOf('check your') !== -1 ||
                         pageText.indexOf('account has been created') !== -1 ||
                         pageText.indexOf('signed up') !== -1;

      if (!isPostSignup) return;

      // Already notified this session?
      var notifiedKey = 'ra_signup_notified';
      if (sessionStorage.getItem(notifiedKey)) return;

      // Extract username from page if possible, or from a cookie/field
      var username = '';
      var email = '';

      // Try to find the username from form fields or page content
      var usernameField = document.querySelector('input[name="username"]');
      var emailField = document.querySelector('input[name="email"]');
      if (usernameField) username = usernameField.value;
      if (emailField) email = emailField.value;

      if (!username && !email) return;

      // Send notification to webhook-relay
      var payload = JSON.stringify({
        username: username,
        email: email,
        extra_details: {}
      });

      var urls = ['/webhook-api/user-registered', 'http://localhost:5050/api/user-registered'];
      function tryUrl(idx) {
        if (idx >= urls.length) return;
        var xhr = new XMLHttpRequest();
        xhr.open('POST', urls[idx], true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.onreadystatechange = function () {
          if (xhr.readyState === 4) {
            if (xhr.status === 200) {
              sessionStorage.setItem(notifiedKey, 'true');
            } else if (idx + 1 < urls.length) {
              tryUrl(idx + 1);
            }
          }
        };
        xhr.send(payload);
      }
      tryUrl(0);
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () {
        setTimeout(checkAndNotify, 1000);
      });
    } else {
      setTimeout(checkAndNotify, 1000);
    }
  })();

})();

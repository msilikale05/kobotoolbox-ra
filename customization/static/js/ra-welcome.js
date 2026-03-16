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

  // Title is managed by the interceptor in ra-dashboard-view.js (non-deferred).
  // That interceptor uses window.__raGetPageName() which we update here for form-specific titles.
  // We only need to handle hashchange for form-specific page names.
  (function overrideTitle() {
    // Update __raGetPageName to handle form-specific titles (needs React's title)
    var origGetPageName = window.__raGetPageName;
    if (origGetPageName) {
      window.__raGetPageName = function () {
        var hash = window.location.hash;
        if (hash.indexOf('#/forms/') === 0) {
          // For individual form pages, try to extract form name from React's intended title
          var titleEl = document.querySelector('title');
          var raw = titleEl ? titleEl.textContent : '';
          var parts = raw.replace(/KoboToolbox/gi, '').replace(/\s*\|\s*/g, '|').split('|')
            .filter(function (s) { return s.trim() && s.trim() !== BRAND_NAME && s.trim() !== 'Loading...'; });
          return parts.length ? parts[0].trim() : null;
        }
        return origGetPageName();
      };
    }
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
})();

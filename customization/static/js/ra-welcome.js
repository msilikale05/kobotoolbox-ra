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

  // Persistently override the browser tab title with page context
  (function overrideTitle() {
    function getPageName() {
      var hash = window.location.hash;
      if (hash === '#/leaderboard') return 'Leaderboard';
      if (hash.indexOf('#/library') === 0) return 'Library';
      if (hash.indexOf('#/forms/') === 0) {
        // For form pages, extract name from the existing title if KPI set it
        var current = document.title
          .replace(/KoboToolbox/gi, '')
          .replace(/\s*\|\s*/g, '|')
          .split('|')
          .filter(function (s) { return s.trim() && s.trim() !== BRAND_NAME; });
        return current.length ? current[0].trim() : null;
      }
      if (hash === '' || hash === '#/' || hash.indexOf('#/projects') === 0 || hash.indexOf('#/forms') === 0) return 'Projects';
      return null;
    }

    function setTitle() {
      var pageName = getPageName();

      // Always remove KoboToolbox from the title
      if (document.title.indexOf('KoboToolbox') !== -1) {
        document.title = document.title.replace(/KoboToolbox/gi, BRAND_NAME);
      }

      // If leaderboard script already set the title, don't override
      if (document.title.indexOf('Leaderboard | ' + BRAND_NAME) !== -1) return;

      if (pageName) {
        document.title = pageName + ' | ' + BRAND_NAME;
      } else if (document.title.indexOf(BRAND_NAME) === -1) {
        document.title = BRAND_NAME;
      }
    }
    setTitle();
    var titleEl = document.querySelector('title');
    if (titleEl) {
      new MutationObserver(setTitle).observe(titleEl, { childList: true });
    } else {
      document.addEventListener('DOMContentLoaded', function () {
        setTitle();
        var t = document.querySelector('title');
        if (t) new MutationObserver(setTitle).observe(t, { childList: true });
      });
    }
    // Update title on navigation
    window.addEventListener('hashchange', function () {
      setTimeout(setTitle, 200);
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
      '    <a href="https://resilienceacademy.ac.tz" target="_blank" rel="noopener" class="ra-welcome__card">',
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
})();

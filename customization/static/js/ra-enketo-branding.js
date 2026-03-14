/**
 * Resilience Academy - Enketo Form Branding
 * ==========================================
 * Injected via nginx sub_filter. Provides:
 *   - Banner with dark overlay and form title
 *   - Per-form banner via form media (upload banner.jpg)
 *   - Thank you overlay with logos after submission
 *   - Per-form thank you logo via form media (upload thankyou-logo.png)
 *
 * UPDATE-PROOF: Loaded via nginx sub_filter; does not modify core files.
 *
 * Form Media Convention:
 *   - Upload "banner.jpg" as form media → used as banner background
 *   - Upload "thankyou-logo.png" as form media → shown on thank you page
 *   - If not uploaded, defaults are used
 */
(function () {
  'use strict';

  var RA_LOGO = '/custom-static/images/ra-logo-dark.png';
  var DEFAULT_BANNER = '/custom-static/images/default-banner.jpg';
  var BANNER_ID = 'ra-form-banner';

  // Only run on form pages (not API endpoints or error pages)
  function isFormPage() {
    return !!document.querySelector('form.or') || !!document.querySelector('.main');
  }

  // ========================================================================
  // FORM MEDIA DETECTION
  // ========================================================================

  /**
   * Try to find the media base path for this form.
   * Enketo serves form media at paths like:
   *   /media/get/{hash}/{filename}
   *   /x/media/get/{hash}/{filename}
   *   /preview/media/get/{hash}/{filename}
   * We scan existing media elements to find the pattern.
   */
  function findMediaBasePath() {
    var imgs = document.querySelectorAll('form.or img[src*="/media/get/"]');
    for (var i = 0; i < imgs.length; i++) {
      var src = imgs[i].getAttribute('src');
      var match = src.match(/(.*\/media\/get\/[^/]+\/)/);
      if (match) return match[1];
    }

    // Try source elements too (audio/video)
    var sources = document.querySelectorAll('form.or source[src*="/media/get/"]');
    for (var j = 0; j < sources.length; j++) {
      var ssrc = sources[j].getAttribute('src');
      var smatch = ssrc.match(/(.*\/media\/get\/[^/]+\/)/);
      if (smatch) return smatch[1];
    }

    // Fallback: try to construct from URL path
    var path = window.location.pathname;
    // /x/FORMID → /x/media/get/0/
    // /preview/FORMID → /preview/media/get/0/
    var pathMatch = path.match(/^(\/(?:x|preview|single|i)\/)/);
    if (pathMatch) {
      return pathMatch[1] + 'media/get/0/';
    }

    return null;
  }

  /**
   * Check if a URL exists (returns 200) via HEAD request
   */
  function checkMediaExists(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('HEAD', url, true);
    xhr.onload = function () {
      callback(xhr.status >= 200 && xhr.status < 400);
    };
    xhr.onerror = function () {
      callback(false);
    };
    xhr.send();
  }

  // ========================================================================
  // BANNER
  // ========================================================================

  function createBanner() {
    if (document.getElementById(BANNER_ID)) return;

    var formTitle = '';
    var titleEl = document.getElementById('form-title');
    if (titleEl) {
      formTitle = titleEl.textContent.trim();
    }

    var banner = document.createElement('div');
    banner.id = BANNER_ID;
    banner.className = 'ra-form-banner';

    var title = document.createElement('h1');
    title.className = 'ra-form-banner__title';
    title.textContent = formTitle || 'Data Collection Form';
    banner.appendChild(title);

    // Insert banner at the top of the form
    var header = document.querySelector('.form-header');
    if (header && header.parentNode) {
      header.parentNode.insertBefore(banner, header);
      document.body.classList.add('ra-has-banner');
    }

    // Check for custom banner image from form media
    var mediaBase = findMediaBasePath();
    if (mediaBase) {
      var bannerUrl = mediaBase + 'banner.jpg';
      checkMediaExists(bannerUrl, function (exists) {
        if (exists) {
          banner.style.backgroundImage = 'url(' + bannerUrl + ')';
        }
      });
    }
  }

  // ========================================================================
  // THANK YOU OVERLAY
  // ========================================================================

  var thankyouLogoUrl = null; // Will be set if form media has thankyou-logo.png

  function showThankYou() {
    if (document.querySelector('.ra-thankyou-overlay')) return;

    var overlay = document.createElement('div');
    overlay.className = 'ra-thankyou-overlay';

    var content = document.createElement('div');
    content.className = 'ra-thankyou__content';

    // RA Logo
    var logo = document.createElement('img');
    logo.src = RA_LOGO;
    logo.alt = 'Resilience Academy';
    logo.className = 'ra-thankyou__logo';
    content.appendChild(logo);

    // Title
    var title = document.createElement('h2');
    title.className = 'ra-thankyou__title';
    title.textContent = 'Thank You!';
    content.appendChild(title);

    // Message
    var message = document.createElement('p');
    message.className = 'ra-thankyou__message';
    message.textContent = 'Your submission has been recorded successfully. Thank you for contributing to urban resilience data collection.';
    content.appendChild(message);

    // Partner logos container
    if (thankyouLogoUrl) {
      var logosDiv = document.createElement('div');
      logosDiv.className = 'ra-thankyou__logos';

      var partnerLogo = document.createElement('img');
      partnerLogo.src = thankyouLogoUrl;
      partnerLogo.alt = 'Partner';
      partnerLogo.className = 'ra-thankyou__partner-logo';
      logosDiv.appendChild(partnerLogo);

      content.appendChild(logosDiv);
    }

    // Buttons
    var btnContainer = document.createElement('div');

    var submitAnother = document.createElement('a');
    submitAnother.href = window.location.href;
    submitAnother.className = 'ra-thankyou__btn';
    submitAnother.textContent = 'Submit Another Response';
    btnContainer.appendChild(submitAnother);

    var closeBtn = document.createElement('button');
    closeBtn.className = 'ra-thankyou__btn ra-thankyou__btn--secondary';
    closeBtn.textContent = 'Close';
    closeBtn.onclick = function () {
      overlay.remove();
    };
    btnContainer.appendChild(closeBtn);

    content.appendChild(btnContainer);
    overlay.appendChild(content);
    document.body.appendChild(overlay);
  }

  function listenForSubmission() {
    // Strategy 1: Listen for Enketo's submissionsuccess event
    var form = document.querySelector('form.or');
    if (form) {
      form.addEventListener('submissionsuccess', function () {
        setTimeout(showThankYou, 500);
      });
    }

    // Strategy 2: Observe DOM for success messages (backup)
    var observer = new MutationObserver(function (mutations) {
      for (var i = 0; i < mutations.length; i++) {
        var nodes = mutations[i].addedNodes;
        for (var j = 0; j < nodes.length; j++) {
          var node = nodes[j];
          if (node.nodeType === 1) {
            // Check for Enketo's success dialog
            if (node.classList && (
              node.classList.contains('vex') ||
              node.classList.contains('alert-success')
            )) {
              var text = node.textContent || '';
              if (text.indexOf('submitted') > -1 || text.indexOf('success') > -1) {
                setTimeout(showThankYou, 500);
              }
            }
            // Also check children
            var successEl = node.querySelector && node.querySelector('.vex-dialog-message, .alert-success');
            if (successEl) {
              setTimeout(showThankYou, 500);
            }
          }
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  // ========================================================================
  // INITIALIZATION
  // ========================================================================

  function init() {
    if (!isFormPage()) return;

    // Create banner
    createBanner();

    // Check for custom thank you logo
    var mediaBase = findMediaBasePath();
    if (mediaBase) {
      var logoUrl = mediaBase + 'thankyou-logo.png';
      checkMediaExists(logoUrl, function (exists) {
        if (exists) {
          thankyouLogoUrl = logoUrl;
        }
      });
    }

    // Listen for form submission
    listenForSubmission();
  }

  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(init, 500);
    });
  } else {
    setTimeout(init, 500);
  }
})();

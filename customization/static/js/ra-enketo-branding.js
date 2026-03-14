/**
 * Resilience Academy - Enketo Form Branding
 * ==========================================
 * Injected via nginx sub_filter. Provides:
 *   - Banner with dark overlay and form title
 *   - Per-form banner via config file
 *   - Thank you overlay with logos after submission
 *   - RA-colored buttons (via CSS)
 *
 * UPDATE-PROOF: Loaded via nginx sub_filter; does not modify core files.
 *
 * Configuration:
 *   Edit /custom-static/config/form-branding.json to set per-form banners
 *   and thank-you images. Place images in:
 *     /custom-static/config/banners/   - banner background images
 *     /custom-static/config/thankyou/  - thank you page logos
 */
(function () {
  'use strict';

  var CONFIG_URL = '/custom-static/config/form-branding.json';
  var RA_LOGO = '/custom-static/images/ra-logo-dark.png';
  var DEFAULT_BANNER = '/custom-static/images/default-banner.jpg';
  var BANNER_ID = 'ra-form-banner';

  // Only run on form pages
  function isFormPage() {
    return !!document.querySelector('form.or') || !!document.querySelector('.main');
  }

  // Extract form ID from URL (e.g., /x/boFXa8gH → boFXa8gH)
  function getFormId() {
    var path = window.location.pathname;
    var match = path.match(/\/(?:x|preview|single|i|single\/i)\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  }

  // Load config
  function loadConfig(callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', CONFIG_URL + '?t=' + Date.now(), true);
    xhr.onload = function () {
      if (xhr.status === 200) {
        try {
          callback(JSON.parse(xhr.responseText));
        } catch (e) {
          callback(null);
        }
      } else {
        callback(null);
      }
    };
    xhr.onerror = function () { callback(null); };
    xhr.send();
  }

  // ========================================================================
  // BANNER
  // ========================================================================

  function createBanner(bannerImage) {
    if (document.getElementById(BANNER_ID)) return;

    var formTitle = '';
    var titleEl = document.getElementById('form-title');
    if (titleEl) {
      formTitle = titleEl.textContent.trim();
    }

    var banner = document.createElement('div');
    banner.id = BANNER_ID;
    banner.className = 'ra-form-banner';
    if (bannerImage) {
      banner.style.backgroundImage = 'url(' + bannerImage + ')';
    }

    var title = document.createElement('h1');
    title.className = 'ra-form-banner__title';
    title.textContent = formTitle || 'Data Collection Form';
    banner.appendChild(title);

    // Insert banner after .form-header but before the form content
    var header = document.querySelector('.form-header');
    if (header && header.parentNode) {
      header.parentNode.insertBefore(banner, header.nextSibling);
      document.body.classList.add('ra-has-banner');

      // Make banner full width by negating article.paper padding
      var paper = document.querySelector('article.paper');
      if (paper) {
        var style = window.getComputedStyle(paper);
        var pl = parseFloat(style.paddingLeft) || 0;
        var pr = parseFloat(style.paddingRight) || 0;
        banner.style.marginLeft = '-' + pl + 'px';
        banner.style.marginRight = '-' + pr + 'px';
        banner.style.width = 'calc(100% + ' + (pl + pr) + 'px)';
      }
    }
  }

  // ========================================================================
  // FOOTER IMAGE
  // ========================================================================

  function createFooter(footerImage) {
    if (!footerImage || document.getElementById('ra-form-footer')) return;

    var footer = document.createElement('div');
    footer.id = 'ra-form-footer';
    footer.className = 'ra-form-footer';

    var img = document.createElement('img');
    img.src = footerImage;
    img.alt = 'Footer';
    footer.appendChild(img);

    // Insert after .form-footer (the submit buttons area)
    var formFooter = document.querySelector('.form-footer');
    if (formFooter && formFooter.parentNode) {
      formFooter.parentNode.insertBefore(footer, formFooter.nextSibling);

      // Match full width like banner
      var paper = document.querySelector('article.paper');
      if (paper) {
        var style = window.getComputedStyle(paper);
        var pl = parseFloat(style.paddingLeft) || 0;
        var pr = parseFloat(style.paddingRight) || 0;
        footer.style.marginLeft = '-' + pl + 'px';
        footer.style.marginRight = '-' + pr + 'px';
        footer.style.width = 'calc(100% + ' + (pl + pr) + 'px)';
      }
    }
  }

  // ========================================================================
  // THANK YOU OVERLAY
  // ========================================================================

  function showThankYou(config) {
    if (document.querySelector('.ra-thankyou-overlay')) return;

    var thankyouLogo = (config && config.thankyou_logo) || RA_LOGO;
    var thankyouMessage = (config && config.thankyou_message) ||
      'Your submission has been recorded successfully. Thank you for contributing to urban resilience data collection.';

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
    message.textContent = thankyouMessage;
    content.appendChild(message);

    // Partner/project logo if configured
    if (thankyouLogo !== RA_LOGO) {
      var logosDiv = document.createElement('div');
      logosDiv.className = 'ra-thankyou__logos';

      var partnerLogo = document.createElement('img');
      partnerLogo.src = thankyouLogo;
      partnerLogo.alt = 'Partner';
      partnerLogo.className = 'ra-thankyou__partner-logo';
      logosDiv.appendChild(partnerLogo);

      content.appendChild(logosDiv);
    }

    // Buttons
    var btnContainer = document.createElement('div');
    btnContainer.style.marginTop = '20px';

    var submitAnother = document.createElement('a');
    submitAnother.href = window.location.href;
    submitAnother.className = 'ra-thankyou__btn';
    submitAnother.textContent = 'Submit Another Response';
    btnContainer.appendChild(submitAnother);

    var closeBtn = document.createElement('button');
    closeBtn.className = 'ra-thankyou__btn ra-thankyou__btn--secondary';
    closeBtn.textContent = 'Close';
    closeBtn.onclick = function () { overlay.remove(); };
    btnContainer.appendChild(closeBtn);

    content.appendChild(btnContainer);
    overlay.appendChild(content);
    document.body.appendChild(overlay);
  }

  function listenForSubmission(formConfig) {
    var submitted = false;

    // Only use Enketo's official submissionsuccess event
    // This ONLY fires after a successful server-side submission
    var form = document.querySelector('form.or');
    if (form) {
      form.addEventListener('submissionsuccess', function () {
        if (submitted) return;
        submitted = true;
        setTimeout(function () { showThankYou(formConfig); }, 1000);
      });
    }

    // Fallback: intercept the native XMLHttpRequest to detect successful POST to /submission
    var origOpen = XMLHttpRequest.prototype.open;
    var origSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function (method, url) {
      this._raMethod = method;
      this._raUrl = url;
      return origOpen.apply(this, arguments);
    };
    XMLHttpRequest.prototype.send = function () {
      var self = this;
      if (this._raMethod === 'POST' && this._raUrl && this._raUrl.indexOf('/submission') > -1) {
        this.addEventListener('load', function () {
          if (self.status >= 200 && self.status < 300 && !submitted) {
            submitted = true;
            setTimeout(function () { showThankYou(formConfig); }, 1500);
          }
        });
      }
      return origSend.apply(this, arguments);
    };
  }

  // ========================================================================
  // INITIALIZATION
  // ========================================================================

  function init() {
    if (!isFormPage()) return;

    var formId = getFormId();

    loadConfig(function (config) {
      var formConfig = null;
      var bannerImage = DEFAULT_BANNER;

      if (config) {
        // Check for form-specific config
        if (formId && config.forms && config.forms[formId]) {
          formConfig = config.forms[formId];
          bannerImage = formConfig.banner || config.defaults.banner || DEFAULT_BANNER;
        } else if (config.defaults) {
          formConfig = config.defaults;
          bannerImage = config.defaults.banner || DEFAULT_BANNER;
        }
      }

      createBanner(bannerImage);

      // Create footer if configured
      var footerImage = '';
      if (formConfig && formConfig.footer) {
        footerImage = formConfig.footer;
      } else if (config && config.defaults && config.defaults.footer) {
        footerImage = config.defaults.footer;
      }
      createFooter(footerImage);

      listenForSubmission(formConfig);
    });
  }

  // Wait for DOM and Enketo to render
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(init, 800);
    });
  } else {
    setTimeout(init, 800);
  }
})();

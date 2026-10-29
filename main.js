(function () {
  "use strict";

  var config = window.AUTOQUOTE_CONFIG || {};
  var pixelId = String(config.metaPixelId || "");
  var consentKey = "autoquote-ad-consent-v1";
  var maxAge = 180 * 24 * 60 * 60 * 1000;
  var privacySignal = navigator.globalPrivacyControl === true || navigator.doNotTrack === "1";
  var consent = null;
  var started = false;
  var navigating = false;
  var buttons = document.querySelectorAll("[data-lead-choice]");
  var banner = document.getElementById("privacy-banner");
  var message = document.getElementById("privacy-message");
  var accept = document.getElementById("privacy-accept");
  var reject = document.getElementById("privacy-reject");
  var settingsTrigger = null;

  try {
    var saved = JSON.parse(localStorage.getItem(consentKey));
    if (saved && (saved.value === "accepted" || saved.value === "rejected") &&
        typeof saved.at === "number" && Date.now() >= saved.at && Date.now() - saved.at < maxAge) {
      consent = saved.value;
    }
  } catch (_) { /* Browsing still works when storage is unavailable. */ }
  if (privacySignal) consent = "rejected";

  function safeMeasurementUrl(value) {
    if (!value) return true;
    try {
      var url = new URL(value);
      if (url.hash) return false;
      return Array.from(url.searchParams).every(function (entry) {
        return /^(fbclid|utm_source|utm_medium|utm_campaign|utm_content|utm_term|campaign_id|adset_id|ad_id)$/.test(entry[0]) &&
          /^[a-zA-Z0-9_.~-]{1,500}$/.test(entry[1]);
      });
    } catch (_) { return false; }
  }

  function canTrack() {
    // Restrict measurement URLs to campaign identifiers; never put personal data in them.
    return config.metaTrackingEnabled === true && consent === "accepted" && !privacySignal &&
      /^https?:$/.test(location.protocol) && safeMeasurementUrl(location.href) &&
      safeMeasurementUrl(document.referrer) && /^\d+$/.test(pixelId) && !/^0+$/.test(pixelId);
  }

  function startPixel() {
    if (started || !canTrack()) return;
    started = true;
    if (!window.fbq) {
      var fbq = window.fbq = function () {
        fbq.callMethod ? fbq.callMethod.apply(fbq, arguments) : fbq.queue.push(arguments);
      };
      window._fbq = fbq;
      fbq.push = fbq;
      fbq.loaded = true;
      fbq.version = "2.0";
      fbq.queue = [];
    }
    window.fbq("consent", "grant");
    window.fbq("set", "autoConfig", false, pixelId);
    window.fbq("init", pixelId);
    window.fbq("trackSingle", pixelId, "PageView");
    var script = document.createElement("script");
    script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.appendChild(script);
  }

  function clearPixelCookies() {
    ["_fbp", "_fbc"].forEach(function (name) {
      document.cookie = name + "=; Max-Age=0; Path=/; SameSite=Lax";
      var parts = location.hostname.split(".");
      for (var i = 0; i < parts.length - 1; i++) {
        document.cookie = name + "=; Max-Age=0; Path=/; Domain=." + parts.slice(i).join(".") + "; SameSite=Lax";
      }
    });
  }

  function choose(value) {
    consent = privacySignal ? "rejected" : value;
    try { localStorage.setItem(consentKey, JSON.stringify({ value: consent, at: Date.now() })); } catch (_) {}
    if (consent === "accepted") {
      if (started && window.fbq) window.fbq("consent", "grant");
      startPixel();
    } else {
      if (window.fbq) window.fbq("consent", "revoke");
      clearPixelCookies();
    }
    if (banner) banner.hidden = true;
    if (settingsTrigger) settingsTrigger.focus();
  }

  if (config.metaTrackingEnabled !== true && message) {
    message.textContent = "Meta measurement is currently disabled. No Meta Pixel, PageView, or Lead events are sent by this integration. The landing page uses separate ClickFlare referral tracking; see the Privacy Policy.";
    accept.hidden = true;
    reject.textContent = "Close";
  }
  if (privacySignal && message) {
    message.textContent = "Your browser privacy signal is enabled. Advertising measurement is disabled. You can continue to quote providers without enabling it.";
    accept.hidden = true;
    reject.textContent = "Keep measurement off";
  }
  if (banner) banner.hidden = config.metaTrackingEnabled !== true || consent !== null;
  if (accept) accept.addEventListener("click", function () { choose("accepted"); });
  if (reject) reject.addEventListener("click", function () { choose("rejected"); });
  document.querySelectorAll("[data-privacy-settings]").forEach(function (button) {
    button.addEventListener("click", function () {
      settingsTrigger = button;
      banner.hidden = false;
      (privacySignal || config.metaTrackingEnabled !== true ? reject : accept).focus();
    });
  });
  if (consent === "rejected") clearPixelCookies();
  startPixel();

  buttons.forEach(function (button) {
    // Configure real anchors before the deferred ClickFlare tag rewrites them.
    if (config.quoteUrl) button.setAttribute("href", config.quoteUrl);
    button.addEventListener("click", function (event) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (navigating) { event.preventDefault(); return; }
      navigating = true;
      buttons.forEach(function (item) {
        item.setAttribute("aria-disabled", "true");
        item.classList.remove("is-selected");
      });
      button.classList.add("is-selected");
      // Leave the default anchor action intact. ClickFlare rewrites href to its
      // own handler and restores the direct URL if its network tag fails.
      // Do not replace that action with a raw location.assign redirect.
      if (started && canTrack() && window.fbq) {
        try {
          // This event represents CTA interest, not a completed application.
          // Do not send the insurance answer, contact details, or custom user data.
          window.fbq("trackSingle", pixelId, "Lead");
        } catch (_) { /* Analytics must never block the quote journey. */ }
      }
    });
  });
  window.addEventListener("pageshow", function () {
    navigating = false;
    buttons.forEach(function (button) {
      button.removeAttribute("aria-disabled");
      button.classList.remove("is-selected");
    });
  });
  window.addEventListener("storage", function (event) {
    if (event.key === consentKey || event.key === null) location.reload();
  });
})();

(function () {
  "use strict";

  var config = window.AUTOQUOTE_CONFIG || {};
  var pixelId = String(config.metaPixelId || "");
  var privacySignal = navigator.globalPrivacyControl === true || navigator.doNotTrack === "1";
  var started = false;
  var navigating = false;
  var buttons = document.querySelectorAll("[data-lead-choice]");
  function safeMeasurementUrl(value) {
    if (!value) return true;
    try {
      var url = new URL(value);
      if (url.hash) return false;
      return Array.from(url.searchParams).every(function (entry) {
        // ClickFlare adds an opaque visit token and a numeric landing token
        // during redirect campaigns. Permit their expected formats only.
        if (entry[0] === "cep") return /^[a-zA-Z0-9+/_=-]{1,4096}$/.test(entry[1]);
        if (entry[0] === "lptoken") return /^\d{1,40}$/.test(entry[1]);
        return /^(fbclid|cpid|cftmid|utm_source|utm_medium|utm_campaign|utm_content|utm_term|campaign_id|adset_id|ad_id)$/.test(entry[0]) &&
          /^[a-zA-Z0-9_.~-]{1,500}$/.test(entry[1]);
      });
    } catch (_) { return false; }
  }

  function canTrack() {
    // Restrict measurement URLs to campaign identifiers; never put personal data in them.
    return config.metaTrackingEnabled === true && !privacySignal &&
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
    window.fbq("set", "autoConfig", false, pixelId);
    window.fbq("init", pixelId);
    window.fbq("trackSingle", pixelId, "PageView");
    var script = document.createElement("script");
    script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.appendChild(script);
  }

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
      // CTA clicks do not send Meta events; only PageView is configured.
    });
  });
  window.addEventListener("pageshow", function () {
    navigating = false;
    buttons.forEach(function (button) {
      button.removeAttribute("aria-disabled");
      button.classList.remove("is-selected");
    });
  });
})();

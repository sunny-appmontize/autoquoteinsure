(function () {
  "use strict";

  var config = window.AUTOQUOTE_CONFIG || {};
  var pixelId = String(config.metaPixelId || "");
  var hasRealPixel = /^\d+$/.test(pixelId) && !/^0+$/.test(pixelId);

  // Meta's standard queue also works while the network script is loading.
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

  // Dummy mode queues events locally without sending them to a fake account.
  if (hasRealPixel) {
    var script = document.createElement("script");
    script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.appendChild(script);
  }
  window.fbq("init", pixelId);
  window.fbq("track", "PageView");

  var navigating = false;
  var buttons = document.querySelectorAll("[data-lead-choice]");
  buttons.forEach(function (button) {
    button.addEventListener("click", function () {
      if (navigating) return;
      navigating = true;
      buttons.forEach(function (item) {
        item.disabled = true;
        item.classList.remove("is-selected");
      });
      button.classList.add("is-selected");
      // Navigation must still work when analytics is blocked or unavailable.
      setTimeout(function () {
        window.location.assign(config.quoteUrl);
      }, 300);
      window.fbq("track", "Lead", {
        content_name: "Auto Insurance Quote",
        currently_insured: button.textContent.trim().toLowerCase()
      });
    });
  });
  window.addEventListener("pageshow", function () {
    navigating = false;
    buttons.forEach(function (button) {
      button.disabled = false;
      button.classList.remove("is-selected");
    });
  });
})();

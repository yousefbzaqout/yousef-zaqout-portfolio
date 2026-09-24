/**
 * Lightweight dual-sink telemetry (PostHog + GA4).
 *
 * Configure before this script loads:
 *   <script>
 *     window.YZ_ANALYTICS = {
 *       ga4Id: "G-XXXXXXXXXX",
 *       posthogKey: "phc_xxx",
 *       posthogHost: "https://us.i.posthog.com", // optional
 *       debug: false
 *     };
 *   </script>
 */
window.YZAnalytics = (function () {
  function cleanEnv(value, fallback = "") {
    const v = String(value ?? "").trim();
    if (!v || v.includes("%VITE_")) return fallback;
    return v;
  }

  const raw = window.YZ_ANALYTICS || {};
  const CONFIG = {
    ga4Id: cleanEnv(raw.ga4Id),
    posthogKey: cleanEnv(raw.posthogKey),
    posthogHost: cleanEnv(raw.posthogHost, "https://us.i.posthog.com"),
    debug: Boolean(raw.debug),
  };

  function log(...args) {
    if (CONFIG.debug || (!CONFIG.ga4Id && !CONFIG.posthogKey)) {
      console.debug("[YZAnalytics]", ...args);
    }
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  function initGa4() {
    if (!CONFIG.ga4Id) return;
    window.dataLayer = window.dataLayer || [];
    window.gtag =
      window.gtag ||
      function () {
        window.dataLayer.push(arguments);
      };
    window.gtag("js", new Date());
    window.gtag("config", CONFIG.ga4Id, { send_page_view: true });
    loadScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(CONFIG.ga4Id)}`).catch((e) =>
      log("GA4 load failed", e)
    );
  }

  function initPosthog() {
    if (!CONFIG.posthogKey) return;
    const host = CONFIG.posthogHost.replace(/\/$/, "");

    // Official stub so capture() queues until array.js loads
    !(function (t, e) {
      if (e.__SV) return;
      var o, n, p, r;
      window.posthog = e;
      e._i = [];
      e.init = function (i, s, a) {
        function g(t, e) {
          var o = e.split(".");
          2 == o.length && ((t = t[o[0]]), (e = o[1]));
          t[e] = function () {
            t.push([e].concat(Array.prototype.slice.call(arguments, 0)));
          };
        }
        (p = t.createElement("script")).type = "text/javascript";
        p.async = !0;
        p.src = s.api_host.replace(/\/$/, "") + "/static/array.js";
        (r = t.getElementsByTagName("script")[0]).parentNode.insertBefore(p, r);
        var u = e;
        void 0 !== a ? (u = e[a] = []) : (a = "posthog");
        u.people = u.people || [];
        u.toString = function (t) {
          var e = "posthog";
          return "posthog" !== a && (e += "." + a), t || (e += " (stub)"), e;
        };
        u.people.toString = function () {
          return u.toString(1) + ".people (stub)";
        };
        o =
          "capture identify alias people.set people.set_once register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys onSessionId".split(
            " "
          );
        for (n = 0; n < o.length; n++) g(u, o[n]);
        e._i.push([i, s, a]);
      };
      e.__SV = 1;
    })(document, window.posthog || []);

    window.posthog.init(CONFIG.posthogKey, {
      api_host: host,
      capture_pageview: true,
      persistence: "localStorage+cookie",
    });
  }

  /**
   * @param {string} eventName
   * @param {Record<string, string|number|boolean>} [props]
   */
  function track(eventName, props = {}) {
    const payload = {
      ...props,
      page_path: location.pathname + location.hash,
      locale: document.documentElement.lang || "en",
      dir: document.documentElement.dir || "ltr",
    };
    log(eventName, payload);

    if (typeof window.gtag === "function" && CONFIG.ga4Id) {
      window.gtag("event", eventName, payload);
    }
    if (window.posthog && typeof window.posthog.capture === "function") {
      window.posthog.capture(eventName, payload);
    }
  }

  function bindDelegatedClicks() {
    document.addEventListener(
      "click",
      (e) => {
        const el = e.target.closest("[data-track]");
        if (!el) return;
        const name = el.getAttribute("data-track");
        if (!name) return;
        const props = {};
        [...el.attributes].forEach((attr) => {
          if (attr.name.startsWith("data-track-") && attr.name !== "data-track") {
            props[attr.name.slice("data-track-".length).replace(/-/g, "_")] = attr.value;
          }
        });
        track(name, props);
      },
      true
    );
  }

  function init() {
    bindDelegatedClicks();
    initGa4();
    initPosthog();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  return { track, init, CONFIG };
})();

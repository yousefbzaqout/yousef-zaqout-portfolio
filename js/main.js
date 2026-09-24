import "./analytics.js";
import "./i18n.js";
import "./features.js";

(function () {
  const I18N = window.I18N;
  const LANG_KEY = "yz-lang";
  const THEME_KEY = "yz-theme";
  const root = document.documentElement;
  const CODE_PLAIN = `// Cached · Indexed · Documented
Route::middleware(['auth:sanctum'])
  ->get('/v1/metrics', MetricsController::class);

return cache()->remember('metrics', 60, fn () =>
  Metric::query()->indexed()->get()
);`;

  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /**
   * Isolate Latin tech tokens (paths, metrics, product names) inside RTL copy.
   * Keeps digits, %, ms, file paths, and CamelCase identifiers visually LTR.
   */
  function isolateTechHtml(str) {
    const escaped = escapeHtml(str);
    return escaped.replace(
      /(?:&lt;\s*)?\d+(?:\.\d+)?(?:\s*(?:ms|s|MB|%))?|%|\b(?:N\+1|REST(?:ful)?|API(?:s)?|RAG|LLM|RBAC|SOLID|HMAC|SLA|OpenAPI|Swagger|Postman|PostgreSQL|Postgres|pgvector|Redis|Docker|Laravel(?:\s+\d+)?|Filament(?:\s+v?\d+)?|Horizon|OpenRouter|Prism|Stripe|Moyasar|Tap|OpenAI|Vue(?:\s*\d+)?|PHP|GitHub|Sanctum|JSON|JSONB|cURL|Telegram|TikTok|Snapchat|LinkedIn|Google\s+Ads|Meta|n8n|FirstTouch|Sanabel(?:\s+IQ)?|OWASP(?:\s+ZAP)?|Dusk|k6|ROAS|SaaS|CI\/CD|AdPilot|Scrum(?:\s+Master)?|Areisto|Clean\s+Architecture|Composition\s+API|Backend|B2B|Livewire|PIN)(?:\/[A-Za-z]+)?\b|[A-Za-z][\w]*(?:\/[\w.]+)+(?:\.php)?|[A-Za-z]\w*::\w+|\/v\d+\/[\w\-\/]+|"cached"\s*:\s*true|200\s+OK|routes\/api\.php/gi,
      (match) => `<bdi dir="ltr">${match}</bdi>`
    );
  }

  function setTechText(el, value, lang) {
    if (!el || typeof value !== "string") return;
    if (lang === "ar") el.innerHTML = isolateTechHtml(value);
    else el.textContent = value;
  }

  function detectLang() {
    const nav = (navigator.languages?.[0] || navigator.language || "en").toLowerCase();
    return nav.startsWith("ar") ? "ar" : "en";
  }

  function getLang() {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === "ar" || saved === "en") return saved;
    return detectLang();
  }

  function detectTheme() {
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }

  function getThemePref() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "light" || saved === "dark" || saved === "system") return saved;
    return "system";
  }

  function resolveTheme(pref = getThemePref()) {
    if (pref === "light" || pref === "dark") return pref;
    return detectTheme();
  }

  function updateThemeColor(resolved) {
    const meta = $("#theme-color-meta");
    if (meta) meta.setAttribute("content", resolved === "light" ? "#f3f6fb" : "#090d16");
  }

  function syncThemeButtons(pref, lang) {
    const t = I18N[lang] || I18N.en;
    const group = $(".theme-toggle");
    if (group) group.setAttribute("aria-label", t.theme?.label || "Theme");
    $$("[data-theme-pref]").forEach((btn) => {
      const mode = btn.dataset.themePref;
      const active = mode === pref;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
      const title =
        mode === "light"
          ? t.theme?.light || "Light"
          : mode === "dark"
            ? t.theme?.dark || "Dark"
            : t.theme?.system || "System";
      btn.title = title;
    });
  }

  function applyThemePref(pref, { persist = false } = {}) {
    if (persist) localStorage.setItem(THEME_KEY, pref);
    const resolved = resolveTheme(pref);
    root.setAttribute("data-theme-pref", pref);
    root.setAttribute("data-theme", resolved);
    root.style.colorScheme = resolved;
    syncThemeButtons(pref, getLang());
    updateThemeColor(resolved);
  }

  function setLangButtons(lang) {
    $$(".lang-toggle button").forEach((btn) => {
      const active = btn.dataset.lang === lang;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  function closeMenu() {
    const navLinks = $(".nav-links");
    const menuBtn = $(".menu-toggle");
    if (navLinks) navLinks.classList.remove("is-open");
    if (menuBtn) menuBtn.setAttribute("aria-expanded", "false");
  }

  function tPath(t, path) {
    return path.split(".").reduce((o, k) => (o ? o[k] : null), t);
  }

  function render(lang, { persist = false } = {}) {
    const t = I18N[lang];
    if (!t) return;

    root.lang = t.lang;
    root.dir = t.dir;
    if (persist) localStorage.setItem(LANG_KEY, lang);
    setLangButtons(lang);
    syncThemeButtons(getThemePref(), lang);

    $$("[data-i18n]").forEach((el) => {
      const value = tPath(t, el.getAttribute("data-i18n"));
      if (typeof value === "string") el.textContent = value;
    });

    $$("[data-i18n-html]").forEach((el) => {
      const value = tPath(t, el.getAttribute("data-i18n-html"));
      if (typeof value === "string") el.innerHTML = value;
    });

    $$("[data-i18n-tech]").forEach((el) => {
      const value = tPath(t, el.getAttribute("data-i18n-tech"));
      setTechText(el, value, lang);
    });

    const problemCards = $$("[data-problem]");
    t.problems.items.forEach((item, i) => {
      const card = problemCards[i];
      if (!card) return;
      $(".num", card).textContent = item.num;
      $("h3", card).textContent = item.title;
      setTechText($(".problem-body", card), item.text, lang);
    });

    const serviceBlocks = $$("[data-service]");
    t.services.items.forEach((item, i) => {
      const block = serviceBlocks[i];
      if (!block) return;
      $(".tag", block).textContent = item.tag;
      setTechText($("h3", block), item.title, lang);
      setTechText($(".for", block), item.forWhom, lang);
      setTechText($(".problem-text", block), item.problem, lang);
      const list = $("ul", block);
      list.innerHTML = item.includes
        .map((li) => `<li>${lang === "ar" ? isolateTechHtml(li) : escapeHtml(li)}</li>`)
        .join("");
      setTechText($(".benefit", block), item.benefit, lang);
    });

    const cases = $$("[data-case]");
    t.portfolio.cases.forEach((item, i) => {
      const card = cases[i];
      if (!card) return;
      const tags = $(".case-tags", card);
      tags.innerHTML = item.tags
        .map((tag) => `<span class="chip"><bdi dir="ltr">${escapeHtml(tag)}</bdi></span>`)
        .join("");
      setTechText($("h3", card), item.title, lang);

      let proofEl = $(".case-proof", card);
      if (item.proof?.length) {
        if (!proofEl) {
          proofEl = document.createElement("p");
          proofEl.className = "case-proof";
          const h3 = $("h3", card);
          if (h3) h3.insertAdjacentElement("afterend", proofEl);
        }
        setTechText(proofEl, item.proof.join(" · "), lang);
        proofEl.hidden = false;
      } else if (proofEl) {
        proofEl.hidden = true;
        proofEl.textContent = "";
      }

      const steps = t.portfolio.steps;
      const map = {
        challenge: item.challenge,
        role: item.role,
        solution: item.solution,
        outcome: item.outcome,
      };
      $$("[data-casr]", card).forEach((el) => {
        const key = el.getAttribute("data-casr");
        $(".casr-label", el).textContent = steps[key] || "";
        setTechText($("p", el), map[key] || "", lang);
      });

      const link = $(".case-link", card);
      if (link) {
        link.textContent = item.link;
        link.href = item.href;
        if (item.href && item.href !== "#") {
          link.setAttribute("target", "_blank");
          link.setAttribute("rel", "noopener noreferrer");
        }
      }
    });

    const whyItems = $$("[data-why]");
    t.why.items.forEach((item, i) => {
      const el = whyItems[i];
      if (!el) return;
      setTechText($("h3", el), item.title, lang);
      setTechText($("p", el), item.text, lang);
    });

    const aboutPs = $$("[data-about-p]");
    ["p1", "p2", "p3"].forEach((key, i) => {
      if (aboutPs[i]) setTechText(aboutPs[i], t.about[key], lang);
    });

    const testimonials = $$("[data-testimonial]");
    t.testimonials.items.forEach((item, i) => {
      const el = testimonials[i];
      if (!el) return;
      setTechText($("blockquote", el), item.quote, lang);
      $("cite", el).textContent = item.cite;
      setTechText($(".role", el), item.role, lang);
    });

    const creds = $$("[data-cred]");
    t.credentials.items.forEach((item, i) => {
      const el = creds[i];
      if (!el) return;
      $(".cred-mark", el).textContent = item.mark;
      setTechText($("h3", el), item.title, lang);
      setTechText($("p", el), item.text, lang);
    });

    // Isolate technical tokens in static i18n titles that mix Latin + Arabic
    $$("[data-i18n='rigor.title'], [data-i18n='hero.lead'], [data-i18n='cmd.hint']").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      const value = tPath(t, key);
      if (typeof value === "string" && lang === "ar") el.innerHTML = isolateTechHtml(value);
    });

    // Reset sandbox hint if idle
    const output = $("#sandbox-output");
    const meta = $("#sandbox-meta");
    if (output && meta && meta.hidden) {
      output.innerHTML = `<span class="c-muted">${escapeHtml(t.sandbox.hint)}</span>`;
    }

    const copyLabel = $(".copy-btn [data-i18n='hero.copy']");
    if (copyLabel && !$(".copy-btn")?.classList.contains("is-copied")) {
      copyLabel.textContent = t.hero.copy;
    }

    const cmdInput = $("#cmd-input");
    if (cmdInput && t.cmd?.placeholder) {
      cmdInput.setAttribute("placeholder", t.cmd.placeholder);
    }

    const cvOpen = $("#cv-open");
    if (cvOpen && t.cv?.openLabel) {
      cvOpen.setAttribute("aria-label", t.cv.openLabel);
      cvOpen.setAttribute("title", t.cv.openLabel);
    }

    // Refresh open command palette labels after language switch
    if ($("#cmd-palette")?.classList.contains("is-open") && window.YZFeatures?.refreshCmd) {
      window.YZFeatures.refreshCmd(cmdInput?.value || "");
    }

    document.title =
      lang === "ar"
        ? "يوسف زقوت | مهندس Backend"
        : "Yousef Zaqout | Backend Engineer";

    const metaDesc = $('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute(
        "content",
        lang === "ar"
          ? "واجهات Laravel RESTful، خطوط دفع وذكاء اصطناعي/RAG، توثيق OpenAPI، وتسليم Docker."
          : "Laravel RESTful APIs, payment & AI/RAG pipelines, OpenAPI docs, Docker delivery."
      );
    }
  }

  /* —— Copy code —— */
  $$(".copy-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const lang = getLang();
      const t = I18N[lang];
      try {
        await navigator.clipboard.writeText(CODE_PLAIN);
      } catch {
        const ta = document.createElement("textarea");
        ta.value = CODE_PLAIN;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
      }
      btn.classList.add("is-copied");
      const label = $("[data-i18n='hero.copy']", btn);
      if (label) label.textContent = t.hero.copied;
      setTimeout(() => {
        btn.classList.remove("is-copied");
        if (label) label.textContent = I18N[getLang()].hero.copy;
      }, 1600);
    });
  });

  $$(".lang-toggle button").forEach((btn) => {
    btn.addEventListener("click", () => {
      render(btn.dataset.lang, { persist: true });
      closeMenu();
    });
  });

  $$("[data-theme-pref]").forEach((btn) => {
    btn.addEventListener("click", () => {
      applyThemePref(btn.dataset.themePref, { persist: true });
      window.YZAnalytics?.track("theme_change", { theme: btn.dataset.themePref });
    });
  });

  const themeMq = window.matchMedia("(prefers-color-scheme: light)");
  const onSystemTheme = () => {
    if (getThemePref() !== "system") return;
    applyThemePref("system");
  };
  if (themeMq.addEventListener) themeMq.addEventListener("change", onSystemTheme);
  else if (themeMq.addListener) themeMq.addListener(onSystemTheme);

  const menuBtn = $(".menu-toggle");
  const navLinks = $(".nav-links");
  if (menuBtn && navLinks) {
    menuBtn.addEventListener("click", () => {
      const open = navLinks.classList.toggle("is-open");
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    $$("a", navLinks).forEach((a) => a.addEventListener("click", closeMenu));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeMenu();
    });
  }

  const header = $(".site-header");
  const sectionIds = ["problems", "services", "work", "rigor", "why", "contact"];
  const navAnchors = $$(".nav-links a");

  function updateActiveNav() {
    const offset = window.scrollY + 140;
    let current = "";
    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el && el.offsetTop <= offset) current = id;
    });
    navAnchors.forEach((a) => {
      const href = a.getAttribute("href") || "";
      a.classList.toggle("is-active", href === `#${current}`);
    });
  }

  const onScroll = () => {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 24);
    updateActiveNav();
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const reveals = $$(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("is-visible"));
  }

  $$(".tech-logo").forEach((pill) => {
    pill.addEventListener("click", () => pill.classList.toggle("is-active"));
  });

  applyThemePref(getThemePref());
  render(getLang());
  if (window.YZFeatures) window.YZFeatures.init();
})();

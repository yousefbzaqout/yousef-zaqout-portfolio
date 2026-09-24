/* Interactive portfolio features — sandbox, cmd+k, arch, openapi, telemetry */
window.YZFeatures = (function () {
  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];

  const ENDPOINTS = {
    metrics: {
      method: "GET",
      path: "/v1/metrics",
      label: "System Telemetry",
      body: null,
      cold: 138,
      cached: 12,
      build: (cached, latency, body) => ({
        ok: true,
        endpoint: "/v1/metrics",
        cached,
        cache_layer: cached ? "redis" : "postgresql",
        latency_ms: latency,
        data: {
          api_p95_ms: cached ? 12 : 142,
          requests_24h: 12840,
          cache_hit_rate: cached ? 0.97 : 0.0,
          stack: ["Laravel", "PostgreSQL", "Redis"],
        },
      }),
    },
    rag: {
      method: "POST",
      path: "/v1/ai/rag-search",
      label: "AI / RAG Pipeline",
      body: { query: "How do we rate-limit checkout?", top_k: 5, collection: "docs" },
      cold: 420,
      cached: 48,
      build: (cached, latency, body) => ({
        ok: true,
        endpoint: "/v1/ai/rag-search",
        cached,
        latency_ms: latency,
        query: body?.query || "",
        results: [
          { id: "doc_18", score: 0.91, snippet: "Redis token bucket for Stripe webhooks…" },
          { id: "doc_07", score: 0.86, snippet: "Eager-load orders to avoid N+1…" },
        ],
        embeddings: cached ? "redis-vector-cache" : "openai-embedding-3-small",
      }),
    },
    stripe: {
      method: "POST",
      path: "/v1/checkout/stripe",
      label: "Payment Gateway",
      body: { amount: 4900, currency: "usd", product: "api_retainer" },
      cold: 210,
      cached: 64,
      build: (cached, latency, body) => ({
        ok: true,
        endpoint: "/v1/checkout/stripe",
        cached,
        latency_ms: latency,
        checkout: {
          id: "cs_test_a1b2",
          amount: body?.amount ?? 4900,
          currency: body?.currency ?? "usd",
          status: "requires_payment_method",
          idempotency_reused: cached,
        },
      }),
    },
  };

  const NODE_INFO = {
    clients: {
      title: "Clients",
      badges: ["Web", "Mobile", "SPA"],
      why: "Entry point for product surfaces. All traffic is versioned through the public API contract.",
    },
    gateway: {
      title: "API Gateway",
      badges: ["Sanctum", "Throttle", "TLS"],
      why: "Central auth, rate limiting, and request shaping before work hits application services.",
    },
    laravel: {
      title: "Laravel Backend",
      badges: ["Clean Arch", "SOLID", "Queues"],
      why: "Domain services and use-cases live here — controllers stay thin, business rules stay testable.",
    },
    filament: {
      title: "Filament Admin",
      badges: ["Filament v3", "Panels", "RBAC"],
      why: "Operator control panel for campaigns, content approval queues, and account connectors — without bloating the public API surface.",
    },
    horizon: {
      title: "Redis / Horizon",
      badges: ["Queues", "Workers", "Retries"],
      why: "Async job processing for AI generation, publish pipelines, and budget checks — keeps the request path responsive under load.",
    },
    openrouter: {
      title: "OpenRouter / LLM",
      badges: ["LLM", "Drivers", "Tone"],
      why: "Pluggable AI content generation drivers with tone controls — human approval gates every publish step.",
    },
    oauth: {
      title: "OAuth Connectors",
      badges: ["Google Ads", "Social", "Tokens"],
      why: "Secure OAuth bridges to Google Ads and social platforms so accounts stay unified without storing raw credentials.",
    },
    connect: {
      title: "Connect Account",
      badges: ["OAuth", "Sandbox", "Encrypted"],
      why: "Filament Connected Accounts + /social/* OAuth (LinkedIn, Google Ads) or sandbox connectors (X, YouTube, TikTok, Snapchat). Tokens encrypted on connected_accounts; RefreshConnectedAccountTokenJob every 30m.",
    },
    generate: {
      title: "Generate AI Content",
      badges: ["AIAction", "Quota", "LLM"],
      why: "Filament AI Actions dispatch GenerateAIContentJob (default queue). QuotaService checks plan limits, then AIManager drives OpenRouter / Anthropic / Fake via AI_PRIMARY_DRIVER.",
    },
    approve: {
      title: "Approve AI Action",
      badges: ["Human Gate", "Status FSM"],
      why: "AIActionService enforces ActionStatus transitions. Actionable outputs land in pending_approval; passive ones mark executed. Approve → approved → ExecuteAIActionJob on social-publishing.",
    },
    publish: {
      title: "Publish Social",
      badges: ["Drivers", "Horizon", "LinkedIn/X"],
      why: "ExecuteAIActionJob marks executing, resolves ConnectedAccount, publishes via SocialDriverFactory (LinkedIn / X / YouTube), then executed or failed with execution_result.",
    },
    sync: {
      title: "Sync Ad Metrics",
      badges: ["Ad Drivers", "Hourly"],
      why: "SyncAdCampaignMetricsJob (default queue) pulls campaign metrics through AdDriverFactory — Google Ads, TikTok Ads, Snapchat Ads. Scheduled hourly; also Filament / ads:dispatch.",
    },
    analyze: {
      title: "Process Ad Analytics",
      badges: ["KPI", "Pipeline", "JSONB"],
      why: "AnalyzeAdPerformanceJob runs ProcessAdAnalyticsPipeline: FetchLatestMetrics → CalculateKpi → GenerateOpenRouterInsights. Insights persist as ad_recommendations.",
    },
    recs: {
      title: "Ad Recommendations",
      badges: ["Insights", "OpenRouter"],
      why: "Structured optimization actions (pause / adjust budget / creative-only) stored in ad_recommendations after the analytics pipeline stages complete.",
    },
    apply: {
      title: "Apply or Dismiss",
      badges: ["Guardrails", "Ads"],
      why: "ApplyAdRecommendationService + AdDriverFactory apply or dismiss recs. CheckAdBudgetGuardrailsJob every 30m enforces spend limits from ads guardrails config.",
    },
    hmac: {
      title: "HMAC Webhook Ingestion",
      badges: ["Fail-closed", "Multi-channel", "Redis Lock"],
      why: "WebhookController resolves tenant + source, validates adapter HMAC/API key fail-closed, acquires Redis lead_lock:{externalLeadId} (300s), then dispatches ProcessLeadIngestionJob on the high queue.",
    },
    sla: {
      title: "Laravel 13 SLA Engine",
      badges: ["Business Hours", "Timezone", "SOLID"],
      why: "LeadProcessingPipeline assigns via ContextAwareRoutingService, CalculateSlaDeadlinePipe uses working hours + SlaCalculatorService. Scheduler: 50% warn → 80% reassign → full breach escalate.",
    },
    pgvector: {
      title: "PostgreSQL + pgvector",
      badges: ["PG 18", "JSONB", "Embeddings"],
      why: "Tenant-scoped lead store plus knowledge_chunks.embedding via pgvector. VectorSearchService backs confidence-gated RAG inference for ProcessAiResponseJob.",
    },
    "ft-horizon": {
      title: "Redis / Horizon Queues",
      badges: ["high", "notifications", "default"],
      why: "Horizon runs ProcessLeadIngestionJob & ProcessAiResponseJob on high; SLA/Telegram/outbound webhooks on notifications; knowledge ingestion on default. Redis also holds lead_lock:*.",
    },
    rag: {
      title: "Confidence-Gated RAG",
      badges: ["Credits", "Threshold", "Human Fallback"],
      why: "RagInferenceService embeds the brief, searches pgvector, compares confidence to TenantSetting.ai_confidence_threshold, then OpenRouterLlmService — low confidence routes to human / manager alert.",
    },
    n8n: {
      title: "n8n / Telegram Alerts",
      badges: ["Escalation", "Automation", "Callbacks"],
      why: "NotificationDriverFactory fans out assignment, 50%/80%/breach alerts to Telegram, n8n, or outbound HMAC webhooks. TelegramWebhookController handles claim/reply callbacks into LeadWorkflowService.",
    },
    redis: {
      title: "Redis Cache",
      badges: ["Cache", "Sessions", "Rate limit"],
      why: "Chosen for sub-20ms reads on hot paths: sessions, rate limits, and expensive query memoization.",
    },
    postgres: {
      title: "PostgreSQL",
      badges: ["Indexed", "ACID", "JSONB"],
      why: "Source of truth with composite indexes and constrained schemas for predictable p95 latency.",
    },
    stripe: {
      title: "Stripe",
      badges: ["Webhooks", "Idempotency"],
      why: "Payment intents + signed webhooks with idempotency keys to prevent double-charges.",
    },
    openai: {
      title: "OpenAI / RAG",
      badges: ["Embeddings", "Retrieval"],
      why: "RAG pipeline retrieves grounded chunks before generation — reduces hallucination risk in product flows.",
    },
    scraper: {
      title: "Scraper Bot",
      badges: ["Polling", "Filters"],
      why: "Lightweight fetch + filter pipeline optimized for sub-second discovery of new listings.",
    },
    telegram: {
      title: "Telegram",
      badges: ["Alerts", "< 5s"],
      why: "Push channel for high-signal opportunities without polling the UI.",
    },
    "sn-clients": {
      title: "Actors & Clients",
      badges: ["RTL", "PIN / Email"],
      why: "Student app, parent/teacher portals, Filament admin, and public landing hit the same Laravel app.",
    },
    "sn-laravel": {
      title: "Laravel 13 Backend",
      badges: ["Breeze Session", "Livewire"],
      why: "routes/web.php serves pages and JSON endpoints; middleware enforces auth, active child, and tenant scope.",
    },
    "sn-filament": {
      title: "Filament Panels",
      badges: ["/parent", "/admin"],
      why: "Parent cockpit and admin curriculum/tenant ops (demo requests, interactive lessons, users).",
    },
    "lesson-engine": {
      title: "Interactive Lesson Engine",
      badges: ["6 Stations", "JSONB"],
      why: "Station configs drive pedagogy then hand off to quizzes; AdaptiveMasteryEngine injects micro-hints.",
    },
    queues: {
      title: "Redis Queues",
      badges: ["Jobs", "Digests"],
      why: "ProcessAnalyticsEventJob, ProcessPDFMaterialJob, activity/recommendation jobs, weekly parent digests.",
    },
    "sn-postgres": {
      title: "PostgreSQL 18 + pgvector",
      badges: ["OLTP", "Embeddings"],
      why: "Curriculum, students, lesson_analytics, and MaterialChunk embeddings for PDF retrieval.",
    },
    "sn-ai": {
      title: "OpenRouter via Prism",
      badges: ["Gen", "Embeddings"],
      why: "Lesson/activity generation and embeddings for the parent-material RAG pipeline.",
    },
    "redis-cache": {
      title: "Redis Cache / Leaderboards",
      badges: ["CACHE_STORE", "QUEUE"],
      why: "Application cache, queue broker, and gamification leaderboard reads.",
    },
  };

  const OPENAPI = {
    "ad-pilot": {
      title: "AdPilot SaaS API",
      version: "1.0.0",
      baseUrl: "https://api.adpilot.demo/v1",
      auth: "Bearer Sanctum token",
      paths: [
        {
          method: "GET",
          path: "/social/linkedin/redirect",
          summary: "Start LinkedIn OAuth → connected_accounts (encrypted tokens)",
          response: { redirect: "https://www.linkedin.com/oauth/v2/authorization", platform: "linkedin" },
        },
        {
          method: "POST",
          path: "/ai-actions/generate",
          summary: "Dispatch GenerateAIContentJob (quota check → AIManager LLM)",
          body: { platform: "linkedin", prompt: "spring launch", tone: "confident", locale: "ar" },
          response: {
            job: "GenerateAIContentJob",
            queue: "default",
            status: "pending_approval",
            table: "ai_actions",
          },
        },
        {
          method: "POST",
          path: "/ai-actions/{id}/approve",
          summary: "Approve → ExecuteAIActionJob on social-publishing queue",
          body: { transition: "approved" },
          response: {
            status: "approved",
            dispatched: "ExecuteAIActionJob",
            queue: "social-publishing",
            driver: "SocialDriverFactory",
          },
        },
        {
          method: "POST",
          path: "/ads/dispatch",
          summary: "Sync metrics + run ProcessAdAnalyticsPipeline → recommendations",
          body: { jobs: ["SyncAdCampaignMetricsJob", "AnalyzeAdPerformanceJob"] },
          response: {
            ad_metrics: "synced",
            pipeline: ["FetchLatestMetrics", "CalculateKpi", "GenerateOpenRouterInsights"],
            ad_recommendations: [{ action: "adjust_budget", min_roas: 2.5 }],
          },
        },
      ],
    },
    "firsttouch-sla": {
      title: "FirstTouch SLA API",
      version: "1.0.0",
      baseUrl: "https://api.firsttouch.demo/api",
      auth: "HMAC webhooks · Bearer Sanctum (developer:*)",
      paths: [
        {
          method: "POST",
          path: "/v1/webhooks/meta/{tenant_id}",
          summary: "Inbound Meta lead — fail-closed HMAC → ProcessLeadIngestionJob (high)",
          headers: {
            "Content-Type": "application/json",
            "X-Hub-Signature-256": "sha256=<hmac>",
          },
          body: {
            entry: [{ changes: [{ value: { leadgen_id: "ext-1", field_data: [] } }] }],
          },
          response: {
            status: "accepted",
            downstream: "LeadProcessingPipeline",
            pipes: [
              "VerifyIdempotencyPipe",
              "AssignRoundRobinSalesPipe",
              "CalculateSlaDeadlinePipe",
              "PersistLeadPipe",
              "DispatchAiResponsePipe",
            ],
          },
        },
        {
          method: "POST",
          path: "/v1/webhooks/website/{tenant_id}",
          summary: "Website form webhook — API key auth, 201 on accept",
          headers: { "X-Api-Key": "<website-key>", Accept: "application/json" },
          body: { name: "Sara", phone: "+9705…", email: "sara@example.com" },
          response: { success: true, message: "Lead accepted", source: "website" },
        },
        {
          method: "POST",
          path: "/v1/webhooks/telegram/{tenant_id}",
          summary: "Telegram bot callbacks — claim / reply → LeadWorkflowService",
          headers: { "X-Telegram-Bot-Api-Secret-Token": "<secret>" },
          response: { ok: true, action: "mark_in_progress", sla_status: "met" },
        },
        {
          method: "GET",
          path: "/v1/developer/leads",
          summary: "Developer API — list tenant leads (Sanctum abilities:developer:*)",
          headers: { Authorization: "Bearer {token}", Accept: "application/json" },
          response: {
            data: [{ id: 42, external_lead_id: "ext-1", sla_status: "running", source: "meta" }],
            meta: { per_page: 15, total: 128 },
          },
        },
        {
          method: "GET",
          path: "/v1/developer/analytics/sla-summary",
          summary: "SLA compliance summary — live adherence & queue depth",
          headers: { Authorization: "Bearer {token}", Accept: "application/json" },
          response: {
            compliance_rate: 0.94,
            median_first_action_minutes: 3.2,
            breached: 4,
            queue_depth: 11,
          },
        },
      ],
    },
    irada: {
      title: "Irada Academy API",
      version: "1.2.0",
      baseUrl: "https://api.irada.demo/v1",
      auth: "Bearer Sanctum token",
      paths: [
        {
          method: "GET",
          path: "/courses",
          summary: "List courses with enrollment counts",
          headers: { Authorization: "Bearer {token}", Accept: "application/json" },
          response: { data: [{ id: 1, title: "Laravel APIs", seats: 40 }], meta: { total: 12 } },
        },
        {
          method: "POST",
          path: "/enrollments",
          summary: "Enroll authenticated user in a course",
          body: { course_id: 12 },
          response: { id: 88, status: "active", role: "student" },
        },
      ],
    },
    mostaql: {
      title: "Mostaql Bot API",
      version: "0.9.0",
      baseUrl: "https://bot.demo/v1",
      auth: "X-Bot-Token",
      paths: [
        {
          method: "GET",
          path: "/jobs/latest",
          summary: "Fetch filtered freelance listings",
          response: { items: [{ id: "m-102", title: "Laravel API", match: 0.94 }], latency_ms: 420 },
        },
        {
          method: "POST",
          path: "/alerts/telegram",
          summary: "Dispatch Telegram notification",
          body: { chat_id: 123, job_id: "m-102" },
          response: { delivered: true, eta_ms: 1800 },
        },
      ],
    },
    cv: {
      title: "CV Builder API",
      version: "1.0.0",
      baseUrl: "https://cv.demo/v1",
      auth: "Bearer Sanctum token",
      paths: [
        {
          method: "GET",
          path: "/resumes/{id}",
          summary: "Fetch resume aggregate with sections",
          response: { id: 9, sections: ["experience", "skills"], cached: true },
        },
        {
          method: "POST",
          path: "/resumes",
          summary: "Create resume (Clean Architecture use-case)",
          body: { title: "Backend Engineer", template: "modern" },
          response: { id: 10, status: "draft" },
        },
      ],
    },
    "sanabel-iq": {
      title: "Sanabel IQ Web JSON Surfaces",
      version: "v1",
      baseUrl: "/",
      auth: "Session cookie (Laravel Breeze) for student/parent routes; public for /health and POST /demo-requests",
      paths: [
        {
          method: "GET",
          path: "/health",
          summary: "Ops readiness probe (DB, Redis, storage free space)",
          response: {
            status: "ok",
            services: { database: "up", redis: "up", storage: "up" },
          },
        },
        {
          method: "POST",
          path: "/demo-requests",
          summary: "Landing CTA: create DemoRequest (throttle 5/min) and notify admins",
          body: {
            school_name: "مدرسة الأمل",
            contact_name: "أحمد محمد",
            job_title: "مدير المدرسة",
            phone: "0512345678",
            email: "admin@school.example",
            seat_range: "50-100",
            notes: "نرغب بعرض للمنهج الصف الأول",
          },
          response: {
            message: "تم استلام طلب العرض التجريبي بنجاح. سيتواصل معكم فريق سنابل IQ قريباً.",
            data: { id: 1 },
          },
        },
        {
          method: "POST",
          path: "/student/interactive-lesson/{lessonKey}/analytics",
          summary: "Queue a lesson telemetry event into ProcessAnalyticsEventJob → lesson_analytics",
          headers: { Cookie: "laravel_session=…", "X-XSRF-TOKEN": "…" },
          body: {
            event_type: "station_complete",
            concept_key: "letter_raa",
            station: 3,
            error_count: 0,
            payload: { time_spent: 42 },
          },
          response: {
            queued: true,
            lesson_key: "ar-g1-letter-raa",
            event_type: "station_complete",
            station: 3,
          },
        },
        {
          method: "POST",
          path: "/student/ai/pronunciation",
          summary: "Score Arabic pronunciation attempt for a lesson target (active student + throttle)",
          headers: { Cookie: "laravel_session=…", "X-XSRF-TOKEN": "…" },
          body: {
            target: "رَ",
            transcript: "را",
            lesson_key: "ar-g1-letter-raa",
          },
          response: {
            result: "match",
            score: 85,
            feedback: "ممتاز! نطقك واضح",
          },
        },
        {
          method: "GET",
          path: "/parent/mastery-analytics/{student}/data",
          summary: "JSON mastery aggregate from lesson_analytics for an owned child",
          headers: { Cookie: "laravel_session=…", Accept: "application/json" },
          response: {
            student_id: 1,
            overview: {
              completion_rate: 75,
              average_mastery_score: 82,
              total_time_spent_seconds: 1200,
              lessons_touched: 4,
              lessons_completed: 3,
            },
            time_by_lesson: { "ar-g1-letter-raa": 400 },
            time_by_station: { "3": 120 },
            stations: { voice: {}, tracing: {}, quiz_discovery: {} },
            ai_interventions: { total_hints: 2, by_concept: { diacritic_confusion: 2 } },
          },
        },
      ],
    },
  };

  let state = {
    endpoint: "metrics",
    cached: false,
    audio: localStorage.getItem("yz-audio") !== "0",
    lastLatency: 0,
  };

  function t() {
    return window.I18N?.[document.documentElement.lang === "ar" ? "ar" : "en"] || {};
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function syntaxJson(obj) {
    return JSON.stringify(obj, null, 2)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/("(?:\\.|[^"\\])*")(\s*:)/g, '<span class="c-key">$1</span>$2')
      .replace(/(:\s*)("(?:\\.|[^"\\])*")/g, '$1<span class="c-str">$2</span>')
      .replace(/(:\s*)(\d+\.?\d*)/g, '$1<span class="c-num">$2</span>')
      .replace(/(:\s*)(true|false|null)/g, '$1<span class="c-fn">$2</span>')
      .replace(/(^\s*)("(?:\\.|[^"\\])*")(,?$)/gm, '$1<span class="c-str">$2</span>$3');
  }

  function playClick() {
    if (!state.audio) return;
    try {
      const ctx = playClick.ctx || (playClick.ctx = new (window.AudioContext || window.webkitAudioContext)());
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "square";
      o.frequency.value = 180 + Math.random() * 40;
      g.gain.value = 0.03;
      o.connect(g);
      g.connect(ctx.destination);
      o.start();
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      o.stop(ctx.currentTime + 0.06);
    } catch (_) {}
  }

  function animateCount(el, from, to, ms = 300) {
    const start = performance.now();
    const pill = el?.closest?.(".latency-pill");
    function frame(now) {
      const p = Math.min(1, (now - start) / ms);
      const eased = 1 - Math.pow(1 - p, 3);
      const val = Math.round(from + (to - from) * eased);
      el.textContent = `${val}ms`;
      if (el instanceof HTMLElement) el.setAttribute("dir", "ltr");
      if (p < 1) requestAnimationFrame(frame);
      else if (pill) {
        pill.classList.remove("is-flash");
        // reflow to restart animation
        void pill.offsetWidth;
        pill.classList.add("is-flash");
      }
    }
    requestAnimationFrame(frame);
  }

  function readLatencyMs(el) {
    if (!el) return 0;
    const n = parseInt(String(el.textContent).replace(/[^\d]/g, ""), 10);
    return Number.isFinite(n) ? n : 0;
  }

  function flashLatency() {
    const pill = $(".latency-pill");
    if (!pill) return;
    pill.classList.remove("is-flash");
    void pill.offsetWidth;
    pill.classList.add("is-flash");
  }

  function parseBody() {
    const ta = $("#sandbox-body-input");
    if (!ta || ta.disabled) return null;
    try {
      return JSON.parse(ta.value || "{}");
    } catch {
      return null;
    }
  }

  function syncEndpointUI() {
    const ep = ENDPOINTS[state.endpoint];
    const badge = $(".sandbox-badge");
    const curlLine = $("#sandbox-curl-preview");
    const bodyWrap = $("#sandbox-body-wrap");
    const bodyInput = $("#sandbox-body-input");
    if (badge) {
      badge.setAttribute("dir", "ltr");
      badge.innerHTML = `<bdi dir="ltr">${ep.method} ${ep.path}</bdi>`;
    }
    if (curlLine) {
      curlLine.setAttribute("dir", "ltr");
      curlLine.innerHTML = `<bdi dir="ltr">${escapeHtml(buildCurl(false))}</bdi>`;
    }
    $$("[data-endpoint]").forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.endpoint === state.endpoint);
    });
    const hasBody = ep.method !== "GET";
    if (bodyWrap) bodyWrap.hidden = !hasBody;
    if (bodyInput) {
      bodyInput.disabled = !hasBody;
      if (hasBody && ep.body) bodyInput.value = JSON.stringify(ep.body, null, 2);
    }
  }

  function buildCurl(pretty = true) {
    const ep = ENDPOINTS[state.endpoint];
    const url = `https://api.demo${ep.path}`;
    let cmd = `curl -X ${ep.method} '${url}' -H 'Accept: application/json'`;
    if (ep.method !== "GET") {
      const body = parseBody() || ep.body || {};
      cmd += ` -H 'Content-Type: application/json' -d '${JSON.stringify(body)}'`;
    }
    if (state.cached) cmd += ` -H 'X-Cache-Prefer: hit'`;
    return pretty ? cmd : cmd;
  }

  function runSandbox(opts = {}) {
    const { quiet = false } = opts;
    const ep = ENDPOINTS[state.endpoint];
    const output = $("#sandbox-output");
    const meta = $("#sandbox-meta");
    const msEl = $("#sandbox-ms");
    const runBtn = $("#run-api");
    const statusPill = $("#sandbox-status");
    if (!output || !meta || !msEl || !runBtn) return;

    const body = parseBody();
    if (ep.method !== "GET" && body === null) {
      output.innerHTML = `<span class="c-muted">Invalid JSON payload</span>`;
      return;
    }

    const base = state.cached ? ep.cached : ep.cold;
    const latency = base + Math.floor(Math.random() * 8);
    const from = readLatencyMs(msEl) || state.lastLatency || (state.cached ? ep.cold : ep.cached);
    const i18n = t();

    if (!quiet) {
      runBtn.disabled = true;
      meta.hidden = true;
      output.innerHTML = `<span class="c-muted">${escapeHtml(i18n.sandbox?.running || "Fetching…")}</span>`;
      playClick();
    }

    const delay = quiet ? 40 : Math.min(latency, 280);

    setTimeout(() => {
      const payload = ep.build(state.cached, latency, body);
      output.innerHTML = syntaxJson(payload);
      meta.hidden = false;
      animateCount(msEl, from, latency, 300);
      state.lastLatency = latency;
      if (statusPill) {
        statusPill.setAttribute("dir", "ltr");
        statusPill.innerHTML = `<bdi dir="ltr">200 OK</bdi>`;
      }
      runBtn.disabled = false;
      if (!quiet) {
        window.YZAnalytics?.track("sandbox_run", {
          endpoint: state.endpoint,
          method: ep.method,
          path: ep.path,
          cache_mode: state.cached ? "hit" : "cold",
          latency_ms: latency,
        });
        playClick();
      } else flashLatency();
    }, delay);
  }

  function initSandbox() {
    syncEndpointUI();
    $$("[data-endpoint]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.endpoint = btn.dataset.endpoint;
        syncEndpointUI();
        playClick();
      });
    });

    $$("[data-cache]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const nextCached = btn.dataset.cache === "hit";
        if (state.cached === nextCached) return;
        state.cached = nextCached;
        $$("[data-cache]").forEach((b) => b.classList.toggle("is-active", b === btn));
        const curlLine = $("#sandbox-curl-preview");
        if (curlLine) {
          curlLine.setAttribute("dir", "ltr");
          curlLine.innerHTML = `<bdi dir="ltr">${escapeHtml(buildCurl(false))}</bdi>`;
        }
        window.YZAnalytics?.track("sandbox_cache_toggle", {
          cache_mode: state.cached ? "hit" : "cold",
          endpoint: state.endpoint,
        });
        playClick();
        // Always animate latency transition (even before first Run)
        const meta = $("#sandbox-meta");
        const msEl = $("#sandbox-ms");
        if (meta) meta.hidden = false;
        if (msEl && !state.lastLatency) {
          const ep = ENDPOINTS[state.endpoint];
          msEl.textContent = `${state.cached ? ep.cold : ep.cached}ms`;
          state.lastLatency = state.cached ? ep.cold : ep.cached;
        }
        runSandbox({ quiet: true });
      });
    });

    $("#run-api")?.addEventListener("click", () => runSandbox());
    $("#copy-curl")?.addEventListener("click", async () => {
      const cmd = buildCurl();
      const btn = $("#copy-curl");
      try {
        await navigator.clipboard.writeText(cmd);
      } catch {
        const ta = document.createElement("textarea");
        ta.value = cmd;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
      }
      const label = btn ? $("[data-i18n='sandbox.copyCurl']", btn) : null;
      const i18n = t();
      if (label) label.textContent = i18n.sandbox?.copiedCurl || "Copied";
      btn?.classList.add("is-copied");
      setTimeout(() => {
        btn?.classList.remove("is-copied");
        if (label) label.textContent = t().sandbox?.copyCurl || "Copy as cURL";
      }, 1400);
      playClick();
    });
  }

  /* —— Architecture diagrams —— */
  function initArchitecture() {
    $$("[data-arch-diagram]").forEach((canvas) => {
      const pop = $(".arch-popover", canvas);
      const nodes = $$("[data-node]", canvas);
      const edges = $$("[data-edge]", canvas);

      function clear() {
        nodes.forEach((n) => n.classList.remove("is-active", "is-dim"));
        edges.forEach((e) => e.classList.remove("is-lit", "is-dim"));
        if (pop) pop.hidden = true;
      }

      function activate(nodeKey) {
        const info = NODE_INFO[nodeKey];
        if (!info || !pop) return;
        nodes.forEach((n) => {
          const on = n.dataset.node === nodeKey;
          n.classList.toggle("is-active", on);
          n.classList.toggle("is-dim", !on);
        });
        edges.forEach((e) => {
          const lit = (e.dataset.edge || "").split(/\s+/).includes(nodeKey);
          e.classList.toggle("is-lit", lit);
          e.classList.toggle("is-dim", !lit);
        });
        $(".arch-pop-title", pop).textContent = info.title;
        $(".arch-pop-why", pop).textContent = info.why;
        const badges = $(".arch-pop-badges", pop);
        badges.innerHTML = info.badges
          .map((b) => `<span class="chip"><bdi dir="ltr">${escapeHtml(b)}</bdi></span>`)
          .join("");
        pop.hidden = false;
        playClick();
      }

      nodes.forEach((n) => {
        n.style.cursor = "pointer";
        n.addEventListener("mouseenter", () => activate(n.dataset.node));
        n.addEventListener("click", (e) => {
          e.stopPropagation();
          activate(n.dataset.node);
        });
      });

      canvas.addEventListener("mouseleave", clear);
      document.addEventListener("click", (e) => {
        if (!canvas.contains(e.target)) clear();
      });
    });
  }

  /* —— OpenAPI drawer —— */
  function openDrawer(specKey) {
    const spec = OPENAPI[specKey];
    if (!spec) return;
    const drawer = $("#openapi-drawer");
    const backdrop = $("#drawer-backdrop");
    if (!drawer || !backdrop) return;

    $("#openapi-title") && ($("#openapi-title").textContent = spec.title);
    const metaEl = $("#openapi-meta");
    if (metaEl) {
      metaEl.innerHTML = `<bdi dir="ltr">${escapeHtml(
        `${spec.version} · ${spec.baseUrl} · Auth: ${spec.auth}`
      )}</bdi>`;
    }
    const body = $("#openapi-paths");
    if (!body) return;
    body.innerHTML = spec.paths
      .map(
        (p) => `
      <article class="oa-path">
        <header>
          <span class="oa-method oa-${p.method.toLowerCase()}" dir="ltr"><bdi dir="ltr">${p.method}</bdi></span>
          <code dir="ltr"><bdi dir="ltr">${escapeHtml(p.path)}</bdi></code>
        </header>
        <p>${escapeHtml(p.summary)}</p>
        ${
          p.headers
            ? `<h5>Headers</h5><pre class="overflow-x-auto" dir="ltr">${syntaxJson(p.headers)}</pre>`
            : ""
        }
        ${p.body ? `<h5>Request body</h5><pre class="overflow-x-auto" dir="ltr">${syntaxJson(p.body)}</pre>` : ""}
        <h5>Example response</h5>
        <pre class="overflow-x-auto" dir="ltr">${syntaxJson(p.response)}</pre>
      </article>`
      )
      .join("");

    drawer.classList.add("is-open");
    backdrop.classList.add("is-open");
    drawer.setAttribute("aria-hidden", "false");
    document.body.classList.add("drawer-open");
    window.YZAnalytics?.track("openapi_drawer_open", {
      spec: specKey,
      title: spec.title,
      version: spec.version,
    });
    playClick();
  }

  function closeDrawer() {
    $("#openapi-drawer")?.classList.remove("is-open");
    $("#drawer-backdrop")?.classList.remove("is-open");
    $("#openapi-drawer")?.setAttribute("aria-hidden", "true");
    document.body.classList.remove("drawer-open");
  }

  function initOpenApi() {
    $$("[data-openapi]").forEach((btn) => {
      btn.addEventListener("click", () => openDrawer(btn.dataset.openapi));
    });
    $("#drawer-close")?.addEventListener("click", closeDrawer);
    $("#drawer-backdrop")?.addEventListener("click", closeDrawer);
  }

  /* —— Command palette —— */
  function openPalette() {
    const pal = $("#cmd-palette");
    const backdrop = $("#cmd-backdrop");
    if (!pal) return;
    pal.classList.add("is-open");
    backdrop?.classList.add("is-open");
    pal.setAttribute("aria-hidden", "false");
    const input = $("#cmd-input");
    if (input) {
      input.value = "";
      input.focus();
    }
    renderCmdResults("");
    playClick();
  }

  function closePalette() {
    $("#cmd-palette")?.classList.remove("is-open");
    $("#cmd-backdrop")?.classList.remove("is-open");
    $("#cmd-palette")?.setAttribute("aria-hidden", "true");
  }

  function openContactModal() {
    closePalette();
    const m = $("#contact-modal");
    const b = $("#modal-backdrop");
    m?.classList.add("is-open");
    b?.classList.add("is-open");
    m?.setAttribute("aria-hidden", "false");
  }

  function closeContactModal() {
    $("#contact-modal")?.classList.remove("is-open");
    $("#modal-backdrop")?.classList.remove("is-open");
    $("#contact-modal")?.setAttribute("aria-hidden", "true");
  }

  function scrollToId(id) {
    closePalette();
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function downloadFile(href, filename, eventName, extra = {}) {
    try {
      const res = await fetch(`${href}?v=20260924`);
      if (!res.ok) throw new Error(`fetch ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      const a = document.createElement("a");
      a.href = href;
      a.download = filename;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
    window.YZAnalytics?.track(eventName, {
      lang: document.documentElement.lang || "en",
      ...extra,
    });
  }

  function downloadCv() {
    return downloadFile(
      "./assets/Yousef_Zaqout_CV.pdf",
      "Yousef_Zaqout_CV.pdf",
      "cv_download",
      { variant: "branded" }
    );
  }

  function downloadCvAts() {
    return downloadFile(
      "./assets/Yousef_Zaqout_CV_ATS.pdf",
      "Yousef_Zaqout_CV_ATS.pdf",
      "cv_download",
      { variant: "ats" }
    );
  }

  function openCvSheet() {
    closePalette();
    closeContactModal();
    const sheet = $("#cv-sheet");
    const backdrop = $("#cv-backdrop");
    const trigger = $("#cv-open");
    if (!sheet) return;
    sheet.classList.add("is-open");
    backdrop?.classList.add("is-open");
    sheet.setAttribute("aria-hidden", "false");
    trigger?.setAttribute("aria-expanded", "true");
    document.body.classList.add("cv-sheet-open");
    $("#cv-sheet-close")?.focus();
  }

  function closeCvSheet() {
    const sheet = $("#cv-sheet");
    const backdrop = $("#cv-backdrop");
    const trigger = $("#cv-open");
    sheet?.classList.remove("is-open");
    backdrop?.classList.remove("is-open");
    sheet?.setAttribute("aria-hidden", "true");
    trigger?.setAttribute("aria-expanded", "false");
    document.body.classList.remove("cv-sheet-open");
  }

  function handleCvDownload(variant) {
    if (variant === "ats") downloadCvAts();
    else downloadCv();
    closeCvSheet();
  }

  function initCvDownload() {
    $("#cv-open")?.addEventListener("click", openCvSheet);
    $("#cv-sheet-close")?.addEventListener("click", closeCvSheet);
    $("#cv-backdrop")?.addEventListener("click", closeCvSheet);
    $$("[data-cv-download]").forEach((btn) => {
      btn.addEventListener("click", () => handleCvDownload(btn.dataset.cvDownload));
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && $("#cv-sheet")?.classList.contains("is-open")) {
        closeCvSheet();
      }
    });
  }

  const COMMANDS = [
    {
      id: "help",
      label: "help",
      hint: "List available commands",
      run: () => {
        const input = $("#cmd-input");
        if (input) input.value = "help";
        renderCmdResults("help");
      },
    },
    {
      id: "skills",
      label: "skills",
      hint: "Jump to tech stack badges",
      run: () => scrollToId("tech-stack"),
    },
    {
      id: "projects",
      label: "projects",
      hint: "Jump to case studies",
      run: () => scrollToId("projects"),
    },
    {
      id: "contact",
      label: "curl /contact",
      hint: "Smooth scroll to contact",
      aliases: ["contact", "curl /contact", "curl/contact"],
      run: () => scrollToId("contact"),
    },
    {
      id: "cv",
      label: "download-cv",
      hint: "Download branded CV (PDF)",
      aliases: ["download-cv", "cv", "resume"],
      run: () => {
        downloadCv();
        closePalette();
      },
    },
    {
      id: "cvAts",
      label: "download-cv-ats",
      hint: "Download ATS-friendly CV (PDF)",
      aliases: ["download-cv-ats", "cv-ats", "ats", "resume-ats"],
      run: () => {
        downloadCvAts();
        closePalette();
      },
    },
    {
      id: "rigor",
      label: "perf",
      hint: "Engineering rigor / N+1 demo",
      aliases: ["perf", "rigor", "n+1"],
      run: () => scrollToId("rigor"),
    },
  ];

  function matchCommand(query) {
    const q = query.trim().toLowerCase();
    return COMMANDS.filter((c) => {
      const aliases = [c.label, c.id, ...(c.aliases || [])].map((s) => s.toLowerCase());
      return aliases.some((a) => a.includes(q) || q.includes(a)) || c.hint.toLowerCase().includes(q);
    });
  }

  function renderCmdResults(q) {
    const list = $("#cmd-results");
    if (!list) return;
    const query = q.trim().toLowerCase();
    const i18n = t();
    const hits = !query || query === "help" ? COMMANDS : matchCommand(query);
    if (!hits.length) {
      list.innerHTML = `<p class="cmd-empty">${escapeHtml(i18n.cmd?.empty || "No commands match")} <bdi dir="ltr">${escapeHtml(query)}</bdi></p>`;
      return;
    }
    list.innerHTML = hits
      .map(
        (c) =>
          `<button type="button" class="cmd-item" data-cmd="${c.id}"><code>${escapeHtml(c.label)}</code><span>${escapeHtml(
            i18n.cmd?.[c.id] || c.hint
          )}</span></button>`
      )
      .join("");
    $$(".cmd-item", list).forEach((btn) => {
      btn.addEventListener("click", () => {
        const cmd = COMMANDS.find((c) => c.id === btn.dataset.cmd);
        if (cmd) {
          window.YZAnalytics?.track("cmd_palette_exec", {
            command_id: cmd.id,
            command_label: cmd.label,
            source: "click",
          });
          cmd.run();
        }
        playClick();
      });
    });
  }

  function resolveCommand(query) {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    const exact = COMMANDS.find((c) => {
      const aliases = [c.label, c.id, ...(c.aliases || [])].map((s) => s.toLowerCase());
      return aliases.includes(q);
    });
    if (exact) return exact;
    const hits = matchCommand(q);
    return hits[0] || null;
  }

  function runCommandById(id, source = "id") {
    const cmd = COMMANDS.find((c) => c.id === id);
    if (!cmd) return;
    window.YZAnalytics?.track("cmd_palette_exec", {
      command_id: cmd.id,
      command_label: cmd.label,
      source,
    });
    cmd.run();
    playClick();
  }

  function initHotkeyBadge() {
    const isMac = /Mac|iPhone|iPad|iPod/i.test(navigator.platform || "") || navigator.userAgent.includes("Mac");
    const label = isMac ? "⌘K" : "Ctrl+K";
    const badge = $("#cmd-hotkey");
    const btn = $("#cmd-open");
    if (badge) badge.textContent = label;
    if (btn) {
      btn.setAttribute("aria-label", `Open command palette (${label})`);
      btn.setAttribute("title", `Open command palette (${label})`);
    }
  }

  function initPalette() {
    initHotkeyBadge();
    $("#cmd-open")?.addEventListener("click", openPalette);
    $("#cmd-close")?.addEventListener("click", closePalette);
    $("#cmd-backdrop")?.addEventListener("click", closePalette);
    $("#cmd-input")?.addEventListener("input", (e) => renderCmdResults(e.target.value));
    $("#cmd-input")?.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      e.preventDefault();
      const value = e.target.value || "";
      const cmd = resolveCommand(value);
      if (cmd) {
        runCommandById(cmd.id, "enter");
        return;
      }
      const first = $(".cmd-item");
      first?.click();
    });
    document.addEventListener("keydown", (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        const open = $("#cmd-palette")?.classList.contains("is-open");
        open ? closePalette() : openPalette();
      }
      if (e.key === "Escape") {
        closePalette();
        closeDrawer();
        closeContactModal();
      }
    });
    $("#modal-close")?.addEventListener("click", closeContactModal);
    $("#modal-backdrop")?.addEventListener("click", closeContactModal);
  }

  /* —— Telemetry —— */
  function initTelemetry() {
    const edge = $("#telemetry-edge");
    if (!edge) return;
    setInterval(() => {
      const ms = 14 + Math.floor(Math.random() * 12);
      edge.textContent = `${ms}ms`;
    }, 4000);
  }

  /* —— Audio mute —— */
  function initAudioToggle() {
    const btn = $("#audio-toggle");
    if (!btn) return;
    const sync = () => {
      btn.classList.toggle("is-muted", !state.audio);
      btn.setAttribute("aria-pressed", state.audio ? "true" : "false");
      btn.title = state.audio ? "Mute keypress" : "Unmute keypress";
    };
    sync();
    btn.addEventListener("click", () => {
      state.audio = !state.audio;
      localStorage.setItem("yz-audio", state.audio ? "1" : "0");
      sync();
    });
  }

  /* —— Portfolio pagination (3 per page) —— */
  const ITEMS_PER_PAGE = 3;

  function initPortfolioPagination() {
    const nav = $("#portfolio-pagination");
    const list = $(".portfolio-list");
    if (!nav || !list) return;

    const projects = $$("[data-case]", list);
    const totalPages = Math.max(1, Math.ceil(projects.length / ITEMS_PER_PAGE));
    const numbersEl = $("[data-page-numbers]", nav);
    const prevBtn = $("[data-page-nav='prev']", nav);
    const nextBtn = $("[data-page-nav='next']", nav);
    let currentPage = 1;

    if (totalPages <= 1) {
      nav.hidden = true;
      projects.forEach((card) => {
        card.hidden = false;
        card.classList.add("is-visible");
      });
      return;
    }

    nav.hidden = false;

    function scrollToProjects() {
      const target = $("#projects") || $("#work");
      if (!target) return;
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function renderPage(page, { scroll } = { scroll: false }) {
      currentPage = Math.min(Math.max(1, page), totalPages);
      const start = (currentPage - 1) * ITEMS_PER_PAGE;
      const end = currentPage * ITEMS_PER_PAGE;

      projects.forEach((card, i) => {
        const on = i >= start && i < end;
        card.hidden = !on;
        if (on) card.classList.add("is-visible");
      });

      if (numbersEl) {
        numbersEl.innerHTML = Array.from({ length: totalPages }, (_, idx) => {
          const n = idx + 1;
          const active = n === currentPage ? " is-active" : "";
          return `<button type="button" class="page-num${active}" data-page="${n}" aria-label="Page ${n}"${
            n === currentPage ? ' aria-current="page"' : ""
          }>${n}</button>`;
        }).join("");
      }

      if (prevBtn) prevBtn.disabled = currentPage === 1;
      if (nextBtn) nextBtn.disabled = currentPage === totalPages;
      if (scroll) scrollToProjects();
    }

    prevBtn?.addEventListener("click", () => {
      if (currentPage > 1) {
        playClick();
        renderPage(currentPage - 1, { scroll: true });
      }
    });

    nextBtn?.addEventListener("click", () => {
      if (currentPage < totalPages) {
        playClick();
        renderPage(currentPage + 1, { scroll: true });
      }
    });

    numbersEl?.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-page]");
      if (!btn) return;
      const page = Number(btn.dataset.page);
      if (!Number.isFinite(page) || page === currentPage) return;
      playClick();
      renderPage(page, { scroll: true });
    });

    renderPage(1);
  }

  /* —— N+1 comparison —— */
  function initRigor() {
    const root = $("#rigor");
    if (!root) return;
    const bars = $$("[data-bar]", root);
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            bars.forEach((b) => {
              b.style.width = b.dataset.bar;
            });
            io.disconnect();
          }
        });
      },
      { threshold: 0.3 }
    );
    io.observe(root);
  }

  function init() {
    initSandbox();
    initArchitecture();
    initOpenApi();
    initPalette();
    initTelemetry();
    initAudioToggle();
    initRigor();
    initPortfolioPagination();
    initCvDownload();
  }

  return {
    init,
    openPalette,
    openDrawer,
    openContactModal,
    closeDrawer,
    closePalette,
    closeCvSheet,
    refreshCmd: renderCmdResults,
  };
})();

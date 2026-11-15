/* Interactive portfolio features — sandbox, cmd+k, arch, openapi */
window.YZFeatures = (function () {
  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];

  const ENDPOINTS = {
    metrics: {
      method: "GET",
      path: "/v1/metrics",
      label: "System Telemetry",
      body: null,
      cold: 148,
      coldJitter: 32,
      cached: 4,
      cachedJitter: 4,
      build: (cached, latency, body) => ({
        ok: true,
        endpoint: "/v1/metrics",
        cached,
        cache_layer: cached ? "redis" : "postgresql",
        latency_ms: latency,
        data: {
          api_p95_ms: cached ? latency : 168,
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
      body: { query: "How do we throttle checkout requests?", top_k: 5, collection: "docs" },
      cold: 420,
      coldJitter: 24,
      cached: 6,
      cachedJitter: 3,
      build: (cached, latency, body) => ({
        ok: true,
        endpoint: "/v1/ai/rag-search",
        cached,
        latency_ms: latency,
        query: body?.query || "",
        results: [
          { id: "doc_18", score: 0.91, snippet: "Redis token bucket for Stripe webhooks…" },
          { id: "doc_07", score: 0.86, snippet: "Preload order relations to prevent N+1…" },
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
      coldJitter: 24,
      cached: 7,
      cachedJitter: 3,
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
      why: "Domain services and application logic live here so controllers stay thin and business rules stay testable.",
    },
    filament: {
      title: "Filament Admin",
      badges: ["Filament v3", "Panels", "RBAC"],
      why: "Operator control panel for campaigns, content approval queues, and account connectors without bloating the public API layer.",
    },
    horizon: {
      title: "Redis / Horizon",
      badges: ["Queues", "Workers", "Retries"],
      why: "Async job processing for AI generation, publish pipelines, and budget checks keeps the request path responsive under load.",
    },
    openrouter: {
      title: "OpenRouter / LLM",
      badges: ["LLM", "Drivers", "Tone"],
      why: "Pluggable AI content generation drivers with tone controls, where human approval gates every publish step.",
    },
    oauth: {
      title: "OAuth Connectors",
      badges: ["Google Ads", "Social", "Tokens"],
      why: "Secure OAuth bridges to Google Ads and social platforms so accounts stay unified without storing raw credentials.",
    },
    connect: {
      title: "Connect Account",
      badges: ["OAuth", "Sandbox", "Encrypted"],
      why: "Filament Connected Accounts and /social/* OAuth (LinkedIn, Google Ads) or sandbox connectors (X, YouTube, TikTok, Snapchat). Tokens are encrypted on connected_accounts and refreshed every 30m.",
    },
    generate: {
      title: "Generate AI Content",
      badges: ["AIAction", "Quota", "LLM"],
      why: "Filament AI Actions dispatch GenerateAIContentJob on the default queue. QuotaService checks plan limits before AIManager calls OpenRouter or Anthropic.",
    },
    approve: {
      title: "Approve AI Action",
      badges: ["Human Gate", "Status FSM"],
      why: "AIActionService enforces ActionStatus transitions. Actionable outputs land in pending_approval until approved, then dispatch ExecuteAIActionJob.",
    },
    publish: {
      title: "Publish Social",
      badges: ["Drivers", "Horizon", "LinkedIn/X"],
      why: "ExecuteAIActionJob marks executing, resolves ConnectedAccount, publishes via SocialDriverFactory (LinkedIn, X, YouTube), then stores execution_result.",
    },
    sync: {
      title: "Sync Ad Metrics",
      badges: ["Ad Drivers", "Hourly"],
      why: "SyncAdCampaignMetricsJob pulls campaign metrics hourly through AdDriverFactory across Google Ads, TikTok Ads, and Snapchat Ads.",
    },
    analyze: {
      title: "Process Ad Analytics",
      badges: ["KPI", "Pipeline", "JSONB"],
      why: "AnalyzeAdPerformanceJob runs ProcessAdAnalyticsPipeline: FetchLatestMetrics → CalculateKpi → GenerateOpenRouterInsights, persisting results in ad_recommendations.",
    },
    recs: {
      title: "Ad Recommendations",
      badges: ["Insights", "OpenRouter"],
      why: "Structured optimization actions (pause, adjust budget, creative refresh) stored in ad_recommendations once analytics complete.",
    },
    apply: {
      title: "Apply or Dismiss",
      badges: ["Guardrails", "Ads"],
      why: "ApplyAdRecommendationService and AdDriverFactory apply or dismiss recommendations while CheckAdBudgetGuardrailsJob enforces spend limits every 30m.",
    },
    hmac: {
      title: "HMAC Webhook Ingestion",
      badges: ["Strict HMAC", "Multi channel", "Redis Lock"],
      why: "WebhookController resolves tenant and source, verifies HMAC or API keys strictly, acquires a 300s Redis lead lock, then dispatches ProcessLeadIngestionJob.",
    },
    sla: {
      title: "Laravel 13 SLA Engine",
      badges: ["Business Hours", "Timezone", "SOLID"],
      why: "LeadProcessingPipeline assigns via ContextAwareRoutingService and calculates deadlines across working hours. Scheduler triggers warnings at 50%, reassignment at 80%, and escalation on breach.",
    },
    pgvector: {
      title: "PostgreSQL + pgvector",
      badges: ["PG 18", "JSONB", "Embeddings"],
      why: "Isolated organization lead store plus knowledge_chunks embeddings via pgvector, backing VectorSearchService for ProcessAiResponseJob.",
    },
    "ft-horizon": {
      title: "Redis / Horizon Queues",
      badges: ["high", "notifications", "default"],
      why: "Horizon runs lead ingestion and AI replies on high priority queues, SLA alerts on notifications, and knowledge indexing on default.",
    },
    rag: {
      title: "Confidence Gated RAG",
      badges: ["Credits", "Threshold", "Human Fallback"],
      why: "RagInferenceService embeds the brief, searches pgvector, checks TenantSetting confidence thresholds, and routes low confidence cases directly to a human.",
    },
    n8n: {
      title: "n8n / Telegram Alerts",
      badges: ["Escalation", "Automation", "Callbacks"],
      why: "NotificationDriverFactory delivers assignment and breach alerts to Telegram, n8n, or signed webhooks while handling claim and reply callbacks.",
    },
    redis: {
      title: "Redis Cache",
      badges: ["Cache", "Sessions", "Rate limit"],
      why: "Chosen for fast reads under 20ms on hot paths including sessions, rate limits, and expensive query caching.",
    },
    postgres: {
      title: "PostgreSQL",
      badges: ["Indexed", "ACID", "JSONB"],
      why: "Source of truth with composite indexes and constrained schemas for predictable p95 latency.",
    },
    stripe: {
      title: "Stripe",
      badges: ["Webhooks", "Idempotency"],
      why: "Payment intents and signed webhooks paired with idempotency keys to prevent duplicate charges.",
    },
    openai: {
      title: "OpenAI / RAG",
      badges: ["Embeddings", "Retrieval"],
      why: "RAG pipeline retrieves grounded chunks before generation, cutting hallucination risk in product flows.",
    },
    scraper: {
      title: "Scraper Bot",
      badges: ["Polling", "Filters"],
      why: "Lightweight fetch and filter pipeline tuned for sub second discovery of new listings.",
    },
    telegram: {
      title: "Telegram",
      badges: ["Alerts", "< 5s"],
      why: "Instant push channel for relevant opportunities without manual polling.",
    },
    "sn-clients": {
      title: "Actors & Clients",
      badges: ["RTL", "PIN / Email"],
      why: "Student app, parent and teacher portals, Filament admin, and public landing all run on one Laravel application.",
    },
    "sn-laravel": {
      title: "Laravel 13 Backend",
      badges: ["Breeze Session", "Livewire"],
      why: "Web routes serve pages and JSON endpoints while middleware enforces auth, active child context, and school data isolation.",
    },
    "sn-filament": {
      title: "Filament Panels",
      badges: ["/parent", "/admin"],
      why: "Parent dashboard and school admin operations covering demo requests, interactive lessons, and user roles.",
    },
    "lesson-engine": {
      title: "Interactive Lesson Engine",
      badges: ["6 Stations", "JSONB"],
      why: "Station configs drive each learning step into quizzes while AdaptiveMasteryEngine supplies contextual hints.",
    },
    queues: {
      title: "Redis Queues",
      badges: ["Jobs", "Digests"],
      why: "Background workers handle analytics events, PDF material chunking, activity recommendations, and weekly parent summaries.",
    },
    "sn-postgres": {
      title: "PostgreSQL 18 + pgvector",
      badges: ["OLTP", "Embeddings"],
      why: "Stores curriculum, students, lesson analytics, and vector embeddings for parent study material retrieval.",
    },
    "sn-ai": {
      title: "OpenRouter via Prism",
      badges: ["Gen", "Embeddings"],
      why: "Powers lesson activity generation and vector embeddings for the parent study RAG flow.",
    },
    "redis-cache": {
      title: "Redis Cache / Leaderboards",
      badges: ["CACHE_STORE", "QUEUE"],
      why: "Application cache, queue broker, and gamification leaderboard reads.",
    },
    "az-clients": {
      title: "Clients",
      badges: ["Public catalog", "B2C track", "B2B RFQ"],
      why: "Three audiences share one product interface without sharing session privilege.",
    },
    "az-edge": {
      title: "Netlify Edge",
      badges: ["CDN", "TLS", "CSP"],
      why: "Static WebP images and bundles stay cached at the edge for fast loading on weak mobile networks.",
    },
    "az-next": {
      title: "Next.js compute",
      badges: ["Server Actions", "Route handlers", "No workers"],
      why: "Inventory, accounting, and audit records commit inside the same HTTP request that started them.",
    },
    "az-auth": {
      title: "Split sessions",
      badges: ["Staff/B2B JWT", "B2C sealed cookie", "RBAC"],
      why: "Guest order tracking never inherits portal roles, and staff JWT sessions enforce a strict 8h limit.",
    },
    "az-neon": {
      title: "Neon + Drizzle",
      badges: ["Pooled", "rate_limits", "Immutable audit"],
      why: "Database row locks prevent stock conflicts, and the audit table rejects UPDATE or DELETE at the engine level.",
    },
    "az-r2": {
      title: "Private R2",
      badges: ["UUID keys", "Auth proxy", "No public URLs"],
      why: "BOQ files, payment slips, and site photos stream only after passing organization and role checks.",
    },
    "az-docs": {
      title: "Printable documents",
      badges: ["@media print", "ILS 0% tax", "Arabic RTL"],
      why: "Quotations and invoices render directly as print ready HTML without heavy headless browsers on serverless.",
    },
    "az-wa": {
      title: "Outbound channels",
      badges: ["wa.me", "Resend once", "No retry queue"],
      why: "Email failures never roll back an approved organization, and WhatsApp threads open directly when needed.",
    },
  };

  const OPENAPI = {
    "al-ostaz": {
      title: "Al Ostaz Ops Portal",
      version: "1.0",
      baseUrl: "https://al-ostaz-portal.netlify.app",
      auth: "Auth.js JWT (staff/B2B, 8h) · B2C encrypted cookie (30m idle) · role guards 403 · isolated org empty 404",
      paths: [
        {
          method: "POST",
          path: "/api/landing-leads",
          summary: "Public quote lead protected by honeypot and IP rate limit",
          headers: { "Content-Type": "application/json" },
          body: {
            name: "North Gaza Admin HQ",
            phone: "0599000000",
            governorate: "north_gaza",
            notes: "NGO office pack, 12 workstations",
          },
          response: {
            success: true,
            id: "7c2f1a9e-4b11-4d2a-9f0e-91a2c0d4e8b1",
          },
        },
        {
          method: "GET",
          path: "/api/files/{id}",
          summary: "Stream private R2 object after organization and role check",
          headers: { Cookie: "authjs.session-token=…" },
          response: {
            status: 200,
            headers: {
              "Content-Type": "application/pdf",
              "Content-Disposition": 'inline; filename="boq-uuid.pdf"',
            },
            note: "Unauthorized org access returns empty 404; wrong staff role returns 403",
          },
        },
        {
          method: "GET",
          path: "/documents/quotation/{id}",
          summary: "Arabic RTL printable quotation (HTML + @media print)",
          headers: { Cookie: "authjs.session-token=…" },
          response: {
            document: "QTE-2026-M0008",
            currency: "ILS",
            tax: "0.00",
            status: "valid",
            client: "North Gaza Admin HQ",
            lines: [
              { sku: "FUR-DSK-L", qty: 6, unit: "2150.00", total: "12900.00" },
              { sku: "FUR-CHR-001", qty: 12, unit: "850.00", total: "10200.00" },
            ],
            net_total: "35850.00",
            required_deposit: "10755.00",
          },
        },
        {
          method: "POST",
          path: "/track/confirm",
          summary: "B2C confirm from shared quotation and reserve stock under FOR UPDATE",
          headers: { Cookie: "b2c_track_session=…" },
          body: { tracking_code: "OST-2026-A7K9MP", action: "confirm" },
          response: {
            ok: true,
            order_status: "Confirmed, Awaiting Deposit",
            fulfillment_hold: true,
            reservations: [{ product_id: "39fc36d8-6050-423d-a031-744b7fa43f08", qty: 6 }],
            audit: { actor: "guest_b2c", event: "order.confirmed" },
          },
        },
        {
          method: "POST",
          path: "/portal/staff/accounting/vouchers/clear",
          summary: "Accountant clears offline payment voucher against invoice balance",
          headers: { Cookie: "authjs.session-token=…", "Content-Type": "application/json" },
          body: { voucher_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890" },
          response: {
            voucher_status: "Cleared",
            invoice_balance: "25095.00",
            order_status: "In Production / Fulfillment",
            note: "Sales role returns 403; overpayment rejected",
          },
        },
      ],
    },
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
          summary: "Inbound Meta lead with strict HMAC check into ProcessLeadIngestionJob (high)",
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
          summary: "Website form webhook protected by API key auth, 201 on accept",
          headers: { "X-Api-Key": "<website-key>", Accept: "application/json" },
          body: { name: "Sara", phone: "+9705…", email: "sara@example.com" },
          response: { success: true, message: "Lead accepted", source: "website" },
        },
        {
          method: "POST",
          path: "/v1/webhooks/telegram/{tenant_id}",
          summary: "Telegram bot callbacks for claim or reply via LeadWorkflowService",
          headers: { "X-Telegram-Bot-Api-Secret-Token": "<secret>" },
          response: { ok: true, action: "mark_in_progress", sla_status: "met" },
        },
        {
          method: "GET",
          path: "/v1/developer/leads",
          summary: "Developer API listing tenant leads (Sanctum abilities:developer:*)",
          headers: { Authorization: "Bearer {token}", Accept: "application/json" },
          response: {
            data: [{ id: 42, external_lead_id: "ext-1", sla_status: "running", source: "meta" }],
            meta: { per_page: 15, total: 128 },
          },
        },
        {
          method: "GET",
          path: "/v1/developer/analytics/sla-summary",
          summary: "SLA compliance summary showing live adherence and queue depth",
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
          summary: "Create resume via Clean Architecture service",
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

  function syncSandboxModeUI() {
    const latencyPill = $(".latency-pill");
    const layerPill = $("#sandbox-cache-layer");
    const cacheToggle = $(".cache-toggle");
    latencyPill?.classList.toggle("is-cached", state.cached);
    latencyPill?.classList.toggle("is-cold", !state.cached);
    cacheToggle?.classList.toggle("is-cached-mode", state.cached);
    cacheToggle?.classList.toggle("is-cold-mode", !state.cached);
    if (layerPill) {
      layerPill.hidden = false;
      layerPill.classList.toggle("is-cached", state.cached);
      layerPill.classList.toggle("is-cold", !state.cached);
      layerPill.setAttribute("dir", "ltr");
      layerPill.innerHTML = `<bdi dir="ltr">${state.cached ? "redis" : "postgresql"}</bdi>`;
      layerPill.classList.remove("is-pulse");
      if (state.cached) {
        void layerPill.offsetWidth;
        layerPill.classList.add("is-pulse");
      }
    }
  }

  function sampleLatency(ep) {
    if (state.cached) {
      const jitter = ep.cachedJitter ?? 8;
      return ep.cached + Math.floor(Math.random() * (jitter + 1));
    }
    const jitter = ep.coldJitter ?? 8;
    return ep.cold + Math.floor(Math.random() * (jitter + 1));
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

    const latency = sampleLatency(ep);
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
      syncSandboxModeUI();
      animateCount(msEl, from, latency, state.cached ? 420 : 300);
      state.lastLatency = latency;
      if (statusPill) {
        statusPill.setAttribute("dir", "ltr");
        statusPill.innerHTML = `<bdi dir="ltr">200 OK</bdi>`;
      }
      runBtn.disabled = false;
      output.classList.remove("is-fresh");
      void output.offsetWidth;
      output.classList.add("is-fresh");
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
        const more = $(".sandbox-more");
        if (more && state.endpoint !== "metrics") more.open = true;
        playClick();
      });
    });

    $$("[data-cache]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const nextCached = btn.dataset.cache === "hit";
        if (state.cached === nextCached) return;
        state.cached = nextCached;
        $$("[data-cache]").forEach((b) => b.classList.toggle("is-active", b === btn));
        syncSandboxModeUI();
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
    syncSandboxModeUI();

    $("#run-api")?.addEventListener("click", () => runSandbox());

    // Auto-run once when the sandbox first enters view
    const sandboxRoot = $("#api-sandbox");
    if (sandboxRoot) {
      let autoRan = false;
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (!e.isIntersecting || autoRan) return;
            autoRan = true;
            io.disconnect();
            runSandbox({ quiet: true });
            window.YZAnalytics?.track("sandbox_autorun", {
              endpoint: state.endpoint,
              cache_mode: state.cached ? "hit" : "cold",
            });
          });
        },
        { threshold: 0.35 }
      );
      io.observe(sandboxRoot);
    }

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
        if (on) {
          card.classList.add("is-visible");
          const img = $("[data-case-image]", card);
          if (img && img.naturalWidth === 0) {
            const isFlagship = card.dataset.project === "sanabel-iq";
            img.loading = isFlagship ? "eager" : "lazy";
            img.decoding = "async";
            if (isFlagship) img.setAttribute("fetchpriority", "high");
            else img.removeAttribute("fetchpriority");
            const src = (img.getAttribute("src") || "").split("?")[0];
            const webp = $("[data-case-image-webp]", card);
            if (webp) {
              const base = (webp.getAttribute("srcset") || "").split("?")[0];
              if (base) webp.setAttribute("srcset", base);
            }
            if (src) {
              img.src = src;
              bindCasePreviewImage($(".arch-frame", card), img);
            }
          }
          retryCasePreview(card);
        }
      });

      if (numbersEl) {
        numbersEl.innerHTML = Array.from({ length: totalPages }, (_, idx) => {
          const n = idx + 1;
          const active = n === currentPage ? " is-active" : "";
          return `<button type="button" class="page-num${active}" data-page="${n}" aria-label="Page ${n}" aria-current="${
            n === currentPage ? "page" : "false"
          }">${n}</button>`;
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

  /* —— Case media: Preview | Architecture —— */
  function setCaseMedia(frame, mode) {
    if (!frame) return;
    const tabs = $$("[data-case-media]", frame);
    const panels = $$("[data-case-panel]", frame);
    const title = $("[data-case-title]", frame);
    tabs.forEach((tab) => {
      const on = tab.dataset.caseMedia === mode;
      tab.classList.toggle("is-active", on);
      tab.setAttribute("aria-selected", on ? "true" : "false");
      tab.tabIndex = on ? 0 : -1;
    });
    panels.forEach((panel) => {
      const on = panel.dataset.casePanel === mode;
      panel.classList.toggle("is-active", on);
      panel.hidden = !on;
    });
    if (title) {
      const next =
        mode === "preview"
          ? title.dataset.titlePreview
          : title.dataset.titleArchitecture;
      if (next) {
        const bdi = $("bdi", title);
        if (bdi) bdi.textContent = next;
        else title.textContent = next;
      }
    }
  }

  function markPreviewMissing(frame) {
    const preview = $('[data-case-panel="preview"]', frame);
    const empty = $(".case-shot-empty", frame);
    const previewTab = $('[data-case-media="preview"]', frame);
    preview?.classList.add("is-missing");
    // Never surface "coming soon" — fall back to the architecture diagram silently.
    if (empty) empty.hidden = true;
    if (previewTab) previewTab.disabled = true;
    setCaseMedia(frame, "architecture");
  }

  function galleryLabels() {
    const i18n = t();
    return {
      prev: i18n.portfolio?.galleryPrev || i18n.portfolio?.prev || "Previous image",
      next: i18n.portfolio?.galleryNext || i18n.portfolio?.next || "Next image",
    };
  }

  function ensureGalleryChrome(preview) {
    let gallery = $(".case-gallery", preview);
    if (gallery) return gallery;

    const picture = $("picture", preview);
    if (!picture) return null;

    gallery = document.createElement("div");
    gallery.className = "case-gallery";
    gallery.tabIndex = 0;
    gallery.setAttribute("role", "group");
    gallery.setAttribute("aria-roledescription", "carousel");
    picture.replaceWith(gallery);
    gallery.appendChild(picture);

    const controls = document.createElement("div");
    controls.className = "case-gallery-controls";
    controls.innerHTML = `
      <button type="button" class="case-gallery-btn case-gallery-prev" aria-label="Previous image">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>
      </button>
      <button type="button" class="case-gallery-btn case-gallery-next" aria-label="Next image">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>
      </button>
      <div class="case-gallery-dots" role="tablist" aria-label="Gallery images"></div>
    `;
    gallery.appendChild(controls);
    return gallery;
  }

  function galleryRasterFallback(src = "") {
    return /\.webp$/i.test(src) ? src.replace(/\.webp$/i, ".jpg") : src;
  }

  function preloadGalleryNeighbors(items, index) {
    if (!items?.length) return;
    [index - 1, index + 1].forEach((raw) => {
      const i = (raw + items.length) % items.length;
      const src = items[i]?.src;
      if (!src) return;
      const img = new Image();
      img.decoding = "async";
      img.src = src;
    });
  }

  function renderGalleryDots(card, labels) {
    const preview = $('[data-case-panel="preview"]', card);
    const dotsWrap = $(".case-gallery-dots", preview);
    const state = card._gallery;
    if (!dotsWrap || !state?.items?.length) return;
    dotsWrap.innerHTML = state.items
      .map((_, i) => {
        const active = i === state.index ? " is-active" : "";
        return `<button type="button" class="case-gallery-dot${active}" data-gallery-index="${i}" aria-label="Image ${i + 1}" role="tab" aria-selected="${i === state.index ? "true" : "false"}"></button>`;
      })
      .join("");
    const prevBtn = $(".case-gallery-prev", preview);
    const nextBtn = $(".case-gallery-next", preview);
    if (prevBtn) prevBtn.setAttribute("aria-label", labels.prev);
    if (nextBtn) nextBtn.setAttribute("aria-label", labels.next);
  }

  function setGalleryIndex(card, index, opts = {}) {
    const state = card._gallery;
    if (!state?.items?.length) return;
    const n = state.items.length;
    const next = ((index % n) + n) % n;
    const slide = state.items[next];
    if (!slide?.src) return;

    const preview = $('[data-case-panel="preview"]', card);
    const img = $("[data-case-image]", card);
    const webp = $("[data-case-image-webp]", card);
    if (!img) return;

    state.index = next;
    const raster = galleryRasterFallback(slide.src);
    const currentRaster = (img.getAttribute("src") || "").split("?")[0];

    const applySlide = () => {
      preview?.classList.add("is-loading");
      img.classList.add("is-loading");
      if (webp) {
        if (/\.webp$/i.test(slide.src)) webp.setAttribute("srcset", slide.src);
        else webp.removeAttribute("srcset");
      }
      img.decoding = "async";
      if (card.dataset.project !== "sanabel-iq" || next > 0) {
        img.loading = "lazy";
        if (next > 0) img.removeAttribute("fetchpriority");
      }
      img.alt = slide.alt || "";
      img.src = raster;
      img.classList.remove("is-switching");
      renderGalleryDots(card, galleryLabels());
      preloadGalleryNeighbors(state.items, next);
      if (!opts.silent) {
        window.YZAnalytics?.track("gallery_nav", {
          project: card.dataset.project || "",
          index: next,
        });
      }
      const clearLoading = () => {
        img.classList.remove("is-loading");
        preview?.classList.remove("is-loading");
      };
      if (img.complete && img.naturalWidth > 0) clearLoading();
      else {
        img.addEventListener("load", clearLoading, { once: true });
        img.addEventListener("error", clearLoading, { once: true });
      }
    };

    if (opts.instant || currentRaster === raster) {
      applySlide();
      return;
    }

    img.classList.add("is-switching");
    window.setTimeout(applySlide, 120);
  }

  function bindGalleryInteractions(card) {
    if (card._galleryBound) return;
    const preview = $('[data-case-panel="preview"]', card);
    const gallery = $(".case-gallery", preview);
    if (!gallery) return;
    card._galleryBound = true;

    gallery.addEventListener("click", (e) => {
      const dot = e.target.closest("[data-gallery-index]");
      if (dot) {
        setGalleryIndex(card, Number(dot.dataset.galleryIndex));
        playClick();
        return;
      }
      if (e.target.closest(".case-gallery-prev")) {
        setGalleryIndex(card, (card._gallery?.index || 0) - 1);
        playClick();
        return;
      }
      if (e.target.closest(".case-gallery-next")) {
        setGalleryIndex(card, (card._gallery?.index || 0) + 1);
        playClick();
      }
    });

    gallery.addEventListener("keydown", (e) => {
      if (!card._gallery || card._gallery.items.length <= 1) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        const delta = document.documentElement.dir === "rtl" ? 1 : -1;
        setGalleryIndex(card, card._gallery.index + delta);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        const delta = document.documentElement.dir === "rtl" ? -1 : 1;
        setGalleryIndex(card, card._gallery.index + delta);
      }
    });

    let pointerX = null;
    gallery.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      pointerX = e.clientX;
    });
    gallery.addEventListener("pointerup", (e) => {
      if (pointerX == null || !card._gallery || card._gallery.items.length <= 1) return;
      const dx = e.clientX - pointerX;
      pointerX = null;
      if (Math.abs(dx) < 42) return;
      const rtl = document.documentElement.dir === "rtl";
      const delta = dx < 0 ? (rtl ? -1 : 1) : rtl ? 1 : -1;
      setGalleryIndex(card, card._gallery.index + delta);
      playClick();
    });
    gallery.addEventListener("pointercancel", () => {
      pointerX = null;
    });
  }

  function syncCaseGallery(card, item) {
    const preview = $('[data-case-panel="preview"]', card);
    const img = $("[data-case-image]", card);
    const webp = $("[data-case-image-webp]", card);
    if (!preview || !img || !item) return;

    const labels = galleryLabels();
    const items =
      Array.isArray(item.gallery) && item.gallery.length
        ? item.gallery
        : item.image || item.imageJpg
          ? [{ src: item.image || item.imageJpg, alt: item.imageAlt || "" }]
          : [];

    if (!items.length) return;

    const galleryEl = ensureGalleryChrome(preview);
    if (!galleryEl) {
      img.src = items[0].src;
      img.alt = items[0].alt || "";
      return;
    }

    card._gallery = { items, index: 0 };
    galleryEl.classList.toggle("is-single", items.length <= 1);
    bindGalleryInteractions(card);

    const isFlagship = card.dataset.project === "sanabel-iq";
    img.decoding = "async";
    img.loading = isFlagship ? "eager" : "lazy";
    if (isFlagship) img.setAttribute("fetchpriority", "high");
    else img.removeAttribute("fetchpriority");

    const hero = items[0];
    if (webp) {
      const webpSrc =
        (/\.webp$/i.test(hero?.src || "") && hero.src) ||
        (item.image && String(item.image).endsWith(".webp") ? item.image : "");
      if (webpSrc) webp.setAttribute("srcset", webpSrc);
      else webp.removeAttribute("srcset");
    }

    setGalleryIndex(card, 0, { instant: true, silent: true });
    renderGalleryDots(card, labels);
  }

  function syncCaseGalleries(cases = []) {
    const cards = $$("[data-case]");
    cases.forEach((item, i) => {
      const card =
        (item?.id && $(`[data-case][data-project="${item.id}"]`)) || cards[i];
      if (card && item) syncCaseGallery(card, item);
    });
  }

  function initCaseMediaSwitchers() {
    $$(".arch-frame").forEach((frame) => {
      if (!frame.querySelector("[data-case-media]")) return;

      $$("[data-case-media]", frame).forEach((tab) => {
        tab.addEventListener("click", () => {
          if (tab.disabled) return;
          setCaseMedia(frame, tab.dataset.caseMedia);
          playClick();
        });
      });

      const img = $("[data-case-image]", frame);
      if (!img) {
        markPreviewMissing(frame);
        return;
      }

      bindCasePreviewImage(frame, img);
    });

    // Initial gallery sync from current language pack
    const lang = document.documentElement.lang === "ar" ? "ar" : "en";
    const cases = window.I18N?.[lang]?.portfolio?.cases || [];
    syncCaseGalleries(cases);
  }

  function bindCasePreviewImage(frame, img) {
    const gen = (frame._previewGen = (frame._previewGen || 0) + 1);
    let missing = false;
    const preview = $('[data-case-panel="preview"]', frame);
    const stale = () => gen !== frame._previewGen;
    const clearLoading = () => {
      img.classList.remove("is-loading");
      preview?.classList.remove("is-loading");
    };
    const fail = () => {
      if (missing || stale()) return;
      missing = true;
      clearLoading();
      markPreviewMissing(frame);
    };
    const ok = () => {
      if (missing || stale()) return;
      if (img.naturalWidth === 0) {
        fail();
        return;
      }
      const empty = $(".case-shot-empty", frame);
      const previewTab = $('[data-case-media="preview"]', frame);
      clearLoading();
      preview?.classList.remove("is-missing");
      if (empty) empty.hidden = true;
      if (previewTab) previewTab.disabled = false;
      setCaseMedia(frame, "preview");
    };
    if (!img.complete || img.naturalWidth === 0) {
      preview?.classList.add("is-loading");
      img.classList.add("is-loading");
    }
    img.addEventListener("error", fail, { once: true });
    img.addEventListener("load", ok, { once: true });
    if (img.complete) ok();
    else setCaseMedia(frame, "preview");
    // Only fail timed-out requests that already finished with no pixels (e.g. HTML SPA fallback).
    window.setTimeout(() => {
      if (!missing && !stale() && img.complete && img.naturalWidth === 0) fail();
    }, 2500);
  }

  function retryCasePreview(card) {
    const frame = $(".arch-frame", card);
    const img = $("[data-case-image]", frame);
    const preview = $('[data-case-panel="preview"]', frame);
    if (!frame || !img || !preview?.classList.contains("is-missing")) return;
    const src = (img.getAttribute("src") || "").split("?")[0];
    if (!src) return;
    preview.classList.remove("is-missing");
    preview.classList.add("is-loading");
    img.classList.add("is-loading");
    const empty = $(".case-shot-empty", frame);
    if (empty) empty.hidden = true;
    const previewTab = $('[data-case-media="preview"]', frame);
    if (previewTab) previewTab.disabled = false;
    const webp = $("[data-case-image-webp]", frame);
    if (webp) {
      const base = (webp.getAttribute("srcset") || "").split("?")[0];
      if (base) webp.setAttribute("srcset", base);
    }
    // Re-assign clean URL (no cache-bust) so HTTP cache can still help.
    img.removeAttribute("src");
    img.src = src;
    bindCasePreviewImage(frame, img);
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
    // Modal removed in P3 — route buyers to the contact section.
    closePalette();
    scrollToId("contact");
  }

  function closeContactModal() {
    /* no-op: contact modal retired */
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
      hint: "Download ATS compatible CV (PDF)",
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

  function syncCmdFooterLabel() {
    const label = "Ctrl / ⌘ + K";
    const btn = $("#cmd-open");
    if (!btn) return;
    const ar = document.documentElement.lang === "ar";
    btn.textContent = ar ? `اضغط ${label}` : `Press ${label}`;
    btn.setAttribute("aria-label", ar ? `افتح لوحة الأوامر (${label})` : `Open command palette (${label})`);
    btn.setAttribute("title", ar ? `افتح لوحة الأوامر (${label})` : `Open command palette (${label})`);
  }

  function initHotkeyBadge() {
    syncCmdFooterLabel();
  }

  function initMobileWaCta() {
    const cta = $(".mobile-wa-cta");
    if (!cta) return;

    const heroCtas = $(".hero-ctas");
    const collisionTargets = [
      heroCtas,
      ...$$("[data-service-cta]"),
      ...$$(".contact-ctas .btn-primary, .contact-ctas .btn-glow"),
      $("#contact"),
      $(".site-footer"),
    ].filter(Boolean);

    if (!collisionTargets.length) return;

    const visible = new Map();
    collisionTargets.forEach((el) => visible.set(el, false));

    let lastY = window.scrollY || 0;
    let scrollHidden = false;

    const apply = () => {
      // Hide while Hero CTAs, package CTAs, contact section, or footer are on screen
      const blocked = [...visible.values()].some(Boolean);
      const show = !blocked && !scrollHidden;
      cta.classList.toggle("is-visible", show);
      cta.classList.toggle("is-scroll-hidden", scrollHidden && !blocked);
      cta.setAttribute("aria-hidden", show ? "false" : "true");
      if (!show) cta.setAttribute("tabindex", "-1");
      else cta.removeAttribute("tabindex");
    };

    // Start hidden until observers report
    apply();

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          visible.set(entry.target, entry.isIntersecting);
        });
        apply();
      },
      { threshold: 0.08, rootMargin: "0px 0px -6% 0px" }
    );

    collisionTargets.forEach((el) => io.observe(el));

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY || 0;
        const delta = y - lastY;
        if (Math.abs(delta) > 8) {
          // Hide while scrolling down; restore when scrolling up or near top
          scrollHidden = delta > 0 && y > 48;
          lastY = y;
          apply();
        } else if (y <= 48 && scrollHidden) {
          scrollHidden = false;
          lastY = y;
          apply();
        }
        ticking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
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
      }
    });
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

  /* —— Hero IDE: open on desktop, closed on mobile —— */
  function initHeroIde() {
    const ide = $(".hero-ide");
    if (!ide) return;
    const mq = window.matchMedia("(min-width: 981px)");
    const sync = () => {
      ide.open = mq.matches;
    };
    sync();
    mq.addEventListener?.("change", sync);
  }

  /* —— N+1 comparison —— */
  function initRigor() {
    const root = $("#rigor");
    if (!root) return;
    const bars = $$("[data-bar]", root);
    const disclosure = $(".rigor-disclosure", root);
    let animated = false;

    function animateBars() {
      if (animated) return;
      animated = true;
      bars.forEach((b) => {
        b.style.width = b.dataset.bar;
      });
    }

    if (disclosure) {
      disclosure.addEventListener("toggle", () => {
        if (disclosure.open) animateBars();
      });
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            if (!disclosure || disclosure.open) animateBars();
            io.disconnect();
          }
        });
      },
      { threshold: 0.2 }
    );
    io.observe(root);
  }

  function init() {
    initSandbox();
    initCaseMediaSwitchers();
    initArchitecture();
    initOpenApi();
    initPalette();
    initAudioToggle();
    initHeroIde();
    initRigor();
    initCvDownload();
    initPortfolioPagination();
    initMobileWaCta();
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
    syncCmdFooterLabel,
    syncCaseGalleries,
  };
})();

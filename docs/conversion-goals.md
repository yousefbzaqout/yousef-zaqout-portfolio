# Conversion goals (P3-D)

Primary success is **Discovery Call intent**, not vanity UX scores. Instrument these three events in GA4 / PostHog as conversions.

| Event | Trigger | Where |
|---|---|---|
| `cta_whatsapp` | Click any WhatsApp / Discovery Call CTA | Nav, hero, problems bridge, contact, mobile sticky (`data-track="cta_whatsapp"` + `data-track-location`) |
| `sandbox_autorun` | Sandbox auto-runs when scrolled into view | `js/features.js` → `YZAnalytics.track("sandbox_autorun", …)` |
| `service_cta` | Click a service package discuss CTA | Services cards (`data-track="service_cta"` + `data-track-package`) |

Constants live on `YZAnalytics.SUCCESS_EVENTS`.

## One-week measurement plan

1. **Week 0 (baseline):** leave events as-is; record unique visitors and counts for the three events.
2. **Week 1 (compare):** same traffic sources; compare:
   - `cta_whatsapp` / sessions (primary KPI)
   - `service_cta` / sessions (package interest)
   - `sandbox_autorun` → later `cta_whatsapp` same session (demo → CTA funnel, if your tool supports paths)
3. **Target:** raise Discovery Call click rate; do not treat “100% UX” as the metric.

## GA4 / PostHog setup (manual)

- Mark `cta_whatsapp` as a **key event / conversion**.
- Optionally mark `service_cta` and `sandbox_autorun` as secondary.
- Filter by `location` / `package` properties when debugging friction.

Local debug: set `YZ_ANALYTICS.debug = true` (or leave keys empty) to see `[YZAnalytics]` console logs.

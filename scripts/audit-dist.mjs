import fs from "fs";
import path from "path";

const dist = "dist";
const html = fs.readFileSync(path.join(dist, "index.html"), "utf8");
const checks = [];
const ok = (name, pass, detail = "") => checks.push({ name, pass: !!pass, detail });

ok("og:type", /property="og:type" content="website"/.test(html));
ok("og:title", /og:title" content="Yousef Zaqout \| Senior Backend Engineer"/.test(html));
ok("og:description", /og:description"[\s\S]*?Laravel RESTful APIs, payment/.test(html));
ok(
  "og:image absolute",
  /og:image" content="https:\/\/yousefbzaqout\.netlify\.app\/assets\/og-preview\.png"/.test(html)
);
ok("og:url", /og:url" content="https:\/\/yousefbzaqout\.netlify\.app\/"/.test(html));
ok("twitter:card", /twitter:card" content="summary_large_image"/.test(html));
ok("favicon present", /rel="icon"/.test(html));
ok("module script", /type="module"/.test(html));
ok("no absolute /assets root paths in src", !/src="\/assets\//.test(html));
ok("no leftover VITE placeholders", !/%VITE_/.test(html));
ok("og-preview file", fs.existsSync(path.join(dist, "assets", "og-preview.png")));
ok("cv pdf", fs.existsSync(path.join(dist, "assets", "Yousef_Zaqout_CV.pdf")));
ok("favicon.ico public", fs.existsSync(path.join(dist, "favicon.ico")));
ok(
  "js bundle",
  fs.readdirSync(path.join(dist, "assets")).some((f) => f.startsWith("main-") && f.endsWith(".js"))
);
ok(
  "css bundle",
  fs.readdirSync(path.join(dist, "assets")).some((f) => f.startsWith("main-") && f.endsWith(".css"))
);
ok("hero image hashed", /bg-hero-office-[^"']+\.png/.test(html));
ok("bdi routes/api.php", /<bdi dir="ltr">routes\/api\.php<\/bdi>/.test(html));
ok("bdi < 150ms", /<bdi dir="ltr"[^>]*>[\s\S]*?150ms/.test(html));
ok(
  "sandbox endpoints",
  /data-endpoint="metrics"/.test(html) &&
    /data-endpoint="rag"/.test(html) &&
    /data-endpoint="stripe"/.test(html)
);
ok("cache toggle", /data-cache="hit"/.test(html) && /data-cache="cold"/.test(html));
ok("cmd palette", /id="cmd-palette"/.test(html));
ok(
  "openapi drawers",
  /data-openapi="ad-pilot"/.test(html) &&
    /data-openapi="firsttouch-sla"/.test(html) &&
    /data-openapi="irada"/.test(html) &&
    /data-openapi="mostaql"/.test(html) &&
    /data-openapi="cv"/.test(html)
);
ok("arch diagrams", (html.match(/data-arch-diagram/g) || []).length >= 5);
ok("portfolio pagination", /id="portfolio-pagination"/.test(html));
ok("ad-pilot project", /data-project="ad-pilot"/.test(html) && /saas · ad-pilot/.test(html));
ok(
  "firsttouch-sla project",
  /data-project="firsttouch-sla"/.test(html) && /engine · firsttouch-sla/.test(html)
);
ok("rigor section", /id="rigor"/.test(html) && /data-bar="100%"/.test(html));
ok("projects anchor", /id="projects"/.test(html) && /id="tech-stack"/.test(html));

const feat = fs.readFileSync("js/features.js", "utf8");
ok("cv relative path", feat.includes("./assets/Yousef_Zaqout_CV.pdf"));
ok("help command renders", feat.includes('renderCmdResults("help")'));
ok("openapi bdi", feat.includes('<bdi dir="ltr">') && feat.includes("oa-method"));
ok("pagination 3 per page", feat.includes("ITEMS_PER_PAGE = 3") && feat.includes("initPortfolioPagination"));
ok("ad-pilot openapi", feat.includes('"ad-pilot"') && feat.includes("AdPilot SaaS API"));
ok(
  "firsttouch-sla openapi",
  feat.includes('"firsttouch-sla"') && feat.includes("FirstTouch SLA API")
);

const css = fs.readFileSync("css/styles.css", "utf8");
ok("overflow-x-auto util", css.includes(".overflow-x-auto"));
ok("480px breakpoint", css.includes("max-width: 480px"));
ok("sandbox code wraps", /sandbox-prompt code[\s\S]*?white-space:\s*pre-wrap/.test(css));
ok("endpoint switcher wraps", /endpoint-switcher[\s\S]*?flex-wrap:\s*wrap/.test(css));

checks.forEach((c) => console.log(`${c.pass ? "PASS" : "FAIL"}: ${c.name}${c.detail ? ` — ${c.detail}` : ""}`));
const failed = checks.filter((c) => !c.pass);
console.log(`\n${checks.length - failed.length}/${checks.length} passed`);
if (failed.length) process.exit(1);

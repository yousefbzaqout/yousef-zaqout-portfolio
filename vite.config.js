import { defineConfig, loadEnv } from "vite";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Build-time Open Graph / Twitter URL injection.
 *
 * Vite replaces %VITE_*% placeholders in index.html during transform.
 * Values come from .env.[mode] (production | staging | development).
 *
 *   npm run build:production  → uses .env.production
 *   npm run build:staging     → uses .env.staging
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const siteUrl = (env.VITE_SITE_URL || "http://localhost:5173").replace(/\/$/, "");
  const ogImage = env.VITE_OG_IMAGE || `${siteUrl}/assets/og-preview.png`;

  return {
    root: ".",
    publicDir: "public",
    base: "./",
    build: {
      outDir: "dist",
      emptyOutDir: true,
      assetsDir: "assets",
      rollupOptions: {
        input: {
          main: resolve(__dirname, "index.html"),
        },
      },
    },
    define: {
      __SITE_URL__: JSON.stringify(siteUrl),
    },
    server: {
      port: 5173,
      open: true,
    },
    plugins: [
      {
        name: "yz-html-env-inject",
        transformIndexHtml(html) {
          return html
            .replaceAll("%VITE_SITE_URL%", siteUrl)
            .replaceAll("%VITE_OG_IMAGE%", ogImage)
            .replaceAll("https://yourdomain.com", siteUrl);
        },
      },
    ],
  };
});

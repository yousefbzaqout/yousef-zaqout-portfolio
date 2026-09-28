# Yousef Zaqout | Backend Engineer Portfolio

A professional portfolio and personal brand site for a backend engineer specializing in Laravel, API architecture, payment integrations, AI/RAG workflows, observability, and production deployment.

<p align="center">
  <img src="https://img.shields.io/badge/Status-Production%20Ready-success" alt="Production ready" />
  <img src="https://img.shields.io/badge/Stack-Vite%20%2B%20HTML%2FCSS%2FJS-4c78ff" alt="Stack" />
  <img src="https://img.shields.io/badge/Deployment-Netlify-00C7B7" alt="Deployment" />
  <img src="https://img.shields.io/badge/Domain-yousefbzaqout.me-111827" alt="Domain" />
</p>

## Project overview

This repository contains a polished single-page portfolio website built with Vite, HTML, CSS, and vanilla JavaScript. It is designed to present a backend engineer's value proposition with strong conversion-focused sections:

- hero and positioning
- technical credibility
- service packages
- featured case studies
- proof and process messaging
- language toggle and theme support
- custom domain and production-ready metadata

## What I analyzed

This project is already a strong foundation. It follows a professional personal-brand structure and includes:

- a clear positioning statement: backend engineering, REST APIs, AI/RAG systems, payment flows, and Dockerized delivery
- conversion-oriented sections for founder-facing service offers
- polished UX, motion, and dark/light theming
- multilingual support (English/Arabic)
- social metadata and Open Graph variables for sharing
- Netlify deployment config and custom domain support via `CNAME`

The biggest opportunities were to improve repository professionalism by adding documentation, structured release notes, clear skill positioning, and consistent deployment/domain configuration.

## Repository structure

```text
.
├── assets/
├── css/
├── js/
├── public/
├── .env.development
├── .env.example
├── .env.production
├── .env.staging
├── .gitignore
├── CNAME
├── index.html
├── LICENSE
├── netlify.toml
├── package.json
├── README.md
├── ABOUT.md
├── SKILLS.md
├── CHANGELOG.md
├── vite.config.js
└── og-preview.png
```

## Tech stack

- Vite
- HTML5
- CSS3
- JavaScript
- Netlify
- Custom domain: `https://yousefbzaqout.me`

## Local development

```bash
npm install
npm run dev
```

The site runs locally on:

```text
http://localhost:5173
```

## Production build

```bash
npm run build:production
```

## Deployment

This project is configured for Netlify with a custom domain setup.

### Domain configuration

The custom domain is already configured in `CNAME`:

```text
yousefbzaqout.me
```

Production environment variables should point to the live domain:

```dotenv
VITE_SITE_URL=https://yousefbzaqout.me
VITE_OG_IMAGE=https://yousefbzaqout.me/assets/og-preview.png
```

### Netlify setup

1. Import the repository in Netlify.
2. Set the build command to `npm run build:production`.
3. Set the publish directory to `dist`.
4. Add the custom domain `yousefbzaqout.me`.
5. Configure DNS records according to Netlify instructions.

## Documentation

- [About](./ABOUT.md)
- [Skills](./SKILLS.md)
- [Release notes](./CHANGELOG.md)

## Recommended next improvements

- add social proof and testimonials section
- create a dedicated case study detail page or blog
- add an automated Lighthouse CI check
- add a GitHub Actions workflow for build validation
- add a contact form or email gateway
- add structured data/schema markup for SEO

## License

This project is licensed under the MIT License. See [LICENSE](./LICENSE) for details.

## Contact

- Website: https://yousefbzaqout.me
- GitHub: https://github.com/yousefbzaqout
- LinkedIn: add your public profile
- Email: add your business email

## Status

This portfolio is production-ready for personal branding and client acquisition, with a clear backend-engineering value proposition and modern presentation.

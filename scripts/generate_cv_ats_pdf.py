#!/usr/bin/env python3
"""Generate a plain, ATS-friendly single-column CV PDF."""
from pathlib import Path

try:
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
    from reportlab.lib.units import mm
    from reportlab.platypus import KeepTogether, Paragraph, SimpleDocTemplate
except ImportError:
    import subprocess
    import sys

    subprocess.check_call([sys.executable, "-m", "pip", "install", "reportlab", "-q"])
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
    from reportlab.lib.units import mm
    from reportlab.platypus import KeepTogether, Paragraph, SimpleDocTemplate

root = Path(__file__).resolve().parent.parent
assets = root / "assets"
public_assets = root / "public" / "assets"
assets.mkdir(exist_ok=True)
public_assets.mkdir(parents=True, exist_ok=True)
out = assets / "Yousef_Zaqout_CV_ATS.pdf"

styles = getSampleStyleSheet()
name = ParagraphStyle(
    "Name",
    parent=styles["Normal"],
    fontName="Helvetica-Bold",
    fontSize=16,
    leading=20,
    textColor="#111111",
    spaceAfter=4,
)
role = ParagraphStyle(
    "Role",
    parent=styles["Normal"],
    fontName="Helvetica-Bold",
    fontSize=11,
    leading=14,
    textColor="#111111",
    spaceAfter=6,
)
contact = ParagraphStyle(
    "Contact",
    parent=styles["Normal"],
    fontName="Helvetica",
    fontSize=9.5,
    leading=13,
    textColor="#111111",
    spaceAfter=10,
)
h2 = ParagraphStyle(
    "H2",
    parent=styles["Normal"],
    fontName="Helvetica-Bold",
    fontSize=11,
    leading=14,
    textColor="#111111",
    spaceBefore=10,
    spaceAfter=6,
    borderPadding=2,
)
body = ParagraphStyle(
    "Body",
    parent=styles["Normal"],
    fontName="Helvetica",
    fontSize=10,
    leading=13,
    textColor="#111111",
    spaceAfter=4,
)
job = ParagraphStyle(
    "Job",
    parent=styles["Normal"],
    fontName="Helvetica-Bold",
    fontSize=10,
    leading=13,
    textColor="#111111",
    spaceBefore=6,
    spaceAfter=1,
)
job_first = ParagraphStyle(
    "JobFirst",
    parent=job,
    spaceBefore=0,
)
meta = ParagraphStyle(
    "Meta",
    parent=styles["Normal"],
    fontName="Helvetica",
    fontSize=9.5,
    leading=12,
    textColor="#111111",
    spaceAfter=2,
)
bullet = ParagraphStyle(
    "Bullet",
    parent=styles["Normal"],
    fontName="Helvetica",
    fontSize=10,
    leading=13,
    textColor="#111111",
    leftIndent=12,
    bulletIndent=0,
    spaceAfter=2,
)

story = []


def para(text, style):
    return Paragraph(text, style)


def bullet_para(text):
    return Paragraph(f"• {text}", bullet)


def add_section(heading, *flows):
    """Keep a section heading with its content on the same page when possible."""
    story.append(KeepTogether([para(heading, h2), *flows]))


def add_job(title, subtitle, bullets):
    """Keep each role block together so titles never orphan from details."""
    block = [
        para(title, job),
        para(subtitle, meta),
        *[bullet_para(b) for b in bullets],
    ]
    story.append(KeepTogether(block))


story.append(para("Yousef Zaqout", name))
story.append(para("Backend Engineer | REST API Specialist", role))
story.append(
    para(
        "Email: zaqoutyousef@gmail.com<br/>"
        "Phone: +972 594 803 033<br/>"
        "LinkedIn: linkedin.com/in/yousefzaqout<br/>"
        "GitHub: github.com/yousefbzaqout<br/>"
        "Location: Remote | Available for KSA, Gulf, US, and EU clients",
        contact,
    )
)

add_section(
    "PROFESSIONAL SUMMARY",
    para(
        "Backend engineer specializing in PHP, Laravel, high-performance RESTful APIs, "
        "PostgreSQL, Redis, and Docker. Experienced building payment gateway integrations, "
        "AI and RAG pipelines, OpenAPI documentation, and production systems for startups "
        "and product teams.",
        body,
    ),
)

add_section(
    "SKILLS",
    para(
        "Languages and frameworks: PHP, Laravel, REST APIs, Clean Architecture, SOLID<br/>"
        "Databases and caching: PostgreSQL, Redis, query optimization, indexing<br/>"
        "Infrastructure: Docker, deployment environments, Linux<br/>"
        "Integrations: Stripe, Moyasar, Tap, OpenAI, RAG pipelines, Telegram, n8n<br/>"
        "Documentation and tooling: OpenAPI, Swagger, Postman, Filament, Git, GitHub",
        body,
    ),
)

story.append(para("SELECTED EXPERIENCE", h2))

add_job(
    "Sanabel IQ — Adaptive Arabic Learning Platform",
    "Backend Engineer | Laravel, PostgreSQL, Redis, Filament, AI / RAG, Multi-tenant",
    [
        "Built a multi-tenant Laravel backend unifying child, parent, teacher, and school workflows.",
        "Implemented secure child access flows, Filament admin panels, and Redis queues for file and analytics processing.",
        "Delivered curriculum engine features with PostgreSQL and vector-assisted learning support.",
    ],
)

add_job(
    "FirstTouch SLA — Lead Routing and Response System",
    "Backend Engineer | Laravel 13, Filament, pgvector, AI, Telegram, n8n",
    [
        "Built a secure Laravel system to ingest leads from multiple ad channels and enforce response SLAs.",
        "Implemented queue-based workflows, AI-assisted replies, and Telegram / n8n alerting.",
        "Reduced response time from hours to minutes with measurable queue and compliance metrics.",
    ],
)

add_job(
    "AdPilot — Ads and Content Management SaaS",
    "Backend Engineer | Laravel, Filament, AI / LLM, Docker, PostgreSQL, Redis",
    [
        "Designed domain services for content, ads, analytics, and subscriptions with queue-only external I/O.",
        "Delivered a production path from account linking through publishing, sync, and budget-safe recommendations.",
    ],
)

add_job(
    "Irada Academy — EdTech Platform",
    "Backend Engineer | Laravel, REST APIs, RBAC",
    [
        "Built Laravel REST APIs for courses, users, and enrollment with role-based access control.",
        "Improved query performance to keep response times stable under academic workloads.",
    ],
)

add_job(
    "Freelance Job Alert Bot",
    "Backend / Automation | Scraping, Telegram",
    [
        "Developed an automated scraper and filter pipeline with Telegram alerts in under 5 seconds.",
    ],
)

add_job(
    "CV Application — API and Frontend Delivery",
    "Backend Engineer | Laravel 12, Vue 3, PostgreSQL, Docker",
    [
        "Built a Laravel API with Vue 3 frontend and Dockerized environments for development and production.",
    ],
)

# Keep EDUCATION heading + degree + university on one page (fixes split across pages)
add_section(
    "EDUCATION",
    para("B.Sc. Software Engineering", job_first),
    para("Islamic University of Gaza (IUG)", meta),
)

add_section(
    "ADDITIONAL EXPERIENCE",
    bullet_para("Khareej Qader Program — Full Stack Developer and Scrum Master at Areisto."),
    bullet_para("Gaza Code (Volunteer) — Built real software projects with a collaborative engineering team."),
    bullet_para("GitHub achievements: Pair Extraordinaire and Pull Shark."),
)

add_section(
    "SERVICES",
    bullet_para("Custom Laravel backends and RESTful APIs with Postman and OpenAPI documentation."),
    bullet_para("Payment gateway and AI / RAG integrations for production products."),
    bullet_para("PostgreSQL and Redis performance optimization with Docker delivery."),
)

doc = SimpleDocTemplate(
    str(out),
    pagesize=A4,
    leftMargin=18 * mm,
    rightMargin=18 * mm,
    topMargin=16 * mm,
    bottomMargin=16 * mm,
    title="Yousef Zaqout — CV (ATS)",
    author="Yousef Zaqout",
)
doc.build(story)

public_out = public_assets / "Yousef_Zaqout_CV_ATS.pdf"
public_out.write_bytes(out.read_bytes())
print(f"ATS PDF: {out} ({out.stat().st_size} bytes)")
print(f"ATS public: {public_out}")

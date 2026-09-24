"""Generate branded CV PDF when headless Chrome/wkhtmltopdf unavailable."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

try:
    from reportlab.lib import colors
    from reportlab.lib.enums import TA_LEFT
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
    from reportlab.lib.units import mm
    from reportlab.platypus import (
        Image,
        Paragraph,
        SimpleDocTemplate,
        Spacer,
        Table,
        TableStyle,
    )
except ImportError:
    import subprocess
    import sys

    venv = ROOT / ".venv-cv"
    if not (venv / "bin" / "python").is_file():
        subprocess.check_call([sys.executable, "-m", "venv", str(venv)])
    subprocess.check_call([str(venv / "bin" / "pip"), "install", "reportlab", "-q"])
    subprocess.check_call([str(venv / "bin" / "python"), __file__])
    raise SystemExit(0)

PDF_PATH = ROOT / "assets" / "Yousef_Zaqout_CV.pdf"
PUBLIC_PATH = ROOT / "public" / "assets" / "Yousef_Zaqout_CV.pdf"
PHOTO = ROOT / "assets" / "images" / "yousef-zaqout.png"

NAVY = colors.HexColor("#090d16")
EMERALD = colors.HexColor("#10b981")
BODY_BG = colors.HexColor("#f8fafc")
TEXT = colors.HexColor("#1e293b")
MUTED = colors.HexColor("#64748b")

WORK = [
    "<b>Sanabel IQ</b> — Adaptive Arabic learning (Laravel, PostgreSQL, Redis, Filament, AI/RAG, multi-tenant)",
    "<b>FirstTouch SLA</b> — Lead routing &amp; SLA alerts (Laravel 13, Filament, pgvector, AI, Telegram/n8n)",
    "<b>AdPilot</b> — Ads &amp; content SaaS (Laravel, Filament, AI/LLM, Docker)",
    "<b>Irada Academy</b> — EdTech REST backend (Laravel, RBAC)",
    "<b>Freelance job alert bot</b> — Telegram alerts under 5s",
    "<b>CV App</b> — Laravel 12 API + Vue 3 + Docker",
]

CREDS = [
    "B.Sc. Software Engineering — Islamic University of Gaza (IUG)",
    "Khareej Qader — Full Stack &amp; Scrum Master at Areisto",
    "Gaza Code (Volunteer) — real software projects",
    "GitHub: Pair Extraordinaire &amp; Pull Shark",
]

CHIPS = (
    "Laravel · PostgreSQL · Redis · Docker · OpenAPI · Postman · "
    "OpenAI / RAG · Stripe / Moyasar / Tap · Filament · Clean Architecture"
)


def section_title(text: str, style: ParagraphStyle) -> Paragraph:
    return Paragraph(f'<font color="#10b981">▌</font> <b>{text}</b>', style)


def build_pdf() -> None:
    PDF_PATH.parent.mkdir(parents=True, exist_ok=True)
    PUBLIC_PATH.parent.mkdir(parents=True, exist_ok=True)

    doc = SimpleDocTemplate(
        str(PDF_PATH),
        pagesize=A4,
        leftMargin=14 * mm,
        rightMargin=14 * mm,
        topMargin=10 * mm,
        bottomMargin=12 * mm,
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "Title",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=18,
        textColor=colors.white,
        leading=22,
    )
    role_style = ParagraphStyle(
        "Role",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=10,
        textColor=EMERALD,
        leading=13,
    )
    contact_style = ParagraphStyle(
        "Contact",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=7.5,
        textColor=colors.HexColor("#94a3b8"),
        leading=10,
    )
    section_style = ParagraphStyle(
        "Section",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=9,
        textColor=NAVY,
        spaceBefore=6,
        spaceAfter=4,
        leftIndent=0,
    )
    body_style = ParagraphStyle(
        "Body",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        textColor=TEXT,
        leading=11,
        alignment=TA_LEFT,
    )
    bullet_style = ParagraphStyle(
        "Bullet",
        parent=body_style,
        leftIndent=8,
        bulletIndent=0,
        spaceAfter=2,
    )

    header_left = [
        Paragraph("Yousef Zaqout", title_style),
        Paragraph("Backend Engineer · REST API Specialist", role_style),
        Spacer(1, 2 * mm),
        Paragraph(
            "zaqoutyousef@gmail.com · +972 594 803 033 · "
            "linkedin.com/in/yousefzaqout · github.com/yousefbzaqout",
            contact_style,
        ),
    ]

    img_cell = ""
    if PHOTO.is_file():
        img = Image(str(PHOTO), width=20 * mm, height=20 * mm)
        img_cell = img

    header_table = Table(
        [[img_cell, header_left]],
        colWidths=[22 * mm, doc.width - 22 * mm],
    )
    header_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), NAVY),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ("LINEBELOW", (0, 0), (-1, -1), 2, EMERALD),
            ]
        )
    )

    story = [header_table, Spacer(1, 4 * mm)]

    story.append(section_title("SUMMARY", section_style))
    story.append(
        Paragraph(
            "Backend engineer specializing in PHP/Laravel, high-performance RESTful APIs, "
            "PostgreSQL &amp; Redis, and Docker. Builds payment gateways, AI/RAG pipelines, "
            "and production-minded systems for startups.",
            body_style,
        )
    )

    story.append(section_title("CORE STACK", section_style))
    story.append(Paragraph(CHIPS, body_style))

    left_col = [
        section_title("SELECTED WORK", section_style),
    ]
    for item in WORK:
        left_col.append(Paragraph(f"• {item}", bullet_style))

    right_col = [
        section_title("EXPERIENCE &amp; CREDENTIALS", section_style),
    ]
    for item in CREDS:
        right_col.append(Paragraph(f"• {item}", bullet_style))
    right_col.append(Spacer(1, 3 * mm))
    right_col.append(section_title("SERVICES", section_style))
    right_col.append(
        Paragraph(
            "Custom Laravel backends &amp; REST APIs · Payment &amp; AI integrations · "
            "Performance (PostgreSQL/Redis) &amp; Docker delivery",
            body_style,
        )
    )

    col_table = Table([[left_col, right_col]], colWidths=[doc.width / 2 - 2 * mm, doc.width / 2 - 2 * mm])
    col_table.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (0, -1), 4),
                ("RIGHTPADDING", (1, 0), (1, -1), 0),
            ]
        )
    )
    story.append(col_table)

    def on_page(canvas, _doc):
        canvas.saveState()
        canvas.setFillColor(BODY_BG)
        canvas.rect(0, 0, A4[0], A4[1], fill=1, stroke=0)
        canvas.restoreState()

    doc.build(story, onFirstPage=on_page, onLaterPages=on_page)
    PUBLIC_PATH.write_bytes(PDF_PATH.read_bytes())
    print(f"Wrote {PDF_PATH} ({PDF_PATH.stat().st_size} bytes)")


if __name__ == "__main__":
    build_pdf()

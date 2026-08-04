from pathlib import Path

try:
    from reportlab.lib.pagesizes import letter
    from reportlab.pdfgen import canvas
except ImportError:
    import subprocess
    import sys

    subprocess.check_call([sys.executable, "-m", "pip", "install", "reportlab", "-q"])
    from reportlab.lib.pagesizes import letter
    from reportlab.pdfgen import canvas

root = Path(__file__).resolve().parent.parent
assets = root / "assets"
assets.mkdir(exist_ok=True)
pdf_path = assets / "Yousef_Zaqout_CV.pdf"

c = canvas.Canvas(str(pdf_path), pagesize=letter)
w, h = letter
c.setFont("Helvetica-Bold", 18)
c.drawString(72, h - 72, "Yousef Zaqout")
c.setFont("Helvetica", 11)
c.drawString(72, h - 92, "Backend Engineer & REST API Specialist")
c.setFont("Helvetica-Bold", 12)
c.drawString(72, h - 130, "Focus")
c.setFont("Helvetica", 10)
y = h - 148
lines = [
    "Laravel RESTful APIs · Clean Architecture · Payments · AI/RAG · Docker",
    "",
    "Stack",
    "PHP, Laravel, PostgreSQL, Redis, Docker, OpenAI, Stripe, OpenAPI, Postman",
    "",
    "Contact",
    "Email: zaqoutyousef@gmail.com",
    "LinkedIn: linkedin.com/in/yousefzaqout",
    "GitHub: github.com/yousefbzaqout",
    "WhatsApp: +972 594 803 033",
]
for line in lines:
    if line in ("Stack", "Contact"):
        c.setFont("Helvetica-Bold", 12)
        c.drawString(72, y, line)
        c.setFont("Helvetica", 10)
    else:
        c.drawString(72, y, line)
    y -= 16
c.showPage()
c.save()
print("PDF:", pdf_path)

src = assets / "images" / "yousef-zaqout.png"
for dest in (assets / "og-preview.png", root / "og-preview.png"):
    dest.write_bytes(src.read_bytes())
    print("OG:", dest)

"""Regenerate portfolio assets: styled CV PDF + OG preview copies."""
from pathlib import Path
import shutil
import subprocess
import sys

root = Path(__file__).resolve().parent.parent
assets = root / "assets"
public_assets = root / "public" / "assets"
assets.mkdir(exist_ok=True)
public_assets.mkdir(parents=True, exist_ok=True)

# Preferred: Chrome/Chromium print of scripts/cv-template.html
gen_sh = root / "scripts" / "generate_cv_pdf.sh"
fallback_py = root / "scripts" / "generate_cv_pdf_fallback.py"

if gen_sh.exists():
    try:
        subprocess.check_call(["bash", str(gen_sh)], cwd=str(root))
    except subprocess.CalledProcessError:
        print("generate_cv_pdf.sh failed — trying ReportLab fallback", file=sys.stderr)
        if fallback_py.exists():
            subprocess.check_call([sys.executable, str(fallback_py)], cwd=str(root))
elif fallback_py.exists():
    subprocess.check_call([sys.executable, str(fallback_py)], cwd=str(root))
else:
    print("No CV generator found", file=sys.stderr)
    sys.exit(1)

pdf_src = assets / "Yousef_Zaqout_CV.pdf"
if pdf_src.exists():
    shutil.copy2(pdf_src, public_assets / "Yousef_Zaqout_CV.pdf")
    print("PDF:", pdf_src)
    print("PDF public:", public_assets / "Yousef_Zaqout_CV.pdf")
else:
    print("CV PDF missing after generation", file=sys.stderr)
    sys.exit(1)

# ATS-friendly plain CV
ats_py = root / "scripts" / "generate_cv_ats_pdf.py"
if ats_py.exists():
    subprocess.check_call([sys.executable, str(ats_py)], cwd=str(root))
else:
    print("ATS CV generator missing", file=sys.stderr)
    sys.exit(1)

src = assets / "images" / "yousef-zaqout.png"
if src.exists():
    for dest in (assets / "og-preview.png", root / "og-preview.png", public_assets / "og-preview.png"):
        dest.write_bytes(src.read_bytes())
        print("OG:", dest)

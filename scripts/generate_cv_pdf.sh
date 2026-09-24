#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HTML="$ROOT/scripts/cv-template.html"
OUT="$ROOT/assets/Yousef_Zaqout_CV.pdf"
OUT_PUBLIC="$ROOT/public/assets/Yousef_Zaqout_CV.pdf"
mkdir -p "$ROOT/public/assets"

TOOL=none
for cmd in google-chrome chromium-browser chromium; do
  if command -v "$cmd" >/dev/null 2>&1; then
    "$cmd" --headless --disable-gpu --no-pdf-header-footer \
      --print-to-pdf="$OUT" "file://$HTML"
    TOOL="$cmd"
    break
  fi
done

# Windows host Chrome → WSL paths (when WSL has no Chromium)
if [[ "$TOOL" == none ]] && [[ -x "/mnt/c/Program Files/Google/Chrome/Application/chrome.exe" ]]; then
  WIN_HTML="file://wsl.localhost/Ubuntu${HTML}"
  WIN_OUT="//wsl.localhost/Ubuntu${OUT}"
  "/mnt/c/Program Files/Google/Chrome/Application/chrome.exe" \
    --headless --disable-gpu --no-pdf-header-footer \
    --print-to-pdf="$WIN_OUT" "$WIN_HTML"
  TOOL="google-chrome (Windows host)"
fi

if [[ "$TOOL" == none ]] && command -v wkhtmltopdf >/dev/null 2>&1; then
  wkhtmltopdf "$HTML" "$OUT"
  TOOL=wkhtmltopdf
fi

if [[ ! -s "$OUT" ]] || [[ "$(stat -c%s "$OUT")" -lt 5000 ]]; then
  python3 "$ROOT/scripts/generate_cv_pdf_fallback.py"
  TOOL=reportlab-platypus
fi

cp -f "$OUT" "$OUT_PUBLIC"
SIZE="$(stat -c%s "$OUT")"
echo "TOOL=$TOOL"
echo "PATH=$OUT"
echo "PUBLIC=$OUT_PUBLIC"
echo "SIZE=$SIZE bytes"

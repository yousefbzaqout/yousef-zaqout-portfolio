#!/usr/bin/env python3
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]


def extract_case_objects(cases_body: str):
    objs = []
    i = 0
    n = len(cases_body)
    while i < n:
        while i < n and cases_body[i] in " \n\r\t,":
            i += 1
        if i >= n:
            break
        if cases_body[i] != "{":
            i += 1
            continue
        depth = 0
        start = i
        while i < n:
            c = cases_body[i]
            if c == "{":
                depth += 1
            elif c == "}":
                depth -= 1
                if depth == 0:
                    i += 1
                    objs.append(cases_body[start:i])
                    break
            i += 1
    return objs


def reorder_in_block(block: str, label: str) -> str:
    idx = block.index("cases: [")
    start_bracket = block.index("[", idx)
    depth = 0
    i = start_bracket
    while i < len(block):
        if block[i] == "[":
            depth += 1
        elif block[i] == "]":
            depth -= 1
            if depth == 0:
                end_bracket = i
                break
        i += 1
    body = block[start_bracket + 1 : end_bracket]
    objs = extract_case_objects(body)
    titles = [re.search(r'title:\s*"([^"]+)"', o).group(1)[:48] for o in objs]
    print(label, titles)
    sanabel_idx = next(i for i, o in enumerate(objs) if "Sanabel" in o or "سنابل" in o)
    sanabel = objs.pop(sanabel_idx)
    objs.insert(0, sanabel)
    new_body = "\n        " + ",\n        ".join(o.strip() for o in objs) + ",\n      "
    return block[: start_bracket + 1] + new_body + block[end_bracket:]


def reorder_i18n():
    path = ROOT / "js" / "i18n.js"
    text = path.read_text(encoding="utf-8")
    en_start = text.index("  en: {")
    ar_start = text.index("  ar: {")
    en_block = reorder_in_block(text[en_start:ar_start], "EN")
    ar_block = reorder_in_block(text[ar_start:], "AR")
    path.write_text(text[:en_start] + en_block + ar_block, encoding="utf-8")
    print("i18n reordered OK")


def reorder_html():
    path = ROOT / "index.html"
    html = path.read_text(encoding="utf-8")
    sn_start = html.index("            <!-- Sanabel IQ -->")
    pos = html.index("<article", sn_start)
    depth = 0
    i = pos
    sn_end = None
    while i < len(html):
        if html.startswith("<article", i):
            depth += 1
            i += 8
            continue
        if html.startswith("</article>", i):
            depth -= 1
            i += len("</article>")
            if depth == 0:
                sn_end = i
                while sn_end < len(html) and html[sn_end] in "\n\r":
                    sn_end += 1
                break
            continue
        i += 1
    if sn_end is None:
        raise SystemExit("Could not find Sanabel article end")

    sanabel = html[sn_start:sn_end]
    html_wo = html[:sn_start] + html[sn_end:]

    if "            <!-- FirstTouch" in html_wo:
        ft = html_wo.index("            <!-- FirstTouch")
    else:
        ft = html_wo.index('data-project="firsttouch-sla"')
        ft = html_wo.rfind("\n", 0, ft) + 1
        # back to article start line
        ft = html_wo.rfind("<article", 0, ft)
        ft = html_wo.rfind("\n", 0, ft) + 1

    html_new = html_wo[:ft] + sanabel + html_wo[ft:]

    parts = []
    last = 0
    idx = 0
    for m in re.finditer(
        r'<article class="case-card(?: reverse)? reveal" data-case data-project="([^"]+)">',
        html_new,
    ):
        project = m.group(1)
        want_reverse = idx % 2 == 1
        cls = "case-card reverse reveal" if want_reverse else "case-card reveal"
        replacement = f'<article class="{cls}" data-case data-project="{project}">'
        parts.append(html_new[last : m.start()])
        parts.append(replacement)
        last = m.end()
        print(f"  [{idx}] {project} reverse={want_reverse}")
        idx += 1
    parts.append(html_new[last:])
    path.write_text("".join(parts), encoding="utf-8")
    print("html reordered OK, cases=", idx)


if __name__ == "__main__":
    reorder_i18n()
    reorder_html()

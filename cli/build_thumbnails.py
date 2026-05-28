"""
Compile thumbnail PNG previews for all 35 worksheet templates.

For each template in cli/templates/registry.json:
  1. Generate a standalone .tex (no Wildcat preamble dependency) with fake content
     in the template's style (style_slug → accent color + font + extras).
  2. Compile via xelatex → PDF.
  3. Convert page 1 to PNG via pdftoppm.
  4. Place into frontend/public/templates/{TID}.png.

This is a local Windows tool (relies on MiKTeX xelatex + pdftoppm).
Encoding: UTF-8.
"""

from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent  # WorksheetAI/
REGISTRY = ROOT / "cli" / "templates" / "registry.json"
OUT_DIR = ROOT / "frontend" / "public" / "templates"
SKELETONS_DIR = ROOT / "frontend" / "lib" / "exporters" / "templates"

# Mirror of frontend/lib/exporters/render-latex.ts STYLE_MAP (slug -> accent HEX + font + extra).
STYLE_MAP: dict[str, dict] = {
    "classic_wildcat_purple":  {"accent": "5B2E91", "font": "",            "extra": ""},
    "compact_underline":       {"accent": "5B2E91", "font": "",            "extra": ""},
    "minimal_gray":            {"accent": "475569", "font": "\\sffamily",  "extra": ""},
    "newspaper_navy":          {"accent": "1E3A8A", "font": "",            "extra": ""},
    "journal_amber":           {"accent": "B45309", "font": "\\sffamily",  "extra": ""},
    "cards_emerald":           {"accent": "047857", "font": "\\sffamily",  "extra": ""},
    "control_graphite":        {"accent": "1F2937", "font": "",            "extra": ""},
    "notebook_ink":            {"accent": "1E40AF", "font": "\\sffamily",  "extra": ""},
    "terminal_green":          {"accent": "059669", "font": "\\ttfamily",  "extra": ""},
    "pastel_three_tones":      {"accent": "A78BFA", "font": "\\sffamily",  "extra": ""},
    "oge_official_bw":         {"accent": "991B1B", "font": "",            "extra": ""},
    "trainer_teal":            {"accent": "0D9488", "font": "\\sffamily",  "extra": ""},
    "scandi_white":            {"accent": "1A1A1A", "font": "\\sffamily",  "extra": ""},
    "retro_typewriter":        {"accent": "000000", "font": "\\ttfamily",  "extra": ""},
    "space_dark":              {"accent": "A78BFA", "font": "\\sffamily\\color{white}", "extra": "\\pagecolor{black}\\color{white}"},
    "victorian_ornate":        {"accent": "7C2D12", "font": "",            "extra": ""},
    "exam_form":               {"accent": "4B5563", "font": "",            "extra": ""},
    "quick_15min":             {"accent": "EA580C", "font": "\\sffamily",  "extra": ""},
    "mental_grid_5x5":         {"accent": "0891B2", "font": "\\sffamily",  "extra": ""},
    "code_python":             {"accent": "1D4ED8", "font": "\\sffamily",  "extra": ""},
    "graphs_grid":             {"accent": "065F46", "font": "\\sffamily",  "extra": ""},
    "olympiad_premium":        {"accent": "B45309", "font": "",            "extra": ""},
    "sea_navy":                {"accent": "075985", "font": "\\sffamily",  "extra": ""},
    "forest_green":            {"accent": "166534", "font": "\\sffamily",  "extra": ""},
    "bingo_card":              {"accent": "DB2777", "font": "\\sffamily",  "extra": ""},
    "maze_flow":               {"accent": "6D28D9", "font": "\\sffamily",  "extra": ""},
    "table_grid":              {"accent": "374151", "font": "\\sffamily",  "extra": ""},
    "algo_flowchart":          {"accent": "0EA5E9", "font": "\\sffamily",  "extra": ""},
    "final_year_premium":      {"accent": "1E3A8A", "font": "",            "extra": ""},
    "letter_format":           {"accent": "713F12", "font": "",            "extra": ""},
    "flashcards_dual":         {"accent": "7C3AED", "font": "\\sffamily",  "extra": ""},
    "wabisabi_asymmetric":     {"accent": "57534E", "font": "\\sffamily",  "extra": ""},
}

# Sample task pools — short, visually representative.
MATH_TASKS = [
    r"Решите уравнение $3(x-2) + 5 = x + 1$.",
    r"Найдите производную $f(x) = x^3 - 4x^2 + 7$.",
    r"Вычислите $\sin\!\left(\tfrac{\pi}{6}\right) + \cos\!\left(\tfrac{\pi}{3}\right)$.",
    r"Решите неравенство $x^2 - 5x + 6 \le 0$.",
    r"Найдите площадь треугольника со сторонами $3, 4, 5$.",
    r"Упростите выражение $\dfrac{a^2 - b^2}{a + b}$.",
]
INF_TASKS = [
    r"Переведите число $42_{10}$ в двоичную систему.",
    r"Сколько информации в килобайтах содержит сообщение длиной $4096$ символов?",
    r"Найдите количество единиц в двоичной записи числа $25$.",
    r"Определите наименьшее основание $N$, при котором $123_N$ делится на $7$.",
]


def _escape_latex(s: str) -> str:
    # Minimal escape for plain text — math segments $...$ are left intact upstream.
    repl = [
        (r"\\", r"\\textbackslash{}"),
        ("&", r"\\&"),
        ("%", r"\\%"),
        ("#", r"\\#"),
        ("_", r"\\_"),
        ("{", r"\\{"),
        ("}", r"\\}"),
    ]
    out = s
    for a, b in repl:
        out = out.replace(a, b)
    return out


def _preserve_math_escape(s: str) -> str:
    parts = re.split(r"(\$[^$]+\$)", s)
    return "".join(p if p.startswith("$") and p.endswith("$") else _escape_latex(p) for p in parts)


def make_tex(tmpl: dict) -> str:
    style_slug = tmpl.get("style", "classic_wildcat_purple")
    style = STYLE_MAP.get(style_slug, STYLE_MAP["classic_wildcat_purple"])
    accent = style["accent"]
    font_cmd = style["font"]
    extra = style["extra"]

    title = _preserve_math_escape(tmpl["name"])
    subtitle = f"{tmpl.get('subject','math')} · {tmpl.get('grade','')} класс · {tmpl['id']}"
    subtitle = _preserve_math_escape(subtitle)

    pool = INF_TASKS if tmpl.get("subject") == "informatics" else MATH_TASKS
    # Take 3 tasks — enough to fill a thumbnail.
    n_tasks = min(int(tmpl.get("task_count", 3) or 3), 4)
    tasks = (pool * 3)[:n_tasks]
    tasks_tex = "\n\n".join(
        f"\\begin{{taskbox}}{{{i+1}}}\n{_preserve_math_escape(t)}\\par\\vspace{{1.5mm}}\n"
        f"\\hfill\\textbf{{\\color{{wcprimary}}Ответ:}}~\\AnswerField{{{i+1}}}\n\\end{{taskbox}}"
        for i, t in enumerate(tasks)
    )

    # Если для этого шаблона есть кастомный skeleton .tex.tpl — используем его.
    skel_path = SKELETONS_DIR / f"{tmpl['id']}.tex.tpl"
    if skel_path.exists():
        skel = skel_path.read_text(encoding="utf-8")
        return (
            skel
            .replace("{{accent_hex}}", accent)
            .replace("{{title}}", title)
            .replace("{{subtitle}}", subtitle)
            .replace("{{tasks_tex}}", tasks_tex)
            .replace("{{teacher_line}}", "")
            .replace("{{watermark_preamble}}", "")
            .replace("{{font_cmd}}", font_cmd)
            .replace("{{extra_preamble}}", extra)
        )

    return rf"""% Thumbnail preview — {tmpl['id']} ({style_slug})
\documentclass[a4paper,11pt]{{article}}

\usepackage[T2A]{{fontenc}}
\usepackage[utf8]{{inputenc}}
\usepackage[russian]{{babel}}
\usepackage[margin=18mm]{{geometry}}
\usepackage{{xcolor}}
\usepackage{{tikz}}
\usepackage{{tcolorbox}}
\tcbuselibrary{{skins,breakable}}
\usepackage{{amsmath,amssymb}}
\usepackage{{enumitem}}

\definecolor{{wcprimary}}{{HTML}}{{{accent}}}
{extra}

\newcommand{{\AnswerField}}[1]{{%
  \tikz[baseline=-0.5ex]\draw[thick,wcprimary] (0,0) rectangle (30mm,10mm);%
}}

\newtcolorbox{{taskbox}}[1]{{%
  enhanced, breakable,
  colframe=wcprimary, colback=white, boxrule=0.8pt,
  arc=2mm, left=3mm, right=3mm, top=2mm, bottom=2mm,
  title={{\textbf{{Задача №#1}}}}, coltitle=white,
  colbacktitle=wcprimary, fonttitle=\small\bfseries,
  attach boxed title to top left={{yshift=-1mm, xshift=2mm}},
  boxed title style={{size=small, colframe=wcprimary, sharp corners, arc=0pt}}
}}

\pagestyle{{empty}}

\begin{{document}}
{font_cmd}

\begin{{center}}
{{\Large\bfseries\color{{wcprimary}}{title}}}\\[1mm]
{{\small\itshape {subtitle}}}
\end{{center}}
\vspace{{2mm}}

{tasks_tex}

\vfill
\begin{{center}}\tiny\color{{gray}}Сгенерировано на \textbf{{РабочийЛист.ai}}\end{{center}}

\end{{document}}
"""


def build_one(tmpl: dict, out_dir: Path) -> tuple[bool, str]:
    tid = tmpl["id"]
    tex_src = make_tex(tmpl)
    with tempfile.TemporaryDirectory(prefix=f"thumb_{tid}_") as td:
        tdp = Path(td)
        tex_path = tdp / f"{tid}.tex"
        tex_path.write_text(tex_src, encoding="utf-8")
        # xelatex -interaction=batchmode -halt-on-error
        try:
            r = subprocess.run(
                [
                    "xelatex",
                    "-interaction=batchmode",
                    "-halt-on-error",
                    "-output-directory", str(tdp),
                    str(tex_path),
                ],
                cwd=str(tdp),
                capture_output=True,
                timeout=90,
            )
        except subprocess.TimeoutExpired:
            return False, "xelatex timeout"
        pdf = tdp / f"{tid}.pdf"
        if not pdf.exists():
            log = (tdp / f"{tid}.log").read_text(encoding="utf-8", errors="ignore") if (tdp / f"{tid}.log").exists() else ""
            err_tail = "\n".join(log.splitlines()[-20:])
            return False, f"xelatex returned {r.returncode}: …{err_tail}"

        # pdftoppm: page 1, PNG, ~110 dpi for ~900px wide thumbnail.
        png_target = out_dir / f"{tid}.png"
        out_dir.mkdir(parents=True, exist_ok=True)
        try:
            r2 = subprocess.run(
                [
                    "pdftoppm",
                    "-png",
                    "-r", "110",
                    "-f", "1", "-l", "1",
                    "-singlefile",
                    str(pdf),
                    str(out_dir / tid),
                ],
                capture_output=True,
                timeout=30,
            )
        except subprocess.TimeoutExpired:
            return False, "pdftoppm timeout"
        if not png_target.exists():
            return False, f"pdftoppm returned {r2.returncode}: {r2.stderr.decode('utf-8', 'ignore')[:300]}"
        return True, str(png_target)


def main(only: list[str] | None = None) -> int:
    registry = json.loads(REGISTRY.read_text(encoding="utf-8"))
    templates = registry["templates"]
    if only:
        templates = [t for t in templates if t["id"] in only]

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    ok, fail = [], []
    for tmpl in templates:
        tid = tmpl["id"]
        sys.stdout.write(f"[{tid}] ")
        sys.stdout.flush()
        success, info = build_one(tmpl, OUT_DIR)
        if success:
            ok.append(tid)
            sys.stdout.write("OK\n")
        else:
            fail.append((tid, info))
            sys.stdout.write(f"FAIL — {info[:120]}\n")
    print()
    print(f"OK: {len(ok)}/{len(templates)}")
    if fail:
        print("FAILED:")
        for tid, info in fail:
            print(f"  {tid}: {info[:200]}")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:] or None))

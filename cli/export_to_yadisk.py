"""
Export all worksheet templates to E:\\YA\\YandexDisk\\Шаблоны_рабочих_листов\\.
For each template in registry.json:
  - copy .tex skeleton (custom or generic) → LaTeX/{ID}_{name}.tex
  - copy PNG preview → PNG_превью/{ID}_{name}.png
  - compile sample PDF → PDF/{ID}_{name}.pdf
  - also create README.md and INDEX.json with metadata.

Так учителя могут скачать с Я.Диска готовый набор «образцов».
"""

from __future__ import annotations

import json
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

from build_thumbnails import make_tex, SKELETONS_DIR, REGISTRY  # type: ignore

ROOT = Path(__file__).resolve().parent.parent
YA_DIR = Path(r"E:\YA\YandexDisk\Шаблоны_рабочих_листов")
PDF_DIR = YA_DIR / "PDF"
TEX_DIR = YA_DIR / "LaTeX"
PNG_DIR = YA_DIR / "PNG_превью"
SRC_PNG = ROOT / "frontend" / "public" / "templates"


def slug(s: str) -> str:
    s = s.strip().replace("/", "-")
    s = re.sub(r"\s+", " ", s)
    return s[:50]


def main() -> int:
    for d in (PDF_DIR, TEX_DIR, PNG_DIR):
        d.mkdir(parents=True, exist_ok=True)

    reg = json.loads(REGISTRY.read_text(encoding="utf-8"))
    templates = reg["templates"]

    index: list[dict] = []
    ok, fail = [], []

    for tmpl in templates:
        tid = tmpl["id"]
        name = slug(tmpl["name"])
        base = f"{tid}_{name}"
        sys.stdout.write(f"[{tid}] ")
        sys.stdout.flush()

        # 1. Copy PNG preview if exists
        png_src = SRC_PNG / f"{tid}.png"
        if png_src.exists():
            shutil.copy(png_src, PNG_DIR / f"{base}.png")

        # 2. Write .tex (custom skeleton if exists, else generic from make_tex)
        tex_src = make_tex(tmpl)
        tex_path = TEX_DIR / f"{base}.tex"
        tex_path.write_text(tex_src, encoding="utf-8")

        # 3. Compile sample PDF
        pdf_target = PDF_DIR / f"{base}.pdf"
        with tempfile.TemporaryDirectory(prefix=f"export_{tid}_") as td:
            tdp = Path(td)
            local_tex = tdp / f"{tid}.tex"
            local_tex.write_text(tex_src, encoding="utf-8")
            try:
                subprocess.run(
                    ["xelatex", "-interaction=batchmode", "-halt-on-error",
                     "-output-directory", str(tdp), str(local_tex)],
                    cwd=str(tdp), capture_output=True, timeout=90,
                )
            except subprocess.TimeoutExpired:
                fail.append((tid, "xelatex timeout"))
                sys.stdout.write("FAIL (timeout)\n")
                continue
            local_pdf = tdp / f"{tid}.pdf"
            if local_pdf.exists():
                shutil.copy(local_pdf, pdf_target)
                ok.append(tid)
                sys.stdout.write("OK\n")
            else:
                fail.append((tid, "no pdf"))
                sys.stdout.write("FAIL (no pdf)\n")
                continue

        index.append({
            "id": tid,
            "name": tmpl["name"],
            "description": tmpl.get("description", ""),
            "subject": tmpl.get("subject"),
            "grade": tmpl.get("grade"),
            "layout": tmpl.get("layout"),
            "style": tmpl.get("style"),
            "task_count": tmpl.get("task_count"),
            "tags": tmpl.get("tags", []),
            "skeleton_custom": (SKELETONS_DIR / f"{tid}.tex.tpl").exists(),
            "pdf": f"PDF/{base}.pdf",
            "tex": f"LaTeX/{base}.tex",
            "png": f"PNG_превью/{base}.png" if png_src.exists() else None,
        })

    (YA_DIR / "INDEX.json").write_text(
        json.dumps(index, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    custom_count = sum(1 for t in templates if (SKELETONS_DIR / (t["id"] + ".tex.tpl")).exists())
    readme = (
        "# Шаблоны рабочих листов · РабочийЛист.ai\n\n"
        f"Всего: **{len(templates)} шаблонов**, из них {custom_count} с уникальной LaTeX-вёрсткой (skeleton).\n\n"
        "## Папки\n\n"
        "- `PDF/` — образцы рабочих листов в PDF (на тестовых задачах). Можно сразу печатать.\n"
        "- `LaTeX/` — исходники .tex (для правки в Overleaf или локально).\n"
        "- `PNG_превью/` — превью каждого шаблона (используются на сайте).\n"
        "- `INDEX.json` — таблица со всеми шаблонами: ID, название, тема, предмет, кол-во задач.\n\n"
        "## Как использовать в Overleaf\n\n"
        "1. Открой https://www.overleaf.com, создай новый проект (Blank).\n"
        "2. Загрузи файл `LaTeX/{ID}_{name}.tex` через Upload.\n"
        "3. Поменяй задачи на свои и нажми Recompile.\n\n"
        "## Регенерация набора\n\n"
        "На машине Павла:\n\n"
        "    python E:/YA/YandexDisk/WorksheetAI/cli/export_to_yadisk.py\n\n"
        "Скрипт пересоберёт все PDF/PNG/tex с актуальным registry.json.\n"
    )
    (YA_DIR / "README.md").write_text(readme, encoding="utf-8")

    print()
    print(f"Export complete: {len(ok)}/{len(templates)} OK")
    if fail:
        print("Failed:")
        for tid, why in fail:
            print(f"  {tid}: {why}")
    print(f"Files in {YA_DIR}")
    return 0 if not fail else 1


if __name__ == "__main__":
    sys.exit(main())

#!/usr/bin/env python
"""extract_answer_fields.py — парсит .aux после xelatex,
выдаёт answer_key.json с координатами полей в мм (от верхнего левого угла A4).

Usage:
    python extract_answer_fields.py output/T1/T1.aux \
        --template T1 \
        --topic "Текстовые задачи. Движение по реке" \
        --grade 11 --subject math \
        --answers 3 17 18 22 8 \
        > output/T1/T1.answer_key.json

ИЛИ если ответы хранятся в JSON-файле:
    python extract_answer_fields.py output/T1/T1.aux \
        --meta meta.json > output/T1/T1.answer_key.json
"""
from __future__ import annotations
import argparse, json, re, sys
from pathlib import Path

# 1 pt = 1/72.27 in (TeX), 1 in = 25.4 mm  =>  1 sp = 1/65536 pt = 25.4/(65536*72.27) mm
SP_PER_MM = 65536 * 72.27 / 25.4   # ≈ 186467.98
MM_PER_PT = 25.4 / 72.27           # ≈ 0.3515 mm/pt
PAGE_HEIGHT_MM = 297.0  # A4

# Размеры поля по умолчанию (если в .aux нет размеров)
DEFAULT_WIDTH_MM = 30.0
DEFAULT_HEIGHT_MM = 10.0

# \rlAFmark{task_id}{seq}{width_pt}{height_pt}
RE_MARK = re.compile(
    r"\\rlAFmark\{(?P<task>[^}]+)\}\{(?P<seq>\d+)\}"
    r"(?:\{(?P<w>[\d.]+)pt\}\{(?P<h>[\d.]+)pt\})?"
)
RE_POS = re.compile(
    r"\\zref@newlabel\{rlAF-tl-(?P<seq>\d+)\}\{[^}]*\\posx\{(?P<x>-?\d+)\}\\posy\{(?P<y>-?\d+)\}[^}]*\}"
)
RE_PAGE = re.compile(
    r"\\zref@newlabel\{rlAF-tl-(?P<seq>\d+)\}\{[^}]*\\abspage\{(?P<page>\d+)\}[^}]*\}"
)


def sp_to_mm(sp: int) -> float:
    return sp / SP_PER_MM


def parse_aux(aux_path: Path) -> list[dict]:
    text = aux_path.read_text(encoding="utf-8", errors="ignore")
    # seq -> (task_id, width_mm, height_mm)
    marks: dict[int, tuple[str, float, float]] = {}
    for m in RE_MARK.finditer(text):
        seq = int(m["seq"])
        w_mm = round(float(m["w"]) * MM_PER_PT, 2) if m["w"] else DEFAULT_WIDTH_MM
        h_mm = round(float(m["h"]) * MM_PER_PT, 2) if m["h"] else DEFAULT_HEIGHT_MM
        marks[seq] = (m["task"], w_mm, h_mm)
    # seq -> (x_sp, y_sp_from_bottom)
    positions: dict[int, tuple[int, int]] = {}
    for m in RE_POS.finditer(text):
        positions[int(m["seq"])] = (int(m["x"]), int(m["y"]))
    pages: dict[int, int] = {}
    for m in RE_PAGE.finditer(text):
        pages[int(m["seq"])] = int(m["page"])

    fields: list[dict] = []
    for seq in sorted(marks):
        task_id, w_mm, h_mm = marks[seq]
        if seq not in positions:
            print(f"[warn] seq {seq} ({task_id}) — нет координат, пропускаю", file=sys.stderr)
            continue
        x_sp, y_sp = positions[seq]
        x_mm = round(sp_to_mm(x_sp), 2)
        y_from_bottom_mm = round(sp_to_mm(y_sp), 2)
        # Конвертим в координаты от верхнего левого угла страницы
        y_mm = round(PAGE_HEIGHT_MM - y_from_bottom_mm, 2)
        fields.append({
            "task_id": task_id,
            "seq": seq,
            "page": pages.get(seq, 1),
            "x_mm": x_mm,
            "y_mm": y_mm,
            "width_mm": w_mm,
            "height_mm": h_mm,
        })
    return fields


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("aux", type=Path, help="путь к .aux файлу после xelatex")
    ap.add_argument("--template", default="T?")
    ap.add_argument("--topic", default="")
    ap.add_argument("--grade", type=int, default=11)
    ap.add_argument("--subject", default="math")
    ap.add_argument("--answers", nargs="*", default=None,
                    help="эталонные ответы в порядке task_id (если не задано — пустые)")
    ap.add_argument("--meta", type=Path, default=None,
                    help="JSON с метаданными и эталонами; перекрывает остальные флаги")
    args = ap.parse_args()

    fields = parse_aux(args.aux)

    meta = {
        "lesson_id": args.aux.stem,
        "template": args.template,
        "topic": args.topic,
        "grade": args.grade,
        "subject": args.subject,
        "page_size": "A4",
        "fields": fields,
    }

    if args.meta and args.meta.exists():
        meta.update(json.loads(args.meta.read_text(encoding="utf-8")))

    if args.answers:
        for f, ans in zip(meta["fields"], args.answers):
            f["expected"] = ans
            f["answer_type"] = "number"
            f["tolerance"] = 0.01

    json.dump(meta, sys.stdout, ensure_ascii=False, indent=2)
    print()


if __name__ == "__main__":
    main()

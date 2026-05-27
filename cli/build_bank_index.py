"""
Сканирует Obsidian-vault `Lessons\vault\02-Банк_задач\` и собирает
компактный JSON-индекс задач для использования в РабочийЛист.ai как «банк ФИПИ».

Берём только текстовые задачи (без обязательной картинки в условии) —
их можно безболезненно вставить в LaTeX без переноса PNG.

Выход: `frontend/data/bank.json` (массив записей) + `frontend/data/bank_meta.json` (агрегаты по источнику).

Формат записи (canonical contract — совпадает с `WorksheetContent.tasks[]`):
    {
      "id": "K10009",                  # уникальный id
      "source": "kompege",             # источник
      "subject": "informatics",        # math | informatics
      "exam": "ege",                   # ege | oge
      "zadanie_n": 1,                  # номер задания (для ЕГЭ/ОГЭ)
      "topic": "Анализ информационных моделей",
      "subtype": "A1_two_sums",
      "condition": "...",              # plain text + $...$
      "expected_answer": "28",         # canonical answer string
      "answer_type": "number",
      "solution": null,                # часто отсутствует
      "tags": ["ege", "informatics", ...]
    }
"""

from __future__ import annotations

import json
import os
import re
import sys
from pathlib import Path
from typing import Any

VAULT = Path(r"E:\YA\YandexDisk\Lessons\vault\02-Банк_задач")
OUT_DIR = Path(__file__).resolve().parent.parent / "frontend" / "data"

# Соответствие имён папок vault → каноничные метаданные.
SOURCE_MAP: dict[str, dict[str, str]] = {
    "ЕГЭ_инф_kompege":      {"source": "kompege",     "subject": "informatics", "exam": "ege"},
    "ЕГЭ_инф_ФИПИ":         {"source": "fipi",        "subject": "informatics", "exam": "ege"},
    "ЕГЭ_инф_Умскул":       {"source": "umschool",    "subject": "informatics", "exam": "ege"},
    "ЕГЭ_инф_решуегэ":      {"source": "sdamgia",     "subject": "informatics", "exam": "ege"},
    "ЕГЭ_мат_mathege":      {"source": "mathege",     "subject": "math",        "exam": "ege"},
    "ЕГЭ_мат_база_mathege": {"source": "mathege_base","subject": "math",        "exam": "ege_base"},
    "ОГЭ_инф":              {"source": "fipi",        "subject": "informatics", "exam": "oge"},
    "ОГЭ_инф_решуогэ":      {"source": "sdamgia",     "subject": "informatics", "exam": "oge"},
}

# Карточки со ссылками `![[*.png]]` — это задачи где условие требует картинки.
# Их в банке для рабочего листа пропускаем — без переноса картинок текст не имеет смысла.
IMG_RE = re.compile(r"!\[\[[^\]]+\.(png|jpg|jpeg|gif|svg)[^\]]*\]\]", re.IGNORECASE)

# Базовый разделитель frontmatter --- ... ---
FM_RE = re.compile(r"^---\n(.*?)\n---\n", re.DOTALL)
# H2 sections
H2_RE = re.compile(r"^##\s+(.+?)\s*$", re.MULTILINE)


def parse_frontmatter(raw: str) -> tuple[dict[str, Any], str]:
    m = FM_RE.match(raw)
    if not m:
        return {}, raw
    body = raw[m.end():]
    fm_text = m.group(1)
    out: dict[str, Any] = {}
    # Minimal YAML — key: value (string), key: "value", key: [a, b], key: 123.
    # Никаких вложенных структур у нас нет.
    cur_key = None
    for line in fm_text.splitlines():
        if not line.strip():
            continue
        # Поддержим многострочные tags в формате [a, b, c]
        m2 = re.match(r"^([A-Za-z_][\w]*)\s*:\s*(.*)$", line)
        if not m2:
            continue
        k, v = m2.group(1), m2.group(2).strip()
        if v.startswith("[") and v.endswith("]"):
            inner = v[1:-1]
            arr = [p.strip().strip('"\'') for p in inner.split(",") if p.strip()]
            out[k] = arr
        elif (v.startswith('"') and v.endswith('"')) or (v.startswith("'") and v.endswith("'")):
            out[k] = v[1:-1]
        elif v.lower() in ("true", "false"):
            out[k] = v.lower() == "true"
        elif re.match(r"^-?\d+$", v):
            out[k] = int(v)
        elif re.match(r"^-?\d+\.\d+$", v):
            out[k] = float(v)
        else:
            out[k] = v
        cur_key = k
    return out, body


def extract_section(body: str, heading: str) -> str | None:
    """Return text of an H2 section by exact heading match (case-insensitive)."""
    lines = body.splitlines()
    out: list[str] = []
    collecting = False
    for line in lines:
        m = re.match(r"^##\s+(.+?)\s*$", line)
        if m:
            if collecting:
                break
            if m.group(1).strip().lower() == heading.strip().lower():
                collecting = True
                continue
        elif collecting:
            out.append(line)
    if not out:
        return None
    return "\n".join(out).strip()


def normalize_condition(s: str) -> str:
    """Trim, collapse whitespace; strip leading author-anchor links like `<a href=…>…</a>` and ![[img]] refs."""
    # remove image refs
    s = IMG_RE.sub("", s)
    # remove inline anchor tags (author attribution) — keep their text
    s = re.sub(r"<a[^>]*>(.*?)</a>", r"\1", s, flags=re.DOTALL)
    # collapse 3+ newlines to 2
    s = re.sub(r"\n{3,}", "\n\n", s).strip()
    return s


def normalize_answer(raw: Any) -> tuple[str, str] | None:
    """Return (answer_text, answer_type) or None for missing/empty answer."""
    if raw is None:
        return None
    s = str(raw).strip()
    if not s:
        return None
    # answers like ">**28**" come from H2 sections — strip md.
    s = re.sub(r"\*+", "", s).strip()
    s = re.sub(r"^>\s*", "", s).strip()
    if not s:
        return None
    # Guess type
    if re.fullmatch(r"-?\d+", s):
        return s, "number"
    if re.fullmatch(r"-?\d+[.,]\d+", s):
        return s.replace(",", "."), "number"
    if re.fullmatch(r"-?\d+\s*/\s*\d+", s):
        return s.replace(" ", ""), "fraction"
    return s, "string"


def card_to_record(path: Path, base_meta: dict[str, str]) -> dict[str, Any] | None:
    raw = path.read_text(encoding="utf-8", errors="replace")
    fm, body = parse_frontmatter(raw)
    # Базовая фильтрация — нужно условие (текст) и ответ.
    condition_section = extract_section(body, "Условие") or extract_section(body, "Условие задачи") or ""
    if not condition_section:
        # Bank может хранить условие в body без явной H2 — возьмём всё до "## Ответ".
        m = re.search(r"^##\s+Ответ", body, re.MULTILINE)
        condition_section = body[: m.start()] if m else body
    condition = normalize_condition(condition_section)
    if not condition or len(condition) < 20:
        return None
    # Картинки в условии — пропускаем (карточка требует визуала).
    if IMG_RE.search(condition_section):
        return None

    ans_section = extract_section(body, "Ответ")
    raw_answer = fm.get("answer") or ans_section
    ans = normalize_answer(raw_answer)
    if ans is None:
        return None
    answer_text, answer_type = ans

    # Решение опционально
    sol = extract_section(body, "Решение") or extract_section(body, "Краткое решение")
    if sol:
        sol = normalize_condition(sol)
        if not sol or len(sol) < 5:
            sol = None

    # Уникальный id — из frontmatter или из имени файла
    stem = path.stem
    rec_id = (
        str(fm.get("kompege_id") or fm.get("sdamgia_id") or fm.get("uuid") or stem)
        if not stem.startswith(("M", "K", "S"))
        else stem
    )

    topic = fm.get("zadanie_title") or fm.get("topic") or path.parent.name
    zadanie_n = fm.get("zadanie_n")
    try:
        zadanie_n = int(zadanie_n) if zadanie_n is not None else None
    except Exception:
        zadanie_n = None

    subtype = fm.get("subtype_v3") or fm.get("subtype_v2") or fm.get("subtype") or ""
    tags_raw = fm.get("tags") or []
    if isinstance(tags_raw, str):
        tags_raw = [tags_raw]

    return {
        "id": str(rec_id),
        "source": base_meta["source"],
        "subject": base_meta["subject"],
        "exam": base_meta["exam"],
        "zadanie_n": zadanie_n,
        "topic": topic,
        "subtype": subtype,
        "condition": condition,
        "expected_answer": answer_text,
        "answer_type": answer_type,
        "solution": sol,
        "tags": list(tags_raw),
    }


def walk_bank() -> tuple[list[dict[str, Any]], dict[str, Any]]:
    records: list[dict[str, Any]] = []
    skipped = {"no_dir": [], "no_md": 0, "no_data": 0, "image_only": 0, "no_answer": 0}
    counters: dict[str, int] = {}

    for folder, meta in SOURCE_MAP.items():
        sub = VAULT / folder
        if not sub.exists():
            skipped["no_dir"].append(folder)
            continue
        sys.stderr.write(f"[scan] {folder}\n")
        sys.stderr.flush()

        for md in sub.rglob("*.md"):
            # Игнор служебных _index.md и system карточек.
            if md.stem.startswith("_") or md.stem.endswith("_index") or md.stem == "_index":
                continue
            try:
                rec = card_to_record(md, meta)
            except Exception as e:
                sys.stderr.write(f"  skip {md}: {e}\n")
                continue
            if rec is None:
                skipped["no_data"] += 1
                continue
            records.append(rec)
            counters[meta["source"]] = counters.get(meta["source"], 0) + 1

    meta = {
        "total": len(records),
        "by_source": counters,
        "skipped": {k: (len(v) if isinstance(v, list) else v) for k, v in skipped.items()},
    }
    return records, meta


def main() -> int:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    records, meta = walk_bank()
    # Сортируем для воспроизводимости.
    records.sort(key=lambda r: (r["source"], r["subject"], r["zadanie_n"] or 0, r["id"]))
    (OUT_DIR / "bank.json").write_text(
        json.dumps(records, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    (OUT_DIR / "bank_meta.json").write_text(
        json.dumps(meta, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"Wrote {len(records)} tasks to {OUT_DIR / 'bank.json'}")
    print(f"By source: {meta['by_source']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

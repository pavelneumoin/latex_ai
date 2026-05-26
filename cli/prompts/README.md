# cli/prompts/ — LLM-промпты для генератора рабочих листов

Промпты универсальные: подходят для GigaChat, Claude, DeepSeek, GPT, Yandex GPT. Никаких model-specific токенов или function-calling — все промпты возвращают чистый JSON.

## Состав

| Файл | Назначение | Когда вызывать |
|---|---|---|
| `generate_from_topic.md`   | Генерация листа по теме (LLM придумывает задачи)              | Учитель указал предмет/класс/тему/кол-во задач/сложность |
| `generate_from_material.md`| Извлечение задач из присланного материала (PDF/OCR/текст)     | Учитель загрузил учебник или конспект |
| `generate_more_variants.md`| Параллельные варианты того же листа (анти-списывание)         | Уже есть лист, нужно N копий с другими числами |
| `generate_harder.md`       | Усложнённый вариант (для сильной группы / домашки)            | Уже есть лист, нужно «то же, но сложнее» |
| `check_worksheet.md`       | Vision-проверка заполненного листа по фото                    | Учитель сдал фото класса в чекер |

## Структура каждого файла

Каждый файл содержит секции:
- `# SYSTEM` — системный промпт (закладывается в `system` поле API).
- `# USER_TEMPLATE` — шаблон пользовательского сообщения с `{{переменными}}`.
- `# OUTPUT_SCHEMA` — JSON Schema (либо описание полей), которую модель обязана вернуть.
- `# EXAMPLE_INPUT` / `# EXAMPLE_OUTPUT` — пример входа и выхода (few-shot).

## Переменные

Подставляются простой заменой `{{name}}` → значение. Используются следующие имена:

| Переменная | Где | Тип | Описание |
|---|---|---|---|
| `{{subject}}`           | generate_*    | string  | `math` или `informatics` |
| `{{grade}}`             | generate_*    | int     | 5..11 |
| `{{topic}}`             | from_topic    | string  | Тема урока |
| `{{task_count}}`        | from_topic    | int     | 1..20 |
| `{{task_count_target}}` | from_material | int     | Сколько хотим вытащить |
| `{{difficulty}}`        | from_topic    | string  | easy/medium/hard |
| `{{material}}`          | from_material | string  | Сырой текст материала (после OCR/PDF) |
| `{{original}}`          | more, harder  | JSON    | Предыдущий лист как JSON-строка |
| `{{n_more_variants}}`   | more          | int     | 1..5 |
| `{{complexity_step}}`   | harder        | int     | 1, 2 или 3 |
| `{{student_name}}`      | check         | string? | Имя ученика, опционально |
| `{{answer_key}}`        | check         | JSON    | Эталон с координатами полей |
| `{{image}}`             | check         | base64/url | Фотография листа |
| `{{template_id}}`       | (резерв)      | string  | Идентификатор LaTeX-шаблона (T1..T5) — может пригодиться в будущем |

## Как использовать в LLM-адаптере

Типичный сценарий в коде (псевдо):

```python
from pathlib import Path
import json, re

def load_prompt(name: str) -> dict:
    text = Path(f"cli/prompts/{name}.md").read_text(encoding="utf-8")
    sections = re.split(r"^#\s+(SYSTEM|USER_TEMPLATE|OUTPUT_SCHEMA)\s*$", text, flags=re.M)
    # sections = [..., 'SYSTEM', <body>, 'USER_TEMPLATE', <body>, 'OUTPUT_SCHEMA', <body>, ...]
    parsed = {}
    for i in range(1, len(sections) - 1, 2):
        parsed[sections[i]] = sections[i+1].strip()
    return parsed

def render(template: str, **vars) -> str:
    for k, v in vars.items():
        template = template.replace("{{" + k + "}}", str(v) if not isinstance(v, (dict, list)) else json.dumps(v, ensure_ascii=False))
    return template

p = load_prompt("generate_from_topic")
system = p["SYSTEM"]
user = render(p["USER_TEMPLATE"], subject="math", grade=11, topic="Производная", task_count=3, difficulty="medium")

# llm.chat(system=system, user=user, response_format="json")
```

## Жёсткие правила, общие для всех промптов

1. **Только JSON на выходе.** Никаких ` ```json `, никакой преамбулы, никаких «Вот результат:».
2. **Формулы — только в `$...$`.** Никаких `\frac` или `\sqrt` без долларов.
3. **Условие — без LaTeX-команд вне формул.** Шаблонизатор LaTeX подставит текст как есть.
4. **Все ответы посчитаны и проверены.** Пустых `expected_answer` быть не должно.
5. **Один ответ — одно поле.** Если задача требует развёрнутого решения — это не наш случай (пропустить или адаптировать).

## Валидация ответа LLM

Перед использованием результата:
1. Прогнать через `json.loads` (упало — повторить запрос).
2. Проверить по JSON Schema (jsonschema). Schema лежит в `OUTPUT_SCHEMA` каждого файла.
3. Для `check_worksheet.md` — обработать ветку `error`.
4. Если 2 retry подряд не прошли — отдать в `prompts/output/{lesson_id}.raw.txt` для ручного разбора.

## TODO (после теста чекера 2026-05-11)

- Добавить промпт `generate_homework.md` (задачи попроще исходного, для слабых учеников).
- Добавить промпт `make_explanation.md` (написать развёрнутое решение к задаче — для родительского чата).
- Решить судьбу `{{template_id}}` — нужен ли он в промптах, или его обрабатывает только LaTeX-шаблонизатор.

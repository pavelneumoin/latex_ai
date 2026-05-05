# Дизайн команды `\AnswerField{N}` — поле ответа с экспортом координат

**Цель:** дать в LaTeX команду, которая (а) рисует на листе пустой бокс под ответ ученика, (б) при компиляции через `\write` экспортирует координаты этого бокса в файл `answer_key.json`, чтобы vision-LLM знал где искать.

## Минимальная LaTeX-реализация

```latex
\usepackage{zref-savepos}
\usepackage{tikz}
\usepackage{calc}

% Глобальный счётчик полей
\newcounter{answerfield}

% Главная команда
\newcommand{\AnswerField}[1]{%
  \stepcounter{answerfield}%
  \zsavepos{af-\arabic{answerfield}-tl}%   top-left позиция
  \begin{tikzpicture}[baseline=-0.5ex]
    \draw[thick, rounded corners=2pt, gray]
      (0,0) rectangle (30mm, 10mm);
    \node[anchor=south west, font=\small\itshape, gray]
      at (1mm, 7mm) {Ответ \##1};
  \end{tikzpicture}%
  \zsavepos{af-\arabic{answerfield}-br}%   bottom-right позиция (после tikz-бокса)
  % В .aux пишется маркер, который потом подберёт extract_answer_fields.py
  \immediate\write\auxout{%
    \string\AFmark{#1}{\arabic{answerfield}}{af-\arabic{answerfield}-tl}{af-\arabic{answerfield}-br}%
  }%
}
```

## Поток координат

1. `pdflatex` 1-й проход — `\zsavepos` сохраняет sp-координаты (LaTeX scaled points) в `.aux`.
2. `pdflatex` 2-й проход — `\AFmark{...}` записан в `.aux`.
3. Python-скрипт `extract_answer_fields.py` парсит `.aux`:
   - находит все `\zref@newlabel{af-N-tl}{...\posx{...}\posy{...}}`
   - находит все `\AFmark{task_id}{seq_num}{label_tl}{label_br}`
   - переводит scaled points → мм (1 sp = 1/65536 pt = 1/65536 × 0.3527 mm)
   - выдаёт `answer_key.json`

## Альтернативы (рассматривались, отклонены)

- **PDF text overlay через `\pdfsave/\pdfrestore`** — координаты в PDF user-space, сложно и зависит от engine.
- **`label-equation`** + поиск по якорю — нет фиксированной геометрии.
- **Чисто TikZ remember picture overlay** — даёт абсолютные коорды, но требует overlay-режима для всей страницы → ломает текстовую обтекаемость.

## Размеры по умолчанию

| Шаблон | Поле ответа | Высота | Особое |
|--------|-------------|--------|--------|
| T1 (5 задач, простой) | `30mm × 10mm` | стандарт | справа от условия |
| T2 (10 задач 2кол) | `25mm × 8mm` | компакт | внизу карточки |
| T3 (таблица 12) | внутри ячейки | 12mm выс. | без рамки, координата ячейки |
| T4 (теория + 5 задач) | `40mm × 12mm` | расширенный | для развёрнутого ответа |
| T5 (комбо мат+инф) | `30mm × 10mm` мат / без поля инф | смесь | информатика без полей (правило) |

## Пример строки в `.aux`

```
\AFmark{1}{1}{af-1-tl}{af-1-br}
\zref@newlabel{af-1-tl}{\default{}\posx{8388608}\posy{40632320}\abspage{1}\page{1}}
\zref@newlabel{af-1-br}{\default{}\posx{16646144}\posy{38010880}\abspage{1}\page{1}}
```

Из этого получаем для задачи №1:
```json
{"task_id": 1, "page": 1, "x_mm": 44.9, "y_mm": 217.5, "width_mm": 30.0, "height_mm": 10.0}
```

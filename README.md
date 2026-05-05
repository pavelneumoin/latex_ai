# РабочийЛист.ai

Веб-сервис для русских учителей: рабочий лист по математике / информатике за минуту → PDF на печать → автопроверка по фото.

Репо-идентификатор: `rabochiilist`. Домен (резерв): `rabochiilist.ai`.

## Статус

- 2026-05-05: проект создан, подготовлен RDP v0.1 и промпт для дизайнера.
- Дальше: согласование RDP → макеты → скелет приложения.

## Документы

- [.agent/RDP.md](.agent/RDP.md) — детальный план проекта (что, как, зачем, дорожная карта).
- [.agent/design_prompt.md](.agent/design_prompt.md) — длинный промпт для Claude Design / v0.dev / Figma AI.

## Стек (план)

- **Frontend:** Next.js 15 + TypeScript + Tailwind + shadcn/ui
- **Backend:** FastAPI (Python 3.12)
- **БД:** PostgreSQL
- **Файлы:** Yandex Object Storage
- **LaTeX:** pdflatex + minted (Wildcat-шаблоны из Lessons)
- **LLM:** Anthropic API напрямую (Haiku 4.5 / Sonnet 4.6)

## Папки

```
.agent/         документация и спеки
frontend/       Next.js (создадим на этапе 1)
backend/        FastAPI (создадим на этапе 1)
templates/      LaTeX (скопируем из Lessons)
prompts/        LLM-промпты
scripts/        деплой и миграции
```

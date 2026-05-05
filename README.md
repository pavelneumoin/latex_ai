# РабочийЛист.ai

Веб-сервис для русских учителей: рабочий лист по математике / информатике за минуту → PDF на печать → автопроверка по фото.

Репо-идентификатор: `rabochiilist`. Домен (резерв): `rabochiilist.ru`.

## 🌐 Боевой стенд

**URL:** http://130.193.35.199/ — Yandex Cloud (sono).

⚠️ IP динамический, при ребуте VM может смениться. Перед привязкой DNS зарезервировать static в Yandex Cloud (~₽140/мес).

## Возможности (MVP)

- Лендинг с описанием и CTA
- `/create` — двухпанельный конструктор: выбор из 5 шаблонов слева + live PDF preview справа
- `POST /api/generate` — возвращает готовый PDF + answer_key.json (координаты полей + эталоны)
- Заглушки для остальных экранов из дизайна (`/login`, `/dashboard`, `/my`, `/catalog`, `/settings`, `/check`)
- 5 готовых LaTeX-шаблонов под ЕГЭ профиль №10 (текстовые задачи)

## Документы

- [.agent/RDP.md](.agent/RDP.md) — RDP v0.1, все 8 вопросов закрыты 2026-05-05
- [.agent/design_prompt.md](.agent/design_prompt.md) — промпт для дизайнера
- [.agent/design/](./.agent/design/) — hi-fi макеты (10 экранов, JSX-прототипы)
- [.agent/specs/answer_field_design.md](.agent/specs/answer_field_design.md) — `\AnswerField` спека

## Структура

```
.agent/        документация и дизайн
frontend/      Next.js 14 + TS + App Router (production)
cli/           LaTeX-шаблоны T1..T5 + extract_answer_fields.py
  templates/   T1..T5 + _shared/worksheet_check.sty
  output/      собранные PDF + answer_key.json (5 шт)
```

## Локальный запуск

```bash
cd frontend
npm ci
npm run dev    # → http://localhost:3010
```

Эндпоинты для теста:
```bash
curl -X POST http://localhost:3010/api/generate -H 'Content-Type: application/json' -d '{"template":"T1"}'
curl -o T1.pdf http://localhost:3010/api/pdf/T1
```

## Деплой на sono

```bash
ssh pavel@130.193.35.199
cd /home/pavel/projects/rabochiilist
git pull
cd frontend
npm ci
npm run build
pm2 restart rabochiilist-frontend
```

- Nginx: `/etc/nginx/sites-enabled/rabochiilist` → proxy_pass `127.0.0.1:3010`
- PM2 systemd unit активен — авто-старт после ребута VM
- Старый конфиг конференции архивирован в `/etc/nginx/sites-available/projects.legacy`

## Стек

- **Frontend:** Next.js 14 + TypeScript + App Router (production-ready, output: standalone)
- **Backend:** Next.js API routes (Node 18+)
- **PDF:** xelatex + Wildcat-шаблоны (`Lessons/_templates/`) + zref-savepos для координат полей
- **LLM (план v0.2):** Anthropic API — Haiku 4.5 (генерация задач), Sonnet 4.6 (vision-чекер)
- **БД (план v0.2):** PostgreSQL
- **Файлы (план v0.2):** Локально на диске VM, миграция в Yandex Object Storage при заполнении

## Roadmap

- ✅ MVP: 5 готовых шаблонов, форма генерации, деплой на sono
- 🟡 Спринт к 2026-05-11: чекер на vision API (требует ANTHROPIC_API_KEY)
- ⬜ v0.2: LLM-генерация задач из произвольной темы, БД, VK ID auth
- ⬜ v0.3: Пользовательский каталог листов
- ⬜ v1.0: Маркетплейс с revenue share

## GitHub

https://github.com/pavelneumoin/latex_ai

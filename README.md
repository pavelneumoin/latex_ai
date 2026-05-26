# РабочийЛист.ai

Веб-сервис для русских учителей: загрузите фото / PDF / опишите тему → получите PDF рабочего листа за минуту → печать → автопроверка по фото.

Репо-id: `rabochiilist`. Домен (резерв): `rabochiilist.ru`.

## 🌐 Боевой стенд

**URL:** http://130.193.35.199/ — Yandex Cloud (sono).

⚠️ IP динамический; перед привязкой DNS зарезервировать static в Yandex Cloud.

## Возможности (после ночной сборки 2026-05-26)

### Готово
- **Лендинг** + конструктор `/create` с выбором из **35** LaTeX-шаблонов.
- **35 шаблонов** (T1–T35): 5 классических + 30 новых с радикально разной типографикой, раскладкой, палитрой (минимал, газета, журнал, карточки, контрольная, тетрадь, терминал, пастель, ОГЭ, тренажёр, скандинав, ретро-машинка, космос, викториан, бланк ЕГЭ, 15-мин самостоятельная, бинго, лабиринт, флешкарты, ваби-саби и др. — см. `cli/templates/registry.json`).
- **3 формата экспорта** одним кликом: **PDF** (через xelatex), **DOCX** (через pandoc или встроенный OOXML-fallback), **LaTeX** (.tex или ZIP).
- **Кнопка «Открыть в Overleaf»** — учитель видит LaTeX-исходник прямо в браузере и может править вёрстку.
- **Аккаунты по email** (NextAuth Credentials) — `/register`, `/login`, защищённые роуты через `middleware.ts`.
- **Личный кабинет** `/dashboard`, `/my`, `/my/[id]` — список и детали листов учителя.
- **Загрузка материалов**: `/api/upload` принимает фото и PDF (≤20 MB) для последующей обработки нейросетью.
- **LLM-абстракция** (`lib/llm/`) — единый интерфейс под любого провайдера (mock | claude | gigachat | deepseek | openai | openrouter). Утром: задать `LLM_PROVIDER` и ключ — никаких правок кода.
- **Промпты** в `cli/prompts/` — 5 модельно-нейтральных промптов: `generate_from_topic`, `generate_from_material`, `generate_more_variants`, `generate_harder`, `check_worksheet`. Все возвращают строгий JSON.
- **Доп. варианты и усложнение**: `POST /api/worksheets/[id]/variants` и `/harder` — кнопки «Ещё вариант» и «Усложнить» в `/my/[id]`.
- **Маркетплейс** `/marketplace`, `/marketplace/[id]` + публикация из ЛК через `/api/worksheets/[id]/publish`.
- **Внутренняя база лучших** (`Publication.isBestlist`) с эндпоинтом `/api/bestlist` — корпус для подмешивания в LLM.
- **Биллинг**: 3 плана (Free / Учитель PRO / Школа), `/pricing`, `/billing`. Абстракция платежей `lib/payments/` под YooKassa (готовый адаптер) и mock; QIWI/Tinkoff — добавить аналогично.
- **БД**: Prisma + SQLite (dev). Схема — 13 моделей: User, Account, Session, VerificationToken, Template, Worksheet, Upload, Publication, Favorite, Plan, Subscription, Payment, Credit.

### Отложено до утра
- Реальный LLM-провайдер (нужен API ключ Claude / GigaChat / DeepSeek). До этого `LLM_PROVIDER=mock` возвращает заглушку.
- LaTeX-компиляция сгенерированных JSON-листов в PDF (требует xelatex; работает локально).
- Vision-чекер заполненных работ (`/api/check` пока без обработки).
- Реальный SMTP для magic-link email (сейчас Credentials/password).
- Боевые ключи YooKassa.
- Интеграция Obsidian vault (см. `.agent/docs/obsidian-integration.md` — решить вариант A–F).

## Структура

```
.agent/
  RDP.md                              ← исходный RDP v0.1
  NIGHT_WORK_2026-05-26.md            ← отчёт о ночной сборке
  docs/obsidian-integration.md        ← план интеграции vault (на утро)
  design/                             ← hi-fi макеты
  specs/                              ← спеки фич
frontend/                             ← Next.js 14 + TS
  app/
    page.tsx                          лендинг
    create/                           конструктор листа
    login/, register/                 auth UI
    dashboard/, my/, my/[id]/         личный кабинет
    pricing/, billing/                тарифы и оплата
    marketplace/, marketplace/[id]/   маркетплейс
    settings/                         профиль учителя
    api/                              20+ роутов
  lib/
    db.ts                             Prisma client (singleton)
    auth.ts                           NextAuth config + registerUser
    llm/                              LLM-абстракция
      types.ts, mock.ts, index.ts, prompts.ts
    payments/                         платёжная абстракция
      types.ts, mock.ts, yookassa.ts, index.ts
    storage.ts, session.ts, worksheets.ts
  prisma/
    schema.prisma                     схема БД
    seed.ts                           тарифы + 15 шаблонов
    migrations/                       prisma миграции
  storage/                            файловое хранилище (gitignored)
  middleware.ts                       защита приватных роутов
cli/
  templates/                          15 LaTeX-шаблонов
    T1..T15/T<N>.tex
    _shared/worksheet_check.sty
    registry.json
    README.md
  prompts/                            LLM-промпты
    generate_from_topic.md, generate_from_material.md,
    generate_more_variants.md, generate_harder.md,
    check_worksheet.md, README.md
  output/                             pre-built PDFs (T1..T5)
  extract_answer_fields.py
```

## Локальный запуск

```bash
cd frontend
npm ci
cp .env.example .env.local           # отредактируйте при необходимости
npm run db:migrate                   # применить миграции
npm run db:seed                      # заполнить Plan + Template
npm run dev                          # → http://localhost:3010
```

## NPM скрипты

| Скрипт | Что делает |
|--------|-----------|
| `npm run dev` | Next.js dev server (порт 3010) |
| `npm run build` | Production build |
| `npm run start` | Production server |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:migrate` | Prisma migrate dev |
| `npm run db:seed` | Засеять Plans + Templates |
| `npm run db:studio` | Prisma Studio (визуальный браузер БД) |
| `npm run db:reset` | Снести БД и пересоздать |

## Переменные окружения (.env / .env.local)

См. `frontend/.env.example`. Ключевые:

| Var | По умолчанию | Назначение |
|-----|--------------|-----------|
| `DATABASE_URL` | `file:./dev.db` | Prisma. На проде — Postgres |
| `NEXTAUTH_SECRET` | (нужно сгенерировать) | `openssl rand -base64 32` |
| `LLM_PROVIDER` | `mock` | `claude` / `gigachat` / `deepseek` / `openai` / `openrouter` |
| `ANTHROPIC_API_KEY` | пусто | Для провайдера `claude` |
| `GIGACHAT_AUTH_KEY` | пусто | base64(client_id:secret) |
| `DEEPSEEK_API_KEY` | пусто | Для `deepseek` |
| `PAYMENTS_PROVIDER` | `mock` | `yookassa` / `qiwi` / `tinkoff` |
| `YOOKASSA_SHOP_ID` / `YOOKASSA_SECRET_KEY` | пусто | Боевой YooKassa |
| `STORAGE_DIR` | `./storage` | Куда сохранять uploads |
| `LATEX_CMD` | `xelatex` | Команда компиляции PDF |

## API эндпоинты (короткая шпаргалка)

| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/api/auth/register` | Регистрация по email + пароль |
| GET | `/api/templates` | Список 15 шаблонов |
| POST | `/api/worksheets` | Создать лист (через LLM) |
| GET | `/api/worksheets` | Мои листы |
| GET | `/api/worksheets/[id]` | Детали листа |
| POST | `/api/worksheets/[id]/variants` | +N вариантов |
| POST | `/api/worksheets/[id]/harder` | Усложнить |
| POST | `/api/worksheets/[id]/publish` | Опубликовать |
| POST | `/api/worksheets/[id]/unpublish` | Снять с витрины |
| GET | `/api/worksheets/[id]/export?format=pdf\|docx\|latex` | Скачать в выбранном формате |
| GET | `/api/worksheets/[id]/latex-zip` | ZIP с .tex и README для локальной компиляции |
| GET | `/api/worksheets/[id]/overleaf` | HTML с авто-сабмитом формы в Overleaf |
| POST | `/api/upload` | Загрузить фото/PDF |
| GET | `/api/uploads/[id]` | Получить файл |
| GET | `/api/marketplace` | Витрина |
| POST | `/api/favorites` | Toggle избранное |
| GET | `/api/bestlist` | Корпус «лучших» |
| POST | `/api/bestlist/mark` | (admin) пометить в bestlist |
| POST | `/api/billing/create-payment` | Создать платёж |
| POST | `/api/webhooks/yookassa` | Webhook от YooKassa |
| GET | `/api/me` | Профиль + подписка |
| POST | `/api/generate` | (legacy MVP) отдаёт pre-built PDF T1–T5 |
| GET | `/api/pdf/[T]` | Скачать pre-built PDF |

## Стек

- **Frontend / API:** Next.js 14 + TypeScript + App Router
- **БД:** Prisma 5 + SQLite (dev) / PostgreSQL (prod)
- **Auth:** NextAuth v4 (Credentials, JWT-сессии)
- **LLM:** свой адаптер под Claude / GigaChat / DeepSeek / OpenAI / OpenRouter
- **Платежи:** свой адаптер под YooKassa / QIWI / Tinkoff (mock в dev)
- **PDF:** xelatex + Wildcat-шаблоны из `Lessons/_templates/` + `zref-savepos` для координат полей
- **Файлы:** локальный диск, на проде — `/home/pavel/projects/rabochiilist/storage/`

## Деплой на sono

```bash
ssh pavel@130.193.35.199
cd /home/pavel/projects/rabochiilist
git pull
cd frontend
npm ci
npm run db:migrate:deploy
npm run db:seed
npm run build
pm2 restart rabochiilist-frontend
```

- Nginx: `/etc/nginx/sites-enabled/rabochiilist` → proxy_pass `127.0.0.1:3010`
- PM2 systemd unit активен.

## Документы

- [`.agent/RDP.md`](.agent/RDP.md) — исходный RDP v0.1
- [`.agent/NIGHT_WORK_2026-05-26.md`](.agent/NIGHT_WORK_2026-05-26.md) — что сделано в ночь 26 мая
- [`.agent/docs/obsidian-integration.md`](.agent/docs/obsidian-integration.md) — план интеграции vault (на утро)
- [`cli/templates/README.md`](cli/templates/README.md) — система шаблонов
- [`cli/prompts/README.md`](cli/prompts/README.md) — LLM-промпты

## GitHub

https://github.com/pavelneumoin/latex_ai

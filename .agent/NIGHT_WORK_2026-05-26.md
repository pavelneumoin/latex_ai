# Ночная сборка 2026-05-26 — РабочийЛист.ai

**Длительность:** одна ночь, автономный режим.
**Состояние до:** Next.js 14 каркас, 5 LaTeX-шаблонов T1–T5, 2 API-роута (legacy /api/generate и /api/pdf/[T]), все остальные страницы — заглушки. Никакой БД, auth, LLM-абстракции, биллинга.

**Состояние после:** базовая рабочая инфраструктура SaaS под подключение любой LLM-модели утром. См. ниже.

---

## Что сделано

### 1. Базовая инфраструктура (P0.1)

**БД — Prisma + SQLite:**
- Схема `frontend/prisma/schema.prisma` — 13 моделей:
  Auth: `User`, `Account`, `Session`, `VerificationToken`.
  Контент: `Template`, `Worksheet`, `Upload`.
  Маркетплейс: `Publication`, `Favorite`.
  Биллинг: `Plan`, `Subscription`, `Payment`, `Credit`.
- Первая миграция применена (`20260525221503_init`).
- Seed (`frontend/prisma/seed.ts`) — 3 тарифа + 15 шаблонов из `cli/templates/registry.json`.
- Утром: чтобы перейти на PostgreSQL — поменять `provider` в schema.prisma + `DATABASE_URL`.

**LLM-абстракция — `frontend/lib/llm/`:**
- `types.ts` — единый интерфейс `LLMProvider.generate({messages, attachments, jsonSchema, ...})`.
- `mock.ts` — заглушка по умолчанию, возвращает валидный JSON для всех 5 промптов.
- `index.ts` — реестр провайдеров + `getProvider()` с fallback на mock.
- `prompts.ts` — загрузчик `.md`-промптов из `cli/prompts/` с разбором секций `# SYSTEM`, `# USER_TEMPLATE`, `# OUTPUT_SCHEMA` и шаблонизацией `{{переменных}}`.
- Утром: добавить файл `lib/llm/providers/<name>.ts` (Claude/GigaChat/DeepSeek), зарегистрировать в `index.ts`, поставить ключ в `.env.local`.

**Платёжная абстракция — `frontend/lib/payments/`:**
- `types.ts` — интерфейс `PaymentsProvider.createPayment(...)` + парсер вебхуков.
- `mock.ts` — для dev.
- `yookassa.ts` — полностью реализованный YooKassa-адаптер (fetch-обёртка, /v3/payments, idempotence key, webhook parser).
- `index.ts` — `getPayments()` с auto-fallback на mock, если ключи не заданы.
- Утром: задать `YOOKASSA_SHOP_ID` + `YOOKASSA_SECRET_KEY` в .env.local — переключение автоматическое.

**Auth — NextAuth v4 (Credentials):**
- `frontend/lib/auth.ts` — конфиг + `registerUser(email, password, name)`.
- `frontend/app/api/auth/[...nextauth]/route.ts` — handler.
- `frontend/middleware.ts` — защита `/dashboard`, `/my`, `/settings`, `/billing` и приватных API.
- `frontend/types/next-auth.d.ts` — расширение сессии user.id.
- Утром: подключить SMTP для magic-link или включить VK ID OAuth (см. RDP §12.3).

**Env / конфиг:**
- `frontend/.env.example` — все переменные с комментариями (БД, auth, 5 LLM-провайдеров, 3 платёжных, storage, LaTeX).
- `frontend/.env` — минимум для Prisma CLI.
- `frontend/.env.local` — dev-конфиг.
- Storage-папки: `frontend/storage/{uploads,worksheets,logos,_temp_uploads}/` с `.gitkeep`, содержимое gitignored.

### 2. Шаблоны рабочих листов (P0.2)

10 новых LaTeX-шаблонов `T6`–`T15`, каждый — реально другой дизайн (не просто другой цвет):

| ID | Название | Стиль | Раскладка | Предмет |
|----|----------|-------|-----------|---------|
| T6 | Производная | минимал, тонкая линия слева | 1 кол × 7 | math |
| T7 | Планиметрия | газета, диагональная подложка | 2 кол × 10 | math |
| T8 | Тригонометрия | журнал, охра, толстая полоса | 2 кол × 8 | math |
| T9 | Степени и корни | карточки 2×4, изумруд | grid 2×4 | math |
| T10 | Контрольная | 2 варианта параллельно, графит | variants × 5 | math |
| T11 | Линейные неравенства | тетрадь, линовка, рукописный | 1 кол × 6 | math |
| T12 | Логика | терминал-моно, тёмно-зелёный | 1 кол × 6 | informatics |
| T13 | Проценты | пастель 3×3, скруглённые | grid 3×3 | math |
| T14 | ОГЭ ч/б | официальный, бордовая линия | 1 кол × 11 | math |
| T15 | Тренажёр | бирюза, плотная сетка | 3 кол × 18 | math |

- Реестр `cli/templates/registry.json` (15 записей с метаданными).
- Документ `cli/templates/README.md` — как добавлять шаблон.
- PDF не скомпилированы — у пользователя локально есть xelatex, утром можно прогнать `latexmk` по всем 10 за один раз.

### 3. LLM-промпты (P1.1 база)

5 модельно-нейтральных промптов в `cli/prompts/`:

| Файл | Назначение | Выход |
|------|------------|-------|
| `generate_from_topic.md` | Лист по теме | JSON {title, subtitle, tasks} |
| `generate_from_material.md` | Извлечение из материала (фото/PDF/текст) | JSON + `coverage: full\|partial\|none` |
| `generate_more_variants.md` | Доп-варианты с другими числами | массив листов |
| `generate_harder.md` | Усложнённый вариант (3 уровня) | новый лист, тип сохранён |
| `check_worksheet.md` | Vision-проверка по координатам | оценка + поле-за-полем |

- Все промпты с `# SYSTEM / # USER_TEMPLATE / # OUTPUT_SCHEMA / # EXAMPLE_*` секциями.
- Шкала 5-балльная вынесена в промпт: ≥86→5, 70-85→4, 50-69→3, <50→null.

### 4. API эндпоинты (P0.1–P1)

18 новых роутов + 2 legacy. Полный список — в `README.md`. Ключевые:

- `POST /api/auth/register` — регистрация (zod-валидация, 409 email_taken)
- `GET /api/templates` — фильтры subject/grade/layout
- `POST /api/worksheets` — генерация через LLM-абстракцию + лимит из подписки
- `GET /api/worksheets` + `/api/worksheets/[id]` — мои листы
- `POST /api/worksheets/[id]/variants` — +N вариантов
- `POST /api/worksheets/[id]/harder` — усложнить
- `POST /api/upload` — multipart фото/PDF (≤20 MB)
- `POST /api/worksheets/[id]/publish` — публикация в маркетплейс
- `GET /api/marketplace` — витрина с фильтрами
- `POST /api/favorites` — toggle
- `GET /api/bestlist` + `POST /api/bestlist/mark` — корпус «лучших» (P1.3)
- `POST /api/billing/create-payment` + `POST /api/webhooks/yookassa`
- `GET /api/me` — профиль + подписка

Все защищённые роуты используют `getSessionUser()` / `requireUser()` хелперы из `lib/session.ts`.

### 5. Страницы (P0.3, P0.4, P1.2)

Реализованы (не заглушки):
- `/login`, `/register` — формы с zod-валидацией
- `/dashboard` — приветствие + последние листы + статистика
- `/my` — список листов с фильтрами и поиском
- `/my/[id]` — детали листа + кнопки «Ещё вариант» и «Усложнить» + публикация
- `/pricing` — 3 тарифа (Free / Учитель PRO / Школа)
- `/billing` — текущая подписка + история платежей
- `/billing/success` — страница возврата от платёжки
- `/marketplace` — витрина
- `/marketplace/[id]` — детали публикации
- `/create` — расширен на 15 шаблонов

Заглушки оставлены: `/catalog` (старая, заменена на `/marketplace`), `/check` (vision-чекер — на утро), `/settings` (мини-форма).

### 6. Документация

- `README.md` — обновлён полностью, отражает новую архитектуру.
- `cli/templates/README.md` — система шаблонов.
- `cli/prompts/README.md` — система промптов.
- `.agent/docs/obsidian-integration.md` — план интеграции vault, 6 вариантов (A–F), рекомендация — гибрид SQLite+векторка, реализация утром после подтверждения варианта.
- Этот файл.

### 7. NPM скрипты

```
typecheck   — tsc --noEmit
db:generate — prisma generate
db:migrate  — prisma migrate dev
db:migrate:deploy — prisma migrate deploy (prod)
db:seed     — tsx prisma/seed.ts
db:reset    — prisma migrate reset --force
db:studio   — prisma studio
postinstall — prisma generate (авто после npm ci)
```

---

## Проверки

- `npx prisma migrate dev` — OK, миграция применена.
- `npx tsx prisma/seed.ts` — OK, 3 plans + 15 templates.
- `npx tsc --noEmit` — OK, без ошибок.

## Что НЕ сделано (намеренно отложено)

1. **Реальный LLM-провайдер** — пользователь подключит ключ утром. Сейчас все эндпоинты работают через mock и возвращают валидный JSON-стаб.
2. **Компиляция LaTeX в PDF** для новых T6–T15 — требует xelatex окружения, пользователь скомпилирует локально.
3. **Vision-чекер** `/api/check` — промпт готов, эндпоинт не реализован (нужен реальный vision-API).
4. **SMTP magic-link** — сейчас пароль; письма поднимем когда выберем SMTP.
5. **VK ID OAuth** — отложено (см. RDP §12.3).
6. **Реальный YooKassa** — адаптер написан, ключи пустые.
7. **Интеграция Obsidian vault** — только документ-план в `.agent/docs/obsidian-integration.md`, реализация утром после подтверждения варианта.
8. **Обновление прода** — НЕ пушу в GitHub, не деплою. Локальный коммит готов, push утром.

## Открытые вопросы для пользователя утром

1. **LLM-провайдер**: GigaChat (бесплатный лимит) vs Claude (платно, лучшее качество) vs DeepSeek (дешёво) — какой включаем первым?
2. **Obsidian vault**: какой из 6 вариантов (A–F) интеграции выбираем? Рекомендация — F (гибрид SQLite+векторка) с поэтапным MVP=E (SQLite-индекс).
3. **SMTP**: использовать Yandex SMTP / Mailgun / SendPulse / какой-то ещё? Или временно оставить пароль-логин и подключить VK ID?
4. **YooKassa**: ИП регистрация есть? Если нет — какой запасной вариант (QIWI принимает физлиц)?
5. **Реальные цены**: Free 5/мес, Pro ₽490/мес, Школа ₽9 900/мес — устраивает или меняем?
6. **Анти-абьюз**: оставляем «pending» статус из RDP или открываем всем сразу?

## Файлы, изменённые ночью (новые)

Новые директории и файлы:
```
frontend/prisma/schema.prisma
frontend/prisma/seed.ts
frontend/prisma/migrations/20260525221503_init/migration.sql
frontend/lib/db.ts
frontend/lib/auth.ts
frontend/lib/session.ts
frontend/lib/storage.ts
frontend/lib/worksheets.ts
frontend/lib/llm/{types,mock,index,prompts}.ts
frontend/lib/payments/{types,mock,yookassa,index}.ts
frontend/middleware.ts
frontend/types/next-auth.d.ts
frontend/.env, .env.example, .env.local
frontend/storage/{uploads,worksheets,logos,_temp_uploads}/.gitkeep
frontend/app/api/auth/register/route.ts
frontend/app/api/auth/[...nextauth]/route.ts
frontend/app/api/templates/route.ts
frontend/app/api/worksheets/{route,[id]/route,[id]/variants/route,[id]/harder/route,[id]/publish/route,[id]/unpublish/route}.ts
frontend/app/api/upload/route.ts
frontend/app/api/uploads/[id]/route.ts
frontend/app/api/marketplace/route.ts
frontend/app/api/favorites/route.ts
frontend/app/api/bestlist/{route,mark/route}.ts
frontend/app/api/billing/create-payment/route.ts
frontend/app/api/webhooks/yookassa/route.ts
frontend/app/api/me/route.ts
frontend/app/{login,register,dashboard,my,my/[id],pricing,billing,billing/success,marketplace,marketplace/[id]}/page.tsx
cli/templates/T6..T15/T<N>.tex
cli/templates/registry.json
cli/templates/README.md
cli/prompts/{generate_from_topic,generate_from_material,generate_more_variants,generate_harder,check_worksheet,README}.md
.agent/docs/obsidian-integration.md
.agent/NIGHT_WORK_2026-05-26.md  (этот файл)
README.md  (обновлён)
```

Изменённые:
```
frontend/package.json   (новые dependencies + scripts)
frontend/tsconfig.json  (не трогался)
.gitignore              (добавлены prisma + storage паттерны)
```

---

*Конец отчёта. Готово к ревью утром.*

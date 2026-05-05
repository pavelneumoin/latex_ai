# Handoff: WorksheetAI — Backend integration

## Overview
WorksheetAI — сервис для русских учителей математики и информатики: учитель описывает тему урока, ИИ генерирует рабочий лист (PDF), его можно скачать, раздать ученикам, потом загрузить фото работ и получить автоматическую проверку. В этом бандле — 10 экранов hi-fi прототипа, реализованных на React + inline JSX (CDN, без сборки). **Задача разработчика: подключить реальный бэкенд (БД, авторизация, генерация LLM, рендер PDF, OCR-проверка) и перенести UI в продакшен-фреймворк по своему выбору** (Next.js / Remix / Vue, что больше подходит).

## About the Design Files
Файлы в бандле — это **дизайн-референсы**, прототипы, показывающие визуал и поведение. Это не продакшен-код. Задача — воссоздать эти экраны в целевом окружении проекта (например, Next.js + shadcn/ui + TailwindCSS), пользуясь существующими паттернами и компонентами фреймворка. Если бэкенда ещё нет — выбрать стек на своё усмотрение (рекомендую Next.js 14 App Router + Postgres + Prisma + shadcn/ui + TailwindCSS — дизайн уже выполнен в shadcn-стиле).

## Fidelity
**High-fidelity (hifi)**. Финальные цвета, типографика, отступы, состояния. Воспроизводить пиксель-в-пиксель в целевом UI-ките. Дизайн намеренно построен на shadcn-style токенах, поэтому портирование на shadcn/ui тривиально.

## Backend — что нужно прикрутить

Это главное в этой передаче. UI готов, нужен бэкенд:

### 1. Auth (passwordless email magic link)
- POST `/api/auth/request-link` { email } → отправляет одноразовую ссылку на почту
- GET `/api/auth/verify?token=…` → ставит сессионную cookie, редиректит на `/dashboard`
- Использовать `next-auth` Email provider или `lucia-auth`
- Сессия — JWT в httpOnly cookie

### 2. Worksheets — CRUD
Модель `Worksheet`:
```
id, userId, title, subject (algebra|geometry|informatics),
grade (5..11), lessonType (control|practice|study|self),
taskCount, topic (text), options (jsonb: { theory, grid, logo, answers }),
folderId (nullable), pdfUrl (S3), generatedJson (jsonb — задачи + ответы),
versions (array of {ts, snapshot}), createdAt, updatedAt
```
Endpoints:
- `POST /api/worksheets` — создать (запускает генерацию)
- `GET /api/worksheets?folder=&q=&subject=&grade=` — список с фильтрами
- `GET /api/worksheets/:id`
- `PATCH /api/worksheets/:id` — редактировать
- `DELETE /api/worksheets/:id`
- `POST /api/worksheets/:id/duplicate`
- `POST /api/worksheets/:id/regenerate` — новая версия

### 3. Generation pipeline (главное!)
Когда пользователь жмёт «Сгенерировать»:
1. Создать `Worksheet` со статусом `generating`
2. Запустить фоновую задачу (BullMQ / inngest / vercel cron)
3. Шаги задачи (стримить прогресс через SSE на `/api/worksheets/:id/progress`):
   - **Generate tasks** — `Anthropic API` (claude-haiku-4-5), system-prompt: «Ты учитель-методист, генерируешь N задач по теме T для класса G». Output: JSON-массив задач.
   - **Solve answers** — второй вызов Claude: «Реши каждую задачу, дай краткое и развёрнутое решение». Output: ответы.
   - **Render PDF** — серверный рендер. Рекомендую `react-pdf` (`@react-pdf/renderer`) или Puppeteer (HTML→PDF). Шаблон листа: шапка с лого школы, заголовок, нумерованные задачи, опционально клетчатое поле, опционально теория с пропусками, опционально ответы в конце/отдельной странице.
   - **Upload to S3** → URL в `pdfUrl`, статус `ready`.
4. Прогресс-модалка (см. `hi-create.jsx → HiProgress`) подписана на SSE.

### 4. Folders
Простая модель `Folder { id, userId, name, color }` + worksheets.folderId.

### 5. Catalog (publicworksheets)
- Флаг `isPublic` на Worksheet + поля `downloads`, `rating`, `verified`
- `GET /api/catalog?subject=&grade=&type=&q=&sort=popular|new|rating`
- `POST /api/catalog/:id/download` — копирует в личные

### 6. Check student work (OCR + grading)
Самый сложный модуль:
- `POST /api/checks` — создать проверку для worksheet, прикрепить класс/группу
- `POST /api/checks/:id/upload` — multipart, фото работ; для каждого — отдельный `Submission { studentName, photoUrl, score, errors[], status }`
- Pipeline:
  1. Отправить фото в Claude (vision): «Распознай решения, сравни с эталоном (передаём `generatedJson.answers`), укажи ошибки и поставь балл от 2 до 5»
  2. Сохранить result, дать учителю ручное переподтверждение
- `GET /api/checks/:id/export` — Excel-ведомость (использовать `exceljs`)

### 7. School branding / settings
Модель `School { id, ownerId, name, city, logoUrl, accentColor }`.
Логотип попадает в шапку каждого PDF.

### 8. Subscription / quotas
- Free план — 5 генераций в месяц (счётчик `Worksheet.where(generatedAt in this month).count`)
- Pro план — безлимит. Платежи: ЮKassa или CloudPayments (российские карты)
- Middleware проверяет квоту перед `POST /api/worksheets`

## Screens

Все экраны лежат на дизайн-канвасе в `WorksheetAI Hi-Fi.html`. Файлы по экранам:

| Экран | Файл | Назначение |
|---|---|---|
| Лендинг | `hi-landing.jsx` | Маркетинговая страница, CTA → /signup |
| Логин | `hi-dashboard.jsx → HiLogin` | Magic-link вход |
| Дашборд | `hi-dashboard.jsx → HiDashboard` | Главная после входа: hero-CTA, последние листы, стата за месяц |
| Создание листа | `hi-create.jsx → HiCreate` | Двух-панельный конструктор: форма слева, preview справа |
| Прогресс | `hi-create.jsx → HiProgress` | Модалка с SSE-прогрессом генерации |
| Мои листы | `hi-mine.jsx → HiMine` | Сетка превью, папки, фильтры |
| Страница листа | `hi-mine.jsx → HiDetail` | Детали + действия + история версий |
| Каталог | `hi-rest.jsx → HiCatalog` | Поиск + фильтры + сетка чужих листов |
| Проверка работ | `hi-rest.jsx → HiCheck` | Таблица учеников + детальная панель с фото и ошибками |
| Настройки | `hi-rest.jsx → HiSettings` | Профиль, школа/брендинг, подписка |

## Design Tokens (`hifi.css`)
```
Colors:
  --bg: #FFFFFF
  --surface: #F8FAFC
  --surface-2: #F1F5F9
  --border: #E2E8F0
  --border-2: #CBD5E1
  --fg: #0F172A
  --fg-2: #475569
  --fg-3: #64748B
  --primary: #1E40AF (синий)
  --primary-soft: #DBE3F5
  --accent: #F59E0B (янтарный — главные CTA)
  --accent-soft: #FEF3C7
  --success: #10B981
  --error: #EF4444

Radii: 16 (cards), 10 (buttons / inputs)
Shadows: var(--shadow-sm/md/lg) — мягкие, slate-tinted
Typography:
  Display: Manrope 700/600 (заголовки)
  Body: Inter 400/500/600 (текст, UI)
  H1: 36px / 1.1 / -0.02em
  H2: 28px / 1.2
  H3: 20px / 1.3
  Body: 14px / 1.5
```

В Tailwind/shadcn:
- `--primary` → ваш `primary`
- `--accent` → новый цвет (CTA «Создать лист», «Скачать PDF»)
- Manrope подключить через `next/font/google`

## Stack рекомендация
- **Next.js 14 App Router** + TypeScript
- **shadcn/ui** + TailwindCSS — компоненты дизайна один-в-один
- **Prisma + Postgres** (Neon/Supabase)
- **NextAuth** (Email provider) или Lucia
- **Anthropic SDK** (claude-haiku-4-5)
- **@react-pdf/renderer** для PDF
- **AWS S3** или Supabase Storage
- **BullMQ + Redis** или Inngest для очередей
- **shadcn/ui Sonner** для тостов

## Files в бандле
- `WorksheetAI Hi-Fi.html` — корневой канвас (открыть для просмотра)
- `hifi.css` — все токены и базовые компоненты-классы
- `hi-primitives.jsx` — Logo, Btn, Badge, Avatar, Doc (PDF-превью), Sidebar, Topbar, иконки
- `hi-landing.jsx` — лендинг
- `hi-dashboard.jsx` — логин + дашборд
- `hi-create.jsx` — создание + прогресс
- `hi-mine.jsx` — мои листы + детали
- `hi-rest.jsx` — каталог + проверка + настройки
- `design-canvas.jsx` — пан/зум канвас (служебный, для просмотра)

## Что не покрыто дизайном — нужно решить разработчику
- Onboarding после первого логина (можно использовать модалку поверх дашборда)
- Empty states (нет листов, нет проверок) — сделать дружелюбные, в стиле основных экранов
- Error states (генерация упала, OCR не распознал) — показать в модалке с retry
- Mobile/tablet responsive — дизайн сделан под десктоп 1280+, на мобильном sidebar становится drawer
- Шаринг ссылок на лист (если решите делать)

## Контакт
Все вопросы по дизайну — обратно в чат с дизайнером (Claude). Финальные пиксели и состояния можно проверить, открыв `WorksheetAI Hi-Fi.html` в браузере.

// Кабинет · Обзор: сводка без перегруза — детали в разделах и LaTeX-отчётах.

import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getActiveSubscriptions, tierLabel } from "@/lib/entitlements";
import { getLLMCapabilities } from "@/lib/llm";
import {
  IconArrowRight,
  IconCheckSquare,
  IconFile,
  IconLibrary,
  IconPencil,
  IconUpload,
} from "@/app/_components/Icons";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  draft: "черновик",
  uploaded: "работы загружены",
  processing: "проверяется",
  review: "на разметке",
  done: "завершена",
  failed: "ошибка",
};

const WORKSHEET_STATUS: Record<
  string,
  { label: string; note: string; progress: number; color: string; background: string }
> = {
  draft: {
    label: "Черновик",
    note: "Параметры сохранены — можно продолжить в любой момент.",
    progress: 35,
    color: "var(--fg-2)",
    background: "var(--surface-2)",
  },
  generating: {
    label: "Собираем лист",
    note: "Генерация уже идёт. Откройте лист, чтобы проверить результат.",
    progress: 70,
    color: "var(--primary)",
    background: "var(--primary-soft)",
  },
  ready: {
    label: "Готов к печати",
    note: "Лист можно открыть, проверить и скачать в нужном формате.",
    progress: 100,
    color: "#047857",
    background: "#D1FAE5",
  },
  failed: {
    label: "Нужно внимание",
    note: "Генерация не завершилась. Откройте лист, чтобы повторить или изменить параметры.",
    progress: 45,
    color: "#B91C1C",
    background: "#FEE2E2",
  },
};

export default async function CabinetOverview() {
  const session = await getServerSession(authOptions);
  const userId = session!.user!.id;
  const firstName = (session?.user?.name || "").trim().split(/\s+/)[0] || "коллега";

  const [
    subs,
    purchases,
    purchaseCount,
    checks,
    checkCount,
    classes,
    reports,
    latestWorksheet,
    worksheetCount,
  ] = await Promise.all([
    getActiveSubscriptions(userId),
    prisma.purchase.findMany({
      where: { userId },
      include: { product: { select: { title: true, slug: true, subject: true } } },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
    prisma.purchase.count({ where: { userId } }),
    prisma.checkJob.findMany({
      where: { userId },
      include: { class: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
    prisma.checkJob.count({ where: { userId } }),
    prisma.class.count({ where: { userId, archived: false } }),
    prisma.report.count({ where: { userId } }),
    prisma.worksheet.findFirst({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        topic: true,
        subject: true,
        grade: true,
        status: true,
        updatedAt: true,
      },
    }),
    prisma.worksheet.count({ where: { userId } }),
  ]);

  const paidSubs = subs.filter((s) => s.planId !== "free");
  const llm = getLLMCapabilities();
  const worksheetStatus = latestWorksheet
    ? WORKSHEET_STATUS[latestWorksheet.status] ?? WORKSHEET_STATUS.draft
    : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 1060 }}>
      <div className="rl-row-between">
        <div>
          <h1 style={{ fontSize: "clamp(22px, 4vw, 30px)" }}>Здравствуйте, {firstName}!</h1>
          <p className="muted-2" style={{ marginTop: 4, fontSize: 14.5 }}>
            Всё для урока в одном месте — продолжайте с того места, где остановились.
          </p>
        </div>
        <div className="rl-row">
          <Link href="/catalog" className="btn btn-outline">
            Каталог
          </Link>
          <Link href="/cabinet/checks/new" className="btn btn-primary">
            + Новая проверка
          </Link>
        </div>
      </div>

      {/* Персональный старт */}
      <div className="rl-grid rl-grid-2" style={{ alignItems: "stretch", gap: 16 }}>
        <section
          className="card"
          style={{
            padding: 22,
            display: "flex",
            flexDirection: "column",
            minHeight: 264,
            overflow: "hidden",
            position: "relative",
            background:
              "linear-gradient(135deg, var(--bg) 0%, var(--primary-soft) 145%)",
            border: "1px solid color-mix(in srgb, var(--primary) 20%, var(--border))",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              alignSelf: "flex-start",
              color: "var(--primary)",
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: ".04em",
              textTransform: "uppercase",
              marginBottom: 14,
            }}
          >
            <IconFile size={16} />
            {latestWorksheet ? "Продолжить работу" : "Ваш первый материал"}
          </div>

          {latestWorksheet && worksheetStatus ? (
            <>
              <h2
                style={{
                  fontSize: "clamp(20px, 3vw, 26px)",
                  marginBottom: 7,
                  maxWidth: 560,
                }}
              >
                {latestWorksheet.title}
              </h2>
              <div
                className="muted-2"
                style={{
                  fontSize: 13.5,
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "4px 10px",
                  marginBottom: 18,
                }}
              >
                {latestWorksheet.topic && <span>{latestWorksheet.topic}</span>}
                <span>
                  {subjectName(latestWorksheet.subject)}
                  {latestWorksheet.grade ? ` · ${latestWorksheet.grade} класс` : ""}
                </span>
                <span>Обновлён {formatActivityDate(latestWorksheet.updatedAt)}</span>
              </div>

              <div style={{ marginTop: "auto" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 8,
                  }}
                >
                  <span
                    style={{
                      padding: "4px 9px",
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 700,
                      color: worksheetStatus.color,
                      background: worksheetStatus.background,
                    }}
                  >
                    {worksheetStatus.label}
                  </span>
                  <Link
                    href="/my"
                    className="muted"
                    style={{ fontSize: 12, textDecoration: "none" }}
                  >
                    {worksheetCount} {pluralizeWorksheets(worksheetCount)}
                    {" →"}
                  </Link>
                </div>
                <div
                  aria-label={`Готовность: ${worksheetStatus.progress}%`}
                  style={{
                    height: 6,
                    borderRadius: 999,
                    background: "var(--surface-2)",
                    overflow: "hidden",
                    marginBottom: 8,
                  }}
                >
                  <div
                    style={{
                      width: `${worksheetStatus.progress}%`,
                      height: "100%",
                      borderRadius: 999,
                      background:
                        latestWorksheet.status === "failed"
                          ? "var(--error)"
                          : "var(--primary)",
                    }}
                  />
                </div>
                <p className="muted-2" style={{ fontSize: 12.5, marginBottom: 15 }}>
                  {worksheetStatus.note}
                </p>
                <Link
                  href={`/my/${latestWorksheet.id}`}
                  className="btn btn-primary"
                  style={{ display: "inline-flex", alignItems: "center", gap: 7 }}
                >
                  Открыть и продолжить
                  <IconArrowRight size={16} />
                </Link>
              </div>
            </>
          ) : (
            <>
              <h2 style={{ fontSize: "clamp(20px, 3vw, 26px)", marginBottom: 8 }}>
                Создайте первый рабочий лист
              </h2>
              <p className="muted-2" style={{ fontSize: 14, lineHeight: 1.55, maxWidth: 520 }}>
                Укажите тему или загрузите готовые задания. Черновик сохранится в кабинете,
                и в следующий раз вы продолжите прямо отсюда.
              </p>
              <div style={{ marginTop: "auto", paddingTop: 18 }}>
                <Link
                  href="/create"
                  className="btn btn-primary"
                  style={{ display: "inline-flex", alignItems: "center", gap: 7 }}
                >
                  <IconPencil size={16} />
                  Создать первый лист
                </Link>
              </div>
            </>
          )}
        </section>

        <section className="card" style={{ padding: 22, minHeight: 264 }}>
          <h2 style={{ fontSize: 20, marginBottom: 5 }}>Быстрый старт</h2>
          <p className="muted-2" style={{ fontSize: 13.5, marginBottom: 16 }}>
            Выберите, с чего начать. Все результаты автоматически появятся в кабинете.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <QuickStartLink
              href="/create"
              icon={<IconPencil size={19} />}
              title="Создать рабочий лист"
              note={
                llm.ready
                  ? "Из банка задач или с помощью нейросети"
                  : "Из проверенного банка задач ФИПИ"
              }
            />
            {llm.ready ? (
              <QuickStartLink
                href="/upload"
                icon={<IconUpload size={19} />}
                title={llm.vision ? "Загрузить фото или PDF" : "Загрузить PDF"}
                note="Перенесите свои задания в аккуратный лист"
              />
            ) : (
              <QuickStartStatus
                icon={<IconUpload size={19} />}
                title="AI-импорт пока не подключён"
                note="Файлы не отправятся в демо-заглушку"
              />
            )}
            <QuickStartLink
              href="/my"
              icon={<IconFile size={19} />}
              title="Мои рабочие листы"
              note={`${worksheetCount} ${pluralizeWorksheets(worksheetCount)} · все черновики и готовые материалы`}
            />
            <QuickStartLink
              href="/catalog"
              icon={<IconLibrary size={19} />}
              title="Взять готовый комплект"
              note="Рабочие листы, презентации и ключи"
            />
          </div>
        </section>
      </div>

      {/* Сводка */}
      <div className="rl-grid rl-grid-4">
        <div className="rl2-stat">
          <span className="rl2-stat-label">Материалы</span>
          <span className="rl2-stat-value">{purchaseCount}</span>
          <Link href="/cabinet/library" style={{ fontSize: 12.5, color: "var(--primary)" }}>
            В библиотеку →
          </Link>
        </div>
        <div className="rl2-stat">
          <span className="rl2-stat-label">Классы</span>
          <span className="rl2-stat-value">{classes}</span>
          <Link href="/cabinet/classes" style={{ fontSize: 12.5, color: "var(--primary)" }}>
            К классам →
          </Link>
        </div>
        <div className="rl2-stat">
          <span className="rl2-stat-label">Проверки</span>
          <span className="rl2-stat-value">{checkCount}</span>
          <Link href="/cabinet/checks" style={{ fontSize: 12.5, color: "var(--primary)" }}>
            К проверкам →
          </Link>
        </div>
        <div className="rl2-stat">
          <span className="rl2-stat-label">Отчёты</span>
          <span className="rl2-stat-value">{reports}</span>
          <Link href="/cabinet/reports" style={{ fontSize: 12.5, color: "var(--primary)" }}>
            К отчётам →
          </Link>
        </div>
      </div>

      {/* Подписка */}
      <div className="card" style={{ padding: 18 }}>
        <div className="rl-row-between">
          <div>
            <div style={{ fontWeight: 700, fontFamily: "var(--display)", fontSize: 16 }}>
              {paidSubs.length > 0
                ? paidSubs
                    .map((s) => `${s.plan.name} (${tierLabel(s.plan.tier)})`)
                    .join(" · ")
                : "Подписки нет — бесплатный доступ"}
            </div>
            <div className="muted" style={{ fontSize: 13, marginTop: 3 }}>
              {paidSubs.length > 0
                ? `Действует до ${paidSubs[0].currentPeriodEnd.toLocaleDateString("ru-RU")}`
                : "Подписка открывает все PDF предмета и автопроверку без ограничений."}
            </div>
          </div>
          <Link href={paidSubs.length > 0 ? "/cabinet/billing" : "/pricing"} className="btn btn-blue">
            {paidSubs.length > 0 ? "Управлять" : "Подключить"}
          </Link>
        </div>
      </div>

      <div className="rl-grid rl-grid-2" style={{ alignItems: "start" }}>
        {/* Последние покупки */}
        <div className="card" style={{ padding: 18 }}>
          <div className="rl-row-between" style={{ marginBottom: 12 }}>
            <h3>Библиотека</h3>
            <Link href="/cabinet/library" style={{ fontSize: 13, color: "var(--primary)" }}>
              Все →
            </Link>
          </div>
          {purchases.length === 0 ? (
            <div className="rl2-empty rl2-gridpaper">
              <div style={{ color: "var(--fg-3)", marginBottom: 8 }}>
                <IconLibrary size={30} />
              </div>
              Купленные материалы появятся здесь.
              <div style={{ marginTop: 10 }}>
                <Link href="/catalog" className="btn btn-sm btn-outline">
                  Открыть каталог
                </Link>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {purchases.map((p) => (
                <Link
                  key={p.id}
                  href={`/catalog/${p.product.slug}`}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 10,
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid var(--border)",
                    textDecoration: "none",
                    fontSize: 14,
                  }}
                >
                  <span style={{ fontWeight: 600, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {p.product.title}
                  </span>
                  <span className="rl2-tier" data-tier={p.tier}>
                    {p.tier === "source" ? "исходники" : "PDF"}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Последние проверки */}
        <div className="card" style={{ padding: 18 }}>
          <div className="rl-row-between" style={{ marginBottom: 12 }}>
            <h3>Проверки</h3>
            <Link href="/cabinet/checks" style={{ fontSize: 13, color: "var(--primary)" }}>
              Все →
            </Link>
          </div>
          {checks.length === 0 ? (
            <div className="rl2-empty rl2-gridpaper">
              <div style={{ color: "var(--fg-3)", marginBottom: 8 }}>
                <IconCheckSquare size={30} />
              </div>
              Загрузите работы учеников — система посчитает баллы и отметки.
              <div style={{ marginTop: 10 }}>
                <Link href="/cabinet/checks/new" className="btn btn-sm btn-primary">
                  Новая проверка
                </Link>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {checks.map((c) => (
                <Link
                  key={c.id}
                  href={`/cabinet/checks/${c.id}`}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 10,
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid var(--border)",
                    textDecoration: "none",
                    fontSize: 14,
                  }}
                >
                  <span style={{ fontWeight: 600, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {c.class?.name ? `${c.class.name} · ` : ""}
                    {c.title}
                  </span>
                  <span className="badge">{STATUS_LABEL[c.status] ?? c.status}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function QuickStartLink({
  href,
  icon,
  title,
  note,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  note: string;
}) {
  return (
    <Link
      href={href}
      className="card-hover"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "11px 12px",
        borderRadius: 12,
        border: "1px solid var(--border)",
        color: "var(--fg)",
        textDecoration: "none",
      }}
    >
      <span
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          display: "grid",
          placeItems: "center",
          flex: "0 0 auto",
          background: "var(--primary-soft)",
          color: "var(--primary)",
        }}
      >
        {icon}
      </span>
      <span style={{ minWidth: 0, flex: 1 }}>
        <span style={{ display: "block", fontSize: 14, fontWeight: 700 }}>{title}</span>
        <span
          className="muted-2"
          style={{
            display: "block",
            fontSize: 12,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {note}
        </span>
      </span>
      <IconArrowRight size={16} />
    </Link>
  );
}

function QuickStartStatus({
  icon,
  title,
  note,
}: {
  icon: React.ReactNode;
  title: string;
  note: string;
}) {
  return (
    <div
      aria-disabled="true"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "11px 12px",
        borderRadius: 12,
        border: "1px dashed var(--border-2)",
        color: "var(--fg-3)",
        background: "var(--surface)",
      }}
    >
      <span
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          display: "grid",
          placeItems: "center",
          flex: "0 0 auto",
          background: "var(--surface-2)",
        }}
      >
        {icon}
      </span>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 14, fontWeight: 700 }}>{title}</span>
        <span style={{ display: "block", fontSize: 12 }}>{note}</span>
      </span>
    </div>
  );
}

function subjectName(subject: string | null): string {
  if (subject === "math") return "Математика";
  if (subject === "informatics") return "Информатика";
  if (subject === "mixed") return "Смешанный предмет";
  return "Рабочий лист";
}

function formatActivityDate(date: Date): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function pluralizeWorksheets(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return "лист";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "листа";
  return "листов";
}

// Тарифы v2: подписки по предметам (математика / информатика / всё включено)
// + поштучные покупки. Мягкая ценовая политика старта.

import { getServerSession } from "next-auth/next";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Header } from "../_components/Header";
import { PricingClient } from "./PricingClient";

export const dynamic = "force-dynamic";

const FAQ: { q: string; a: string }[] = [
  {
    q: "Чем подписка отличается от покупки?",
    a: "Покупка — навсегда: материал остаётся в библиотеке, даже если подписки нет. Подписка — доступ ко всем PDF предмета, пока она активна. Что выгоднее — зависит от того, сколько уроков вы берёте в месяц: подписка окупается уже с 6 комплектов.",
  },
  {
    q: "Что такое уровень «PDF + исходники»?",
    a: "Кроме готовых PDF вы получаете редактируемые исходники: презентации в Marp (Markdown), листы в LaTeX. Можно менять числа, фамилии, порядок задач и собирать свои варианты. Исходники продаются поштучно или включены в план «Всё включено».",
  },
  {
    q: "Как работает автопроверка?",
    a: "К каждому листу из каталога приложен ключ. В кабинете создаёте проверку, загружаете фото или PDF работ учеников — система считает баллы, проценты и отметки по вашей шкале, а статистика собирается в аккуратный PDF-отчёт. Распознавание нейросетью подключается поэтапно; ручная разметка с автоподсчётом доступна всем уже сейчас.",
  },
  {
    q: "Оплата и чеки",
    a: "Сейчас включён тестовый режим оплаты (деньги не списываются). К запуску подключаем ЮKassa: карты РФ, СБП, SberPay, чеки по 54-ФЗ. Все сервисы — российские, хостинг — Yandex Cloud.",
  },
  {
    q: "Можно ли отменить подписку?",
    a: "Да, в любой момент в кабинете — доступ сохранится до конца оплаченного периода. Купленные поштучно материалы остаются навсегда.",
  },
];

export default async function PricingPage() {
  const [session, plans] = await Promise.all([
    getServerSession(authOptions),
    prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { priceMonthly: "asc" },
    }),
  ]);

  const userId = session?.user?.id;
  const subscriptions = userId
    ? await prisma.subscription.findMany({
        where: { userId, status: "active", currentPeriodEnd: { gte: new Date() } },
      })
    : [];

  return (
    <div className="hi" style={{ minHeight: "100vh", background: "var(--surface)" }}>
      <Header />

      <div className="rl2-gridpaper-fade" style={{ background: "var(--bg)", borderBottom: "1px solid var(--border)" }}>
        <div className="rl-container" style={{ paddingTop: 40, paddingBottom: 30, textAlign: "center", position: "relative" }}>
          <h1 className="rl-h2" style={{ marginBottom: 8 }}>
            Тарифы — мягкие, как первый звонок
          </h1>
          <p className="rl-lead" style={{ maxWidth: 640, margin: "0 auto" }}>
            Подписки раздельные по предметам. Любой материал можно купить и поштучно —
            от 19 ₽. Первый урок каждого курса — бесплатно, вместе с исходниками.
          </p>
        </div>
      </div>

      <main className="rl-container" style={{ paddingTop: 32, paddingBottom: 72 }}>
        <PricingClient
          plans={plans.map((p) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            subject: p.subject,
            tier: p.tier,
            priceMonthly: p.priceMonthly,
            priceYearly: p.priceYearly,
            checksLimit: p.checksLimit,
          }))}
          activePlanIds={subscriptions.map((s) => s.planId)}
          loggedIn={!!userId}
        />

        {/* Поштучные цены */}
        <div className="card" style={{ padding: 22, marginTop: 34 }}>
          <h3 style={{ marginBottom: 12 }}>Или поштучно — без подписки</h3>
          <div style={{ overflowX: "auto" }}>
            <table className="table" style={{ minWidth: 520 }}>
              <thead>
                <tr>
                  <th>Материал</th>
                  <th>PDF</th>
                  <th>PDF + исходники</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontWeight: 600 }}>Комплект урока (презентация + лист + ДЗ + зачёты)</td>
                  <td>49 ₽</td>
                  <td>129 ₽</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600 }}>Отдельный элемент (лист, презентация, зачёт)</td>
                  <td>19 ₽</td>
                  <td>49 ₽</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600 }}>Курс целиком (5–8 уроков)</td>
                  <td>199 ₽</td>
                  <td>499 ₽</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600 }}>Первый урок каждого курса</td>
                  <td colSpan={2} style={{ color: "var(--success)", fontWeight: 700 }}>
                    Бесплатно — оцените качество
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="muted" style={{ fontSize: 12.5, marginTop: 10 }}>
            Покупка — навсегда. Уже купили PDF, а нужны исходники? Доплатите разницу.
          </p>
          <Link href="/catalog" className="btn btn-outline" style={{ marginTop: 12 }}>
            Смотреть каталог →
          </Link>
        </div>

        {/* FAQ */}
        <div style={{ marginTop: 40, maxWidth: 780, marginLeft: "auto", marginRight: "auto" }}>
          <h2 style={{ textAlign: "center", marginBottom: 18 }}>Вопросы и ответы</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {FAQ.map((f) => (
              <details key={f.q} className="card" style={{ padding: "14px 18px" }}>
                <summary style={{ fontWeight: 700, fontSize: 14.5, cursor: "pointer", fontFamily: "var(--display)" }}>
                  {f.q}
                </summary>
                <p className="muted-2" style={{ fontSize: 14, marginTop: 8, lineHeight: 1.55 }}>
                  {f.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

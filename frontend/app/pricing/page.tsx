// Тарифы: все PDF бесплатны; подписка по предметам (математика / информатика /
// всё включено) открывает редактируемые Marp/LaTeX-исходники. Мягкие цены старта.

import { getServerSession } from "next-auth/next";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Header } from "../_components/Header";
import { PricingClient } from "./PricingClient";

export const dynamic = "force-dynamic";

const FAQ: { q: string; a: string }[] = [
  {
    q: "Что бесплатно, а что по подписке?",
    a: "Все готовые PDF — презентации, рабочие листы и домашние задания — доступны бесплатно и без подписки, скачивайте и печатайте. По подписке открываются редактируемые исходники Marp/LaTeX: план предмета — исходники этого предмета, «Всё включено» — по обоим предметам.",
  },
  {
    q: "Что такое исходники Marp/LaTeX?",
    a: "Кроме готовых PDF по подписке вы получаете редактируемые исходники: презентации в Marp (Markdown), листы в LaTeX. Можно менять числа, фамилии, порядок задач и собирать свои варианты — комплект становится вашим.",
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
    a: "Да, в любой момент в кабинете — доступ к исходникам сохранится до конца оплаченного периода. Готовые PDF остаются бесплатными в любом случае.",
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
            Все PDF-материалы — бесплатно, без подписки. Подписка открывает
            редактируемые Marp/LaTeX-исходники: раздельно по предметам или всё сразу.
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

        {/* Что бесплатно */}
        <div className="card rl2-gridpaper" style={{ padding: 22, marginTop: 34 }}>
          <span className="rl2-tier" data-tier="free">Бесплатно навсегда</span>
          <h3 style={{ margin: "12px 0 8px" }}>Весь каталог PDF — без подписки</h3>
          <p className="muted-2" style={{ fontSize: 14, lineHeight: 1.55, maxWidth: 640 }}>
            Презентации, рабочие листы и домашние задания всех курсов — скачивайте и
            печатайте бесплатно, регистрация занимает минуту. Подписка нужна только для
            редактируемых Marp/LaTeX-исходников.
          </p>
          <Link href="/catalog" className="btn btn-outline" style={{ marginTop: 14 }}>
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

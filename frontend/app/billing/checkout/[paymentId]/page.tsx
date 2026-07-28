// «Тестовая касса» (mock-провайдер): выглядит как платёжная форма,
// по кнопке дёргает наш вебхук успеха. Боевой YooKassa редиректит на свою страницу.

import { getServerSession } from "next-auth/next";
import { notFound, redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isMockPaymentsAllowed } from "@/lib/payments";
import { formatKopecks } from "@/lib/products";
import { CheckoutClient } from "./CheckoutClient";

export const dynamic = "force-dynamic";

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: { paymentId: string };
  searchParams: { return?: string };
}) {
  if (!isMockPaymentsAllowed()) notFound();

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect(`/login?callbackUrl=/billing`);

  const payment = await prisma.payment.findUnique({
    where: { id: params.paymentId },
  });
  if (
    !payment ||
    payment.userId !== session.user.id ||
    payment.provider !== "mock"
  ) {
    notFound();
  }

  const returnUrl =
    typeof searchParams.return === "string" && searchParams.return.startsWith("http")
      ? searchParams.return
      : "/cabinet/billing?paid=1";

  let title = "Оплата";
  try {
    const meta = payment.metadata ? (JSON.parse(payment.metadata) as Record<string, string>) : {};
    if (payment.purpose === "subscription") title = "Оплата подписки";
    else if (payment.purpose === "one_time") title = "Покупка материала";
    else if (meta.credits) title = "Пакет генераций";
  } catch {
    // не критично
  }

  return (
    <div
      className="hi rl2-gridpaper"
      style={{
        minHeight: "100vh",
        background: "var(--surface)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <CheckoutClient
        payment={{
          id: payment.id,
          providerPaymentId: payment.providerPaymentId ?? "",
          amount: payment.amount,
          currency: payment.currency,
          amountLabel: formatKopecks(payment.amount),
          status: payment.status,
          title,
        }}
        returnUrl={returnUrl}
      />
    </div>
  );
}

import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findFirst: vi.fn(),
  transaction: vi.fn(),
  parseWebhook: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    payment: {
      findFirst: mocks.findFirst,
    },
    $transaction: mocks.transaction,
  },
}));

vi.mock("@/lib/payments", () => ({
  getPayments: () => ({
    name: "yookassa",
    isReady: () => true,
    createPayment: vi.fn(),
    parseWebhook: mocks.parseWebhook,
  }),
}));

import { POST } from "@/app/api/webhooks/yookassa/route";

describe("YooKassa webhook delivery race", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a retryable non-2xx when a verified remote payment is not local yet", async () => {
    mocks.parseWebhook.mockResolvedValue({
      providerPaymentId: "yk_created_before_local_insert",
      status: "succeeded",
      amount: 49_900,
      currency: "RUB",
      raw: {},
    });
    mocks.findFirst.mockResolvedValue(null);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    const response = await POST(
      new NextRequest("http://localhost/api/webhooks/yookassa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "payment.succeeded",
          object: { id: "yk_created_before_local_insert" },
        }),
      })
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "payment_not_ready",
      retryable: true,
    });
    expect(mocks.parseWebhook).toHaveBeenCalledOnce();
    expect(mocks.findFirst).toHaveBeenCalledWith({
      where: {
        providerPaymentId: "yk_created_before_local_insert",
        provider: "yookassa",
      },
    });
    expect(mocks.transaction).not.toHaveBeenCalled();

    warn.mockRestore();
  });
});

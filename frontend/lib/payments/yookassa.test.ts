import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { YooKassaPayments } from "./yookassa";

beforeEach(() => {
  vi.stubEnv("YOOKASSA_SHOP_ID", "shop_test");
  vi.stubEnv("YOOKASSA_SECRET_KEY", "secret_test");
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("YooKassa webhook verification", () => {
  it("uses the server-to-server payment response instead of notification fields", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "yk_payment_1",
          status: "succeeded",
          amount: { value: "1234.56", currency: "RUB" },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    const event = await new YooKassaPayments().parseWebhook(
      {},
      {
        event: "payment.canceled",
        object: {
          id: "yk_payment_1",
          status: "canceled",
          amount: { value: "0.01", currency: "USD" },
        },
      }
    );

    expect(event).toMatchObject({
      providerPaymentId: "yk_payment_1",
      status: "succeeded",
      amount: 123456,
      currency: "RUB",
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.yookassa.ru/v3/payments/yk_payment_1",
      expect.objectContaining({
        method: "GET",
        cache: "no-store",
        headers: expect.objectContaining({
          Authorization: `Basic ${Buffer.from(
            "shop_test:secret_test"
          ).toString("base64")}`,
        }),
      })
    );
  });

  it("maps a verified canceled payment and ignores non-terminal states", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: "yk_payment_2",
            status: "canceled",
            amount: { value: "10.00", currency: "rub" },
          }),
          { status: 200 }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: "yk_payment_2",
            status: "pending",
            amount: { value: "10.00", currency: "RUB" },
          }),
          { status: 200 }
        )
      );

    await expect(
      new YooKassaPayments().parseWebhook(
        {},
        { object: { id: "yk_payment_2" } }
      )
    ).resolves.toMatchObject({
      status: "cancelled",
      amount: 1000,
      currency: "RUB",
    });

    await expect(
      new YooKassaPayments().parseWebhook(
        {},
        { object: { id: "yk_payment_2" } }
      )
    ).resolves.toBeNull();

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("rejects a payment response with another id", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "another_payment",
          status: "succeeded",
          amount: { value: "10.00", currency: "RUB" },
        }),
        { status: 200 }
      )
    );

    await expect(
      new YooKassaPayments().parseWebhook(
        {},
        { object: { id: "yk_payment_3" } }
      )
    ).rejects.toThrow("yookassa_verification_id_mismatch");
  });
});

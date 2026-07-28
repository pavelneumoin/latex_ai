import { afterEach, describe, expect, it, vi } from "vitest";
import { getPayments, isMockPaymentsAllowed } from "./index";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("payment provider configuration", () => {
  it("allows mock payments in development and test only by default", () => {
    expect(
      isMockPaymentsAllowed({ NODE_ENV: "development" } as NodeJS.ProcessEnv)
    ).toBe(true);
    expect(
      isMockPaymentsAllowed({ NODE_ENV: "test" } as NodeJS.ProcessEnv)
    ).toBe(true);
    expect(
      isMockPaymentsAllowed({ NODE_ENV: "production" } as NodeJS.ProcessEnv)
    ).toBe(false);
  });

  it("rejects mock payments in production without explicit opt-in", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("PAYMENTS_PROVIDER", "mock");
    vi.stubEnv("ALLOW_MOCK_PAYMENTS", "false");

    expect(() => getPayments()).toThrow("mock_payments_disabled");
  });

  it("allows an explicit production mock opt-in", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("PAYMENTS_PROVIDER", "mock");
    vi.stubEnv("ALLOW_MOCK_PAYMENTS", "true");

    expect(getPayments().name).toBe("mock");
  });

  it("keeps the local mock webhook flow operational", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("PAYMENTS_PROVIDER", "mock");

    await expect(
      getPayments().parseWebhook(
        {},
        {
          providerPaymentId: "mock_test",
          status: "succeeded",
          amount: 4900,
          currency: "rub",
        }
      )
    ).resolves.toMatchObject({
      providerPaymentId: "mock_test",
      status: "succeeded",
      amount: 4900,
      currency: "RUB",
    });
  });

  it("does not silently fall back when YooKassa is not configured", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("PAYMENTS_PROVIDER", "yookassa");
    vi.stubEnv("YOOKASSA_SHOP_ID", "");
    vi.stubEnv("YOOKASSA_SECRET_KEY", "");

    expect(() => getPayments()).toThrow(
      "payments_provider_not_configured:yookassa"
    );
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getPrimarySubscription: vi.fn(),
  update: vi.fn(),
}));

vi.mock("./entitlements", () => ({
  getPrimarySubscription: mocks.getPrimarySubscription,
}));

vi.mock("./db", () => ({
  prisma: {
    subscription: {
      update: mocks.update,
    },
  },
}));

import { incrementVariantUsage, incrementWorksheetUsage } from "./worksheets";

describe("worksheet usage accounting", () => {
  beforeEach(() => {
    mocks.getPrimarySubscription.mockReset();
    mocks.update.mockReset();
  });

  it("increments only the primary subscription for a worksheet", async () => {
    mocks.getPrimarySubscription.mockResolvedValue({ id: "sub-primary" });

    await incrementWorksheetUsage("user-1");

    expect(mocks.update).toHaveBeenCalledOnce();
    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: "sub-primary" },
      data: { usedWorksheets: { increment: 1 } },
    });
  });

  it("increments only the primary subscription for successful variants", async () => {
    mocks.getPrimarySubscription.mockResolvedValue({ id: "sub-primary" });

    await incrementVariantUsage("user-1", 2);

    expect(mocks.update).toHaveBeenCalledOnce();
    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: "sub-primary" },
      data: { usedVariants: { increment: 2 } },
    });
  });

  it("does not update unrelated subscriptions when no active plan exists", async () => {
    mocks.getPrimarySubscription.mockResolvedValue(null);

    await incrementWorksheetUsage("user-1");

    expect(mocks.update).not.toHaveBeenCalled();
  });
});

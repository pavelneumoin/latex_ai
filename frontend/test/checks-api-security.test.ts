import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  checkChecksLimit: vi.fn(),
  getProductAccess: vi.fn(),
  classFindUnique: vi.fn(),
  productFindUnique: vi.fn(),
  checkJobCreate: vi.fn(),
  checkJobFindUnique: vi.fn(),
  checkResultFindMany: vi.fn(),
  checkResultCreateMany: vi.fn(),
  uploadFindMany: vi.fn(),
  studentFindMany: vi.fn(),
}));

vi.mock("@/lib/session", () => ({
  requireUser: mocks.requireUser,
}));

vi.mock("@/lib/entitlements", () => ({
  checkChecksLimit: mocks.checkChecksLimit,
  getProductAccess: mocks.getProductAccess,
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    class: { findUnique: mocks.classFindUnique },
    product: { findUnique: mocks.productFindUnique },
    checkJob: {
      create: mocks.checkJobCreate,
      findUnique: mocks.checkJobFindUnique,
    },
    checkResult: {
      findMany: mocks.checkResultFindMany,
      createMany: mocks.checkResultCreateMany,
    },
    upload: { findMany: mocks.uploadFindMany },
    student: { findMany: mocks.studentFindMany },
  },
}));

import { POST as createCheck } from "@/app/api/checks/route";
import { GET as getCheck } from "@/app/api/checks/[id]/route";

const user = { id: "user-1" };
const product = {
  id: "product-1",
  subject: "math",
  isFree: false,
  isPublished: true,
  answerKeyJson: '[{"n":1,"answer":"42","points":1}]',
};

function createRequest(productId = product.id) {
  return new NextRequest("http://localhost/api/checks", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ title: "Проверка", productId }),
  });
}

describe("checks API product access", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireUser.mockResolvedValue(user);
    mocks.checkChecksLimit.mockResolvedValue({
      ok: true,
      planId: "free",
      used: 0,
      limit: 10,
    });
    mocks.productFindUnique.mockResolvedValue(product);
    mocks.checkJobCreate.mockResolvedValue({ id: "job-1" });
  });

  it("rejects a published product the user cannot access", async () => {
    mocks.getProductAccess.mockResolvedValue({
      maxTier: null,
      via: null,
      purchaseTier: null,
    });

    const response = await createCheck(createRequest());

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "product_not_found" });
    expect(mocks.getProductAccess).toHaveBeenCalledWith(user.id, product);
    expect(mocks.checkJobCreate).not.toHaveBeenCalled();
  });

  it("rejects an unpublished product without revealing that it exists", async () => {
    mocks.productFindUnique.mockResolvedValue({ ...product, isPublished: false });

    const response = await createCheck(createRequest());

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "product_not_found" });
    expect(mocks.getProductAccess).not.toHaveBeenCalled();
    expect(mocks.checkJobCreate).not.toHaveBeenCalled();
  });

  it("creates a check for a published product the user can access", async () => {
    mocks.getProductAccess.mockResolvedValue({
      maxTier: "basic",
      via: "purchase",
      purchaseTier: "basic",
    });

    const response = await createCheck(createRequest());

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ id: "job-1" });
    expect(mocks.checkJobCreate).toHaveBeenCalledTimes(1);
  });
});

describe("checks API answer-key privacy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireUser.mockResolvedValue(user);
    mocks.checkJobFindUnique.mockResolvedValue({
      id: "job-1",
      userId: user.id,
      title: "Проверка",
      status: "draft",
      totalTasks: 1,
      maxScore: 1,
      classId: null,
      productId: product.id,
      createdAt: new Date("2026-08-30T00:00:00.000Z"),
    });
    mocks.checkResultFindMany.mockResolvedValue([]);
    mocks.uploadFindMany.mockResolvedValue([]);
    mocks.productFindUnique.mockResolvedValue({
      id: product.id,
      title: "Платный материал",
      checkable: true,
      answerKeyJson: product.answerKeyJson,
    });
  });

  it("never serializes the product answer key in check details", async () => {
    const response = await getCheck(
      new NextRequest("http://localhost/api/checks/job-1"),
      { params: { id: "job-1" } }
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.product).toEqual({
      id: product.id,
      title: "Платный материал",
      checkable: true,
    });
    expect(JSON.stringify(body)).not.toContain("answerKeyJson");
    expect(JSON.stringify(body)).not.toContain("\"answer\":\"42\"");
  });
});

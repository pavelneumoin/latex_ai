import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { registerUser } from "@/lib/auth";
import { checkRate, ipFromReq, rateLimited } from "@/lib/rate-limit";

export const runtime = "nodejs";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(200),
  name: z.string().min(1).max(120).optional(),
});

export async function POST(req: NextRequest) {
  // Anti-abuse: не более 5 регистраций с одного IP за 10 минут.
  const r = checkRate("register", ipFromReq(req), { limit: 5, windowMs: 10 * 60_000 });
  if (!r.ok) return rateLimited(r);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_error", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  try {
    const user = await registerUser(
      parsed.data.email,
      parsed.data.password,
      parsed.data.name
    );
    return NextResponse.json({
      ok: true,
      user: { id: user.id, email: user.email, name: user.name ?? null },
    });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "email_taken") {
      return NextResponse.json({ error: "email_taken" }, { status: 409 });
    }
    console.error("[register] unexpected", e);
    return NextResponse.json(
      { error: "internal_error", detail: msg },
      { status: 500 }
    );
  }
}

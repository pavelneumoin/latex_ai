// Перебрасывает учителя в Overleaf для редактирования LaTeX.
//
// Способ: возвращаем HTML-страничку с авто-сабмитом формы POST на https://www.overleaf.com/docs
// с полем "snip" (тело .tex) и "engine=xelatex". Это официальный механизм Overleaf:
// https://www.overleaf.com/learn/how-to/Opening_a_new_project_from_a_URI
//
// Преимущество перед snip_uri — не нужен публичный URL у нашего zip; работает даже на dev http://localhost.

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { renderLatexStandalone } from "@/lib/exporters/render-latex";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const ws = await prisma.worksheet.findUnique({
    where: { id: params.id },
    include: { template: true, user: true },
  });
  if (!ws) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (!ws.isPublic) {
    const session = await getServerSession(authOptions);
    const uid = (session?.user as { id?: string } | undefined)?.id;
    if (!uid || uid !== ws.userId) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
  }

  let parsed: { title?: string; subtitle?: string; tasks?: unknown[] } = {};
  try {
    parsed = ws.contentJson ? JSON.parse(ws.contentJson) : {};
  } catch {
    /* fall through to empty */
  }
  if (!parsed?.tasks?.length) {
    return NextResponse.json(
      { error: "no_content", detail: "Сначала сгенерируйте контент листа." },
      { status: 422 }
    );
  }

  const rendered = await renderLatexStandalone(
    {
      title: parsed.title || ws.title || "Рабочий лист",
      subtitle: parsed.subtitle as string | undefined,
      subject: ws.subject ?? undefined,
      grade: ws.grade ?? undefined,
      topic: ws.topic ?? undefined,
      templateId: ws.templateId,
      tasks: parsed.tasks as Array<{
        n: number;
        condition: string;
        expected_answer?: string;
        answer_type?: "number" | "string" | "list";
      }>,
    },
    ws.template?.style || "classic_wildcat_purple",
    ws.user
      ? {
          teacherName: ws.user.name ?? undefined,
          school: ws.user.school ?? undefined,
        }
      : undefined
  );

  // HTML с автосабмитом — обходит CORS и работает в любом браузере.
  const escaped = rendered.texSource
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  const html = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <title>Открываем в Overleaf…</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; padding: 48px; text-align: center; color: #475569; }
    h1 { color: #0F172A; }
    .spinner { display: inline-block; width: 40px; height: 40px; border: 4px solid #E2E8F0; border-top-color: #1E40AF; border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .fallback { margin-top: 24px; font-size: 14px; color: #64748B; }
    .fallback button { background: #1E40AF; color: white; border: 0; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-size: 14px; }
  </style>
</head>
<body>
  <h1>Открываем в Overleaf…</h1>
  <p class="spinner"></p>
  <p>Если перенаправление не сработало автоматически, нажмите кнопку:</p>

  <form id="overleaf-form" action="https://www.overleaf.com/docs" method="post" target="_blank">
    <input type="hidden" name="snip" value="${escaped}">
    <input type="hidden" name="snip_name" value="${(ws.title || "worksheet").replace(/[<>"]/g, "")}">
    <input type="hidden" name="engine" value="xelatex">
    <div class="fallback">
      <button type="submit">Открыть в Overleaf</button>
    </div>
  </form>

  <script>
    // Автосабмит через 200мс, чтобы пользователь успел увидеть страницу.
    setTimeout(function() {
      document.getElementById('overleaf-form').submit();
    }, 200);
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-store",
    },
  });
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface ClassOpt {
  id: string;
  name: string;
  students: number;
}
interface ProductOpt {
  id: string;
  title: string;
  subject: string;
  checkable: boolean;
}

export function NewCheckClient({
  classes,
  products,
  preselect,
}: {
  classes: ClassOpt[];
  products: ProductOpt[];
  preselect: { classId: string | null; productId: string | null };
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [classId, setClassId] = useState(preselect.classId ?? "");
  const [productId, setProductId] = useState(preselect.productId ?? "");
  const [mode, setMode] = useState<"catalog" | "custom">(
    products.length > 0 ? "catalog" : "custom"
  );
  const [totalTasks, setTotalTasks] = useState("8");
  const [maxScore, setMaxScore] = useState("8");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const product = products.find((p) => p.id === productId) ?? null;

  async function create() {
    const finalTitle =
      title.trim() ||
      (product ? `Проверка: ${product.title}` : "Проверка самостоятельной");
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/checks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: finalTitle,
          classId: classId || undefined,
          productId: mode === "catalog" && productId ? productId : undefined,
          totalTasks: mode === "custom" ? Number(totalTasks) || undefined : undefined,
          maxScore: mode === "custom" ? Number(maxScore) || undefined : undefined,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        if (data?.error === "checks_limit") {
          throw new Error(
            `Лимит проверок исчерпан (${data.used}/${data.limit}). Подключите подписку — и проверяйте без ограничений.`
          );
        }
        throw new Error(data?.error ?? `HTTP ${res.status}`);
      }
      router.push(`/cabinet/checks/${data.id}`);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 720 }}>
      <div>
        <h1 style={{ fontSize: "clamp(22px, 4vw, 30px)" }}>Новая проверка</h1>
        <p className="muted-2" style={{ marginTop: 4, fontSize: 14.5 }}>
          Шаг 1 из 2 — что проверяем и чей класс. Дальше загрузите работы.
        </p>
      </div>

      <div className="rl2-steps">
        <span className="rl2-step on">
          <b>1</b> Параметры
        </span>
        <span className="rl2-step-sep" />
        <span className="rl2-step">
          <b>2</b> Работы и результаты
        </span>
      </div>

      <div className="card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Что проверяем */}
        <div>
          <label className="label">Что проверяем</label>
          <div className="rl2-seg" style={{ marginBottom: 12 }}>
            <button
              type="button"
              className={mode === "catalog" ? "on" : ""}
              onClick={() => setMode("catalog")}
            >
              Материал из библиотеки
            </button>
            <button
              type="button"
              className={mode === "custom" ? "on" : ""}
              onClick={() => setMode("custom")}
            >
              Своя работа
            </button>
          </div>

          {mode === "catalog" ? (
            products.length === 0 ? (
              <div className="rl2-empty" style={{ padding: 20 }}>
                В библиотеке пока нет материалов с ключами.{" "}
                <Link href="/catalog" style={{ color: "var(--primary)" }}>
                  Выбрать в каталоге →
                </Link>
              </div>
            ) : (
              <select
                className="rl-input"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
              >
                <option value="">— выберите материал —</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                    {p.checkable ? " · с ключом" : ""}
                  </option>
                ))}
              </select>
            )
          ) : (
            <div className="rl-grid rl-grid-2">
              <div>
                <label className="label">Заданий в работе</label>
                <input
                  type="number"
                  className="rl-input"
                  min={1}
                  max={60}
                  value={totalTasks}
                  onChange={(e) => setTotalTasks(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Максимум баллов</label>
                <input
                  type="number"
                  className="rl-input"
                  min={1}
                  max={300}
                  value={maxScore}
                  onChange={(e) => setMaxScore(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Класс */}
        <div>
          <label className="label">Класс (ученики подставятся в таблицу)</label>
          {classes.length === 0 ? (
            <div className="rl2-empty" style={{ padding: 20 }}>
              Классов пока нет.{" "}
              <Link href="/cabinet/classes" style={{ color: "var(--primary)" }}>
                Создать класс →
              </Link>{" "}
              — или продолжайте без класса, имена введёте вручную.
            </div>
          ) : (
            <select className="rl-input" value={classId} onChange={(e) => setClassId(e.target.value)}>
              <option value="">Без класса (имена вручную)</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.students} уч.
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Название */}
        <div>
          <label className="label">Название проверки (необязательно)</label>
          <input
            className="rl-input"
            placeholder={product ? `Проверка: ${product.title}` : "Самостоятельная №3"}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={160}
          />
        </div>

        {error && <div style={{ color: "var(--error)", fontSize: 13.5 }}>{error}</div>}

        <div className="rl2-actions rl-row">
          <button type="button" className="btn btn-primary btn-lg" disabled={busy} onClick={create}>
            {busy ? "Создаём…" : "Далее: загрузить работы →"}
          </button>
          <Link href="/cabinet/checks" className="btn btn-ghost">
            Отмена
          </Link>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";

export interface LoaderStep {
  icon: string;
  label: string;
}

type Variant = "photo" | "create" | "bank" | "check";

const PRESETS: Record<Variant, { title: string; steps: LoaderStep[] }> = {
  photo: {
    title: "Распознаём фото",
    steps: [
      { icon: "📸", label: "Читаем снимок" },
      { icon: "🔍", label: "Находим условия задач" },
      { icon: "✍️", label: "Переписываем в чистый вид" },
      { icon: "🧮", label: "Считаем ответы" },
      { icon: "📄", label: "Собираем рабочий лист" },
    ],
  },
  create: {
    title: "Собираем рабочий лист",
    steps: [
      { icon: "🧠", label: "Подбираем задачи по теме" },
      { icon: "✍️", label: "Формулируем условия" },
      { icon: "🧮", label: "Считаем ответы" },
      { icon: "🎨", label: "Применяем оформление" },
      { icon: "📄", label: "Готовим PDF к печати" },
    ],
  },
  bank: {
    title: "Берём задачи из банка ФИПИ",
    steps: [
      { icon: "🏦", label: "Ищем по фильтру" },
      { icon: "🎯", label: "Отбираем лучшие задачи" },
      { icon: "🎨", label: "Применяем оформление" },
      { icon: "📄", label: "Готовим рабочий лист" },
    ],
  },
  check: {
    title: "Проверяем работу",
    steps: [
      { icon: "📸", label: "Читаем ответы ученика" },
      { icon: "✓", label: "Сверяем с эталоном" },
      { icon: "🧮", label: "Считаем баллы" },
      { icon: "🏅", label: "Выставляем оценку" },
    ],
  },
};

export function GenerationLoader({
  variant = "create",
  title,
  steps,
  note,
  onCancel,
}: {
  variant?: Variant;
  title?: string;
  steps?: LoaderStep[];
  note?: string;
  onCancel?: () => void;
}) {
  const preset = PRESETS[variant];
  const allSteps = steps ?? preset.steps;
  const heading = title ?? preset.title;

  const [active, setActive] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const startRef = useRef<number>(Date.now());

  // Шаги «дышат» сами по себе — реальных событий прогресса от LLM у нас нет,
  // поэтому идём по оценочному таймеру и тормозим на последнем шаге.
  useEffect(() => {
    const t = setInterval(() => {
      setActive((i) => (i < allSteps.length - 1 ? i + 1 : i));
    }, 2600);
    return () => clearInterval(t);
  }, [allSteps.length]);

  useEffect(() => {
    const t = setInterval(() => {
      setSeconds(Math.round((Date.now() - startRef.current) / 1000));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "rgba(15,23,42,0.55)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "grid",
        placeItems: "center",
        padding: 18,
        animation: "rl-fade-in 0.3s ease both",
      }}
    >
      <div
        style={{
          width: "min(440px, 100%)",
          background: "var(--bg)",
          borderRadius: 22,
          boxShadow: "var(--shadow-lg)",
          overflow: "hidden",
          animation: "rl-pop 0.4s cubic-bezier(0.34,1.56,0.64,1) both",
        }}
      >
        {/* Сцена */}
        <LoaderScene variant={variant} />

        {/* Контент */}
        <div style={{ padding: "20px 22px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <h2
              style={{
                margin: 0,
                fontFamily: "var(--display)",
                fontSize: 19,
                fontWeight: 800,
                letterSpacing: "-0.02em",
                color: "var(--fg)",
              }}
            >
              {heading}
            </h2>
            <span style={{ fontSize: 12, color: "var(--fg-3)", fontVariantNumeric: "tabular-nums", flex: "0 0 auto" }}>
              {seconds}s
            </span>
          </div>

          <p style={{ margin: "6px 0 16px", fontSize: 13.5, color: "var(--fg-3)", lineHeight: 1.5 }}>
            {note ?? "Обычно занимает 20–40 секунд. Не закрывай вкладку."}
          </p>

          {/* Прогресс-бар */}
          <div className="rl-prog" style={{ marginBottom: 18 }} />

          {/* Шаги */}
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 9 }}>
            {allSteps.map((s, i) => {
              const done = i < active;
              const current = i === active;
              return (
                <li
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 11,
                    opacity: done || current ? 1 : 0.4,
                    transition: "opacity 0.4s ease",
                  }}
                >
                  <span
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 999,
                      flex: "0 0 auto",
                      display: "grid",
                      placeItems: "center",
                      fontSize: 13,
                      fontWeight: 700,
                      background: done
                        ? "var(--success)"
                        : current
                        ? "var(--primary-soft)"
                        : "var(--surface-2)",
                      color: done ? "white" : current ? "var(--primary)" : "var(--fg-3)",
                      transition: "all 0.4s ease",
                    }}
                  >
                    {done ? "✓" : current ? "" : i + 1}
                    {current && (
                      <span
                        style={{
                          width: 9,
                          height: 9,
                          border: "2px solid var(--primary)",
                          borderTopColor: "transparent",
                          borderRadius: "50%",
                          animation: "rl-spin 0.7s linear infinite",
                        }}
                      />
                    )}
                  </span>
                  <span style={{ fontSize: 14, color: current ? "var(--fg)" : "var(--fg-2)", fontWeight: current ? 600 : 500 }}>
                    {s.icon} {s.label}
                  </span>
                </li>
              );
            })}
          </ul>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              style={{
                marginTop: 18,
                width: "100%",
                padding: "10px 14px",
                background: "transparent",
                border: "1px solid var(--border-2)",
                borderRadius: 10,
                color: "var(--fg-3)",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Отменить
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Анимированная «сцена» сверху карточки: лист бумаги, который заполняется, + луч сканера. */
function LoaderScene({ variant }: { variant: Variant }) {
  const scanning = variant === "photo" || variant === "check";
  return (
    <div
      style={{
        position: "relative",
        height: 148,
        background:
          "radial-gradient(120% 120% at 50% 0%, var(--primary-soft) 0%, var(--surface) 70%)",
        display: "grid",
        placeItems: "center",
        overflow: "hidden",
      }}
    >
      {/* плавающие символы фоном */}
      {["∑", "π", "√", "×", "÷", "∞"].map((sym, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            top: `${12 + (i % 3) * 30}%`,
            left: `${8 + i * 15}%`,
            fontSize: 18 + (i % 3) * 6,
            color: "var(--primary)",
            opacity: 0.16,
            fontFamily: "var(--display)",
            animation: `rl-float ${3.5 + (i % 3)}s ease-in-out ${i * 0.3}s infinite`,
          }}
        >
          {sym}
        </span>
      ))}

      {/* лист бумаги */}
      <div
        className="rl-float"
        style={{
          position: "relative",
          width: 92,
          height: 112,
          background: "white",
          borderRadius: 8,
          boxShadow: "var(--shadow-md)",
          border: "1px solid var(--border)",
          padding: "12px 11px",
          display: "flex",
          flexDirection: "column",
          gap: 7,
          overflow: "hidden",
        }}
      >
        <span style={{ width: "55%", height: 6, borderRadius: 3, background: "var(--primary)", opacity: 0.85 }} />
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            style={{
              width: i % 2 ? "70%" : "92%",
              height: 5,
              borderRadius: 3,
              background: "var(--surface-2)",
              animation: `rl-line-fill 2.4s ease ${i * 0.35}s infinite`,
            }}
          />
        ))}

        {/* луч сканера для фото/проверки */}
        {scanning && (
          <span
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              height: 16,
              top: "4%",
              background: "linear-gradient(180deg, transparent, rgba(30,64,175,0.28), transparent)",
              boxShadow: "0 0 10px 2px rgba(30,64,175,0.25)",
              animation: "rl-scan 1.8s ease-in-out infinite alternate",
            }}
          />
        )}
      </div>

      {/* бейдж-эмодзи источника */}
      <span
        style={{
          position: "absolute",
          right: "26%",
          bottom: 16,
          width: 38,
          height: 38,
          borderRadius: 999,
          background: "var(--bg)",
          boxShadow: "var(--shadow-md)",
          display: "grid",
          placeItems: "center",
          fontSize: 18,
          animation: "rl-pop 0.5s ease 0.2s both",
        }}
      >
        {variant === "photo" ? "📸" : variant === "bank" ? "🏦" : variant === "check" ? "✓" : "✨"}
      </span>

      <style>{`
        @keyframes rl-line-fill {
          0% { background: var(--surface-2); width: 35%; }
          50% { background: var(--primary-soft); }
          100% { background: var(--surface-2); width: 92%; }
        }
      `}</style>
    </div>
  );
}

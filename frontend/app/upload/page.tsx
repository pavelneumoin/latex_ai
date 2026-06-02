"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "../_components/Header";
import { GenerationLoader } from "../_components/GenerationLoader";

interface Template {
  id: string;
  name: string;
  taskCount: number;
  subject: string;
}

type Mode = "photo" | "pdf";

interface Picked {
  file: File;
  url: string;
}

const IMG_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_IMAGES = 4;

export default function UploadPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("photo");
  const [images, setImages] = useState<Picked[]>([]);
  const [pdf, setPdf] = useState<File | null>(null);

  const [templates, setTemplates] = useState<Template[] | null>(null);
  const [templateId, setTemplateId] = useState("T1");
  const [topic, setTopic] = useState("");
  const [subject, setSubject] = useState<"math" | "informatics">("math");
  const [grade, setGrade] = useState(11);

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    fetch("/api/templates")
      .then((r) => r.json())
      .then((d) => setTemplates(d.templates ?? []))
      .catch(() => {});
  }, []);

  // Чистим object URLs при размонтировании.
  useEffect(() => {
    return () => images.forEach((p) => URL.revokeObjectURL(p.url));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addImages = useCallback((files: FileList | File[]) => {
    setErr(null);
    const incoming = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (incoming.length === 0) {
      setErr("Это не похоже на изображение. Нужны JPG, PNG или WEBP.");
      return;
    }
    setImages((prev) => {
      const room = MAX_IMAGES - prev.length;
      const next = incoming.slice(0, room).map((file) => ({ file, url: URL.createObjectURL(file) }));
      if (incoming.length > room) setErr(`Можно не больше ${MAX_IMAGES} фото за раз.`);
      return [...prev, ...next];
    });
  }, []);

  const removeImage = (i: number) => {
    setImages((prev) => {
      const p = prev[i];
      if (p) URL.revokeObjectURL(p.url);
      return prev.filter((_, idx) => idx !== i);
    });
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (!files?.length) return;
    if (mode === "photo") addImages(files);
    else {
      const f = Array.from(files).find((x) => x.type === "application/pdf");
      if (f) setPdf(f);
      else setErr("Перетащите PDF-файл.");
    }
  };

  async function submit() {
    setErr(null);
    if (mode === "photo" && images.length === 0) {
      setErr("Добавь хотя бы одно фото с задачами.");
      return;
    }
    if (mode === "pdf" && !pdf) {
      setErr("Выбери PDF-файл.");
      return;
    }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.set("templateId", templateId);
      if (topic.trim()) fd.set("topic", topic.trim());
      fd.set("subject", subject);
      fd.set("grade", String(grade));

      let url: string;
      if (mode === "photo") {
        images.forEach((p) => fd.append("file", p.file));
        url = "/api/worksheets/from-image";
      } else {
        fd.set("file", pdf!);
        url = "/api/worksheets/from-pdf";
      }

      const res = await fetch(url, { method: "POST", body: fd });
      if (res.status === 401) {
        router.push("/login?next=/upload");
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.hint || data?.detail || data?.error || `HTTP ${res.status}`);
      }
      router.push(`/my/${data.worksheet.id}`);
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  }

  const canSubmit = mode === "photo" ? images.length > 0 : !!pdf;

  return (
    <div className="hi" style={{ minHeight: "100vh", background: "var(--surface)" }}>
      <Header />

      {busy && (
        <GenerationLoader
          variant={mode === "photo" ? "photo" : "create"}
          note={
            mode === "photo"
              ? "Нейросеть читает фото и переписывает задачи начисто. Обычно 20–40 секунд."
              : "Извлекаем текст из PDF и собираем рабочий лист."
          }
        />
      )}

      <main className="rl-container-narrow" style={{ padding: "28px 16px 64px" }}>
        {/* Заголовок */}
        <div style={{ marginBottom: 22 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 12px",
              borderRadius: 999,
              background: "var(--accent-soft)",
              color: "#92400E",
              fontSize: 12,
              fontWeight: 700,
              marginBottom: 12,
            }}
          >
            ⚡ Главная фишка
          </div>
          <h1 className="rl-h2" style={{ marginBottom: 8 }}>
            Сфотографируй задание — получи рабочий лист
          </h1>
          <p className="rl-lead" style={{ maxWidth: 560 }}>
            Сними страницу учебника или распечатку на телефон. Нейросеть распознает условия и соберёт
            аккуратный PDF с полями для ответов, автопроверкой и твоим оформлением.
          </p>
        </div>

        {/* Переключатель режима */}
        <div
          style={{
            display: "inline-flex",
            padding: 4,
            background: "var(--surface-2)",
            borderRadius: 12,
            gap: 4,
            marginBottom: 18,
          }}
        >
          <ModeTab active={mode === "photo"} onClick={() => setMode("photo")} icon="📸" label="Фото" hint="айфон/андроид" />
          <ModeTab active={mode === "pdf"} onClick={() => setMode("pdf")} icon="📄" label="PDF" hint="с текстом" />
        </div>

        {/* Зона загрузки */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          style={{
            border: dragOver ? "2px solid var(--primary)" : "2px dashed var(--border-2)",
            borderRadius: 16,
            background: dragOver ? "var(--primary-soft)" : "var(--bg)",
            padding: 22,
            transition: "all 0.15s",
            marginBottom: 16,
          }}
        >
          {mode === "photo" ? (
            <PhotoZone images={images} onPick={addImages} onRemove={removeImage} />
          ) : (
            <PdfZone pdf={pdf} onPick={setPdf} />
          )}
        </div>

        {/* Контекст */}
        <section style={{ background: "var(--bg)", borderRadius: 16, border: "1px solid var(--border)", padding: 18, marginBottom: 16 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 14px", fontFamily: "var(--display)" }}>
            Подсказки для нейросети <span style={{ color: "var(--fg-3)", fontWeight: 500 }}>(необязательно)</span>
          </h2>
          <div className="rl-grid rl-grid-3">
            <Field label="Тема">
              <input className="rl-input" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="«Линейные уравнения»" />
            </Field>
            <Field label="Предмет">
              <select className="rl-input" value={subject} onChange={(e) => setSubject(e.target.value as never)}>
                <option value="math">Математика</option>
                <option value="informatics">Информатика</option>
              </select>
            </Field>
            <Field label="Класс">
              <select className="rl-input" value={grade} onChange={(e) => setGrade(Number(e.target.value))}>
                {[5, 6, 7, 8, 9, 10, 11].map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </Field>
          </div>

          <div style={{ marginTop: 14 }}>
            <Field label="Шаблон оформления">
              {!templates ? (
                <div className="rl-skeleton" style={{ height: 42 }} />
              ) : (
                <select className="rl-input" value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.id} · {t.name}
                    </option>
                  ))}
                </select>
              )}
            </Field>
            <div style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 6 }}>
              Шаблон можно поменять потом — открой{" "}
              <Link href="/templates" style={{ color: "var(--primary)" }}>галерею</Link>.
            </div>
          </div>
        </section>

        {err && (
          <div
            style={{
              marginBottom: 16,
              padding: "12px 14px",
              background: "#FEE2E2",
              color: "#991B1B",
              borderRadius: 10,
              fontSize: 14,
              lineHeight: 1.45,
              display: "flex",
              gap: 8,
            }}
          >
            <span>⚠️</span>
            <span>{err}</span>
          </div>
        )}

        <button
          onClick={submit}
          disabled={busy || !canSubmit}
          className="rl-btn-block-mobile"
          style={{
            width: "100%",
            padding: "16px 22px",
            background: canSubmit ? "var(--accent)" : "var(--surface-2)",
            color: canSubmit ? "var(--accent-fg)" : "var(--fg-3)",
            border: "none",
            borderRadius: 14,
            fontWeight: 800,
            fontSize: 16,
            fontFamily: "var(--display)",
            cursor: busy ? "wait" : canSubmit ? "pointer" : "not-allowed",
            boxShadow: canSubmit ? "var(--shadow-sm)" : "none",
            transition: "all 0.15s",
          }}
        >
          {mode === "photo" ? "📸 Распознать и собрать лист →" : "📄 Превратить PDF в лист →"}
        </button>

        {/* Как это работает */}
        <div className="rl-grid rl-grid-3" style={{ marginTop: 28 }}>
          <HowStep n={1} icon="📱" title="Снимок или файл" text="Сфоткай страницу или перетащи готовый PDF/картинку" />
          <HowStep n={2} icon="🤖" title="Распознаём" text="Нейросеть вытащит условия задач и почистит их" />
          <HowStep n={3} icon="📄" title="Готовый лист" text="PDF к печати: поля для ответов, шапка, автопроверка" />
        </div>

        <p style={{ marginTop: 22, fontSize: 13, color: "var(--fg-3)", lineHeight: 1.55, textAlign: "center" }}>
          Совет: снимай при хорошем свете, держи телефон ровно над страницей, без бликов и пальцев в кадре.
          Можно приложить до {MAX_IMAGES} фото — например, разворот учебника.
        </p>
      </main>
    </div>
  );
}

/* ---------- Подкомпоненты ---------- */

function ModeTab({
  active,
  onClick,
  icon,
  label,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 1,
        padding: "8px 16px",
        borderRadius: 9,
        border: "none",
        cursor: "pointer",
        background: active ? "var(--bg)" : "transparent",
        boxShadow: active ? "var(--shadow-sm)" : "none",
        color: active ? "var(--fg)" : "var(--fg-3)",
      }}
    >
      <span style={{ fontWeight: 700, fontSize: 14 }}>
        {icon} {label}
      </span>
      <span style={{ fontSize: 10.5, color: active ? "var(--fg-3)" : "var(--fg-3)" }}>{hint}</span>
    </button>
  );
}

function PhotoZone({
  images,
  onPick,
  onRemove,
}: {
  images: Picked[];
  onPick: (f: FileList | File[]) => void;
  onRemove: (i: number) => void;
}) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      {/* Превью добавленных фото */}
      {images.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))",
            gap: 10,
            marginBottom: 16,
          }}
        >
          {images.map((p, i) => (
            <div
              key={i}
              style={{
                position: "relative",
                aspectRatio: "3 / 4",
                borderRadius: 10,
                overflow: "hidden",
                border: "1px solid var(--border)",
                background: "var(--surface-2)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt={`Фото ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <button
                type="button"
                onClick={() => onRemove(i)}
                aria-label="Убрать фото"
                style={{
                  position: "absolute",
                  top: 4,
                  right: 4,
                  width: 24,
                  height: 24,
                  borderRadius: 999,
                  border: "none",
                  background: "rgba(15,23,42,0.7)",
                  color: "white",
                  cursor: "pointer",
                  fontSize: 13,
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Кнопки источника */}
      <div className="rl-row rl-stack-mobile" style={{ gap: 10 }}>
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          onChange={(e) => e.target.files && onPick(e.target.files)}
          style={{ display: "none" }}
        />
        <input
          ref={galleryRef}
          type="file"
          accept={IMG_MIME.join(",")}
          multiple
          onChange={(e) => e.target.files && onPick(e.target.files)}
          style={{ display: "none" }}
        />
        <button
          type="button"
          onClick={() => cameraRef.current?.click()}
          className="rl-btn-block-mobile rl-mobile-only"
          style={{
            flex: 1,
            padding: "14px 18px",
            borderRadius: 12,
            border: "none",
            background: "var(--primary)",
            color: "white",
            fontWeight: 700,
            fontSize: 15,
            cursor: "pointer",
          }}
        >
          📸 Сделать снимок
        </button>
        <button
          type="button"
          onClick={() => galleryRef.current?.click()}
          className="rl-btn-block-mobile"
          style={{
            flex: 1,
            padding: "14px 18px",
            borderRadius: 12,
            border: "1px solid var(--border-2)",
            background: "var(--bg)",
            color: "var(--fg)",
            fontWeight: 700,
            fontSize: 15,
            cursor: "pointer",
          }}
        >
          🖼️ {images.length ? "Добавить ещё" : "Выбрать из галереи"}
        </button>
      </div>

      {images.length === 0 && (
        <p style={{ margin: "14px 0 0", fontSize: 13, color: "var(--fg-3)", textAlign: "center" }}>
          …или перетащи фото сюда. JPG, PNG, WEBP — до {MAX_IMAGES} штук.
        </p>
      )}
    </div>
  );
}

function PdfZone({ pdf, onPick }: { pdf: File | null; onPick: (f: File | null) => void }) {
  return (
    <label
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        cursor: "pointer",
        padding: "18px 12px",
      }}
    >
      <input type="file" accept="application/pdf" onChange={(e) => onPick(e.target.files?.[0] ?? null)} style={{ display: "none" }} />
      {pdf ? (
        <>
          <div style={{ fontSize: 30 }}>📄</div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{pdf.name}</div>
          <div style={{ fontSize: 12, color: "var(--fg-3)" }}>{(pdf.size / 1024).toFixed(0)} КБ · нажми, чтобы заменить</div>
        </>
      ) : (
        <>
          <div style={{ fontSize: 30 }}>⬆️</div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Выбери PDF (до 10 МБ)</div>
          <div style={{ fontSize: 12, color: "var(--fg-3)", textAlign: "center" }}>
            Работает с PDF, в котором есть текст (из Word/LaTeX). Скан-картинку лучше залить как фото.
          </div>
        </>
      )}
    </label>
  );
}

function HowStep({ n, icon, title, text }: { n: number; icon: string; title: string; text: string }) {
  return (
    <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 14, padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span
          style={{
            width: 24,
            height: 24,
            borderRadius: 999,
            background: "var(--primary-soft)",
            color: "var(--primary)",
            display: "grid",
            placeItems: "center",
            fontSize: 12,
            fontWeight: 800,
            flex: "0 0 auto",
          }}
        >
          {n}
        </span>
        <span style={{ fontSize: 20 }}>{icon}</span>
      </div>
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 3 }}>{title}</div>
      <div style={{ fontSize: 13, color: "var(--fg-3)", lineHeight: 1.45 }}>{text}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 5, color: "var(--fg-2)" }}>{label}</label>
      {children}
    </div>
  );
}

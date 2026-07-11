"use client";

// Отзывы и оценки: список + форма (интерактивные звёзды).

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { IconStar } from "@/app/_components/Icons";

interface ReviewRow {
  id: string;
  rating: number;
  text: string | null;
  verified: boolean;
  author: string;
  mine: boolean;
  createdAt: string;
}

export function ReviewsSection({
  productId,
  loggedIn,
  canReview,
}: {
  productId: string;
  loggedIn: boolean;
  canReview: boolean; // есть доступ (покупка/подписка/бесплатный) — можно оценивать
}) {
  const router = useRouter();
  const [reviews, setReviews] = useState<ReviewRow[] | null>(null);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/products/${productId}/reviews`)
      .then((r) => r.json())
      .then((d) => {
        setReviews(d.reviews ?? []);
        const mine = (d.reviews ?? []).find((r: ReviewRow) => r.mine);
        if (mine) {
          setRating(mine.rating);
          setText(mine.text ?? "");
        }
      })
      .catch(() => setReviews([]));
  }, [productId]);

  async function submit() {
    if (!loggedIn) {
      router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    if (rating < 1) {
      setNotice("Поставьте оценку — от 1 до 5 звёзд.");
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch(`/api/products/${productId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, text: text.trim() || undefined }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setNotice("Спасибо! Отзыв сохранён.");
      const d = await fetch(`/api/products/${productId}/reviews`).then((r) => r.json());
      setReviews(d.reviews ?? []);
      router.refresh();
    } catch (e) {
      setNotice(`Не получилось: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  const mine = reviews?.find((r) => r.mine);

  return (
    <div style={{ marginTop: 28 }}>
      <h3 style={{ marginBottom: 12 }}>
        Отзывы{reviews && reviews.length > 0 ? ` (${reviews.length})` : ""}
      </h3>

      {/* Форма */}
      <div className="card" style={{ padding: 16, marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13.5, fontWeight: 600 }}>
            {mine ? "Ваша оценка:" : "Оцените материал:"}
          </span>
          <span style={{ display: "inline-flex", gap: 2 }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <button
                key={i}
                type="button"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(0)}
                onClick={() => setRating(i)}
                style={{
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  padding: 2,
                  color: "var(--accent)",
                }}
                aria-label={`${i} из 5`}
              >
                <IconStar size={22} filled={i <= (hover || rating)} style={{ opacity: i <= (hover || rating) ? 1 : 0.3 }} />
              </button>
            ))}
          </span>
        </div>
        <textarea
          className="rl-input"
          style={{ marginTop: 10 }}
          rows={2}
          maxLength={2000}
          placeholder="Пара слов для коллег: что зашло классу, что поправили бы (необязательно)"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="rl-row" style={{ marginTop: 10, gap: 10 }}>
          <button type="button" className="btn btn-sm btn-blue" disabled={busy} onClick={submit}>
            {busy ? "Сохраняем…" : mine ? "Обновить отзыв" : "Оставить отзыв"}
          </button>
          {!canReview && (
            <span className="muted" style={{ fontSize: 12 }}>
              Отзывы с пометкой «покупал» — от учителей с доступом к материалу.
            </span>
          )}
          {notice && <span style={{ fontSize: 12.5, color: "var(--fg-2)" }}>{notice}</span>}
        </div>
      </div>

      {/* Список */}
      {reviews === null ? (
        <div className="rl-skeleton" style={{ height: 60 }} />
      ) : reviews.length === 0 ? (
        <p className="muted" style={{ fontSize: 13.5 }}>
          Отзывов пока нет — станьте первым.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {reviews.map((r) => (
            <div key={r.id} className="card" style={{ padding: 14 }}>
              <div className="rl-row-between" style={{ marginBottom: 4 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <b style={{ fontSize: 13.5 }}>{r.author}</b>
                  {r.verified && (
                    <span className="badge badge-success" style={{ fontSize: 10.5 }}>
                      покупал(а)
                    </span>
                  )}
                  {r.mine && (
                    <span className="badge" style={{ fontSize: 10.5 }}>
                      ваш отзыв
                    </span>
                  )}
                </span>
                <span style={{ display: "inline-flex", color: "var(--accent)" }}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <IconStar key={i} size={13} filled={i <= r.rating} style={{ opacity: i <= r.rating ? 1 : 0.25 }} />
                  ))}
                </span>
              </div>
              {r.text && (
                <p style={{ fontSize: 13.5, color: "var(--fg-2)", lineHeight: 1.5 }}>{r.text}</p>
              )}
              <div className="muted" style={{ fontSize: 11.5, marginTop: 4 }}>
                {new Date(r.createdAt).toLocaleDateString("ru-RU")}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

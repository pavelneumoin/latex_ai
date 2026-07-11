"use client";

// Лайк и закладка на странице материала — работают без покупки.

import { useRouter } from "next/navigation";
import { useState } from "react";
import { IconHeart, IconBookmark } from "@/app/_components/Icons";

export function ProductSocial({
  productId,
  initialLiked,
  initialLikes,
  initialBookmarked,
  loggedIn,
}: {
  productId: string;
  initialLiked: boolean;
  initialLikes: number;
  initialBookmarked: boolean;
  loggedIn: boolean;
}) {
  const router = useRouter();
  const [liked, setLiked] = useState(initialLiked);
  const [likes, setLikes] = useState(initialLikes);
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [busy, setBusy] = useState(false);

  async function toggle(kind: "like" | "bookmark") {
    if (!loggedIn) {
      router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/products/${productId}/${kind}`, { method: "POST" });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);
      if (kind === "like") {
        setLiked(data.liked);
        setLikes(data.likes);
      } else {
        setBookmarked(data.bookmarked);
      }
    } catch {
      // молча — не критично
    } finally {
      setBusy(false);
    }
  }

  const btn: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "8px 12px",
    borderRadius: 10,
    border: "1px solid var(--border-2)",
    background: "white",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
    fontFamily: "var(--body)",
    color: "var(--fg-2)",
    transition: "all .12s",
  };

  return (
    <div style={{ display: "flex", gap: 8 }}>
      <button
        type="button"
        onClick={() => toggle("like")}
        style={{
          ...btn,
          color: liked ? "#DC2626" : "var(--fg-2)",
          borderColor: liked ? "#FCA5A5" : "var(--border-2)",
          background: liked ? "#FEF2F2" : "white",
        }}
        aria-pressed={liked}
        title={liked ? "Убрать лайк" : "Нравится"}
      >
        <IconHeart size={15} filled={liked} />
        {likes > 0 ? likes : "Нравится"}
      </button>
      <button
        type="button"
        onClick={() => toggle("bookmark")}
        style={{
          ...btn,
          color: bookmarked ? "var(--primary)" : "var(--fg-2)",
          borderColor: bookmarked ? "var(--primary)" : "var(--border-2)",
          background: bookmarked ? "var(--primary-soft)" : "white",
        }}
        aria-pressed={bookmarked}
        title={bookmarked ? "Убрать из закладок" : "В закладки"}
      >
        <IconBookmark size={15} filled={bookmarked} />
        {bookmarked ? "В закладках" : "В закладки"}
      </button>
    </div>
  );
}

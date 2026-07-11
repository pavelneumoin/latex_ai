// Звёзды рейтинга (read-only) — сервер-безопасный компонент.

import { IconStar } from "./Icons";

export function Stars({
  rating,
  count,
  size = 14,
  showValue = true,
}: {
  rating: number;
  count?: number;
  size?: number;
  showValue?: boolean;
}) {
  if (!count && !rating) return null;
  const full = Math.round(rating);
  return (
    <span
      style={{ display: "inline-flex", alignItems: "center", gap: 3, whiteSpace: "nowrap" }}
      title={count ? `${rating.toFixed(1)} · ${count} оценок` : undefined}
    >
      <span style={{ display: "inline-flex", color: "var(--accent)" }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <IconStar
            key={i}
            size={size}
            filled={i <= full}
            style={{ opacity: i <= full ? 1 : 0.3 }}
          />
        ))}
      </span>
      {showValue && rating > 0 && (
        <span style={{ fontSize: size - 1, fontWeight: 700, color: "var(--fg-2)" }}>
          {rating.toFixed(1)}
        </span>
      )}
      {count != null && count > 0 && (
        <span style={{ fontSize: size - 2, color: "var(--fg-3)" }}>({count})</span>
      )}
    </span>
  );
}

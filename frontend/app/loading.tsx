export default function Loading() {
  return (
    <div
      className="hi"
      style={{
        minHeight: "100vh",
        background: "var(--surface)",
        display: "grid",
        placeItems: "center",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            width: 44,
            height: 44,
            margin: "0 auto 16px",
            border: "4px solid var(--border)",
            borderTopColor: "var(--primary)",
            borderRadius: "50%",
            animation: "rl-spin 0.8s linear infinite",
          }}
        />
        <div style={{ color: "var(--fg-3)", fontSize: 14 }}>Загрузка…</div>
      </div>
      <style>{`@keyframes rl-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

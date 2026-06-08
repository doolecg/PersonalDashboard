export function StatRow({ label, value, percent }: { label: string; value: string; percent?: number }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 13,
          color: "var(--ink-dim)",
          marginBottom: 6
        }}
      >
        <span>{label}</span>
        <span style={{ color: "var(--ink)" }}>{value}</span>
      </div>
      {typeof percent === "number" ? (
        <div style={{ height: 8, borderRadius: 8, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              width: `${Math.min(100, Math.max(0, percent))}%`,
              borderRadius: 8,
              background: "linear-gradient(180deg, var(--accent), #64d2ff)"
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

export function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function formatMem(mb: number): string {
  return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb} MB`;
}

import { ESTADO_DGII_COLORS, type EstadoDgii } from "../constants";

interface StatusBadgeProps {
  estado: EstadoDgii | string | undefined;
  style?: React.CSSProperties;
}

export function StatusBadge({ estado, style }: StatusBadgeProps) {
  if (!estado) return null;
  const color = ESTADO_DGII_COLORS[estado as EstadoDgii] ?? "var(--muted)";
  return (
    <span
      className="mono"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        color,
        ...style,
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: color,
          flexShrink: 0,
        }}
      />
      {estado}
    </span>
  );
}

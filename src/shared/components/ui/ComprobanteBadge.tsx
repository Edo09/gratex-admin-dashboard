import type { CSSProperties } from "react";

export type ComprobanteType = "ecf" | "ncf";

interface ComprobanteBadgeProps {
  type: ComprobanteType;
  /** Font size in px. Defaults to 10. */
  size?: number;
  style?: CSSProperties;
}

const STYLES: Record<ComprobanteType, { label: string; bg: string }> = {
  ecf: { label: "e-CF", bg: "var(--c-accent, #3b82f6)" },
  ncf: { label: "NCF", bg: "var(--c-magenta, #d6276b)" },
};

/** Small colored pill marking an invoice as electronic (e-CF) or traditional (NCF). */
export function ComprobanteBadge({ type, size = 10, style }: ComprobanteBadgeProps) {
  const { label, bg } = STYLES[type];
  return (
    <span
      className="mono"
      style={{
        display: "inline-flex",
        alignItems: "center",
        fontSize: size,
        fontWeight: 700,
        letterSpacing: "0.04em",
        lineHeight: 1.4,
        padding: "2px 7px",
        borderRadius: 4,
        background: bg,
        color: "#fff",
        ...style,
      }}
    >
      {label}
    </span>
  );
}

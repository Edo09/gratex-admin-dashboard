import type { AprobacionComercial } from "../types";

interface AprobacionBadgeProps {
  estado: AprobacionComercial;
  /** `0` (string o number) marca que la DGII no procesó el envío. */
  procesada?: string | number | null;
  style?: React.CSSProperties;
}

const META: Record<"PENDIENTE" | "ACEPTADO" | "RECHAZADO", { label: string; color: string }> = {
  PENDIENTE: { label: "Pendiente", color: "var(--c-amber, #f59e0b)" },
  ACEPTADO: { label: "Aceptado", color: "var(--c-green, #22c55e)" },
  RECHAZADO: { label: "Rechazado", color: "var(--bad, #ef4444)" },
};

export function AprobacionBadge({ estado, procesada, style }: AprobacionBadgeProps) {
  const key = estado === "ACEPTADO" || estado === "RECHAZADO" ? estado : "PENDIENTE";
  const { label, color } = META[key];
  // Decisión enviada pero DGII no la procesó (codigo 2/02 → procesada=0).
  const noProcesada = key !== "PENDIENTE" && procesada != null && Number(procesada) === 0;

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
      title={noProcesada ? "DGII no procesó el envío" : undefined}
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
      {label}
      {noProcesada && <span style={{ color: "var(--c-amber, #f59e0b)" }}>⚠</span>}
    </span>
  );
}

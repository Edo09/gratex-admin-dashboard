import { useState } from "react";
import { fmt } from "@/shared/utils/press-fmt";

export interface MonthlyPoint {
  m: string;
  f: number;
  c: number;
}

interface MonthlyChartProps {
  data: MonthlyPoint[];
}

const formatTick = (v: number): string => {
  if (v >= 1_000_000) {
    const m = v / 1_000_000;
    return "$" + (m >= 10 ? Math.round(m) : m.toFixed(1).replace(/\.0$/, "")) + "M";
  }
  if (v >= 1_000) return "$" + Math.round(v / 1_000) + "k";
  return "$" + Math.round(v);
};

/** CMYK paired-bars chart — magenta = facturas, cyan = cotizaciones. */
export function MonthlyChart({ data }: MonthlyChartProps) {
  const W = 720;
  const H = 240;
  const PAD_L = 70;
  const PAD_R = 16;
  const PAD_T = 14;
  const PAD_B = 32;

  const [hover, setHover] = useState<number | null>(null);

  const maxV = Math.max(1, ...data.map((d) => Math.max(d.f, d.c))) * 1.15;
  const innerW = W - PAD_L - PAD_R;
  const colW = innerW / Math.max(1, data.length);
  const x = (i: number) => PAD_L + colW * (i + 0.5);
  const y = (v: number) => PAD_T + (H - PAD_T - PAD_B) * (1 - v / maxV);
  const bw = colW * 0.34;
  const ticks = [0, maxV * 0.25, maxV * 0.5, maxV * 0.75, maxV];

  const hovered = hover !== null ? data[hover] : null;
  const hoverX = hover !== null ? x(hover) : 0;

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block" }}>
        {ticks.map((t, i) => (
          <g key={i}>
            <line
              className="grid-line"
              x1={PAD_L}
              y1={y(t)}
              x2={W - PAD_R}
              y2={y(t)}
              strokeDasharray={i === 0 ? "" : "2 3"}
            />
            <text className="axis-label" x={PAD_L - 8} y={y(t) + 3} textAnchor="end">
              {formatTick(t)}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          const hf = ((H - PAD_T - PAD_B) * d.f) / maxV;
          const hc = ((H - PAD_T - PAD_B) * d.c) / maxV;
          const cx = x(i);
          const isHover = hover === i;
          return (
            <g key={i}>
              {isHover && (
                <rect
                  x={cx - colW / 2}
                  y={PAD_T}
                  width={colW}
                  height={H - PAD_T - PAD_B}
                  fill="var(--accent)"
                  opacity={0.06}
                />
              )}
              <rect
                x={cx - bw - 1}
                y={H - PAD_B - hf}
                width={bw}
                height={hf}
                fill="var(--c-magenta)"
                opacity={hover === null || isHover ? 1 : 0.45}
              />
              <rect
                x={cx + 1}
                y={H - PAD_B - hc}
                width={bw}
                height={hc}
                fill="var(--c-cyan)"
                opacity={hover === null || isHover ? 1 : 0.45}
              />
              <rect
                x={cx - colW / 2}
                y={PAD_T}
                width={colW}
                height={H - PAD_T - PAD_B}
                fill="transparent"
                style={{ cursor: "pointer" }}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              />
              <text className="axis-label" x={cx} y={H - 12} textAnchor="middle">
                {d.m}
              </text>
            </g>
          );
        })}
      </svg>
      {hovered && (
        <div
          style={{
            position: "absolute",
            left: `${(hoverX / W) * 100}%`,
            top: 8,
            transform: "translateX(-50%)",
            background: "var(--bg)",
            border: "1px solid var(--line)",
            borderRadius: 6,
            padding: "8px 10px",
            fontSize: 11,
            boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
            pointerEvents: "none",
            whiteSpace: "nowrap",
            zIndex: 2,
          }}
        >
          <div
            className="mono"
            style={{
              fontSize: 10,
              letterSpacing: "0.12em",
              color: "var(--muted)",
              marginBottom: 4,
              textTransform: "uppercase",
            }}
          >
            {hovered.m}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
            <span
              style={{
                width: 8,
                height: 8,
                background: "var(--c-magenta)",
                display: "inline-block",
              }}
            />
            <span style={{ color: "var(--muted)" }}>Facturas</span>
            <span style={{ marginLeft: "auto", fontWeight: 600 }}>{fmt.money(hovered.f)}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                width: 8,
                height: 8,
                background: "var(--c-cyan)",
                display: "inline-block",
              }}
            />
            <span style={{ color: "var(--muted)" }}>Cotizaciones</span>
            <span style={{ marginLeft: "auto", fontWeight: 600 }}>{fmt.money(hovered.c)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

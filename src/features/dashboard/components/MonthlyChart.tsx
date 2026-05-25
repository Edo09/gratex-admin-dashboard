import { fmt } from "@/shared/utils/press-fmt";

export interface MonthlyPoint {
  m: string;
  f: number;
  c: number;
}

interface MonthlyChartProps {
  data: MonthlyPoint[];
}

/** CMYK paired-bars chart — magenta = facturas, cyan = cotizaciones. */
export function MonthlyChart({ data }: MonthlyChartProps) {
  const W = 720;
  const H = 240;
  const PAD_L = 46;
  const PAD_R = 16;
  const PAD_T = 14;
  const PAD_B = 32;

  const maxV = Math.max(1, ...data.map((d) => Math.max(d.f, d.c))) * 1.15;
  const x = (i: number) => PAD_L + (i * (W - PAD_L - PAD_R)) / Math.max(1, data.length - 1);
  const y = (v: number) => PAD_T + (H - PAD_T - PAD_B) * (1 - v / maxV);
  const bw = ((W - PAD_L - PAD_R) / Math.max(1, data.length)) * 0.34;
  const ticks = [0, maxV * 0.5, maxV];

  return (
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
          <text className="axis-label" x={PAD_L - 6} y={y(t) + 3} textAnchor="end">
            {fmt.moneyK(t)}
          </text>
        </g>
      ))}
      {data.map((d, i) => {
        const hf = ((H - PAD_T - PAD_B) * d.f) / maxV;
        const hc = ((H - PAD_T - PAD_B) * d.c) / maxV;
        const cx = x(i);
        return (
          <g key={i}>
            <rect x={cx - bw - 1} y={H - PAD_B - hf} width={bw} height={hf} fill="var(--c-magenta)" />
            <rect x={cx + 1} y={H - PAD_B - hc} width={bw} height={hc} fill="var(--c-cyan)" />
            <text className="axis-label" x={cx} y={H - 12} textAnchor="middle">
              {d.m}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

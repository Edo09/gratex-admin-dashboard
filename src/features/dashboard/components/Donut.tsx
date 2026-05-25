interface DonutProps {
  value: number;
  max: number;
}

/** Annual-goal donut — center label is "% of META". */
export function Donut({ value, max }: DonutProps) {
  const W = 180;
  const R = 70;
  const cx = W / 2;
  const cy = W / 2;
  const pct = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  const circ = 2 * Math.PI * R;

  return (
    <svg viewBox={`0 0 ${W} ${W}`} width="100%">
      <circle cx={cx} cy={cy} r={R} fill="none" stroke="var(--line-2)" strokeWidth="14" />
      <circle
        cx={cx}
        cy={cy}
        r={R}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="14"
        strokeDasharray={`${circ * pct} ${circ}`}
        transform={`rotate(-90 ${cx} ${cy})`}
        strokeLinecap="butt"
      />
      <text x={cx} y={cy - 4} textAnchor="middle" fontFamily="Geist Mono" fontSize="28" fontWeight="600">
        {Math.round(pct * 100)}%
      </text>
      <text
        x={cx}
        y={cy + 16}
        textAnchor="middle"
        fontFamily="Geist Mono"
        fontSize="10"
        fill="var(--muted)"
        letterSpacing="0.16em"
      >
        META {new Date().getFullYear()}
      </text>
    </svg>
  );
}

interface PageMarksProps {
  label: string;
}

/** CMYK swatch row placed above every page title. */
export function PageMarks({ label }: PageMarksProps) {
  return (
    <div className="page-marks">
      <span className="swatch" style={{ background: "var(--c-cyan)" }} />
      <span className="swatch" style={{ background: "var(--c-magenta)" }} />
      <span className="swatch" style={{ background: "var(--c-yellow)" }} />
      <span className="swatch" style={{ background: "var(--c-key)" }} />
      <span style={{ marginLeft: 6 }}>{label}</span>
    </div>
  );
}

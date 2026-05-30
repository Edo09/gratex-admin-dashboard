import { ECF_TYPES, type TipoEcf } from "../constants";
import { useFacturasStatsQuery } from "../hooks/useFacturasQuery";

const ECF_TYPE_ENTRIES = Object.entries(ECF_TYPES) as [TipoEcf, (typeof ECF_TYPES)[TipoEcf]][];

interface EcfTypeSelectorProps {
  value: TipoEcf;
  onChange: (tipo: TipoEcf) => void;
}

export function EcfTypeSelector({ value, onChange }: EcfTypeSelectorProps) {
  const { data: stats } = useFacturasStatsQuery();
  const nextEncfFor = (code: TipoEcf): string | null => {
    const typeKey = `E${code}`;
    const seq = stats?.secuencias?.find((s) => s.type === typeKey);
    if (!seq) return null;
    const next = seq.secuencia_actual + 1;
    return `${seq.type}${String(next).padStart(10, "0")}`;
  };

  return (
    <div className="field">
      <label>Tipo de comprobante (e-CF)</label>
      <div className="ecf-type-grid">
        {ECF_TYPE_ENTRIES.map(([code, info]) => {
          const active = value === code;
          const nextEncf = nextEncfFor(code);
          return (
            <button
              key={code}
              type="button"
              onClick={() => onChange(code)}
              className={active ? "ecf-type-btn active" : "ecf-type-btn"}
              style={{
                textAlign: "left",
                background: active ? "var(--c-accent-bg, #eef4ff)" : "#fff",
                border: `1.5px solid ${active ? "var(--c-accent, #3b82f6)" : "var(--line)"}`,
                borderRadius: 6,
                padding: "7px 9px",
                cursor: "pointer",
                font: "inherit",
                transition: "border-color 0.15s, background 0.15s",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span
                  className="mono"
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    background: active ? "var(--c-accent, #3b82f6)" : "var(--ink)",
                    color: active ? "#fff" : "var(--paper)",
                    padding: "3px 7px",
                    borderRadius: 4,
                    letterSpacing: "0.06em",
                    boxShadow: active
                      ? "0 1px 2px rgba(59,130,246,0.3)"
                      : "0 1px 2px rgba(0,0,0,0.15)",
                  }}
                >
                  E{code}
                </span>
                <span style={{ fontWeight: 600, fontSize: 12 }}>{info.short}</span>
              </div>
              <div
                className="mono"
                style={{
                  fontSize: 9,
                  color: "var(--muted)",
                  marginTop: 2,
                  lineHeight: 1.3,
                }}
              >
                {info.description}
              </div>
              {nextEncf && (
                <div
                  className="mono"
                  style={{
                    color: active ? "var(--c-accent, #3b82f6)" : "var(--ink)",
                    marginTop: 5,
                    paddingTop: 5,
                    borderTop: "1px dashed var(--line-2)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <span
                    style={{
                      fontSize: 9,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: "var(--muted)",
                    }}
                  >
                    Próx
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.02em" }}>
                    {nextEncf}
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

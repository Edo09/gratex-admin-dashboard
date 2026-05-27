import { ECF_TYPES, type TipoEcf } from "../constants";

const ECF_TYPE_ENTRIES = Object.entries(ECF_TYPES) as [TipoEcf, (typeof ECF_TYPES)[TipoEcf]][];

interface EcfTypeSelectorProps {
  value: TipoEcf;
  onChange: (tipo: TipoEcf) => void;
}

export function EcfTypeSelector({ value, onChange }: EcfTypeSelectorProps) {
  return (
    <div className="field">
      <label>Tipo de comprobante (e-CF)</label>
      <div className="ecf-type-grid">
        {ECF_TYPE_ENTRIES.map(([code, info]) => {
          const active = value === code;
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
                borderRadius: 8,
                padding: "10px 14px",
                cursor: "pointer",
                font: "inherit",
                transition: "border-color 0.15s, background 0.15s",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  className="mono"
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    background: active ? "var(--c-accent, #3b82f6)" : "var(--bg)",
                    color: active ? "#fff" : "var(--muted)",
                    padding: "2px 6px",
                    borderRadius: 4,
                    letterSpacing: "0.05em",
                  }}
                >
                  E{code}
                </span>
                <span style={{ fontWeight: 600, fontSize: 13 }}>{info.short}</span>
              </div>
              <div className="mono" style={{ fontSize: 10, color: "var(--muted)", marginTop: 3 }}>
                {info.description}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

import { PageMeta } from "@/shared/components/layout/PageMeta";
import { PageMarks } from "@/shared/components/press/PageMarks";
import { Pill } from "@/shared/components/press/Pill";
import { Icons } from "@/shared/components/press/PressIcons";
import { fmt } from "@/shared/utils/press-fmt";
import { formatDisplayDate } from "@/shared/utils/format";
import { useNcfSequenceQuery } from "../hooks/useNcf";
import { useFacturasQuery } from "@/features/facturas/hooks/useFacturasQuery";
import { parseFacturaAmount } from "@/features/dashboard/hooks/useDashboardData";

const STRIPES = ["var(--c-cyan)", "var(--c-magenta)", "var(--c-yellow)", "var(--c-key)"];

interface NcfCardData {
  type: string;
  name: string;
  from: string;
  to: string;
  used: number;
  total: number;
  expires: string;
}

// MOCK: the backend exposes a single sequence today. The remaining types are
// stubbed so the visual matches the design until /ncf returns the full set.
const MOCK_EXTRA_SEQUENCES: NcfCardData[] = [
  {
    type: "B02",
    name: "Consumidor Final",
    from: "B0200000001",
    to: "B0200000200",
    used: 44,
    total: 200,
    expires: "31/12/2026",
  },
  {
    type: "B14",
    name: "Régimen Especial",
    from: "B1400000001",
    to: "B1400000050",
    used: 8,
    total: 50,
    expires: "31/12/2026",
  },
  {
    type: "B15",
    name: "Gubernamental",
    from: "B1500000001",
    to: "B1500000100",
    used: 22,
    total: 100,
    expires: "31/12/2026",
  },
];

const NAME_BY_TYPE: Record<string, string> = {
  B01: "Crédito Fiscal",
  B02: "Consumidor Final",
  B14: "Régimen Especial",
  B15: "Gubernamental",
};

export default function Ncf() {
  const { data: sequence } = useNcfSequenceQuery();
  const { data: facturasData } = useFacturasQuery({ pageSize: 5 });
  const recentFacturas = facturasData?.items ?? [];

  const cards: NcfCardData[] = [];
  if (sequence) {
    // MOCK: from/to/total/expires aren't returned by /ncf/sequence today;
    // synthesize a reasonable window so the bar/meta row renders.
    const total = 500;
    cards.push({
      type: sequence.type,
      name: sequence.description ?? NAME_BY_TYPE[sequence.type] ?? sequence.type,
      from: `${sequence.type}${"0".repeat(8)}`,
      to: `${sequence.type}${String(total).padStart(8, "0")}`,
      used: sequence.current_value,
      total,
      expires: `31/12/${new Date().getFullYear()}`,
    });
  }
  cards.push(...MOCK_EXTRA_SEQUENCES);

  return (
    <div className="content">
      <PageMeta title="NCF · Gratex" description="Secuencias NCF DGII" />
      <PageMarks label="NCF / 05" />
      <div className="page-head">
        <div>
          <h1 className="page-title">Números de comprobante fiscal</h1>
          <div className="page-sub">Secuencias activas · DGII</div>
        </div>
        <button className="btn btn-accent">
          <Icons.plus size={13} /> Nueva secuencia
        </button>
      </div>

      <div className="ncf-grid">
        {cards.map((n, i) => {
          const pct = n.total > 0 ? (n.used / n.total) * 100 : 0;
          const color = pct > 85 ? "var(--bad)" : pct > 60 ? "var(--warn)" : STRIPES[i % STRIPES.length];
          return (
            <div key={n.type} className="ncf-card">
              <div className="strip" style={{ background: STRIPES[i % STRIPES.length] }} />
              <div
                style={{
                  paddingLeft: 8,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div>
                  <div className="ncf-type">{n.type}</div>
                  <div className="ncf-name">{n.name}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="ncf-big">
                    {n.used}
                    <small> / {n.total}</small>
                  </div>
                </div>
              </div>
              <div style={{ paddingLeft: 8 }}>
                <div className="ncf-bar">
                  <div className="ncf-bar-fill" style={{ width: pct + "%", background: color }} />
                </div>
                <div className="ncf-meta">
                  <span>
                    {n.from} → {n.to}
                  </span>
                  <span>VENCE {n.expires}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="panel" style={{ marginTop: 20 }}>
        <div className="panel-head">
          <div>
            <h2 className="panel-title">Últimos comprobantes emitidos</h2>
            <div className="panel-sub">Últimas {recentFacturas.length} emisiones</div>
          </div>
        </div>
        <table className="ds-table">
          <thead>
            <tr>
              <th>NCF</th>
              <th>Tipo</th>
              <th>Cliente</th>
              <th>Fecha</th>
              <th style={{ textAlign: "right" }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {recentFacturas.map((f) => (
              <tr key={f.id}>
                <td className="mono" style={{ fontSize: 11 }}>
                  {f.no_factura ?? f.NCF ?? `#${f.id}`}
                </td>
                <td>
                  {/* MOCK: tipo NCF — assume Enviada until /facturas exposes status. */}
                  <Pill status="Enviada" />
                </td>
                <td style={{ fontWeight: 600 }}>{f.client_name ?? f.client ?? "—"}</td>
                <td className="mono" style={{ fontSize: 11 }}>
                  {formatDisplayDate(f.date)}
                </td>
                <td className="mono" style={{ textAlign: "right", fontWeight: 600, fontSize: 13 }}>
                  {fmt.money(parseFacturaAmount(f))}
                </td>
              </tr>
            ))}
            {recentFacturas.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", color: "var(--muted)", padding: 24 }}>
                  Sin emisiones recientes
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

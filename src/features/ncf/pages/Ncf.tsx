import { PageMeta } from "@/shared/components/layout/PageMeta";
import { PageMarks } from "@/shared/components/press/PageMarks";
import { fmt } from "@/shared/utils/press-fmt";
import { formatDisplayDate } from "@/shared/utils/format";
import { useNcfSequenceQuery } from "../hooks/useNcf";
import { useFacturasQuery } from "@/features/facturas/hooks/useFacturasQuery";
import { parseFacturaAmount } from "@/features/dashboard/hooks/useDashboardData";

const NAME_BY_TYPE: Record<string, string> = {
  B01: "Crédito Fiscal",
  B02: "Consumidor Final",
  B14: "Régimen Especial",
  B15: "Gubernamental",
};

export default function Ncf() {
  const { data: sequence, isLoading } = useNcfSequenceQuery();
  const { data: facturasData } = useFacturasQuery({ pageSize: 5 });
  const recentFacturas = facturasData?.items ?? [];

  return (
    <div className="content">
      <PageMeta title="NCF · Gratex" description="Secuencias NCF DGII" />
      <PageMarks label="NCF / 05" />
      <div className="page-head">
        <div>
          <h1 className="page-title">Números de comprobante fiscal</h1>
          <div className="page-sub">Secuencias activas · DGII</div>
        </div>

      </div>

      <div className="ncf-grid">
        {isLoading && (
          <div className="page-sub" style={{ padding: "12px 0" }}>
            Cargando…
          </div>
        )}
        {!isLoading && sequence && (
          <div className="ncf-card">
            <div className="strip" style={{ background: "var(--c-cyan)" }} />
            <div
              style={{
                paddingLeft: 8,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div>
                <div className="ncf-type">{sequence.type}</div>
                <div className="ncf-name">
                  {sequence.description ?? NAME_BY_TYPE[sequence.type] ?? sequence.type}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="ncf-big">{sequence.current_value}</div>
              </div>
            </div>
            <div style={{ paddingLeft: 8 }}>
              <div className="ncf-meta">
                <span>Próximo: {sequence.type}{String(sequence.current_value + 1).padStart(8, "0")}</span>
              </div>
            </div>
          </div>
        )}
        {!isLoading && !sequence && (
          <div className="ncf-card">
            <div style={{ padding: 8, color: "var(--muted)", fontSize: 13 }}>
              Sin secuencias configuradas
            </div>
          </div>
        )}
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
                <td colSpan={4} style={{ textAlign: "center", color: "var(--muted)", padding: 24 }}>
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

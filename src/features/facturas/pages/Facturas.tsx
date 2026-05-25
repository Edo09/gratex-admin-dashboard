import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageMeta } from "@/shared/components/layout/PageMeta";
import { PageMarks } from "@/shared/components/press/PageMarks";
import { Pill } from "@/shared/components/press/Pill";
import { Icons } from "@/shared/components/press/PressIcons";
import { fmt } from "@/shared/utils/press-fmt";
import { formatDisplayDate } from "@/shared/utils/format";
import { parseFacturaAmount } from "@/features/dashboard/hooks/useDashboardData";
import { mockFacturaCotzCode, mockFacturaKpis, mockFacturaStatus } from "@/shared/lib/press-mocks";
import { useFacturasQuery } from "../hooks/useFacturasQuery";
import { CreateFacturaModal } from "../components/CreateFacturaModal";
import type { Factura } from "../types";

export default function Facturas() {
  const navigate = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);
  const [toast, setToast] = useState("");
  const { data } = useFacturasQuery({ page: 1, pageSize: 50 });
  const list = data?.items ?? [];
  const total = data?.pagination?.total ?? list.length;

  // MOCK: pagadas/pendientes/vencidas breakdown — backend has no status field.
  const kpis = mockFacturaKpis(total);

  const open = (f: Factura) => navigate(`/facturas/${f.id}`);

  return (
    <div className="content">
      <PageMeta title="Facturas · Gratex" description="Listado de facturas" />
      <PageMarks label="FACTURAS / 03" />
      <div className="page-head">
        <div>
          <h1 className="page-title">Facturas</h1>
          <div className="page-sub">
            {total} emisiones · año {new Date().getFullYear()}
          </div>
        </div>
        <button className="btn btn-accent" onClick={() => setCreateOpen(true)}>
          <Icons.plus size={13} /> Nueva factura
        </button>
      </div>

      <div className="kpi-row kpi-row-sm">
        <div className="kpi">
          <div className="kpi-tag">
            <span className="swatch" style={{ background: "var(--c-cyan)" }} /> Emitidas
          </div>
          <div className="kpi-value">{fmt.num(total)}</div>
        </div>
        <div className="kpi">
          <div className="kpi-tag">
            <span className="swatch" style={{ background: "var(--c-magenta)" }} /> Pagadas
          </div>
          <div className="kpi-value">{fmt.num(kpis.pagadas)}</div>
          <div className="kpi-delta up">
            {total > 0 ? Math.round((kpis.pagadas / total) * 100) : 0}%
          </div>
        </div>
        <div className="kpi">
          <div className="kpi-tag">
            <span className="swatch" style={{ background: "var(--c-yellow)" }} /> Pendientes
          </div>
          <div className="kpi-value">{fmt.num(kpis.pendientes)}</div>
        </div>
        <div className="kpi">
          <div className="kpi-tag">
            <span className="swatch" style={{ background: "var(--c-key)" }} /> Vencidas
          </div>
          <div className="kpi-value">{fmt.num(kpis.vencidas)}</div>
          <div className="kpi-delta down">{fmt.moneyK(kpis.vencidoMontoK)}</div>
        </div>
      </div>

      <div className="panel" style={{ padding: 0 }}>
        <table className="ds-table">
          <thead>
            <tr>
              <th style={{ paddingLeft: 20 }}>NCF</th>
              <th>Cliente</th>
              <th>Origen Cotz</th>
              <th>Fecha</th>
              <th>Estado</th>
              <th style={{ textAlign: "right", paddingRight: 20 }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {list.map((f) => (
              <tr key={f.id} onClick={() => open(f)}>
                <td style={{ paddingLeft: 20 }}>
                  <span className="mono" style={{ fontSize: 11 }}>
                    {f.no_factura ?? f.NCF ?? `#${f.id}`}
                  </span>
                </td>
                <td style={{ fontWeight: 600 }}>{f.client_name ?? f.client ?? "—"}</td>
                <td>
                  {/* MOCK: backend doesn't expose origin cotización. */}
                  <span className="quote-code" style={{ background: "var(--bg)", color: "var(--ink)" }}>
                    {mockFacturaCotzCode(f.id)}
                  </span>
                </td>
                <td className="mono" style={{ fontSize: 11 }}>
                  {formatDisplayDate(f.date)}
                </td>
                <td>
                  <Pill status={mockFacturaStatus(f.id)} />
                </td>
                <td
                  className="mono"
                  style={{ textAlign: "right", paddingRight: 20, fontWeight: 600, fontSize: 14 }}
                >
                  {fmt.money(parseFacturaAmount(f))}
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", color: "var(--muted)", padding: 32 }}>
                  Sin facturas
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <CreateFacturaModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(msg) => {
          setToast(msg);
          window.setTimeout(() => setToast(""), 2500);
        }}
      />

      {toast && (
        <div className="toast">
          <span className="swatch" style={{ background: "var(--c-magenta)" }} />
          {toast}
        </div>
      )}
    </div>
  );
}

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageMeta } from "@/shared/components/layout/PageMeta";
import { PageMarks } from "@/shared/components/press/PageMarks";
import { Icons } from "@/shared/components/press/PressIcons";
import { fmt } from "@/shared/utils/press-fmt";
import { formatDisplayDate } from "@/shared/utils/format";
import {
  parseFacturaAmount,
  getFacturaNcf,
  getFacturaClientName,
  getFacturaDescription,
} from "@/features/facturas/utils";
import { StatusBadge } from "@/features/facturas/components/StatusBadge";
import { ComprobanteBadge } from "@/shared/components/ui/ComprobanteBadge";
import { MonthlyChart } from "../components/MonthlyChart";
import { DashboardDateLine } from "../components/DashboardHeader";
import {
  useDashboardKpis,
  useMonthlyProduction,
  useFacturaYears,
  useRecentCotizacionesQuery,
  useRecentFacturasMerged,
  parseCotizacionAmount,
} from "../hooks/useDashboardData";

export default function Home() {
  const navigate = useNavigate();
  const years = useFacturaYears();
  const [year, setYear] = useState(() => new Date().getFullYear());
  const kpis = useDashboardKpis(year);
  const monthly = useMonthlyProduction(year);
  const { data: recentCotizaciones = [] } = useRecentCotizacionesQuery(5);
  // e-CF + NCF merged, newest first, rejected e-CF already excluded.
  const recentFacturas = useRecentFacturasMerged(5);

  return (
    <div className="content">
      <PageMeta title="Gratex Dashboard" description="Gratex Admin Dashboard" />
      <PageMarks label="DASHBOARD / OVERVIEW" />
      <div className="page-head">
        <div>
          <h1 className="page-title">Vista general del taller</h1>
          <DashboardDateLine />
        </div>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          style={{
            border: "1px solid var(--line)",
            borderRadius: 6,
            padding: "6px 12px",
            fontSize: 13,
            fontFamily: "Geist Mono, monospace",
            fontWeight: 600,
            background: "var(--surface)",
            color: "var(--ink)",
            cursor: "pointer",
          }}
        >
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      <div className="kpi-row">
        <ClientesTile total={kpis.clientesTotal} />
        <CotzFactTile
          cotizaciones={kpis.cotizacionesTotal}
          facturas={kpis.facturasTotal}
          conversion={kpis.conversion}
        />
        <VentasMesTile total={kpis.ventasMes} mom={kpis.ventasMomDelta} />
        <VentasAnoTile total={kpis.ventasTotal} year={year} />
      </div>

      <div className="panel" style={{ marginBottom: 14 }}>
        <div className="panel-head">
          <div>
            <h2 className="panel-title">Producción mensual</h2>
            <div className="panel-sub">
              Facturas (M) · Cotizaciones (C) · {year}
            </div>
          </div>
          <div className="chip-row">
            <div
              className="chip"
              style={{ background: "var(--c-magenta)", color: "#fff", borderColor: "var(--c-magenta)" }}
            >
              FACT
            </div>
            <div
              className="chip"
              style={{ background: "var(--c-cyan)", color: "#fff", borderColor: "var(--c-cyan)" }}
            >
              COTZ
            </div>
          </div>
        </div>
        <MonthlyChart data={monthly} />
      </div>

      <div className="panel" style={{ marginBottom: 14 }}>
        <div className="panel-head">
          <div>
            <h2 className="panel-title">Facturas recientes</h2>
            <div className="panel-sub">Últimas 5 entradas</div>
          </div>
          <button className="btn-ghost" onClick={() => navigate("/facturas")}>
            Ver todas <Icons.chevronRight size={13} />
          </button>
        </div>
        <table className="ds-table">
          <thead>
            <tr>
              <th>NCF</th>
              <th>Cliente</th>
              <th>Estado</th>
              <th style={{ textAlign: "right" }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {recentFacturas.map((f) => (
              <tr
                key={`${f.source}-${f.id}`}
                onClick={() =>
                  navigate(f.source === "ncf" ? `/facturas-ncf/${f.id}` : `/facturas/${f.id}`)
                }
              >
                <td>
                  <span className="quote-code">{getFacturaNcf(f)}</span>
                  <div className="mono" style={{ fontSize: 10, color: "var(--muted)", marginTop: 4 }}>
                    {formatDisplayDate(f.date)}
                  </div>
                </td>
                <td>
                  <div style={{ fontWeight: 600 }}>{getFacturaClientName(f)}</div>
                  <div
                    className="mono"
                    style={{ fontSize: 11, color: "var(--muted)", maxWidth: 280 }}
                  >
                    {getFacturaDescription(f)}
                  </div>
                </td>
                <td>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <ComprobanteBadge type={f.source} />
                    {f.source === "ecf" && f.estado_dgii && <StatusBadge estado={f.estado_dgii} />}
                  </div>
                </td>
                <td className="mono" style={{ textAlign: "right", fontWeight: 600, fontSize: 14 }}>
                  {fmt.money(parseFacturaAmount(f))}
                </td>
              </tr>
            ))}
            {recentFacturas.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: "center", color: "var(--muted)", padding: 24 }}>
                  Sin facturas recientes
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="panel">
        <div className="panel-head">
          <div>
            <h2 className="panel-title">Cotizaciones recientes</h2>
            <div className="panel-sub">Últimas 5 entradas</div>
          </div>
          <button className="btn-ghost" onClick={() => navigate("/cotizaciones")}>
            Ver todas <Icons.chevronRight size={13} />
          </button>
        </div>
        <table className="ds-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Cliente</th>
              <th>Descripción</th>
              <th style={{ textAlign: "right" }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {recentCotizaciones.map((c) => (
              <tr key={c.id} onClick={() => navigate(`/cotizaciones/${c.id}`)}>
                <td>
                  <span className="quote-code">{c.code ?? `#${c.id}`}</span>
                  <div className="mono" style={{ fontSize: 10, color: "var(--muted)", marginTop: 4 }}>
                    {formatDisplayDate(c.date)}
                  </div>
                </td>
                <td>
                  <div style={{ fontWeight: 600 }}>{c.client_name ?? "—"}</div>
                  <div className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
                    {c.company_name ?? ""}
                  </div>
                </td>
                <td style={{ color: "var(--ink-2)", maxWidth: 300 }}>
                  {(c.description ?? "—").split(/\n/).slice(0, 2).join(" · ")}
                </td>
                <td className="mono" style={{ textAlign: "right", fontWeight: 600, fontSize: 14 }}>
                  {fmt.money(parseCotizacionAmount(c))}
                </td>
              </tr>
            ))}
            {recentCotizaciones.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: "center", color: "var(--muted)", padding: 24 }}>
                  Sin cotizaciones recientes
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ClientesTile({ total }: { total: number | undefined }) {
  return (
    <div className="kpi">
      <div className="kpi-tag">
        <span className="swatch" style={{ background: "var(--c-cyan)" }} /> Clientes
      </div>
      <div className="kpi-value">{total != null ? fmt.num(total) : "—"}</div>
      <div className="kpi-delta">Total registrado</div>
    </div>
  );
}

function CotzFactTile({
  cotizaciones,
  facturas,
  conversion,
}: {
  cotizaciones: number | undefined;
  facturas: number;
  conversion: number | null;
}) {
  return (
    <div className="kpi">
      <div className="kpi-tag">
        <span className="swatch" style={{ background: "var(--c-magenta)" }} /> Cotz / Fact
      </div>
      <div className="kpi-value">
        {cotizaciones != null ? cotizaciones : "—"}
        <span style={{ color: "var(--muted)" }}> · {facturas}</span>
      </div>
      <div className="kpi-delta">
        {conversion != null ? `${Math.round(conversion * 100)}% conversión` : "—"}
      </div>
    </div>
  );
}

function VentasMesTile({ total, mom }: { total: number; mom: number | null }) {
  const momLabel =
    mom == null ? "Sin comparación" : `${mom >= 0 ? "+" : ""}${(mom * 100).toFixed(1)}% MoM`;
  const isUp = mom != null && mom >= 0;
  const isDown = mom != null && mom < 0;
  return (
    <div className="kpi">
      <div className="kpi-tag">
        <span className="swatch" style={{ background: "var(--c-yellow)" }} /> Ventas mes
      </div>
      <div className="kpi-value">{fmt.moneyFull(total)}</div>
      <div className={"kpi-delta" + (isUp ? " up" : isDown ? " down" : "")}>
        {isUp && <Icons.arrowUp size={11} />}
        {isDown && <Icons.arrowDown size={11} />}
        {momLabel}
      </div>
    </div>
  );
}

function VentasAnoTile({ total, year }: { total: number; year: number }) {
  return (
    <div className="kpi">
      <div className="kpi-tag">
        <span className="swatch" style={{ background: "var(--c-key)" }} /> Ventas año
      </div>
      <div className="kpi-value">{fmt.moneyFull(total)}</div>
      <div className="kpi-delta">Acumulado {year}</div>
    </div>
  );
}

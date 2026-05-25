import { useNavigate } from "react-router-dom";
import { PageMeta } from "@/shared/components/layout/PageMeta";
import { PageMarks } from "@/shared/components/press/PageMarks";
import { Pill, type PressStatus } from "@/shared/components/press/Pill";
import { Icons } from "@/shared/components/press/PressIcons";
import { fmt } from "@/shared/utils/press-fmt";
import { formatDisplayDate } from "@/shared/utils/format";
import { MonthlyChart } from "../components/MonthlyChart";
import { Donut } from "../components/Donut";
import { DashboardDateLine } from "../components/DashboardHeader";
import {
  useDashboardKpis,
  useMonthlyProduction,
  useRecentCotizacionesQuery,
  parseCotizacionAmount,
} from "../hooks/useDashboardData";
import type { Cotizacion } from "@/features/cotizaciones/types";

/** Hardcoded annual sales target — surface as config if/when the backend exposes one. */
const ANNUAL_GOAL = 70_000_000;

/** Cotizacion status isn't in the backend yet; default everything to "Pendiente". */
// TODO: replace with cotizacion.status once the backend exposes it.
const statusFor = (_c: Cotizacion): PressStatus => "Pendiente";

export default function Home() {
  const navigate = useNavigate();
  const kpis = useDashboardKpis();
  const monthly = useMonthlyProduction();
  const { data: recentCotizaciones = [] } = useRecentCotizacionesQuery(5);

  return (
    <div className="content">
      <PageMeta title="Gratex Dashboard" description="Gratex Admin Dashboard" />
      <PageMarks label="DASHBOARD / OVERVIEW" />
      <div className="page-head">
        <div>
          <h1 className="page-title">Vista general del taller</h1>
          <DashboardDateLine />
        </div>
        <div className="seg">
          <button className="active">Mes</button>
          <button>Trimestre</button>
          <button>Año</button>
        </div>
      </div>

      <div className="kpi-row">
        <ClientesTile total={kpis.clientesTotal} />
        <CotzFactTile
          cotizaciones={kpis.cotizacionesTotal}
          facturas={kpis.facturasTotal}
          conversion={kpis.conversion}
        />
        <VentasMesTile total={kpis.ventasMes} mom={kpis.ventasMomDelta} />
        <VentasAnoTile total={kpis.ventasTotal} goal={ANNUAL_GOAL} />
      </div>

      <div className="grid-2">
        <div className="panel">
          <div className="panel-head">
            <div>
              <h2 className="panel-title">Producción mensual</h2>
              <div className="panel-sub">
                Facturas (M) · Cotizaciones (C) · {new Date().getFullYear()}
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
        <div className="panel">
          <div className="panel-head">
            <div>
              <h2 className="panel-title">Meta anual</h2>
              <div className="panel-sub">Año fiscal {new Date().getFullYear()}</div>
            </div>
          </div>
          <Donut value={kpis.ventasTotal} max={ANNUAL_GOAL} />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontFamily: "Geist Mono",
              fontSize: 11,
              color: "var(--muted)",
              marginTop: 12,
              paddingTop: 12,
              borderTop: "1px dashed var(--line)",
            }}
          >
            <div>
              ACTUAL
              <br />
              <span style={{ color: "var(--ink)", fontSize: 14, fontWeight: 600 }}>
                {fmt.moneyK(kpis.ventasTotal)}
              </span>
            </div>
            <div style={{ textAlign: "right" }}>
              META
              <br />
              <span style={{ color: "var(--ink)", fontSize: 14, fontWeight: 600 }}>
                {fmt.moneyK(ANNUAL_GOAL)}
              </span>
            </div>
          </div>
        </div>
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
              <th>Estado</th>
              <th style={{ textAlign: "right" }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {recentCotizaciones.map((c) => (
              <tr key={c.id} onClick={() => navigate("/cotizaciones")}>
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
                <td>
                  <Pill status={statusFor(c)} />
                </td>
                <td className="mono" style={{ textAlign: "right", fontWeight: 600, fontSize: 14 }}>
                  {fmt.money(parseCotizacionAmount(c))}
                </td>
              </tr>
            ))}
            {recentCotizaciones.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", color: "var(--muted)", padding: 24 }}>
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
      <div className="kpi-value">{fmt.moneyK(total)}</div>
      <div className={"kpi-delta" + (isUp ? " up" : isDown ? " down" : "")}>
        {isUp && <Icons.arrowUp size={11} />}
        {isDown && <Icons.arrowDown size={11} />}
        {momLabel}
      </div>
    </div>
  );
}

function VentasAnoTile({ total, goal }: { total: number; goal: number }) {
  const pct = goal > 0 ? Math.round((total / goal) * 100) : 0;
  return (
    <div className="kpi">
      <div className="kpi-tag">
        <span className="swatch" style={{ background: "var(--c-key)" }} /> Ventas año
      </div>
      <div className="kpi-value">{fmt.moneyK(total)}</div>
      <div className="kpi-delta">Meta {pct}%</div>
    </div>
  );
}

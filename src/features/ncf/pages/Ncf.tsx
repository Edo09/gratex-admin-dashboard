import { PageMeta } from "@/shared/components/layout/PageMeta";
import { PageMarks } from "@/shared/components/press/PageMarks";
import { fmt } from "@/shared/utils/press-fmt";
import { formatDisplayDate } from "@/shared/utils/format";
import {
  useFacturasQuery,
  useFacturasStatsQuery,
} from "@/features/facturas/hooks/useFacturasQuery";
import {
  parseFacturaAmount,
  getFacturaNcf,
  getFacturaClientName,
} from "@/features/facturas/utils";
import { StatusBadge } from "@/features/facturas/components/StatusBadge";
import { ECF_TYPES, type TipoEcf } from "@/features/facturas/constants";
import type { StatsSecuencia, StatsByTipo } from "@/features/facturas/api/facturas";

export default function Ncf() {
  const { data: stats, isLoading: statsLoading } = useFacturasStatsQuery();
  const { data: facturasData } = useFacturasQuery({ pageSize: 5 });
  const recentFacturas = facturasData?.items ?? [];

  const resumen = stats?.resumen;
  const secuencias = stats?.secuencias ?? [];
  const porTipo = stats?.por_tipo ?? [];
  const porEstado = stats?.por_estado ?? [];
  const porMes = stats?.por_mes ?? [];

  return (
    <div className="content">
      <PageMeta title="Comprobantes · Gratex" description="Estadísticas y secuencias de e-CF" />
      <PageMarks label="COMPROBANTES / 05" />
      <div className="page-head">
        <div>
          <h1 className="page-title">Comprobantes</h1>
          <div className="page-sub">
            e-CF emitidos · secuencias activas · estado DGII
          </div>
        </div>
      </div>

      {statsLoading && (
        <div className="page-sub" style={{ padding: "12px 0" }}>
          Cargando estadísticas…
        </div>
      )}

      {!statsLoading && resumen && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 12,
            marginBottom: 20,
          }}
        >
          <KpiCard label="Total e-CF" value={fmt.num(resumen.total_ecf)} accent="var(--c-cyan)" />
          <KpiCard
            label="Monto total"
            value={fmt.money(resumen.monto_total)}
            accent="var(--c-green, #22c55e)"
          />
          <KpiCard
            label="Tipos distintos"
            value={String(resumen.tipos_distintos)}
            accent="var(--c-amber, #f59e0b)"
          />
          <KpiCard
            label="Último emitido"
            value={resumen.ultimo_ecf ? formatDisplayDate(resumen.ultimo_ecf) : "—"}
            accent="var(--ink)"
            mono
          />
        </div>
      )}

      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-head">
          <div>
            <h2 className="panel-title">Secuencias NCF</h2>
            <div className="panel-sub">Próximo número de cada tipo de e-CF</div>
          </div>
        </div>
        <div style={{ padding: 16 }}>
          {statsLoading && (
            <div style={{ color: "var(--muted)", fontSize: 13 }}>Cargando…</div>
          )}
          {!statsLoading && secuencias.length === 0 && (
            <div style={{ color: "var(--muted)", fontSize: 13 }}>
              Sin secuencias configuradas
            </div>
          )}
          {!statsLoading && secuencias.length > 0 && (
            <div className="ncf-grid">
              {secuencias.map((s) => (
                <SequenceCard key={s.type} seq={s} />
              ))}
            </div>
          )}
        </div>
      </div>

      {porTipo.length > 0 && (
        <div className="panel" style={{ marginBottom: 20 }}>
          <div className="panel-head">
            <div>
              <h2 className="panel-title">Por tipo de e-CF</h2>
              <div className="panel-sub">Desglose por código DGII</div>
            </div>
          </div>
          <table className="ds-table">
            <thead>
              <tr>
                <th style={{ paddingLeft: 20 }}>Tipo</th>
                <th>Nombre</th>
                <th style={{ textAlign: "right" }}>Total</th>
                <th style={{ textAlign: "right" }}>Aceptados</th>
                <th style={{ textAlign: "right" }}>Enviados</th>
                <th style={{ textAlign: "right" }}>Rechazados</th>
                <th style={{ textAlign: "right", paddingRight: 20 }}>Monto</th>
              </tr>
            </thead>
            <tbody>
              {porTipo.map((t) => (
                <PorTipoRow key={t.tipo_ecf} item={t} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {porEstado.length > 0 && (
        <div className="panel" style={{ marginBottom: 20 }}>
          <div className="panel-head">
            <div>
              <h2 className="panel-title">Por estado DGII</h2>
              <div className="panel-sub">Estado actual de los e-CFs</div>
            </div>
          </div>
          <div
            style={{
              padding: 16,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 12,
            }}
          >
            {porEstado.map((e) => (
              <div
                key={e.estado}
                style={{
                  border: "1px solid var(--line)",
                  borderRadius: 8,
                  padding: "12px 14px",
                  background: "var(--bg)",
                }}
              >
                <StatusBadge estado={e.estado} />
                <div
                  className="mono"
                  style={{ fontSize: 22, fontWeight: 600, marginTop: 8 }}
                >
                  {fmt.num(e.total)}
                </div>
                <div className="mono" style={{ fontSize: 12, color: "var(--muted)" }}>
                  {fmt.money(e.monto_total)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {porMes.length > 0 && (
        <div className="panel" style={{ marginBottom: 20 }}>
          <div className="panel-head">
            <div>
              <h2 className="panel-title">Por mes</h2>
              <div className="panel-sub">Evolución últimos meses</div>
            </div>
          </div>
          <table className="ds-table">
            <thead>
              <tr>
                <th style={{ paddingLeft: 20 }}>Mes</th>
                <th style={{ textAlign: "right" }}>e-CF emitidos</th>
                <th style={{ textAlign: "right", paddingRight: 20 }}>Monto total</th>
              </tr>
            </thead>
            <tbody>
              {porMes.map((m) => (
                <tr key={m.mes}>
                  <td className="mono" style={{ paddingLeft: 20 }}>{m.mes}</td>
                  <td className="mono" style={{ textAlign: "right" }}>{fmt.num(m.total)}</td>
                  <td
                    className="mono"
                    style={{ textAlign: "right", paddingRight: 20, fontWeight: 600 }}
                  >
                    {fmt.money(m.monto_total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="panel">
        <div className="panel-head">
          <div>
            <h2 className="panel-title">Últimos comprobantes emitidos</h2>
            <div className="panel-sub">Últimas {recentFacturas.length} emisiones</div>
          </div>
        </div>
        <table className="ds-table">
          <thead>
            <tr>
              <th style={{ paddingLeft: 20 }}>e-NCF</th>
              <th>Cliente</th>
              <th>Fecha</th>
              <th style={{ textAlign: "right", paddingRight: 20 }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {recentFacturas.map((f) => (
              <tr key={f.id}>
                <td className="mono" style={{ paddingLeft: 20, fontSize: 11 }}>
                  {getFacturaNcf(f)}
                </td>
                <td style={{ fontWeight: 600 }}>{getFacturaClientName(f)}</td>
                <td className="mono" style={{ fontSize: 11 }}>
                  {formatDisplayDate(f.date)}
                </td>
                <td
                  className="mono"
                  style={{ textAlign: "right", paddingRight: 20, fontWeight: 600, fontSize: 13 }}
                >
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

interface KpiCardProps {
  label: string;
  value: string;
  accent: string;
  mono?: boolean;
}

function KpiCard({ label, value, accent, mono }: KpiCardProps) {
  return (
    <div
      style={{
        position: "relative",
        background: "var(--surface)",
        border: "1px solid var(--line)",
        borderRadius: 8,
        padding: "14px 16px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 4,
          height: "100%",
          background: accent,
        }}
      />
      <div
        className="mono"
        style={{
          fontSize: 9,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "var(--muted)",
          marginBottom: 6,
          paddingLeft: 8,
        }}
      >
        {label}
      </div>
      <div
        className={mono ? "mono" : undefined}
        style={{ fontSize: 22, fontWeight: 600, paddingLeft: 8 }}
      >
        {value}
      </div>
    </div>
  );
}

function SequenceCard({ seq }: { seq: StatsSecuencia }) {
  const next = seq.secuencia_actual + 1;
  const nextEncf = `${seq.type}${String(next).padStart(10, "0")}`;
  return (
    <div className="ncf-card">
      <div className="strip" style={{ background: "var(--c-cyan)" }} />
      <div style={{ paddingLeft: 8 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 8,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div className="ncf-type">{seq.type}</div>
            <div className="ncf-name">{seq.nombre}</div>
          </div>
          <div className="mono" style={{ fontSize: 10, color: "var(--muted)", whiteSpace: "nowrap" }}>
            {fmt.num(seq.total_emitidos)} emitidos
          </div>
        </div>

        <div
          style={{
            marginTop: 10,
            padding: "8px 10px",
            background: "var(--bg)",
            borderRadius: 6,
            border: "1px solid var(--line-2)",
          }}
        >
          <div
            className="mono"
            style={{
              fontSize: 9,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "var(--muted)",
              marginBottom: 2,
            }}
          >
            Próxima a emitir
          </div>
          <div className="ncf-big">{next}</div>
          <div className="mono" style={{ fontSize: 10, color: "var(--ink-2)", marginTop: 2 }}>
            {nextEncf}
          </div>
        </div>

        <div className="ncf-meta">
          <span>Última usada: {seq.secuencia_actual}</span>
        </div>
      </div>
    </div>
  );
}

function PorTipoRow({ item }: { item: StatsByTipo }) {
  const ecfInfo = ECF_TYPES[item.tipo_ecf as TipoEcf];
  return (
    <tr>
      <td style={{ paddingLeft: 20 }}>
        <span
          className="mono"
          style={{
            fontSize: 10,
            fontWeight: 700,
            background: "var(--c-accent, #3b82f6)",
            color: "#fff",
            padding: "2px 6px",
            borderRadius: 4,
          }}
        >
          E{item.tipo_ecf}
        </span>
      </td>
      <td>
        <div style={{ fontWeight: 600 }}>{ecfInfo?.short ?? item.nombre}</div>
        <div className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
          {item.nombre}
        </div>
      </td>
      <td className="mono" style={{ textAlign: "right", fontWeight: 600 }}>
        {fmt.num(item.total)}
      </td>
      <td className="mono" style={{ textAlign: "right", color: "var(--c-green, #22c55e)" }}>
        {fmt.num(item.aceptados + (item.rfce ?? 0))}
      </td>
      <td className="mono" style={{ textAlign: "right", color: "var(--c-amber, #f59e0b)" }}>
        {fmt.num(item.enviados)}
      </td>
      <td className="mono" style={{ textAlign: "right", color: "var(--bad)" }}>
        {fmt.num(item.rechazados)}
      </td>
      <td
        className="mono"
        style={{ textAlign: "right", paddingRight: 20, fontWeight: 600, fontSize: 13 }}
      >
        {fmt.money(item.monto_total)}
      </td>
    </tr>
  );
}

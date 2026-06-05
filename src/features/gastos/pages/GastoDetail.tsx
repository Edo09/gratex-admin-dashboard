import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { PageMeta } from "@/shared/components/layout/PageMeta";
import { PageMarks } from "@/shared/components/press/PageMarks";
import { StatusBadge } from "@/features/facturas/components/StatusBadge";
import { fmt } from "@/shared/utils/press-fmt";
import { formatDisplayDate } from "@/shared/utils/format";
import { gastosApi } from "../api/gastos";
import { useGastoByIdQuery } from "../hooks/useGastosQuery";
import { CATEGORIA_LABELS, TIPO_GASTO_LABELS } from "../constants";
import { parseGastoAmount, toNum } from "../utils";

export default function GastoDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const gastoId = id ? Number(id) : null;
  const { data: gasto, isLoading } = useGastoByIdQuery(gastoId);
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState("");

  if (isLoading) {
    return (
      <div className="content">
        <div className="page-sub">Cargando…</div>
      </div>
    );
  }

  if (!gasto) {
    return (
      <div className="content">
        <PageMarks label="GASTO · NO ENCONTRADO" />
        <h1 className="page-title">Gasto no encontrado</h1>
        <button className="btn-ghost" style={{ marginTop: 16 }} onClick={() => navigate("/gastos")}>
          ← Volver
        </button>
      </div>
    );
  }

  const lines = (gasto.items ?? []).map((it) => ({
    qty: toNum(it.quantity) || 1,
    desc: it.description,
    unit: toNum(it.amount),
    itbis: toNum(it.itbis_amount),
  }));

  const subtotal = lines.reduce((s, l) => s + l.unit * l.qty, 0);
  const itbis = lines.reduce((s, l) => s + l.itbis, 0);
  const total = parseGastoAmount(gasto) || subtotal + itbis;

  const ncfCode = gasto.ncf || `#${gasto.id}`;
  const tipoInfo = TIPO_GASTO_LABELS[gasto.tipo_gasto];
  const dateLabel = formatDisplayDate(gasto.fecha);
  const esAutoEmision = !!Number(gasto.es_auto_emision);
  const pendiente = gasto.estado_dgii === "PENDIENTE_EMISION";

  const consultarEstado = async () => {
    setChecking(true);
    setCheckError("");
    try {
      await gastosApi.estado(gasto.id);
      await queryClient.invalidateQueries({ queryKey: ["gastos", "detail", gasto.id] });
    } catch (err) {
      setCheckError(err instanceof Error ? err.message : "No se pudo consultar el estado.");
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="content">
      <PageMeta title={`Gasto ${ncfCode} · Gratex`} description="Detalle de gasto (e-CF)" />
      <PageMarks label={`GASTO / ${ncfCode}`} />

      <div className="page-head">
        <div>
          <button className="btn-ghost" onClick={() => navigate("/gastos")} style={{ marginBottom: 10 }}>
            ← Volver
          </button>
          <h1 className="page-title">{gasto.nombre_proveedor || "—"}</h1>
          <div className="page-sub" style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span className="mono" style={{ fontSize: 11, fontWeight: 700 }}>{gasto.tipo_gasto}</span>
            <span>{tipoInfo?.name}</span>
            {gasto.estado_dgii && <StatusBadge estado={gasto.estado_dgii} />}
          </div>
        </div>
        {esAutoEmision && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="btn btn-ghost" onClick={consultarEstado} disabled={checking}>
              {checking ? "Consultando…" : "Consultar estado"}
            </button>
          </div>
        )}
      </div>

      {(pendiente || gasto.aviso) && (
        <div
          style={{
            background: "var(--c-amber-soft, rgba(245,158,11,0.12))",
            border: "1px solid var(--c-amber, #f59e0b)",
            color: "var(--ink)",
            padding: "10px 14px",
            borderRadius: 8,
            marginBottom: 16,
            fontSize: 13,
          }}
        >
          {gasto.aviso ??
            "Emisión a DGII pendiente (PENDIENTE_EMISION). El gasto está guardado pero aún no se envió a DGII."}
        </div>
      )}

      {checkError && (
        <div
          className="field-error"
          style={{
            background: "var(--bad-soft)",
            border: "1px solid var(--bad-line)",
            padding: "8px 10px",
            borderRadius: 6,
            marginBottom: 16,
          }}
        >
          {checkError}
        </div>
      )}

      <div className="doc">
        <div className="doc-head">
          <div>
            <div className="doc-num">
              {tipoInfo?.short} · {gasto.ncf ? `NCF ${gasto.ncf}` : "auto-emisión"}
            </div>
            <div className="doc-h1">{gasto.nombre_proveedor || "—"}</div>
            <div className="mono" style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
              {CATEGORIA_LABELS[gasto.categoria]}
              {gasto.rnc_proveedor ? ` · RNC ${gasto.rnc_proveedor}` : ""}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>FECHA {dateLabel}</div>
            {gasto.track_id && (
              <div className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
                Track {gasto.track_id}
              </div>
            )}
          </div>
        </div>

        <div className="doc-section">
          <div className="doc-section-label">Conceptos</div>
          <table className="doc-table">
            <thead>
              <tr>
                <th style={{ width: 60 }}>Cant.</th>
                <th>Descripción</th>
                <th className="r">Precio</th>
                <th className="r">ITBIS</th>
                <th className="r">Total</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((it, i) => (
                <tr key={i}>
                  <td className="mono">{it.qty}</td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{it.desc}</div>
                  </td>
                  <td className="r mono">{fmt.money(it.unit)}</td>
                  <td className="r mono">{it.itbis > 0 ? fmt.money(it.itbis) : "—"}</td>
                  <td className="r mono" style={{ fontWeight: 600 }}>
                    {fmt.money(it.qty * it.unit + it.itbis)}
                  </td>
                </tr>
              ))}
              {lines.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", color: "var(--muted)", padding: 20 }}>
                    Sin conceptos
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="doc-totals">
          <div className="doc-totals-row">
            <span>Subtotal</span>
            <span>{fmt.money(subtotal)}</span>
          </div>
          {itbis > 0 && (
            <div className="doc-totals-row">
              <span>ITBIS</span>
              <span>{fmt.money(itbis)}</span>
            </div>
          )}
          <div className="doc-totals-row total">
            <span>TOTAL</span>
            <span>{fmt.money(total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

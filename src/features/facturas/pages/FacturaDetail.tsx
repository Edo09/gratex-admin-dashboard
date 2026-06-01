import { useNavigate, useParams } from "react-router-dom";
import { PageMeta } from "@/shared/components/layout/PageMeta";
import { PageMarks } from "@/shared/components/press/PageMarks";
import { Icons } from "@/shared/components/press/PressIcons";
import { fmt } from "@/shared/utils/press-fmt";
import { formatDisplayDate } from "@/shared/utils/format";
import { downloadPdfFromBase64, pickPdfBase64 } from "@/shared/lib/pdf";
import { ECF_TYPES, TIPO_PAGO_LABELS, type TipoEcf, type TipoPago } from "../constants";
import {
  parseFacturaAmount,
  getFacturaNcf,
  getFacturaClientName,
  getItemName,
  getItemPrice,
  getItemQty,
  getItemIndicador,
  getFacturaBreakdown,
} from "../utils";
import { useFacturaByIdQuery } from "../hooks/useFacturasQuery";
import { useFacturaStatusQuery } from "../hooks/useFacturaStatus";
import { facturasApi } from "../api/facturas";
import { StatusBadge } from "../components/StatusBadge";
import type { FacturaItem } from "../types";

interface DisplayLine {
  qty: number;
  desc: string;
  unit: number;
  indicador: number;
}

export default function FacturaDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const facturaId = id ? Number(id) : null;
  const { data: factura, isLoading } = useFacturaByIdQuery(facturaId);
  const { data: statusData } = useFacturaStatusQuery(facturaId);

  if (isLoading) {
    return (
      <div className="content">
        <div className="page-sub">Cargando…</div>
      </div>
    );
  }

  if (!factura) {
    return (
      <div className="content">
        <PageMarks label="FACTURA · NO ENCONTRADA" />
        <h1 className="page-title">Factura no encontrada</h1>
        <button className="btn-ghost" style={{ marginTop: 16 }} onClick={() => navigate("/facturas")}>
          ← Volver
        </button>
      </div>
    );
  }

  const rawItems: FacturaItem[] = factura.items ?? [];
  const lines: DisplayLine[] = rawItems.map((it) => ({
    qty: getItemQty(it),
    desc: getItemName(it),
    unit: getItemPrice(it),
    indicador: getItemIndicador(it),
  }));

  if (lines.length === 0) {
    const total = parseFacturaAmount(factura);
    lines.push({ qty: 1, desc: factura.description ?? "Servicio", unit: total, indicador: 1 });
  }

  const breakdown = getFacturaBreakdown(factura);

  const ncfCode = getFacturaNcf(factura);
  const isEcf = !!factura.tipo_ecf || ncfCode.startsWith("E");
  const ncfLabel = isEcf ? "e-NCF" : "NCF";
  const clientName = getFacturaClientName(factura);
  const companyName = factura.company_name?.trim() || null;
  const headerTitle = clientName !== "—" ? clientName : (companyName ?? "—");
  const headerSubName =
    companyName && companyName !== headerTitle ? companyName : null;
  const docHeading = companyName ?? clientName;
  const dateLabel = formatDisplayDate(factura.date);
  const tipoEcf = factura.tipo_ecf as TipoEcf | undefined;
  const tipoPago = factura.tipo_pago as TipoPago | undefined;
  const estado = statusData?.estado_dgii ?? factura.estado_dgii;

  const downloadPdf = async () => {
    const response = await facturasApi.pdf(factura.id);
    const base64 = pickPdfBase64(response);
    if (base64) downloadPdfFromBase64(base64, `factura-${ncfCode}`);
  };

  return (
    <div className="content">
      <PageMeta title={`Factura ${ncfCode} · Gratex`} description="Detalle de factura" />
      <PageMarks label={`FACTURA / ${ncfCode}`} />

      <div className="page-head">
        <div>
          <button className="btn-ghost" onClick={() => navigate("/facturas")} style={{ marginBottom: 10 }}>
            ← Volver
          </button>
          <h1 className="page-title">{headerTitle}</h1>
          {headerSubName && (
            <div
              className="mono"
              style={{ fontSize: 12, color: "var(--muted)", marginTop: 2, marginBottom: 6 }}
            >
              {headerSubName}
            </div>
          )}
          <div className="page-sub" style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span>{ncfLabel} {ncfCode}</span>
            {tipoEcf && (
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
                E{tipoEcf}
              </span>
            )}
            {tipoEcf && ECF_TYPES[tipoEcf] && (
              <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
                {ECF_TYPES[tipoEcf].short}
              </span>
            )}
            {estado && <StatusBadge estado={estado} />}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="btn" onClick={downloadPdf}>
            <Icons.download size={13} /> Descargar
          </button>
        </div>
      </div>

      <div className="doc">
        <div className="doc-head">
          <div>
            <div className="doc-num">
              Factura · {ncfLabel} {ncfCode}
              {tipoEcf && <span style={{ marginLeft: 8, opacity: 0.6 }}>E{tipoEcf}</span>}
            </div>
            <div className="doc-h1">{docHeading}</div>
            {companyName && clientName !== "—" && companyName !== clientName && (
              <div className="mono" style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
                {clientName}
              </div>
            )}
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
              FECHA {dateLabel}
            </div>
            {tipoPago && (
              <div className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
                PAGO: {TIPO_PAGO_LABELS[tipoPago]}
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
                  <td className="r mono" style={{ fontWeight: 600 }}>
                    {fmt.money(it.qty * it.unit)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="doc-totals">
          <div className="doc-totals-row">
            <span>Subtotal</span>
            <span>{fmt.money(breakdown.subtotal)}</span>
          </div>
          {breakdown.itbis18 > 0 && (
            <div className="doc-totals-row">
              <span>ITBIS 18%</span>
              <span>{fmt.money(breakdown.itbis18)}</span>
            </div>
          )}
          {breakdown.itbis16 > 0 && (
            <div className="doc-totals-row">
              <span>ITBIS 16%</span>
              <span>{fmt.money(breakdown.itbis16)}</span>
            </div>
          )}
          {breakdown.montoExento > 0 && (
            <div className="doc-totals-row">
              <span>Exento</span>
              <span>{fmt.money(breakdown.montoExento)}</span>
            </div>
          )}
          {breakdown.montoTasaCero > 0 && (
            <div className="doc-totals-row">
              <span>Tasa cero</span>
              <span>{fmt.money(breakdown.montoTasaCero)}</span>
            </div>
          )}
          <div className="doc-totals-row total">
            <span>TOTAL</span>
            <span>{fmt.money(breakdown.total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

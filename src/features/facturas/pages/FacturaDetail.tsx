import { useNavigate, useParams } from "react-router-dom";
import { PageMeta } from "@/shared/components/layout/PageMeta";
import { PageMarks } from "@/shared/components/press/PageMarks";
import { Pill } from "@/shared/components/press/Pill";
import { Icons } from "@/shared/components/press/PressIcons";
import { fmt } from "@/shared/utils/press-fmt";
import { formatDisplayDate } from "@/shared/utils/format";
import { openPdfFromBase64, pickPdfBase64 } from "@/shared/lib/pdf";
import {
  mockFacturaStatus,
  mockFacturaCotzCode,
  MOCK_VENCIMIENTO,
} from "@/shared/lib/press-mocks";
import { useFacturaByIdQuery } from "../hooks/useFacturasQuery";
import { facturasApi } from "../api/facturas";
import { parseFacturaAmount } from "@/features/dashboard/hooks/useDashboardData";

interface Line {
  qty: number;
  desc: string;
  unit: number;
}

const ITBIS_RATE = 0.18;

export default function FacturaDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const facturaId = id ? Number(id) : null;
  const { data: factura, isLoading } = useFacturaByIdQuery(facturaId);

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

  const lines: Line[] = (factura.items ?? []).map((it) => ({
    qty: Number(it.quantity ?? 1),
    desc: it.description,
    unit: typeof it.amount === "string" ? parseFloat(String(it.amount)) : Number(it.amount),
  }));

  if (lines.length === 0) {
    const total = parseFacturaAmount(factura);
    lines.push({
      qty: 1,
      desc: factura.description ?? "Servicio",
      unit: total,
    });
  }

  const subtotal = lines.reduce((s, it) => s + it.qty * it.unit, 0);
  const itbis = subtotal * ITBIS_RATE;
  const total = subtotal + itbis;

  const ncfCode = factura.NCF ?? factura.no_factura ?? `#${factura.id}`;
  const cotzOrigin = mockFacturaCotzCode(factura.id); // MOCK
  const dateLabel = formatDisplayDate(factura.date);

  const downloadPdf = async () => {
    const response = await facturasApi.pdf(factura.id);
    const base64 = pickPdfBase64(response);
    if (base64) openPdfFromBase64(base64);
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
          <h1 className="page-title">{factura.client_name ?? factura.client ?? "—"}</h1>
          <div className="page-sub">
            NCF {ncfCode} · originada de {cotzOrigin}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn-ghost">Marcar pagada</button>
          <button className="btn-ghost" onClick={() => window.print()}>
            <Icons.print size={13} /> Imprimir
          </button>
          <button className="btn" onClick={downloadPdf}>
            Enviar al cliente
          </button>
        </div>
      </div>

      <div className="doc">
        <div className="doc-head">
          <div>
            <div className="doc-num">Factura · NCF {ncfCode}</div>
            <div className="doc-h1">{factura.client_name ?? factura.client ?? "—"}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <Pill status={mockFacturaStatus(factura.id)} />
            <div className="mono" style={{ fontSize: 11, color: "var(--muted)", marginTop: 8 }}>
              FECHA {dateLabel}
            </div>
            {/* MOCK: vencimiento — backend has no `due_date` field. */}
            <div className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
              VENC {MOCK_VENCIMIENTO}
            </div>
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
            <span>{fmt.money(subtotal)}</span>
          </div>
          <div className="doc-totals-row">
            <span>ITBIS 18%</span>
            <span>{fmt.money(itbis)}</span>
          </div>
          <div className="doc-totals-row total">
            <span>TOTAL</span>
            <span>{fmt.money(total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

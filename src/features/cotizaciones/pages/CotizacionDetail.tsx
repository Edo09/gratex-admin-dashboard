import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageMeta } from "@/shared/components/layout/PageMeta";
import { PageMarks } from "@/shared/components/press/PageMarks";
import { Icons } from "@/shared/components/press/PressIcons";
import { fmt } from "@/shared/utils/press-fmt";
import { formatDisplayDate } from "@/shared/utils/format";
import { useCotizacionByIdQuery } from "../hooks/useCotizacionesQuery";
import { useCotizacionPdf } from "../hooks/useCotizacionPdf";
import { CreateQuoteModal } from "../components/CreateQuoteModal";
import { parseCotizacionAmount } from "@/features/dashboard/hooks/useDashboardData";

interface Line {
  qty: number;
  desc: string;
  unit: number;
}

const ITBIS_RATE = 0.18;

export default function CotizacionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const cotizacionId = id ? Number(id) : null;
  const { data: cotizacion, isLoading } = useCotizacionByIdQuery(cotizacionId);
  const { openSavedPdf, downloadSavedPdf } = useCotizacionPdf();
  const [editOpen, setEditOpen] = useState(false);
  const [toast, setToast] = useState("");

  if (isLoading) {
    return (
      <div className="content">
        <div className="page-sub">Cargando…</div>
      </div>
    );
  }

  if (!cotizacion) {
    return (
      <div className="content">
        <PageMarks label="COTIZACIÓN · NO ENCONTRADA" />
        <h1 className="page-title">Cotización no encontrada</h1>
        <button className="btn-ghost" style={{ marginTop: 16 }} onClick={() => navigate("/cotizaciones")}>
          ← Volver
        </button>
      </div>
    );
  }

  const lines: Line[] = (cotizacion.items ?? []).map((it) => ({
    qty: Number(it.quantity ?? 1),
    desc: it.description,
    unit: typeof it.amount === "string" ? parseFloat(it.amount) : Number(it.amount),
  }));

  if (lines.length === 0) {
    // No line items on the backend record — derive a single line from
    // description + total so the document still renders sensibly.
    const total = parseCotizacionAmount(cotizacion);
    lines.push({
      qty: 1,
      desc: cotizacion.description ?? "Servicio",
      unit: total,
    });
  }

  const subtotal = lines.reduce((s, it) => s + it.qty * it.unit, 0);
  const itbis = subtotal * ITBIS_RATE;
  const total = subtotal + itbis;

  const code = cotizacion.code ?? `#${cotizacion.id}`;
  const dateLabel = formatDisplayDate(cotizacion.date);

  return (
    <div className="content">
      <PageMeta title={`Cotización ${code} · Gratex`} description="Detalle de cotización" />
      <PageMarks label={`COTIZACIÓN / ${code}`} />

      <div className="page-head">
        <div>
          <button className="btn-ghost" onClick={() => navigate("/cotizaciones")} style={{ marginBottom: 10 }}>
            ← Volver
          </button>
          <h1 className="page-title">{cotizacion.client_name ?? "—"}</h1>
          <div className="page-sub">
            {cotizacion.company_name ?? ""} · cotización emitida {dateLabel}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="btn-ghost" onClick={() => setEditOpen(true)}>
            <Icons.edit size={13} /> Editar
          </button>
          <button className="btn-ghost" onClick={() => openSavedPdf(cotizacion.id)}>
            <Icons.external size={13} /> Preview
          </button>
          <button
            className="btn-ghost"
            onClick={() => downloadSavedPdf(cotizacion.id, `cotizacion-${code}`)}
          >
            <Icons.download size={13} /> PDF
          </button>
          <button className="btn btn-accent" onClick={() => navigate("/facturas")}>
            Convertir a factura
          </button>
        </div>
      </div>

      <div className="doc">
        <div className="doc-head">
          <div>
            <div className="doc-num">Cotización · {code}</div>
            <div className="doc-h1">{cotizacion.company_name ?? cotizacion.client_name ?? "—"}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
              EMIT {dateLabel}
            </div>
          </div>
        </div>

        <div className="doc-section">
          <div className="doc-section-label">Facturar a</div>
          <div className="doc-section-body">
            <div style={{ fontWeight: 600, fontSize: 16 }}>
              {cotizacion.company_name ?? cotizacion.client_name ?? "—"}
            </div>
            <div style={{ marginTop: 2 }}>{cotizacion.client_name ?? ""}</div>
            <div className="mono" style={{ color: "var(--muted)", fontSize: 12 }}>
              {cotizacion.email ?? ""}
            </div>
            <div className="mono" style={{ color: "var(--muted)", fontSize: 12 }}>
              {cotizacion.phone_number ?? cotizacion.telefono ?? ""}
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

      <CreateQuoteModal
        open={editOpen}
        editingCotizacion={cotizacion}
        onClose={() => setEditOpen(false)}
        onCreated={(msg) => {
          setToast(msg);
          window.setTimeout(() => setToast(""), 2500);
        }}
      />

      {toast && (
        <div className="toast">
          <span className="swatch" style={{ background: "var(--c-cyan)" }} />
          {toast}
        </div>
      )}
    </div>
  );
}

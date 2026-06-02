import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageMeta } from "@/shared/components/layout/PageMeta";
import { PageMarks } from "@/shared/components/press/PageMarks";
import { Icons } from "@/shared/components/press/PressIcons";
import { ModalPortal } from "@/shared/components/press/ModalPortal";
import { ComprobanteBadge } from "@/shared/components/ui/ComprobanteBadge";
import { fmt } from "@/shared/utils/press-fmt";
import { formatDisplayDate } from "@/shared/utils/format";
import {
  parseFacturaAmount,
  getFacturaNcf,
  getFacturaClientName,
  getItemName,
  getItemPrice,
  getItemQty,
} from "@/features/facturas/utils";
import { useFacturaSimpleByIdQuery } from "../hooks/useFacturasSimplesQuery";
import { useDeleteFacturaSimple } from "../hooks/useDeleteFacturaSimple";
import type { FacturaSimpleLine } from "../types";

function toNumber(v: unknown): number {
  if (v == null) return 0;
  const n = typeof v === "string" ? parseFloat(v) : Number(v);
  return isNaN(n) ? 0 : n;
}

export default function FacturaSimpleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const facturaId = id ? Number(id) : null;
  const { data: factura, isLoading } = useFacturaSimpleByIdQuery(facturaId);
  const deleteFactura = useDeleteFacturaSimple();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteError, setDeleteError] = useState("");

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
        <PageMarks label="FACTURA NCF · NO ENCONTRADA" />
        <h1 className="page-title">Factura no encontrada</h1>
        <button className="btn-ghost" style={{ marginTop: 16 }} onClick={() => navigate("/facturas-ncf")}>
          ← Volver
        </button>
      </div>
    );
  }

  const rawItems = (factura.items ?? []) as FacturaSimpleLine[];
  const lines = rawItems.map((it) => ({
    qty: getItemQty(it),
    desc: getItemName(it),
    unit: getItemPrice(it),
    itbis: toNumber(it.itbis_amount),
  }));

  if (lines.length === 0) {
    const total = parseFacturaAmount(factura);
    lines.push({ qty: 1, desc: factura.description ?? "Servicio", unit: total, itbis: 0 });
  }

  const subtotal = lines.reduce((s, l) => s + l.unit * l.qty, 0);
  const itbis = lines.reduce((s, l) => s + l.itbis, 0);
  const total = parseFacturaAmount(factura) || subtotal + itbis;

  const ncfCode = getFacturaNcf(factura);
  const clientName = getFacturaClientName(factura);
  const companyName = factura.company_name?.trim() || null;
  const headerTitle = clientName !== "—" ? clientName : (companyName ?? "—");
  const headerSubName = companyName && companyName !== headerTitle ? companyName : null;
  const docHeading = companyName ?? clientName;
  const dateLabel = formatDisplayDate(factura.date);

  const handleDelete = async () => {
    setDeleteError("");
    try {
      await deleteFactura.mutateAsync(factura.id);
      navigate("/facturas-ncf");
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "No se pudo eliminar la factura.");
    }
  };

  return (
    <div className="content">
      <PageMeta title={`Factura ${ncfCode} · Gratex`} description="Detalle de factura NCF" />
      <PageMarks label={`FACTURA NCF / ${ncfCode}`} />

      <div className="page-head">
        <div>
          <button className="btn-ghost" onClick={() => navigate("/facturas-ncf")} style={{ marginBottom: 10 }}>
            ← Volver
          </button>
          <h1 className="page-title">{headerTitle}</h1>
          {headerSubName && (
            <div className="mono" style={{ fontSize: 12, color: "var(--muted)", marginTop: 2, marginBottom: 6 }}>
              {headerSubName}
            </div>
          )}
          <div className="page-sub" style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <ComprobanteBadge type="ncf" />
            {factura.NCF && <span>NCF {factura.NCF}</span>}
            {factura.no_factura && (
              <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
                No. {factura.no_factura}
              </span>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            className="btn"
            style={{ background: "var(--bad)", borderColor: "var(--bad)" }}
            onClick={() => setConfirmOpen(true)}
          >
            <Icons.trash size={13} /> Eliminar
          </button>
        </div>
      </div>

      <div className="doc">
        <div className="doc-head">
          <div>
            <div className="doc-num">
              Factura · NCF {factura.NCF || factura.no_factura || `#${factura.id}`}
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
            {factura.no_factura && (
              <div className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
                No. {factura.no_factura}
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

      {confirmOpen && (
        <ModalPortal>
        <div className="modal-bg" onClick={() => !deleteFactura.isPending && setConfirmOpen(false)}>
          <div className="modal" style={{ width: "min(420px, 100%)" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-pad" style={{ textAlign: "center" }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  background: "var(--bad-soft)",
                  color: "var(--bad)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                }}
              >
                <Icons.trash size={22} />
              </div>
              <h3 className="modal-title" style={{ fontSize: 18, marginBottom: 8, textAlign: "center" }}>
                ¿Eliminar factura?
              </h3>
              <p style={{ color: "var(--muted)", fontSize: 13, lineHeight: 1.5, margin: "0 0 20px" }}>
                ¿Estás seguro de que deseas eliminar la factura{" "}
                <strong>{factura.NCF || factura.no_factura || `#${factura.id}`}</strong>? Esta acción no se puede deshacer.
              </p>
              {deleteError && (
                <div
                  className="field-error"
                  style={{
                    background: "var(--bad-soft)",
                    border: "1px solid var(--bad-line)",
                    padding: "8px 10px",
                    borderRadius: 6,
                    marginBottom: 16,
                    textAlign: "left",
                  }}
                >
                  {deleteError}
                </div>
              )}
            </div>
            <div className="modal-foot">
              <button className="btn-ghost" onClick={() => setConfirmOpen(false)} disabled={deleteFactura.isPending}>
                Cancelar
              </button>
              <button
                className="btn"
                style={{ background: "var(--bad)", borderColor: "var(--bad)" }}
                onClick={handleDelete}
                disabled={deleteFactura.isPending}
              >
                {deleteFactura.isPending ? "Eliminando…" : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}
    </div>
  );
}

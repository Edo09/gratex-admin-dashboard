import { useEffect, useState } from "react";
import { Icons } from "@/shared/components/press/PressIcons";
import { ModalPortal } from "@/shared/components/press/ModalPortal";
import { extractErrorMessage } from "@/shared/api/errors";
import { fmt } from "@/shared/utils/press-fmt";
import { formatDisplayDate } from "@/shared/utils/format";
import { useAprobarEcf } from "../hooks/useAprobarEcf";
import type { EcfRecibido, EstadoAprobacion } from "../types";

interface AprobarEcfModalProps {
  open: boolean;
  ecf: EcfRecibido | null;
  onClose: () => void;
  onDone?: (message: string) => void;
}

const tipoPillStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  background: "var(--c-accent, #3b82f6)",
  color: "#fff",
  padding: "2px 6px",
  borderRadius: 4,
  marginRight: 6,
};

export function AprobarEcfModal({ open, ecf, onClose, onDone }: AprobarEcfModalProps) {
  const [estado, setEstado] = useState<EstadoAprobacion>("1");
  const [motivo, setMotivo] = useState("");
  const [apiError, setApiError] = useState("");
  const mutation = useAprobarEcf();
  const busy = mutation.isPending;

  useEffect(() => {
    if (open) {
      setEstado(ecf?.aprobacion_comercial === "RECHAZADO" ? "2" : "1");
      setMotivo("");
      setApiError("");
    }
  }, [open, ecf?.track_id, ecf?.aprobacion_comercial]);

  if (!open || !ecf) return null;

  const close = () => {
    if (!busy) onClose();
  };

  const handleSubmit = async () => {
    setApiError("");
    if (estado === "2" && !motivo.trim()) {
      setApiError("El motivo del rechazo es obligatorio.");
      return;
    }
    try {
      await mutation.mutateAsync({
        rnc_emisor: ecf.rnc_emisor,
        e_ncf: ecf.e_ncf,
        fecha_emision: ecf.fecha_emision,
        monto_total: ecf.monto_total,
        estado,
        detalle_motivo: estado === "2" ? motivo.trim() : undefined,
      });
      onDone?.(estado === "1" ? "e-CF aprobado ante la DGII" : "e-CF rechazado ante la DGII");
      onClose();
    } catch (err) {
      setApiError(extractErrorMessage(err) ?? "No se pudo enviar la aprobación.");
    }
  };

  return (
    <ModalPortal>
      <div className="modal-bg" onClick={close}>
        <div className="modal anim-in" onClick={(e) => e.stopPropagation()}>
          <div className="modal-pad">
            <div className="modal-head">
              <div>
                <h2 className="modal-title">Aprobación comercial</h2>
                <div className="modal-sub">
                  <span className="mono" style={tipoPillStyle}>
                    E{ecf.tipo_ecf}
                  </span>
                  {ecf.e_ncf}
                </div>
              </div>
              <button className="close-x" onClick={close} aria-label="Cerrar">
                <Icons.close size={18} />
              </button>
            </div>

            {apiError && (
              <div
                className="field-error"
                style={{
                  background: "var(--bad-soft)",
                  border: "1px solid var(--bad-line)",
                  padding: "8px 10px",
                  borderRadius: 6,
                  marginBottom: 14,
                }}
              >
                {apiError}
              </div>
            )}

            <div
              className="panel"
              style={{ padding: 14, marginBottom: 16, display: "grid", gap: 8 }}
            >
              <SummaryRow label="Emisor" value={ecf.razon_social_emisor || "—"} />
              <SummaryRow label="RNC emisor" value={ecf.rnc_emisor} mono />
              <SummaryRow label="Fecha emisión" value={formatDisplayDate(ecf.fecha_emision)} mono />
              <SummaryRow
                label="Monto total"
                value={fmt.money(Number(ecf.monto_total) || 0)}
                mono
                strong
              />
            </div>

            {ecf.aprobacion_comercial != null && (
              <div
                style={{
                  fontSize: 12,
                  color: "var(--muted)",
                  marginBottom: 14,
                  padding: "8px 10px",
                  background: "var(--bg)",
                  borderRadius: 6,
                  border: "1px solid var(--line)",
                }}
              >
                Ya enviaste una decisión:{" "}
                <strong>{ecf.aprobacion_comercial === "ACEPTADO" ? "Aceptado" : "Rechazado"}</strong>
                {ecf.aprobacion_comercial_estado_dgii ? ` · DGII: ${ecf.aprobacion_comercial_estado_dgii}` : ""}
                . Reenviar sobrescribe el último estado (sin historial).
              </div>
            )}

            <div className="seg" style={{ marginBottom: 14 }}>
              <button
                className={estado === "1" ? "active" : ""}
                onClick={() => setEstado("1")}
                disabled={busy}
              >
                Aceptar
              </button>
              <button
                className={estado === "2" ? "active" : ""}
                onClick={() => setEstado("2")}
                disabled={busy}
              >
                Rechazar
              </button>
            </div>

            {estado === "2" && (
              <div style={{ marginBottom: 14 }}>
                <label
                  className="mono"
                  style={{ display: "block", fontSize: 11, color: "var(--muted)", marginBottom: 6 }}
                >
                  Motivo del rechazo *
                </label>
                <textarea
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Describe por qué rechazas este comprobante…"
                  rows={3}
                  disabled={busy}
                  style={{
                    width: "100%",
                    border: "1px solid var(--line)",
                    borderRadius: 6,
                    padding: "8px 10px",
                    fontSize: 13,
                    background: "var(--surface)",
                    color: "var(--ink)",
                    resize: "vertical",
                  }}
                />
              </div>
            )}

            <div className="modal-foot">
              <div className="modal-foot-spacer" />
              <button type="button" className="btn-ghost" onClick={close} disabled={busy}>
                Cancelar
              </button>
              <button
                type="button"
                className={estado === "1" ? "btn btn-accent" : "btn"}
                onClick={handleSubmit}
                disabled={busy}
                style={
                  estado === "2"
                    ? { background: "var(--bad, #ef4444)", borderColor: "var(--bad, #ef4444)", color: "#fff" }
                    : undefined
                }
              >
                {busy ? "Enviando…" : estado === "1" ? "Aprobar" : "Rechazar"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}

function SummaryRow({
  label,
  value,
  mono,
  strong,
}: {
  label: string;
  value: string;
  mono?: boolean;
  strong?: boolean;
}) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
      <span style={{ color: "var(--muted)", fontSize: 12 }}>{label}</span>
      <span
        className={mono ? "mono" : undefined}
        style={{ fontSize: 13, fontWeight: strong ? 700 : 500, textAlign: "right" }}
      >
        {value}
      </span>
    </div>
  );
}

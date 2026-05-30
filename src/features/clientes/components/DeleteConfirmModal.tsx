import { Icons } from "@/shared/components/press/PressIcons";
import { ModalPortal } from "@/shared/components/press/ModalPortal";

interface DeleteConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  clienteName: string;
  isDeleting: boolean;
  error?: string;
}

export function DeleteConfirmModal({
  open,
  onClose,
  onConfirm,
  clienteName,
  isDeleting,
  error,
}: DeleteConfirmModalProps) {
  if (!open) return null;

  return (
    <ModalPortal>
      <div className="modal-bg" onClick={onClose}>
        <div className="modal anim-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
          <div className="modal-pad" style={{ textAlign: "center", padding: "32px 24px" }}>
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
              ¿Eliminar cliente?
            </h3>

            <p style={{ color: "var(--muted)", fontSize: 13, lineHeight: 1.5, margin: "0 0 20px" }}>
              ¿Estás seguro de que deseas eliminar a <strong>{clienteName}</strong>? Esta acción no se puede deshacer.
            </p>

            {error && (
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
                {error}
              </div>
            )}

            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button
                className="btn-ghost"
                onClick={onClose}
                disabled={isDeleting}
                style={{ minWidth: 110, justifyContent: "center" }}
              >
                Cancelar
              </button>
              <button
                className="btn"
                onClick={onConfirm}
                disabled={isDeleting}
                style={{
                  minWidth: 110,
                  justifyContent: "center",
                  background: "var(--bad)",
                  borderColor: "var(--bad)",
                }}
              >
                {isDeleting ? "Eliminando…" : "Sí, eliminar"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}

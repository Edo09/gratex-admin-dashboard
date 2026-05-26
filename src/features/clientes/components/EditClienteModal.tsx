import { useState, useEffect, type FormEvent } from "react";
import { Icons } from "@/shared/components/press/PressIcons";
import { ModalPortal } from "@/shared/components/press/ModalPortal";
import { extractErrorMessage } from "@/shared/api/errors";
import { useUpdateCliente } from "../hooks/useUpdateCliente";
import type { Cliente, CreateClienteInput } from "../types";

interface EditClienteModalProps {
  cliente: Cliente | null;
  open: boolean;
  onClose: () => void;
  onUpdated?: (message: string) => void;
}

interface Errors {
  client_name?: string;
  company_name?: string;
  email?: string;
  phone_number?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type EditFormInput = Omit<CreateClienteInput, "sent_mail">;

const EMPTY: EditFormInput = {
  client_name: "",
  company_name: "",
  email: "",
  phone_number: "",
  rnc: "",
};

function normalize(d: EditFormInput): EditFormInput {
  return {
    client_name: d.client_name.trim(),
    company_name: d.company_name.trim(),
    email: d.email.trim(),
    phone_number: d.phone_number.trim(),
    rnc: d.rnc.trim(),
  };
}

function validate(d: EditFormInput): Errors {
  const next: Errors = {};
  if (!d.client_name) next.client_name = "Nombre obligatorio";
  if (!d.company_name) next.company_name = "Empresa obligatoria";
  if (!d.email || !EMAIL_RE.test(d.email)) next.email = "Email inválido";
  if (!d.phone_number) next.phone_number = "Teléfono obligatorio";
  return next;
}

export function EditClienteModal({ cliente, open, onClose, onUpdated }: EditClienteModalProps) {
  const updateMutation = useUpdateCliente();
  const [form, setForm] = useState<EditFormInput>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    if (open && cliente) {
      setForm({
        client_name: cliente.client_name ?? cliente.nombre ?? cliente.name ?? "",
        company_name: cliente.company_name ?? "",
        email: cliente.email ?? "",
        phone_number: cliente.phone_number ?? cliente.telefono ?? "",
        rnc: cliente.rnc ?? "",
      });
      setErrors({});
      setApiError("");
    } else if (!open) {
      setForm(EMPTY);
      setErrors({});
      setApiError("");
    }
  }, [open, cliente]);

  if (!open || !cliente) return null;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const data = normalize(form);
    const next = validate(data);
    setErrors(next);
    if (Object.keys(next).length > 0) {
      setApiError("");
      return;
    }
    setApiError("");
    try {
      const message = await updateMutation.mutateAsync({
        id: cliente.id,
        data,
      });
      onUpdated?.(message);
      onClose();
    } catch (err) {
      setApiError(extractErrorMessage(err) ?? "No se pudo actualizar el cliente.");
    }
  };

  const close = () => {
    if (updateMutation.isPending) return;
    onClose();
  };

  return (
    <ModalPortal>
      <div className="modal-bg" onClick={close}>
        <div className="modal anim-in" onClick={(e) => e.stopPropagation()}>
          <div className="modal-pad">
            <div className="modal-head">
              <div>
                <h2 className="modal-title">Editar cliente</h2>
                <div className="modal-sub">Actualiza los datos del cliente #{String(cliente.id).padStart(4, "0")}.</div>
              </div>
              <button className="close-x" onClick={close} aria-label="Cerrar">
                <Icons.close size={18} />
              </button>
            </div>

            {apiError && (
              <div
                className="field-error"
                style={{
                  background: "#f7e9e9",
                  border: "1px solid #e8c3c3",
                  padding: "8px 10px",
                  borderRadius: 6,
                  marginBottom: 14,
                }}
              >
                {apiError}
              </div>
            )}

            <form onSubmit={submit}>
              <div className="field-row">
                <div className={"field" + (errors.client_name ? " error" : "")}>
                  <label>Nombre</label>
                  <input
                    value={form.client_name}
                    onChange={(e) => setForm({ ...form, client_name: e.target.value })}
                    placeholder="Ej. Juan Pérez"
                    maxLength={100}
                  />
                  {errors.client_name && <div className="field-error">{errors.client_name}</div>}
                </div>
                <div className={"field" + (errors.company_name ? " error" : "")}>
                  <label>Empresa</label>
                  <input
                    value={form.company_name}
                    onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                    placeholder="Ej. Acme Corp"
                    maxLength={100}
                  />
                  {errors.company_name && <div className="field-error">{errors.company_name}</div>}
                </div>
              </div>

              <div className="field-row">
                <div className={"field" + (errors.email ? " error" : "")}>
                  <label>Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="cliente@ejemplo.do"
                    maxLength={100}
                  />
                  {errors.email && <div className="field-error">{errors.email}</div>}
                </div>
                <div className={"field" + (errors.phone_number ? " error" : "")}>
                  <label>Teléfono</label>
                  <input
                    value={form.phone_number}
                    onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                    placeholder="809-555-0000"
                    maxLength={20}
                  />
                  {errors.phone_number && <div className="field-error">{errors.phone_number}</div>}
                </div>
              </div>

              <div className="field">
                <label>RNC (opcional)</label>
                <input
                  value={form.rnc}
                  onChange={(e) => setForm({ ...form, rnc: e.target.value })}
                  placeholder="130123456"
                  maxLength={20}
                />
              </div>
            </form>
          </div>
          <div className="modal-foot">
            <button className="btn-ghost" onClick={close} disabled={updateMutation.isPending}>
              Cancelar
            </button>
            <button
              className="btn btn-accent"
              onClick={submit}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Guardando…" : "Guardar cambios"}
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}

import { useState, type FormEvent } from "react";
import { Icons } from "@/shared/components/press/PressIcons";
import { ModalPortal } from "@/shared/components/press/ModalPortal";
import { extractErrorMessage } from "@/shared/api/errors";
import { useCreateCliente } from "../hooks/useCreateCliente";
import type { CreateClienteInput } from "../types";

interface CreateClienteModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (message: string) => void;
}

interface Errors {
  client_name?: string;
  company_name?: string;
  email?: string;
  phone_number?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const EMPTY: CreateClienteInput = {
  client_name: "",
  company_name: "",
  email: "",
  phone_number: "",
  sent_mail: false,
  rnc: "",
};

function normalize(d: CreateClienteInput): CreateClienteInput {
  return {
    ...d,
    client_name: d.client_name.trim(),
    company_name: d.company_name.trim(),
    email: d.email.trim(),
    phone_number: d.phone_number.trim(),
    rnc: d.rnc.trim(),
  };
}

function validate(d: CreateClienteInput): Errors {
  const next: Errors = {};
  if (!d.client_name) next.client_name = "Nombre obligatorio";
  if (!d.company_name) next.company_name = "Empresa obligatoria";
  if (!d.email || !EMAIL_RE.test(d.email)) next.email = "Email inválido";
  if (!d.phone_number) next.phone_number = "Teléfono obligatorio";
  return next;
}

export function CreateClienteModal({ open, onClose, onCreated }: CreateClienteModalProps) {
  const createMutation = useCreateCliente();
  const [form, setForm] = useState<CreateClienteInput>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [apiError, setApiError] = useState("");

  if (!open) return null;

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
      const message = await createMutation.mutateAsync(data);
      setForm(EMPTY);
      setErrors({});
      onCreated?.(message);
      onClose();
    } catch (err) {
      setApiError(extractErrorMessage(err) ?? "No se pudo guardar el cliente.");
    }
  };

  const close = () => {
    if (createMutation.isPending) return;
    setForm(EMPTY);
    setErrors({});
    setApiError("");
    onClose();
  };

  return (
    <ModalPortal>
      <div className="modal-bg" onClick={close}>
        <div className="modal anim-in" onClick={(e) => e.stopPropagation()}>
        <div className="modal-pad">
          <div className="modal-head">
            <div>
              <h2 className="modal-title">Nuevo cliente</h2>
              <div className="modal-sub">Registra un nuevo cliente del taller.</div>
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

            <div className="field">
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", textTransform: "none", letterSpacing: 0, fontFamily: "Geist", fontSize: 12, color: "var(--ink-2)" }}>
                <input
                  type="checkbox"
                  checked={form.sent_mail}
                  onChange={(e) => setForm({ ...form, sent_mail: e.target.checked })}
                  style={{ width: "auto", padding: 0 }}
                />
                Enviar correo de bienvenida
              </label>
            </div>
          </form>
        </div>
        <div className="modal-foot">
          <button className="btn-ghost" onClick={close} disabled={createMutation.isPending}>
            Cancelar
          </button>
          <button
            className="btn btn-accent"
            onClick={submit}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? "Guardando…" : "Crear cliente"}
          </button>
        </div>
        </div>
      </div>
    </ModalPortal>
  );
}

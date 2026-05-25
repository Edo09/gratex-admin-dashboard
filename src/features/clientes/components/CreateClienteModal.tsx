import { useState, type FormEvent } from "react";
import { Modal } from "@/shared/components/ui/Modal";
import Button from "@/shared/components/ui/Button";
import { useCreateCliente } from "../hooks/useCreateCliente";
import {
  EMPTY_CLIENTE_FORM,
  normalizeClienteForm,
  validateCreateCliente,
  type CreateClienteErrors,
} from "../validation";
import type { CreateClienteInput } from "../types";
import { extractErrorMessage } from "@/shared/api/errors";

interface CreateClienteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export function CreateClienteModal({ isOpen, onClose, onSuccess }: CreateClienteModalProps) {
  const createMutation = useCreateCliente();
  const [formData, setFormData] = useState<CreateClienteInput>(EMPTY_CLIENTE_FORM);
  const [errors, setErrors] = useState<CreateClienteErrors>({});
  const [submitError, setSubmitError] = useState("");

  const updateField = <K extends keyof CreateClienteInput>(key: K, value: CreateClienteInput[K]) => {
    setFormData((prev) => {
      const next = { ...prev, [key]: value };
      const normalized = normalizeClienteForm(next);
      const nextErrors = validateCreateCliente(normalized);
      setErrors((prevErrors) => {
        if (Object.keys(prevErrors).length === 0 && !prevErrors[key as keyof CreateClienteErrors]) {
          return prevErrors;
        }
        return nextErrors;
      });
      return next;
    });
  };

  const handleClose = () => {
    if (createMutation.isPending) return;
    setErrors({});
    setSubmitError("");
    setFormData(EMPTY_CLIENTE_FORM);
    onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const normalized = normalizeClienteForm(formData);
    const validationErrors = validateCreateCliente(normalized);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      setSubmitError("Corrige los campos marcados antes de guardar.");
      return;
    }

    setSubmitError("");
    try {
      const message = await createMutation.mutateAsync(normalized);
      setFormData(EMPTY_CLIENTE_FORM);
      setErrors({});
      onSuccess(message);
      onClose();
    } catch (err) {
      setSubmitError(extractErrorMessage(err) ?? "No se pudo guardar el cliente.");
    }
  };

  const loading = createMutation.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      className="max-w-md w-full max-h-[90vh] p-0 flex flex-col bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden"
      showCloseButton={false}
    >
      <Header onClose={handleClose} />

      <div className="p-6 bg-gray-50 dark:bg-gray-800 overflow-y-auto no-scrollbar">
        {submitError && (
          <div className="mb-5 flex items-center gap-2 rounded-xl bg-red-50 p-4 text-sm font-medium text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800/50">
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
            <FormField
              label="Nombre del Cliente"
              required
              value={formData.client_name}
              onChange={(v) => updateField("client_name", v)}
              error={errors.client_name}
              maxLength={100}
              placeholder="Ej. Juan Pérez"
            />
            <FormField
              label="Empresa"
              required
              value={formData.company_name}
              onChange={(v) => updateField("company_name", v)}
              error={errors.company_name}
              maxLength={100}
              placeholder="Ej. Acme Corp"
            />
            <FormField
              label="RNC (Opcional)"
              value={formData.rnc}
              onChange={(v) => updateField("rnc", v)}
              maxLength={100}
              placeholder="Ej. 130123456"
            />
            <FormField
              label="Email"
              required
              type="email"
              value={formData.email}
              onChange={(v) => updateField("email", v)}
              error={errors.email}
              maxLength={100}
              placeholder="Ej. juan@ejemplo.com"
            />
            <FormField
              label="Teléfono"
              required
              value={formData.phone_number}
              onChange={(v) => updateField("phone_number", v)}
              error={errors.phone_number}
              maxLength={20}
              placeholder="Ej. (809) 555-0198"
            />
          </div>

          <WelcomeEmailToggle
            checked={formData.sent_mail}
            onChange={(checked) => updateField("sent_mail", checked)}
          />

          <div className="pt-2 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading} className="px-5 py-2.5 shadow-sm">
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="px-5 py-2.5 shadow-md hover:shadow-lg transition-all flex items-center gap-2"
            >
              {loading ? "Guardando..." : "Guardar Cliente"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

function Header({ onClose }: { onClose: () => void }) {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4 relative">
      <h2 className="text-xl font-bold text-white">Crear Nuevo Cliente</h2>
      <p className="text-blue-100 text-sm mt-0.5">Ingresa los datos para el registro</p>
      <button
        type="button"
        onClick={onClose}
        className="absolute right-5 top-1/2 -translate-y-1/2 rounded-full p-1 text-white/70 hover:bg-white/10 hover:text-white transition-all"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
}

interface FormFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  maxLength?: number;
}

function FormField({ label, value, onChange, error, type = "text", placeholder, required, maxLength }: FormFieldProps) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        required={required}
        maxLength={maxLength}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`block w-full rounded-lg border py-2.5 px-3 text-sm focus:outline-none focus:ring-1 transition-colors dark:bg-gray-800 dark:text-white ${
          error
            ? "border-red-400 focus:border-red-500 focus:ring-red-300 dark:border-red-500"
            : "border-gray-300 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:focus:border-blue-400"
        }`}
      />
      {error && <p className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}

function WelcomeEmailToggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
      <label className="flex items-center justify-between cursor-pointer w-full">
        <span className="flex flex-col">
          <span className="text-sm font-semibold text-gray-900 dark:text-white">Correo de Bienvenida</span>
          <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Enviar un correo introduciendo nuestros servicios.
          </span>
        </span>
        <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <div className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${checked ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700"}`}>
          <div className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white border border-gray-300 shadow-sm transition-transform duration-200 ${checked ? "translate-x-5 border-white" : "translate-x-0"}`} />
        </div>
      </label>
    </div>
  );
}

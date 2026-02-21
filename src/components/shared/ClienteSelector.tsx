import { useState } from "react";
import type { Cliente } from "../../types";
import { getClientDisplayName } from "../../types";
import Button from "../ui/button/Button";

interface ClienteSelectorProps {
  clientes: Cliente[];
  loading: boolean;
  error?: string;
  selectedCliente: Cliente | null;
  onSelect: (cliente: Cliente) => void;
  onClear: () => void;
}

/**
 * Reusable client search & selection component.
 * Used in both Facturas and Cotizaciones creation flows.
 */
export default function ClienteSelector({
  clientes,
  loading,
  error,
  selectedCliente,
  onSelect,
  onClear,
}: ClienteSelectorProps) {
  const [query, setQuery] = useState("");

  if (selectedCliente) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 border-2 border-gray-200 dark:border-gray-700">
        <label className="mb-3 block text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <span className="text-blue-600 dark:text-blue-400">👤</span>
          Información del Cliente
        </label>
        <div className="rounded-xl border-2 border-green-300 bg-green-50/80 dark:bg-green-900/20 p-6 shadow-lg dark:border-green-700">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-xl font-bold text-gray-900 dark:text-white">
              {getClientDisplayName(selectedCliente)}
            </div>
            <Button size="sm" variant="outline" type="button" onClick={onClear} className="px-4 py-2 text-base">
              Cambiar
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InfoField label="Empresa" value={selectedCliente.company_name} />
            <InfoField label="RNC" value={selectedCliente.rnc} />
            <InfoField label="Email" value={selectedCliente.email} className="sm:col-span-2" />
            <InfoField
              label="Teléfono"
              value={selectedCliente.phone_number ?? selectedCliente.telefono}
              className="sm:col-span-2"
            />
          </div>
        </div>
      </div>
    );
  }

  const filtered = clientes.filter((c) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    const name = c.client_name ?? c.nombre ?? c.name ?? "";
    const company = c.company_name ?? "";
    const email = c.email ?? "";
    const phone = c.phone_number ?? c.telefono ?? "";
    return [name, company, email, phone].join(" ").toLowerCase().includes(q);
  });

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 border-2 border-gray-200 dark:border-gray-700">
      <label className="mb-3 block text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
        <span className="text-blue-600 dark:text-blue-400">👤</span>
        Información del Cliente
      </label>
      <div className="space-y-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="🔍 Escriba para buscar cliente por nombre, empresa, email o teléfono..."
          className="w-full rounded-lg border-2 border-gray-300 bg-white px-5 py-4 text-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white transition-all"
        />
        {query.trim().length > 0 && (
          <div className="max-h-64 overflow-y-auto rounded-xl border-2 border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-700 shadow-lg">
            {loading && (
              <div className="px-5 py-4 text-base font-medium text-gray-600 dark:text-gray-400">
                ⏳ Cargando clientes...
              </div>
            )}
            {!loading && error && (
              <div className="px-5 py-4 text-base font-medium text-red-600 dark:text-red-400">{error}</div>
            )}
            {!loading && !error && (
              <ul className="divide-y divide-gray-200 dark:divide-gray-600">
                {filtered.map((c) => {
                  const name = getClientDisplayName(c);
                  return (
                    <li
                      key={c.id}
                      className="cursor-pointer px-5 py-4 text-base hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                      onClick={() => onSelect(c)}
                    >
                      <div className="font-medium text-gray-800 dark:text-white">{name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {c.company_name ?? ""} {c.email ? `• ${c.email}` : ""}{" "}
                        {c.phone_number ? `• ${c.phone_number}` : ""}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoField({ label, value, className = "" }: { label: string; value?: string; className?: string }) {
  return (
    <div className={className}>
      <div className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</div>
      <div className="text-base font-medium text-gray-900 dark:text-white">{value ?? "—"}</div>
    </div>
  );
}

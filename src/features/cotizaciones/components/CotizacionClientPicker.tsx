import { useState } from "react";
import Button from "@/shared/components/ui/Button";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { useClientesQuery } from "@/features/clientes/hooks/useClientesQuery";
import { getClientDisplayName, getClientPhone, type Cliente } from "@/features/clientes/types";

interface CotizacionClientPickerProps {
  selectedCliente: Cliente | null;
  onSelect: (cliente: Cliente) => void;
  onClear: () => void;
}

/**
 * Inline client-search picker tailored for the cotización modal:
 * fetches with debounced query, shows a dropdown of matches.
 */
export function CotizacionClientPicker({ selectedCliente, onSelect, onClear }: CotizacionClientPickerProps) {
  const [query, setQuery] = useState("");
  const [showOptions, setShowOptions] = useState(false);
  const debouncedQuery = useDebounce(query, 400);

  const { data, isLoading, error } = useClientesQuery({
    query: debouncedQuery,
    enabled: debouncedQuery.trim().length > 0,
  });
  const clientes = data?.items ?? [];

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-4 border border-gray-200 dark:border-gray-700">
      <label className="mb-2 text-base font-semibold text-gray-800 dark:text-gray-100">
        Información del Cliente
      </label>

      {!selectedCliente && (
        <div className="space-y-2">
          <input
            type="text"
            autoComplete="off"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowOptions(e.target.value.trim().length > 0);
            }}
            placeholder="Buscar cliente por nombre, empresa, email o teléfono..."
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-base outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white transition-all"
          />
          {showOptions && query.trim().length > 0 && (
            <div className="max-h-48 overflow-y-auto rounded-md border border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-700 shadow-md">
              {isLoading && (
                <div className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400">Cargando clientes...</div>
              )}
              {!isLoading && error && (
                <div className="px-3 py-2 text-sm text-red-600 dark:text-red-400">
                  {error instanceof Error ? error.message : String(error)}
                </div>
              )}
              {!isLoading && !error && (
                <ul className="divide-y divide-gray-200 dark:divide-gray-600">
                  {clientes.map((c) => (
                    <li
                      key={c.id}
                      className="cursor-pointer px-3 py-2 hover:bg-blue-50 dark:hover:bg-gray-600 transition-colors"
                      onClick={() => {
                        onSelect(c);
                        setShowOptions(false);
                      }}
                    >
                      <div className="font-medium text-sm text-gray-900 dark:text-white">{getClientDisplayName(c)}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {c.company_name ?? ""} {c.email ? `• ${c.email}` : ""} {c.phone_number ? `• ${c.phone_number}` : ""}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      {selectedCliente && (
        <div className="rounded-md border border-green-300 bg-green-50 dark:bg-green-900/20 p-4 dark:border-green-700">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <div className="text-base font-medium text-gray-900 dark:text-white">{getClientDisplayName(selectedCliente)}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{selectedCliente.company_name ?? "Sin empresa"}</div>
            </div>
            <Button
              size="sm"
              variant="outline"
              type="button"
              onClick={() => {
                onClear();
                setShowOptions(true);
              }}
              className="px-3 py-1 text-sm"
            >
              Cambiar
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div>
              <div className="text-xs font-medium text-gray-600 dark:text-gray-400">Email</div>
              <div className="text-sm text-gray-900 dark:text-white">{selectedCliente.email ?? "—"}</div>
            </div>
            <div>
              <div className="text-xs font-medium text-gray-600 dark:text-gray-400">Teléfono</div>
              <div className="text-sm text-gray-900 dark:text-white">{getClientPhone(selectedCliente) ?? "—"}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

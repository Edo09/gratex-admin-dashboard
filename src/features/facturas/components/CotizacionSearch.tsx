import type { Cotizacion, CotizacionLegacy } from "@/features/cotizaciones/types";

interface CotizacionSearchProps {
  cotizaciones: Cotizacion[];
  loading: boolean;
  error?: string;
  query: string;
  onQueryChange: (q: string) => void;
  onSelect: (cot: Cotizacion) => void;
}

export function CotizacionSearch({
  cotizaciones,
  loading,
  error,
  query,
  onQueryChange,
  onSelect,
}: CotizacionSearchProps) {
  return (
    <div className="mb-3">
      <label className="mb-2 text-base font-medium text-gray-800 dark:text-gray-100 flex items-center gap-2">
        <span className="text-blue-600 dark:text-blue-400">🔍</span> Buscar Cotización
      </label>
      <input
        type="text"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="Buscar por código, cliente o descripción..."
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-base outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white transition-all"
      />
      {query.trim() && !loading && !error && cotizaciones.length > 0 && (
        <div className="max-h-72 overflow-y-auto mt-2 rounded-md border border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-700 shadow-md divide-y divide-gray-200 dark:divide-gray-600">
          {cotizaciones.map((c) => (
            <ResultRow key={c.id} cot={c as CotizacionLegacy} onSelect={() => onSelect(c)} />
          ))}
        </div>
      )}
      {query.trim() && !loading && !error && cotizaciones.length === 0 && (
        <div className="px-3 py-3 mt-2 text-sm text-gray-500 dark:text-gray-400 text-center rounded-md border border-gray-200 dark:border-gray-600">
          No se encontraron cotizaciones
        </div>
      )}
      {loading && (
        <div className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400">Cargando cotizaciones...</div>
      )}
      {error && <div className="px-3 py-2 text-sm text-red-600 dark:text-red-400">{error}</div>}
    </div>
  );
}

function ResultRow({ cot, onSelect }: { cot: CotizacionLegacy; onSelect: () => void }) {
  const code = cot.code ?? cot.codigo ?? `Cotización ${cot.id}`;
  const client = cot.client_name ?? cot.cliente ?? "";
  const monto = cot.total ?? cot.amount ?? cot.monto ?? "";
  const desc = cot.description ?? cot.descripcion ?? "";
  let date = cot.date ?? cot.fecha ?? "";
  if (typeof date === "string" && date.length > 10) date = date.slice(0, 10);

  return (
    <div
      className="px-4 py-3 cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-600 transition-colors"
      onClick={onSelect}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">{code}</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">{date}</span>
        </div>
        {monto && (
          <span className="text-sm font-medium text-green-700 dark:text-green-400">${monto}</span>
        )}
      </div>
      {client && <div className="text-sm text-gray-700 dark:text-gray-300">{client}</div>}
      {desc && <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{desc}</div>}
    </div>
  );
}

import type { Cotizacion, CotizacionLegacy, CotizacionTableRow } from "./types";
import type { DataListRow } from "@/shared/components/data/useDataListController";

/**
 * Map a raw Cotizacion (which may use a legacy field name like `fecha`,
 * `cliente`, or `descripcion`) into the row shape used by tables/cards.
 */
export function cotizacionToRowMapper(item: Cotizacion | CotizacionLegacy, index: number): CotizacionTableRow {
  const legacy = item as CotizacionLegacy;

  let description = legacy.description ?? legacy.descripcion ?? "";
  if (!description && Array.isArray(legacy.items) && legacy.items.length > 0) {
    description = legacy.items.map((it) => it.description || "(Sin descripción)").join("\n");
  }

  const totalValue = String(legacy.total ?? legacy.amount ?? legacy.monto ?? "");

  return {
    id: legacy.id ?? index + 1,
    date: legacy.date ?? legacy.fecha ?? "",
    code: legacy.code ?? legacy.codigo ?? "",
    client: legacy.client_name ?? legacy.cliente ?? "",
    company_name: legacy.company_name ?? "",
    description,
    amount: totalValue,
    total: totalValue,
  };
}

/** Convert a CotizacionTableRow into the generic DataListRow used by the shared lists. */
export function rowToDataListRow(row: CotizacionTableRow): DataListRow {
  return {
    id: row.id,
    date: row.date,
    code: row.code,
    client: row.client,
    company_name: row.company_name,
    description: row.description,
    amount: row.amount,
    total: row.total,
  };
}

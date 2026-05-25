import type { Factura, FacturaTableRow } from "./types";
import type { DataListRow } from "@/shared/components/data/useDataListController";

export function facturaToRow(item: Factura, index: number): FacturaTableRow {
  return {
    id: item.id ?? index + 1,
    no_factura: item.no_factura ?? "",
    date: item.date ?? "",
    client_name: item.client_name ?? "",
    company_name: item.company_name ?? "",
    total: String(item.total ?? ""),
    ncf: item.NCF ?? "",
    description: item.description ?? "",
    amount: String(item.amount ?? item.total ?? ""),
  };
}

export function rowToDataListRow(row: FacturaTableRow): DataListRow {
  return {
    id: row.id,
    no_factura: row.no_factura,
    date: row.date,
    client_name: row.client_name,
    company_name: row.company_name,
    total: row.total,
    ncf: row.ncf,
    description: row.description,
    amount: row.amount,
  };
}

import type { Gasto, GastoItem } from "./types";

export function toNum(v: string | number | null | undefined): number {
  if (v == null) return 0;
  const n = typeof v === "string" ? parseFloat(v) : Number(v);
  return isNaN(n) ? 0 : n;
}

export function parseGastoAmount(g: Gasto): number {
  return toNum(g.total) || toNum(g.subtotal) + toNum(g.itbis);
}

export function getItemDescription(it: GastoItem): string {
  return it.description ?? "";
}

export function getGastoDescription(g: Gasto): string {
  const items = Array.isArray(g.items) ? g.items : [];
  const names = items.map(getItemDescription).filter((s) => s && s.trim());
  return names.length > 0 ? names.join(" · ") : "—";
}

export function getGastoNcf(g: Gasto): string {
  return g.ncf?.trim() || `#${g.id}`;
}

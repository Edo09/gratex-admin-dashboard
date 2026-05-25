import type { ApiResponse, ListResult } from "./types";

/**
 * Normalizes list payloads. The backend sometimes returns:
 *   { data: T[], pagination: {...} }    (preferred)
 *   { data: { items: T[] } }            (legacy)
 *   { data: { data: T[] } }             (legacy paginated wrapper)
 *   { data: T[] }                       (no pagination)
 *
 * This helper hides those shapes from feature code.
 */
export function unwrapList<T>(response: ApiResponse<unknown>): ListResult<T> {
  const raw = response.data;
  let items: T[] = [];

  if (Array.isArray(raw)) {
    items = raw as T[];
  } else if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.items)) items = obj.items as T[];
    else if (Array.isArray(obj.data)) items = obj.data as T[];
  }

  return { items, pagination: response.pagination };
}

/**
 * Normalizes a single-record payload. Some endpoints (`/x?id=N`) return arrays
 * even when called with an id; this finds the matching record.
 */
export function unwrapOne<T extends { id: number | string }>(
  response: ApiResponse<unknown>,
  id?: number | string,
): T | null {
  const raw = response.data;
  if (raw == null) return null;

  if (Array.isArray(raw)) {
    if (id !== undefined) {
      const found = (raw as T[]).find((item) => item.id == id);
      if (found) return found;
    }
    return (raw[0] as T) ?? null;
  }

  if (typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.data)) {
      const list = obj.data as T[];
      if (id !== undefined) {
        const found = list.find((item) => item.id == id);
        if (found) return found;
      }
      return list[0] ?? null;
    }
    return raw as T;
  }

  return null;
}

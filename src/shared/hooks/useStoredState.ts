import { useEffect, useState } from "react";

/**
 * useState that persists its value in localStorage under `key`.
 * Falls back to `initial` if storage is empty, unparseable, or unavailable.
 */
export function useStoredState<T>(key: string, initial: T): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return initial;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw == null) return initial;
      return JSON.parse(raw) as T;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore quota/serialization errors — non-critical.
    }
  }, [key, value]);

  return [value, setValue];
}

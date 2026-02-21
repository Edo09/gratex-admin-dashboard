import { useCallback } from "react";
import { useAuth } from "../context/AuthContext";

/**
 * Hook for fetching the next NCF (Número de Comprobante Fiscal).
 * Single Responsibility: NCF sequence retrieval.
 */
export function useNcf() {
  const { token } = useAuth();

  const fetchNextNCF = useCallback(async (): Promise<string> => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/ncf/next`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data: { status: boolean; data?: string } = await res.json();
      if (data.status && data.data) {
        return data.data;
      }
    } catch (error) {
      console.error("Error fetching next NCF:", error);
    }
    return "";
  }, [token]);

  return { fetchNextNCF };
}

import { useCallback } from "react";
import { cotizacionesApi } from "../api/cotizaciones";
import { openPdfFromBase64, pickPdfBase64 } from "@/shared/lib/pdf";

export function useCotizacionPdf() {
  const openSavedPdf = useCallback(async (id: number) => {
    const response = await cotizacionesApi.pdf(id);
    const base64 = pickPdfBase64(response);
    if (base64) openPdfFromBase64(base64);
    else console.error("PDF response is not valid base64", response);
  }, []);

  return { openSavedPdf };
}

import { useCallback } from "react";
import { cotizacionesApi } from "../api/cotizaciones";
import { downloadPdfFromBase64, openPdfFromBase64, pickPdfBase64 } from "@/shared/lib/pdf";
import type { PreviewCotizacionPayload } from "../types";

export function useCotizacionPdf() {
  const openSavedPdf = useCallback(async (id: number) => {
    const response = await cotizacionesApi.pdf(id);
    const base64 = pickPdfBase64(response);
    if (base64) openPdfFromBase64(base64);
    else console.error("PDF response is not valid base64", response);
  }, []);

  /** Force a file-download of the saved PDF instead of opening it inline. */
  const downloadSavedPdf = useCallback(async (id: number, filename: string) => {
    const response = await cotizacionesApi.pdf(id);
    const base64 = pickPdfBase64(response);
    if (base64) downloadPdfFromBase64(base64, filename);
    else console.error("PDF response is not valid base64", response);
  }, []);

  /**
   * Hits the /cotizaciones/preview endpoint with the in-progress draft and
   * opens the returned PDF in a new tab. Used before save to let the user
   * sanity-check the layout.
   */
  const previewDraft = useCallback(async (payload: PreviewCotizacionPayload) => {
    const result = await cotizacionesApi.preview(payload);
    const base64 = pickPdfBase64(result.data);
    if (base64) openPdfFromBase64(base64);
    else console.error("Preview response did not contain a valid PDF base64 string.", result);
  }, []);

  return { openSavedPdf, downloadSavedPdf, previewDraft };
}

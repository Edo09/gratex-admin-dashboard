import { useCallback } from "react";
import { facturasApi } from "../api/facturas";
import { openPdfFromBase64, pickPdfBase64 } from "@/shared/lib/pdf";
import type { PreviewFacturaPayload } from "../types";

export function useFacturaPdf() {
  const openSavedPdf = useCallback(async (id: number) => {
    const response = await facturasApi.pdf(id);
    const base64 = pickPdfBase64(response);
    if (base64) openPdfFromBase64(base64);
    else console.error("PDF response is not valid base64", response);
  }, []);

  /**
   * Hits /facturas/preview with the in-progress draft and opens the returned
   * PDF in a new tab.
   */
  const previewDraft = useCallback(async (payload: PreviewFacturaPayload) => {
    const result = await facturasApi.preview(payload);
    const base64 = pickPdfBase64(result.data);
    if (base64) openPdfFromBase64(base64);
    else console.error("Preview response did not contain a valid PDF base64 string.", result);
  }, []);

  return { openSavedPdf, previewDraft };
}

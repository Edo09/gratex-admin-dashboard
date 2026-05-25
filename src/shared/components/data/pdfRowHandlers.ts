import { openPdfFromBase64, pickPdfBase64 } from "@/shared/lib/pdf";
import { facturasApi } from "@/features/facturas/api/facturas";
import { cotizacionesApi } from "@/features/cotizaciones/api/cotizaciones";

export type DataKind = "cotizaciones" | "facturas";

/**
 * Fetch the PDF for a row and open it in a new tab.
 * Encapsulates the "click a row → open the PDF" behavior that both the
 * cards list and table use as a fallback when no explicit onRowClick is set.
 */
export async function openRowPdf(dataKind: DataKind, id: number): Promise<void> {
  const response =
    dataKind === "facturas" ? await facturasApi.pdf(id) : await cotizacionesApi.pdf(id);
  const base64 = pickPdfBase64(response);
  if (!base64) {
    console.error("Invalid PDF response format", response);
    alert("Formato de PDF invalido");
    return;
  }
  openPdfFromBase64(base64);
}

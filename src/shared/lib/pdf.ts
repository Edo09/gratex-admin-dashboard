/** Convert a base64 string to a Blob URL for a PDF. Caller owns the URL. */
export function base64ToPdfBlobUrl(base64: string): string {
  const byteCharacters = atob(base64);
  const bytes = new Uint8Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    bytes[i] = byteCharacters.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: "application/pdf" });
  return URL.createObjectURL(blob);
}

/** Open a PDF (provided as a base64 string) in a new browser tab. */
export function openPdfFromBase64(base64: string): void {
  const url = base64ToPdfBlobUrl(base64);
  window.open(url, "_blank");
}

/** Trigger a file-download for a PDF (provided as a base64 string). */
export function downloadPdfFromBase64(base64: string, filename: string): void {
  const url = base64ToPdfBlobUrl(base64);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Defer revoking the blob URL so the browser has time to fetch it.
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Pull the base64 PDF string out of any of the response shapes the API
 * uses (`{ data: { content } }`, `{ content }`, `{ data: { pdf } }`,
 * `{ pdf }`, or a raw string).
 */
export function pickPdfBase64(input: unknown): string | null {
  if (!input) return null;
  if (typeof input === "string") return input || null;

  if (typeof input === "object") {
    const obj = input as Record<string, unknown>;
    if (typeof obj.content === "string") return obj.content;
    if (typeof obj.pdf === "string") return obj.pdf;
    if (obj.data && typeof obj.data === "object") {
      const inner = obj.data as Record<string, unknown>;
      if (typeof inner.content === "string") return inner.content;
      if (typeof inner.pdf === "string") return inner.pdf;
    }
    if (typeof obj.data === "string") return obj.data;
  }
  return null;
}

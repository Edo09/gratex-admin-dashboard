/** Pulls a human-readable error message out of a response body or thrown error. */
export function extractErrorMessage(input: unknown): string | undefined {
  if (input == null) return undefined;
  if (typeof input === "string" && input.trim()) return input;

  if (input instanceof Error && input.message) return input.message;

  if (typeof input !== "object") return undefined;
  const candidate = input as { message?: unknown; error?: unknown; data?: unknown };

  if (typeof candidate.message === "string" && candidate.message.trim()) return candidate.message;
  if (typeof candidate.error === "string" && candidate.error.trim()) return candidate.error;

  if (candidate.data && typeof candidate.data === "object") {
    const nested = candidate.data as { message?: unknown; error?: unknown };
    if (typeof nested.message === "string" && nested.message.trim()) return nested.message;
    if (typeof nested.error === "string" && nested.error.trim()) return nested.error;
  }
  if (typeof candidate.data === "string" && candidate.data.trim()) return candidate.data;

  return undefined;
}

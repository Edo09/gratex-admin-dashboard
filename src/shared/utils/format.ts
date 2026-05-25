/** Format a number or numeric string as currency: "$33,040.00". */
export function formatCurrency(value: number | string | null | undefined): string {
  const num = typeof value === "string" ? parseFloat(value) : (value ?? 0);
  if (isNaN(num)) return "$0.00";
  return (
    "$" +
    num.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

/** Format a date string ("yyyy-MM-dd" or "yyyy-MM-dd HH:mm:ss") as "dd/MM/yyyy". */
export function formatDisplayDate(date: string | null | undefined): string {
  if (!date) return "";
  const datePart = date.split(" ")[0];
  const [y, m, d] = datePart.split("-");
  if (!y || !m || !d) return date;
  return `${d}/${m}/${y}`;
}

/** Today's date in "yyyy-MM-dd". */
export function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

/** Extracts the "yyyy-MM-dd" portion of an arbitrary date string. */
export function toIsoDateOnly(date: string | null | undefined): string {
  if (!date) return getTodayDate();
  const datePart = date.split(" ")[0];
  return /^\d{4}-\d{2}-\d{2}$/.test(datePart) ? datePart : getTodayDate();
}

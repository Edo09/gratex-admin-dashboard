/** Formatters for the Press design direction (matches new-design/data.ts `fmt`). */
export const fmt = {
  money: (n: number): string =>
    "$" + n.toLocaleString("es-DO", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  moneyK: (n: number): string => "$" + Math.round(n / 1000).toLocaleString("es-DO") + "k",
  /** Número completo con separadores, sin centavos ni sufijo: "$13,718,000". */
  moneyFull: (n: number): string => "$" + Math.round(n).toLocaleString("es-DO"),
  num: (n: number): string => n.toLocaleString("es-DO"),
};

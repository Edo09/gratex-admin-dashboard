export type PressStatus =
  | "Aprobada"
  | "Pagada"
  | "Pendiente"
  | "Enviada"
  | "Vencida"
  | "Rechazada";

export type PillTone = "good" | "warn" | "bad" | "neutral";

const TONE_BY_STATUS: Record<PressStatus, PillTone> = {
  Aprobada: "good",
  Pagada: "good",
  Pendiente: "warn",
  Enviada: "neutral",
  Vencida: "bad",
  Rechazada: "bad",
};

interface PillProps {
  status: PressStatus;
}

export function Pill({ status }: PillProps) {
  const tone = TONE_BY_STATUS[status];
  return (
    <span className={`pill ${tone}`}>
      <span className="dot" />
      {status}
    </span>
  );
}

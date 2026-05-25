import { useEffect, useState } from "react";

const DOW = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function formatHeaderDate(d: Date): string {
  const dow = DOW[d.getDay()];
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const time = d.toLocaleTimeString("es-DO", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  return `${dow} ${dd}.${mm}.${yyyy} · Sesión ${time}`;
}

/** Live "Lun 18.05.2026 · Sesión 14:32:09" clock used as the dashboard sub-title. */
export function DashboardDateLine() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return <div className="page-sub">{formatHeaderDate(now)}</div>;
}

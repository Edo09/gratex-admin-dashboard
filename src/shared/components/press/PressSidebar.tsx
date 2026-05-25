import { Link, useLocation } from "react-router-dom";
import { RegMark } from "./RegMark";
import { useDashboardClientCount, useDashboardCotizacionCount } from "@/features/dashboard/hooks/useDashboardData";
import { useFacturasQuery } from "@/features/facturas/hooks/useFacturasQuery";
import { useAuth } from "@/features/auth/hooks/useAuth";

interface NavItem {
  to: string;
  n: string;
  label: string;
  badge?: number;
}

function initialsOf(name?: string, username?: string): string {
  const source = (name ?? username ?? "").trim();
  if (!source) return "··";
  const parts = source.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function PressSidebar() {
  const location = useLocation();
  const { user } = useAuth();

  // Badge counts come from cheap queries already used elsewhere on the dashboard;
  // they share React Query's cache so this is essentially free.
  const { data: clientesCount } = useDashboardClientCount();
  const { data: cotizacionesCount } = useDashboardCotizacionCount();
  const { data: facturasResult } = useFacturasQuery({ page: 1, pageSize: 1 });
  const facturasCount = facturasResult?.pagination?.total;

  const items: NavItem[] = [
    { to: "/", n: "01", label: "Dashboard" },
    { to: "/cotizaciones", n: "02", label: "Cotizaciones", badge: cotizacionesCount },
    { to: "/facturas", n: "03", label: "Facturas", badge: facturasCount },
    { to: "/clientes", n: "04", label: "Clientes", badge: clientesCount },
    { to: "/ncf", n: "05", label: "NCF" },
    { to: "/configuracion", n: "06", label: "Configuración" },
  ];

  const isActive = (to: string) =>
    to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);

  return (
    <aside className="sidebar">
      <div className="brand">
        <RegMark />
        <div className="brand-text">
          <div className="brand-name">GRATEX</div>
          <div className="brand-sub">Taller · Imp.</div>
        </div>
      </div>
      <div className="nav-h">Menú</div>
      {items.map((it) => (
        <Link
          key={it.to}
          to={it.to}
          className={"nav-item" + (isActive(it.to) ? " active" : "")}
        >
          <span className="nav-num">{it.n}</span>
          <span>{it.label}</span>
          {it.badge !== undefined && <span className="nav-badge">{it.badge}</span>}
        </Link>
      ))}
      <div className="sidebar-foot">
        <div className="nav-h">Sesión</div>
        <div className="user-row">
          <div className="avatar">{initialsOf(user?.name, user?.username)}</div>
          <div>
            <div className="user-name">{user?.name ?? user?.username ?? "Sesión"}</div>
            <div className="user-role">{(user?.role ?? "Administrador").toUpperCase()}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

import type { ReactElement } from "react";
import { Link, useLocation } from "react-router-dom";
import { useDashboardClientCount, useDashboardCotizacionCount } from "@/features/dashboard/hooks/useDashboardData";
import { useFacturasQuery } from "@/features/facturas/hooks/useFacturasQuery";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Icons } from "./PressIcons";

interface NavItem {
  to: string;
  icon: ReactElement;
  label: string;
  badge?: number;
}

const ICON_SIZE = 16;

function initialsOf(name?: string, username?: string): string {
  const source = (name ?? username ?? "").trim();
  if (!source) return "··";
  const parts = source.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface PressSidebarProps {
  onClose?: () => void;
}

export function PressSidebar({ onClose }: PressSidebarProps) {
  const location = useLocation();
  const { user, logout } = useAuth();

  const { data: clientesCount } = useDashboardClientCount();
  const { data: cotizacionesCount } = useDashboardCotizacionCount();
  const { data: facturasResult } = useFacturasQuery({ page: 1, pageSize: 1 });
  const facturasCount = facturasResult?.pagination?.total;

  const items: NavItem[] = [
    { to: "/", icon: <Icons.dashboard size={ICON_SIZE} />, label: "Dashboard" },
    { to: "/cotizaciones", icon: <Icons.fileText size={ICON_SIZE} />, label: "Cotizaciones", badge: cotizacionesCount },
    { to: "/facturas", icon: <Icons.receipt size={ICON_SIZE} />, label: "Facturas", badge: facturasCount },
    { to: "/clientes", icon: <Icons.users size={ICON_SIZE} />, label: "Clientes", badge: clientesCount },
    { to: "/ncf", icon: <Icons.hash size={ICON_SIZE} />, label: "NCF" },
    { to: "/configuracion", icon: <Icons.settings size={ICON_SIZE} />, label: "Configuración" },
  ];

  const isActive = (to: string) =>
    to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <Link to="/" className="brand" onClick={onClose}>
          <img
            className="brand-logo"
            src="/admin/images/logo/logo-gratex-gray.svg"
            alt="Gratex"
          />
        </Link>
        <button className="sidebar-close" onClick={onClose} aria-label="Cerrar menú">
          <Icons.close size={16} />
        </button>
      </div>

      <div className="nav-h">Menú</div>
      {items.map((it) => (
        <Link
          key={it.to}
          to={it.to}
          className={"nav-item" + (isActive(it.to) ? " active" : "")}
          onClick={onClose}
        >
          <span className="nav-icon">{it.icon}</span>
          <span>{it.label}</span>
          {it.badge !== undefined && <span className="nav-badge">{it.badge}</span>}
        </Link>
      ))}
      <div className="sidebar-foot">
        <a
          href="https://gratex.net/"
          target="_blank"
          rel="noreferrer"
          className="sidebar-cta"
          onClick={onClose}
        >
          <Icons.external size={13} />
          <span>Ver sitio</span>
        </a>

        <div className="nav-h">Sesión</div>
        <div className="user-row">
          <div className="avatar">{initialsOf(user?.name, user?.username)}</div>
          <div>
            <div className="user-name">{user?.name ?? user?.username ?? "Sesión"}</div>
            <div className="user-role">{(user?.role ?? "Administrador").toUpperCase()}</div>
          </div>
        </div>
        <button
          type="button"
          className="btn-ghost"
          onClick={logout}
          style={{
            width: "100%",
            justifyContent: "center",
            fontSize: 11,
            color: "var(--muted)",
            padding: "6px 0",
            marginTop: 6,
            gap: 6,
          }}
        >
          <Icons.logout size={13} /> Cerrar sesión
        </button>
      </div>
    </aside>
  );
}

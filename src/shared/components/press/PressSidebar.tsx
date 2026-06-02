import type { ReactElement } from "react";
import { Link, useLocation } from "react-router-dom";
import { useDashboardClientCount, useDashboardCotizacionCount } from "@/features/dashboard/hooks/useDashboardData";
import { useFacturasQuery } from "@/features/facturas/hooks/useFacturasQuery";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useTheme } from "@/shared/context/ThemeContext";
import { ComprobanteBadge, type ComprobanteType } from "@/shared/components/ui/ComprobanteBadge";
import { Icons } from "./PressIcons";

interface NavItem {
  to: string;
  icon: ReactElement;
  label: string;
  badge?: number;
  /** Renders an e-CF / NCF pill in the item's trailing slot. */
  tag?: ComprobanteType;
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
  const { theme, toggleTheme } = useTheme();

  const { data: clientesCount } = useDashboardClientCount();
  const { data: cotizacionesCount } = useDashboardCotizacionCount();
  const { data: facturasResult } = useFacturasQuery({ page: 1, pageSize: 1 });
  const facturasCount = facturasResult?.pagination?.total;

  const items: NavItem[] = [
    { to: "/", icon: <Icons.dashboard size={ICON_SIZE} />, label: "Dashboard" },
    { to: "/cotizaciones", icon: <Icons.fileText size={ICON_SIZE} />, label: "Cotizaciones", badge: cotizacionesCount },
    { to: "/facturas", icon: <Icons.receipt size={ICON_SIZE} />, label: "Facturas", badge: facturasCount, tag: "ecf" },
    { to: "/facturas-ncf", icon: <Icons.receipt size={ICON_SIZE} />, label: "Facturas", tag: "ncf" },
    { to: "/clientes", icon: <Icons.users size={ICON_SIZE} />, label: "Clientes", badge: clientesCount },
    { to: "/comprobantes", icon: <Icons.hash size={ICON_SIZE} />, label: "Comprobantes" },
    { to: "/configuracion", icon: <Icons.settings size={ICON_SIZE} />, label: "Configuración" },
  ];

  const isActive = (to: string) =>
    to === "/"
      ? location.pathname === "/"
      : location.pathname === to || location.pathname.startsWith(`${to}/`);

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <Link to="/" className="brand" onClick={onClose}>
          <img
            className="brand-logo"
            src={`/admin/images/logo/logo-gratex-${theme === "dark" ? "white" : "gray"}.svg`}
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
          {it.tag ? (
            <ComprobanteBadge type={it.tag} size={9} style={{ padding: "1px 6px" }} />
          ) : (
            it.badge !== undefined && <span className="nav-badge">{it.badge}</span>
          )}
        </Link>
      ))}
      <div className="sidebar-foot">
        <div className="sidebar-cta-row">
          <a
            href="https://gratex.net/"
            target="_blank"
            rel="noreferrer"
            className="sidebar-cta"
            onClick={onClose}
          >
            <Icons.external size={12} />
            <span>Ver sitio</span>
          </a>

          <button
            type="button"
            className="sidebar-cta sidebar-cta-icon"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Activar modo claro" : "Activar modo oscuro"}
            title={theme === "dark" ? "Modo claro" : "Modo oscuro"}
          >
            {theme === "dark" ? <Icons.sun size={16} /> : <Icons.moon size={16} />}
          </button>
        </div>

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

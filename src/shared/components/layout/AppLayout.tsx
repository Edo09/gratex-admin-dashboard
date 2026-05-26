import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { PressSidebar } from "@/shared/components/press/PressSidebar";
import { Icons } from "@/shared/components/press/PressIcons";

export function AppLayout() {
  const { pathname } = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const close = () => setSidebarOpen(false);

  return (
    <div className={`app${sidebarOpen ? " sidebar-open" : ""}`}>
      <PressSidebar onClose={close} />
      {sidebarOpen && <div className="sidebar-overlay" onClick={close} />}
      <div className="main" key={pathname}>
        <button className="hamburger" onClick={() => setSidebarOpen(true)} aria-label="Abrir menú">
          <Icons.menu size={20} />
        </button>
        <div className="anim-in">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

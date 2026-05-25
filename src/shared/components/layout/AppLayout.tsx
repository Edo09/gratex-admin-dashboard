import { Outlet, useLocation } from "react-router-dom";
import { PressSidebar } from "@/shared/components/press/PressSidebar";
import { PressTopbar } from "@/shared/components/press/PressTopbar";

/**
 * Press direction layout — CMYK chrome around every authenticated screen.
 * The `.app` / `.sidebar` / `.main` class names come from design-system.css.
 * `key={pathname}` retriggers the slide-up anim on route change.
 */
export function AppLayout() {
  const { pathname } = useLocation();

  return (
    <div className="app">
      <PressSidebar />
      <div className="main" key={pathname}>
        <PressTopbar />
        <div className="anim-in">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

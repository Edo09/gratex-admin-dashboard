import { useSidebar } from "@/shared/context/SidebarContext";

export function Backdrop() {
  const { isMobileOpen, toggleMobileSidebar } = useSidebar();

  if (!isMobileOpen) return null;

  return (
    <div
      className="fixed inset-0 z-40 bg-gray-900/50 lg:hidden"
      onClick={toggleMobileSidebar}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") toggleMobileSidebar();
      }}
      role="button"
      tabIndex={0}
      aria-label="Close sidebar"
    />
  );
}

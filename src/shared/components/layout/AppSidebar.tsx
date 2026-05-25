import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ChevronDownIcon,
  GridIcon,
  HorizontaLDots,
  ListIcon,
  PageIcon,
  UserCircleIcon,
} from "@/icons";
import { useSidebar } from "@/shared/context/SidebarContext";

interface NavSubItem {
  name: string;
  path: string;
  pro?: boolean;
  new?: boolean;
}

interface NavItem {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: NavSubItem[];
}

const navItems: NavItem[] = [
  { icon: <GridIcon />, name: "Dashboard", path: "/" },
  { path: "/cotizaciones", icon: <PageIcon />, name: "Cotizaciones" },
  { path: "/facturas", icon: <ListIcon />, name: "Facturas" },
  { icon: <UserCircleIcon />, name: "Clientes", path: "/clientes" },
  { path: "/ncf", icon: <ListIcon />, name: "NCF" },
  { path: "/configuracion", icon: <GridIcon />, name: "Configuracion" },
];

export function AppSidebar() {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();

  const [openSubmenu, setOpenSubmenu] = useState<number | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<number, number>>({});
  const subMenuRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const isActive = useCallback((path: string) => location.pathname === path, [location.pathname]);

  useEffect(() => {
    let matched = false;
    navItems.forEach((nav, index) => {
      nav.subItems?.forEach((subItem) => {
        if (isActive(subItem.path)) {
          setOpenSubmenu(index);
          matched = true;
        }
      });
    });
    if (!matched) setOpenSubmenu(null);
  }, [location, isActive]);

  useEffect(() => {
    if (openSubmenu !== null && subMenuRefs.current[openSubmenu]) {
      setSubMenuHeight((prev) => ({
        ...prev,
        [openSubmenu]: subMenuRefs.current[openSubmenu]?.scrollHeight ?? 0,
      }));
    }
  }, [openSubmenu]);

  const showLabels = isExpanded || isHovered || isMobileOpen;

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 ${
        isExpanded || isMobileOpen || isHovered ? "w-[230px]" : "w-[90px]"
      } ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`py-8 flex ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"}`}>
        <Link to="/">
          {showLabels ? (
            <>
              <img className="dark:hidden" src="/admin/images/logo/logo-gratex-gray.svg" alt="Logo" width={150} height={40} />
              <img className="hidden dark:block" src="/admin/images/logo/logo-gratex-white.svg" alt="Logo" width={150} height={40} />
            </>
          ) : (
            <img src="/admin/images/logo/logo-icon.png" alt="Logo" width={32} height={32} />
          )}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2 className={`mb-4 text-sm font-bold uppercase flex leading-[20px] text-gray-500 dark:text-gray-400 ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"}`}>
                {showLabels ? "Menu" : <HorizontaLDots className="size-6" />}
              </h2>
              <ul className="flex flex-col gap-4">
                {navItems.map((nav, index) => (
                  <SidebarItem
                    key={nav.name}
                    nav={nav}
                    index={index}
                    isActive={isActive}
                    showLabels={showLabels}
                    openSubmenu={openSubmenu}
                    onToggleSubmenu={(i) => setOpenSubmenu((prev) => (prev === i ? null : i))}
                    subMenuHeight={subMenuHeight}
                    subMenuRefs={subMenuRefs}
                  />
                ))}
              </ul>
            </div>
          </div>
        </nav>
      </div>
    </aside>
  );
}

interface SidebarItemProps {
  nav: NavItem;
  index: number;
  isActive: (path: string) => boolean;
  showLabels: boolean;
  openSubmenu: number | null;
  onToggleSubmenu: (index: number) => void;
  subMenuHeight: Record<number, number>;
  subMenuRefs: React.MutableRefObject<Record<number, HTMLDivElement | null>>;
}

function SidebarItem({
  nav,
  index,
  isActive,
  showLabels,
  openSubmenu,
  onToggleSubmenu,
  subMenuHeight,
  subMenuRefs,
}: SidebarItemProps) {
  const isOpen = openSubmenu === index;

  if (nav.subItems) {
    return (
      <li>
        <button
          onClick={() => onToggleSubmenu(index)}
          className={`menu-item group ${isOpen ? "menu-item-active" : "menu-item-inactive"} cursor-pointer ${
            showLabels ? "lg:justify-start" : "lg:justify-center"
          }`}
        >
          <span className={`menu-item-icon-size ${isOpen ? "menu-item-icon-active" : "menu-item-icon-inactive"}`}>
            {nav.icon}
          </span>
          {showLabels && <span className="menu-item-text">{nav.name}</span>}
          {showLabels && (
            <ChevronDownIcon
              className={`ml-auto w-5 h-5 transition-transform duration-200 ${isOpen ? "rotate-180 text-brand-500" : ""}`}
            />
          )}
        </button>
        {showLabels && (
          <div
            ref={(el) => {
              subMenuRefs.current[index] = el;
            }}
            className="overflow-hidden transition-all duration-300"
            style={{ height: isOpen ? `${subMenuHeight[index] ?? 0}px` : "0px" }}
          >
            <ul className="mt-2 space-y-1 ml-9">
              {nav.subItems.map((subItem) => (
                <li key={subItem.name}>
                  <Link
                    to={subItem.path}
                    className={`menu-dropdown-item ${
                      isActive(subItem.path) ? "menu-dropdown-item-active" : "menu-dropdown-item-inactive"
                    }`}
                  >
                    {subItem.name}
                    <span className="flex items-center gap-1 ml-auto">
                      {subItem.new && (
                        <span className={`ml-auto menu-dropdown-badge ${isActive(subItem.path) ? "menu-dropdown-badge-active" : "menu-dropdown-badge-inactive"}`}>
                          new
                        </span>
                      )}
                      {subItem.pro && (
                        <span className={`ml-auto menu-dropdown-badge ${isActive(subItem.path) ? "menu-dropdown-badge-active" : "menu-dropdown-badge-inactive"}`}>
                          pro
                        </span>
                      )}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </li>
    );
  }

  if (!nav.path) return null;

  return (
    <li>
      <Link
        to={nav.path}
        className={`menu-item group ${isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"}`}
      >
        <span className={`menu-item-icon-size ${isActive(nav.path) ? "menu-item-icon-active" : "menu-item-icon-inactive"}`}>
          {nav.icon}
        </span>
        {showLabels && <span className="menu-item-text">{nav.name}</span>}
      </Link>
    </li>
  );
}

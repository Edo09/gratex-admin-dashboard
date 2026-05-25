import { useEffect, useRef } from "react";
import { Icons } from "./PressIcons";
import { useTheme } from "@/shared/context/ThemeContext";

function buildBuildCode(): string {
  const d = new Date();
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `GRA / ${yy}-${mm}`;
}

const APP_VERSION = "v2.4.1";

export function PressTopbar() {
  const inputRef = useRef<HTMLInputElement>(null);
  const { toggleTheme } = useTheme();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="topbar">
      <div className="top-codes">
        <span>{buildBuildCode()}</span>
        <span className="sep">·</span>
        <span>{APP_VERSION}</span>
      </div>
      <div className="search">
        <span className="search-icon">
          <Icons.search size={15} />
        </span>
        <input ref={inputRef} placeholder="Buscar comando, código, cliente…" />
        <span className="kbd">⌘K</span>
      </div>
      <div className="top-actions">
        <a className="btn-ghost" href="https://gratex.net/" target="_blank" rel="noreferrer">
          <Icons.external size={13} /> Ver sitio
        </a>
        <button className="icon-btn" aria-label="Tema" onClick={toggleTheme}>
          <Icons.sun size={14} />
        </button>
        <button className="icon-btn" aria-label="Notificaciones">
          <Icons.bell size={14} />
        </button>
      </div>
    </div>
  );
}

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

/**
 * Portals modal content into <body> so `position: fixed` resolves against the
 * viewport. Without this, AppLayout's `.anim-in` wrapper (which uses a
 * transform) acts as a containing block and traps fixed-positioned children.
 *
 * Also locks body scroll while the modal is mounted.
 */
export function ModalPortal({ children }: { children: ReactNode }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);
  return createPortal(children, document.body);
}

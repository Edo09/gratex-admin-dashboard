import { useEffect, type ReactNode } from "react";

interface PageMetaProps {
  title: string;
  description: string;
}

/** Sets document.title and meta description on mount, restores on unmount. */
export function PageMeta({ title, description }: PageMetaProps) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title;

    let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    let created = false;
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
      created = true;
    }
    const prevDesc = meta.getAttribute("content") ?? "";
    meta.setAttribute("content", description);

    return () => {
      document.title = prevTitle;
      if (created) {
        meta?.remove();
      } else if (meta) {
        meta.setAttribute("content", prevDesc);
      }
    };
  }, [title, description]);

  return null;
}

export function AppWrapper({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

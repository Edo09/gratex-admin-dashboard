import { HelmetProvider, Helmet } from "react-helmet-async";
import type { ReactNode } from "react";

interface PageMetaProps {
  title: string;
  description: string;
}

export function PageMeta({ title, description }: PageMetaProps) {
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
    </Helmet>
  );
}

export function AppWrapper({ children }: { children: ReactNode }) {
  return <HelmetProvider>{children}</HelmetProvider>;
}

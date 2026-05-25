import { useState } from "react";
import { PageMeta } from "@/shared/components/layout/PageMeta";
import { TabButton } from "../components/TabButton";
import { CarouselTab } from "../components/CarouselTab";
import { ServicesTab } from "../components/ServicesTab";
import type { LandingTab } from "../types";

export default function Configuracion() {
  const [activeTab, setActiveTab] = useState<LandingTab>("carousel");

  return (
    <>
      <PageMeta
        title="Configuración Landing Page | Admin Dashboard"
        description="Panel de configuración para la Landing Page"
      />

      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Configuración Landing</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Gestiona el contenido del carousel y servicios de tu landing page.
            </p>
          </div>

          <div className="inline-flex gap-1 rounded-full bg-gray-100 p-1 dark:bg-gray-800">
            <TabButton
              active={activeTab === "carousel"}
              onClick={() => setActiveTab("carousel")}
              icon={
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
              label="Carousel"
            />
            <TabButton
              active={activeTab === "services"}
              onClick={() => setActiveTab("services")}
              icon={
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              }
              label="Servicios"
            />
          </div>
        </div>

        {activeTab === "carousel" ? <CarouselTab /> : <ServicesTab />}
      </div>
    </>
  );
}

import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import { useState } from "react";
import BasicTableOne from "../../components/tables/BasicTables/BasicTableOne";

export default function BasicTables() {
  const [query, setQuery] = useState("");
  return (
    <>
      <PageMeta
        title="React.js Basic Tables Dashboard | TailAdmin - Next.js Admin Dashboard Template"
        description="This is React.js Basic Tables Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      <PageBreadcrumb pageTitle="Basic Tables" />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por fecha, código, cliente o descripción..."
            className="w-full max-w-md rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-white"
          />
        </div>
        <ComponentCard title="Basic Table 1">
          <BasicTableOne query={query} />
        </ComponentCard>
      </div>
    </>
  );
}

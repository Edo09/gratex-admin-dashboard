import { PageMeta } from "@/shared/components/layout/PageMeta";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <PageMeta title="404 — No encontrado" description="Página no encontrada" />
      <h1 className="text-6xl font-bold text-gray-800 dark:text-white">404</h1>
      <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">La página que estás buscando no existe.</p>
      <a
        href="/"
        className="mt-6 rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700"
      >
        Volver al inicio
      </a>
    </div>
  );
}

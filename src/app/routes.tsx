import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { AppLayout } from "@/shared/components/layout/AppLayout";
import { ProtectedRoute } from "@/features/auth/components/ProtectedRoute";
import { PublicRoute } from "@/features/auth/components/PublicRoute";
import { FullPageSpinner } from "@/shared/components/ui/Spinner";

const SignIn = lazy(() => import("@/features/auth/pages/SignIn"));
const SignUp = lazy(() => import("@/features/auth/pages/SignUp"));
const ExternalCallback = lazy(() => import("@/features/auth/pages/ExternalCallback"));
const NotFound = lazy(() => import("@/app/pages/NotFound"));
const Home = lazy(() => import("@/features/dashboard/pages/Home"));
const Cotizaciones = lazy(() => import("@/features/cotizaciones/pages/Cotizaciones"));
const CotizacionDetail = lazy(() => import("@/features/cotizaciones/pages/CotizacionDetail"));
const Facturas = lazy(() => import("@/features/facturas/pages/Facturas"));
const FacturaDetail = lazy(() => import("@/features/facturas/pages/FacturaDetail"));
const FacturasSimples = lazy(() => import("@/features/facturas-simples/pages/FacturasSimples"));
const FacturaSimpleDetail = lazy(() => import("@/features/facturas-simples/pages/FacturaSimpleDetail"));
const AprobarEcf = lazy(() => import("@/features/aprobar-ecf/pages/AprobarEcf"));
const Gastos = lazy(() => import("@/features/gastos/pages/Gastos"));
const GastoDetail = lazy(() => import("@/features/gastos/pages/GastoDetail"));
const Clientes = lazy(() => import("@/features/clientes/pages/Clientes"));
const Comprobantes = lazy(() => import("@/features/ncf/pages/Ncf"));
const Configuracion = lazy(() => import("@/features/configuracion/pages/Configuracion"));

export function AppRoutes() {
  return (
    <Suspense fallback={<FullPageSpinner />}>
      <Routes>
        {/* Public (only for unauthenticated users) */}
        <Route path="/signin" element={<PublicRoute><SignIn /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><SignUp /></PublicRoute>} />
        <Route path="/auth/callback" element={<ExternalCallback />} />

        {/* Protected (require auth) */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index path="/" element={<Home />} />
          <Route path="/cotizaciones" element={<Cotizaciones />} />
          <Route path="/cotizaciones/:id" element={<CotizacionDetail />} />
          <Route path="/facturas" element={<Facturas />} />
          <Route path="/facturas/:id" element={<FacturaDetail />} />
          <Route path="/facturas-ncf" element={<FacturasSimples />} />
          <Route path="/facturas-ncf/:id" element={<FacturaSimpleDetail />} />
          <Route path="/aprobar-ecf" element={<AprobarEcf />} />
          <Route path="/gastos" element={<Gastos />} />
          <Route path="/gastos/:id" element={<GastoDetail />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/comprobantes" element={<Comprobantes />} />
          <Route path="/ncf" element={<Comprobantes />} />
          <Route path="/configuracion" element={<Configuracion />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

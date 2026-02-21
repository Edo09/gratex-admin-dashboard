import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { PublicRoute } from "./components/auth/PublicRoute";

// Lazy-loaded pages
const SignIn = lazy(() => import("./pages/AuthPages/SignIn"));
const SignUp = lazy(() => import("./pages/AuthPages/SignUp"));
const ExternalCallback = lazy(() => import("./pages/AuthPages/ExternalCallback"));
const NotFound = lazy(() => import("./pages/OtherPage/NotFound"));
const Home = lazy(() => import("./pages/Dashboard/Home"));
const Cotizaciones = lazy(() => import("./pages/Cotizaciones"));
const Facturas = lazy(() => import("./pages/Facturas"));
const Clientes = lazy(() => import("./pages/Clientes"));
const Ncf = lazy(() => import("./pages/Ncf"));
const Configuracion = lazy(() => import("./pages/Configuracion"));

const Loading = () => (
  <div className="flex h-screen items-center justify-center">
    <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-500" />
  </div>
);

export default function App() {
  return (
    <>
      <Router>
        <ScrollToTop />
        <Suspense fallback={<Loading />}>
        <Routes>
          {/* Auth Routes (Public - Only for unauthenticated users) */}
          <Route path="/signin" element={<PublicRoute><SignIn /></PublicRoute>} />
          <Route path="/signup" element={<PublicRoute><SignUp /></PublicRoute>} />
          <Route path="/auth/callback" element={<ExternalCallback />} />

          {/* Dashboard Layout (Protected) */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index path="/" element={<Home />} />
            <Route path="/cotizaciones" element={<Cotizaciones />} />
            <Route path="/facturas" element={<Facturas />} />

            <Route path="/clientes" element={<Clientes />} />
            <Route path="/ncf" element={<Ncf />} />
            <Route path="/configuracion" element={<Configuracion />} />

          </Route>

          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
      </Router>
    </>
  );
}

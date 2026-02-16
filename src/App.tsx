import { BrowserRouter as Router, Routes, Route } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import ExternalCallback from "./pages/AuthPages/ExternalCallback";
import NotFound from "./pages/OtherPage/NotFound";

import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import Cotizaciones from "./pages/Cotizaciones";
import Facturas from "./pages/Facturas";
// import Rnc from "./pages/Rnc"; // Removed
import Ncf from "./pages/Ncf";

import Clientes from "./pages/Clientes";
import Configuracion from "./pages/Configuracion"; // Changed import
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { PublicRoute } from "./components/auth/PublicRoute";


export default function App() {
  return (
    <>
      <Router>
        <ScrollToTop />
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

            {/* Others Page */}

            <Route path="/cotizaciones" element={<Cotizaciones />} />
            <Route path="/facturas" element={<Facturas />} />

            <Route path="/clientes" element={<Clientes />} />
            <Route path="/ncf" element={<Ncf />} />
            <Route path="/configuracion" element={<Configuracion />} />












          </Route>

          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </>
  );
}

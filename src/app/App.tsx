import { BrowserRouter as Router } from "react-router-dom";
import { ScrollToTop } from "@/shared/components/layout/ScrollToTop";
import { AppRoutes } from "./routes";

export default function App() {
  return (
    <Router basename="/admin">
      <ScrollToTop />
      <AppRoutes />
    </Router>
  );
}

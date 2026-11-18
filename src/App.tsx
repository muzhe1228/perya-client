import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "@/router";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <div className="shell-wrapper">
          <div className="background-layer" />
          <div className="phone-container">
            <div className="main-screen">
              <AppRoutes />
            </div>
          </div>
        </div>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

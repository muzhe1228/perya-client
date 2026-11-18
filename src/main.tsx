import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { installSpineErrorGuard } from "./utils/spineErrorGuard";
import "./utils/rem";
import "./styles/main.scss";

installSpineErrorGuard();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

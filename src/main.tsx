import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App";
import "./index.css";
import { setUpPwa } from "./lib/pwa";

// Install-as-app support: catches the browser's install offer and registers the service worker.
setUpPwa();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

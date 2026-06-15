import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import * as Sentry from "@sentry/react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.min.css";
import * as bootstrap from "bootstrap";
import "./styles/index.css";
import { initI18n } from "@/i18n";
import { initSentry } from "@/lib/sentry";
import App from "./App";

// Init Sentry once, before any async work or rendering (advanced-init-once).
initSentry();

initI18n().then(() => {
  ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <Sentry.ErrorBoundary
        fallback={
          <div className="container py-5 text-center">
            <h1 className="h4">Something went wrong.</h1>
            <p className="text-muted">
              The error has been reported. Please refresh the page.
            </p>
          </div>
        }
      >
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </Sentry.ErrorBoundary>
    </React.StrictMode>,
  );
});

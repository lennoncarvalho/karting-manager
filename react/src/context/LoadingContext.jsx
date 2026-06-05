import { createContext, useContext, useState, useCallback } from "react";

const LoadingContext = createContext(null);

export function LoadingProvider({ children }) {
  const [count, setCount] = useState(0);
  const isBusy = count > 0;

  const show = useCallback(() => setCount((c) => c + 1), []);
  const hide = useCallback(() => setCount((c) => Math.max(0, c - 1)), []);

  const withLoading = useCallback(
    async (fn) => {
      show();
      try {
        await fn();
      } finally {
        hide();
      }
    },
    [show, hide],
  );

  return (
    <LoadingContext.Provider value={{ show, hide, withLoading }}>
      {children}
      {isBusy && (
        <div
          id="global-loading-overlay"
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{
            zIndex: 9998,
            backgroundColor: "rgba(0,0,0,0.5)",
            cursor: "wait",
            pointerEvents: "auto",
          }}
          aria-live="polite"
          aria-busy="true"
        >
          <div
            className="spinner-border text-light"
            style={{ width: "3rem", height: "3rem" }}
            role="status"
          >
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const ctx = useContext(LoadingContext);
  if (!ctx) throw new Error("useLoading must be used within LoadingProvider");
  return ctx;
}

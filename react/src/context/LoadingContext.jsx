import { createContext, useContext, useState, useCallback } from "react";
import { Spinner } from "@/components/Spinner";

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
      {isBusy ? (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-50"
          style={{ zIndex: 1065 }}
        >
          <Spinner className="text-light" />
        </div>
      ) : null}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const ctx = useContext(LoadingContext);
  if (!ctx) throw new Error("useLoading must be used within LoadingProvider");
  return ctx;
}

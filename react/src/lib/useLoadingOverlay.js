import { useState, useCallback, useRef } from "react";

export function useLoadingOverlay() {
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  const show = useCallback(() => {
    setLoading(true);
  }, []);

  const hide = useCallback(() => {
    setLoading(false);
  }, []);

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

  return { loading, show, hide, withLoading };
}

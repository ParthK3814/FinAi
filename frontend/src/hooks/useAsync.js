import { useCallback, useEffect, useRef, useState } from "react";

// Runs an async function and tracks loading / error / data.
// Previous data stays on screen while a reload is in flight, so the UI doesn't flash.
export function useAsync(fn, deps = []) {
  const [state, setState] = useState({ loading: true, error: null, data: null });
  const [tick, setTick] = useState(0);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    fnRef
      .current()
      .then((data) => !cancelled && setState({ loading: false, error: null, data }))
      .catch((error) => !cancelled && setState((s) => ({ ...s, loading: false, error })));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { ...state, reload };
}

// Shared fetch plumbing for the Labor & Capacity tabs.
//
// Factored out because all six tabs hit the same /api/labor namespace with the
// same auth header, the same {success, data} envelope and the same
// restaurant/branch scoping — inlining that in each tab (the pattern most older
// pages use) would repeat the token/branch/error handling six times and let the
// tabs drift apart in how they treat a failed request.

import { useCallback, useEffect, useRef, useState } from "react";
import { useAppSelector } from "@/store";

export const useLaborScope = () => {
  const { selectedBranch } = useAppSelector((s) => s.branch);
  const { user, token } = useAppSelector((s) => s.auth);
  const API_URL = import.meta.env.VITE_API_URL;

  const restaurantId = user?.restaurantId ?? null;
  const branchId = selectedBranch?.id ?? null;

  /**
   * One request against /api/labor. Returns the unwrapped `data` payload, or
   * throws with the server's own message so callers can surface the real reason
   * (a 400 from labor.validation.ts is far more useful than "request failed").
   */
  const request = useCallback(
    async (path: string, init?: RequestInit) => {
      const res = await fetch(`${API_URL}/api/labor${path}`, {
        ...init,
        headers: {
          Authorization: `Bearer ${token}`,
          ...(init?.body ? { "Content-Type": "application/json" } : {}),
          ...(init?.headers || {}),
        },
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        throw new Error(json?.message || `Request failed (${res.status})`);
      }
      return json.data;
    },
    [API_URL, token],
  );

  return { restaurantId, branchId, branchName: selectedBranch?.name ?? null, request };
};

interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * GET a labor endpoint whenever its path changes, with the scope guard every
 * tab needs (no restaurant or no branch selected → don't fire, don't error).
 *
 * `path` is expected to already include the /:restaurantId/:branchId prefix;
 * pass null to hold the request (e.g. while a dependency is still loading).
 */
export function useLaborQuery<T>(path: string | null): FetchState<T> & { reload: () => void } {
  const { request } = useLaborScope();
  const [state, setState] = useState<FetchState<T>>({ data: null, loading: false, error: null });
  const [nonce, setNonce] = useState(0);

  // Guards against a slow earlier request overwriting a newer one's result when
  // the user changes window/branch quickly.
  const latest = useRef(0);

  useEffect(() => {
    if (!path) {
      setState({ data: null, loading: false, error: null });
      return;
    }
    const requestId = ++latest.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    request(path)
      .then((data) => {
        if (latest.current !== requestId) return;
        setState({ data, loading: false, error: null });
      })
      .catch((err: Error) => {
        if (latest.current !== requestId) return;
        setState({ data: null, loading: false, error: err.message });
      });
  }, [path, request, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  return { ...state, reload };
}

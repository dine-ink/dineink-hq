// Shared plumbing for the Labor & Capacity tabs.
//
// This was hand-rolled before RTK Query reached this module, and it had grown
// most of the same pieces: an unwrapped {success, data} envelope, a scope
// guard, and a `latest` ref so a slow earlier request could not overwrite a
// newer one's result. All three are things the query cache does natively.
//
// The interface is unchanged — `useLaborScope().request` for writes,
// `useLaborQuery(path)` for reads — so the six tabs did not have to move. Only
// what sits underneath did. What they gain is the cache: six tabs share one
// /api/labor namespace, and switching between them used to refetch every time.

import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/store";
import { operationsApi } from "@/store/api/operationsApi";

export const useLaborScope = () => {
  const { selectedBranch } = useAppSelector((s) => s.branch);
  const { user } = useAppSelector((s) => s.auth);
  const dispatch = useAppDispatch();

  const restaurantId = user?.restaurantId ?? null;
  const branchId = selectedBranch?.id ?? null;

  /**
   * One request against /api/labor. Returns the unwrapped `data` payload, or
   * throws with the server's own message so callers can surface the real reason
   * (a 400 from labor.validation.ts is far more useful than "request failed").
   *
   * The message survives the move: RTK Query puts the parsed response body on
   * `error.data`, so a rejected mutation still carries what the validator said.
   */
  const request = useCallback(
    async (path: string, init?: RequestInit) => {
      const method = (init?.method || "GET").toUpperCase();
      const body = init?.body ? JSON.parse(init.body as string) : undefined;

      try {
        if (method === "GET") {
          return await dispatch(
            operationsApi.endpoints.getLabor.initiate({ path }, { forceRefetch: true }),
          ).unwrap();
        }
        return await dispatch(
          operationsApi.endpoints.writeLabor.initiate({
            path,
            method: method as "POST" | "PUT" | "DELETE",
            body,
          }),
        ).unwrap();
      } catch (error: any) {
        const message =
          error?.data?.message ||
          error?.message ||
          `Request failed${error?.status ? ` (${error.status})` : ""}`;
        throw new Error(message);
      }
    },
    [dispatch],
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
 * pass null to hold the request (e.g. while a dependency is still loading) —
 * which is now a `skip` rather than an early return.
 */
export function useLaborQuery<T>(path: string | null): FetchState<T> & { reload: () => void } {
  const query = operationsApi.useGetLaborQuery({ path: path as string }, { skip: !path });

  return {
    data: (query.data as T | undefined) ?? null,
    loading: query.isFetching,
    // The server's message where there is one, so a 400 from the validator
    // still reads as itself rather than a generic failure.
    error: query.isError
      ? (query.error as any)?.data?.message || "Request failed"
      : null,
    reload: query.refetch,
  };
}

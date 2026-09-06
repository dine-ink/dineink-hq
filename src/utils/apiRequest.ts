/**
 * A write that reports whether it worked.
 *
 * The prevailing pattern in this app is some variant of:
 *
 *     await fetch(url, { method: "POST", ... });   // no .json(), no check
 *     closeModal();
 *     refetchList();
 *
 * or, slightly better:
 *
 *     const data = await res.json();
 *     if (data.success) alert("Saved");           // no else
 *     } catch { /* silent *\/ }
 *
 * Both are silent on failure. The user records a vendor payment, the request
 * is rejected, the modal closes, the list refetches showing the old data, and
 * they believe it saved. For anything touching money that is the worst possible
 * failure mode: it is indistinguishable from success until someone reconciles.
 *
 * `apiSend` collapses the three ways a write can fail — the request never left,
 * the server returned a non-2xx, the server returned 200 with
 * `{ success: false }` — into one thrown error the caller must deal with.
 *
 * This is deliberately small. The real fix is RTK Query, which gives every
 * mutation an `isError`/`error` without any of this; `store/api/` already
 * exists and one component uses it. Until that migration reaches a screen,
 * this is what stops a failed write from looking like a successful one.
 */

export class ApiRequestError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.code = code;
  }
}

/**
 * Performs a request and returns its `data` payload, throwing on any failure.
 *
 * The backend answers `{ success, data, message, code }`. A rejected request
 * can arrive as a non-2xx *or* as a 200 carrying `success: false` — older
 * endpoints do the latter — so both are treated as failures.
 */
export const apiSend = async <T = unknown>(url: string, init?: RequestInit): Promise<T> => {
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch {
    // The request never reached the API: offline, DNS, CORS, server down.
    // Distinguished from a rejection because the remedy is different.
    throw new ApiRequestError(
      "Could not reach the server. Check your connection and try again.",
      0,
      "NETWORK",
    );
  }

  // A 502 from a proxy, or a crash before the JSON handler, returns HTML.
  let body: any = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }

  if (!res.ok || body?.success === false) {
    throw new ApiRequestError(
      body?.message || `That didn't go through (error ${res.status}).`,
      res.status,
      body?.code,
    );
  }

  return (body?.data ?? body) as T;
};

/**
 * A message safe to show a person, from anything that was thrown.
 *
 * Handles both failure shapes in the app, because screens are migrating
 * between them one at a time and several use each:
 *
 *   - `apiSend` above throws an `ApiRequestError`.
 *   - A rejected RTK Query mutation (`.unwrap()`) throws
 *     `{ status, data: { message } }` — not an Error at all, so
 *     `err instanceof Error` is false and `err.message` is undefined.
 *
 * Never returns an empty string: a blank alert is indistinguishable from the
 * silent failure this exists to replace.
 */
export const errorMessage = (error: unknown, fallback?: string): string => {
  if (error instanceof ApiRequestError) return error.message;

  const data = (error as { data?: { message?: string } } | undefined)?.data;
  if (data?.message) return data.message;

  if (error instanceof Error && error.message) return error.message;
  return fallback || "Something went wrong. Please try again.";
};

import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiRequestError, apiSend, errorMessage } from "./apiRequest";

/**
 * A write can fail three ways, and before this helper all three were silent:
 * the request never left, the server returned a non-2xx, or the server returned
 * 200 carrying `{ success: false }`. The last is the one that matters most —
 * several endpoints answer that way, and `res.ok` is true for all of them.
 */

const mockFetch = (impl: () => Promise<unknown>) => vi.stubGlobal("fetch", vi.fn(impl));

const jsonResponse = (body: unknown, { ok = true, status = 200 } = {}) =>
  ({ ok, status, json: () => Promise.resolve(body) }) as unknown as Response;

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("apiSend", () => {
  it("returns the data payload on success", async () => {
    mockFetch(async () => jsonResponse({ success: true, data: { id: 7 } }));
    await expect(apiSend("/x")).resolves.toEqual({ id: 7 });
  });

  it("falls back to the whole body when there is no data envelope", async () => {
    mockFetch(async () => jsonResponse({ success: true, bill: { id: 3 } }));
    await expect(apiSend("/x")).resolves.toEqual({ success: true, bill: { id: 3 } });
  });

  it("throws on a 200 carrying success:false — the case res.ok misses", async () => {
    mockFetch(async () => jsonResponse({ success: false, message: "Vendor not found" }));
    await expect(apiSend("/x")).rejects.toThrow("Vendor not found");
  });

  it("throws on a non-2xx and prefers the server's message", async () => {
    mockFetch(async () =>
      jsonResponse({ success: false, message: "Branch not found" }, { ok: false, status: 404 }),
    );
    await expect(apiSend("/x")).rejects.toThrow("Branch not found");
  });

  it("still throws when a non-2xx has no JSON body at all", async () => {
    // A 502 from a proxy returns HTML, so .json() rejects.
    mockFetch(
      async () =>
        ({ ok: false, status: 502, json: () => Promise.reject(new Error("not json")) }) as unknown as Response,
    );
    await expect(apiSend("/x")).rejects.toThrow(/error 502/);
  });

  it("reports a request that never reached the API distinctly", async () => {
    mockFetch(async () => {
      throw new TypeError("Failed to fetch");
    });
    await expect(apiSend("/x")).rejects.toMatchObject({ code: "NETWORK", status: 0 });
    await expect(apiSend("/x")).rejects.toThrow(/Could not reach the server/);
  });

  it("carries the status and code through for callers that branch on them", async () => {
    mockFetch(async () =>
      jsonResponse({ success: false, message: "Locked", code: "ACCOUNT_LOCKED" }, { ok: false, status: 429 }),
    );
    await expect(apiSend("/x")).rejects.toMatchObject({
      status: 429,
      code: "ACCOUNT_LOCKED",
    });
  });
});

describe("errorMessage", () => {
  it("uses an ApiRequestError's message", () => {
    expect(errorMessage(new ApiRequestError("Vendor not found", 404))).toBe("Vendor not found");
  });

  it("uses a plain Error's message", () => {
    expect(errorMessage(new Error("boom"))).toBe("boom");
  });

  it("never returns an empty string — a blank alert is the silence we replaced", () => {
    expect(errorMessage(new Error(""))).toBe("Something went wrong. Please try again.");
    expect(errorMessage(undefined)).toBe("Something went wrong. Please try again.");
    expect(errorMessage("just a string")).toBe("Something went wrong. Please try again.");
  });
});

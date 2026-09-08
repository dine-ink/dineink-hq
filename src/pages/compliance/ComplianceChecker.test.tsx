import { afterEach, describe, expect, it, vi } from "vitest";
import { Provider } from "react-redux";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ComplianceChecker from "./ComplianceChecker";
import { authenticatedState, makeTestStore } from "@/test/test-utils";

/**
 * Compliance is the first module migrated end to end, so these cover the two
 * things that were new in it: a summary invalidated alongside the list it is
 * derived from, and a two-step upload whose halves fail for different reasons.
 */

const RECORD = {
  id: 1,
  restaurantId: 10,
  branchId: 20,
  type: "FSSAI" as const,
  licenseNumber: "FS-123",
  issueDate: null,
  expiryDate: "2027-01-01",
  nextDueDate: null,
  status: "VALID" as const,
  documentUrl: null,
  lastRenewedDate: null,
  notes: null,
  createdAt: "2026-01-01",
  updatedAt: "2026-01-01",
};

const SUMMARY = { valid: 1, expiringSoon: 0, expired: 0, due: 0, total: 1 };

/** Real Response objects — fetchBaseQuery reads status/headers/text(). */
const respond = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

type WriteResult = { ok: boolean; status?: number; body?: unknown };

const mockApi = (onWrite: (url: string) => WriteResult) => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input instanceof Request ? input.url : input);
      const method = String(
        init?.method ?? (input instanceof Request ? input.method : "GET"),
      ).toUpperCase();

      if (method === "GET") {
        return url.includes("/summary")
          ? respond({ success: true, data: SUMMARY })
          : respond({ success: true, data: [RECORD] });
      }
      const result = onWrite(url);
      return respond(
        result.body ?? { success: result.ok },
        result.status ?? (result.ok ? 200 : 400),
      );
    }),
  );
};

const renderPage = () => {
  const store = makeTestStore(authenticatedState());
  render(
    <Provider store={store}>
      <ComplianceChecker />
    </Provider>,
  );
  return { store };
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ComplianceChecker", () => {
  it("renders records and the summary from their two queries", async () => {
    mockApi(() => ({ ok: true }));
    renderPage();
    expect((await screen.findAllByText("FS-123")).length).toBeGreaterThan(0);
    // The summary's "total" KPI.
    expect(screen.getAllByText("1").length).toBeGreaterThan(0);
  });

  it("reports a failed renewal rather than leaving the date unchanged in silence", async () => {
    const user = userEvent.setup();
    mockApi(() => ({
      ok: false,
      status: 400,
      body: { success: false, message: "Compliance record not found" },
    }));

    renderPage();
    await screen.findAllByText("FS-123");

    const renew = (await screen.findAllByRole("button", { name: /renew/i }))[0];
    await user.click(renew);

    await waitFor(() =>
      expect(screen.getByText("Compliance record not found")).toBeInTheDocument(),
    );
  });

  it("distinguishes a failed upload from a failed attach", async () => {
    const user = userEvent.setup();
    // The upload succeeds; attaching its URL to the record is what fails. The
    // remedy differs — the file is already stored, so retrying the upload is
    // not the fix — which is why the two steps are not one mutation.
    mockApi((url) =>
      url.includes("/upload")
        ? { ok: true, body: { success: true, data: { documentUrl: "/uploads/x.pdf" } } }
        : { ok: false, status: 500, body: { success: false } },
    );

    renderPage();
    await screen.findAllByText("FS-123");

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeTruthy();
    await user.upload(fileInput, new File(["x"], "cert.pdf", { type: "application/pdf" }));

    await waitFor(() =>
      expect(screen.getByText(/couldn't attach it to this record/i)).toBeInTheDocument(),
    );
  });
});

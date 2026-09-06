import { afterEach, describe, expect, it, vi } from "vitest";
import { Provider } from "react-redux";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DiscountCodesTab from "./DiscountCodesTab";
import { authenticatedState, makeTestStore } from "@/test/test-utils";

/**
 * The point of migrating this tab to RTK Query was not tidiness. Toggling a
 * code's active state and deleting one were both wrapped in `catch { /* silent *\/ }`,
 * so a rejected write left the UI exactly as it was and read as "the click
 * didn't register". These cover the behaviour that replaced that.
 */

const CODE = {
  id: 1,
  code: "SAVE10",
  type: "PERCENTAGE" as const,
  value: 10,
  isActive: true,
  maxUses: null,
  usedCount: 0,
  expiresAt: null,
};

const renderTab = () => {
  const store = makeTestStore(authenticatedState());
  render(
    <Provider store={store}>
      <DiscountCodesTab />
    </Provider>,
  );
  return { store };
};

/**
 * Real Response objects, for the reason Dashboard.test.tsx already records:
 * fetchBaseQuery reads status/headers/text(), so a bare `{ json }` stub lands
 * in its error branch silently and the query looks like it returned nothing.
 */
const respond = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

/** Answers the list GET, and lets each test decide what the write does. */
const mockApi = (onWrite: () => { ok: boolean; status?: number; body?: unknown }) => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const method = String(
        init?.method ?? (input instanceof Request ? input.method : "GET"),
      ).toUpperCase();

      if (method === "GET") return respond({ success: true, data: [CODE] });

      const result = onWrite();
      return respond(
        result.body ?? { success: result.ok },
        result.status ?? (result.ok ? 200 : 400),
      );
    }),
  );
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("DiscountCodesTab", () => {
  it("lists the codes the query returns", async () => {
    mockApi(() => ({ ok: true }));
    renderTab();
    expect((await screen.findAllByText("SAVE10")).length).toBeGreaterThan(0);
  });

  it("surfaces a failed toggle instead of silently doing nothing", async () => {
    const user = userEvent.setup();
    mockApi(() => ({
      ok: false,
      status: 400,
      body: { success: false, message: "Discount code not found" },
    }));

    renderTab();
    await screen.findAllByText("SAVE10");

    // The toggle is the only checkbox-ish control on the row.
    const toggle = screen.getAllByRole("button").find((b) => b.className.includes("rounded-full"));
    expect(toggle).toBeDefined();
    await user.click(toggle!);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Discount code not found");
  });

  it("falls back to a readable message when the server sends none", async () => {
    const user = userEvent.setup();
    mockApi(() => ({ ok: false, status: 500, body: { success: false } }));

    renderTab();
    await screen.findAllByText("SAVE10");

    const toggle = screen.getAllByRole("button").find((b) => b.className.includes("rounded-full"));
    await user.click(toggle!);

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(/Failed to update discount code/i),
    );
  });

  it("does not show an error banner when nothing has failed", async () => {
    mockApi(() => ({ ok: true }));
    renderTab();
    await screen.findAllByText("SAVE10");
    expect(screen.queryByRole("alert")).toBeNull();
  });
});

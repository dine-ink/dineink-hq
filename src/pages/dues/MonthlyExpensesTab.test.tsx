import { afterEach, describe, expect, it, vi } from "vitest";
import { Provider } from "react-redux";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MonthlyExpensesTab from "./MonthlyExpensesTab";
import { authenticatedState, makeTestStore } from "@/test/test-utils";

/**
 * Deleting a due used to be wrapped in a catch whose comment claimed the
 * failure was "surfaced implicitly — row remains, user can retry". It wasn't: a
 * row that stays looks exactly like one nobody has deleted, and the
 * `if (json.success)` above it had no else, so a *rejected* delete said nothing
 * either. These cover what replaced that.
 */

const DUE = {
  id: 11,
  category: "EB" as const,
  month: 3,
  year: 2026,
  amountDue: 12000,
  amountPaid: 0,
  dueDate: null,
  paidDate: null,
  notes: null,
  status: "PENDING",
};

/** Real Response objects — fetchBaseQuery reads status/headers/text(). */
const respond = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const mockApi = (onWrite: () => { ok: boolean; status?: number; body?: unknown }) => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const method = String(
        init?.method ?? (input instanceof Request ? input.method : "GET"),
      ).toUpperCase();
      if (method === "GET") return respond({ success: true, data: [DUE] });
      const result = onWrite();
      return respond(
        result.body ?? { success: result.ok },
        result.status ?? (result.ok ? 200 : 400),
      );
    }),
  );
};

const renderTab = () => {
  const store = makeTestStore(authenticatedState());
  render(
    <Provider store={store}>
      <MonthlyExpensesTab month={3} year={2026} />
    </Provider>,
  );
  return { store };
};

/** Opens the delete dialog for the one seeded row and confirms it. */
const confirmDelete = async (user: ReturnType<typeof userEvent.setup>) => {
  const deleteButtons = await screen.findAllByRole("button", { name: /delete/i });
  await user.click(deleteButtons[0]);
  const confirmButtons = await screen.findAllByRole("button", { name: /delete/i });
  // The dialog's confirm is the last Delete button rendered.
  await user.click(confirmButtons[confirmButtons.length - 1]);
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("MonthlyExpensesTab", () => {
  it("shows the dues the query returns", async () => {
    mockApi(() => ({ ok: true }));
    renderTab();
    expect((await screen.findAllByText(/12,000/)).length).toBeGreaterThan(0);
  });

  it("reports a failed delete instead of leaving the row and saying nothing", async () => {
    const user = userEvent.setup();
    mockApi(() => ({
      ok: false,
      status: 400,
      body: { success: false, message: "Monthly due not found" },
    }));

    renderTab();
    await confirmDelete(user);

    await waitFor(() =>
      expect(screen.getByText("Couldn't delete that entry")).toBeInTheDocument(),
    );
    expect(screen.getByText("Monthly due not found")).toBeInTheDocument();
  });

  it("falls back to a readable message when the server sends none", async () => {
    const user = userEvent.setup();
    mockApi(() => ({ ok: false, status: 500, body: { success: false } }));

    renderTab();
    await confirmDelete(user);

    await waitFor(() =>
      expect(screen.getByText(/Failed to delete this due/i)).toBeInTheDocument(),
    );
  });

  it("says nothing when a delete succeeds", async () => {
    const user = userEvent.setup();
    mockApi(() => ({ ok: true }));

    renderTab();
    await confirmDelete(user);

    await waitFor(() =>
      expect(screen.queryByText("Couldn't delete that entry")).toBeNull(),
    );
  });
});

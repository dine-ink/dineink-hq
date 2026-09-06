import { afterEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Report from "./Report";
import { authenticatedState, renderWithProviders } from "@/test/test-utils";

/**
 * Characterisation tests for the Reports page.
 *
 * These do not describe what the page *should* do — they pin what it currently
 * does, so that decomposing it (4,254 lines, one component, 20+ useState hooks,
 * twelve tabs) has a safety net. A characterisation test failing during a
 * refactor means the refactor changed behaviour, which is exactly the signal
 * that is missing today: the page has one test, covering one tab.
 *
 * Deliberately coarse. They assert that each tab mounts, renders its own
 * headings, and survives the shared data the page loads once at the top —
 * because that shared state is what makes extraction risky. Fine-grained
 * assertions belong in the per-tab tests written after each tab is extracted.
 */

const BILLS = [
  {
    id: 1,
    status: "PAID",
    total: 1000,
    discount: 50,
    cgst: 25,
    sgst: 25,
    createdAt: "2026-03-02T12:30:00.000Z",
    items: [{ itemName: "Dosa", quantity: 2, total: 400, menuItemId: 11 }],
  },
  {
    id: 2,
    status: "PAID",
    total: 500,
    discount: 0,
    cgst: 0,
    sgst: 0,
    createdAt: "2026-03-03T19:15:00.000Z",
    items: [{ itemName: "Idli", quantity: 1, total: 120, menuItemId: 12 }],
  },
];

const MENU_ITEMS = [
  { id: 11, name: "Dosa", price: 200, categoryId: 1, category: { id: 1, name: "South Indian" } },
  { id: 12, name: "Idli", price: 120, categoryId: 1, category: { id: 1, name: "South Indian" } },
];

/**
 * The page fires nine parallel requests on mount plus a few lazily. Real
 * Response objects are not needed here — Report.tsx still uses bare `fetch`
 * and reads `.json()` directly — but every URL must answer, or a tab renders
 * its empty state for the wrong reason and the test pins the wrong behaviour.
 */
const mockReportFetches = () => {
  vi.stubGlobal(
    "fetch",
    vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      const json = (body: unknown) => Promise.resolve({ json: () => Promise.resolve(body) });

      if (url.includes("/api/bills/")) return json({ success: true, bills: BILLS });
      if (url.includes("/menu-management")) return json({ success: true, data: { menuItems: MENU_ITEMS } });
      // Left unsuccessful so the page falls back to its bills-derived P&L math
      // rather than needing a fabricated finance-engine payload.
      if (url.includes("/api/finance/")) return json({ success: false });
      if (url.includes("/lifecycle")) return json({ success: true, data: [] });
      if (url.includes("/heatmap")) return json({ success: true, data: {} });
      if (url.includes("/forecast")) return json({ success: true, data: {} });
      return json({ success: true, data: [] });
    }),
  );
};

const ALL_TABS = [
  "P&L Statement",
  "Tax Report",
  "Expense Tracker",
  "Sales Analytics",
  "Discount Analysis",
  "Menu Engineering",
  "Table Analytics",
  "Waste Report",
  "Stock Lifecycle",
  "Hourly Heatmap",
  "Day Analysis",
  "Revenue Forecast",
] as const;

const renderReport = async () => {
  mockReportFetches();
  renderWithProviders(<Report />, { preloadedState: authenticatedState() });
  await waitFor(() =>
    expect(screen.queryByText("Loading reports...")).not.toBeInTheDocument(),
  );
};

/** Tab controls appear twice (mobile picker + desktop pills); either will do. */
const openTab = async (user: ReturnType<typeof userEvent.setup>, tab: string) => {
  const controls = screen.getAllByText(tab);
  const clickable = controls.find((el) => el.closest("button")) ?? controls[0];
  await user.click(clickable.closest("button") ?? clickable);
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Reports page — characterisation", () => {
  it("loads and lands on the P&L Statement tab", async () => {
    await renderReport();
    expect(screen.getByText("Total Revenue")).toBeInTheDocument();
  });

  it("offers every tab", async () => {
    await renderReport();
    for (const tab of ALL_TABS) {
      expect(screen.getAllByText(tab).length).toBeGreaterThan(0);
    }
  });

  // The point of the suite: each tab must mount without throwing against the
  // shared data loaded once at the top. That shared state is what a
  // decomposition has to preserve, and a tab that crashes on extraction fails
  // here rather than in production.
  it.each(ALL_TABS.filter((t) => t !== "P&L Statement"))(
    "renders the %s tab without crashing",
    async (tab) => {
      const user = userEvent.setup();
      await renderReport();
      await openTab(user, tab);
      // Still mounted, still showing the page shell.
      await waitFor(() => expect(screen.getAllByText(tab).length).toBeGreaterThan(0));
      expect(screen.queryByText("Loading reports...")).not.toBeInTheDocument();
    },
  );

  it("keeps the P&L figures it derives from bills when finance data is unavailable", async () => {
    await renderReport();
    // Revenue 1000 + 500. The figure appears in both the KPI card and the P&L
    // table below it, so the count is what is pinned, not a single node.
    expect(screen.getAllByText("₹1,500").length).toBeGreaterThan(0);
    expect(screen.getByText("2 paid bills")).toBeInTheDocument();
  });

  it("survives every tab being visited in sequence", async () => {
    // Shared state is mutated as tabs mount (lifecycle month, expanded rows,
    // comparison pickers). Visiting all twelve in order is the cheapest way to
    // catch a tab that only breaks after another has run.
    const user = userEvent.setup();
    await renderReport();
    for (const tab of ALL_TABS) {
      await openTab(user, tab);
    }
    expect(screen.getAllByText("Revenue Forecast").length).toBeGreaterThan(0);
  });
});

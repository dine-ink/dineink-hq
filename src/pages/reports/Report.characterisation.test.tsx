import { afterEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Report from "./Report";
import {
  authenticatedState,
  jsonResponse,
  renderWithProviders,
  requestUrl,
} from "@/test/test-utils";

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

/** One ingredient's month, enough for Stock Lifecycle to render its summary. */
const LIFECYCLE_ROW = {
  ingredientId: 5,
  name: "Rice",
  unit: "Kg",
  openingQty: 20,
  purchasedQty: 10,
  consumedQty: 25,
  closingQty: 4,
  wastageQty: 1,
  wastagePercentage: 3.3,
  wastageCost: 60,
  pricePerUnit: 60,
};

const MENU_ITEMS = [
  { id: 11, name: "Dosa", price: 200, categoryId: 1, category: { id: 1, name: "South Indian" } },
  { id: 12, name: "Idli", price: 120, categoryId: 1, category: { id: 1, name: "South Indian" } },
];

/**
 * The page issues nine requests on mount plus a few lazily, and every URL must
 * answer — or a tab renders its empty state for the wrong reason and the test
 * pins the wrong behaviour.
 *
 * These go through jsonResponse because the page is on RTK Query now, and
 * fetchBaseQuery needs a real Response. An earlier version of this mock
 * returned a `{ json }` stand-in, which worked while the page used bare fetch
 * and would have failed every query the moment it moved.
 */
const mockReportFetches = () => {
  vi.stubGlobal(
    "fetch",
    vi.fn((input: RequestInfo | URL) => {
      // Shared helpers rather than a local stand-in: RTK Query passes a Request
      // (which String() turns into "[object Request]") and fetchBaseQuery needs
      // a real Response. Neither matters while this page is on raw fetch, and
      // both will the moment it is migrated.
      const url = requestUrl(input);
      const json = jsonResponse;

      if (url.includes("/api/bills/")) return json({ success: true, bills: BILLS });
      if (url.includes("/menu-management")) return json({ success: true, data: { menuItems: MENU_ITEMS } });
      // Left unsuccessful so the page falls back to its bills-derived P&L math
      // rather than needing a fabricated finance-engine payload.
      if (url.includes("/api/finance/")) return json({ success: false });
      if (url.includes("/lifecycle")) {
        // One row, so the tab renders its real view rather than its empty
        // state — the empty state is the branch least likely to break.
        return json({ success: true, data: [LIFECYCLE_ROW] });
      }
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

  /**
   * Each tab must mount against the shared data loaded once at the top — that
   * shared state is what a decomposition has to preserve.
   *
   * Each is checked by something it renders *itself*, not by its tab button
   * still being on screen. That distinction is the whole point: an earlier
   * version of this suite asserted only that the button was there, and a
   * scripted extraction silently dropped about a hundred lines of JSX out of
   * one of these tabs while every test stayed green. A truncated tab still
   * mounts, and its button never moved.
   *
   * The markers below are strings only the tab in question renders, so a tab
   * that loses its top, renders the wrong component, or fails to mount at all
   * now fails here.
   */
  const TAB_MARKERS: Record<string, string> = {
    "P&L Statement": "GST Collected",
    "Tax Report": "Taxable Revenue",
    "Expense Tracker": "Cost ratio",
    "Sales Analytics": "Order Type",
    "Discount Analysis": "Avg Discount per Bill",
    "Menu Engineering": "High qty · High margin",
    "Table Analytics": "Avg Turn Time",
    "Waste Report": "Total Wastage Cost",
    // A figure only reachable with lifecycle data, so this covers the tab's
    // real view rather than its empty state.
    "Stock Lifecycle": "Highest Waste Ingredient",
    "Hourly Heatmap": "Whole Menu (all orders)",
    "Day Analysis": "Revenue Share",
    // Not a chart series name: those are Recharts props, which render no text
    // in jsdom and would have made this case pass on nothing.
    "Revenue Forecast": "Last 7-Day Avg",
  };

  it.each(ALL_TABS.filter((t) => t !== "P&L Statement"))(
    "renders the %s tab's own content",
    async (tab) => {
      const user = userEvent.setup();
      await renderReport();
      await openTab(user, tab);
      await waitFor(() =>
        expect(screen.getAllByText(TAB_MARKERS[tab]).length).toBeGreaterThan(0),
      );
      expect(screen.queryByText("Loading reports...")).not.toBeInTheDocument();
    },
  );

  it("has a marker for every tab, so none is silently unchecked", () => {
    // Without this, adding a thirteenth tab to ALL_TABS and forgetting its
    // marker would make its case pass on `undefined`.
    for (const tab of ALL_TABS) {
      expect(TAB_MARKERS[tab], `no marker for ${tab}`).toBeTruthy();
    }
  });

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

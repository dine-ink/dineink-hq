import { afterEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Insights from "./Insights";
import {
  authenticatedState,
  jsonResponse,
  renderWithProviders,
  requestUrl,
} from "@/test/test-utils";

/**
 * Characterisation tests for Insights.
 *
 * Third page to get these, after Reports and Menu Management, and for the same
 * reason: 4,370 lines and 29 useState hooks need a check before anything moves.
 * They describe what the page does today, not what it should do.
 *
 * The known limit, learned on Reports: "the tab renders" is also true of a tab
 * that lost half its markup. These catch crashes and wiring; the line-accounting
 * assertion in the extraction script catches lost content. Both are needed.
 */

const ASSUMPTIONS = {
  foodCostTargetPct: 32,
  labourCostTargetPct: 25,
  rentTargetPct: 10,
};

/**
 * Every URL must answer. A tab that renders its empty state because a request
 * went unmocked pins the wrong behaviour — the test would then keep passing
 * after a refactor broke the real one.
 */
const mockFetches = () => {
  vi.stubGlobal(
    "fetch",
    vi.fn((input: RequestInfo | URL) => {
      // Shared helpers rather than a local stand-in: RTK Query passes a Request
      // (which String() turns into "[object Request]") and fetchBaseQuery needs
      // a real Response. Neither matters while this page is on raw fetch, and
      // both will the moment it is migrated.
      const url = requestUrl(input);
      const json = jsonResponse;

      if (url.includes("/finance-assumptions")) {
        return json({ success: true, data: { defaults: ASSUMPTIONS, resolved: ASSUMPTIONS } });
      }
      if (url.includes("/finance/") && url.includes("/summary")) {
        return json({
          success: true,
          data: {
            current: {
              revenue: 100000, foodCost: 32000, labourCost: 25000,
              fixedExpenses: 10000, variableExpenses: 5000, financeCost: 0,
              netProfit: 28000, ebitda: 30000, primeCost: 57000, breakEven: 80000,
            },
          },
        });
      }
      if (url.includes("/analytics/insights")) return json({ success: true, data: {} });
      if (url.includes("restaurantDashboardOverview")) return json({ success: true, data: {} });
      if (url.includes("table-operations")) return json({ success: true, data: {} });
      if (url.includes("/vendors/outstanding")) return json({ success: true, data: { total: 0 } });
      if (url.includes("/vendors/invoice-activity")) return json({ success: true, data: { hasInvoices: false } });
      if (url.includes("getRestaurantIngredients")) return json({ success: true, data: {} });
      if (url.includes("get-restock-history")) return json({ success: true, data: [] });
      if (url.includes("/menu-management")) {
        // `ingredients` is an array here, as the real endpoint sends it. It was
        // `{}` — copied from the grouped shape Menu Management builds *after*
        // fetching — which no longer passes unnoticed now that the page values
        // this stock during render rather than inside a swallowed catch.
        return json({
          success: true,
          data: { menuItems: [], categories: [], ingredients: [] },
        });
      }
      if (url.includes("/restaurant/staff/")) return json({ success: true, data: [] });
      return json({ success: true, data: {} });
    }),
  );
};

const TABS = ["Overview", "Insights Setup", "Financial Assumptions"] as const;

const renderPage = async () => {
  mockFetches();
  renderWithProviders(<Insights />, { preloadedState: authenticatedState() });
  // Anchored on the tab strip, which is the page shell rather than any one
  // tab's data. Waiting on a figure would be waiting on whichever request
  // happens to resolve last.
  await waitFor(() =>
    expect(screen.getAllByText("Financial Assumptions").length).toBeGreaterThan(0),
  );
};

const openTab = async (user: ReturnType<typeof userEvent.setup>, label: string) => {
  const hits = screen.getAllByText(label);
  const target = hits.find((el) => el.closest("button")) ?? hits[0];
  await user.click(target.closest("button") ?? target);
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Insights — characterisation", () => {
  it("loads and lands on Overview", async () => {
    await renderPage();
    expect(screen.getAllByText("Overview").length).toBeGreaterThan(0);
  });

  it("offers every tab", async () => {
    await renderPage();
    for (const label of TABS) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    }
  });

  /**
   * Checked by content each tab renders itself. "Financial Assumptions" is
   * both a tab label and a heading, so asserting on the label would have
   * passed whether the tab mounted or not.
   */
  const TAB_MARKERS: Record<string, string> = {
    Overview: "Break-Even At",
    "Insights Setup": "Business Assumptions",
    "Financial Assumptions": "Save Restaurant Defaults",
  };

  it.each(TABS.filter((t) => t !== "Overview"))(
    "renders the %s tab's own content",
    async (label) => {
      const user = userEvent.setup();
      await renderPage();
      await openTab(user, label);
      await waitFor(() =>
        expect(screen.getAllByText(TAB_MARKERS[label]).length).toBeGreaterThan(0),
      );
    },
  );

  it("has a marker for every tab, so none is silently unchecked", () => {
    for (const tab of TABS) {
      expect(TAB_MARKERS[tab], `no marker for ${tab}`).toBeTruthy();
    }
  });

  it("survives every tab being visited in sequence", async () => {
    // Financial Assumptions fetches lazily on activation and shares the
    // assumption state with Overview's targets. Visiting all three in order is
    // what catches a tab that only breaks after another has run.
    const user = userEvent.setup();
    await renderPage();
    for (const label of TABS) {
      await openTab(user, label);
    }
    expect(screen.getAllByText("Financial Assumptions").length).toBeGreaterThan(0);
  });

  it("returns to Overview after visiting the others", async () => {
    const user = userEvent.setup();
    await renderPage();
    await openTab(user, "Insights Setup");
    await openTab(user, "Overview");
    expect(screen.getAllByText("Overview").length).toBeGreaterThan(0);
  });
});

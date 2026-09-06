import { afterEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MenuManagement from "./MenuManagement";
import { authenticatedState, renderWithProviders } from "@/test/test-utils";

/**
 * Characterisation tests for Menu Management.
 *
 * Same purpose as the Reports suite: pin what the page does today so that
 * breaking up 6,359 lines and 44 useState hooks has a check. They describe
 * current behaviour, not desired behaviour.
 *
 * The known limit, learned the hard way on Reports: "the tab renders" is also
 * true of a tab that lost half its markup. A scripted extraction there silently
 * dropped a hundred lines of JSX and this style of test passed anyway. So these
 * are the safety net for crashes and wiring, and the line-accounting check in
 * the extraction script is the safety net for content. Both are needed.
 */

const MENU_ITEMS = [
  { id: 11, name: "Masala Dosa", price: 180, isAvailable: true, categoryId: 1, category: { id: 1, name: "South Indian" } },
  { id: 12, name: "Filter Coffee", price: 60, isAvailable: false, categoryId: 2, category: { id: 2, name: "Beverages" } },
];
const CATEGORIES = [
  { id: 1, name: "South Indian" },
  { id: 2, name: "Beverages" },
];
const INGREDIENTS = [
  { id: 5, name: "Rice", unit: "Kg", quantity: 20, pricePerUnit: 60, purchasePrice: 1200 },
];

/**
 * Every URL must answer. A tab that renders its empty state because a request
 * went unmocked pins the wrong behaviour — the test would then pass after a
 * refactor broke the real one.
 */
const mockFetches = () => {
  vi.stubGlobal(
    "fetch",
    vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      const json = (body: unknown) => Promise.resolve({ json: () => Promise.resolve(body) });

      if (url.includes("/menu-management")) {
        return json({ success: true, data: { menuItems: MENU_ITEMS, categories: CATEGORIES, ingredients: INGREDIENTS } });
      }
      if (url.includes("/restaurant/categories")) return json({ success: true, data: CATEGORIES });
      if (url.includes("/restaurant/menu-items")) return json({ success: true, data: MENU_ITEMS });
      if (url.includes("/get-mapped-menu")) return json({ success: true, data: [] });
      if (url.includes("/get-restock-history")) return json({ success: true, data: [] });
      if (url.includes("/daily-audit/history")) return json({ success: true, data: [] });
      if (url.includes("/menu-engineering")) {
        // `summary` is not optional: the tab reads menuEngineering.summary.star
        // directly, so omitting it throws and unmounts the page. A mock that is
        // merely well-formed is not enough — it has to be shaped like the real
        // response.
        return json({
          success: true,
          data: {
            items: [],
            summary: { star: 0, plowhorse: 0, puzzle: 0, dog: 0, avgMargin: 0, popularityThresholdPct: 0 },
          },
        });
      }
      if (url.includes("/addons/groups")) return json({ success: true, data: [] });
      if (url.includes("/api/sop")) return json({ success: true, data: [] });
      if (url.includes("/fetchVendors")) return json({ success: true, data: [] });
      if (url.includes("/restaurantwise")) return json({ success: true, bills: [] });
      return json({ success: true, data: [] });
    }),
  );
};

const TABS = [
  ["menu", "Menu"],
  ["addons", "Add-Ons"],
  ["ingredients", "Ingredients"],
  ["restock", "Restock"],
  ["mapping", "Item Mapping"],
  ["analytics", "Analytics"],
  ["engineering", "Menu Engineering"],
  ["operations", "Operations"],
] as const;

const renderPage = async () => {
  mockFetches();
  renderWithProviders(<MenuManagement />, { preloadedState: authenticatedState() });
  // Anchored on the page shell, not on data. The Menu tab does not print item
  // names as plain text on load — they sit inside inputs and collapsed rows —
  // so waiting for one would be waiting for something that never arrives.
  await waitFor(() => expect(screen.getAllByText("Menu Operations").length).toBeGreaterThan(0));
};

const openTab = async (user: ReturnType<typeof userEvent.setup>, label: string) => {
  const hits = screen.getAllByText(label);
  const target = hits.find((el) => el.closest("button")) ?? hits[0];
  await user.click(target.closest("button") ?? target);
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Menu Management — characterisation", () => {
  it("loads and lands on the Menu tab", async () => {
    await renderPage();
    expect(screen.getAllByText("Menu").length).toBeGreaterThan(0);
    expect(
      screen.getAllByText("Manage all menu items, categories and pricing").length,
    ).toBeGreaterThan(0);
  });

  it("offers every tab", async () => {
    await renderPage();
    for (const [, label] of TABS) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    }
  });

  it.each(TABS.filter(([id]) => id !== "menu"))(
    "renders the %s tab without crashing",
    async (_id, label) => {
      const user = userEvent.setup();
      await renderPage();
      await openTab(user, label);
      await waitFor(() => expect(screen.getAllByText(label).length).toBeGreaterThan(0));
    },
  );

  it("survives every tab being visited in sequence", async () => {
    // Three tabs fetch lazily on activation (operations, engineering, addons)
    // and share state with the rest. Visiting all eight in order is what
    // catches a tab that only breaks after another has run.
    const user = userEvent.setup();
    await renderPage();
    for (const [, label] of TABS) {
      await openTab(user, label);
    }
    expect(screen.getAllByText("Operations").length).toBeGreaterThan(0);
  });
});

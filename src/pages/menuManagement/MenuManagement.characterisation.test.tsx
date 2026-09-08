import { afterEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MenuManagement from "./MenuManagement";
import {
  authenticatedState,
  jsonResponse,
  renderWithProviders,
  requestUrl,
} from "@/test/test-utils";

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
// What the menu-management payload's `categories` field actually holds: the
// ingredient category table. Deliberately different from CATEGORIES so a test
// can tell which list a dropdown was fed.
const INGREDIENT_CATEGORIES = [
  { id: 1, name: "Grains" },
  { id: 2, name: "Dairy" },
];
const INGREDIENTS = [
  { id: 5, name: "Rice", unit: "Kg", quantity: 20, pricePerUnit: 60, purchasePrice: 1200 },
];
const ADD_ON_GROUPS = [
  { id: 71, name: "Sauces & Dips", options: [{ id: 91, name: "Extra Cheese", price: 40 }], menuItems: [] },
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
      // requestUrl, not String(input): RTK Query passes a Request object, and
      // stringifying one gives "[object Request]" — which matched none of the
      // branches below and fell through to the empty default. The tab then
      // rendered its empty state and the test passed while proving nothing.
      const url = requestUrl(input);
      const json = jsonResponse;

      if (url.includes("/menu-management")) {
        return json({ success: true, data: { menuItems: MENU_ITEMS, categories: INGREDIENT_CATEGORIES, ingredients: INGREDIENTS } });
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
        // One item, so the tab renders the matrix rather than its "no sales
        // recorded yet" state. `summary` is not optional either way: the tab
        // reads summary.star directly and omitting it throws.
        return json({
          success: true,
          data: {
            // Every field the tab reads. `cost` in particular is not optional:
            // the table does `item.cost.toFixed(2)` with no guard, so a payload
            // missing it takes the whole tab down rather than showing a blank
            // cell. Worth knowing, and worth this fixture being complete.
            items: [
              {
                id: 11,
                name: "Masala Dosa",
                category: "South Indian",
                classification: "STAR",
                quantitySold: 40,
                popularityShare: 55,
                price: 180,
                cost: 68.5,
                margin: 111.5,
                marginPct: 62,
              },
            ],
            summary: {
              star: 1,
              plowhorse: 0,
              puzzle: 0,
              dog: 0,
              avgMargin: 62,
              popularityThresholdPct: 25,
            },
          },
        });
      }
      if (url.includes("/addons/groups")) return json({ success: true, data: ADD_ON_GROUPS });
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
  it("fills the Menu tab's category dropdown from menu categories, not ingredient categories", async () => {
    await renderPage();
    await waitFor(() =>
      expect(screen.getAllByRole("option", { name: "South Indian" }).length).toBeGreaterThan(0),
    );
    expect(screen.queryAllByRole("option", { name: "Grains" })).toHaveLength(0);
  });

  it("filters the Item Mapping list as you type in its search box", async () => {
    const user = userEvent.setup();
    await renderPage();
    await openTab(user, "Item Mapping");
    await waitFor(() => expect(screen.getAllByText("Filter Coffee").length).toBeGreaterThan(0));

    await user.type(screen.getByLabelText("Search menu items"), "dosa");

    expect(screen.queryAllByText("Filter Coffee")).toHaveLength(0);
    expect(screen.getAllByText("Masala Dosa").length).toBeGreaterThan(0);

    await user.clear(screen.getByLabelText("Search menu items"));
    await user.type(screen.getByLabelText("Search menu items"), "zzz");
    expect(screen.getByText('No menu items match "zzz".')).toBeInTheDocument();
  });

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

  /**
   * Each tab is checked by something it renders itself, not by its tab button
   * still being on screen. The button never moves, so asserting on it passes
   * for a tab that lost half its markup — which is exactly what happened once
   * during the Reports extraction, with every test green.
   */
  const TAB_MARKERS: Record<string, string> = {
    menu: "Filter by category",
    addons: "Sauces & Dips",
    ingredients: "Ingredient inventory & vendor management",
    restock: "Opening Value",
    // The tab's subtitle rather than a row control: the ingredient rows only
    // exist once a mapping is loaded, and the empty case is the one least
    // likely to break.
    mapping: "Recipe costing & ingredient intelligence",
    analytics: "Highest Cost",
    // The tab's own heading, which collides with nothing: the tab *button*
    // reads "Menu Engineering" too, so this is matched by count elsewhere —
    // here the marker only has to be text the tab itself puts on screen.
    engineering: "Popularity vs. Margin",
    operations: "SOP Checklists",
  };

  it.each(TABS.filter(([id]) => id !== "menu"))(
    "renders the %s tab's own content",
    async (id, label) => {
      const user = userEvent.setup();
      await renderPage();
      await openTab(user, label);
      await waitFor(() =>
        expect(screen.getAllByText(TAB_MARKERS[id]).length).toBeGreaterThan(0),
      );
    },
  );

  it("has a marker for every tab, so none is silently unchecked", () => {
    for (const [id] of TABS) {
      expect(TAB_MARKERS[id], `no marker for ${id}`).toBeTruthy();
    }
  });

  it("shows add-on groups the server returned, not just an empty tab", async () => {
    // The point of this one is the data path, not the markup. Everything on the
    // Add-Ons tab now arrives through RTK Query, and a tab that renders its
    // empty state looks identical to a working one — so assert on a value that
    // could only have come from the response.
    const user = userEvent.setup();
    await renderPage();
    await openTab(user, "Add-Ons");
    await waitFor(() => expect(screen.getAllByText("Sauces & Dips").length).toBeGreaterThan(0));
    expect(screen.getAllByText(/Extra Cheese/).length).toBeGreaterThan(0);
  });

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

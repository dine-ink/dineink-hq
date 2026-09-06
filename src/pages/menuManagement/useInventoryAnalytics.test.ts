import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import { useInventoryAnalytics } from "./useInventoryAnalytics";

/**
 * The arithmetic behind Menu Management, tested without rendering it.
 *
 * Same reason as the Reports suite: these were eight `const`s scattered down a
 * 5,400-line component, reachable only by mounting the whole page. Restock,
 * Analytics and Item Mapping all show the numbers, and none of them had a
 * direct test.
 *
 * These pin what the code does today, including the parts that look like
 * oversights. Where behaviour is odd, the test says so rather than correcting
 * it — this extraction's contract is that the numbers do not change.
 */

const ing = (over: Record<string, unknown> = {}) => ({
  id: 1,
  name: "Rice",
  unit: "Kg",
  pricePerUnit: 60,
  category: { name: "Grains" },
  ...over,
});

/** A menu item with one ingredient mapped to it. */
const item = (over: Record<string, unknown> = {}, mapping: Record<string, unknown> = {}) => ({
  id: 11,
  price: 100,
  menuItemIngredients: [{ quantity: 100, unit: "gram", ingredient: ing(), ...mapping }],
  ...over,
});

const billFor = (menuItemId: number, quantity: number) => ({
  items: [{ menuItemId, quantity }],
});

const run = (
  bills: any[] = [],
  menuItems: any[] = [],
  allIngredients: any[] = [],
  mappedItems: any[] = [],
) =>
  renderHook(() => useInventoryAnalytics(bills, menuItems, allIngredients, mappedItems))
    .result.current;

describe("useInventoryAnalytics — ingredient consumption", () => {
  it("returns nothing at all when there are no bills or no menu items", () => {
    expect(run([], [item()]).ingredientAnalytics).toEqual([]);
    expect(run([billFor(11, 1)], []).ingredientAnalytics).toEqual([]);
  });

  it("converts a gram mapping against a Kg ingredient", () => {
    // 100g of rice at ₹60/Kg, sold twice → 200g consumed, ₹12.
    const r = run([billFor(11, 2)], [item()]);
    expect(r.ingredientAnalytics).toHaveLength(1);
    expect(r.ingredientAnalytics[0]).toMatchObject({
      ingredient: "Rice",
      category: "Grains",
      consumed: 200,
      totalCost: 12,
    });
  });

  it("converts an ml mapping against a Litre ingredient", () => {
    const oil = item({}, { unit: "ml", ingredient: ing({ unit: "Litre", name: "Oil", pricePerUnit: 200 }) });
    expect(run([billFor(11, 1)], [oil]).ingredientAnalytics[0].totalCost).toBe(20);
  });

  it("multiplies straight through when the units already match", () => {
    const kg = item({}, { quantity: 2, unit: "Kg" });
    expect(run([billFor(11, 3)], [kg]).ingredientAnalytics[0].totalCost).toBe(360);
  });

  it("multiplies straight through for a pairing it cannot convert", () => {
    // gram against a Litre ingredient is not a conversion the code knows, and
    // it falls through to qty * price rather than skipping the line. Pinned as
    // behaviour, not endorsed: the figure is wrong by a factor of 1000.
    const odd = item({}, { unit: "gram", ingredient: ing({ unit: "Litre" }) });
    expect(run([billFor(11, 1)], [odd]).ingredientAnalytics[0].totalCost).toBe(6000);
  });

  it("aggregates one ingredient across several bills and items", () => {
    const a = item({ id: 11 });
    const b = item({ id: 12 }, { quantity: 50 });
    const r = run([billFor(11, 1), billFor(12, 2)], [a, b]);
    expect(r.ingredientAnalytics).toHaveLength(1);
    expect(r.ingredientAnalytics[0].consumed).toBe(200);
  });

  it("skips bill lines for items it cannot find, and mappings with no ingredient", () => {
    const orphan = item({}, { ingredient: null });
    expect(run([billFor(99, 1)], [item()]).ingredientAnalytics).toEqual([]);
    expect(run([billFor(11, 1)], [orphan]).ingredientAnalytics).toEqual([]);
  });

  it("buckets an ingredient with no category as Other", () => {
    const nc = item({}, { ingredient: ing({ category: undefined }) });
    expect(run([billFor(11, 1)], [nc]).ingredientAnalytics[0].category).toBe("Other");
  });
});

describe("useInventoryAnalytics — averages", () => {
  it("averages food cost only over items that carry a price", () => {
    // ₹6 of rice in a ₹100 dish is 6%. The unpriced item must not drag the
    // divisor up — that understated the average before it was fixed.
    const priced = item({ id: 11 });
    const unpriced = item({ id: 12, price: 0 });
    expect(run([], [priced, unpriced]).avgFoodCost).toBe("6.0");
  });

  it("ignores menu items with no ingredients mapped to them at all", () => {
    const bare = { id: 13, price: 100, menuItemIngredients: [] };
    expect(run([], [item(), bare]).avgFoodCost).toBe("6.0");
  });

  it('returns the string "0" when nothing is priced', () => {
    expect(run([], [item({ price: 0 })]).avgFoodCost).toBe("0");
  });

  it("derives profit margin from the food cost", () => {
    expect(run([], [item()]).avgProfitMargin).toBe("94.0");
  });

  it("averages recipe cost over the mapped items, rounded to whole rupees", () => {
    const r = run([], [], [], [item({ id: 11 }), item({ id: 12 }, { quantity: 200 })]);
    // ₹6 and ₹12 → ₹9.
    expect(r.avgRecipeCost).toBe("9");
  });

  it("returns the number 0, not the string, when nothing is mapped", () => {
    // Deliberately pinned: avgFoodCost falls back to "0" and avgRecipeCost to
    // 0. The two are inconsistent, and both are rendered directly, so the
    // difference is only invisible because `{0}` and `{"0"}` look alike.
    const r = run();
    expect(r.avgRecipeCost).toBe(0);
    expect(r.avgFoodCost).toBe("0");
  });
});

describe("useInventoryAnalytics — stock value and turnover", () => {
  it("values stock at quantity times unit price", () => {
    const r = run([], [], [
      { quantity: 20, pricePerUnit: 60 },
      { quantity: 5, pricePerUnit: 100 },
    ]);
    expect(r.inventoryValue).toBe(1700);
  });

  it("treats missing quantities and prices as zero", () => {
    expect(run([], [], [{ quantity: null, pricePerUnit: 60 }, {}]).inventoryValue).toBe(0);
  });

  it("totals consumption value across every ingredient", () => {
    const r = run([billFor(11, 2)], [item()]);
    expect(r.totalConsumptionValue).toBe(12);
  });

  it("divides consumption by stock value for turnover", () => {
    const r = run([billFor(11, 2)], [item()], [{ quantity: 1, pricePerUnit: 24 }]);
    expect(r.inventoryTurnover).toBe("0.50");
  });

  it("guards the divisor so empty stock does not blow up", () => {
    // max(inventoryValue, 1): with no stock the ratio becomes the raw
    // consumption rather than Infinity.
    const r = run([billFor(11, 2)], [item()], []);
    expect(r.inventoryTurnover).toBe("12.00");
  });
});

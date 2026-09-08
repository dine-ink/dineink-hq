import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { authenticatedState, hookWrapper } from "@/test/test-utils";
import { useIngredientMapping } from "./useIngredientMapping";

/**
 * The recipe-cost arithmetic behind the Item Mapping tab.
 *
 * This is money: totalRecipeCost drives the food-cost percentage and the margin
 * shown against a menu item's selling price, and those are the numbers someone
 * prices a dish from.
 *
 * It is also the second implementation of "what does this recipe cost" in the
 * codebase, and the two do not agree. useInventoryAnalytics (Analytics, Reports)
 * compares the mapping's unit against the *ingredient's own* unit; this one
 * switches on the mapping's unit alone and assumes the price is per Kg or per
 * Litre. The last two tests below pin that divergence rather than paper over it
 * — which of the two is right is a product question, and changing either moves
 * figures people have already seen.
 */

const render = () => {
  const { Wrapper } = hookWrapper(authenticatedState());
  return renderHook(() => useIngredientMapping([], () => {}), { wrapper: Wrapper });
};

/** One mapping row: `unit` is the recipe's unit, `ingredient.unit` the stock's. */
const row = (over: Record<string, unknown> = {}) => ({
  quantity: 100,
  unit: "gm",
  ingredient: { id: 1, name: "Rice", unit: "Kg", pricePerUnit: 60 },
  ...over,
});

const withRows = (rows: any[], selected?: any) => {
  const hook = render();
  act(() => {
    hook.result.current.setIngredientMappings(rows);
    if (selected) hook.result.current.setSelectedMenuItem(selected);
  });
  return hook;
};

describe("useIngredientMapping — recipe cost", () => {
  it("converts grams against a per-Kg price", () => {
    // 100g of rice at ₹60/Kg is ₹6.
    const { result } = withRows([row()]);
    expect(result.current.totalRecipeCost).toBeCloseTo(6, 5);
  });

  it("converts millilitres the same way", () => {
    const { result } = withRows([
      row({ unit: "ml", ingredient: { unit: "Litre", pricePerUnit: 200 } }),
    ]);
    expect(result.current.totalRecipeCost).toBeCloseTo(20, 5);
  });

  it("multiplies straight through for Kg and Litre", () => {
    const { result } = withRows([
      row({ quantity: 2, unit: "Kg" }),
      row({ quantity: 3, unit: "Litre", ingredient: { unit: "Litre", pricePerUnit: 100 } }),
    ]);
    expect(result.current.totalRecipeCost).toBeCloseTo(2 * 60 + 3 * 100, 5);
  });

  it("multiplies straight through for anything else, which is the piece case", () => {
    const { result } = withRows([
      row({ quantity: 4, unit: "piece", ingredient: { unit: "piece", pricePerUnit: 12 } }),
    ]);
    expect(result.current.totalRecipeCost).toBeCloseTo(48, 5);
  });

  it("skips a row with no ingredient attached", () => {
    const { result } = withRows([row({ ingredient: null }), row()]);
    expect(result.current.totalRecipeCost).toBeCloseTo(6, 5);
  });

  it("treats a missing quantity or price as zero", () => {
    const { result } = withRows([
      row({ quantity: null }),
      row({ ingredient: { unit: "Kg", pricePerUnit: null } }),
    ]);
    expect(result.current.totalRecipeCost).toBe(0);
  });

  it("sums every row", () => {
    const { result } = withRows([row(), row({ quantity: 200 }), row({ quantity: 50 })]);
    expect(result.current.totalRecipeCost).toBeCloseTo(6 + 12 + 3, 5);
  });
});

describe("useIngredientMapping — food cost and margin", () => {
  it("expresses the recipe cost as a percentage of the selling price", () => {
    // ₹6 of rice in a ₹100 dish.
    const { result } = withRows([row()], { id: 11, price: 100 });
    expect(result.current.foodCostPercentage).toBe("6.0");
    expect(result.current.margin).toBe("94.0");
  });

  it("returns a one-decimal string, not a number", () => {
    // Rendered directly, so a number here would print 6.000000000000001%.
    const { result } = withRows([row()], { id: 11, price: 100 });
    expect(typeof result.current.foodCostPercentage).toBe("string");
    expect(typeof result.current.margin).toBe("string");
  });

  it("gives 0 rather than dividing by an unpriced item", () => {
    const { result } = withRows([row()], { id: 11, price: 0 });
    expect(result.current.foodCostPercentage).toBe(0);
    expect(result.current.margin).toBe(0);
  });

  it("gives 0 when no item is selected at all", () => {
    const { result } = withRows([row()]);
    expect(result.current.foodCostPercentage).toBe(0);
  });
});

describe("useIngredientMapping — where it disagrees with useInventoryAnalytics", () => {
  it("still divides by 1000 for an ingredient priced per gram", () => {
    // The stock is priced per *gram*, and the recipe asks for 100 gm, so the
    // cost is 100 × price. This switches on the recipe's unit alone, sees "gm",
    // and divides — reporting a thousandth of the real cost.
    //
    // useInventoryAnalytics compares the two units, finds them equal, and
    // multiplies straight through. Both screens claim to show this dish's food
    // cost, and for this ingredient they differ by 1000x.
    const { result } = withRows([
      row({ quantity: 100, unit: "gm", ingredient: { unit: "gram", pricePerUnit: 0.06 } }),
    ]);
    expect(result.current.totalRecipeCost).toBeCloseTo(0.006, 6);
    // What the other implementation would give for the same row:
    const analyticsWouldSay = 100 * 0.06;
    expect(analyticsWouldSay).toBeCloseTo(6, 5);
  });

  it("does not overstate a gram-against-Litre pairing, where the other does", () => {
    // The divergence runs both ways. Here this implementation is the sane one:
    // it sees "gm" and divides. useInventoryAnalytics finds no conversion it
    // knows for gram-against-Litre and falls through to qty × price, which
    // overstates by 1000x — the case its own tests pin as a known fault.
    const { result } = withRows([
      row({ quantity: 100, unit: "gm", ingredient: { unit: "Litre", pricePerUnit: 60 } }),
    ]);
    expect(result.current.totalRecipeCost).toBeCloseTo(6, 5);
  });
});

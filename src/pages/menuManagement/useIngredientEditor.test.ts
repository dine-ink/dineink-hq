import { afterEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { authenticatedState, hookWrapper } from "@/test/test-utils";
import { confirmAction } from "@/utils/confirmAction";
import { notify } from "@/utils/notify";
import { useIngredientEditor } from "./useIngredientEditor";

vi.mock("@/utils/confirmAction", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/utils/confirmAction")>()),
  confirmAction: vi.fn(),
}));

vi.mock("@/utils/notify", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/utils/notify")>()),
  notify: vi.fn(),
}));

/**
 * The ingredient stock draft: a map of category name to a list of editable
 * rows, and the handlers that add, remove and edit them.
 *
 * The one piece of real business logic in here is the unit price. Someone types
 * what they paid and how much they got, and pricePerUnit is derived from the
 * two — which then feeds every recipe cost, every food-cost percentage and
 * every margin in the app. It is worth knowing exactly when it recomputes and
 * when it does not.
 */

const render = () => {
  const { Wrapper } = hookWrapper(authenticatedState());
  return renderHook(() => useIngredientEditor(() => {}), { wrapper: Wrapper });
};

const row = (over: Record<string, unknown> = {}) => ({
  name: "Rice",
  quantity: "",
  unit: "Kg",
  purchasePrice: "",
  pricePerUnit: "",
  ...over,
});

/** Seeds the draft, then runs `act`ions against it. */
const withDraft = (draft: Record<string, any[]>) => {
  const hook = render();
  act(() => hook.result.current.setIngredients(draft));
  return hook;
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.mocked(notify).mockClear();
  vi.mocked(confirmAction).mockReset();
});

describe("useIngredientEditor — rows", () => {
  it("puts a blank row at the top of the category, defaulting to Kg", () => {
    const hook = withDraft({ Grains: [row()] });
    act(() => hook.result.current.handleAddIngredient("Grains"));

    const rows = hook.result.current.ingredients.Grains;
    expect(rows).toHaveLength(2);
    expect(rows[1]).toEqual(row());
    expect(rows[0]).toEqual({
      name: "",
      quantity: "",
      unit: "Kg",
      purchasePrice: "",
      pricePerUnit: "",
    });
  });

  it("removes the row at an index and leaves the rest in order", () => {
    const hook = withDraft({
      Grains: [row({ name: "Rice" }), row({ name: "Wheat" }), row({ name: "Ragi" })],
    });
    act(() => hook.result.current.handleRemoveIngredient("Grains", 1));

    expect(hook.result.current.ingredients.Grains.map((r: any) => r.name)).toEqual([
      "Rice",
      "Ragi",
    ]);
  });

  it("leaves other categories alone when removing", () => {
    const hook = withDraft({ Grains: [row()], Dairy: [row({ name: "Milk" })] });
    act(() => hook.result.current.handleRemoveIngredient("Grains", 0));

    expect(hook.result.current.ingredients.Grains).toEqual([]);
    expect(hook.result.current.ingredients.Dairy).toHaveLength(1);
  });
});

describe("useIngredientEditor — categories", () => {
  it("adds a category as an empty list and clears the input", () => {
    const hook = withDraft({ Grains: [row()] });
    act(() => hook.result.current.setNewCategoryName("  Spices  "));
    act(() => hook.result.current.handleAddCategory());

    // Trimmed, so the key is not "  Spices  ".
    expect(hook.result.current.ingredients.Spices).toEqual([]);
    expect(hook.result.current.newCategoryName).toBe("");
    expect(hook.result.current.showAddCategory).toBe(false);
  });

  it("records it as manually added, which is how the UI tells them apart", () => {
    const hook = withDraft({});
    act(() => hook.result.current.setNewCategoryName("Spices"));
    act(() => hook.result.current.handleAddCategory());

    expect(hook.result.current.manualCategories.has("Spices")).toBe(true);
  });

  it("ignores a blank or whitespace-only name", () => {
    const hook = withDraft({});
    act(() => hook.result.current.setNewCategoryName("   "));
    act(() => hook.result.current.handleAddCategory());

    expect(Object.keys(hook.result.current.ingredients)).toEqual([]);
  });

  it("refuses a duplicate rather than replacing the rows under it", () => {
    const hook = withDraft({ Grains: [row({ name: "Rice" })] });
    act(() => hook.result.current.setNewCategoryName("Grains"));
    act(() => hook.result.current.handleAddCategory());

    // The existing row survives; without the guard this would have blanked it.
    expect(hook.result.current.ingredients.Grains).toHaveLength(1);
    // A warning rather than an error: nothing broke, the name is just taken.
    expect(notify).toHaveBeenCalledWith("Category already exists", "warning");
  });

  it("also refuses a duplicate of an *empty* category", () => {
    // The guard is `ingredients[name] !== undefined`, not a truthiness check,
    // because an empty category still exists.
    //
    // Asserting on the keys alone would not catch a regression here — adding
    // "Grains" again would set it to [] and the keys would look identical. What
    // distinguishes the two is the early return: it leaves the typed name in
    // the input, where a successful add clears it.
    const hook = withDraft({ Grains: [] });
    act(() => hook.result.current.setNewCategoryName("Grains"));
    act(() => hook.result.current.handleAddCategory());

    expect(Object.keys(hook.result.current.ingredients)).toEqual(["Grains"]);
    expect(hook.result.current.newCategoryName).toBe("Grains");
    expect(hook.result.current.manualCategories.has("Grains")).toBe(false);
  });

  it("deletes a category and its rows once confirmed", async () => {
    vi.mocked(confirmAction).mockResolvedValue(true);
    const hook = withDraft({ Grains: [row()], Dairy: [row()] });
    await act(() => hook.result.current.handleDeleteCategory("Grains"));

    expect(Object.keys(hook.result.current.ingredients)).toEqual(["Dairy"]);
  });

  it("keeps everything when the confirmation is declined", async () => {
    // The whole point of the guard: declining must leave the draft untouched.
    vi.mocked(confirmAction).mockResolvedValue(false);
    const hook = withDraft({ Grains: [row()], Dairy: [row()] });
    await act(() => hook.result.current.handleDeleteCategory("Grains"));

    expect(Object.keys(hook.result.current.ingredients)).toEqual(["Grains", "Dairy"]);
  });

  it("asks before deleting, naming the category", async () => {
    vi.mocked(confirmAction).mockResolvedValue(false);
    const hook = withDraft({ Grains: [row()] });
    await act(() => hook.result.current.handleDeleteCategory("Grains"));

    expect(confirmAction).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Delete the "Grains" category?' }),
    );
  });
});

describe("useIngredientEditor — the derived unit price", () => {
  it("works out price per unit from what was paid and how much arrived", () => {
    // ₹1,200 for 20 Kg is ₹60/Kg, and that figure is what every recipe cost in
    // the app is computed from.
    const hook = withDraft({ Grains: [row()] });
    act(() => hook.result.current.handleFieldChange("Grains", 0, "quantity", "20"));
    act(() => hook.result.current.handleFieldChange("Grains", 0, "purchasePrice", "1200"));

    expect(hook.result.current.ingredients.Grains[0].pricePerUnit).toBe("60.00");
  });

  it("rounds to two decimals", () => {
    const hook = withDraft({ Grains: [row()] });
    act(() => hook.result.current.handleFieldChange("Grains", 0, "quantity", "3"));
    act(() => hook.result.current.handleFieldChange("Grains", 0, "purchasePrice", "100"));

    expect(hook.result.current.ingredients.Grains[0].pricePerUnit).toBe("33.33");
  });

  it("recomputes when either input changes", () => {
    const hook = withDraft({ Grains: [row({ quantity: "20", purchasePrice: "1200" })] });
    act(() => hook.result.current.handleFieldChange("Grains", 0, "quantity", "10"));

    expect(hook.result.current.ingredients.Grains[0].pricePerUnit).toBe("120.00");
  });

  it("leaves a previous unit price in place when an input goes to zero", () => {
    // Pinned, not endorsed. The recompute is guarded on both being > 0, so
    // clearing the quantity keeps the last derived figure rather than blanking
    // it — a row can end up showing a price per unit that its own two numbers
    // no longer support.
    const hook = withDraft({ Grains: [row({ quantity: "20", purchasePrice: "1200" })] });
    act(() => hook.result.current.handleFieldChange("Grains", 0, "quantity", "20"));
    expect(hook.result.current.ingredients.Grains[0].pricePerUnit).toBe("60.00");

    act(() => hook.result.current.handleFieldChange("Grains", 0, "quantity", "0"));
    expect(hook.result.current.ingredients.Grains[0].pricePerUnit).toBe("60.00");
  });

  it("does not derive anything from a non-numeric entry", () => {
    const hook = withDraft({ Grains: [row()] });
    act(() => hook.result.current.handleFieldChange("Grains", 0, "quantity", "abc"));
    act(() => hook.result.current.handleFieldChange("Grains", 0, "purchasePrice", "1200"));

    expect(hook.result.current.ingredients.Grains[0].pricePerUnit).toBe("");
  });

  it("writes the field it was given, price or not", () => {
    const hook = withDraft({ Grains: [row()] });
    act(() => hook.result.current.handleFieldChange("Grains", 0, "name", "Basmati"));
    act(() => hook.result.current.handleFieldChange("Grains", 0, "unit", "gram"));

    expect(hook.result.current.ingredients.Grains[0]).toMatchObject({
      name: "Basmati",
      unit: "gram",
    });
  });

  it("edits only the row it was pointed at", () => {
    const hook = withDraft({ Grains: [row({ name: "Rice" }), row({ name: "Wheat" })] });
    act(() => hook.result.current.handleFieldChange("Grains", 1, "name", "Atta"));

    expect(hook.result.current.ingredients.Grains.map((r: any) => r.name)).toEqual([
      "Rice",
      "Atta",
    ]);
  });
});

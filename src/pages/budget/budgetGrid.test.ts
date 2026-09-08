import { describe, expect, it } from "vitest";
import { gridFromItems, isGridDirty, itemsFromGrid } from "./budgetGrid";

const items = [
  { category: "rent", year: 2026, month: 4, amount: 50000 },
  { category: "labour", year: 2026, month: 4, amount: 120000 },
];

describe("budget grid", () => {
  it("round-trips saved items through the grid", () => {
    const grid = gridFromItems(items);
    expect(grid).toEqual({ "rent:2026:4": 50000, "labour:2026:4": 120000 });
    expect(itemsFromGrid(grid)).toEqual(items);
  });

  it("drops blank cells when building items to save", () => {
    expect(itemsFromGrid({ "rent:2026:4": 50000, "gas:2026:4": "" })).toEqual([
      { category: "rent", year: 2026, month: 4, amount: 50000 },
    ]);
  });

  it("is clean straight after loading", () => {
    const grid = gridFromItems(items);
    expect(isGridDirty(grid, gridFromItems(items))).toBe(false);
  });

  it("is dirty once a cell changes, and clean again when it changes back", () => {
    const saved = gridFromItems(items);
    expect(isGridDirty({ ...saved, "rent:2026:4": 55000 }, saved)).toBe(true);
    expect(isGridDirty({ ...saved, "rent:2026:4": 50000 }, saved)).toBe(false);
  });

  it("treats a blank cell and a missing cell as the same", () => {
    const saved = gridFromItems(items);
    expect(isGridDirty({ ...saved, "gas:2026:5": "" }, saved)).toBe(false);
    expect(isGridDirty({ ...saved, "gas:2026:5": 0 }, saved)).toBe(true);
  });
});

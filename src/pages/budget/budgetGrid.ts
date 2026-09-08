/**
 * The budget detail grid as data: one cell per category and month, keyed
 * "category:year:month". Kept pure so the tab can tell a clean grid from an
 * edited one without a component test.
 */

export type GridValues = Record<string, number | "">;

export interface BudgetItem {
  category: string;
  year: number;
  month: number;
  amount: number;
}

export const gridKey = (category: string, year: number, month: number) => `${category}:${year}:${month}`;

/** The saved line items laid out as grid cells. */
export const gridFromItems = (items: BudgetItem[] | undefined | null): GridValues => {
  const values: GridValues = {};
  (items || []).forEach((item) => {
    values[gridKey(item.category, item.year, item.month)] = item.amount;
  });
  return values;
};

/** The grid as the line items the save endpoint takes. Blank cells are omitted. */
export const itemsFromGrid = (grid: GridValues): BudgetItem[] =>
  Object.entries(grid)
    .filter(([, v]) => v !== "")
    .map(([key, amount]) => {
      const [category, year, month] = key.split(":");
      return { category, year: Number(year), month: Number(month), amount: Number(amount) };
    });

/**
 * Whether the grid differs from what was last saved. A blank cell and a
 * missing cell are the same thing, so clearing a never-set cell is not an edit.
 */
export const isGridDirty = (grid: GridValues, saved: GridValues): boolean => {
  const keys = new Set([...Object.keys(grid), ...Object.keys(saved)]);
  for (const key of keys) {
    const a = grid[key] === undefined || grid[key] === "" ? "" : Number(grid[key]);
    const b = saved[key] === undefined || saved[key] === "" ? "" : Number(saved[key]);
    if (a !== b) return true;
  }
  return false;
};

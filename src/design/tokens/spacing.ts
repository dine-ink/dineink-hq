// Single source of truth for spacing. The app already consistently uses
// Tailwind's default 4px-based scale throughout (px-4, gap-3, py-2.5, etc.
// account for the overwhelming majority of spacing utilities repo-wide) —
// this file formalizes that scale with real px values for anywhere spacing
// needs a raw number (inline styles, chart margins, non-Tailwind contexts),
// plus semantic names for the recurring layout roles the brief calls out
// (page/section/dialog/table/grid spacing).

export const space = {
  0: "0px",
  0.5: "2px",
  1: "4px",
  1.5: "6px",
  2: "8px",
  2.5: "10px",
  3: "12px",
  4: "16px",
  5: "20px",
  6: "24px",
  8: "32px",
  10: "40px",
  12: "48px",
  16: "64px",
} as const;

// Semantic spacing roles — reach for these when writing a *new* layout
// section so the intent is named, not just a bare number. Each maps back to
// the base 4px scale above (no new values introduced).
export const layoutSpacing = {
  pagePadding: space[3], // outer page gutter (mx-auto container padding)
  pageGap: space[3], // gap between a page's top-level sections
  sectionPadding: space[4], // padding inside a card/section
  sectionGap: space[3], // gap between cards within a section
  cardPadding: space[4],
  dialogPadding: space[5],
  dialogSectionGap: space[4],
  gridGap: space[3], // KPI/card grid gap
  tableCellPaddingX: space[4],
  tableCellPaddingY: space[2.5],
  formFieldGap: space[4], // vertical gap between form fields
  formSectionGap: space[6], // gap between form sections
} as const;

export const spacing = { space, layoutSpacing } as const;
export default spacing;

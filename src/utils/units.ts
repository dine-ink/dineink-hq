// Mirrors dineink-backend/src/utils/units.ts's display formatter. All
// quantities arrive from the API already in the canonical unit (Kg / Litre /
// Piece) — this just auto-scales small amounts to a more readable unit for
// display (e.g. 0.25 Kg -> "250 g"), independent of how it was entered.
export function formatQty(qty: number, canonicalUnit?: string | null): string {
  const n = Number(qty) || 0;
  const unit = canonicalUnit || "";
  const trimmed = (v: number) =>
    v % 1 === 0 ? String(v) : v.toFixed(Math.abs(v) < 10 ? 3 : 1).replace(/\.?0+$/, "");

  if (unit === "Kg" && Math.abs(n) < 1) return `${trimmed(n * 1000)} g`;
  if (unit === "Litre" && Math.abs(n) < 1) return `${trimmed(n * 1000)} ml`;
  return `${trimmed(n)}${unit ? ` ${unit}` : ""}`;
}

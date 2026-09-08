import type { KeyboardEvent } from "react";

/**
 * Props for a number input whose value can never be negative: quantities,
 * prices, counts, percentages of a whole.
 *
 * `min` alone only stops the spinner and the picker; a typed "-" still lands
 * in state. Blocking the key covers typing, and blocking "e" stops exponent
 * notation ("1e3") slipping past a min check. Spread this before the input's
 * own props so an explicit `min` (say, 1) still wins.
 *
 * Not for fields where a negative is a real answer: growth rates, scenario
 * adjustments, temperature-style deltas.
 */
export const blockNegativeKeys = (e: KeyboardEvent<HTMLInputElement>) => {
  if (e.key === "-" || e.key === "e" || e.key === "E") e.preventDefault();
};

export const nonNegative = {
  min: 0,
  inputMode: "decimal" as const,
  onKeyDown: blockNegativeKeys,
};

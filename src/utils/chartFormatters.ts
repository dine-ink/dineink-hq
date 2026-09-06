import type { ComponentProps, ReactNode } from "react";
import type { Tooltip } from "recharts";

/**
 * Recharts tooltip formatters.
 *
 * Recharts 3 types a Tooltip `formatter` as receiving `ValueType`, which is
 * `string | number | (string | number)[]` — not `number`. Every chart in this
 * app was written as `formatter={(v: number) => …}`, which TypeScript accepts
 * only while `strict` is off. Under strict it is 20-odd identical errors.
 *
 * The fix is one adapter rather than a cast at each call site. A cast would
 * silence the compiler while leaving the actual hazard in place: when Recharts
 * hands a formatter a string — which it does for a categorical axis, or for a
 * value that arrived from the API as `"1234.5"` — `(v: number) => v.toFixed(1)`
 * throws at runtime. Converting here means every chart handles that case the
 * same way instead of each one not handling it.
 */

/**
 * Derived from the component rather than written as `Formatter<number, string>`.
 *
 * `<Tooltip>` used without explicit generics resolves to
 * `Formatter<ValueType, NameType>`, and a formatter narrowed to `number` is not
 * assignable to it — so hand-writing the generics reproduces the original error
 * one level further out. `ComponentProps<typeof Tooltip>` is whatever the JSX
 * actually accepts, and stays correct if Recharts changes its defaults again.
 */
type TooltipFormatter = NonNullable<ComponentProps<typeof Tooltip>["formatter"]>;

/**
 * What Recharts lets a formatter return: a node, or a `[value, name]` pair that
 * replaces both halves of the tooltip row. Derived rather than restated, so the
 * pair form keeps working — several charts rely on it to relabel a series.
 */
type TooltipFormatterResult = ReturnType<TooltipFormatter>;

/**
 * Recharts' `ValueType` as a number.
 *
 * Falls back to 0 rather than producing NaN: a tooltip is a read-only
 * annotation, and "₹0" beside a bar is a visibly wrong number someone reports,
 * whereas "₹NaN" is a bug report about the app being broken. Neither is
 * correct, but only one is legible.
 */
const toNumber = (value: unknown): number => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  // A range series (e.g. an area with [min, max]) arrives as a tuple; the first
  // entry is the one a single-value formatter is written against.
  if (Array.isArray(value)) return toNumber(value[0]);
  return 0;
};

/**
 * Wraps a numeric formatter so it satisfies Recharts' signature.
 *
 *   <Tooltip formatter={tooltipFormatter((v) => fmtCurrency(v))} />
 *
 * The `name` argument is passed through for the formatters that switch on the
 * series name; single-argument callbacks simply ignore it.
 */
export const tooltipFormatter =
  (format: (value: number, name: string) => TooltipFormatterResult): TooltipFormatter =>
  (value, name) =>
    format(toNumber(value), name == null ? "" : String(name));

/**
 * The same conversion for axis ticks. `tickFormatter` is typed more loosely
 * than `formatter`, so this exists for symmetry — a chart should not format its
 * axis and its tooltip through two different code paths.
 */
export const tickFormatter =
  (format: (value: number) => string) =>
  (value: unknown): string =>
    format(toNumber(value));

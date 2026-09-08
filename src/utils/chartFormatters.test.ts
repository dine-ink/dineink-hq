import { describe, expect, it, vi } from "vitest";
import { tickFormatter, tooltipFormatter } from "./chartFormatters";

/**
 * The point of the adapter is not to satisfy the compiler — a cast would have
 * done that. It is that Recharts really does hand a formatter a string for a
 * value that arrived from the API as `"1234.5"`, and `(v: number) =>
 * v.toFixed(1)` throws on one. These cover the shapes that actually arrive.
 */

describe("tooltipFormatter", () => {
  const format = tooltipFormatter((v) => `₹${v.toFixed(2)}`);
  // Recharts passes (value, name, item, index, payload); only the first two
  // matter here, and the rest are irrelevant to the conversion.
  const call = (value: unknown, name: unknown = "Revenue") =>
    (format as unknown as (v: unknown, n: unknown) => unknown)(value, name);

  it("passes a number straight through", () => {
    expect(call(1234.5)).toBe("₹1234.50");
  });

  it("converts a numeric string — the case that used to throw", () => {
    expect(call("1234.5")).toBe("₹1234.50");
  });

  it("takes the first entry of a range tuple", () => {
    // An area/bar with a [min, max] value arrives as a tuple.
    expect(call([10, 90])).toBe("₹10.00");
  });

  it("falls back to 0 rather than NaN for a non-numeric value", () => {
    // "₹NaN" reads as a broken app; "₹0.00" reads as a wrong number. Neither is
    // right, but only one is legible to the person looking at it.
    expect(call("n/a")).toBe("₹0.00");
    expect(call(null)).toBe("₹0.00");
    expect(call(undefined)).toBe("₹0.00");
    expect(call({})).toBe("₹0.00");
  });

  it("guards against non-finite numbers", () => {
    expect(call(Infinity)).toBe("₹0.00");
    expect(call(NaN)).toBe("₹0.00");
  });

  it("passes the series name through for formatters that switch on it", () => {
    const byName = tooltipFormatter((v, name) =>
      name === "Revenue" ? `₹${v}` : `${v} orders`,
    ) as unknown as (v: unknown, n: unknown) => unknown;

    expect(byName(12, "Revenue")).toBe("₹12");
    expect(byName(12, "Orders")).toBe("12 orders");
  });

  it("gives a missing name to the callback as an empty string, not null", () => {
    const spy = vi.fn(() => "x");
    const f = tooltipFormatter(spy) as unknown as (v: unknown, n: unknown) => unknown;
    f(1, null);
    expect(spy).toHaveBeenCalledWith(1, "");
  });

  it("supports the [value, name] pair form used to relabel a series", () => {
    const pair = tooltipFormatter((v) => [`₹${v}`, "Revenue Required"]) as unknown as (
      v: unknown,
      n: unknown,
    ) => unknown;
    expect(pair(500, "required")).toEqual(["₹500", "Revenue Required"]);
  });
});

describe("tickFormatter", () => {
  it("applies the same conversion to axis ticks", () => {
    const format = tickFormatter((v) => `${(v / 1000).toFixed(1)}k`);
    expect(format(2500)).toBe("2.5k");
    expect(format("2500")).toBe("2.5k");
    expect(format("oops")).toBe("0.0k");
  });
});

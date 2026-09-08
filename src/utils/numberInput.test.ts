import { describe, expect, it, vi } from "vitest";
import type { KeyboardEvent } from "react";
import { blockNegativeKeys, nonNegative } from "./numberInput";

const press = (key: string) => {
  const e = { key, preventDefault: vi.fn() } as unknown as KeyboardEvent<HTMLInputElement>;
  blockNegativeKeys(e);
  return (e.preventDefault as ReturnType<typeof vi.fn>).mock.calls.length === 1;
};

describe("non-negative number inputs", () => {
  it("swallows the minus sign and exponent keys", () => {
    expect(press("-")).toBe(true);
    expect(press("e")).toBe(true);
    expect(press("E")).toBe(true);
  });

  it("lets digits, the decimal point and editing keys through", () => {
    for (const key of ["0", "7", ".", "Backspace", "ArrowLeft", "Tab", "Enter"]) {
      expect(press(key)).toBe(false);
    }
  });

  it("carries a zero floor for the spinner", () => {
    expect(nonNegative.min).toBe(0);
  });
});

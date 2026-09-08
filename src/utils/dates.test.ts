import { describe, expect, it } from "vitest";
import { clampToToday, todayISO } from "./dates";

describe("todayISO", () => {
  it("uses the local calendar date, not UTC", () => {
    // 00:30 local on the 15th; in UTC this is still the 14th for any zone east of Greenwich.
    const local = new Date(2026, 8, 15, 0, 30);
    expect(todayISO(local)).toBe("2026-09-15");
  });

  it("zero-pads month and day", () => {
    expect(todayISO(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});

describe("clampToToday", () => {
  const now = new Date(2026, 8, 8, 12, 0);

  it("leaves past and present dates alone", () => {
    expect(clampToToday("2026-09-01", now)).toBe("2026-09-01");
    expect(clampToToday("2026-09-08", now)).toBe("2026-09-08");
  });

  it("pulls a future date back to today", () => {
    expect(clampToToday("2026-09-09", now)).toBe("2026-09-08");
    expect(clampToToday("2027-01-01", now)).toBe("2026-09-08");
  });

  it("keeps a blank filter blank", () => {
    expect(clampToToday("", now)).toBe("");
  });
});

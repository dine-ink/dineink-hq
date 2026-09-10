import { describe, expect, it } from "vitest";
import {
  DEFAULT_ONBOARDING_STATE,
  onboardingStorageKey,
  readOnboardingState,
  writeOnboardingState,
} from "./onboardingStorage";

describe("onboarding storage", () => {
  it("starts every user from the defaults", () => {
    expect(readOnboardingState(1)).toEqual(DEFAULT_ONBOARDING_STATE);
    expect(readOnboardingState(null)).toEqual(DEFAULT_ONBOARDING_STATE);
  });

  it("round-trips a record and keeps users apart", () => {
    writeOnboardingState(1, {
      ...DEFAULT_ONBOARDING_STATE,
      welcomed: true,
      visited: ["visit-bills"],
      celebratedLevels: [1],
    });
    expect(readOnboardingState(1)).toMatchObject({
      welcomed: true,
      visited: ["visit-bills"],
      celebratedLevels: [1],
    });
    expect(readOnboardingState(2)).toEqual(DEFAULT_ONBOARDING_STATE);
    expect(onboardingStorageKey(1)).not.toBe(onboardingStorageKey(2));
  });

  it("survives a corrupted or foreign record", () => {
    localStorage.setItem(onboardingStorageKey(7), "{not json");
    expect(readOnboardingState(7)).toEqual(DEFAULT_ONBOARDING_STATE);

    localStorage.setItem(
      onboardingStorageKey(8),
      JSON.stringify({ welcomed: "yes", visited: [1, "visit-kitchen", null], celebrated: "x" }),
    );
    expect(readOnboardingState(8)).toEqual({
      ...DEFAULT_ONBOARDING_STATE,
      welcomed: false,
      visited: ["visit-kitchen"],
      celebrated: [],
    });
  });
});

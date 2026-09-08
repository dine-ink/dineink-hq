import { describe, expect, it } from "vitest";
import { passwordRequirements, passwordStrength, validatePasswordForm } from "./passwordRules";

describe("validatePasswordForm", () => {
  it("names every empty field", () => {
    expect(validatePasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })).toEqual({
      currentPassword: "Enter your current password.",
      newPassword: "Enter a new password.",
      confirmPassword: "Type the new password again.",
    });
  });

  it("enforces the backend's six-character minimum", () => {
    expect(
      validatePasswordForm({ currentPassword: "old-one", newPassword: "abc12", confirmPassword: "abc12" }),
    ).toEqual({ newPassword: "Use at least 6 characters." });
  });

  it("refuses a new password identical to the current one", () => {
    expect(
      validatePasswordForm({ currentPassword: "same-pass", newPassword: "same-pass", confirmPassword: "same-pass" }),
    ).toEqual({ newPassword: "The new password must be different from the current one." });
  });

  it("checks the confirmation only once a new password is typed", () => {
    expect(
      validatePasswordForm({ currentPassword: "old-one", newPassword: "new-pass1", confirmPassword: "new-pass2" }),
    ).toEqual({ confirmPassword: "The two passwords do not match." });
  });

  it("returns no errors for a valid form", () => {
    expect(
      validatePasswordForm({ currentPassword: "old-one", newPassword: "new-pass1", confirmPassword: "new-pass1" }),
    ).toEqual({});
  });
});

describe("passwordStrength", () => {
  it("is too short below six characters", () => {
    expect(passwordStrength("abc")).toEqual({ score: 0, label: "Too short" });
  });

  it("climbs one step per extra check met", () => {
    expect(passwordStrength("abcdef")).toEqual({ score: 1, label: "Weak" });
    expect(passwordStrength("abcdefgh")).toEqual({ score: 2, label: "Fair" });
    expect(passwordStrength("abcdefg1")).toEqual({ score: 3, label: "Good" });
    expect(passwordStrength("Abcdefg1")).toEqual({ score: 4, label: "Strong" });
    expect(passwordStrength("abcdefg1!")).toEqual({ score: 4, label: "Strong" });
  });
});

describe("passwordRequirements", () => {
  it("marks only the minimum length as required", () => {
    const reqs = passwordRequirements("Abcdef1!");
    expect(reqs.filter((r) => r.required).map((r) => r.label)).toEqual(["At least 6 characters"]);
    expect(reqs.every((r) => r.met)).toBe(true);
  });
});

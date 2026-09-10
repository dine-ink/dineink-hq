import { describe, expect, it } from "vitest";
import {
  EMPTY_SIGNALS,
  FINAL_RANK,
  LEVELS,
  QUESTS,
  STARTING_RANK,
  computeProgress,
  countInsightsFields,
  isBillingConfigured,
  pathOf,
  questById,
  questsForRole,
  type QuestSignals,
} from "./quests";

/** Every data signal set to "nothing there yet". */
const nothing: QuestSignals = {
  branchCount: 0,
  menuItemCount: 0,
  tableCount: 0,
  billingConfigured: false,
  staffCount: 0,
  ingredientCount: 0,
  mappedItemCount: 0,
  insightsFilledFields: 0,
  duesCount: 0,
  vendorCount: 0,
  equipmentCount: 0,
  complianceCount: 0,
  bankAccountCount: 0,
  upiConfigured: false,
  budgetCount: 0,
};

/** Every data signal satisfied. */
const everything: QuestSignals = {
  branchCount: 1,
  menuItemCount: 12,
  tableCount: 6,
  billingConfigured: true,
  staffCount: 3,
  ingredientCount: 20,
  mappedItemCount: 8,
  insightsFilledFields: 9,
  duesCount: 4,
  vendorCount: 2,
  equipmentCount: 3,
  complianceCount: 2,
  bankAccountCount: 1,
  upiConfigured: true,
  budgetCount: 1,
};

const allVisitIds = QUESTS.filter((q) => q.kind === "visit").map((q) => q.id);

describe("the quest catalogue", () => {
  it("has unique ids and every quest belongs to a defined level", () => {
    const ids = QUESTS.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
    const levelIds = new Set(LEVELS.map((l) => l.id));
    QUESTS.forEach((q) => expect(levelIds.has(q.level)).toBe(true));
  });

  it("gives every data quest a check and every visit quest none", () => {
    QUESTS.forEach((q) => {
      if (q.kind === "data") expect(typeof q.check).toBe("function");
      else expect(q.check).toBeUndefined();
    });
  });

  it("points every quest at a dashboard route", () => {
    QUESTS.forEach((q) => expect(pathOf(q.href).startsWith("/dashboard")).toBe(true));
    expect(pathOf("/dashboard/insights?tab=Insights%20Setup")).toBe("/dashboard/insights");
  });

  it("hides management-only quests from other roles", () => {
    const owner = questsForRole("OWNER");
    const cashier = questsForRole("CASHIER");
    expect(owner.map((q) => q.id)).toContain("bank-account");
    expect(cashier.map((q) => q.id)).not.toContain("bank-account");
    expect(cashier.map((q) => q.id)).toContain("add-tables");
    expect(questById("upi")?.title).toBe("Set up UPI at checkout");
    expect(questById("nope")).toBeNull();
  });
});

describe("computeProgress", () => {
  it("is not ready while any visible data signal is still loading", () => {
    const progress = computeProgress(EMPTY_SIGNALS, [], "OWNER");
    expect(progress.ready).toBe(false);
    expect(progress.xpEarned).toBe(0);
    // Loading quests are neither done nor "next up" — and nothing is next
    // until they resolve, even though the visit quests are already known.
    expect(progress.quests.find((q) => q.id === "add-tables")?.done).toBeNull();
    expect(progress.quests.find((q) => q.id === "visit-bills")?.done).toBe(false);
    expect(progress.nextQuest).toBeNull();
  });

  it("starts a fresh account at Level 1 with the setup quest next", () => {
    const progress = computeProgress(nothing, [], "OWNER");
    expect(progress.ready).toBe(true);
    expect(progress.rank).toBe(STARTING_RANK);
    expect(progress.currentLevel?.id).toBe(1);
    expect(progress.nextQuest?.id).toBe("setup-restaurant");
    expect(progress.levels[0].unlocked).toBe(true);
    expect(progress.levels[1].unlocked).toBe(false);
    expect(progress.percent).toBe(0);
  });

  it("completes Level 1 from the foundation signals and unlocks Level 2", () => {
    const signals: QuestSignals = {
      ...nothing,
      branchCount: 1,
      tableCount: 4,
      billingConfigured: true,
      menuItemCount: 5,
      staffCount: 2,
    };
    const progress = computeProgress(signals, [], "OWNER");
    const level1 = progress.levels[0];
    expect(level1.complete).toBe(true);
    expect(level1.doneCount).toBe(level1.total);
    expect(progress.rank).toBe("Apprentice");
    expect(progress.currentLevel?.id).toBe(2);
    expect(progress.levels[1].unlocked).toBe(true);
    expect(progress.levels[2].unlocked).toBe(false);
    expect(progress.nextQuest?.id).toBe("add-ingredients");
    expect(progress.xpEarned).toBe(100 + 50 + 50 + 75 + 50);
  });

  it("needs five dishes before the menu quest counts, and says how many so far", () => {
    const four = computeProgress({ ...nothing, menuItemCount: 4 }, [], "OWNER");
    const nine = computeProgress({ ...nothing, menuItemCount: 9 }, [], "OWNER");
    const menuOf = (p: typeof four) => p.quests.find((q) => q.id === "add-menu")!;
    expect(menuOf(four).done).toBe(false);
    expect(menuOf(four).tally).toEqual({ current: 4, target: 5, noun: "dishes" });
    expect(menuOf(nine).done).toBe(true);
    // Capped at the target so the bar never overflows.
    expect(menuOf(nine).tally).toEqual({ current: 5, target: 5, noun: "dishes" });
    // Yes/no quests and loading signals carry no tally.
    expect(four.quests.find((q) => q.id === "billing-settings")?.tally).toBeNull();
    expect(computeProgress(EMPTY_SIGNALS, [], "OWNER").quests[1].tally).toBeNull();
  });

  it("completes visit quests from the visited list only", () => {
    const progress = computeProgress(nothing, ["visit-bills"], "OWNER");
    expect(progress.quests.find((q) => q.id === "visit-bills")?.done).toBe(true);
    expect(progress.quests.find((q) => q.id === "visit-kitchen")?.done).toBe(false);
  });

  it("awards the final rank when everything is done", () => {
    const progress = computeProgress(everything, allVisitIds, "OWNER");
    expect(progress.allComplete).toBe(true);
    expect(progress.rank).toBe(FINAL_RANK);
    expect(progress.currentLevel).toBeNull();
    expect(progress.nextQuest).toBeNull();
    expect(progress.percent).toBe(100);
    expect(progress.xpEarned).toBe(progress.xpTotal);
  });

  it("scores a non-management role only on the quests it can see", () => {
    // Nothing management-only is done, yet the cashier's log is complete
    // because those quests are not in it.
    const signals: QuestSignals = {
      ...everything,
      duesCount: 0,
      bankAccountCount: 0,
      upiConfigured: false,
      equipmentCount: 0,
      complianceCount: 0,
    };
    const cashier = computeProgress(signals, allVisitIds, "CASHIER");
    const owner = computeProgress(signals, allVisitIds, "OWNER");
    expect(cashier.allComplete).toBe(true);
    expect(owner.allComplete).toBe(false);
    expect(cashier.xpTotal).toBeLessThan(owner.xpTotal);
  });
});

describe("signal helpers", () => {
  it("counts only key Insights fields that hold a real value", () => {
    expect(countInsightsFields(null)).toBe(0);
    expect(countInsightsFields({})).toBe(0);
    expect(
      countInsightsFields({
        monthlyRent: 50000,
        electricity: "0",
        gas: "",
        internet: null,
        targetEbitda: 20,
        unrelatedField: 99,
      }),
    ).toBe(2);
  });

  it("treats any billing choice as configured", () => {
    expect(isBillingConfigured(null)).toBe(false);
    expect(isBillingConfigured({})).toBe(false);
    expect(isBillingConfigured({ gstPercentage: "", billingTypes: [], paymentMethods: [] })).toBe(false);
    expect(isBillingConfigured({ gstPercentage: "0" })).toBe(false);
    expect(isBillingConfigured({ gstPercentage: "5" })).toBe(true);
    expect(isBillingConfigured({ billingTypes: ["DINE_IN"] })).toBe(true);
    expect(isBillingConfigured({ paymentMethods: ["UPI"] })).toBe(true);
  });
});

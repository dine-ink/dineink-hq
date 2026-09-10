import { afterEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  authenticatedState,
  jsonResponse,
  mockUser,
  renderWithProviders,
  requestUrl,
} from "@/test/test-utils";
import { OnboardingProvider } from "./OnboardingProvider";
import { QuestLauncher } from "./QuestLauncher";
import { QuestDrawer } from "./QuestDrawer";
import { WelcomeTour } from "./WelcomeTour";
import { QuestCoachmark } from "./QuestCoachmark";
import { GettingStartedCard } from "./GettingStartedCard";
import {
  DEFAULT_ONBOARDING_STATE,
  readOnboardingState,
  writeOnboardingState,
  type OnboardingState,
} from "./onboardingStorage";

/**
 * A set-up account with Level 1 finished and nothing beyond it: one branch,
 * tables, billing, five dishes and a cashier. Each URL answers with the
 * envelope the real endpoint uses.
 */
function stubApi(overrides: Record<string, unknown> = {}) {
  const calls: string[] = [];
  const respond = (url: string): unknown => {
    for (const [needle, body] of Object.entries(overrides)) {
      if (url.includes(needle)) return body;
    }
    if (url.includes("/my-restaurant")) {
      return {
        restaurant: {
          branches: [{ id: 20, name: "Test Branch" }],
          menuItems: [1, 2, 3, 4, 5].map((i) => ({ id: i, name: `Dish ${i}` })),
        },
      };
    }
    if (url.includes("/restaurant/branch/20")) {
      return { tables: [{ id: 1, name: "T1" }], billing: { gstPercentage: "5" }, users: [] };
    }
    if (url.includes("/restaurant/staff/")) {
      return [{ id: 2, role: "CASHIER" }, { id: 1, role: "OWNER" }];
    }
    if (url.includes("/menu-management")) {
      return { ingredients: [], menuItems: [1, 2, 3, 4, 5].map((i) => ({ id: i })) };
    }
    if (url.includes("/analytics/insights/")) return {};
    if (url.includes("/banking/upi/")) return null;
    return [];
  };
  vi.stubGlobal(
    "fetch",
    vi.fn((input: RequestInfo | URL) => {
      const url = requestUrl(input);
      calls.push(url);
      return jsonResponse({ success: true, data: respond(url) });
    }),
  );
  return calls;
}

const seed = (partial: Partial<OnboardingState>) =>
  writeOnboardingState(mockUser.id, { ...DEFAULT_ONBOARDING_STATE, ...partial });

function Shell() {
  return (
    <OnboardingProvider>
      <QuestLauncher />
      <QuestCoachmark />
      <GettingStartedCard />
      <QuestDrawer />
      <WelcomeTour />
    </OnboardingProvider>
  );
}

const renderShell = (route = "/dashboard", role = "OWNER") =>
  renderWithProviders(<Shell />, {
    route,
    preloadedState: authenticatedState({
      auth: {
        user: { ...mockUser, role },
        token: "test-token",
        restaurant: { id: 10, name: "Test Restaurant" },
      },
    } as any),
  });

// The launcher's label carries the count ("Open quest log, 5 of 21 quests
// complete"); the anchored comma keeps it apart from the card's plain button.
const launcher = () => screen.findByRole("button", { name: /^open quest log,/i });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("OnboardingProvider", () => {
  it("shows the welcome tour once and remembers it was seen", async () => {
    stubApi();
    const user = userEvent.setup();
    const { unmount } = renderShell();

    expect(await screen.findByText("Welcome to DineInk, Test")).toBeInTheDocument();
    // The first slide credits the setup the person has just finished.
    expect(screen.getByText(/Quest 1 complete/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /skip tour/i }));
    await waitFor(() => expect(readOnboardingState(mockUser.id).welcomed).toBe(true));
    expect(screen.queryByText("Welcome to DineInk, Test")).not.toBeInTheDocument();

    unmount();
    renderShell();
    await launcher();
    expect(screen.queryByText("Welcome to DineInk, Test")).not.toBeInTheDocument();
  });

  it("walks the tour and hands over to the next quest", async () => {
    stubApi();
    const user = userEvent.setup();
    renderShell();

    await screen.findByText("Welcome to DineInk, Test");
    const dialog = screen.getByRole("dialog");
    await user.click(screen.getByRole("button", { name: /^next$/i }));
    expect(screen.getByText("Finding your way around")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^next$/i }));
    expect(screen.getByText("Your quest log")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^next$/i }));
    expect(screen.getByText("Ready when you are")).toBeInTheDocument();
    // Level 1 is done, so the tour offers the first Level 2 quest.
    expect(await within(dialog).findByText("Stock your ingredients")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /start the next quest/i }));
    // The coachmark for that quest is now pinned above the page.
    expect(
      await screen.findByRole("region", { name: "Quest: Stock your ingredients" }),
    ).toBeInTheDocument();
  });

  it("derives progress from live data and lists it in the quest log", async () => {
    stubApi();
    seed({ welcomed: true });
    const user = userEvent.setup();
    renderShell();

    // Five Level 1 quests done out of the owner's twenty-one.
    const button = await screen.findByRole("button", { name: "Open quest log, 5 of 21 quests complete" });
    await user.click(button);

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Getting started")).toBeInTheDocument();
    expect(within(dialog).getByText(/^Rank:/).textContent).toContain("Apprentice");
    // Level 2 is the current level, so it is expanded and its quests are listed.
    expect(within(dialog).getByText("Level 2: Know your costs")).toBeInTheDocument();
    expect(within(dialog).getByText("Stock your ingredients")).toBeInTheDocument();
    // Level 3 is folded until it is current.
    expect(within(dialog).getByText(/Finish Level 2 to unlock/)).toBeInTheDocument();
    expect(within(dialog).queryByText("Add a bank account")).not.toBeInTheDocument();
  });

  it("puts the next three quests on the dashboard card", async () => {
    stubApi();
    seed({ welcomed: true });
    renderShell();

    const card = await screen.findByRole("region", { name: "Getting started" });
    expect(within(card).getByText("Level 2: Know your costs")).toBeInTheDocument();
    expect(within(card).getByText("Stock your ingredients")).toBeInTheDocument();
    expect(within(card).getByText("Map recipes to dishes")).toBeInTheDocument();
    expect(within(card).getByText("Add your vendors")).toBeInTheDocument();
    expect(within(card).queryByText("Enter your fixed expenses")).not.toBeInTheDocument();
  });

  it("stays out of the way for roles with nothing to set up", async () => {
    const calls = stubApi();
    renderShell("/dashboard", "CASHIER");

    // Give the queries a chance to fire if they were going to.
    await waitFor(() => expect(calls.length).toBeGreaterThan(0)).catch(() => {});
    expect(screen.queryByRole("button", { name: /^open quest log,/i })).not.toBeInTheDocument();
    expect(screen.queryByText("Welcome to DineInk, Test")).not.toBeInTheDocument();
    expect(calls.some((u) => u.includes("/banking/"))).toBe(false);
  });

  it("renders nothing and asks for nothing once hidden", async () => {
    const calls = stubApi();
    seed({ welcomed: true, hidden: true });
    renderShell();

    await new Promise((r) => setTimeout(r, 50));
    expect(screen.queryByRole("button", { name: /^open quest log,/i })).not.toBeInTheDocument();
    expect(calls.some((u) => u.includes("/restaurant/branch/"))).toBe(false);
  });

  it("waits until the restaurant is set up", async () => {
    stubApi({ "/my-restaurant": { restaurant: { branches: [], menuItems: [] } } });
    renderShell();

    await new Promise((r) => setTimeout(r, 50));
    expect(screen.queryByText("Welcome to DineInk, Test")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^open quest log,/i })).not.toBeInTheDocument();
  });

  it("ticks a visit quest off on arriving at its page", async () => {
    stubApi();
    seed({ welcomed: true });
    renderShell("/dashboard/bills");

    await waitFor(() => expect(readOnboardingState(mockUser.id).visited).toContain("visit-bills"));
  });

  it("tracks the active quest one step at a time above the page", async () => {
    stubApi();
    seed({ welcomed: true });
    const user = userEvent.setup();
    renderShell("/dashboard/menu-management?tab=ingredients&quest=add-ingredients");

    const region = await screen.findByRole("region", { name: "Quest: Stock your ingredients" });
    expect(within(region).getByText(/Open Operations and switch to the Ingredients tab/)).toBeInTheDocument();
    expect(within(region).queryByText(/Press Add Ingredient/)).not.toBeInTheDocument();

    await user.click(within(region).getByRole("button", { name: /next step/i }));
    expect(within(region).getByText(/Press Add Ingredient/)).toBeInTheDocument();
    expect(within(region).getByText("Step 2:")).toBeInTheDocument();

    // The full list unfolds on request, with the current step marked.
    await user.click(within(region).getByRole("button", { name: /show all steps/i }));
    expect(within(region).getByText(/Link a vendor if you already know/)).toBeInTheDocument();
  });

  it("shows how far a counted quest has got instead of just 'not done'", async () => {
    // Two dishes saved so far; the quest wants five. The count comes from the
    // menu-management payload, which a dish save invalidates.
    stubApi({ "/menu-management": { ingredients: [], menuItems: [{ id: 1 }, { id: 2 }] } });
    seed({ welcomed: true });
    renderShell("/dashboard/menu-management?tab=menu&quest=add-menu");

    const region = await screen.findByRole("region", { name: "Quest: Build out your menu" });
    expect(await within(region).findByLabelText("2 of 5 dishes")).toBeInTheDocument();
    expect(within(region).queryByText("Quest complete")).not.toBeInTheDocument();
  });

  it("flips the tracker to complete and offers the next quest", async () => {
    stubApi();
    seed({ welcomed: true });
    renderShell("/dashboard/shops?quest=add-tables");

    // Tables exist on this account, so the quest is already done here.
    const region = await screen.findByRole("region", { name: "Quest: Add your tables" });
    expect(await within(region).findByText("Quest complete")).toBeInTheDocument();
    expect(within(region).getByRole("button", { name: /Next quest: Stock your ingredients/ })).toBeInTheDocument();
    expect(within(region).queryByRole("button", { name: /next step/i })).not.toBeInTheDocument();
  });

  it("records what is already done silently on the first look, then celebrates new completions", async () => {
    stubApi();
    seed({ welcomed: true });
    const { unmount } = renderShell();

    await launcher();
    await waitFor(() => expect(readOnboardingState(mockUser.id).seeded).toBe(true));
    const first = readOnboardingState(mockUser.id);
    expect(first.celebrated).toEqual(
      expect.arrayContaining(["setup-restaurant", "add-tables", "billing-settings", "add-menu", "add-staff"]),
    );
    expect(first.celebratedLevels).toEqual([1]);
    expect(screen.queryByText(/Quest complete/)).not.toBeInTheDocument();
    unmount();

    // Next visit: ingredients have appeared since. One toast, once.
    stubApi({ "/menu-management": { ingredients: [{ id: 1 }] } });
    renderShell();
    expect(
      await screen.findByText("Quest complete: Stock your ingredients — +75 XP"),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(readOnboardingState(mockUser.id).celebrated).toContain("add-ingredients"),
    );
  });

  it("collapses a burst of completions into one toast and announces the level", async () => {
    stubApi();
    // A record that was seeded when nothing was done yet.
    seed({ welcomed: true, seeded: true });
    renderShell();

    expect(await screen.findByText("5 quests complete — +325 XP")).toBeInTheDocument();
    expect(screen.getByText("Level 1 complete — new rank: Apprentice")).toBeInTheDocument();
  });

  it("can be hidden from the drawer and brought back", async () => {
    stubApi();
    seed({ welcomed: true });
    const user = userEvent.setup();
    renderShell();

    await user.click(await launcher());
    await user.click(await screen.findByRole("button", { name: /hide guide/i }));
    await waitFor(() => expect(readOnboardingState(mockUser.id).hidden).toBe(true));
    expect(screen.queryByRole("button", { name: /^open quest log,/i })).not.toBeInTheDocument();
  });
});

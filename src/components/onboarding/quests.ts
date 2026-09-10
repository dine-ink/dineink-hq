/**
 * The Getting Started quest log — the game-style tutorial that walks a new
 * owner through everything the dashboard needs before its numbers mean much.
 *
 * The restaurant setup modal collects the bare minimum (a restaurant, one
 * branch, a menu). Nearly every screen after that expects more: tables and
 * billing on Shops, ingredients and recipe mappings under Operations, fixed
 * expenses on Insights Setup, vendors, dues, bank accounts, compliance. None of
 * that is discoverable from a flat sidebar of 28 items, so people open Insights,
 * see zeros everywhere, and conclude the product is broken.
 *
 * This file is the pure model: what the quests are, which level each belongs
 * to, how many XP it is worth, and how to tell from live data whether it is
 * done. Nothing here touches React, the store or the network; the hook in
 * useOnboardingSignals.ts gathers the signals, and OnboardingProvider turns the
 * result into UI. Keeping the model pure is what makes it testable on its own.
 *
 * Two kinds of quest:
 *   - `data` quests are complete when the account actually has the thing (a
 *     table, an ingredient, a bank account). They cannot be ticked by hand,
 *     which is the point: a checklist you can tick without doing the work
 *     teaches nothing.
 *   - `visit` quests are complete once the person has opened the page. They
 *     exist for the reporting screens, where there is nothing to enter — the
 *     goal is simply that the owner knows the screen exists.
 */

export type QuestKind = "data" | "visit";

export type Role = string;

/** Everything the completion checks look at. `null` means "not loaded yet". */
export interface QuestSignals {
  branchCount: number | null;
  menuItemCount: number | null;
  tableCount: number | null;
  billingConfigured: boolean | null;
  staffCount: number | null;
  ingredientCount: number | null;
  mappedItemCount: number | null;
  /** How many of the key Insights Setup expense/target fields hold a value. */
  insightsFilledFields: number | null;
  duesCount: number | null;
  vendorCount: number | null;
  equipmentCount: number | null;
  complianceCount: number | null;
  bankAccountCount: number | null;
  upiConfigured: boolean | null;
  budgetCount: number | null;
}

export const EMPTY_SIGNALS: QuestSignals = {
  branchCount: null,
  menuItemCount: null,
  tableCount: null,
  billingConfigured: null,
  staffCount: null,
  ingredientCount: null,
  mappedItemCount: null,
  insightsFilledFields: null,
  duesCount: null,
  vendorCount: null,
  equipmentCount: null,
  complianceCount: null,
  bankAccountCount: null,
  upiConfigured: null,
  budgetCount: null,
};

export interface Level {
  id: number;
  name: string;
  /** The title the owner earns on finishing the level. */
  rank: string;
  blurb: string;
}

export interface Quest {
  id: string;
  level: number;
  kind: QuestKind;
  title: string;
  /** Why this matters — what it unlocks or fixes. One or two sentences. */
  summary: string;
  /** Where "Go" takes you. May carry a `?tab=` so the right tab opens. */
  href: string;
  xp: number;
  /** Who can do it. Omit for everyone who sees the guide. */
  roles?: Role[];
  /** The in-page walkthrough, in the order the person should do things. */
  steps: string[];
  /** Data quests only. `null` while the signal is still loading. */
  check?: (s: QuestSignals) => boolean | null;
  /**
   * Count-based quests: how far along the person is, so the tracker can say
   * "2 of 5 dishes" instead of leaving them to guess why nothing has ticked.
   * `null` while loading.
   */
  progress?: (s: QuestSignals) => QuestProgress | null;
}

export interface QuestProgress {
  current: number;
  target: number;
  /** Plural noun for the thing being counted: "dishes", "tables". */
  noun: string;
}

/** The roles the guide is shown to at all. Staff logins have nothing to set up. */
export const GUIDE_ROLES: Role[] = ["OWNER", "MANAGER"];

const MANAGEMENT: Role[] = ["OWNER", "MANAGER"];

export const LEVELS: Level[] = [
  {
    id: 1,
    name: "Open the doors",
    rank: "Apprentice",
    blurb: "The essentials for taking your first order: branch, tables, menu, billing and staff.",
  },
  {
    id: 2,
    name: "Know your costs",
    rank: "Sous Chef",
    blurb: "Ingredients, recipes, vendors and fixed expenses — this is what turns sales into profit figures.",
  },
  {
    id: 3,
    name: "Run a tight ship",
    rank: "Head Chef",
    blurb: "Bank accounts, UPI at checkout, equipment, licences and a budget to measure against.",
  },
  {
    id: 4,
    name: "Read the signals",
    rank: "Restaurateur",
    blurb: "Tour the reporting screens so you know where every answer lives.",
  },
];

export const FINAL_RANK = "Master Restaurateur";
export const STARTING_RANK = "Newcomer";

const count = (n: number | null, atLeast = 1) => (n === null ? null : n >= atLeast);

/** A `progress` for a counted signal: capped at the target once it is met. */
const tally =
  (key: keyof QuestSignals, noun: string, target = 1) =>
  (s: QuestSignals): QuestProgress | null => {
    const value = s[key];
    if (value === null || typeof value !== "number") return null;
    return { current: Math.min(value, target), target, noun };
  };

export const QUESTS: Quest[] = [
  // ── Level 1 ─────────────────────────────────────────────────────────────
  {
    id: "setup-restaurant",
    level: 1,
    kind: "data",
    title: "Set up your restaurant",
    summary:
      "Your restaurant, first branch and menu. Everything else in DineInk hangs off a branch, so nothing opens until this is done.",
    href: "/dashboard",
    xp: 100,
    steps: [
      "Fill in Restaurant Details — name, contact, address and GSTIN.",
      "Add at least one branch with its city and pincode.",
      "Add a few menu categories and dishes with prices.",
      "Set the GST percentage and service charge for billing.",
      "Add your staff, then press Finish Setup.",
    ],
    check: (s) => count(s.branchCount),
  },
  {
    id: "add-tables",
    level: 1,
    kind: "data",
    title: "Add your tables",
    summary:
      "Dine-in orders are placed against a table. Tables also drive turn-time and occupancy on the Kitchen and Insights screens.",
    href: "/dashboard/shops",
    xp: 50,
    steps: [
      "Open Shops and make sure the right branch is selected at the top.",
      "Scroll to the Tables section and press Add Table.",
      "Name each table the way your floor staff say it (T1, Window 2) and set the seats.",
      "Press Save Changes at the top of the page.",
    ],
    check: (s) => count(s.tableCount),
    progress: tally("tableCount", "tables"),
  },
  {
    id: "billing-settings",
    level: 1,
    kind: "data",
    title: "Configure billing",
    summary:
      "GST rate, service charge, the order types you offer and the payment methods you accept. Every bill the POS prints reads these.",
    href: "/dashboard/shops",
    xp: 50,
    steps: [
      "Open Shops and scroll to Billing Settings.",
      "Tick the order types you serve — dine-in, takeaway, delivery.",
      "Enter your GST percentage and service charge, and choose whether prices include GST.",
      "Tick the payment methods your counter accepts, then Save Changes.",
    ],
    check: (s) => s.billingConfigured,
  },
  {
    id: "add-menu",
    level: 1,
    kind: "data",
    title: "Build out your menu",
    summary:
      "At least five dishes with prices. Menu Engineering, forecasts and the kitchen load all work per dish, so a thin menu means thin insights.",
    href: "/dashboard/menu-management?tab=menu",
    xp: 75,
    steps: [
      "Open Operations — it lands on the Menu tab.",
      "Press Add Item; pick a category, name the dish and enter its price and prep time.",
      "Mark vegetarian or non-vegetarian so the POS can filter.",
      "Repeat until your everyday menu is in. You can bulk-import from Excel later.",
    ],
    check: (s) => count(s.menuItemCount, 5),
    progress: tally("menuItemCount", "dishes", 5),
  },
  {
    id: "add-staff",
    level: 1,
    kind: "data",
    title: "Add your team",
    summary:
      "Staff with salaries and shifts power Attendance, payroll, labour cost and the staffing plan. Give login access to whoever runs the counter.",
    href: "/dashboard/shops",
    xp: 50,
    steps: [
      "Open Shops and scroll to the Staff section.",
      "Press Add Staff; enter name, phone, department, monthly salary and shift.",
      "Turn on Login Access and set a password for anyone who will use the POS.",
      "Save Changes. Attendance picks them up immediately.",
    ],
    check: (s) => count(s.staffCount),
    progress: tally("staffCount", "staff"),
  },

  // ── Level 2 ─────────────────────────────────────────────────────────────
  {
    id: "add-ingredients",
    level: 2,
    kind: "data",
    title: "Stock your ingredients",
    summary:
      "Ingredients with a unit price are the base of food cost. Without them every dish shows 100% margin, which is a nice lie.",
    href: "/dashboard/menu-management?tab=ingredients",
    xp: 75,
    steps: [
      "Open Operations and switch to the Ingredients tab.",
      "Press Add Ingredient; enter the name, unit (kg, litre, piece) and price per unit.",
      "Set the current quantity in stock and a reorder level so alerts fire before you run out.",
      "Link a vendor if you already know who supplies it.",
    ],
    check: (s) => count(s.ingredientCount),
    progress: tally("ingredientCount", "ingredients"),
  },
  {
    id: "map-recipes",
    level: 2,
    kind: "data",
    title: "Map recipes to dishes",
    summary:
      "Tell DineInk what goes into each dish. This is what makes food cost, wastage, stock depletion and reorder forecasts real.",
    href: "/dashboard/menu-management?tab=mapping",
    xp: 100,
    steps: [
      "Open Operations and switch to Item Mapping.",
      "Pick a dish, then add each ingredient and the quantity one plate uses.",
      "Watch the recipe cost update as you go — that is your true cost per plate.",
      "Start with your ten best sellers; they carry most of your food cost.",
    ],
    check: (s) => count(s.mappedItemCount),
    progress: tally("mappedItemCount", "dishes mapped"),
  },
  {
    id: "add-vendors",
    level: 2,
    kind: "data",
    title: "Add your vendors",
    summary:
      "Who you buy from, what you owe them and when. Vendors feed Cash Flow, dues and the price-history comparison.",
    href: "/dashboard/vendors",
    xp: 50,
    steps: [
      "Open Vendors and press Add Vendor.",
      "Enter the name, phone, vendor type and payment terms.",
      "Record an invoice against the vendor when the next delivery arrives.",
      "Use Reorder to message them over WhatsApp straight from the row.",
    ],
    check: (s) => count(s.vendorCount),
    progress: tally("vendorCount", "vendors"),
  },
  {
    id: "insights-setup",
    level: 2,
    kind: "data",
    title: "Enter your fixed expenses",
    summary:
      "Rent, EMIs, utilities and your targets. EBITDA, break-even and the AI advisor are all computed from these — leave them empty and the screens show zero.",
    href: "/dashboard/insights?tab=Insights%20Setup",
    xp: 100,
    steps: [
      "Open Insights and switch to the Insights Setup tab.",
      "Fill in Fixed Expenses — rent, loan EMI, internet, insurance, licences.",
      "Fill in Variable Expenses — electricity, gas, packaging, aggregator commission.",
      "Set your Financial Targets and press Save. The readiness bar shows how far you have got.",
    ],
    check: (s) => count(s.insightsFilledFields, 3),
    progress: tally("insightsFilledFields", "fields filled", 3),
  },
  {
    id: "monthly-dues",
    level: 2,
    kind: "data",
    title: "Record this month's dues",
    summary:
      "Rent, salaries, electricity and EMIs with their due dates. The payment calendar and Cash Flow warn you before a shortfall.",
    href: "/dashboard/dues",
    xp: 75,
    roles: MANAGEMENT,
    steps: [
      "Open Dues — it lands on Monthly Expenses for the current month.",
      "Press Add Expense; pick a category, the amount due and the date it falls on.",
      "Do this for each recurring bill. They roll into the Payment Day Tracker automatically.",
      "Mark each one paid when the money goes out.",
    ],
    check: (s) => count(s.duesCount),
    progress: tally("duesCount", "dues"),
  },

  // ── Level 3 ─────────────────────────────────────────────────────────────
  {
    id: "bank-account",
    level: 3,
    kind: "data",
    title: "Add a bank account",
    summary:
      "Your settlement account. Transactions and reconciliation sit under it, and the primary account is what reports quote.",
    href: "/dashboard/banking?tab=Bank%20Accounts",
    xp: 50,
    roles: MANAGEMENT,
    steps: [
      "Open Banking on the Bank Accounts tab and press Add Account.",
      "Enter the bank, account number, IFSC and which branch it belongs to.",
      "Mark one account as Primary.",
    ],
    check: (s) => count(s.bankAccountCount),
    progress: tally("bankAccountCount", "accounts"),
  },
  {
    id: "upi",
    level: 3,
    kind: "data",
    title: "Set up UPI at checkout",
    summary:
      "Your UPI ID becomes a QR code that appears on the POS payment screen the moment you save it.",
    href: "/dashboard/banking?tab=UPI",
    xp: 50,
    roles: MANAGEMENT,
    steps: [
      "Open Banking and switch to the UPI tab.",
      "Enter your UPI ID and the name customers should see.",
      "Press Save and check the generated QR code scans on your phone.",
    ],
    check: (s) => s.upiConfigured,
  },
  {
    id: "equipment",
    level: 3,
    kind: "data",
    title: "List your equipment",
    summary:
      "Ovens, fridges, the espresso machine — with purchase dates, warranties and EMIs. You get maintenance reminders and EMI outflows in Cash Flow.",
    href: "/dashboard/equipment",
    xp: 50,
    roles: MANAGEMENT,
    steps: [
      "Open Equipment and press Add Equipment.",
      "Enter the name, purchase date and price, and the warranty end date.",
      "If it is on EMI, add the monthly amount and tenure.",
      "Set a maintenance interval so the reminder fires.",
    ],
    check: (s) => count(s.equipmentCount),
    progress: tally("equipmentCount", "items"),
  },
  {
    id: "compliance",
    level: 3,
    kind: "data",
    title: "Track your licences",
    summary:
      "FSSAI, fire safety, pest control and GST filing dates. Expiry warnings arrive weeks ahead instead of as a notice on the door.",
    href: "/dashboard/compliance",
    xp: 75,
    roles: MANAGEMENT,
    steps: [
      "Open Compliance. There is one card per licence type.",
      "On each card press Add and enter the licence number, issue and expiry dates.",
      "Upload a scan of the certificate so it is always to hand.",
      "For GST Filing, the next due date is worked out for you.",
    ],
    check: (s) => count(s.complianceCount),
    progress: tally("complianceCount", "licences"),
  },
  {
    id: "budget",
    level: 3,
    kind: "data",
    title: "Create your first budget",
    summary:
      "A monthly plan for revenue and each cost line. Budget vs Actual then shows where the month is drifting while you can still act.",
    href: "/dashboard/budget?tab=Budgets",
    xp: 75,
    steps: [
      "Open Budget vs Actual and switch to the Budgets tab.",
      "Press Create Budget and choose the branch and month.",
      "Accept the suggested fixed costs (they come from your dues) or type your own.",
      "Set the revenue target and save. The Overview tab starts comparing immediately.",
    ],
    check: (s) => count(s.budgetCount),
    progress: tally("budgetCount", "budgets"),
  },

  // ── Level 4 ─────────────────────────────────────────────────────────────
  {
    id: "visit-bills",
    level: 4,
    kind: "visit",
    title: "Explore Bills",
    summary: "Every bill the POS has raised, filterable by date and status, with a detail drawer per bill.",
    href: "/dashboard/bills",
    xp: 25,
    steps: [
      "Use the date pills at the top of the screen to change the range — they apply to every page.",
      "Click a bill to open its items, taxes and payment method.",
    ],
  },
  {
    id: "visit-kitchen",
    level: 4,
    kind: "visit",
    title: "Explore Kitchen",
    summary: "Peak hour, hourly load, table turn time and your slowest dishes — the operational view of the day.",
    href: "/dashboard/kitchen",
    xp: 25,
    steps: [
      "Look at the hourly load chart to see when the kitchen is under pressure.",
      "The Peak Hour Depletion section tells you how many hands each rush needs.",
    ],
  },
  {
    id: "visit-stock-audit",
    level: 4,
    kind: "visit",
    title: "Explore Stock Audit",
    summary: "The daily closing count. Doing it each night is what makes wastage and theft visible.",
    href: "/dashboard/daily-stock-audit",
    xp: 25,
    steps: [
      "Each evening enter the closing quantity for the ingredients you count.",
      "The gap between expected and actual stock is your variance.",
    ],
  },
  {
    id: "visit-forecasting",
    level: 4,
    kind: "visit",
    title: "Explore Forecasting",
    summary: "Projected revenue, demand per dish, stock-outs and the staff each hour needs.",
    href: "/dashboard/forecasting",
    xp: 25,
    steps: [
      "Forecasts need a few weeks of bills to become useful — check back once you have them.",
      "The Inventory tab lists what will run out first.",
    ],
  },
  {
    id: "visit-reports",
    level: 4,
    kind: "visit",
    title: "Explore Reports",
    summary: "Excel and PDF exports of sales, GST, inventory and staff — what you hand your accountant.",
    href: "/dashboard/reports",
    xp: 25,
    steps: [
      "Pick a report type and date range, then download.",
      "The Export button in the top bar bundles the full set for the selected range.",
    ],
  },
  {
    id: "visit-ai-advisor",
    level: 4,
    kind: "visit",
    title: "Meet the AI Financial Advisor",
    summary: "Ask questions about your numbers in plain language, and read the daily brief.",
    href: "/dashboard/ai-advisor",
    xp: 25,
    steps: [
      'Try asking: "Which dishes lost margin this month?"',
      "The Insights tab lists risks it has spotted — stock-outs, staff shortfalls, growing peak demand.",
    ],
  },
];

// ── Derived state ─────────────────────────────────────────────────────────

export interface QuestStatus extends Quest {
  /** `null` while the signal behind a data quest is still loading. */
  done: boolean | null;
  /** Live count for counted quests ("2 of 5 dishes"); null when not counted or loading. */
  tally: QuestProgress | null;
}

export interface LevelProgress extends Level {
  quests: QuestStatus[];
  doneCount: number;
  total: number;
  complete: boolean;
  /** A level is unlocked once the one before it is complete. Level 1 always is. */
  unlocked: boolean;
}

export interface Progress {
  quests: QuestStatus[];
  levels: LevelProgress[];
  xpEarned: number;
  xpTotal: number;
  /** 0–100, by XP. */
  percent: number;
  /** The level the person is currently working on; null once all are done. */
  currentLevel: LevelProgress | null;
  rank: string;
  /** The first unfinished quest in level order, or null when everything is done. */
  nextQuest: QuestStatus | null;
  allComplete: boolean;
  /** False while any visible data quest still has a loading signal. */
  ready: boolean;
}

export const pathOf = (href: string) => href.split("?")[0];

/** The quests a person with this role can see. */
export const questsForRole = (role: Role | null | undefined, quests: Quest[] = QUESTS) =>
  quests.filter((q) => !q.roles || (role != null && q.roles.includes(role)));

export const questById = (id: string | null | undefined) =>
  id ? (QUESTS.find((q) => q.id === id) ?? null) : null;

export function computeProgress(
  signals: QuestSignals,
  visited: readonly string[],
  role: Role | null | undefined,
  quests: Quest[] = QUESTS,
  levels: Level[] = LEVELS,
): Progress {
  const visibleQuests = questsForRole(role, quests);
  const visitedSet = new Set(visited);

  const statuses: QuestStatus[] = visibleQuests.map((q) => ({
    ...q,
    done: q.kind === "visit" ? visitedSet.has(q.id) : (q.check?.(signals) ?? null),
    tally: q.progress?.(signals) ?? null,
  }));

  let previousComplete = true;
  const levelProgress: LevelProgress[] = levels.map((level) => {
    const inLevel = statuses.filter((q) => q.level === level.id);
    const doneCount = inLevel.filter((q) => q.done === true).length;
    const complete = inLevel.length > 0 && doneCount === inLevel.length;
    const unlocked = previousComplete;
    previousComplete = complete;
    return { ...level, quests: inLevel, doneCount, total: inLevel.length, complete, unlocked };
  });

  const xpTotal = statuses.reduce((sum, q) => sum + q.xp, 0);
  const xpEarned = statuses.filter((q) => q.done === true).reduce((sum, q) => sum + q.xp, 0);
  const percent = xpTotal === 0 ? 0 : Math.round((xpEarned / xpTotal) * 100);

  const currentLevel = levelProgress.find((l) => !l.complete) ?? null;
  const allComplete = statuses.length > 0 && statuses.every((q) => q.done === true);
  const completedLevels = levelProgress.filter((l) => l.complete).length;
  const rank = allComplete
    ? FINAL_RANK
    : completedLevels === 0
      ? STARTING_RANK
      : levelProgress[completedLevels - 1].rank;

  // First unfinished quest in level order, and only once every signal has
  // loaded: otherwise "Next up" would name a Level 4 tour stop while the
  // Level 1 checks were still in flight.
  const ready = statuses.every((q) => q.done !== null);
  const nextQuest = ready ? (statuses.find((q) => q.done === false) ?? null) : null;

  return {
    quests: statuses,
    levels: levelProgress,
    xpEarned,
    xpTotal,
    percent,
    currentLevel,
    rank,
    nextQuest,
    allComplete,
    ready,
  };
}

// ── Signal helpers, shared with the hook and its tests ────────────────────

/** The Insights Setup fields a person is most likely to fill first. */
export const INSIGHTS_KEY_FIELDS = [
  "monthlyRent",
  "loanEmi",
  "internet",
  "insurance",
  "licenses",
  "electricity",
  "gas",
  "packaging",
  "aggregatorCommission",
  "monthlyRevenueGoal",
  "monthlyProfitGoal",
  "targetEbitda",
  "targetFoodCost",
] as const;

/** Counts how many of the key fields hold a real, non-zero value. */
export const countInsightsFields = (data: Record<string, unknown> | null | undefined) => {
  if (!data) return 0;
  return INSIGHTS_KEY_FIELDS.filter((key) => {
    const v = data[key];
    return v !== null && v !== undefined && v !== "" && Number(v) !== 0;
  }).length;
};

/** Whether the branch's billing block has been touched at all. */
export const isBillingConfigured = (billing: Record<string, any> | null | undefined) => {
  if (!billing) return false;
  const gst = billing.gstPercentage;
  const hasGst = gst !== null && gst !== undefined && gst !== "" && Number(gst) > 0;
  const hasTypes = Array.isArray(billing.billingTypes) && billing.billingTypes.length > 0;
  const hasMethods = Array.isArray(billing.paymentMethods) && billing.paymentMethods.length > 0;
  return hasGst || hasTypes || hasMethods;
};

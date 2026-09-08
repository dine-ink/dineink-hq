/**
 * Everything Finish Setup checks before the restaurant setup is sent, as pure
 * functions, so the modal's alerts can say exactly which field on which step
 * is the problem instead of "please fill all required fields".
 *
 * Two kinds of row exist in the Branch, Menu and Staff steps:
 *   - a row left completely blank (the empty row every step starts with) is
 *     ignored and dropped on save, as before;
 *   - a row someone has started to fill must be completed. Silently dropping
 *     it, the old behaviour, lost the staff member or dish they had typed
 *     without a word.
 *
 * Every message names the step-local row (`Staff 2 ("Ravi")`) and the field by
 * the label the person sees on screen, so they can go straight to it.
 */

export const SETUP_TABS = [
  "Restaurant Details",
  "Branch Setup",
  "Menu Setup",
  "Billing Settings",
  "Staff Setup",
] as const;

export const TAB = {
  details: 0,
  branches: 1,
  menu: 2,
  billing: 3,
  staff: 4,
} as const;

export interface SetupProblem {
  /** Index into SETUP_TABS: the step the person has to go to. */
  tab: number;
  message: string;
}

export interface RestaurantInput {
  name: string;
  email: string;
  phone: string;
  address: string;
  gst: string;
}

export interface BillingInput {
  gstPercentage: string;
  serviceCharge: string;
}

export interface BranchInput {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  tables: { name: string; capacity: number }[];
  tablesCount: number;
  billing: BillingInput;
}

export interface CategoryInput {
  name: string;
  items: { name: string; price: string; prepTime: string }[];
}

export interface StaffInput {
  name: string;
  email: string;
  phone: string;
  hasLogin: boolean;
  password: string;
  department?: string;
  salary?: number;
  joiningDate?: string;
  shift?: string;
  /** Index into SetupInput.branches, or null when unassigned. */
  branchId?: number | null;
}

export interface SetupInput {
  restaurant: RestaurantInput;
  branches: BranchInput[];
  categories: CategoryInput[];
  staff: StaffInput[];
  /** The signed-in owner. Staff cannot reuse the owner's own login contacts. */
  owner: { email?: string | null; phone?: string | null };
}

export const MIN_STAFF_PASSWORD_LENGTH = 6;

// ── Field helpers ──────────────────────────────────────────────────────────

const isBlank = (v: unknown) => v === null || v === undefined || String(v).trim() === "";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const isValidEmail = (v: string) => EMAIL_RE.test(v.trim());

/**
 * Reduces "+91 98765-43210", "098765 43210" and "9876543210" to the same ten
 * digits, so duplicates are caught however each was typed.
 */
export const normalizePhone = (v: string | null | undefined): string => {
  let digits = (v ?? "").replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return digits;
};

// Any ten digits. Real Indian mobiles start with 6-9, but the message says
// "10-digit", and a rule the message does not state reads as a false error.
export const isValidPhone = (v: string) => /^\d{10}$/.test(normalizePhone(v));

// GSTIN: 2-digit state code, PAN (5 letters, 4 digits, 1 letter), entity
// code, the literal Z, then a check character.
const GSTIN_RE = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
export const isValidGstin = (v: string) => GSTIN_RE.test(v.trim().toUpperCase());

const isValidPincode = (v: string) => /^\d{6}$/.test(v.trim());

/** "A", "A and B", "A, B and C". */
export const joinList = (items: string[]) => {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
};

const rowLabel = (kind: string, index: number, name?: string) =>
  isBlank(name) ? `${kind} ${index + 1}` : `${kind} ${index + 1} ("${name!.trim()}")`;

// ── Per-step checks ────────────────────────────────────────────────────────

const checkRestaurantDetails = (r: RestaurantInput): SetupProblem[] => {
  const tab = TAB.details;
  const problems: SetupProblem[] = [];
  const required: [keyof RestaurantInput, string][] = [
    ["name", "Restaurant Name"],
    ["email", "Email Address"],
    ["phone", "Phone Number"],
    ["address", "Address"],
    ["gst", "GST Number"],
  ];
  const missing = required.filter(([key]) => isBlank(r[key])).map(([, label]) => label);
  if (missing.length) {
    problems.push({
      tab,
      message: `${joinList(missing)} ${missing.length > 1 ? "are" : "is"} required.`,
    });
  }
  if (!isBlank(r.email) && !isValidEmail(r.email)) {
    problems.push({ tab, message: `Email Address "${r.email.trim()}" is not a valid email.` });
  }
  if (!isBlank(r.phone) && !isValidPhone(r.phone)) {
    problems.push({ tab, message: "Phone Number should be a 10-digit mobile number." });
  }
  if (!isBlank(r.gst) && !isValidGstin(r.gst)) {
    problems.push({
      tab,
      message: `GST Number "${r.gst.trim()}" should be a 15-character GSTIN, like 22AAAAA0000A1Z5.`,
    });
  }
  return problems;
};

/** A branch row the person has started on, as opposed to the untouched empty row. */
export const branchHasData = (b: BranchInput) =>
  [b.name, b.phone, b.email, b.address, b.city, b.state, b.pincode].some((v) => !isBlank(v)) ||
  b.tablesCount > 0 ||
  b.tables.length > 0;

const checkBranches = (branches: BranchInput[]): SetupProblem[] => {
  const tab = TAB.branches;
  const problems: SetupProblem[] = [];
  // The dashboard treats a restaurant with no branches as not set up and
  // shows this form again, so a setup with none would just loop back here.
  if (!branches.some(branchHasData)) {
    problems.push({
      tab,
      message:
        "Add at least one branch. Bills, tables and staff all belong to a branch, so the dashboard cannot open without one.",
    });
    return problems;
  }
  branches.forEach((b, i) => {
    if (!branchHasData(b)) return;
    const label = rowLabel("Branch", i, b.name);
    if (isBlank(b.name)) {
      problems.push({ tab, message: `${label} needs a Branch Name.` });
    }
    if (!isBlank(b.phone) && !isValidPhone(b.phone)) {
      problems.push({ tab, message: `${label}: Branch Phone should be a 10-digit number.` });
    }
    if (!isBlank(b.email) && !isValidEmail(b.email)) {
      problems.push({
        tab,
        message: `${label}: Branch Email "${b.email.trim()}" is not a valid email.`,
      });
    }
    if (!isBlank(b.pincode) && !isValidPincode(b.pincode)) {
      problems.push({ tab, message: `${label}: Pincode should be 6 digits.` });
    }
    b.tables.forEach((t, j) => {
      const tableLabel = isBlank(t.name) ? `table ${j + 1}` : `table ${j + 1} ("${t.name.trim()}")`;
      if (isBlank(t.name)) {
        problems.push({ tab, message: `${label}: ${tableLabel} needs a name.` });
      }
      if (!Number.isFinite(t.capacity) || t.capacity < 1) {
        problems.push({
          tab,
          message: `${label}: ${tableLabel} needs a seating capacity of at least 1.`,
        });
      }
    });
  });
  return problems;
};

const itemHasData = (item: CategoryInput["items"][number]) =>
  [item.name, item.price, item.prepTime].some((v) => !isBlank(v));

/** A category row the person has started on. */
export const categoryHasData = (c: CategoryInput) =>
  !isBlank(c.name) || c.items.some(itemHasData);

const isNonNegativeNumber = (v: string) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0;
};

const checkMenu = (categories: CategoryInput[]): SetupProblem[] => {
  const tab = TAB.menu;
  const problems: SetupProblem[] = [];
  categories.forEach((c, i) => {
    if (!categoryHasData(c)) return;
    const label = rowLabel("Category", i, c.name);
    if (isBlank(c.name)) {
      problems.push({ tab, message: `${label} needs a name.` });
    }
    c.items.forEach((item, j) => {
      if (!itemHasData(item)) return;
      const itemLabel = isBlank(item.name)
        ? `item ${j + 1}`
        : `item ${j + 1} ("${item.name.trim()}")`;
      if (isBlank(item.name)) {
        problems.push({ tab, message: `${label}: ${itemLabel} needs an Item Name.` });
      }
      if (isBlank(item.price)) {
        problems.push({ tab, message: `${label}: ${itemLabel} needs a Price.` });
      } else if (!isNonNegativeNumber(item.price)) {
        problems.push({
          tab,
          message: `${label}: ${itemLabel} has an invalid Price "${item.price.trim()}".`,
        });
      }
      if (!isBlank(item.prepTime) && !isNonNegativeNumber(item.prepTime)) {
        problems.push({
          tab,
          message: `${label}: ${itemLabel} has an invalid Prep Time "${item.prepTime.trim()}".`,
        });
      }
    });
  });
  return problems;
};

const isPercent = (v: string) => isNonNegativeNumber(v) && Number(v) <= 100;

const checkBilling = (branches: BranchInput[]): SetupProblem[] => {
  const tab = TAB.billing;
  const problems: SetupProblem[] = [];
  branches.forEach((b, i) => {
    if (!branchHasData(b)) return;
    const label = rowLabel("Branch", i, b.name);
    if (!isBlank(b.billing.gstPercentage) && !isPercent(b.billing.gstPercentage)) {
      problems.push({ tab, message: `${label}: GST percentage should be between 0 and 100.` });
    }
    if (!isBlank(b.billing.serviceCharge) && !isPercent(b.billing.serviceCharge)) {
      problems.push({ tab, message: `${label}: Service charge should be between 0 and 100.` });
    }
  });
  return problems;
};

/** A staff row the person has started on. */
export const staffHasData = (s: StaffInput) =>
  [s.name, s.email, s.phone, s.department, s.joiningDate, s.shift].some((v) => !isBlank(v)) ||
  s.hasLogin ||
  (s.salary ?? 0) > 0;

const checkStaff = (
  staff: StaffInput[],
  branches: BranchInput[],
  owner: SetupInput["owner"],
): SetupProblem[] => {
  const tab = TAB.staff;
  const problems: SetupProblem[] = [];
  const ownerPhone = normalizePhone(owner.phone);
  const ownerEmail = (owner.email ?? "").trim().toLowerCase();
  const seenPhone = new Map<string, number>();
  const seenEmail = new Map<string, number>();

  staff.forEach((s, i) => {
    if (!staffHasData(s)) return;
    const label = rowLabel("Staff", i, s.name);

    const missing: string[] = [];
    if (isBlank(s.name)) missing.push("a Full Name");
    if (isBlank(s.phone)) missing.push("a Phone Number");
    if (missing.length) {
      problems.push({ tab, message: `${label} needs ${joinList(missing)}.` });
    }

    if (!isBlank(s.phone)) {
      if (!isValidPhone(s.phone)) {
        problems.push({
          tab,
          message: `${label}: Phone Number should be a 10-digit mobile number.`,
        });
      } else {
        const phone = normalizePhone(s.phone);
        if (ownerPhone && phone === ownerPhone) {
          problems.push({
            tab,
            message: `${label} uses your own account's phone number; staff need their own.`,
          });
        }
        const prev = seenPhone.get(phone);
        if (prev !== undefined) {
          problems.push({
            tab,
            message: `${rowLabel("Staff", prev, staff[prev].name)} and ${label} have the same Phone Number.`,
          });
        } else {
          seenPhone.set(phone, i);
        }
      }
    }

    if (!isBlank(s.email)) {
      if (!isValidEmail(s.email)) {
        problems.push({
          tab,
          message: `${label}: Email Address "${s.email.trim()}" is not a valid email.`,
        });
      } else {
        const email = s.email.trim().toLowerCase();
        if (ownerEmail && email === ownerEmail) {
          problems.push({
            tab,
            message: `${label} uses your own account's email address; staff need their own.`,
          });
        }
        const prev = seenEmail.get(email);
        if (prev !== undefined) {
          problems.push({
            tab,
            message: `${rowLabel("Staff", prev, staff[prev].name)} and ${label} have the same Email Address.`,
          });
        } else {
          seenEmail.set(email, i);
        }
      }
    }

    if (s.hasLogin && (s.password ?? "").length < MIN_STAFF_PASSWORD_LENGTH) {
      problems.push({
        tab,
        message: `${label} has Login Access on and needs a password of at least ${MIN_STAFF_PASSWORD_LENGTH} characters.`,
      });
    }

    // A blank branch row is dropped on save, so an assignment to it would be
    // lost silently. Say so, rather than quietly saving the person unassigned.
    if (s.branchId !== null && s.branchId !== undefined) {
      const branch = branches[s.branchId];
      if (!branch || !branchHasData(branch)) {
        problems.push({
          tab,
          message: `${label} is assigned to Branch ${s.branchId + 1}, which is empty. Fill in that branch or choose another.`,
        });
      }
    }
  });
  return problems;
};

// ── Entry points ───────────────────────────────────────────────────────────

/** The problems on one step only: what "Next Step" checks before moving on. */
export const validateSetupStep = (tab: number, input: SetupInput): SetupProblem[] => {
  switch (tab) {
    case TAB.details:
      return checkRestaurantDetails(input.restaurant);
    case TAB.branches:
      return checkBranches(input.branches);
    case TAB.menu:
      return checkMenu(input.categories);
    case TAB.billing:
      return checkBilling(input.branches);
    case TAB.staff:
      return checkStaff(input.staff, input.branches, input.owner);
    default:
      return [];
  }
};

/** Every problem across every step, in step order: what "Finish Setup" checks. */
export const validateSetup = (input: SetupInput): SetupProblem[] =>
  SETUP_TABS.flatMap((_, tab) => validateSetupStep(tab, input));

const MAX_SHOWN = 3;

/**
 * One toast's worth: the earliest step with a problem, up to three of its
 * messages, and a pointer to any later steps that also need attention.
 */
export const summarizeSetupProblems = (
  problems: SetupProblem[],
): { tab: number; message: string } | null => {
  if (problems.length === 0) return null;
  const tab = Math.min(...problems.map((p) => p.tab));
  const inTab = problems.filter((p) => p.tab === tab).map((p) => p.message);
  const shown = inTab.slice(0, MAX_SHOWN);
  const hidden = inTab.length - shown.length;
  const otherTabs = Array.from(
    new Set(problems.filter((p) => p.tab !== tab).map((p) => SETUP_TABS[p.tab])),
  );

  let message = `${SETUP_TABS[tab]}: ${shown.join(" ")}`;
  if (hidden > 0) message += ` And ${hidden} more issue${hidden === 1 ? "" : "s"} on this step.`;
  if (otherTabs.length) message += ` Also check ${joinList(otherTabs)}.`;
  return { tab, message };
};

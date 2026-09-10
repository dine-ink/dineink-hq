/**
 * What the guide remembers between visits, kept in localStorage per user.
 *
 * Only the things the server cannot tell us live here: whether the welcome
 * tour has been seen, whether the person hid the guide, which quests have
 * already been celebrated (so a toast fires once, not on every load), and which
 * reporting pages have been visited. Quest completion itself is never stored —
 * it is re-derived from live data each time, so it can never drift from what
 * the account actually contains.
 *
 * Keyed by user id so two owners sharing a browser do not share a tour. There
 * is no backend endpoint for this yet; when one arrives this module is the only
 * thing that needs to change.
 */

export interface OnboardingState {
  /** The welcome tour has been shown (or skipped). */
  welcomed: boolean;
  /** The person hid the guide. The launcher and dashboard card stay away. */
  hidden: boolean;
  /** Quest ids whose completion toast has fired. */
  celebrated: string[];
  /** Level ids whose level-up toast has fired. */
  celebratedLevels: number[];
  /** Visit-quest ids whose page has been opened. */
  visited: string[];
  /**
   * Set after the first load on which every signal resolved. Until then,
   * quests that are already complete are recorded silently rather than
   * celebrated — an account that has been live for months should not get
   * fifteen toasts the day this feature ships.
   */
  seeded: boolean;
}

export const DEFAULT_ONBOARDING_STATE: OnboardingState = {
  welcomed: false,
  hidden: false,
  celebrated: [],
  celebratedLevels: [],
  visited: [],
  seeded: false,
};

const PREFIX = "dineink:onboarding:v1:";

export const onboardingStorageKey = (userId: number | string | null | undefined) =>
  `${PREFIX}${userId ?? "anonymous"}`;

const asStringArray = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];

const asNumberArray = (v: unknown): number[] =>
  Array.isArray(v) ? v.filter((x): x is number => typeof x === "number") : [];

export function readOnboardingState(userId: number | string | null | undefined): OnboardingState {
  try {
    const raw = localStorage.getItem(onboardingStorageKey(userId));
    if (!raw) return { ...DEFAULT_ONBOARDING_STATE };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return { ...DEFAULT_ONBOARDING_STATE };
    return {
      welcomed: parsed.welcomed === true,
      hidden: parsed.hidden === true,
      celebrated: asStringArray(parsed.celebrated),
      celebratedLevels: asNumberArray(parsed.celebratedLevels),
      visited: asStringArray(parsed.visited),
      seeded: parsed.seeded === true,
    };
  } catch {
    // Malformed or blocked storage: start fresh rather than crash the shell.
    return { ...DEFAULT_ONBOARDING_STATE };
  }
}

export function writeOnboardingState(
  userId: number | string | null | undefined,
  state: OnboardingState,
): void {
  try {
    localStorage.setItem(onboardingStorageKey(userId), JSON.stringify(state));
  } catch {
    // Storage full or disabled — the guide still works for this session.
  }
}

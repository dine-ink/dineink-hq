/* eslint-disable react-refresh/only-export-components -- the hook and the
   provider share one context; splitting them would need a circular import. */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAppSelector } from "@/store";
import { notifySuccess } from "@/utils/notify";
import {
  GUIDE_ROLES,
  computeProgress,
  pathOf,
  type Progress,
  type Quest,
  type QuestStatus,
} from "./quests";
import {
  DEFAULT_ONBOARDING_STATE,
  readOnboardingState,
  writeOnboardingState,
  type OnboardingState,
} from "./onboardingStorage";
import { useOnboardingSignals } from "./useOnboardingSignals";

/** The URL parameter that names the quest being followed on the current page. */
export const QUEST_PARAM = "quest";

export interface OnboardingContextValue {
  progress: Progress;
  state: OnboardingState;
  /**
   * Whether any of the guide should render: the role qualifies, the restaurant
   * has finished setup, and the person has not hidden it.
   */
  visible: boolean;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  /** The welcome tour is due: visible, and never shown to this user before. */
  showWelcome: boolean;
  finishWelcome: () => void;
  replayTour: () => void;
  hideGuide: () => void;
  showGuide: () => void;
  /** The quest named by `?quest=` on the current page, if any. */
  activeQuest: QuestStatus | null;
  /** Navigate to a quest's page with the coachmark showing its steps. */
  goToQuest: (quest: Quest) => void;
  clearActiveQuest: () => void;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

/**
 * Null outside the provider — the Dashboard renders its Getting Started card
 * only when the shell has mounted the guide, and its tests render the page
 * bare, so the card must be able to stand down quietly.
 */
export function useOnboarding(): OnboardingContextValue | null {
  return useContext(OnboardingContext);
}

/** How many quest toasts fire at once before they collapse into one summary. */
const MAX_INDIVIDUAL_TOASTS = 3;

/**
 * Owns the guide's state for the authenticated shell: which quests are done
 * (derived live from the data), what has been celebrated, whether the tour is
 * due, and which quest the current page is walking through.
 *
 * Mounted once by DashboardLayout so the launcher in the header, the drawer,
 * the coachmark above the page and the Dashboard's card all read one source.
 */
export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { user } = useAppSelector((s) => s.auth);
  const { selectedBranch } = useAppSelector((s) => s.branch);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const userId: number | string | null = user?.id ?? null;
  const role: string | null = user?.role ?? null;
  const eligible = role !== null && GUIDE_ROLES.includes(role);

  const [state, setState] = useState<OnboardingState>(() => readOnboardingState(userId));
  const [loadedFor, setLoadedFor] = useState(userId);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [tourReplay, setTourReplay] = useState(false);

  // A different person signed in on the same browser: their record, not ours.
  useEffect(() => {
    if (loadedFor !== userId) {
      setState(readOnboardingState(userId));
      setLoadedFor(userId);
    }
  }, [userId, loadedFor]);

  // Persist every change. Cheap, and it keeps the record honest if the tab is
  // closed mid-way through a quest.
  useEffect(() => {
    if (loadedFor === userId) writeOnboardingState(userId, state);
  }, [state, userId, loadedFor]);

  const enabled = eligible && !state.hidden;
  const signals = useOnboardingSignals({
    restaurantId: user?.restaurantId,
    branchId: selectedBranch?.id,
    role,
    enabled,
  });

  const progress = useMemo(
    () => computeProgress(signals, state.visited, role),
    [signals, state.visited, role],
  );

  const hasRestaurant = signals.branchCount !== null && signals.branchCount > 0;
  const visible = enabled && hasRestaurant;

  // ── Visit quests tick when their page is opened ─────────────────────────
  useEffect(() => {
    if (!visible) return;
    const hit = progress.quests.find(
      (q) => q.kind === "visit" && !q.done && pathOf(q.href) === location.pathname,
    );
    if (hit) {
      setState((prev) =>
        prev.visited.includes(hit.id) ? prev : { ...prev, visited: [...prev.visited, hit.id] },
      );
    }
  }, [location.pathname, progress.quests, visible]);

  // ── Celebrations ────────────────────────────────────────────────────────
  // Keyed on the *set* of done quests and complete levels, so this runs when
  // something changes and not on every render that rebuilds the arrays.
  const doneIds = progress.quests.filter((q) => q.done === true).map((q) => q.id);
  const doneKey = doneIds.join("|");
  const completeLevelIds = progress.levels.filter((l) => l.complete).map((l) => l.id);
  const levelKey = completeLevelIds.join("|");

  useEffect(() => {
    if (!visible || !progress.ready) return;

    if (!state.seeded) {
      // First fully-loaded look at this account: record what is already done
      // without fanfare. See OnboardingState.seeded.
      setState((prev) => ({
        ...prev,
        seeded: true,
        celebrated: Array.from(new Set([...prev.celebrated, ...doneIds])),
        celebratedLevels: Array.from(new Set([...prev.celebratedLevels, ...completeLevelIds])),
      }));
      return;
    }

    const newQuests = progress.quests.filter(
      (q) => q.done === true && !state.celebrated.includes(q.id),
    );
    const newLevels = progress.levels.filter(
      (l) => l.complete && !state.celebratedLevels.includes(l.id),
    );
    if (newQuests.length === 0 && newLevels.length === 0) return;

    if (newQuests.length > MAX_INDIVIDUAL_TOASTS) {
      const xp = newQuests.reduce((sum, q) => sum + q.xp, 0);
      notifySuccess(`${newQuests.length} quests complete — +${xp} XP`);
    } else {
      newQuests.forEach((q) => notifySuccess(`Quest complete: ${q.title} — +${q.xp} XP`));
    }
    newLevels.forEach((l) =>
      notifySuccess(
        progress.allComplete
          ? `Every quest done — final rank: ${progress.rank}`
          : `Level ${l.id} complete — new rank: ${l.rank}`,
      ),
    );

    setState((prev) => ({
      ...prev,
      celebrated: Array.from(new Set([...prev.celebrated, ...newQuests.map((q) => q.id)])),
      celebratedLevels: Array.from(
        new Set([...prev.celebratedLevels, ...newLevels.map((l) => l.id)]),
      ),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- doneKey/levelKey stand in for the arrays they summarise
  }, [visible, progress.ready, doneKey, levelKey, state.seeded]);

  // ── Actions ─────────────────────────────────────────────────────────────
  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  const finishWelcome = useCallback(() => {
    setTourReplay(false);
    setState((prev) => (prev.welcomed ? prev : { ...prev, welcomed: true }));
  }, []);

  const replayTour = useCallback(() => {
    setDrawerOpen(false);
    setTourReplay(true);
  }, []);

  const hideGuide = useCallback(() => {
    setDrawerOpen(false);
    setState((prev) => ({ ...prev, hidden: true }));
  }, []);

  const showGuide = useCallback(() => {
    setState((prev) => ({ ...prev, hidden: false }));
    setDrawerOpen(true);
  }, []);

  const goToQuest = useCallback(
    (quest: Quest) => {
      setDrawerOpen(false);
      const joiner = quest.href.includes("?") ? "&" : "?";
      navigate(`${quest.href}${joiner}${QUEST_PARAM}=${encodeURIComponent(quest.id)}`);
    },
    [navigate],
  );

  const clearActiveQuest = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    next.delete(QUEST_PARAM);
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const activeQuestId = searchParams.get(QUEST_PARAM);
  const activeQuest = useMemo(
    () => (visible ? (progress.quests.find((q) => q.id === activeQuestId) ?? null) : null),
    [visible, progress.quests, activeQuestId],
  );

  const showWelcome = visible && (!state.welcomed || tourReplay);

  const value = useMemo<OnboardingContextValue>(
    () => ({
      progress,
      state,
      visible,
      drawerOpen,
      openDrawer,
      closeDrawer,
      showWelcome,
      finishWelcome,
      replayTour,
      hideGuide,
      showGuide,
      activeQuest,
      goToQuest,
      clearActiveQuest,
    }),
    [
      progress,
      state,
      visible,
      drawerOpen,
      openDrawer,
      closeDrawer,
      showWelcome,
      finishWelcome,
      replayTour,
      hideGuide,
      showGuide,
      activeQuest,
      goToQuest,
      clearActiveQuest,
    ],
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export { DEFAULT_ONBOARDING_STATE };

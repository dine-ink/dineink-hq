import { MapIcon, TrophyIcon } from "@heroicons/react/24/outline";
import { useOnboarding } from "./OnboardingProvider";

/**
 * The header button that opens the quest log — the game's "press J for
 * quests". A thin progress ring wraps the icon so the owner can see how far
 * along setup is from any page without opening anything.
 *
 * Lives in the top bar rather than as a floating button: the toast stack
 * already owns the bottom-right corner, and on a phone a floating button sits
 * over whatever table the person is trying to read.
 */
export function QuestLauncher() {
  const ctx = useOnboarding();
  if (!ctx || !ctx.visible) return null;

  const { progress, openDrawer } = ctx;
  const done = progress.quests.filter((q) => q.done === true).length;
  const total = progress.quests.length;
  const Icon = progress.allComplete ? TrophyIcon : MapIcon;

  // SVG ring: r=11 → circumference ≈ 69.1
  const radius = 11;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress.percent / 100);

  return (
    <button
      type="button"
      onClick={openDrawer}
      aria-label={`Open quest log, ${done} of ${total} quests complete`}
      title="Getting Started guide"
      className="group flex h-8 items-center gap-1.5 rounded-xl bg-white/10 px-1.5 text-white transition hover:bg-white/20 lg:h-7"
    >
      <span className="relative flex h-6 w-6 items-center justify-center">
        <svg viewBox="0 0 26 26" className="absolute inset-0 h-6 w-6 -rotate-90" aria-hidden="true">
          <circle cx="13" cy="13" r={radius} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2" />
          <circle
            cx="13"
            cy="13"
            r={radius}
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-[stroke-dashoffset] duration-500"
          />
        </svg>
        <Icon className="h-3 w-3" aria-hidden="true" />
      </span>
      <span className="hidden text-[11px] font-semibold lg:inline">
        {progress.allComplete ? "Complete" : `${done}/${total}`}
      </span>
    </button>
  );
}

export default QuestLauncher;

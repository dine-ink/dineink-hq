import { ArrowRightIcon, MapIcon, TrophyIcon } from "@heroicons/react/24/outline";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import { Button } from "@/design/components/buttons";
import { useOnboarding } from "./OnboardingProvider";

/** How many upcoming quests the card lists before pointing at the drawer. */
const SHOWN = 3;

/**
 * The Dashboard's Getting Started card: current level, XP and the next few
 * quests, each with a Start button. The Dashboard is the page a new owner
 * lands on and the one that looks emptiest before setup, so this is where the
 * path forward has to be.
 *
 * Renders nothing outside the provider (the Dashboard's own tests mount the
 * page without the shell) and once the guide is hidden.
 */
export function GettingStartedCard() {
  const ctx = useOnboarding();
  if (!ctx || !ctx.visible) return null;

  const { progress, goToQuest, openDrawer, hideGuide } = ctx;
  const done = progress.quests.filter((q) => q.done === true).length;

  if (progress.allComplete) {
    return (
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-success-200 bg-success-50 px-4 py-3">
        <TrophyIcon className="h-6 w-6 shrink-0 text-success-600" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-bold text-success-800">
            Setup complete — you are a {progress.rank}.
          </p>
          <p className="text-[11px] text-success-700">
            Every screen now runs on your real costs. The guide stays in the account menu.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={hideGuide}>
          Hide guide
        </Button>
      </div>
    );
  }

  const upcoming = progress.quests.filter((q) => q.done === false).slice(0, SHOWN);
  const level = progress.currentLevel;

  return (
    <section
      aria-label="Getting started"
      className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
    >
      <div className="flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white shadow-sm">
            <MapIcon className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-2">
              <h2 className="text-[14px] font-black tracking-tight text-gray-900">
                Getting started
              </h2>
              {level && (
                <span className="text-[11px] font-semibold text-gray-500">
                  Level {level.id}: {level.name}
                </span>
              )}
              <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-bold text-primary-700">
                {progress.rank}
              </span>
            </div>
            <div className="mt-1.5 flex items-center gap-3">
              <div
                className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100"
                role="progressbar"
                aria-valuenow={progress.percent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Setup progress"
              >
                <div
                  className="h-full rounded-full bg-primary-600 transition-all duration-500"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
              <span className="shrink-0 text-[11px] font-semibold text-gray-600">
                {done}/{progress.quests.length} quests · {progress.xpEarned} XP
              </span>
            </div>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={openDrawer} className="self-start lg:self-auto">
          Open quest log
        </Button>
      </div>

      {upcoming.length > 0 && (
        <ul className="grid gap-2 border-t border-gray-100 bg-gray-50/60 px-4 py-3 sm:grid-cols-2 lg:grid-cols-3">
          {upcoming.map((quest, i) => (
            <li
              key={quest.id}
              className="flex items-start gap-2.5 rounded-lg border border-gray-200 bg-white px-3 py-2.5"
            >
              <span
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${
                  i === 0 ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-600"
                }`}
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-[12px] font-bold text-gray-900">{quest.title}</p>
                  <span className="shrink-0 text-[10px] font-bold text-primary-700">+{quest.xp} XP</span>
                </div>
                <p className="mt-0.5 line-clamp-2 text-[11px] leading-4 text-gray-500">
                  {quest.summary}
                </p>
                {quest.tally && quest.tally.current > 0 && (
                  <p className="mt-1 text-[10px] font-bold text-warning-700">
                    {quest.tally.current} of {quest.tally.target} {quest.tally.noun} so far
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => goToQuest(quest)}
                  className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold text-primary-700 hover:underline"
                >
                  {quest.kind === "visit" ? "Take me there" : "Start quest"}
                  <ArrowRightIcon className="h-3 w-3" aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {progress.ready && upcoming.length === 0 && (
        <p className="flex items-center gap-2 border-t border-gray-100 px-4 py-2.5 text-[11px] text-gray-500">
          <CheckCircleIcon className="h-4 w-4 text-success-600" aria-hidden="true" />
          Everything in reach is done; open the quest log for the rest.
        </p>
      )}
    </section>
  );
}

export default GettingStartedCard;

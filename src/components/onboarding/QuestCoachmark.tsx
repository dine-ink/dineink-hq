import { useState } from "react";
import {
  ArrowRightIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MapIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon, CheckIcon } from "@heroicons/react/24/solid";
import { Button } from "@/design/components/buttons";
import { useOnboarding } from "./OnboardingProvider";
import type { QuestStatus } from "./quests";

/**
 * The in-page objective tracker — the strip a game pins to the top of the
 * screen while you are on a quest: which objective you are on, what to do
 * right now, and how many are left. One step at a time, with Back/Next to
 * walk through them; "All steps" unfolds the full list for people who prefer
 * to read ahead.
 *
 * It is deliberately one row tall. The page underneath is where the work
 * happens, so the tracker must not push it out of view.
 *
 * Rendered once by DashboardLayout above the routed page, driven by `?quest=`
 * in the URL, so no page needs to know about the guide. When the data behind
 * the quest lands, it flips to the completed state and offers the next quest.
 */
export function QuestCoachmark() {
  const ctx = useOnboarding();
  if (!ctx || !ctx.activeQuest) return null;
  // Keyed on the quest so the step counter starts over for a new quest.
  return <Tracker key={ctx.activeQuest.id} />;
}

function Tracker() {
  const ctx = useOnboarding()!;
  const { activeQuest: quest, progress, clearActiveQuest, goToQuest, openDrawer } = ctx;
  const [step, setStep] = useState(0);
  const [expanded, setExpanded] = useState(false);

  if (!quest) return null;
  const done = quest.done === true;
  const level = progress.levels.find((l) => l.id === quest.level);
  const next = progress.nextQuest && progress.nextQuest.id !== quest.id ? progress.nextQuest : null;
  const total = quest.steps.length;
  const last = step >= total - 1;

  const overline = [
    level ? `Level ${level.id}` : null,
    level ? `Quest ${level.quests.findIndex((q) => q.id === quest.id) + 1} of ${level.total}` : null,
    `+${quest.xp} XP`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <section
      role="region"
      aria-label={`Quest: ${quest.title}`}
      className={`mb-3 overflow-hidden rounded-xl border shadow-sm ${
        done ? "border-success-300 bg-success-50" : "border-gray-200 bg-white"
      }`}
    >
      <div className="flex items-stretch">
        {/* Accent rail */}
        <div className={`w-1 shrink-0 ${done ? "bg-success-500" : "bg-primary-600"}`} aria-hidden="true" />

        <div className="flex min-w-0 flex-1 flex-col gap-2 px-3 py-2.5 lg:flex-row lg:items-center lg:gap-4">
          {/* Identity: icon + overline + title */}
          <div className="flex min-w-0 items-center gap-3 lg:w-[300px] lg:shrink-0">
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white ${
                done ? "bg-success-600" : "bg-primary-600"
              }`}
            >
              {done ? (
                <CheckIcon className="h-5 w-5" aria-hidden="true" />
              ) : (
                <MapIcon className="h-4.5 w-4.5" aria-hidden="true" />
              )}
            </span>
            <div className="min-w-0">
              <p
                className={`truncate text-[10px] font-bold uppercase tracking-[0.14em] ${
                  done ? "text-success-700" : "text-primary-700"
                }`}
              >
                {done ? "Quest complete" : overline}
              </p>
              <h2 className="truncate text-[14px] font-black leading-5 tracking-tight text-gray-900">
                {quest.title}
              </h2>
            </div>
          </div>

          {/* Middle: current objective, or the completion line */}
          <div className="min-w-0 flex-1">
            {done ? (
              <p className="flex items-center gap-1.5 text-[12px] text-success-800">
                <CheckCircleIcon className="h-4 w-4 shrink-0 text-success-600" aria-hidden="true" />
                <span>
                  <span className="font-bold">Done</span> — +{quest.xp} XP earned.{" "}
                  {next ? "Ready for the next one?" : "Open the quest log to see what is left."}
                </span>
              </p>
            ) : (
              <div className="flex items-center gap-3">
                <Stepper total={total} current={step} onSelect={setStep} />
                <p className="min-w-0 flex-1 truncate text-[12px] text-gray-700 lg:whitespace-normal lg:line-clamp-1">
                  <span className="font-bold text-gray-900">Step {step + 1}:</span>{" "}
                  {quest.steps[step]}
                </p>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex shrink-0 items-center gap-1.5 self-end lg:self-auto">
            {done ? (
              next ? (
                <Button
                  size="sm"
                  onClick={() => goToQuest(next)}
                  rightIcon={<ArrowRightIcon className="h-3.5 w-3.5" />}
                >
                  Next quest: {next.title}
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={openDrawer}>
                  Open quest log
                </Button>
              )
            ) : (
              <>
                <TallyChip quest={quest} />
                <button
                  type="button"
                  onClick={() => setStep((s) => Math.max(0, s - 1))}
                  disabled={step === 0}
                  aria-label="Previous step"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setStep((s) => Math.min(total - 1, s + 1))}
                  disabled={last}
                  aria-label="Next step"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRightIcon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setExpanded((v) => !v)}
                  aria-expanded={expanded}
                  aria-label={expanded ? "Hide all steps" : "Show all steps"}
                  className="flex h-8 items-center gap-1 rounded-lg px-2 text-[11px] font-semibold text-gray-600 transition hover:bg-gray-100"
                >
                  All steps
                  <ChevronDownIcon
                    className={`h-3.5 w-3.5 transition ${expanded ? "rotate-180" : ""}`}
                    aria-hidden="true"
                  />
                </button>
              </>
            )}
            <button
              type="button"
              onClick={clearActiveQuest}
              aria-label="Dismiss quest guide"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-black/5 hover:text-gray-700"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Full step list */}
      {!done && expanded && (
        <div className="border-t border-gray-100 bg-gray-50/70 px-4 py-3 pl-5">
          <p className="mb-2 text-[11px] leading-5 text-gray-600">{quest.summary}</p>
          <ol className="space-y-0">
            {quest.steps.map((text, i) => {
              const state = i < step ? "past" : i === step ? "current" : "todo";
              return (
                <li key={i} className="relative flex gap-3 pb-2.5 last:pb-0">
                  {i < total - 1 && (
                    <span
                      className="absolute left-[9px] top-5 h-[calc(100%-14px)] w-px bg-gray-200"
                      aria-hidden="true"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => setStep(i)}
                    aria-label={`Go to step ${i + 1}`}
                    className={`relative z-10 mt-px flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition ${
                      state === "current"
                        ? "bg-primary-600 text-white ring-4 ring-primary-100"
                        : state === "past"
                          ? "bg-success-600 text-white"
                          : "border border-gray-300 bg-white text-gray-500 hover:border-gray-400"
                    }`}
                  >
                    {state === "past" ? <CheckIcon className="h-3 w-3" aria-hidden="true" /> : i + 1}
                  </button>
                  <p
                    className={`text-[12px] leading-5 ${
                      state === "current"
                        ? "font-semibold text-gray-900"
                        : state === "past"
                          ? "text-gray-400"
                          : "text-gray-600"
                    }`}
                  >
                    {text}
                  </p>
                </li>
              );
            })}
          </ol>
          <p className="mt-2 text-[11px] text-gray-500">
            {quest.tally
              ? `Completes on its own at ${quest.tally.target} ${quest.tally.noun} — you have ${quest.tally.current} so far.`
              : "Completes on its own once you save — nothing to tick."}
          </p>
        </div>
      )}
    </section>
  );
}

/**
 * The live count for a counted quest — "2 / 5 dishes" with a sliver of a bar —
 * or, for a yes/no quest, a quiet note that saving is what finishes it. This
 * is the answer to "I added two dishes, why is it not done?"
 */
function TallyChip({ quest }: { quest: QuestStatus }) {
  const t = quest.tally;
  if (!t) {
    return (
      <span className="hidden whitespace-nowrap rounded-lg bg-gray-100 px-2 py-1 text-[10px] font-semibold text-gray-500 md:inline">
        Completes on save
      </span>
    );
  }
  const pct = t.target === 0 ? 0 : Math.round((t.current / t.target) * 100);
  return (
    <span
      className="flex flex-col gap-1 rounded-lg border border-warning-200 bg-warning-50 px-2.5 py-1"
      aria-label={`${t.current} of ${t.target} ${t.noun}`}
    >
      <span className="whitespace-nowrap text-[11px] font-bold leading-none text-warning-800">
        {t.current} / {t.target} <span className="font-semibold text-warning-700">{t.noun}</span>
      </span>
      <span className="h-1 w-full overflow-hidden rounded-full bg-warning-200/70" aria-hidden="true">
        <span className="block h-full rounded-full bg-warning-500 transition-all" style={{ width: `${pct}%` }} />
      </span>
    </span>
  );
}

/** Numbered dots with connectors; the current one is filled, earlier ones ticked. */
function Stepper({
  total,
  current,
  onSelect,
}: {
  total: number;
  current: number;
  onSelect: (i: number) => void;
}) {
  return (
    <ol className="hidden shrink-0 items-center sm:flex" aria-label="Steps">
      {Array.from({ length: total }, (_, i) => {
        const past = i < current;
        const active = i === current;
        return (
          <li key={i} className="flex items-center">
            <button
              type="button"
              onClick={() => onSelect(i)}
              aria-label={`Step ${i + 1}`}
              aria-current={active ? "step" : undefined}
              className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold transition ${
                active
                  ? "bg-primary-600 text-white ring-4 ring-primary-100"
                  : past
                    ? "bg-success-600 text-white"
                    : "border border-gray-300 bg-white text-gray-500 hover:border-gray-400"
              }`}
            >
              {past ? <CheckIcon className="h-3 w-3" aria-hidden="true" /> : i + 1}
            </button>
            {i < total - 1 && (
              <span
                className={`h-px w-4 ${past ? "bg-success-400" : "bg-gray-200"}`}
                aria-hidden="true"
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

export default QuestCoachmark;

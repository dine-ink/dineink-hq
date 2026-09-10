import { Fragment, useEffect, useState } from "react";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import {
  ArrowRightIcon,
  ChevronDownIcon,
  LockClosedIcon,
  TrophyIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import { Button } from "@/design/components/buttons";
import { IconButton } from "@/design/components/buttons/IconButton";
import { useOnboarding } from "./OnboardingProvider";
import type { LevelProgress, QuestStatus } from "./quests";

/**
 * The quest log: every level and every quest, with what each is for, how to
 * do it, and a Go button that opens the page with the steps pinned at the top.
 *
 * A slide-over rather than a page so it can be opened from anywhere and closed
 * without losing your place. The level you are working on starts expanded;
 * the others fold to a header so the list reads as a path, not a wall.
 */
export function QuestDrawer() {
  const ctx = useOnboarding();
  if (!ctx || !ctx.visible) return null;
  return <QuestDrawerPanel />;
}

function QuestDrawerPanel() {
  const ctx = useOnboarding()!;
  const { progress, drawerOpen, closeDrawer, goToQuest, hideGuide, replayTour } = ctx;
  const done = progress.quests.filter((q) => q.done === true).length;

  return (
    <Transition show={drawerOpen} as={Fragment}>
      <Dialog onClose={closeDrawer} className="relative z-50">
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <DialogBackdrop className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        </TransitionChild>
        <div className="fixed inset-0 flex justify-end">
          <TransitionChild
            as={Fragment}
            enter="transform transition ease-out duration-250"
            enterFrom="translate-x-full"
            enterTo="translate-x-0"
            leave="transform transition ease-in duration-200"
            leaveFrom="translate-x-0"
            leaveTo="translate-x-full"
          >
            <DialogPanel className="flex h-full w-full max-w-md flex-col bg-white shadow-drawer">
              {/* Header */}
              <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-[#b10000] to-[#7a0000] px-5 pb-5 pt-4 text-white">
                <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
                <div className="relative flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-red-200">
                      Quest log
                    </p>
                    <DialogTitle className="mt-0.5 text-[18px] font-black tracking-tight">
                      {progress.allComplete ? "All quests complete" : "Getting started"}
                    </DialogTitle>
                    <p className="mt-0.5 text-[12px] text-red-100">
                      Rank: <span className="font-bold text-white">{progress.rank}</span>
                      {progress.currentLevel && (
                        <>
                          {" · "}Level {progress.currentLevel.id} of {progress.levels.length}
                        </>
                      )}
                    </p>
                  </div>
                  <IconButton
                    icon={<XMarkIcon className="h-4 w-4" />}
                    aria-label="Close quest log"
                    onClick={closeDrawer}
                    variant="ghost"
                    className="!text-white hover:!bg-white/15"
                  />
                </div>
                <div className="relative mt-4">
                  <div className="flex items-baseline justify-between text-[11px]">
                    <span className="font-semibold text-red-100">
                      {done} of {progress.quests.length} quests
                    </span>
                    <span className="font-bold">
                      {progress.xpEarned} / {progress.xpTotal} XP
                    </span>
                  </div>
                  <div
                    className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/20"
                    role="progressbar"
                    aria-valuenow={progress.percent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Setup progress"
                  >
                    <div
                      className="h-full rounded-full bg-white transition-all duration-500"
                      style={{ width: `${progress.percent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Levels */}
              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
                {progress.allComplete && (
                  <div className="mb-4 flex items-start gap-3 rounded-xl border border-success-200 bg-success-50 p-4">
                    <TrophyIcon className="mt-0.5 h-5 w-5 shrink-0 text-success-600" aria-hidden="true" />
                    <div className="text-[12px] text-success-700">
                      <p className="font-bold">You have set up everything DineInk can use.</p>
                      <p className="mt-0.5">
                        The numbers on every screen are now built on your real costs. You can
                        hide this guide below; it stays available from the account menu.
                      </p>
                    </div>
                  </div>
                )}
                <div className="space-y-3">
                  {progress.levels.map((level) => (
                    <LevelSection
                      key={level.id}
                      level={level}
                      defaultOpen={progress.currentLevel?.id === level.id}
                      onGo={goToQuest}
                    />
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="flex shrink-0 items-center justify-between gap-2 border-t border-surface-border px-4 py-3">
                <Button variant="ghost" size="sm" onClick={replayTour}>
                  Replay tutorial
                </Button>
                <Button variant="ghost" size="sm" onClick={hideGuide} className="text-gray-500">
                  Hide guide
                </Button>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
}

function LevelSection({
  level,
  defaultOpen,
  onGo,
}: {
  level: LevelProgress;
  defaultOpen: boolean;
  onGo: (quest: QuestStatus) => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  // Follow the current level as it moves: finishing Level 1 opens Level 2.
  useEffect(() => {
    if (defaultOpen) setOpen(true);
  }, [defaultOpen]);

  const badge = level.complete ? (
    <CheckCircleIcon className="h-6 w-6 text-success-600" aria-hidden="true" />
  ) : (
    <span
      className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-black ${
        level.unlocked ? "bg-primary-600 text-white" : "bg-gray-200 text-gray-500"
      }`}
    >
      {level.unlocked ? level.id : <LockClosedIcon className="h-3 w-3" aria-hidden="true" />}
    </span>
  );

  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-3 py-3 text-left transition hover:bg-gray-50"
      >
        {badge}
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-bold text-gray-900">
            Level {level.id}: {level.name}
          </p>
          <p className="truncate text-[11px] text-gray-500">
            {level.complete
              ? `Complete — rank earned: ${level.rank}`
              : level.unlocked
                ? `${level.doneCount} of ${level.total} done · earns ${level.rank}`
                : `Finish Level ${level.id - 1} to unlock · earns ${level.rank}`}
          </p>
        </div>
        <ChevronDownIcon
          className={`h-4 w-4 shrink-0 text-gray-400 transition ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>
      {open && (
        <div className="border-t border-gray-100">
          <p className="px-3 pt-2.5 text-[11px] leading-5 text-gray-500">{level.blurb}</p>
          <ul className="divide-y divide-gray-100">
            {level.quests.map((quest) => (
              <QuestRow key={quest.id} quest={quest} onGo={onGo} />
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function QuestRow({ quest, onGo }: { quest: QuestStatus; onGo: (q: QuestStatus) => void }) {
  const [expanded, setExpanded] = useState(false);
  const done = quest.done === true;

  return (
    <li className={done ? "bg-success-50/40" : ""}>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="flex w-full items-start gap-3 px-3 py-2.5 text-left"
      >
        {done ? (
          <CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-success-600" aria-hidden="true" />
        ) : (
          <span
            className="mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 border-gray-300"
            aria-hidden="true"
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p
              className={`text-[13px] font-semibold ${done ? "text-gray-500 line-through decoration-gray-300" : "text-gray-900"}`}
            >
              {quest.title}
            </p>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                done ? "bg-success-100 text-success-700" : "bg-primary-50 text-primary-700"
              }`}
            >
              +{quest.xp} XP
            </span>
          </div>
          {!expanded && <p className="mt-0.5 line-clamp-2 text-[11px] text-gray-500">{quest.summary}</p>}
          {!done && quest.tally && quest.tally.current > 0 && (
            <p className="mt-1 text-[10px] font-bold text-warning-700">
              {quest.tally.current} of {quest.tally.target} {quest.tally.noun}
            </p>
          )}
        </div>
      </button>
      {expanded && (
        <div className="px-3 pb-3 pl-11">
          <p className="text-[11px] leading-5 text-gray-600">{quest.summary}</p>
          <ol className="mt-2 space-y-1">
            {quest.steps.map((step, i) => (
              <li key={i} className="flex gap-2 text-[11px] leading-5 text-gray-700">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[9px] font-bold text-gray-600">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          <Button
            size="sm"
            variant={done ? "outline" : "primary"}
            className="mt-3"
            rightIcon={<ArrowRightIcon className="h-3.5 w-3.5" />}
            onClick={() => onGo(quest)}
          >
            {done ? "Open page" : quest.kind === "visit" ? "Take me there" : "Start quest"}
          </Button>
        </div>
      )}
    </li>
  );
}

export default QuestDrawer;

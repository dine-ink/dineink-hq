import { Fragment, useState } from "react";
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
  Bars3Icon,
  CalendarDaysIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  CreditCardIcon,
  MapIcon,
  SparklesIcon,
  UserCircleIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import { useAppSelector } from "@/store";
import { Button } from "@/design/components/buttons";
import { useOnboarding } from "./OnboardingProvider";

/**
 * The first-run tutorial — the "how to play" screens a game shows once before
 * handing over the controls.
 *
 * Shown the first time the dashboard opens with a set-up restaurant, and again
 * on request from the quest log. Four short slides: what DineInk is, how the
 * shell works (the three things people miss: the global date range, the branch
 * picker, the account menu), how the quest log works, and a call to start.
 */
export function WelcomeTour() {
  const ctx = useOnboarding();
  if (!ctx || !ctx.showWelcome) return null;
  return <WelcomeTourDialog />;
}

const SLIDE_COUNT = 4;

function WelcomeTourDialog() {
  const ctx = useOnboarding()!;
  const { progress, finishWelcome, goToQuest, openDrawer } = ctx;
  const { user } = useAppSelector((s) => s.auth);
  const [slide, setSlide] = useState(0);

  const firstName = (user?.name || "").trim().split(/\s+/)[0] || "there";
  const levelOne = progress.levels[0];

  const startFirstQuest = () => {
    finishWelcome();
    if (progress.nextQuest) goToQuest(progress.nextQuest);
    else openDrawer();
  };

  const explore = () => finishWelcome();

  return (
    <Transition show as={Fragment} appear>
      <Dialog onClose={explore} className="relative z-50">
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <DialogBackdrop className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </TransitionChild>
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <DialogPanel className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-dialog bg-white shadow-dialog">
              {/* Hero */}
              <div className="relative overflow-hidden bg-gradient-to-br from-[#b10000] to-[#7a0000] px-6 py-6 text-white">
                <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
                <div className="relative">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-red-200">
                    Tutorial · {slide + 1} of {SLIDE_COUNT}
                  </p>
                  <DialogTitle className="mt-1 text-[22px] font-black tracking-tight">
                    {slide === 0 && `Welcome to DineInk, ${firstName}`}
                    {slide === 1 && "Finding your way around"}
                    {slide === 2 && "Your quest log"}
                    {slide === 3 && "Ready when you are"}
                  </DialogTitle>
                </div>
              </div>

              {/* Body */}
              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 text-[13px] leading-6 text-gray-700">
                {slide === 0 && <SlideWelcome />}
                {slide === 1 && <SlideShell />}
                {slide === 2 && <SlideQuests levelOne={levelOne} />}
                {slide === 3 && <SlideStart nextTitle={progress.nextQuest?.title ?? null} />}
              </div>

              {/* Footer */}
              <div className="flex shrink-0 items-center justify-between gap-3 border-t border-surface-border px-6 py-3">
                <div className="flex items-center gap-1.5" aria-hidden="true">
                  {Array.from({ length: SLIDE_COUNT }, (_, i) => (
                    <span
                      key={i}
                      className={`h-1.5 rounded-full transition-all ${
                        i === slide ? "w-5 bg-primary-600" : "w-1.5 bg-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  {slide < SLIDE_COUNT - 1 ? (
                    <>
                      <Button variant="ghost" size="sm" onClick={explore}>
                        Skip tour
                      </Button>
                      {slide > 0 && (
                        <Button variant="outline" size="sm" onClick={() => setSlide((s) => s - 1)}>
                          Back
                        </Button>
                      )}
                      <Button
                        size="sm"
                        onClick={() => setSlide((s) => s + 1)}
                        rightIcon={<ArrowRightIcon className="h-3.5 w-3.5" />}
                      >
                        Next
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" size="sm" onClick={explore}>
                        Explore on my own
                      </Button>
                      <Button
                        size="sm"
                        onClick={startFirstQuest}
                        rightIcon={<ArrowRightIcon className="h-3.5 w-3.5" />}
                      >
                        {progress.nextQuest ? "Start the next quest" : "Open quest log"}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
}

function SlideWelcome() {
  const tiles = [
    { icon: CreditCardIcon, label: "Billing & bills" },
    { icon: ClipboardDocumentListIcon, label: "Menu & stock" },
    { icon: UsersIcon, label: "Staff & payroll" },
    { icon: ChartBarIcon, label: "Finance & forecasts" },
  ];
  return (
    <div>
      <div className="flex items-start gap-3 rounded-xl border border-success-200 bg-success-50 px-4 py-3">
        <CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-success-600" aria-hidden="true" />
        <div className="text-success-800">
          <p className="font-bold">Quest 1 complete: your restaurant is set up.</p>
          <p className="text-[12px]">+100 XP. That was the hardest part.</p>
        </div>
      </div>
      <p className="mt-4">
        DineInk is the operating system for your restaurant. The POS at the counter feeds it
        every bill; this dashboard turns those bills into stock, payroll, cash flow and profit.
      </p>
      <p className="mt-2">
        It gets sharper the more it knows. Right now it knows your menu and your branch. The
        next few quests teach it your tables, costs, team and expenses — after that, every
        screen shows real figures instead of zeros.
      </p>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {tiles.map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="flex flex-col items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-2 py-3 text-center"
          >
            <Icon className="h-5 w-5 text-primary-600" aria-hidden="true" />
            <span className="text-[11px] font-semibold text-gray-700">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SlideShell() {
  const rows = [
    {
      icon: Bars3Icon,
      title: "The sidebar",
      body: "Every screen, top to bottom: daily operations first (Bills, Customers, Operations), then finance (Insights, Statements, Budget, Forecasting), then the back office (Vendors, Dues, Compliance, Banking). Collapse it with the D button.",
    },
    {
      icon: CalendarDaysIcon,
      title: "The date range applies everywhere",
      body: "Today, 7D, 30D, 90D or a custom range in the top bar. Change it once and every chart, table and export on every page follows.",
    },
    {
      icon: MapIcon,
      title: "The branch picker",
      body: "If you run more than one branch, the dropdown in the top bar chooses which one you are looking at. Shops, Insights and Banking are all per branch.",
    },
    {
      icon: UserCircleIcon,
      title: "Your account menu",
      body: "Top right: Account Settings (restaurant profile, branches, discounts, password) and this guide, whenever you want it back.",
    },
  ];
  return (
    <ul className="space-y-3">
      {rows.map(({ icon: Icon, title, body }) => (
        <li key={title} className="flex gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
            <Icon className="h-4.5 w-4.5" aria-hidden="true" />
          </span>
          <div>
            <p className="font-bold text-gray-900">{title}</p>
            <p className="text-[12px] leading-5 text-gray-600">{body}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

function SlideQuests({ levelOne }: { levelOne?: { quests: { id: string; title: string; xp: number; done: boolean | null }[]; name: string } }) {
  return (
    <div>
      <p>
        Setup is a set of <strong>quests</strong> grouped into four <strong>levels</strong>.
        Each quest is one thing to enter, worth XP. Finish a level and you earn a rank.
      </p>
      <ul className="mt-3 space-y-1.5 text-[12px] text-gray-600">
        <li className="flex gap-2">
          <SparklesIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" aria-hidden="true" />
          <span>
            Quests tick themselves off <strong>when the data appears</strong> — there is nothing
            to mark done. Add a table on Shops and the quest completes.
          </span>
        </li>
        <li className="flex gap-2">
          <ArrowRightIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" aria-hidden="true" />
          <span>
            <strong>Start quest</strong> opens the right page and pins the steps at the top so
            you never have to remember what comes next.
          </span>
        </li>
        <li className="flex gap-2">
          <MapIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" aria-hidden="true" />
          <span>
            The progress ring in the top bar opens the full quest log from any page.
          </span>
        </li>
      </ul>
      {levelOne && (
        <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500">
            Level 1 · {levelOne.name}
          </p>
          <ul className="mt-2 space-y-1.5">
            {levelOne.quests.map((q) => (
              <li key={q.id} className="flex items-center gap-2 text-[12px]">
                {q.done ? (
                  <CheckCircleIcon className="h-4 w-4 text-success-600" aria-hidden="true" />
                ) : (
                  <span className="h-4 w-4 rounded-full border-2 border-gray-300" aria-hidden="true" />
                )}
                <span className={q.done ? "text-gray-500 line-through" : "text-gray-800"}>{q.title}</span>
                <span className="ml-auto text-[10px] font-bold text-primary-700">+{q.xp} XP</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function SlideStart({ nextTitle }: { nextTitle: string | null }) {
  return (
    <div>
      <p>
        Twenty minutes across the first two levels is enough for Insights, Cash Flow and the
        AI advisor to start telling you things you did not know about your own restaurant.
      </p>
      <p className="mt-2">
        You can stop at any point — progress is remembered, and the quest log is always one
        click away in the top bar.
      </p>
      {nextTitle && (
        <div className="mt-4 rounded-xl border border-primary-100 bg-primary-50 px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary-700">Next up</p>
          <p className="mt-0.5 text-[14px] font-bold text-gray-900">{nextTitle}</p>
        </div>
      )}
    </div>
  );
}

export default WelcomeTour;

import { Link } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import { CheckIcon } from "@heroicons/react/20/solid";
import {
  WifiIcon,
  Squares2X2Icon,
  ComputerDesktopIcon,
  CubeIcon,
  TagIcon,
  BanknotesIcon,
  CreditCardIcon,
  ChartBarIcon,
  UserGroupIcon,
  DocumentChartBarIcon,
  ScaleIcon,
  ClipboardDocumentCheckIcon,
  ArrowTrendingUpIcon,
  CalculatorIcon,
  BuildingLibraryIcon,
  TruckIcon,
  ShieldCheckIcon,
  SparklesIcon,
  DevicePhoneMobileIcon,
  ChatBubbleLeftRightIcon,
  WrenchScrewdriverIcon,
  PresentationChartLineIcon,
} from "@heroicons/react/24/outline";

const runFeatures = [
  {
    name: "Offline-first billing",
    description:
      "Billing keeps running with no internet. Orders and bills queue locally and sync automatically, with real FY-sequential GST invoice numbers assigned once you are back online.",
    icon: WifiIcon,
  },
  {
    name: "Dine-in, takeaway and quick bill",
    description:
      "Table floor plans with merge and transfer, plus takeaway and quick-bill counters from one checkout — order type is chosen right before the bill is generated.",
    icon: Squares2X2Icon,
  },
  {
    name: "Live kitchen display",
    description:
      "A shared prep checklist across every kitchen screen, item-level cancel-request approvals, and a club view that groups the same dish across orders for batch cooking.",
    icon: ComputerDesktopIcon,
  },
  {
    name: "Menu and recipes",
    description:
      "Categories, add-ons, pricing and availability, with recipes mapped to ingredients so every sale knows what it consumed.",
    icon: ClipboardDocumentCheckIcon,
  },
  {
    name: "Ingredient-level inventory",
    description:
      "Sales auto-deduct ingredients through your recipes — unit-aware across kg, g, ml, tsp and tbsp — with low-stock alerts and a daily stock audit that shows the unaccounted residual instead of hiding it.",
    icon: CubeIcon,
  },
  {
    name: "Vendors and procurement",
    description:
      "Purchase tracking, vendor dues, reorder levels and WhatsApp reorder — with live supplier pricing so you buy against today's market rate.",
    icon: TruckIcon,
  },
  {
    name: "Discounts and customer recognition",
    description:
      "Percentage, fixed-amount or coupon-code discounts behind a manager-approval gate, plus instant recognition of a returning guest from their phone number.",
    icon: TagIcon,
  },
  {
    name: "Cash sessions per cashier",
    description:
      "Every cashier opens their own drawer session, with shift X/Z report printing and expected-versus-actual reconciliation at close. No shared, unaccountable cash box.",
    icon: BanknotesIcon,
  },
  {
    name: "Attendance and payroll",
    description:
      "Shift attendance, leave management and payroll runs with deductions and net pay — the labour cost line, tracked where it happens.",
    icon: UserGroupIcon,
  },
];

const booksFeatures = [
  {
    name: "Financial statements",
    description:
      "Six statement types including a real profit and loss — not a sales total with expenses subtracted underneath it.",
    icon: DocumentChartBarIcon,
  },
  {
    name: "Budget vs actual",
    description:
      "Twenty-five line items with variance and achievement percentage, so you can see which cost line broke the month.",
    icon: ScaleIcon,
  },
  {
    name: "Dues, EBITDA and payment calendar",
    description:
      "What you owe, when it is due, what is already overdue, and the EBITDA margin underneath it all.",
    icon: CalculatorIcon,
  },
  {
    name: "Banking, UPI and reconciliation",
    description:
      "Bank accounts, transactions, native UPI with generated QR, payment analytics and reconciliation against your books.",
    icon: BuildingLibraryIcon,
  },
  {
    name: "Cash flow predictor",
    description:
      "Vendor dues, EMIs and payroll weighed against expected inflow, so a squeeze is something you see coming rather than discover.",
    icon: ArrowTrendingUpIcon,
  },
  {
    name: "Compliance tracking",
    description:
      "FSSAI licence, fire safety and pest control with expiry and renewal tracking, plus GST filing due dates.",
    icon: ShieldCheckIcon,
  },
  {
    name: "Equipment and assets",
    description:
      "An asset register linked to the kitchen stations that depend on it, including service and replacement tracking.",
    icon: WrenchScrewdriverIcon,
  },
];

const decideFeatures = [
  {
    name: "Revenue forecasting",
    description:
      "345 forecast permutations across method, horizon and granularity — and Forecast Accuracy scores every past prediction against what actually happened.",
    icon: PresentationChartLineIcon,
  },
  {
    name: "Scenario what-if modelling",
    description:
      "Twenty bounded input levers producing twenty-two outputs. A report tells you food cost rose; a scenario tells you what happens if it rises another three percent.",
    icon: ChartBarIcon,
  },
  {
    name: "Investment analysis",
    description:
      "ROI, NPV, IRR, payback period and profitability index on a new outlet, a new oven or a renovation — before you commit the money.",
    icon: CreditCardIcon,
  },
  {
    name: "Labour and capacity model",
    description:
      "Station throughput ceilings, per-item labour standards, a skill matrix and equipment linkage, resolving to a verdict per station: equipment bound, short of staff, nobody trained, or balanced.",
    icon: UserGroupIcon,
  },
  {
    name: "AI financial advisor",
    description:
      "Plain-language insights and branch narratives over your own numbers, with a timeline of what changed and an ask-anything view.",
    icon: SparklesIcon,
  },
  {
    name: "Executive scorecards",
    description:
      "The owner's view — the handful of numbers that decide whether this month worked, with a timeline behind each one.",
    icon: ChartBarIcon,
  },
  {
    name: "Branch and city comparison",
    description:
      "Outlet-against-outlet and city-against-city performance, so a weak branch is visible while there is still time to fix it. Enterprise plan.",
    icon: Squares2X2Icon,
  },
];

const capabilities = [
  "Formal financial statements",
  "Budget vs actual variance",
  "Scenario and what-if modelling",
  "Investment ROI, NPV and IRR",
  "Cash flow prediction",
  "Payroll processing",
  "Labour capacity modelling",
  "Forecast accuracy scoring",
  "Procurement price intelligence",
];

const indiaFeatures = [
  {
    name: "GST",
    detail:
      "FY-sequential invoice numbering, CGST/SGST split and filing due dates.",
  },
  {
    name: "Rent",
    detail:
      "Per sq ft plus CAM and chargeable area, escalation, and revenue-share models.",
  },
  {
    name: "Aggregators",
    detail:
      "Swiggy and Zomato commission as scenario levers, with net delivery margin after packaging and gateway.",
  },
  {
    name: "Statutory",
    detail:
      "FSSAI licence, fire safety and pest control — expiry and renewal tracking.",
  },
  {
    name: "Payments",
    detail: "Native UPI with generated QR and bank reconciliation.",
  },
  {
    name: "WhatsApp",
    detail:
      "A first-class channel — marketing campaigns, vendor reorder and e-bills.",
  },
];

type Feature = {
  name: string;
  description: string;
  icon: typeof WifiIcon;
};

function FeatureGrid({
  features,
  variant,
}: {
  features: Feature[];
  variant: "light" | "dark";
}) {
  return (
    <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {features.map((feature) => (
        <div
          key={feature.name}
          className={
            variant === "dark"
              ? "rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm transition hover:-translate-y-1 hover:border-white/25 hover:bg-white/10"
              : "rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:border-red-200 hover:shadow-xl"
          }
        >
          <div
            className={
              variant === "dark"
                ? "mb-6 inline-flex rounded-2xl bg-white/10 p-4 text-white"
                : "mb-6 inline-flex rounded-2xl bg-red-50 p-4 text-[#b10000]"
            }
          >
            <feature.icon aria-hidden="true" className="h-7 w-7" />
          </div>
          <h3
            className={
              variant === "dark"
                ? "text-xl font-semibold text-white"
                : "text-xl font-semibold text-slate-900"
            }
          >
            {feature.name}
          </h3>
          <p
            className={
              variant === "dark"
                ? "mt-4 leading-7 text-red-100"
                : "mt-4 leading-7 text-slate-600"
            }
          >
            {feature.description}
          </p>
        </div>
      ))}
    </div>
  );
}

export default function Features() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />
      <main>
        {/* Hero */}
        <div className="relative isolate overflow-hidden bg-gradient-to-br from-red-50 via-white to-rose-50 pt-14">
          <svg
            aria-hidden="true"
            className="absolute inset-0 -z-10 size-full stroke-red-100 [mask-image:radial-gradient(100%_100%_at_top_right,white,transparent)]"
          >
            <defs>
              <pattern
                x="50%"
                y={-1}
                id="features-grid"
                width={200}
                height={200}
                patternUnits="userSpaceOnUse"
              >
                <path d="M100 200V.5M.5 .5H200" fill="none" />
              </pattern>
            </defs>
            <rect
              fill="url(#features-grid)"
              width="100%"
              height="100%"
              strokeWidth={0}
            />
          </svg>
          <div className="mx-auto max-w-7xl px-6 py-28 sm:py-36 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center rounded-full border border-red-100 bg-red-50 px-4 py-1 text-sm font-medium text-[#b10000]">
                29 modules · 98 analytical views · 50 named reports
              </div>
              <h1 className="mt-6 text-5xl font-bold tracking-tight text-slate-900 sm:text-6xl">
                Everything to run the restaurant — and the part nobody else
                ships
              </h1>
              <p className="mt-6 text-lg leading-8 text-slate-600">
                Three layers. The first one every POS competes on. The second and
                third are why owners switch: closing the books, and deciding what
                to do next.
              </p>
              <div className="mt-10 flex flex-wrap justify-center gap-4">
                <Link
                  to="/signup"
                  className="rounded-xl bg-[#b10000] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-red-200 transition hover:bg-[#8f0000]"
                >
                  Start free
                </Link>
                <Link
                  to="/pricing"
                  className="rounded-xl border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-[#b10000]"
                >
                  View pricing
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Layer 1 — run the restaurant */}
        <section className="mx-auto mt-24 max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-base font-semibold text-[#b10000]">
              Layer one
            </h2>
            <p className="mt-3 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Run the restaurant
            </p>
            <p className="mt-6 text-lg leading-8 text-slate-600">
              The daily operation — billing, kitchen, stock, cash and people.
              This is the layer every POS competes on, so we made sure ours is
              not the reason you compromise.
            </p>
          </div>
          <FeatureGrid features={runFeatures} variant="light" />
        </section>

        {/* Layer 2 — close the books */}
        <section className="mt-32">
          <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
            <div className="relative isolate overflow-hidden bg-[#b10000] px-6 py-24 shadow-2xl sm:rounded-[32px] sm:px-10 lg:px-16">
              <div className="mx-auto max-w-3xl text-center">
                <h2 className="text-base font-semibold text-red-200">
                  Layer two
                </h2>
                <p className="mt-3 text-4xl font-bold tracking-tight text-white sm:text-5xl">
                  Close the books
                </p>
                <p className="mt-6 text-lg leading-8 text-red-100">
                  The CFO layer, living inside the POS. Cost classification and
                  assumption inheritance are designed into the data model, which
                  is why these are screens you open rather than exports you send
                  to someone else.
                </p>
              </div>
              <div className="mx-auto max-w-7xl">
                <FeatureGrid features={booksFeatures} variant="dark" />
              </div>
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
              >
                <div className="absolute top-0 left-1/4 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
                <div className="absolute right-1/4 bottom-0 h-80 w-80 rounded-full bg-white/5 blur-3xl" />
              </div>
            </div>
          </div>
        </section>

        {/* Layer 3 — decide what is next */}
        <section className="mx-auto mt-32 max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-base font-semibold text-[#b10000]">
              Layer three
            </h2>
            <p className="mt-3 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Decide what is next
            </p>
            <p className="mt-6 text-lg leading-8 text-slate-600">
              Reports describe the past. These are the tools you plan with — and
              the only ones in this market that will show you how wrong the last
              forecast was.
            </p>
          </div>
          <FeatureGrid features={decideFeatures} variant="light" />
        </section>

        {/* Capability comparison — no competitor named on purpose */}
        <section className="mx-auto mt-32 max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center rounded-full border border-red-100 bg-red-50 px-4 py-1 text-sm font-medium text-[#b10000]">
              Where nobody else competes
            </div>
            <h2 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Nine capabilities a restaurant POS does not ship
            </h2>
            <p className="mt-6 text-lg leading-8 text-slate-600">
              Some products in this market surface a basic profit view from sales
              minus logged expenses. None of them ship a statement set, a budget
              variance, or a single tool you can plan with.
            </p>
          </div>

          <div className="mx-auto mt-12 max-w-4xl overflow-x-auto rounded-3xl border border-red-100 bg-white shadow-sm">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-red-100 bg-red-50">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#b10000]">
                    Capability
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-500">
                    A typical POS
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-[#b10000]">
                    DineInk
                  </th>
                </tr>
              </thead>
              <tbody>
                {capabilities.map((capability, index) => (
                  <tr
                    key={capability}
                    className="border-b border-slate-100 last:border-none hover:bg-slate-50/50"
                  >
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {capability}
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-slate-400">
                      {index === 0 ? "Basic profit view" : "Not offered"}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <CheckIcon
                        aria-label="Included"
                        className="mx-auto h-5 w-5 text-[#b10000]"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mx-auto mt-4 max-w-4xl text-center text-xs text-slate-500">
            Based on publicly documented capabilities of widely used Indian
            restaurant POS products, reviewed August 2026.
          </p>
        </section>

        {/* Built for India */}
        <section className="mx-auto mt-32 max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center rounded-full border border-red-100 bg-red-50 px-4 py-1 text-sm font-medium text-[#b10000]">
              Built for India
            </div>
            <h2 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Built for India, not translated into it
            </h2>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {indiaFeatures.map((item) => (
              <div
                key={item.name}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="text-sm font-semibold tracking-widest text-[#b10000] uppercase">
                  {item.name}
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* DineInk DOT */}
        <section className="mx-auto mt-32 max-w-7xl px-6 lg:px-8">
          <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="bg-gradient-to-br from-red-50 via-white to-rose-50 p-10 lg:p-14">
                <div className="inline-flex rounded-2xl bg-[#b10000] p-3.5 text-white">
                  <DevicePhoneMobileIcon
                    aria-hidden="true"
                    className="h-6 w-6"
                  />
                </div>
                <div className="mt-6 text-xs font-semibold tracking-widest text-[#b10000] uppercase">
                  A separate app for the unorganised sector
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <h2 className="text-4xl font-bold tracking-tight text-slate-900">
                    DineInk DOT
                  </h2>
                  <span className="rounded-full border border-red-200 bg-white px-3 py-1 text-xs font-semibold text-[#b10000]">
                    Launching soon
                  </span>
                </div>
                <p className="mt-6 text-lg leading-8 text-slate-600">
                  Street vendors, tea stalls and single-counter shops do not need
                  a floor plan or a kitchen display. They need compliant billing
                  and an honest day-book on the phone already in their pocket —
                  which is the half of this market nobody else sells to.
                </p>
                <Link
                  to="/pricing"
                  className="mt-8 inline-flex items-center rounded-xl bg-[#b10000] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#8f0000]"
                >
                  See DOT pricing →
                </Link>
              </div>
              <div className="border-t border-slate-100 p-10 lg:border-t-0 lg:border-l lg:p-14">
                <ul className="space-y-5">
                  {[
                    "Runs entirely on a phone — no terminal, no printer",
                    "GST-compliant bills with FY-sequential numbering",
                    "Works through a dropped connection and syncs later",
                    "Native UPI with a generated QR code",
                    "Daily sales and collection summary",
                    "₹4,999 a year",
                  ].map((point) => (
                    <li key={point} className="flex items-start gap-3">
                      <CheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-[#b10000]" />
                      <span className="text-base leading-7 text-slate-700">
                        {point}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8 flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 p-4">
                  <ChatBubbleLeftRightIcon className="h-5 w-5 shrink-0 text-[#b10000]" />
                  <p className="text-sm text-slate-700">
                    DOT is a standalone mobile application, not yet on the app
                    stores — tell us you want it and we will let you know the
                    day it ships. Professional and Enterprise are the platform
                    for restaurants on a floor, and are available today.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto mt-32 max-w-7xl px-6 pb-24 lg:px-8">
          <div className="rounded-[32px] bg-[#b10000] px-8 py-16 text-center shadow-2xl">
            <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
              From a single cart to a twenty-outlet chain
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-red-100">
              One product family covers both halves of this market — which no
              competitor attempts. Start on the free tier and see the finance
              layer work on your own numbers.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link
                to="/signup"
                className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-[#b10000] shadow-lg transition hover:bg-red-50"
              >
                Start free
              </Link>
              <Link
                to="/contact"
                className="rounded-xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
              >
                Talk to us
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

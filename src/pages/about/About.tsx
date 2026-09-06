import { Link } from "react-router-dom";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import {
  ScaleIcon,
  EyeIcon,
  BookOpenIcon,
  CubeTransparentIcon,
  MapPinIcon,
  HandRaisedIcon,
} from "@heroicons/react/24/outline";

const productScale = [
  { label: "Dashboard modules", value: "29" },
  { label: "Analytical views", value: "98" },
  { label: "Tracked metrics", value: "675" },
];

const principles = [
  {
    name: "One definition, one place",
    description:
      "Food cost means the same thing on every screen. Shared definitions live in a single place, so two reports can never quietly disagree about the same number.",
    icon: BookOpenIcon,
  },
  {
    name: "Blank is not zero",
    description:
      "A metric with no data shows as blank, never as ₹0. A missing number and a real zero lead to completely different decisions, so we refuse to blur them.",
    icon: CubeTransparentIcon,
  },
  {
    name: "We grade our own work",
    description:
      "Forecast Accuracy scores every prediction we made against what actually happened. We are the only ones in this market who will show you how wrong our last forecast was.",
    icon: EyeIcon,
  },
  {
    name: "No winner badges",
    description:
      "No “best seller” label that is really just the highest revenue row. If a ranking depends on an assumption, we name the assumption instead of decorating the result.",
    icon: ScaleIcon,
  },
  {
    name: "Limitations, self-declared",
    description:
      "Where a model is bounded or a metric is an estimate, the product says so on the screen. You should never have to reverse-engineer whether a number can be trusted.",
    icon: HandRaisedIcon,
  },
  {
    name: "Indian by design",
    description:
      "GST, CAM and chargeable area, aggregator commission, FSSAI renewals, UPI and WhatsApp are first-class concepts here — not settings bolted onto a product built somewhere else.",
    icon: MapPinIcon,
  },
];

const team = [
  {
    name: "Vikranth Venkateswar",
    role: "Product and engineering",
    detail: "Associate Consultant, Infosys",
    education: "MTech, Data Engineering — IIT Jodhpur",
  },
  {
    name: "Venkadesh V",
    role: "Growth and operations",
    detail: "South Regional Head, Taco Bell",
    education: "MBA, Marketing Management",
  },
];

export default function About() {
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
                id="about-grid"
                width={200}
                height={200}
                patternUnits="userSpaceOnUse"
              >
                <path d="M100 200V.5M.5 .5H200" fill="none" />
              </pattern>
            </defs>
            <rect
              fill="url(#about-grid)"
              width="100%"
              height="100%"
              strokeWidth={0}
            />
          </svg>
          <div className="mx-auto max-w-7xl px-6 pt-32 pb-24 lg:px-8">
            <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 lg:grid-cols-2">
              <div>
                <div className="inline-flex items-center rounded-full border border-red-100 bg-red-50 px-4 py-1 text-sm font-medium text-[#b10000]">
                  About DineInk
                </div>
                <h1 className="mt-6 text-5xl font-bold tracking-tight text-slate-900 sm:text-6xl">
                  Nobody sold the owner a finance system
                </h1>
                <p className="mt-6 text-lg leading-8 text-slate-600">
                  They sold him four operational tools and left the arithmetic to
                  him. A POS that counts orders. Middleware that counts
                  aggregator orders. Tally, months later. Excel and a CA for
                  everything else.
                </p>
                <p className="mt-6 text-lg leading-8 text-slate-600">
                  That gap is the reason DineInk exists. We are building the one
                  place where a restaurant owner can see what the business
                  actually earned — without waiting for someone else to tell
                  them.
                </p>
                <div className="mt-10 flex flex-wrap gap-4">
                  <Link
                    to="/signup"
                    className="rounded-xl bg-[#b10000] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-red-200 transition hover:bg-[#8f0000]"
                  >
                    Start free
                  </Link>
                  <Link
                    to="/contact"
                    className="rounded-xl border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-[#b10000]"
                  >
                    Contact us
                  </Link>
                </div>
              </div>

              <div className="rounded-[32px] border border-red-100 bg-white p-6 shadow-xl sm:p-10">
                <p className="text-sm font-semibold tracking-widest text-[#b10000] uppercase">
                  The question we started from
                </p>
                <blockquote className="mt-6 text-2xl font-semibold leading-relaxed tracking-tight text-slate-900">
                  “Am I profitable this month?”
                </blockquote>
                <p className="mt-6 text-base leading-7 text-slate-600">
                  Ask an Indian restaurant owner and the honest answer is usually
                  “let me check with my CA” — and the reply arrives 30 to 45 days
                  later, in a spreadsheet, from someone else. A business that
                  turns over cash every single day should not have to wait a month
                  and a half to find out how it is doing.
                </p>
                <div className="mt-10 grid grid-cols-3 gap-4 border-t border-slate-100 pt-8">
                  {productScale.map((stat) => (
                    <div key={stat.label}>
                      <div className="text-3xl font-bold text-[#b10000]">
                        {stat.value}
                      </div>
                      <div className="mt-1 text-xs leading-5 text-slate-500">
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mission */}
        <section className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center rounded-full border border-red-100 bg-red-50 px-4 py-1 text-sm font-medium text-[#b10000]">
              Our mission
            </div>
            <h2 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Put the finance layer inside the till
            </h2>
            <p className="mt-6 text-lg leading-8 text-slate-600">
              Restaurant software has always stopped at the counter. We think the
              interesting work starts after the bill is printed — in the cost of
              what went into the dish, the margin the aggregator left behind, the
              station that is actually capping your output, and whether next month
              can carry a second branch. That is the product we are building, and
              we are building it for every size of kitchen: a street cart on
              DineInk DOT, and a twenty-outlet chain on Enterprise.
            </p>
          </div>
        </section>

        {/* Principles */}
        <section className="bg-white py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center rounded-full border border-red-100 bg-red-50 px-4 py-1 text-sm font-medium text-[#b10000]">
                How we build
              </div>
              <h2 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                A number you cannot trust is worse than no number
              </h2>
              <p className="mt-6 text-lg leading-8 text-slate-600">
                Analytics are easy to make impressive and hard to make honest.
                These are the rules we hold ourselves to — they are the reason the
                finance layer is worth opening at all.
              </p>
            </div>
            <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {principles.map((principle) => (
                <div
                  key={principle.name}
                  className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:border-red-200 hover:shadow-lg"
                >
                  <div className="mb-4 inline-flex rounded-2xl bg-red-50 p-3 text-[#b10000]">
                    <principle.icon aria-hidden="true" className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900">
                    {principle.name}
                  </h3>
                  <p className="mt-4 leading-7 text-slate-600">
                    {principle.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Team */}
        <section className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center rounded-full border border-red-100 bg-red-50 px-4 py-1 text-sm font-medium text-[#b10000]">
              The team
            </div>
            <h2 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Who is building this
            </h2>
            <p className="mt-6 text-lg leading-8 text-slate-600">
              A data engineer and a restaurant operator. One of us has built the
              systems, the other has run the outlets.
            </p>
          </div>
          <div className="mx-auto mt-16 grid max-w-4xl grid-cols-1 gap-8 sm:grid-cols-2">
            {team.map((member) => (
              <div
                key={member.name}
                className="rounded-3xl border border-red-100 bg-white p-8 shadow-sm"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#b10000] text-xl font-bold text-white">
                  {member.name
                    .split(" ")
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)}
                </div>
                <h3 className="mt-6 text-xl font-semibold text-slate-900">
                  {member.name}
                </h3>
                <p className="mt-1 text-sm font-medium text-[#b10000]">
                  {member.role}
                </p>
                <dl className="mt-6 space-y-2 text-sm text-slate-600">
                  <div>{member.detail}</div>
                  <div>{member.education}</div>
                </dl>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-7xl px-6 pb-24 lg:px-8">
          <div className="rounded-[32px] bg-[#b10000] px-8 py-16 text-center shadow-2xl">
            <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Stop waiting 45 days for your own numbers
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-red-100">
              Start free, run a week of real billing through it, and see what the
              finance layer tells you about your own restaurant.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link
                to="/signup"
                className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-[#b10000] shadow-lg transition hover:bg-red-50"
              >
                Start free
              </Link>
              <Link
                to="/features"
                className="rounded-xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
              >
                See the product
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

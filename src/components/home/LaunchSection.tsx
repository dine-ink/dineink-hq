import { Link } from "react-router-dom";

const assurances = [
  "Free to start",
  "No credit card required",
  "Published pricing — no sales call",
  "Your data stays yours",
];

export default function LaunchSection() {
  return (
    <div className="mx-auto mt-32 max-w-7xl sm:mt-40 sm:px-6 lg:px-8">
      <div className="relative isolate overflow-hidden rounded-[32px] bg-[#b10000] px-6 py-24 shadow-2xl sm:px-24 xl:py-32">
        <h2 className="mx-auto max-w-4xl text-center text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Find out what you earned last month
        </h2>

        <p className="mx-auto mt-6 max-w-2xl text-center text-lg leading-8 text-red-100">
          Start on the free tier, put a week of real billing through it, and the
          finance modules will have something to tell you. No demo call, no
          quote, no salesperson.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/signup"
            className="rounded-xl bg-white px-7 py-4 text-sm font-semibold text-[#b10000] shadow-lg transition duration-300 hover:bg-red-50"
          >
            Start free
          </Link>
          <Link
            to="/pricing"
            className="rounded-xl border border-white/25 bg-white/10 px-7 py-4 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
          >
            See all plans
          </Link>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-red-100">
          {assurances.map((assurance) => (
            <div key={assurance} className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="h-2 w-2 rounded-full bg-white/60"
              />
              {assurance}
            </div>
          ))}
        </div>

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        >
          <div className="absolute top-0 left-1/3 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute right-1/4 bottom-0 h-80 w-80 rounded-full bg-white/5 blur-3xl" />
        </div>
      </div>
    </div>
  );
}

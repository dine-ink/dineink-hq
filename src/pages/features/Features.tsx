import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import {
  QueueListIcon,
  Squares2X2Icon,
  CreditCardIcon,
  UserGroupIcon,
  ChartBarIcon,
  CloudIcon,
} from "@heroicons/react/24/outline";

const features = [
  {
    name: "Menu Management",
    description:
      "Create categories, add dishes, update prices and manage item availability easily.",
    icon: QueueListIcon,
  },
  {
    name: "Table & Order Management",
    description:
      "Handle dine-in tables, takeaway orders and delivery requests from one place.",
    icon: Squares2X2Icon,
  },
  {
    name: "Fast Billing",
    description:
      "Generate bills quickly with GST, discounts, taxes and multiple payment options.",
    icon: CreditCardIcon,
  },
  {
    name: "Role-Based Access",
    description:
      "Give different access to owners, cashiers, kitchen staff and managers securely.",
    icon: UserGroupIcon,
  },
  {
    name: "Reports & Analytics",
    description:
      "Track daily sales, best-selling items, taxes, staff performance and customer trends.",
    icon: ChartBarIcon,
  },
  {
    name: "Cloud Backup",
    description:
      "Your restaurant data stays safe with secure backups and cloud synchronization.",
    icon: CloudIcon,
  },
];

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
            <rect fill="url(#features-grid)" width="100%" height="100%" strokeWidth={0} />
          </svg>
          <div className="mx-auto max-w-7xl px-6 py-28 sm:py-36 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <div className="inline-flex items-center rounded-full border border-red-100 bg-red-50 px-4 py-1 text-sm font-medium text-[#b10000]">
                Powerful Restaurant Features
              </div>
              <h1 className="mt-6 text-5xl font-bold tracking-tight text-slate-900 sm:text-6xl">
                Everything you need to manage your restaurant
              </h1>
              <p className="mt-6 text-lg leading-8 text-slate-600">
                DineInk helps restaurant owners manage menu, billing, tables,
                staff, reports and customer orders from one dashboard.
              </p>
              <div className="mt-10 flex flex-wrap justify-center gap-4">
                <a
                  href="/signup"
                  className="rounded-xl bg-[#b10000] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-red-200 transition hover:bg-[#8f0000]"
                >
                  Get Started Free
                </a>
                <a
                  href="/pricing"
                  className="rounded-xl border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-[#b10000]"
                >
                  View Pricing
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard preview */}
        <div className="relative overflow-hidden">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-[32px] border border-red-100 bg-slate-900 p-6 shadow-2xl">
              <div className="rounded-2xl border border-white/10 bg-slate-800/50 p-4 shadow-inner">
                <div className="mb-3 flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-white/30" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500/70" />
                  <div className="h-3 w-3 rounded-full bg-green-500/70" />
                  <div className="ml-3 h-6 flex-1 rounded-md bg-white/10" />
                </div>
                <div className="flex gap-3">
                  <div className="w-44 shrink-0 rounded-xl bg-white/5 p-3 space-y-2">
                    <div className="h-8 w-24 rounded-lg bg-white/20" />
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-6 rounded-md bg-white/10" />
                    ))}
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="rounded-xl bg-white/10 p-4">
                          <div className="h-3 w-16 rounded bg-white/30" />
                          <div className="mt-3 h-6 w-20 rounded bg-white/20" />
                        </div>
                      ))}
                    </div>
                    <div className="rounded-xl bg-white/10 p-4">
                      <div className="mb-3 h-3 w-24 rounded bg-white/30" />
                      <div className="space-y-2">
                        {[...Array(4)].map((_, i) => (
                          <div key={i} className="flex gap-3">
                            <div className="h-5 w-5 rounded bg-white/20" />
                            <div className="h-5 flex-1 rounded bg-white/10" />
                            <div className="h-5 w-16 rounded bg-white/20" />
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-white/10 p-4 h-24" />
                      <div className="rounded-xl bg-white/10 p-4 h-24" />
                    </div>
                  </div>
                </div>
              </div>
              <div
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-900/80 to-transparent"
              />
            </div>
          </div>
        </div>

        {/* Feature cards */}
        <div className="mx-auto mt-20 max-w-7xl px-6 sm:mt-24 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-base font-semibold text-[#b10000]">
              Core Features
            </h2>
            <p className="mt-2 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Built for every part of your restaurant
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.name}
                className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:border-red-200 hover:shadow-xl"
              >
                <div className="mb-6 inline-flex rounded-2xl bg-red-50 p-4 text-[#b10000]">
                  <feature.icon aria-hidden="true" className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900">
                  {feature.name}
                </h3>
                <p className="mt-4 leading-7 text-slate-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mx-auto mt-24 max-w-7xl px-6 pb-24 lg:px-8">
          <div className="rounded-[32px] bg-[#b10000] px-8 py-16 text-center shadow-2xl">
            <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Built for restaurants of every size
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-red-100">
              Whether you run a small café, a cloud kitchen, a fine dining
              restaurant or multiple branches, DineInk scales with your
              business.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <a
                href="/signup"
                className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-[#b10000] shadow-lg transition hover:bg-red-50"
              >
                Get Started
              </a>
              <a
                href="/contact"
                className="rounded-xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
              >
                Contact Sales
              </a>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

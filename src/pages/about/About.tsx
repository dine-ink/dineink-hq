import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import {
  SparklesIcon,
  BuildingStorefrontIcon,
  BoltIcon,
  ListBulletIcon,
  ChartBarIcon,
  LifebuoyIcon,
} from "@heroicons/react/24/outline";

const stats = [
  { label: "Restaurants onboarded", value: "500+" },
  { label: "Orders processed monthly", value: "1M+" },
  { label: "Menus managed", value: "15,000+" },
];

const values = [
  {
    name: "Simple to use",
    description:
      "DineInk is designed so restaurant owners and staff can manage billing, tables, menus and reports without complicated training.",
    icon: SparklesIcon,
  },
  {
    name: "Built for restaurants",
    description:
      "Whether you run a café, fine dining restaurant, food court outlet or takeaway counter, DineInk adapts to your workflow.",
    icon: BuildingStorefrontIcon,
  },
  {
    name: "Fast billing",
    description:
      "Create bills quickly for dine-in, takeaway and delivery orders with a clean and reliable billing flow.",
    icon: BoltIcon,
  },
  {
    name: "Smart menu management",
    description:
      "Update categories, dishes, prices and availability in minutes without depending on developers.",
    icon: ListBulletIcon,
  },
  {
    name: "Useful business insights",
    description:
      "Track sales, top-selling items, staff performance and daily business reports from one dashboard.",
    icon: ChartBarIcon,
  },
  {
    name: "Reliable support",
    description:
      "Our team is focused on helping restaurant owners solve problems quickly and keep their operations running smoothly.",
    icon: LifebuoyIcon,
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
            <rect fill="url(#about-grid)" width="100%" height="100%" strokeWidth={0} />
          </svg>
          <div className="mx-auto max-w-7xl px-6 pt-32 pb-24 lg:px-8">
            <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 lg:grid-cols-2">
              <div>
                <div className="inline-flex items-center rounded-full border border-red-100 bg-red-50 px-4 py-1 text-sm font-medium text-red-700">
                  About DineInk
                </div>
                <h1 className="mt-6 text-5xl font-bold tracking-tight text-slate-900 sm:text-6xl">
                  Helping restaurants manage everything from one place
                </h1>
                <p className="mt-6 text-lg leading-8 text-slate-600">
                  DineInk is built to simplify restaurant management by bringing
                  billing, menu management, table handling, staff operations and
                  reporting into a single platform. Whether you own a café,
                  restaurant, cloud kitchen or fine dining outlet, DineInk helps
                  you run operations faster and smarter.
                </p>
                <div className="mt-10 flex flex-wrap gap-4">
                  <a
                    href="/signup"
                    className="rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-red-200 transition hover:bg-red-700"
                  >
                    Get Started
                  </a>
                  <a
                    href="/contact"
                    className="rounded-xl border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                  >
                    Contact Us
                  </a>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <img
                  src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80"
                  alt="Restaurant interior"
                  className="h-72 w-full rounded-3xl object-cover shadow-xl"
                />
                <img
                  src="https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=800&q=80"
                  alt="Restaurant billing"
                  className="mt-12 h-72 w-full rounded-3xl object-cover shadow-xl"
                />
                <img
                  src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80"
                  alt="Dining table"
                  className="h-72 w-full rounded-3xl object-cover shadow-xl"
                />
                <img
                  src="https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=800&q=80"
                  alt="Restaurant staff"
                  className="mt-12 h-72 w-full rounded-3xl object-cover shadow-xl"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Mission + Stats */}
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center rounded-full border border-red-100 bg-red-50 px-4 py-1 text-sm font-medium text-red-700">
              Our Mission
            </div>
            <h2 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Making restaurant management simple
            </h2>
            <p className="mt-6 text-lg leading-8 text-slate-600">
              We want to make restaurant management simple, fast and affordable.
              DineInk helps owners reduce manual work, avoid billing confusion
              and improve the customer experience with smarter operations.
            </p>
          </div>
          <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-3xl border border-red-100 bg-white p-8 text-center shadow-sm"
              >
                <div className="text-4xl font-bold text-red-600">
                  {stat.value}
                </div>
                <div className="mt-3 text-sm font-medium text-slate-600">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Values */}
        <div className="bg-white py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center rounded-full border border-red-100 bg-red-50 px-4 py-1 text-sm font-medium text-red-700">
                What makes us different
              </div>
              <h2 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                What makes DineInk different
              </h2>
              <p className="mt-6 text-lg leading-8 text-slate-600">
                DineInk is designed specifically for restaurant owners who need
                a simple yet powerful system to manage day-to-day operations.
              </p>
            </div>
            <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {values.map((value) => (
                <div
                  key={value.name}
                  className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:border-red-200 hover:shadow-lg"
                >
                  <div className="mb-4 inline-flex rounded-2xl bg-red-50 p-3 text-red-600">
                    <value.icon aria-hidden="true" className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900">
                    {value.name}
                  </h3>
                  <p className="mt-4 leading-7 text-slate-600">
                    {value.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
          <div className="rounded-[32px] bg-gradient-to-br from-red-900 via-rose-900 to-slate-900 px-8 py-16 text-center shadow-2xl">
            <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Ready to simplify your restaurant?
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-300">
              Join hundreds of restaurants already using DineInk to manage their
              daily operations smarter and faster.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <a
                href="/signup"
                className="rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-red-900/30 transition hover:bg-red-500"
              >
                Get Started Free
              </a>
              <a
                href="/contact"
                className="rounded-xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
              >
                Talk to Us
              </a>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

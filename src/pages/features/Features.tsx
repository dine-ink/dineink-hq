import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import {
  ArrowPathIcon,
  CloudArrowUpIcon,
  Cog6ToothIcon,
  FingerPrintIcon,
  LockClosedIcon,
  ServerIcon,
} from "@heroicons/react/24/outline";

const features = [
  {
    name: "Menu Management",
    description:
      "Create categories, add dishes, update prices and manage item availability easily.",
    icon: CloudArrowUpIcon,
  },
  {
    name: "Table & Order Management",
    description:
      "Handle dine-in tables, takeaway orders and delivery requests from one place.",
    icon: LockClosedIcon,
  },
  {
    name: "Fast Billing",
    description:
      "Generate bills quickly with GST, discounts, taxes and multiple payment options.",
    icon: ArrowPathIcon,
  },
  {
    name: "Role-Based Access",
    description:
      "Give different access to owners, cashiers, kitchen staff and managers securely.",
    icon: FingerPrintIcon,
  },
  {
    name: "Reports & Analytics",
    description:
      "Track daily sales, best-selling items, taxes, staff performance and customer trends.",
    icon: Cog6ToothIcon,
  },
  {
    name: "Cloud Backup",
    description:
      "Your restaurant data stays safe with secure backups and cloud synchronization.",
    icon: ServerIcon,
  },
];

export default function Features() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="inline-flex items-center rounded-full border border-red-100 bg-red-50 px-4 py-1 text-sm font-medium text-red-700">
              Powerful Restaurant Features
            </div>

            <h1 className="mt-6 text-5xl font-bold tracking-tight text-slate-900 sm:text-6xl">
              Everything you need to manage your restaurant
            </h1>

            <p className="mt-6 text-lg leading-8 text-slate-600">
              DineInk helps restaurant owners manage menu, billing, tables,
              staff, reports and customer orders from one dashboard.
            </p>
          </div>
        </div>

        <div className="relative overflow-hidden pt-16">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-[32px] border border-red-100 bg-gradient-to-br from-red-900 via-rose-900 to-slate-900 p-4 shadow-2xl">
              <img
                alt="DineInk Dashboard Preview"
                src="https://tailwindcss.com/plus-assets/img/component-images/project-app-screenshot.png"
                width={2432}
                height={1442}
                className="mb-[-12%] rounded-2xl shadow-2xl ring-1 ring-white/10"
              />

              <div aria-hidden="true" className="relative">
                <div className="absolute -inset-x-20 bottom-0 bg-gradient-to-t from-red-950 pt-[7%]" />
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-20 max-w-7xl px-6 sm:mt-24 lg:px-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.name}
                className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:border-red-200 hover:shadow-xl"
              >
                <div className="mb-6 inline-flex rounded-2xl bg-red-50 p-4 text-red-600">
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

        <div className="mx-auto mt-28 max-w-7xl px-6 lg:px-8">
          <div className="rounded-[32px] bg-gradient-to-br from-red-900 via-rose-900 to-slate-900 px-8 py-16 text-center shadow-2xl">
            <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Built for restaurants of every size
            </h2>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-300">
              Whether you run a small café, a cloud kitchen, a fine dining
              restaurant or multiple branches, DineInk scales with your
              business.
            </p>

            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <button className="rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-red-900/30 transition hover:bg-red-500">
                Get Started
              </button>

              <button className="rounded-xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20">
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
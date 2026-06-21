import {
  ChartPieIcon,
  ReceiptPercentIcon,
  UserGroupIcon,
} from "@heroicons/react/24/solid";

export default function DashboardPreviewSection() {
  const primaryFeatures = [
    {
      name: "Quick Billing",
      description:
        "Generate dine-in, takeaway and delivery bills in seconds with fast checkout flow.",
      icon: ReceiptPercentIcon,
    },
    {
      name: "Kitchen & Staff Management",
      description:
        "Assign kitchen staff, reception users and managers with role-based access.",
      icon: UserGroupIcon,
    },
    {
      name: "Reports & Analytics",
      description:
        "Track daily sales, best-selling items, taxes, payment modes and customer trends.",
      icon: ChartPieIcon,
    },
  ];

  return (
    <div className="mx-auto mt-32 max-w-7xl sm:mt-56 sm:px-6 lg:px-8">
      <div className="relative isolate overflow-hidden rounded-[32px]bg-[#b10000] px-6 py-20 shadow-2xl sm:px-10 sm:py-24 lg:px-16 lg:py-24">
        <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-12 gap-y-16 lg:mx-0 lg:max-w-none lg:grid-cols-2 lg:items-center">
          <div className="lg:max-w-xl">
            <div className="inline-flex items-center rounded-full border border-red-400/30 bg-[#b10000]/10 px-4 py-1 text-sm font-medium text-red-200 backdrop-blur-sm">
              Powerful Restaurant Management
            </div>

            <h2 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Simplify restaurant operations with DineInk
            </h2>

            <p className="mt-6 text-lg leading-8 text-gray-300">
              Manage orders, billing, menu, staff, reports and customer flow
              from one single dashboard designed for restaurants.
            </p>

            <div className="mt-10">
              <dl className="space-y-8 text-base text-gray-300">
                {primaryFeatures.map((feature) => (
                  <div
                    key={feature.name}
                    className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm transition duration-300 hover:border-red-500/30 hover:bg-white/10"
                  >
                    <dt className="flex items-center gap-3 text-lg font-semibold text-white">
                      <feature.icon
                        aria-hidden="true"
                        className="size-6 text-red-400"
                      />
                      {feature.name}
                    </dt>
                    <dd className="mt-2 text-sm leading-7 text-gray-300">
                      {feature.description}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -top-8 -left-8 h-40 w-40 rounded-full bg-[#b10000]/20 blur-3xl" />
            <div className="absolute -bottom-8 -right-8 h-40 w-40 rounded-full bg-rose-500/20 blur-3xl" />

            <img
              alt="DineInk Dashboard Preview"
              src="https://tailwindcss.com/plus-assets/img/component-images/dark-project-app-screenshot.png"
              width={2432}
              height={1442}
              className="relative -z-20 max-w-xl min-w-full rounded-xl shadow-xl ring-1 ring-white/10 lg:row-span-4 lg:w-5xl lg:max-w-none"
            />
          </div>
        </div>

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        >
          <div className="absolute top-0 left-1/3 h-72 w-72 rounded-full bg-[#b10000]/20 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 h-80 w-80 rounded-full bg-rose-500/20 blur-3xl" />
        </div>
      </div>
    </div>
  );
}

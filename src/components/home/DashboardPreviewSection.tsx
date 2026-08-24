import {
  ChartPieIcon,
  WifiIcon,
  ComputerDesktopIcon,
} from "@heroicons/react/24/solid";

import desktopAppScreen from "../../assets/images/Desktop-App-Screen.png";

export default function DashboardPreviewSection() {
  const primaryFeatures = [
    {
      name: "Works even offline",
      description:
        "Take orders and generate bills with zero internet — everything queues locally and syncs the moment you are back online, with real GST invoice numbers assigned at sync.",
      icon: WifiIcon,
    },
    {
      name: "Live kitchen display",
      description:
        "A shared prep checklist across every kitchen screen, item-level cancel approvals, and a club view that groups the same dish across orders for faster batch cooking.",
      icon: ComputerDesktopIcon,
    },
    {
      name: "The number you actually want",
      description:
        "Revenue, EBITDA, food cost, wastage and budget variance on one screen — today, not 40 days after the month closed.",
      icon: ChartPieIcon,
    },
  ];

  return (
    <div className="mx-auto mt-32 max-w-7xl sm:mt-40 sm:px-6 lg:px-8">
      <div className="relative isolate overflow-hidden rounded-[32px] bg-[#b10000] px-6 py-20 shadow-2xl sm:px-10 sm:py-24 lg:px-16 lg:py-24">
        <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-12 gap-y-16 lg:mx-0 lg:max-w-none lg:grid-cols-2 lg:items-center">
          <div className="lg:max-w-xl">
            <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-1 text-sm font-medium text-white backdrop-blur-sm">
              The owner dashboard
            </div>

            <h2 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl">
              One dashboard for the counter and the books
            </h2>

            <p className="mt-6 text-lg leading-8 text-red-100">
              A dropped connection should not stop a sale, and a closed month
              should not take six weeks to understand. DineInk keeps billing,
              your kitchen screens and your finances running from one place —
              built for how restaurants actually operate.
            </p>

            <div className="mt-10">
              <dl className="space-y-8 text-base text-red-100">
                {primaryFeatures.map((feature) => (
                  <div
                    key={feature.name}
                    className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm transition duration-300 hover:border-white/20 hover:bg-white/10"
                  >
                    <dt className="flex items-center gap-3 text-lg font-semibold text-white">
                      <feature.icon
                        aria-hidden="true"
                        className="size-6 text-red-200"
                      />
                      {feature.name}
                    </dt>
                    <dd className="mt-2 text-sm leading-7 text-red-100">
                      {feature.description}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -top-8 -left-8 h-40 w-40 rounded-full bg-white/5 blur-3xl" />
            <div className="absolute -right-8 -bottom-8 h-40 w-40 rounded-full bg-white/5 blur-3xl" />

            <img
              alt="DineInk owner dashboard"
              src={desktopAppScreen}
              width={640}
              height={314}
              className="relative -z-20 max-w-xl min-w-full rounded-xl shadow-2xl ring-2 ring-white/30 lg:row-span-4 lg:w-5xl lg:max-w-none"
            />
          </div>
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

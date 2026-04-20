import {
  Squares2X2Icon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";

const secondaryFeatures = [
  {
    name: 'Table Management',
    description:
      'Manage dine-in tables, occupancy, table merging and split billing with ease.',
    href: '#',
    icon: Squares2X2Icon,
  },
  {
    name: 'Menu & Categories',
    description:
      'Create categories, upload menu items, prices, images and availability instantly.',
    href: '#',
    icon: ClipboardDocumentListIcon,
  },
  {
    name: 'Billing & Reports',
    description:
      'Track daily sales, taxes, bills, payment methods and business performance.',
    href: '#',
    icon: ChartBarIcon,
  },
]

export default function WhyDineInkSection() {
  return (
    <div className="mx-auto mt-32 max-w-7xl px-6 sm:mt-56 lg:px-8">
      <div className="mx-auto max-w-2xl lg:text-center">
        <h2 className="text-base/7 font-semibold text-red-700">Why DineInk</h2>
        <p className="mt-2 text-4xl font-semibold tracking-tight text-pretty text-gray-900 sm:text-5xl lg:text-balance">
          Everything you need to run your restaurant
        </p>
        <p className="mt-6 text-lg/8 text-gray-600">
          DineInk helps restaurants manage billing, tables, menu items, kitchen flow,
          staff access, reports, taxes and customer orders from one easy-to-use platform.
        </p>
      </div>
      <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
        <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
          {secondaryFeatures.map((feature) => (
            <div key={feature.name} className="flex flex-col">
              <dt className="flex items-center gap-x-3 text-base/7 font-semibold text-gray-900">
                <feature.icon aria-hidden="true" className="size-5 flex-none text-red-700" />
                {feature.name}
              </dt>
              <dd className="mt-4 flex flex-auto flex-col text-base/7 text-gray-600">
                <p className="flex-auto">{feature.description}</p>
                <p className="mt-6">
                  <a href={feature.href} className="text-sm/6 font-semibold text-red-700 hover:text-red-400">
                    Learn more <span aria-hidden="true">→</span>
                  </a>
                </p>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
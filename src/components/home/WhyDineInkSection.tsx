import {
  CubeIcon,
  TagIcon,
  BanknotesIcon,
} from "@heroicons/react/24/outline";

const secondaryFeatures = [
  {
    name: "Ingredient-Level Inventory",
    description:
      "Every sale auto-deducts ingredients from stock using your recipes — unit-aware across kg, g, ml, tsp, tbsp and more — with low-stock alerts and vendor purchase tracking.",
    href: "#",
    icon: CubeIcon,
  },
  {
    name: "Flexible Billing & Discounts",
    description:
      "Split bills by person, accept tips, apply percentage, fixed or coupon-code discounts with manager approval, and recognize returning customers the moment they give their phone number.",
    href: "#",
    icon: TagIcon,
  },
  {
    name: "Per-Cashier Cash Drawers",
    description:
      "Each cashier opens their own drawer session with shift X/Z report printing and expected-vs-actual cash reconciliation — no shared, unaccountable cash boxes.",
    href: "#",
    icon: BanknotesIcon,
  },
];

export default function WhyDineInkSection() {
  return (
    <div className="mx-auto mt-32 max-w-7xl px-6 sm:mt-56 lg:px-8">
      <div className="mx-auto max-w-2xl lg:text-center">
        <h2 className="text-base/7 font-semibold text-[#b10000]">Why DineInk</h2>
        <p className="mt-2 text-4xl font-semibold tracking-tight text-pretty text-gray-900 sm:text-5xl lg:text-balance">
          Everything you need to run your restaurant
        </p>
        <p className="mt-6 text-lg/8 text-gray-600">
          Beyond billing and tables, DineInk tracks your stock down to the
          ingredient, manages cash drawers per cashier, and recognizes your
          regulars the moment they walk in.
        </p>
      </div>
      <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
        <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
          {secondaryFeatures.map((feature) => (
            <div key={feature.name} className="flex flex-col">
              <dt className="flex items-center gap-x-3 text-base/7 font-semibold text-gray-900">
                <feature.icon
                  aria-hidden="true"
                  className="size-5 flex-none text-[#b10000]"
                />
                {feature.name}
              </dt>
              <dd className="mt-4 flex flex-auto flex-col text-base/7 text-gray-600">
                <p className="flex-auto">{feature.description}</p>
                <p className="mt-6">
                  <a
                    href={feature.href}
                    className="text-sm/6 font-semibold text-[#b10000] hover:text-red-400"
                  >
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

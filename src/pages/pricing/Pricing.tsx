import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import { CheckIcon, XMarkIcon } from "@heroicons/react/20/solid";

const pricing = {
  tiers: [
    {
      id: "starter",
      name: "Starter",
      description: "Perfect for small restaurants and cafes.",
      price: { monthly: "Free", annually: "Free" },
      highlights: [
        "1 Branch",
        "Up to 5 Staff Accounts",
        "Basic Billing",
        "Menu Management",
        "Table Management",
      ],
      featured: false,
    },
    {
      id: "growth",
      name: "Growth",
      description: "Best for growing restaurants with more staff and orders.",
      price: { monthly: "₹499", annually: "₹4,999" },
      highlights: [
        "3 Branches",
        "Unlimited Staff Accounts",
        "Advanced Reports",
        "Kitchen Dashboard",
        "Tax & GST Support",
        "Priority Support",
      ],
      featured: true,
    },
    {
      id: "enterprise",
      name: "Enterprise",
      description: "For restaurant chains and franchises.",
      price: { monthly: "Custom", annually: "Custom" },
      highlights: [
        "Unlimited Branches",
        "Franchise Dashboard",
        "Advanced Analytics",
        "Dedicated Support",
        "Custom Integrations",
      ],
      featured: false,
    },
  ],
  sections: [
    {
      name: "Restaurant Features",
      features: [
        {
          name: "Branch Management",
          tiers: {
            Starter: "1",
            Growth: "3",
            Enterprise: "Unlimited",
          },
        },
        {
          name: "Staff Accounts",
          tiers: {
            Starter: "5",
            Growth: "Unlimited",
            Enterprise: "Unlimited",
          },
        },
        {
          name: "Menu Management",
          tiers: {
            Starter: true,
            Growth: true,
            Enterprise: true,
          },
        },
        {
          name: "Kitchen Dashboard",
          tiers: {
            Starter: false,
            Growth: true,
            Enterprise: true,
          },
        },
      ],
    },
    {
      name: "Reports & Billing",
      features: [
        {
          name: "Basic Billing",
          tiers: {
            Starter: true,
            Growth: true,
            Enterprise: true,
          },
        },
        {
          name: "Advanced Reports",
          tiers: {
            Starter: false,
            Growth: true,
            Enterprise: true,
          },
        },
        {
          name: "GST & Tax Support",
          tiers: {
            Starter: false,
            Growth: true,
            Enterprise: true,
          },
        },
        {
          name: "Analytics Dashboard",
          tiers: {
            Starter: false,
            Growth: false,
            Enterprise: true,
          },
        },
      ],
    },
  ],
};

const faqs = [
  {
    id: 1,
    question: "Can I use DineInk for multiple restaurant branches?",
    answer:
      "Yes. Growth and Enterprise plans support multiple branches and centralized management.",
  },
  {
    id: 2,
    question: "Does DineInk support GST and taxes?",
    answer:
      "Yes. DineInk supports GST calculation, tax configuration and tax reports.",
  },
  {
    id: 3,
    question: "Can I manage both dine-in and takeaway orders?",
    answer:
      "Yes. You can manage dine-in, takeaway and delivery orders from one dashboard.",
  },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default function Pricing() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="pt-24">
        <section className="relative overflow-hidden bg-gradient-to-br from-red-900 via-rose-900 to-slate-900 pb-20 pt-20">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-4xl text-center">
              <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl">
                Pricing that grows with your restaurant
              </h1>
              <p className="mt-6 text-lg leading-8 text-gray-300">
                Choose a plan that fits your restaurant size and operations.
              </p>
            </div>

            <div className="mt-16 grid gap-8 lg:grid-cols-3">
              {pricing.tiers.map((tier) => (
                <div
                  key={tier.id}
                  className={classNames(
                    tier.featured
                      ? "border-2 border-red-700 bg-white shadow-2xl scale-105"
                      : "border border-white/10 bg-white/5 backdrop-blur-sm",
                    "rounded-3xl p-8"
                  )}
                >
                  <h3
                    className={classNames(
                      tier.featured ? "text-gray-900" : "text-white",
                      "text-xl font-semibold"
                    )}
                  >
                    {tier.name}
                  </h3>

                  <p
                    className={classNames(
                      tier.featured ? "text-gray-600" : "text-gray-300",
                      "mt-3 text-sm"
                    )}
                  >
                    {tier.description}
                  </p>

                  <div className="mt-6">
                    <span
                      className={classNames(
                        tier.featured ? "text-red-700" : "text-white",
                        "text-5xl font-bold"
                      )}
                    >
                      {tier.price.annually}
                    </span>
                    <p
                      className={classNames(
                        tier.featured ? "text-gray-500" : "text-gray-400",
                        "mt-2 text-sm"
                      )}
                    >
                      Per year
                    </p>
                  </div>

                  <button
                    className={classNames(
                      tier.featured
                        ? "bg-red-700 text-white hover:bg-red-600"
                        : "bg-white/10 text-white hover:bg-white/20",
                      "mt-8 w-full rounded-xl px-4 py-3 text-sm font-semibold transition"
                    )}
                  >
                    Get Started
                  </button>

                  <ul className="mt-8 space-y-4">
                    {tier.highlights.map((feature) => (
                      <li
                        key={feature}
                        className={classNames(
                          tier.featured ? "text-gray-700" : "text-gray-300",
                          "flex items-center gap-3 text-sm"
                        )}
                      >
                        <CheckIcon className="h-5 w-5 text-red-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-gray-50 py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-4xl font-bold text-gray-900">
                Compare features
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                See which plan is best for your restaurant.
              </p>
            </div>

            <div className="mt-16 space-y-16">
              {pricing.sections.map((section) => (
                <div key={section.name}>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {section.name}
                  </h3>

                  <div className="mt-8 overflow-hidden rounded-3xl border border-red-100 bg-white shadow-lg">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-red-100 bg-red-50">
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                            Feature
                          </th>
                          {pricing.tiers.map((tier) => (
                            <th
                              key={tier.id}
                              className="px-6 py-4 text-center text-sm font-semibold text-gray-900"
                            >
                              {tier.name}
                            </th>
                          ))}
                        </tr>
                      </thead>

                      <tbody>
                        {section.features.map((feature) => (
                          <tr
                            key={feature.name}
                            className="border-b border-gray-100 last:border-none"
                          >
                            <td className="px-6 py-4 text-sm text-gray-700">
                              {feature.name}
                            </td>

                            {pricing.tiers.map((tier) => {
                              const tierValue =
                                feature.tiers[tier.name as keyof typeof feature.tiers];

                              return (
                                <td key={tier.id} className="px-6 py-4 text-center">
                                  {typeof tierValue === "string" ? (
                                    <span className="text-sm font-medium text-gray-900">
                                    {tierValue}
                                    </span>
                                  ) : tierValue ? (
                                    <CheckIcon className="mx-auto h-5 w-5 text-red-600" />
                                  ) : (
                                    <XMarkIcon className="mx-auto h-5 w-5 text-gray-400" />
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-4xl font-bold text-gray-900">
              Frequently asked questions
            </h2>
          </div>

          <div className="mt-16 divide-y divide-red-100 rounded-3xl border border-red-100 bg-white shadow-lg">
            {faqs.map((faq) => (
              <div key={faq.id} className="p-8">
                <h3 className="text-lg font-semibold text-gray-900">
                  {faq.question}
                </h3>
                <p className="mt-3 text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}


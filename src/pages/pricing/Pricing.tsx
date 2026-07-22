import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import { CheckIcon, XMarkIcon } from "@heroicons/react/20/solid";
import { QuestionMarkCircleIcon } from "@heroicons/react/24/outline";

const pricing = {
  tiers: [
    {
      id: "starter",
      name: "Starter",
      description: "Perfect for a single restaurant getting started.",
      price: { monthly: "Free", annually: "Free" },
      highlights: [
        "1 Branch",
        "Up to 5 Staff Accounts",
        "Dine-in, Takeaway & Quick Bill",
        "Table Floor Plan & Transfers",
        "Menu, Categories & Add-ons",
        "GST-Compliant Invoicing",
        "Offline-Ready Billing",
      ],
      featured: false,
    },
    {
      id: "growth",
      name: "Growth",
      description: "Best for growing restaurants with more staff and stock.",
      price: { monthly: "₹499", annually: "₹4,999" },
      highlights: [
        "3 Branches",
        "Unlimited Staff Accounts",
        "Live Kitchen Display",
        "Ingredient-Level Inventory & Vendor Tracking",
        "Per-Cashier Cash Drawers & Shift Reports",
        "Flexible Discounts, Coupons & Customer Recognition",
        "Advanced Analytics — RFM, Forecasting, Menu Engineering",
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
        "Branch & City Comparison Dashboards",
        "SOP Checklists Across Locations",
        "Dedicated Onboarding & Support",
        "Custom Integrations",
      ],
      featured: false,
    },
  ],
  sections: [
    {
      name: "Restaurant Operations",
      features: [
        {
          name: "Branch Management",
          tiers: { Starter: "1", Growth: "3", Enterprise: "Unlimited" },
        },
        {
          name: "Staff Accounts",
          tiers: { Starter: "5", Growth: "Unlimited", Enterprise: "Unlimited" },
        },
        {
          name: "Table & Order Management",
          tiers: { Starter: true, Growth: true, Enterprise: true },
        },
        {
          name: "Table Merge & Transfer",
          tiers: { Starter: true, Growth: true, Enterprise: true },
        },
        {
          name: "Menu Item Add-ons",
          tiers: { Starter: true, Growth: true, Enterprise: true },
        },
        {
          name: "Offline-Ready Billing",
          tiers: { Starter: true, Growth: true, Enterprise: true },
        },
        {
          name: "Live Kitchen Display",
          tiers: { Starter: false, Growth: true, Enterprise: true },
        },
        {
          name: "Kitchen Club View (Batch Cooking)",
          tiers: { Starter: false, Growth: true, Enterprise: true },
        },
        {
          name: "Item Cancel-Request Approval",
          tiers: { Starter: false, Growth: true, Enterprise: true },
        },
      ],
    },
    {
      name: "Billing & Payments",
      features: [
        {
          name: "GST-Compliant Invoicing",
          tiers: { Starter: true, Growth: true, Enterprise: true },
        },
        {
          name: "Multiple Payment Methods",
          tiers: { Starter: true, Growth: true, Enterprise: true },
        },
        {
          name: "Split Bill by Person",
          tiers: { Starter: true, Growth: true, Enterprise: true },
        },
        {
          name: "Tipping",
          tiers: { Starter: true, Growth: true, Enterprise: true },
        },
        {
          name: "Refunds & Voids (Manager-Gated)",
          tiers: { Starter: true, Growth: true, Enterprise: true },
        },
        {
          name: "Flexible Discounts & Coupons",
          tiers: { Starter: false, Growth: true, Enterprise: true },
        },
        {
          name: "Customer Recognition at Checkout",
          tiers: { Starter: false, Growth: true, Enterprise: true },
        },
      ],
    },
    {
      name: "Inventory & Cash",
      features: [
        {
          name: "Ingredient-Level Inventory",
          tiers: { Starter: false, Growth: true, Enterprise: true },
        },
        {
          name: "AI-Assisted Recipe Mapping",
          tiers: { Starter: false, Growth: true, Enterprise: true },
        },
        {
          name: "Daily Stock Audit & Wastage Tracking",
          tiers: { Starter: false, Growth: true, Enterprise: true },
        },
        {
          name: "Vendor & Purchase Tracking",
          tiers: { Starter: false, Growth: true, Enterprise: true },
        },
        {
          name: "Per-Cashier Cash Drawers & Shift Reports",
          tiers: { Starter: false, Growth: true, Enterprise: true },
        },
      ],
    },
    {
      name: "Staff & Operations",
      features: [
        {
          name: "Staff Attendance Tracking",
          tiers: { Starter: true, Growth: true, Enterprise: true },
        },
        {
          name: "Expense Tracking",
          tiers: { Starter: true, Growth: true, Enterprise: true },
        },
        {
          name: "Staff Productivity Analytics",
          tiers: { Starter: false, Growth: true, Enterprise: true },
        },
        {
          name: "SOP Checklists Across Locations",
          tiers: { Starter: false, Growth: false, Enterprise: true },
        },
      ],
    },
    {
      name: "Reports & Analytics",
      features: [
        {
          name: "Basic Sales Reports",
          tiers: { Starter: true, Growth: true, Enterprise: true },
        },
        {
          name: "Expense Reports",
          tiers: { Starter: true, Growth: true, Enterprise: true },
        },
        {
          name: "GST Filing Reports",
          tiers: { Starter: false, Growth: true, Enterprise: true },
        },
        {
          name: "Hourly Sales Heatmap",
          tiers: { Starter: false, Growth: true, Enterprise: true },
        },
        {
          name: "Advanced Analytics — RFM, Forecasting, Menu Engineering",
          tiers: { Starter: false, Growth: true, Enterprise: true },
        },
        {
          name: "Branch & City Comparison",
          tiers: { Starter: false, Growth: false, Enterprise: true },
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
      "Yes. Growth supports up to 3 branches, and Enterprise supports unlimited branches with cross-branch and cross-city comparison dashboards.",
  },
  {
    id: 2,
    question: "Does DineInk work without internet?",
    answer:
      "Yes — billing keeps working with zero connectivity. Orders and bills queue locally on the device and sync automatically once you're back online, with real GST invoice numbers assigned at that point.",
  },
  {
    id: 3,
    question: "Does DineInk support GST and taxes?",
    answer:
      "Yes. Every bill gets a sequential, financial-year-based GST invoice number, with configurable tax rates and GST filing reports.",
  },
  {
    id: 4,
    question: "Can I manage both dine-in and takeaway orders?",
    answer:
      "Yes. Dine-in tables, takeaway and quick-bill orders are all handled from one checkout, with the order type picked right before the bill is generated.",
  },
  {
    id: 5,
    question: "Is there a free trial available?",
    answer:
      "Yes. You can start with our Starter plan completely free — no credit card required.",
  },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default function Pricing() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />
      <main className="pt-24">
        {/* Hero */}
        <section className="relative overflow-hidden bg-[#b10000] pb-24 pt-16">
          <svg
            aria-hidden="true"
            className="absolute inset-0 -z-10 size-full stroke-white/10 [mask-image:radial-gradient(100%_100%_at_top_right,white,transparent)]"
          >
            <defs>
              <pattern
                x="50%"
                y={-1}
                id="pricing-grid"
                width={200}
                height={200}
                patternUnits="userSpaceOnUse"
              >
                <path d="M100 200V.5M.5 .5H200" fill="none" />
              </pattern>
            </defs>
            <rect fill="url(#pricing-grid)" width="100%" height="100%" strokeWidth={0} />
          </svg>
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-4xl text-center">
              <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-1 text-sm font-medium text-white backdrop-blur-sm">
                Simple, transparent pricing
              </div>
              <h1 className="mt-6 text-5xl font-bold tracking-tight text-white sm:text-6xl">
                Pricing that grows with your restaurant
              </h1>
              <p className="mt-6 text-lg leading-8 text-red-100">
                Choose a plan that fits your restaurant size and operations.
                Start free, upgrade when you're ready.
              </p>
            </div>

            <div className="mt-16 grid gap-8 lg:grid-cols-3">
              {pricing.tiers.map((tier) => (
                <div
                  key={tier.id}
                  className={classNames(
                    tier.featured
                      ? "border-2 border-white bg-white shadow-2xl scale-105"
                      : "border border-white/10 bg-white/5 backdrop-blur-sm",
                    "rounded-3xl p-8 transition",
                  )}
                >
                  {tier.featured && (
                    <div className="mb-4 inline-flex items-center rounded-full bg-red-50 border border-red-100 px-3 py-1 text-xs font-semibold text-[#b10000]">
                      Most Popular
                    </div>
                  )}
                  <h3
                    className={classNames(
                      tier.featured ? "text-slate-900" : "text-white",
                      "text-xl font-semibold",
                    )}
                  >
                    {tier.name}
                  </h3>
                  <p
                    className={classNames(
                      tier.featured ? "text-slate-600" : "text-red-100",
                      "mt-3 text-sm",
                    )}
                  >
                    {tier.description}
                  </p>
                  <div className="mt-6">
                    <span
                      className={classNames(
                        tier.featured ? "text-[#b10000]" : "text-white",
                        "text-5xl font-bold",
                      )}
                    >
                      {tier.price.annually}
                    </span>
                    {tier.price.annually !== "Free" &&
                      tier.price.annually !== "Custom" && (
                        <span
                          className={classNames(
                            tier.featured ? "text-slate-500" : "text-red-200",
                            "ml-2 text-sm",
                          )}
                        >
                          /year
                        </span>
                      )}
                    <p
                      className={classNames(
                        tier.featured ? "text-slate-500" : "text-red-200",
                        "mt-2 text-xs",
                      )}
                    >
                      {tier.price.annually === "Free"
                        ? "No credit card required"
                        : tier.price.annually === "Custom"
                          ? "Contact us for a quote"
                          : `₹${parseInt(tier.price.monthly.replace("₹", "").replace(",", ""))}/month billed monthly`}
                    </p>
                  </div>
                  <a
                    href={tier.id === "enterprise" ? "/contact" : "/signup"}
                    className={classNames(
                      tier.featured
                        ? "bg-[#b10000] text-white shadow-lg shadow-red-200 hover:bg-[#8f0000]"
                        : "bg-white/10 text-white hover:bg-white/20",
                      "mt-8 block w-full rounded-xl px-4 py-3 text-center text-sm font-semibold transition",
                    )}
                  >
                    {tier.id === "enterprise" ? "Contact Sales" : "Get Started"}
                  </a>
                  <ul className="mt-8 space-y-4">
                    {tier.highlights.map((feature) => (
                      <li
                        key={feature}
                        className={classNames(
                          tier.featured ? "text-slate-700" : "text-red-100",
                          "flex items-center gap-3 text-sm",
                        )}
                      >
                        <CheckIcon
                          className={classNames(
                            tier.featured ? "text-[#b10000]" : "text-red-200",
                            "h-5 w-5 shrink-0",
                          )}
                        />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Compare features */}
        <section className="py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center rounded-full border border-red-100 bg-red-50 px-4 py-1 text-sm font-medium text-[#b10000]">
                Feature comparison
              </div>
              <h2 className="mt-6 text-4xl font-bold tracking-tight text-slate-900">
                Compare plans
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                See which plan is best for your restaurant.
              </p>
            </div>
            <div className="mt-16 space-y-12">
              {pricing.sections.map((section) => (
                <div key={section.name}>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">
                    {section.name}
                  </h3>
                  <div className="overflow-hidden rounded-3xl border border-red-100 bg-white shadow-sm">
                    <table className="w-full table-fixed border-collapse">
                      <colgroup>
                        <col className="w-[40%]" />
                        {pricing.tiers.map((tier) => (
                          <col key={tier.id} className="w-[20%]" />
                        ))}
                      </colgroup>
                      <thead>
                        <tr className="border-b border-red-100 bg-red-50">
                          <th className="px-6 py-4 text-left text-sm font-semibold text-[#b10000]">
                            Feature
                          </th>
                          {pricing.tiers.map((tier) => (
                            <th
                              key={tier.id}
                              className="px-6 py-4 text-center text-sm font-semibold text-[#b10000]"
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
                            className="border-b border-slate-100 last:border-none hover:bg-slate-50/50"
                          >
                            <td className="px-6 py-4 text-sm text-slate-700">
                              {feature.name}
                            </td>
                            {pricing.tiers.map((tier) => {
                              const tierValue =
                                feature.tiers[
                                  tier.name as keyof typeof feature.tiers
                                ];
                              return (
                                <td key={tier.id} className="px-6 py-4 text-center">
                                  {typeof tierValue === "string" ? (
                                    <span className="text-sm font-medium text-slate-900">
                                      {tierValue}
                                    </span>
                                  ) : tierValue ? (
                                    <CheckIcon className="mx-auto h-5 w-5 text-[#b10000]" />
                                  ) : (
                                    <XMarkIcon className="mx-auto h-5 w-5 text-slate-300" />
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

        {/* FAQ */}
        <section className="bg-white py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center rounded-full border border-red-100 bg-red-50 px-4 py-1 text-sm font-medium text-[#b10000]">
                FAQ
              </div>
              <h2 className="mt-6 text-4xl font-bold tracking-tight text-slate-900">
                Frequently asked questions
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Still have questions? Reach out to our team.
              </p>
            </div>
            <div className="mx-auto mt-12 max-w-3xl divide-y divide-red-100 rounded-3xl border border-red-100 bg-white shadow-sm overflow-hidden">
              {faqs.map((faq) => (
                <div key={faq.id} className="p-8 hover:bg-red-50 transition">
                  <div className="flex items-start gap-4">
                    <div className="flex-none mt-0.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-50 border border-red-100">
                        <QuestionMarkCircleIcon className="h-5 w-5 text-[#b10000]" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">
                        {faq.question}
                      </h3>
                      <p className="mt-3 text-sm leading-7 text-slate-600">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-10 text-center">
              <a
                href="/contact"
                className="inline-flex items-center rounded-xl border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-[#b10000]"
              >
                Still have questions? Contact us →
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

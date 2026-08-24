import { Link } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import { CheckIcon, XMarkIcon } from "@heroicons/react/20/solid";
import { QuestionMarkCircleIcon } from "@heroicons/react/24/outline";

/**
 * Tier names here are used as the keys in `pricing.sections[].features[].tiers`.
 * Keep the two in sync when adding a tier.
 */
const pricing = {
  tiers: [
    {
      id: "dot",
      name: "DOT",
      productName: "DineInk DOT",
      badge: "Launching soon",
      description:
        "A standalone mobile app for street vendors, tea stalls and single counters. No terminal, no printer, no training.",
      price: "₹4,999",
      period: "/year",
      note: "Launching soon — get notified",
      cta: { label: "Join the DOT waitlist", to: "/contact" },
      highlights: [
        "Runs entirely on a phone",
        "GST-compliant billing",
        "Works without a steady connection",
        "Daily sales and collection summary",
        "UPI with generated QR",
      ],
      featured: false,
    },
    {
      id: "professional",
      name: "Professional",
      productName: "DineInk Professional",
      badge: "Most restaurants start here",
      description:
        "The full platform for one restaurant — DineInk POS at the counter, the owner dashboard for the business.",
      price: "₹9,999",
      period: "/year",
      note: "Free to start — no credit card",
      cta: { label: "Start free", to: "/signup" },
      highlights: [
        "Everything in the POS — tables, kitchen, menu",
        "Ingredient-level inventory and stock audit",
        "Financial statements, budget vs actual, EBITDA",
        "Forecasting, scenarios and investment analysis",
        "Attendance, payroll and labour capacity",
        "Procurement price intelligence",
        "Unlimited staff accounts",
      ],
      featured: true,
    },
    {
      id: "enterprise",
      name: "Enterprise",
      productName: "DineInk Enterprise",
      badge: "",
      description:
        "For chains and franchises. Everything in Professional, plus consolidation across outlets — and every extra outlet is ₹20,000 a year, not another ₹34,999.",
      price: "₹34,999",
      period: "/year, first outlet",
      note: "+ ₹20,000 / year per additional outlet",
      cta: { label: "Talk to us", to: "/contact" },
      highlights: [
        "Everything in Professional, at every outlet",
        "₹20,000 a year for each additional outlet",
        "Branch and city comparison dashboards",
        "Consolidated multi-outlet reporting",
        "Franchise royalty and revenue-share rent models",
        "Dedicated onboarding and support",
      ],
      featured: false,
    },
  ],
  sections: [
    {
      name: "Billing and the counter",
      features: [
        {
          name: "GST-compliant invoicing (FY-sequential)",
          tiers: { DOT: true, Professional: true, Enterprise: true },
        },
        {
          name: "Offline-first billing with auto-sync",
          tiers: { DOT: true, Professional: true, Enterprise: true },
        },
        {
          name: "Standalone mobile app — no terminal needed",
          tiers: { DOT: true, Professional: false, Enterprise: false },
        },
        {
          name: "Dine-in tables, floor plan, merge and transfer",
          tiers: { DOT: false, Professional: true, Enterprise: true },
        },
        {
          name: "Takeaway and quick-bill counters",
          tiers: { DOT: true, Professional: true, Enterprise: true },
        },
        {
          name: "Split bills, tips and manager-gated refunds",
          tiers: { DOT: false, Professional: true, Enterprise: true },
        },
        {
          name: "Discounts, coupons and customer recognition",
          tiers: { DOT: false, Professional: true, Enterprise: true },
        },
        {
          name: "Native UPI with generated QR",
          tiers: { DOT: true, Professional: true, Enterprise: true },
        },
      ],
    },
    {
      name: "Kitchen and inventory",
      features: [
        {
          name: "Live kitchen display with club view",
          tiers: { DOT: false, Professional: true, Enterprise: true },
        },
        {
          name: "Menu and recipe management",
          tiers: { DOT: "Basic", Professional: true, Enterprise: true },
        },
        {
          name: "Ingredient-level inventory auto-deduction",
          tiers: { DOT: false, Professional: true, Enterprise: true },
        },
        {
          name: "Daily stock audit and wastage tracking",
          tiers: { DOT: false, Professional: true, Enterprise: true },
        },
        {
          name: "Vendors, purchases and reorder",
          tiers: { DOT: false, Professional: true, Enterprise: true },
        },
        {
          name: "Procurement price intelligence",
          tiers: { DOT: false, Professional: true, Enterprise: true },
        },
        {
          name: "Equipment and asset register",
          tiers: { DOT: false, Professional: true, Enterprise: true },
        },
      ],
    },
    {
      name: "Closing the books",
      features: [
        {
          name: "Daily sales and collection summary",
          tiers: { DOT: true, Professional: true, Enterprise: true },
        },
        {
          name: "Financial statements",
          tiers: { DOT: false, Professional: "6 types", Enterprise: "6 types" },
        },
        {
          name: "Budget vs actual variance",
          tiers: {
            DOT: false,
            Professional: "25 lines",
            Enterprise: "25 lines",
          },
        },
        {
          name: "Dues tracking, payment calendar and EBITDA",
          tiers: { DOT: false, Professional: true, Enterprise: true },
        },
        {
          name: "Bank accounts, transactions and reconciliation",
          tiers: { DOT: false, Professional: true, Enterprise: true },
        },
        {
          name: "Cash flow predictor",
          tiers: { DOT: false, Professional: true, Enterprise: true },
        },
        {
          name: "Compliance tracking — FSSAI, GST, fire, pest",
          tiers: { DOT: false, Professional: true, Enterprise: true },
        },
        {
          name: "Cash sessions per cashier with X/Z reports",
          tiers: { DOT: false, Professional: true, Enterprise: true },
        },
      ],
    },
    {
      name: "Planning and analytics",
      features: [
        {
          name: "Revenue forecasting",
          tiers: {
            DOT: false,
            Professional: "345 combos",
            Enterprise: "345 combos",
          },
        },
        {
          name: "Forecast accuracy scoring",
          tiers: { DOT: false, Professional: true, Enterprise: true },
        },
        {
          name: "Scenario what-if modelling",
          tiers: {
            DOT: false,
            Professional: "20 levers",
            Enterprise: "20 levers",
          },
        },
        {
          name: "Investment analysis — ROI, NPV, IRR, payback",
          tiers: { DOT: false, Professional: true, Enterprise: true },
        },
        {
          name: "Executive scorecards",
          tiers: { DOT: false, Professional: true, Enterprise: true },
        },
        {
          name: "AI financial advisor",
          tiers: { DOT: false, Professional: true, Enterprise: true },
        },
        {
          name: "Labour and capacity modelling",
          tiers: { DOT: false, Professional: true, Enterprise: true },
        },
        {
          name: "Branch and city comparison",
          tiers: { DOT: false, Professional: false, Enterprise: true },
        },
        {
          name: "Consolidated multi-outlet reporting",
          tiers: { DOT: false, Professional: false, Enterprise: true },
        },
      ],
    },
    {
      name: "People, scale and support",
      features: [
        {
          name: "Outlets included",
          tiers: {
            DOT: "1",
            Professional: "1",
            Enterprise: "1, then ₹20,000 each",
          },
        },
        {
          name: "Staff accounts",
          tiers: { DOT: "1", Professional: "Unlimited", Enterprise: "Unlimited" },
        },
        {
          name: "Role-based access — owner, manager, cashier, kitchen",
          tiers: { DOT: false, Professional: true, Enterprise: true },
        },
        {
          name: "Attendance, leave and payroll processing",
          tiers: { DOT: false, Professional: true, Enterprise: true },
        },
        {
          name: "WhatsApp marketing, e-bills and vendor reorder",
          tiers: { DOT: false, Professional: true, Enterprise: true },
        },
        {
          name: "Excel and PDF exports",
          tiers: {
            DOT: false,
            Professional: "27 sheets",
            Enterprise: "27 sheets",
          },
        },
        {
          name: "Support",
          tiers: {
            DOT: "Email",
            Professional: "Priority",
            Enterprise: "Dedicated onboarding",
          },
        },
      ],
    },
  ],
};

const faqs = [
  {
    id: 1,
    question: "What is the difference between DineInk DOT and the other plans?",
    answer:
      "DOT is a separate mobile application built for the unorganised sector — street vendors, tea stalls and single counters that need fast, compliant billing on a phone and nothing else. Professional and Enterprise are for the organised sector: they pair DineInk POS at the counter with the owner dashboard, which is where inventory, the financial statements and the planning tools live.",
  },
  {
    id: 2,
    question: "Does DineInk work without internet?",
    answer:
      "Yes. Billing keeps working with zero connectivity — orders and bills queue locally on the device and sync automatically once you are back online, with real sequential GST invoice numbers assigned at that point.",
  },
  {
    id: 3,
    question: "How does Enterprise pricing work across several outlets?",
    answer:
      "Your first outlet is ₹34,999 a year and every additional outlet is ₹20,000 a year. So a three-outlet chain is ₹34,999 + ₹20,000 + ₹20,000 = ₹74,999 a year, and opening a fourth simply adds another ₹20,000 — no renegotiation and no new quote. Consolidated reporting across all of your outlets is included.",
  },
  {
    id: 4,
    question: "Is there really no sales call?",
    answer:
      "For DOT and Professional, no. Pricing is published on this page and you can create an account and start using the product without speaking to anyone. Enterprise involves a conversation because multi-outlet setup and data migration genuinely need one — but the price is still published, so you know it before you talk to us.",
  },
  {
    id: 5,
    question: "How do I pay for a plan?",
    answer:
      "Online checkout is not live yet — we are still completing payment-gateway integration. Until it is, get in touch and we will activate your plan and raise the invoice directly. Creating an account and using the free tier needs nothing from us at all.",
  },
  {
    id: 6,
    question: "What happens when the free tier ends?",
    answer:
      "Nothing is deleted. Your data stays and billing keeps working; the finance and planning modules are what move behind the subscription. Those modules only become useful once real data is in the system, which is exactly why we let you get there for free first.",
  },
  {
    id: 7,
    question: "Do you handle GST filing?",
    answer:
      "DineInk produces GST-compliant invoices with a CGST/SGST split, FY-sequential numbering and the filing reports your accountant needs, and it tracks filing due dates. It does not file returns on your behalf.",
  },
  {
    id: 8,
    question: "Can I move from Professional to Enterprise later?",
    answer:
      "Yes. Professional is the full single-restaurant product, so moving to Enterprise adds outlets, consolidation and branch comparison rather than changing how you work. Your existing data carries over.",
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
        {/* Hero + tiers */}
        <section className="relative overflow-hidden bg-[#b10000] pt-16 pb-24">
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
            <rect
              fill="url(#pricing-grid)"
              width="100%"
              height="100%"
              strokeWidth={0}
            />
          </svg>
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-4xl text-center">
              <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-1 text-sm font-medium text-white backdrop-blur-sm">
                Published pricing · billed annually
              </div>
              <h1 className="mt-6 text-5xl font-bold tracking-tight text-white sm:text-6xl">
                You can read our prices without calling anyone
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-red-100">
                Three plans across two products — one for the counter you run on
                a phone, two for the restaurant you run on a floor. Every price
                on this page is the price.
              </p>
            </div>

            <div className="mt-16 grid items-start gap-8 lg:grid-cols-3">
              {pricing.tiers.map((tier) => (
                <div
                  key={tier.id}
                  className={classNames(
                    tier.featured
                      ? "border-2 border-white bg-white shadow-2xl lg:scale-105"
                      : "border border-white/10 bg-white/5 backdrop-blur-sm",
                    "flex h-full flex-col rounded-3xl p-8 transition",
                  )}
                >
                  {tier.badge ? (
                    <div
                      className={classNames(
                        tier.featured
                          ? "border-red-100 bg-red-50 text-[#b10000]"
                          : "border-white/25 bg-white/10 text-white",
                        "mb-4 inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-semibold",
                      )}
                    >
                      {tier.badge}
                    </div>
                  ) : null}

                  <h3
                    className={classNames(
                      tier.featured ? "text-slate-900" : "text-white",
                      "text-xl font-semibold",
                    )}
                  >
                    {tier.productName}
                  </h3>
                  <p
                    className={classNames(
                      tier.featured ? "text-slate-600" : "text-red-100",
                      "mt-3 text-sm leading-6",
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
                      {tier.price}
                    </span>
                    <span
                      className={classNames(
                        tier.featured ? "text-slate-500" : "text-red-200",
                        "ml-2 text-sm",
                      )}
                    >
                      {tier.period}
                    </span>
                    <p
                      className={classNames(
                        tier.featured ? "text-slate-500" : "text-red-200",
                        "mt-2 text-xs",
                      )}
                    >
                      {tier.note}
                    </p>
                  </div>

                  <Link
                    to={tier.cta.to}
                    className={classNames(
                      tier.featured
                        ? "bg-[#b10000] text-white shadow-lg shadow-red-200 hover:bg-[#8f0000]"
                        : "bg-white/10 text-white hover:bg-white/20",
                      "mt-8 block w-full rounded-xl px-4 py-3 text-center text-sm font-semibold transition",
                    )}
                  >
                    {tier.cta.label}
                  </Link>

                  <ul className="mt-8 space-y-4">
                    {tier.highlights.map((feature) => (
                      <li
                        key={feature}
                        className={classNames(
                          tier.featured ? "text-slate-700" : "text-red-100",
                          "flex items-start gap-3 text-sm leading-6",
                        )}
                      >
                        <CheckIcon
                          className={classNames(
                            tier.featured ? "text-[#b10000]" : "text-red-200",
                            "mt-0.5 h-5 w-5 shrink-0",
                          )}
                        />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <p className="mx-auto mt-12 max-w-3xl text-center text-sm text-red-100">
              Prices are exclusive of GST. Annual billing keeps our cost of sale
              near zero, which is the reason these numbers are what they are.
            </p>
          </div>
        </section>

        {/* Comparison */}
        <section className="py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center rounded-full border border-red-100 bg-red-50 px-4 py-1 text-sm font-medium text-[#b10000]">
                Full comparison
              </div>
              <h2 className="mt-6 text-4xl font-bold tracking-tight text-slate-900">
                Exactly what each plan includes
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                DOT is a different product for a different customer, so it is
                deliberately narrow. Professional is the whole platform.
              </p>
            </div>

            <div className="mt-16 space-y-12">
              {pricing.sections.map((section) => (
                <div key={section.name}>
                  <h3 className="mb-4 text-lg font-semibold text-slate-900">
                    {section.name}
                  </h3>
                  <div className="overflow-x-auto rounded-3xl border border-red-100 bg-white shadow-sm">
                    <table className="w-full min-w-[40rem] table-fixed border-collapse">
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
                                <td
                                  key={tier.id}
                                  className="px-6 py-4 text-center"
                                >
                                  {typeof tierValue === "string" ? (
                                    <span className="text-sm font-medium text-slate-900">
                                      {tierValue}
                                    </span>
                                  ) : tierValue ? (
                                    <CheckIcon
                                      aria-label="Included"
                                      className="mx-auto h-5 w-5 text-[#b10000]"
                                    />
                                  ) : (
                                    <XMarkIcon
                                      aria-label="Not included"
                                      className="mx-auto h-5 w-5 text-slate-300"
                                    />
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
                Questions owners actually ask
              </h2>
            </div>
            <div className="mx-auto mt-12 max-w-3xl divide-y divide-red-100 overflow-hidden rounded-3xl border border-red-100 bg-white shadow-sm">
              {faqs.map((faq) => (
                <div key={faq.id} className="p-8 transition hover:bg-red-50">
                  <div className="flex items-start gap-4">
                    <div className="mt-0.5 flex-none">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-red-100 bg-red-50">
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
              <Link
                to="/contact"
                className="inline-flex items-center rounded-xl border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-[#b10000]"
              >
                Still have questions? Contact us →
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

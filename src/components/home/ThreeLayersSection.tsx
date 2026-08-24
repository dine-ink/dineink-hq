import { Link } from "react-router-dom";
import {
  BuildingStorefrontIcon,
  DocumentChartBarIcon,
  PresentationChartLineIcon,
} from "@heroicons/react/24/outline";

const layers = [
  {
    name: "Run the restaurant",
    tagline: "The daily operation, done properly",
    icon: BuildingStorefrontIcon,
    items: [
      "Billing — offline-first, GST-compliant",
      "Kitchen display with club view",
      "Menu & recipes",
      "Inventory & daily stock audit",
      "Vendors & procurement",
      "Attendance & payroll",
      "Cash sessions per cashier",
    ],
    emphasis: false,
  },
  {
    name: "Close the books",
    tagline: "The layer no other POS ships",
    icon: DocumentChartBarIcon,
    items: [
      "Financial statements — 6 types",
      "Budget vs actual, 25 line items",
      "Dues tracking & EBITDA",
      "Banking, UPI & reconciliation",
      "Compliance — FSSAI, GST",
      "Cash flow predictor",
      "Equipment & assets",
    ],
    emphasis: true,
  },
  {
    name: "Decide what's next",
    tagline: "Tools you plan with, not just report on",
    icon: PresentationChartLineIcon,
    items: [
      "Forecasting — 345 combinations",
      "Scenario what-if, 20 levers",
      "Investment ROI / NPV / IRR",
      "Executive scorecards",
      "AI financial advisor",
      "Labour & capacity model",
      "Branch & city comparison",
    ],
    emphasis: true,
  },
];

export default function ThreeLayersSection() {
  return (
    <section className="mx-auto mt-32 max-w-7xl px-6 sm:mt-40 lg:px-8">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-base font-semibold text-[#b10000]">
          What is in the box
        </h2>
        <p className="mt-3 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          29 modules, three layers
        </p>
        <p className="mt-6 text-lg leading-8 text-slate-600">
          Most restaurant software stops at the counter. DineInk keeps going —
          through the books, and into the decisions you have to make next month.
        </p>
      </div>

      <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {layers.map((layer) => (
          <div
            key={layer.name}
            className={`flex flex-col rounded-3xl p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${
              layer.emphasis
                ? "border-2 border-red-200 bg-white"
                : "border border-slate-200 bg-white"
            }`}
          >
            <div
              className={`inline-flex w-fit rounded-2xl p-3.5 ${
                layer.emphasis
                  ? "bg-[#b10000] text-white"
                  : "bg-red-50 text-[#b10000]"
              }`}
            >
              <layer.icon aria-hidden="true" className="h-6 w-6" />
            </div>
            <h3 className="mt-6 text-xl font-semibold text-slate-900">
              {layer.name}
            </h3>
            <p className="mt-2 text-sm font-medium text-[#b10000]">
              {layer.tagline}
            </p>
            <ul className="mt-6 flex-auto space-y-3">
              {layer.items.map((item) => (
                <li
                  key={item}
                  className="flex gap-3 text-sm leading-6 text-slate-600"
                >
                  <span
                    aria-hidden="true"
                    className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-red-300"
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <Link
          to="/features"
          className="inline-flex items-center rounded-xl border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-[#b10000]"
        >
          See everything in detail →
        </Link>
      </div>
    </section>
  );
}

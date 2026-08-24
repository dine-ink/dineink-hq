import { Link } from "react-router-dom";
import {
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
} from "@heroicons/react/24/outline";

const products = [
  {
    id: "dot",
    eyebrow: "For the unorganised half",
    name: "DineInk DOT",
    kind: "A standalone mobile app",
    description:
      "Street vendors, tea stalls and single-counter shops. Billing and day-book on a phone — no terminal, no printer, no training. The half of the market nobody else sells software to.",
    badge: "Launching soon",
    points: [
      "Runs entirely on a phone",
      "Bill, collect and close the day in minutes",
      "Works without a steady connection",
      "₹4,999 / year",
    ],
    icon: DevicePhoneMobileIcon,
  },
  {
    id: "organised",
    eyebrow: "For the organised half",
    name: "DineInk POS + Owner Dashboard",
    kind: "Two apps, one platform",
    description:
      "Cafés, restaurants, cloud kitchens and chains. DineInk POS runs the counter and the kitchen; the Owner Dashboard runs the business — the books, the forecasts and the decisions.",
    badge: "Available today",
    points: [
      "POS for billing, tables and kitchen",
      "Owner dashboard for finance and analytics",
      "Professional — ₹9,999 / year, one restaurant",
      "Enterprise — ₹34,999 / year, then ₹20,000 per extra outlet",
    ],
    icon: ComputerDesktopIcon,
  },
];

export default function ProductSplitSection() {
  return (
    <section className="mx-auto mt-32 max-w-7xl px-6 sm:mt-40 lg:px-8">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-base font-semibold text-[#b10000]">
          Two products
        </h2>
        <p className="mt-3 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Two halves of one market. We built for both.
        </p>
        <p className="mt-6 text-lg leading-8 text-slate-600">
          Roughly half of India's food service value sits outside the organised
          sector — vendors and counters that have never been sold software. One
          product family covers a street cart and a twenty-outlet chain.
        </p>
      </div>

      <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-2">
        {products.map((product) => (
          <div
            key={product.id}
            className="flex flex-col overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm transition hover:shadow-xl"
          >
            <div className="border-b border-slate-100 bg-gradient-to-br from-red-50 via-white to-rose-50 p-8">
              <div className="flex items-center gap-4">
                <div className="inline-flex rounded-2xl bg-[#b10000] p-3.5 text-white">
                  <product.icon aria-hidden="true" className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-xs font-semibold tracking-widest text-[#b10000] uppercase">
                    {product.eyebrow}
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">
                    {product.name}
                  </h3>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <p className="text-sm font-semibold text-slate-500">
                  {product.kind}
                </p>
                <span className="rounded-full border border-red-200 bg-white px-3 py-1 text-xs font-semibold text-[#b10000]">
                  {product.badge}
                </span>
              </div>
            </div>

            <div className="flex flex-auto flex-col p-8">
              <p className="text-base leading-7 text-slate-600">
                {product.description}
              </p>
              <ul className="mt-6 flex-auto space-y-3">
                {product.points.map((point) => (
                  <li
                    key={point}
                    className="flex gap-3 text-sm leading-6 text-slate-700"
                  >
                    <span
                      aria-hidden="true"
                      className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#b10000]"
                    />
                    {point}
                  </li>
                ))}
              </ul>
              <Link
                to="/pricing"
                className="mt-8 inline-flex w-fit items-center rounded-xl bg-[#b10000] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#8f0000]"
              >
                View plans →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

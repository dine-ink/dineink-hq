const differentiators = [
  {
    id: "01",
    name: "The CFO layer lives inside the POS",
    description:
      "Six statement types, budget-vs-actual across 25 line items, ROI / NPV / IRR on a new outlet, and a cash-flow predictor that weighs vendor dues, EMIs and payroll against expected inflow. Not exports for your accountant — screens you open yourself.",
    detail: "6 statement types · 25 budget lines · NPV, IRR, payback",
  },
  {
    id: "02",
    name: "Analytics that grade themselves",
    description:
      "Forecast Accuracy scores every prediction we made against what actually happened. Labour Calibration measures observed throughput instead of assuming it. Stock Lifecycle shows the unaccounted residual rather than burying it in shrinkage.",
    detail: "We will show you how wrong our last forecast was",
  },
  {
    id: "03",
    name: "Your kitchen, modelled as a constrained system",
    description:
      "Station throughput ceilings, per-item labour standards, a skill matrix and equipment linkage — resolving to a verdict per station: equipment bound, short of staff, nobody trained, or balanced. Add two people to the tandoor and output will not move if the tandoor was the constraint.",
    detail: "Labour is the second-largest cost line, and the worst managed",
  },
  {
    id: "04",
    name: "We tell you when you are overpaying for paneer",
    description:
      "A signed browser extension reads live ingredient pricing from supplier platforms and syncs it into DineInk, so purchase decisions are made against today's market rate — on the largest controllable cost line in a restaurant.",
    detail: "Live price comparison across 3 supplier platforms",
  },
  {
    id: "05",
    name: "Built for India, not translated into it",
    description:
      "FY-sequential GST invoice numbering with CGST/SGST split. Rent as per-sq-ft plus CAM, escalation and revenue-share. Aggregator commission as a scenario lever. FSSAI, fire safety and pest control expiry tracking. Native UPI with generated QR. WhatsApp as a first-class channel.",
    detail: "GST · rent models · aggregators · FSSAI · UPI · WhatsApp",
  },
];

export default function WhyDineInkSection() {
  return (
    <section className="mx-auto mt-32 max-w-7xl px-6 sm:mt-40 lg:px-8">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-base font-semibold text-[#b10000]">
          Why DineInk
        </h2>
        <p className="mt-3 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Five things a POS has never done for you
        </p>
        <p className="mt-6 text-lg leading-8 text-slate-600">
          Report counts are not a differentiator, and we will not pretend they
          are. These are.
        </p>
      </div>

      <div className="mx-auto mt-16 max-w-5xl space-y-6">
        {differentiators.map((item) => (
          <div
            key={item.id}
            className="group rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition hover:border-red-200 hover:shadow-xl sm:p-10"
          >
            <div className="flex flex-col gap-6 sm:flex-row sm:gap-10">
              <div className="shrink-0">
                <span className="text-4xl font-bold text-red-200 transition group-hover:text-[#b10000]">
                  {item.id}
                </span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-900 sm:text-2xl">
                  {item.name}
                </h3>
                <p className="mt-4 text-base leading-7 text-slate-600">
                  {item.description}
                </p>
                <p className="mt-5 text-sm font-medium text-[#b10000]">
                  {item.detail}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

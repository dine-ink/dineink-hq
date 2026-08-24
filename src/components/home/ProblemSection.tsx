const stack = [
  {
    tool: "A POS",
    does: "Counts orders",
    missing: "Never tells you the margin on them",
  },
  {
    tool: "Delivery middleware",
    does: "Counts aggregator orders",
    missing: "Commission and packaging land somewhere else",
  },
  {
    tool: "Tally",
    does: "Books entries",
    missing: "Weeks after the month has closed",
  },
  {
    tool: "Excel and a CA",
    does: "Everything else",
    missing: "One person, one spreadsheet, no live view",
  },
];

const questions = [
  "Am I profitable this month?",
  "Which outlet is bleeding?",
  "Can I afford a second branch?",
];

export default function ProblemSection() {
  return (
    <section className="mx-auto mt-32 max-w-7xl px-6 sm:mt-40 lg:px-8">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-base font-semibold text-[#b10000]">
          The problem
        </h2>
        <p className="mt-3 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          “Let me check with my CA.”
        </p>
        <p className="mt-6 text-lg leading-8 text-slate-600">
          This is the answer most Indian restaurant owners give to almost every
          question about their own business. The answer arrives 30–45 days late,
          in a spreadsheet, from someone else.
        </p>
      </div>

      <div className="mx-auto mt-12 flex max-w-3xl flex-wrap justify-center gap-3">
        {questions.map((question) => (
          <span
            key={question}
            className="rounded-full border border-red-100 bg-red-50 px-4 py-2 text-sm font-medium text-[#b10000]"
          >
            {question}
          </span>
        ))}
      </div>

      <div className="mt-16">
        <p className="text-center text-sm font-semibold tracking-widest text-slate-500 uppercase">
          What the market sells you today
        </p>
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stack.map((item) => (
            <div
              key={item.tool}
              className="flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="text-lg font-semibold text-slate-900">
                {item.tool}
              </div>
              <div className="mt-2 text-sm font-medium text-[#b10000]">
                {item.does}
              </div>
              <p className="mt-4 flex-auto text-sm leading-6 text-slate-600">
                {item.missing}
              </p>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-10 text-center text-lg font-semibold text-slate-900">
        Four vendors. Three reconciliations.{" "}
        <span className="text-[#b10000]">
          No single number anyone trusts.
        </span>
      </p>
    </section>
  );
}

export default function LaunchSection() {
  return (
    <div className="mx-auto mt-32 max-w-7xl sm:mt-56 sm:px-6 lg:px-8">
      <div className="relative isolate overflow-hidden rounded-[32px] bg-[#b10000] px-6 py-24 shadow-2xl sm:px-24 xl:py-32">
        <h2 className="mx-auto max-w-4xl text-center text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Start Growing Your Restaurant with DineInk
        </h2>

        <p className="mx-auto mt-6 max-w-2xl text-center text-lg leading-8 text-red-100">
          Join restaurant owners who want faster billing, better table
          management, smarter reporting and complete control over their
          business.
        </p>

        <form className="mx-auto mt-10 flex max-w-xl flex-col gap-4 sm:flex-row">
          <label htmlFor="email-address" className="sr-only">
            Email address
          </label>

          <input
            id="email-address"
            name="email"
            type="email"
            required
            placeholder="Enter your business email"
            autoComplete="email"
            className="min-w-0 flex-auto rounded-xl border border-white/20 bg-white/10 px-5 py-4 text-base text-white outline-none placeholder:text-red-200 backdrop-blur-sm focus:border-white/40 focus:ring-2 focus:ring-white/20"
          />

          <button
            type="submit"
            className="rounded-xl bg-white px-6 py-4 text-sm font-semibold text-[#b10000] shadow-lg transition duration-300 hover:bg-red-50"
          >
            Get Started Free
          </button>
        </form>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-red-100">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-white/60" />
            No credit card required
          </div>

          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-white/60" />
            Free for first 6 months
          </div>

          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-white/60" />
            Setup in minutes
          </div>
        </div>

        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 overflow-hidden"
        >
          <div className="absolute top-0 left-1/3 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 h-80 w-80 rounded-full bg-white/5 blur-3xl" />
        </div>
      </div>
    </div>
  );
}

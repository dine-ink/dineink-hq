export default function LaunchSection() {
  return (
    <div className="mx-auto mt-32 max-w-7xl sm:mt-56 sm:px-6 lg:px-8">
      <div className="relative isolate overflow-hidden rounded-[32px] bg-gradient-to-br from-red-900 via-rose-900 to-slate-900 px-6 py-24 shadow-2xl sm:px-24 xl:py-32">
        <h2 className="mx-auto max-w-4xl text-center text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Start Growing Your Restaurant with DineInk
        </h2>

        <p className="mx-auto mt-6 max-w-2xl text-center text-lg leading-8 text-gray-300">
          Join restaurant owners who want faster billing, better table management,
          smarter reporting and complete control over their business.
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
            className="min-w-0 flex-auto rounded-xl border border-white/10 bg-white/10 px-5 py-4 text-base text-white outline-none placeholder:text-gray-400 backdrop-blur-sm focus:border-red-500 focus:ring-2 focus:ring-red-500"
          />

          <button
            type="submit"
            className="rounded-xl bg-red-700 px-6 py-4 text-sm font-semibold text-white shadow-lg transition duration-300 hover:bg-red-600"
          >
            Get Started Free
          </button>
        </form>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-300">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            No credit card required
          </div>

          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            Free for first 6 months
          </div>

          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            Setup in minutes
          </div>
        </div>

        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 overflow-hidden"
        >
          <div className="absolute top-0 left-1/3 h-72 w-72 rounded-full bg-red-600/20 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 h-80 w-80 rounded-full bg-rose-500/20 blur-3xl" />
        </div>
      </div>
    </div>
  );
}
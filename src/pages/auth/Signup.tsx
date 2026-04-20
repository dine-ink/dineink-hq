import { Link } from "react-router-dom";

export default function Signup() {
  return (
    <div className="flex min-h-screen flex-col justify-center bg-gray-50 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center text-3xl font-bold tracking-wide text-red-700">
          DineInk
        </div>

        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          Create your DineInk account
        </h2>

        <p className="mt-2 text-center text-sm text-gray-500">
          Start managing your restaurant in minutes
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[560px]">
        <div className="rounded-2xl bg-white px-6 py-12 shadow-xl sm:px-12">
          <form className="space-y-6">
            <div>
              <label
                htmlFor="full-name"
                className="block text-sm font-medium text-gray-900"
              >
                Full name
              </label>
              <div className="mt-2">
                <input
                  id="full-name"
                  name="full-name"
                  type="text"
                  required
                  className="block w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-100"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-900"
              >
                Email address
              </label>
              <div className="mt-2">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="block w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-100"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-900"
              >
                Phone number
              </label>
              <div className="mt-2">
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  className="block w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-900"
                >
                  Password
                </label>
                <div className="mt-2">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className="block w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-100"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirm-password"
                  className="block text-sm font-medium text-gray-900"
                >
                  Confirm password
                </label>
                <div className="mt-2">
                  <input
                    id="confirm-password"
                    name="confirm-password"
                    type="password"
                    required
                    className="block w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-100"
                  />
                </div>
              </div>
            </div>

            <div>
              <div className="mt-2 flex items-center gap-x-6">
                <div className="h-px flex-1 bg-gray-200" />
                <p className="text-sm font-medium text-gray-500">
                  Or continue with
                </p>
                <div className="h-px flex-1 bg-gray-200" />
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <button className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-50">
                  Google
                </button>

                <button className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-50">
                  Microsoft
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="flex w-full justify-center rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-red-500"
            >
              Create account
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold text-red-600 hover:text-red-500"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
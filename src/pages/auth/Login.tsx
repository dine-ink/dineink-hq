import { Link, useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col justify-center bg-gray-50 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center text-3xl font-bold tracking-wide text-red-700">
          DineInk
        </div>

        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          Sign in to DineInk
        </h2>

        <p className="mt-2 text-center text-sm text-gray-500">
          Manage your restaurant from one dashboard
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
        <div className="rounded-2xl bg-white px-6 py-12 shadow-xl sm:px-12">
          <form
            className="space-y-6"
            onSubmit={(e) => {
              e.preventDefault();
              navigate("/dashboard");
            }}
          >
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
                  autoComplete="email"
                  className="block w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-100"
                />
              </div>
            </div>

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
                  autoComplete="current-password"
                  className="block w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-100"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-600"
                />
                <label
                  htmlFor="remember-me"
                  className="text-sm text-gray-900"
                >
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link
                  to="/forgot-password"
                  className="font-semibold text-red-600 hover:text-red-500"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="flex w-full justify-center rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-red-500"
              >
                Sign in
              </button>
            </div>
          </form>

          <div>
            <div className="mt-10 flex items-center gap-x-6">
              <div className="h-px flex-1 bg-gray-200" />
              <p className="text-sm font-medium text-gray-500">
                Or continue with
              </p>
              <div className="h-px flex-1 bg-gray-200" />
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <button
                onClick={() => navigate("/dashboard")}
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
              >
                Google
              </button>

              <button
                onClick={() => navigate("/dashboard")}
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
              >
                Microsoft
              </button>
            </div>
          </div>
        </div>

        <p className="mt-10 text-center text-sm text-gray-500">
          Don&apos;t have an account?{" "}
          <Link
            to="/signup"
            className="font-semibold text-red-600 hover:text-red-500"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
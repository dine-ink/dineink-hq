import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  EyeIcon,
  EyeSlashIcon,
  ChartBarIcon,
  CpuChipIcon,
  SparklesIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import Logo from "../../components/common/Logo";
import { useAppDispatch } from "../../store";
import { setAuth } from "../../store/slices/authSlice";
import { setBranches } from "../../store/slices/branchSlice";

export default function Login() {
  const API_URL = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  // A rejected sign-in belongs next to the form, not in an alert() the browser
  // strips of context. `locked` is the one case that needs more than a message:
  // the password will not work again until it has been reset, so the banner has
  // to carry the way out.
  const [error, setError] = useState<{ message: string; locked: boolean } | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await response.json();
      if (data.success) {
        dispatch(
          setAuth({
            user: data.user,
            token: data.token,
            restaurant: data.restaurant,
            branches: data.branches,
          }),
        );
        dispatch(setBranches(data.branches || []));
        navigate("/dashboard");
      } else {
        // ACCOUNT_LOCKED comes back as a 429 after 20 failed attempts inside an
        // hour. The account cannot be opened by password again until an
        // email-verified reset, so retrying is pointless and the banner links
        // straight to it.
        setError({
          message: data.message ?? "Sign-in failed. Check your details and try again.",
          locked: data.code === "ACCOUNT_LOCKED",
        });
      }
    } catch (error) {
      // A throw here means the request never reached the API (dev server not
      // running, wrong VITE_API_URL, CORS, offline) — not a rejected password,
      // which comes back as a 200 with `success: false`. Log the real cause;
      // "Login failed" on its own sends you hunting for the wrong bug.
      console.error(`Login request to ${API_URL} failed:`, error);
      setError({
        message: `Could not reach the server at ${API_URL}. Check that the API is running, then try again.`,
        locked: false,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-dvh bg-[#b10000] lg:h-dvh lg:overflow-hidden">
      {/* Subtle background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -left-32 -top-32 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute left-1/3 top-1/4 h-48 w-48 rounded-full bg-white/5 blur-3xl" />
      </div>

      {/* LEFT PANEL */}
      <div className="relative hidden w-[48%] flex-col justify-between overflow-hidden px-8 py-6 lg:flex">
        {/* Logo */}
        <div className="relative z-10">
          <Logo tone="onColor" size="md" subtitle="Restaurant Intelligence" />

          <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-semibold text-white backdrop-blur-xl">
            <SparklesIcon className="h-3 w-3" />
            AI Powered Restaurant ERP
          </div>

          <h2 className="mt-5 max-w-sm text-[2.4rem] font-black leading-[1] tracking-tight text-white">
            Run Your Restaurant
            <br />
            <span className="text-red-200">Like A Modern Brand</span>
          </h2>
          <p className="mt-4 max-w-sm text-[13px] leading-6 text-red-100">
            Billing, inventory, CRM, kitchen operations, analytics, staff
            management and AI-powered business intelligence.
          </p>
        </div>

        {/* Stats cards */}
        <div className="relative z-10 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div className="rounded-xl bg-white/10 p-2">
                  <ChartBarIcon className="h-4 w-4 text-white" />
                </div>
                <span className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-[8px] font-bold text-emerald-200">
                  LIVE
                </span>
              </div>
              <h3 className="mt-3 text-[1.8rem] font-black text-white">₹2.4L</h3>
              <p className="text-[10px] text-red-200">Weekly Revenue</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div className="rounded-xl bg-white/10 p-2">
                  <CpuChipIcon className="h-4 w-4 text-white" />
                </div>
                <span className="rounded-full bg-white/15 px-2 py-0.5 text-[8px] font-bold text-white">
                  AI
                </span>
              </div>
              <h3 className="mt-3 text-[1.8rem] font-black text-white">98%</h3>
              <p className="text-[10px] text-red-200">Forecast Accuracy</p>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[9px] font-bold tracking-[0.18em] text-red-200 uppercase">
                  Command Center
                </p>
                <h3 className="mt-1 text-base font-black text-white">Business Insights</h3>
              </div>
              <div className="rounded-full bg-emerald-400/20 px-2.5 py-1 text-[8px] font-bold text-emerald-200">
                ACTIVE
              </div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-white/10 p-2.5">
                <p className="text-[9px] text-red-200">Orders</p>
                <h4 className="mt-1 text-sm font-black text-white">1,248</h4>
              </div>
              <div className="rounded-xl bg-white/10 p-2.5">
                <p className="text-[9px] text-red-200">Customers</p>
                <h4 className="mt-1 text-sm font-black text-white">842</h4>
              </div>
              <div className="rounded-xl bg-white/10 p-2.5">
                <p className="text-[9px] text-red-200">Growth</p>
                <h4 className="mt-1 text-sm font-black text-white">+18%</h4>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between text-[10px] text-red-200">
          <p>© 2026 DineInk</p>
          <p>Restaurant Operating System</p>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="relative flex flex-1 items-center justify-center px-5 py-5">
        <div className="w-full max-w-[440px]">
          {/* Mobile logo */}
          <div className="mb-6 flex items-center justify-center lg:hidden">
            <Logo tone="onColor" size="md" subtitle="Restaurant Intelligence" />
          </div>

          <div className="overflow-hidden rounded-3xl border border-white/20 bg-white shadow-2xl shadow-black/30">
            {/* Card header */}
            <div className="border-b border-slate-100 px-7 py-6">
              <span className="inline-flex items-center rounded-full bg-red-50 border border-red-100 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#b10000]">
                Welcome Back
              </span>
              <h2 className="mt-4 text-4xl font-black tracking-tight text-slate-900">
                Sign In
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Access your restaurant dashboard, billing operations and business intelligence.
              </p>
            </div>

            {/* Form */}
            <div className="px-7 py-6">
              <form onSubmit={handleLogin} className="space-y-4">
                {error && (
                  <div
                    role="alert"
                    aria-live="assertive"
                    className="rounded-xl border border-red-200 bg-red-50 px-4 py-3"
                  >
                    <p className="text-sm font-medium leading-5 text-[#8f0000]">
                      {error.message}
                    </p>
                    {error.locked && (
                      <Link
                        to="/forgot-password"
                        className="mt-2 inline-block text-sm font-bold text-[#b10000] underline underline-offset-2 hover:text-[#8f0000]"
                      >
                        Reset your password
                      </Link>
                    )}
                  </div>
                )}
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Email or Phone
                  </label>
                  <input
                    type="text"
                    placeholder="Enter email or phone"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-[#b10000] focus:bg-white focus:ring-4 focus:ring-red-100"
                  />
                </div>
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="text-sm font-semibold text-slate-700">Password</label>
                    <Link
                      to="/forgot-password"
                      className="text-xs font-semibold text-[#b10000] hover:text-[#8f0000]"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 pr-12 text-sm text-slate-900 outline-none transition focus:border-[#b10000] focus:bg-white focus:ring-4 focus:ring-red-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="h-4.5 w-4.5" />
                      ) : (
                        <EyeIcon className="h-4.5 w-4.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 accent-[#b10000]"
                    />
                    <span className="text-sm text-slate-600">Remember me</span>
                  </label>
                  <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold text-emerald-700">
                    <ShieldCheckIcon className="h-3 w-3" />
                    Secure
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="h-11 w-full rounded-xl bg-[#b10000] text-sm font-bold text-white shadow-lg shadow-red-900/20 transition hover:bg-[#8f0000] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Signing in..." : "Access Dashboard →"}
                </button>
              </form>

              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-100" />
                <p className="text-xs font-medium text-slate-400">or continue with</p>
                <div className="h-px flex-1 bg-slate-100" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className="flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <img
                    src="https://www.svgrepo.com/show/475656/google-color.svg"
                    alt="google"
                    className="h-4 w-4"
                  />
                  Google
                </button>
                <button
                  type="button"
                  className="flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg"
                    alt="microsoft"
                    className="h-4 w-4"
                  />
                  Microsoft
                </button>
              </div>
            </div>
          </div>

          <p className="mt-4 text-center text-sm text-red-200">
            Don&apos;t have an account?{" "}
            <Link to="/signup" className="font-bold text-white hover:text-red-100">
              Create Account →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

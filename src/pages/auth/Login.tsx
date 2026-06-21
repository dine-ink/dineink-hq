import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  EyeIcon,
  EyeSlashIcon,
  ChartBarIcon,
  CpuChipIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
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
        alert(data.message);
      }
    } catch {
      alert("Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex h-screen overflow-hidden bg-gradient-to-b from-red-600 via-red-500 to-rose-600">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-[-120px] top-[-120px] h-[220px] w-[220px] rounded-full bg-red-300/20 blur-3xl" />
        <div className="absolute bottom-[-120px] right-[-120px] h-[220px] w-[220px] rounded-full bg-rose-300/20 blur-3xl" />
        <div className="absolute left-[35%] top-[20%] h-[180px] w-[180px] rounded-full bg-red-200/20 blur-3xl" />
      </div>
      {/* LEFT SIDE */}
      <div className="relative hidden w-[48%] flex-col justify-between overflow-hidden px-6 py-4 lg:flex">
        <div className="absolute inset-0" />
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-white/10 bg-white/15 text-lg font-black text-white backdrop-blur-2xl">
              D
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white">
                DineInk
              </h1>
              <p className="text-[10px] text-red-100">
                Restaurant Intelligence
              </p>
            </div>
          </div>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-semibold text-white backdrop-blur-xl">
            <SparklesIcon className="h-3 w-3" />
            AI Powered Restaurant ERP
          </div>
          <h2 className="mt-4 max-w-lg text-[2.2rem] font-black leading-[0.95] tracking-tight text-white">
            Run Your Restaurant
            <br />
            Like A Modern Brand
          </h2>
          <p className="mt-3 max-w-md text-[13px] leading-6 text-red-100">
            Billing, inventory, CRM, kitchen operations, analytics, staff
            management and AI-powered business intelligence.
          </p>
        </div>
        <div className="relative z-10 mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[18px] border border-white/10 bg-white/10 p-3 backdrop-blur-2xl">
              <div className="flex items-center justify-between">
                <div className="rounded-lg bg-white/10 p-1.5">
                  <ChartBarIcon className="h-4 w-4 text-white" />
                </div>
                <span className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-[8px] font-bold text-emerald-100">
                  LIVE
                </span>
              </div>
              <h3 className="mt-3 text-[1.8rem] font-black text-white">
                ₹2.4L
              </h3>
              <p className="text-[10px] text-red-100">
                Weekly Revenue Analytics
              </p>
            </div>
            <div className="rounded-[18px] border border-white/10 bg-white/10 p-3 backdrop-blur-2xl">
              <div className="flex items-center justify-between">
                <div className="rounded-lg bg-white/10 p-1.5">
                  <CpuChipIcon className="h-4 w-4 text-white" />
                </div>
                <span className="rounded-full bg-white/15 px-2 py-0.5 text-[8px] font-bold text-white">
                  AI
                </span>
              </div>
              <h3 className="mt-3 text-[1.8rem] font-black text-white">98%</h3>
              <p className="text-[10px] text-red-100">Forecast Accuracy</p>
            </div>
          </div>
          <div className="rounded-[20px] border border-white/10 bg-white/10 p-3.5 backdrop-blur-2xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[9px] font-semibold tracking-[0.18em] text-red-100">
                  COMMAND CENTER
                </p>
                <h3 className="mt-1.5 text-lg font-black text-white">
                  Business Insights
                </h3>
              </div>
              <div className="rounded-full bg-emerald-400/20 px-2.5 py-1 text-[8px] font-bold text-emerald-100">
                ACTIVE
              </div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-white/10 p-2">
                <p className="text-[9px] text-red-100">Orders</p>
                <h4 className="mt-1 text-base font-black text-white">1,248</h4>
              </div>
              <div className="rounded-xl bg-white/10 p-2">
                <p className="text-[9px] text-red-100">Customers</p>
                <h4 className="mt-1 text-base font-black text-white">842</h4>
              </div>
              <div className="rounded-xl bg-white/10 p-2">
                <p className="text-[9px] text-red-100">Growth</p>
                <h4 className="mt-1 text-base font-black text-white">+18%</h4>
              </div>
            </div>
          </div>
        </div>
        <div className="relative z-10 flex items-center justify-between pt-2 text-[10px] text-red-100">
          <p>© 2026 DineInk</p>
          <p>Restaurant Operating System</p>
        </div>
      </div>
      {/* RIGHT SIDE */}
      <div className="relative flex flex-1 items-center justify-center px-5 py-5">
        <div className="w-full max-w-[470px]">
          <div className="mb-5 flex items-center justify-center gap-3 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-b from-red-600 via-red-500 to-rose-600 text-lg font-black text-white shadow-xl">
              D
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900">DineInk</h1>
              <p className="text-xs text-gray-500">Restaurant Intelligence</p>
            </div>
          </div>
          <div className="overflow-hidden rounded-[28px] border border-white/60 bg-white">
            <div className="border-b border-red-50 px-6 py-5">
              <div className="inline-flex rounded-full bg-[#b10000] px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-red-600">
                Welcome Back
              </div>
              <h2 className="mt-4 text-[3rem] font-black tracking-tight text-gray-900">
                Sign In
              </h2>
              <p className="mt-2 text-sm leading-7 text-gray-500">
                Access your restaurant dashboard, billing operations and AI
                business intelligence system.
              </p>
            </div>
            <div className="px-6 py-5">
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-bold text-gray-700">
                    Email or Phone
                  </label>
                  <input
                    type="text"
                    placeholder="Enter email or phone"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="h-11 w-full rounded-2xl border border-gray-200 bg-[#f8fafc] px-4 text-sm font-medium outline-none transition-all focus:border-red-500 focus:ring-4 focus:ring-red-100"
                  />
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-sm font-bold text-gray-700">
                      Password
                    </label>
                    <Link
                      to="/forgot-password"
                      className="text-sm font-semibold text-red-600 hover:text-red-500"
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
                      className="h-11 w-full rounded-2xl border border-gray-200 bg-[#f8fafc] px-4 pr-12 text-sm font-medium outline-none transition-all focus:border-red-500 focus:ring-4 focus:ring-red-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                    <span className="text-sm text-gray-600">Remember me</span>
                  </label>
                  <div className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold text-emerald-600">
                    Secure Login
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="h-11 w-full rounded-2xl bg-gradient-to-r from-red-600 via-red-500 to-rose-600 text-sm font-black text-white shadow-[0_20px_40px_rgba(239,68,68,0.25)] transition-all duration-300 hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Signing in..." : "Access Dashboard"}
                </button>
              </form>
              <div className="my-5 flex items-center gap-4">
                <div className="h-px flex-1 bg-gray-200" />
                <p className="text-xs font-semibold text-gray-400">
                  Continue with
                </p>
                <div className="h-px flex-1 bg-gray-200" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 transition-all hover:border-red-200 hover:bg-[#b10000]"
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
                  className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 transition-all hover:border-blue-200 hover:bg-blue-50"
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
          <p className="mt-3 text-center text-sm text-white">
            Don&apos;t have an account?{" "}
            <Link
              to="/signup"
              className="font-black text-black hover:text-black/90"
            >
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

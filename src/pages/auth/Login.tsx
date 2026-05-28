import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

export default function Login() {
  const API_URL = import.meta.env.VITE_API_URL;

  const navigate = useNavigate();
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          identifier,
          password,
        }),
      });
      const data = await response.json();
      if (data.success) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("restaurant", JSON.stringify(data.restaurant));
        localStorage.setItem("branches", JSON.stringify(data.branches));
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
    <div className="relative flex min-h-screen overflow-hidden bg-gradient-to-br from-[#fff5f5] via-[#fff0f3] to-[#ffe5ec]">
      {/* BLOBS */}
      <div className="absolute left-[-120px] top-[-120px] h-[260px] w-[260px] rounded-full bg-red-300/20 blur-3xl"></div>
      <div className="absolute bottom-[-120px] right-[-120px] h-[260px] w-[260px] rounded-full bg-pink-300/20 blur-3xl"></div>
      {/* LEFT SIDE */}
      <div className="relative hidden h-screen w-[48%] flex-col justify-between overflow-hidden bg-gradient-to-br from-red-600 via-rose-500 to-pink-500 px-10 py-6 lg:flex">
        {/* GLOW */}
        <div className="absolute right-[-100px] top-[-100px] h-[260px] w-[260px] rounded-full bg-white/10 blur-3xl"></div>
        <div className="absolute bottom-[-120px] left-[-100px] h-[260px] w-[260px] rounded-full bg-white/10 blur-3xl"></div>
        {/* LOGO */}
        <div className="relative z-10 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-white/15 text-2xl font-black text-white backdrop-blur-xl">
            D
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              DineInk
            </h1>
            <p className="mt-1 text-xs text-red-100">Restaurant Intelligence</p>
          </div>
        </div>
        {/* CENTER */}
        <div className="relative z-10 -mt-8 max-w-lg">
          <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white backdrop-blur-xl">
            AI Powered Restaurant ERP
          </div>
          <h2 className="mt-5 text-[3.2rem] font-black leading-[0.95] tracking-tight text-white">
            Run Your Restaurant
            <br />
            Smarter
          </h2>
          <p className="mt-6 max-w-lg text-base leading-8 text-red-100">
            Billing, inventory, analytics, staff management, customer insights
            and AI forecasting — all inside one modern restaurant platform.
          </p>
          {/* FEATURES */}
          <div className="mt-7 rounded-[28px] border border-white/10 bg-white/10 p-4 backdrop-blur-2xl">
            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  title: "AI",
                  subtitle: "Smart business insights",
                },
                {
                  title: "POS",
                  subtitle: "Modern billing system",
                },
                {
                  title: "CRM",
                  subtitle: "Customer intelligence",
                },
                {
                  title: "ERP",
                  subtitle: "End-to-end operations",
                },
              ].map((item) => (
                <div key={item.title} className="rounded-2xl bg-white/10 p-4">
                  <p className="text-2xl font-black text-white">{item.title}</p>
                  <p className="mt-1 text-xs text-red-100">{item.subtitle}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* FOOTER */}
        <div className="relative z-10 flex items-center justify-between text-xs text-red-100">
          <p>© 2026 DineInk</p>
          <p>Restaurant Operating System</p>
        </div>
      </div>
      {/* RIGHT SIDE */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-3 lg:px-8">
        <div className="w-full max-w-[580px] origin-center scale-[0.92] xl:scale-100">
          {/* MOBILE LOGO */}
          <div className="mb-6 flex items-center justify-center gap-3 lg:hidden">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-pink-500 text-xl font-black text-white shadow-xl">
              D
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900">DineInk</h1>
              <p className="text-xs text-gray-500">Restaurant Intelligence</p>
            </div>
          </div>
          {/* CARD */}
          <div className="overflow-hidden rounded-[36px] border border-white/60 bg-white/70 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-2xl">
            {/* HEADER */}
            <div className="border-b border-gray-100 px-7 py-5">
              <div className="inline-flex rounded-full bg-red-50 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-red-600">
                Welcome Back
              </div>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-gray-900">
                Sign in to DineInk
              </h2>
              <p className="mt-2 text-sm leading-6 text-gray-500">
                Access your restaurant dashboard, billing system and business
                insights.
              </p>
            </div>
            {/* FORM */}
            <div className="px-7 py-6">
              <form className="space-y-5" onSubmit={handleLogin}>
                {/* EMAIL */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Email or Phone
                  </label>
                  <input
                    type="text"
                    placeholder="Enter email or phone"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm outline-none transition-all focus:border-red-500 focus:ring-4 focus:ring-red-100"
                  />
                </div>
                {/* PASSWORD */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="block text-sm font-semibold text-gray-700">
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
                      className="w-full rounded-2xl border border-gray-200 bg-white px-5 py-3 pr-14 text-sm outline-none transition-all focus:border-red-500 focus:ring-4 focus:ring-red-100"
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
                {/* REMEMBER */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                    <span className="text-sm text-gray-600">Remember me</span>
                  </label>
                  <div className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-600">
                    Secure Login
                  </div>
                </div>
                {/* BUTTON */}
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-red-600 via-pink-500 to-rose-500 px-5 py-3.5 text-sm font-bold text-white shadow-[0_15px_35px_rgba(255,0,80,0.25)] transition-all duration-300 hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Signing in..." : "Sign In"}
                </button>
              </form>
              {/* DIVIDER */}
              <div className="my-6 flex items-center gap-4">
                <div className="h-px flex-1 bg-gray-200"></div>
                <p className="text-sm font-medium text-gray-400">
                  Or continue with
                </p>
                <div className="h-px flex-1 bg-gray-200"></div>
              </div>
              {/* SOCIAL */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  className="flex items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition-all hover:border-red-200 hover:bg-red-50"
                >
                  <img
                    src="https://www.svgrepo.com/show/475656/google-color.svg"
                    alt="google"
                    className="h-5 w-5"
                  />
                  Google
                </button>
                <button
                  type="button"
                  className="flex items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition-all hover:border-blue-200 hover:bg-blue-50"
                >
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg"
                    alt="microsoft"
                    className="h-5 w-5"
                  />
                  Microsoft
                </button>
              </div>
            </div>
          </div>
          {/* FOOTER */}
          <p className="mt-5 text-center text-sm text-gray-500">
            Don&apos;t have an account?{" "}
            <Link
              to="/signup"
              className="font-bold text-red-600 hover:text-red-500"
            >
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

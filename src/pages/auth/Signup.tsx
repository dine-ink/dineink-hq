import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  EyeIcon,
  EyeSlashIcon,
  SparklesIcon,
  ChartBarIcon,
  CpuChipIcon,
} from "@heroicons/react/24/outline";
import { useAppDispatch } from "../../store";
import { setAuth } from "../../store/slices/authSlice";
import { setBranches } from "../../store/slices/branchSlice";

export default function Signup() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const API_URL = import.meta.env.VITE_API_URL;

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
        }),
      });
      const data = await res.json();
      if (data.success) {
        dispatch(
          setAuth({
            user: data.user,
            token: data.token,
            restaurant: data.restaurant || null,
          }),
        );
        dispatch(setBranches(data.branches || []));
        navigate("/dashboard");
      } else {
        alert(data.message || "Signup failed");
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex h-screen overflow-hidden bg-gradient-to-b from-red-600 via-red-500 to-rose-600">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-[-120px] top-[-120px] h-[220px] w-[220px] rounded-full bg-red-300/20 blur-3xl" />
        <div className="absolute bottom-[-120px] right-[-120px] h-[220px] w-[220px] rounded-full bg-rose-300/20 blur-3xl" />
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
            Build Your Restaurant
            <br />
            Empire Smarter
          </h2>
          <p className="mt-3 max-w-md text-[13px] leading-6 text-red-100">
            Billing, inventory, CRM, analytics, operations and AI-powered
            restaurant intelligence — all inside one operating system.
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
                ₹4.8L
              </h3>
              <p className="text-[10px] text-red-100">Monthly Revenue Growth</p>
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
                  RESTAURANT INSIGHTS
                </p>
                <h3 className="mt-1.5 text-lg font-black text-white">
                  Scale With Intelligence
                </h3>
              </div>
              <div className="rounded-full bg-emerald-400/20 px-2.5 py-1 text-[8px] font-bold text-emerald-100">
                ACTIVE
              </div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-white/10 p-2">
                <p className="text-[9px] text-red-100">Orders</p>
                <h4 className="mt-1 text-base font-black text-white">2,842</h4>
              </div>
              <div className="rounded-xl bg-white/10 p-2">
                <p className="text-[9px] text-red-100">Customers</p>
                <h4 className="mt-1 text-base font-black text-white">1,240</h4>
              </div>
              <div className="rounded-xl bg-white/10 p-2">
                <p className="text-[9px] text-red-100">Growth</p>
                <h4 className="mt-1 text-base font-black text-white">+24%</h4>
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
      <div className="relative flex flex-1 items-center justify-center px-5 py-4">
        <div className="w-full max-w-[420px]">
          <div className="mb-5 flex items-center justify-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-b from-red-600 via-red-500 to-rose-600 text-lg font-black text-white shadow-xl">
              D
            </div>
            <div>
              <h1 className="text-lg font-black text-gray-900">DineInk</h1>
              <p className="text-[11px] text-gray-500">
                Restaurant Intelligence
              </p>
            </div>
          </div>
          <div className="overflow-hidden rounded-[24px] border border-white/60 bg-white">
            <div className="border-b border-red-50 px-5 py-3">
              <div className="inline-flex rounded-full bg-[#b10000] px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-red-600">
                Create Account
              </div>
              <h2 className="mt-3 text-[2.2rem] font-black tracking-tight text-gray-900">
                Join DineInk
              </h2>
              <p className="mt-1.5 text-[13px] leading-5 text-gray-500">
                Create your restaurant account and start managing your business
                smarter.
              </p>
            </div>
            <div className="px-5 py-3">
              <form className="space-y-2.5" onSubmit={handleSubmit}>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">
                    Full Name
                  </label>
                  <input
                    name="name"
                    type="text"
                    required
                    placeholder="Enter your name"
                    onChange={handleChange}
                    className="h-10 w-full rounded-xl border border-gray-200 bg-[#f8fafc] px-4 text-sm outline-none transition-all focus:border-red-500 focus:ring-4 focus:ring-red-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">
                    Email Address
                  </label>
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="Enter your email"
                    onChange={handleChange}
                    className="h-10 w-full rounded-xl border border-gray-200 bg-[#f8fafc] px-4 text-sm outline-none transition-all focus:border-red-500 focus:ring-4 focus:ring-red-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">
                    Phone Number
                  </label>
                  <input
                    name="phone"
                    type="tel"
                    required
                    placeholder="Enter phone number"
                    onChange={handleChange}
                    className="h-10 w-full rounded-xl border border-gray-200 bg-[#f8fafc] px-4 text-sm outline-none transition-all focus:border-red-500 focus:ring-4 focus:ring-red-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Create password"
                      onChange={handleChange}
                      className="h-10 w-full rounded-xl border border-gray-200 bg-[#f8fafc] px-4 pr-12 text-sm outline-none transition-all focus:border-red-500 focus:ring-4 focus:ring-red-100"
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
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      placeholder="Confirm password"
                      onChange={handleChange}
                      className="h-10 w-full rounded-xl border border-gray-200 bg-[#f8fafc] px-4 pr-12 text-sm outline-none transition-all focus:border-red-500 focus:ring-4 focus:ring-red-100"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      {showConfirmPassword ? (
                        <EyeSlashIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="mt-0.5 flex h-10 w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#ff1744] via-[#ff2d55] to-[#ff4d6d] text-sm font-bold text-white shadow-[0_15px_35px_rgba(255,0,80,0.20)] transition-all duration-300 hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Creating..." : "Create Account"}
                </button>
              </form>
            </div>
          </div>
          <p className="mt-2 text-center text-sm text-white">
            Already have an account?{" "}
            <Link to="/login" className="font-bold text-black hover:text-black">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

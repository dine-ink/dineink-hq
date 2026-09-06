import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  EyeIcon,
  EyeSlashIcon,
  SparklesIcon,
  ChartBarIcon,
  CpuChipIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import Logo from "@/components/common/Logo";
import { useAppDispatch } from "@/store";
import { setAuth } from "@/store/slices/authSlice";
import { setBranches } from "@/store/slices/branchSlice";

export default function Signup() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const API_URL = import.meta.env.VITE_API_URL;

  const [step, setStep] = useState<"form" | "otp">("form");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const sendOtp = async () => {
    const res = await fetch(`${API_URL}/api/auth/signup/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.email }),
    });
    return res.json();
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    if (form.password.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }
    try {
      setLoading(true);
      const data = await sendOtp();
      if (data.success) {
        setOtp("");
        setOtpError("");
        setStep("otp");
        setResendCooldown(30);
      } else {
        alert(data.message || "Could not send verification code");
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    try {
      setLoading(true);
      const data = await sendOtp();
      if (data.success) {
        setOtpError("");
        setResendCooldown(30);
      } else {
        setOtpError(data.message || "Could not resend code");
      }
    } catch (error) {
      console.error(error);
      setOtpError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.trim().length !== 6) {
      setOtpError("Enter the 6-digit code");
      return;
    }
    try {
      setLoading(true);
      setOtpError("");
      const res = await fetch(`${API_URL}/api/auth/signup/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
          otp,
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
        setOtpError(data.message || "Verification failed");
      }
    } catch (error) {
      console.error(error);
      setOtpError("Something went wrong");
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
            Build Your Restaurant
            <br />
            <span className="text-red-200">Empire Smarter</span>
          </h2>
          <p className="mt-4 max-w-sm text-[13px] leading-6 text-red-100">
            Billing, inventory, CRM, analytics, operations and AI-powered
            restaurant intelligence — all inside one operating system.
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
              <h3 className="mt-3 text-[1.8rem] font-black text-white">₹4.8L</h3>
              <p className="text-[10px] text-red-200">Monthly Revenue Growth</p>
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
                  Restaurant Insights
                </p>
                <h3 className="mt-1 text-base font-black text-white">Scale With Intelligence</h3>
              </div>
              <div className="rounded-full bg-emerald-400/20 px-2.5 py-1 text-[8px] font-bold text-emerald-200">
                ACTIVE
              </div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-white/10 p-2.5">
                <p className="text-[9px] text-red-200">Orders</p>
                <h4 className="mt-1 text-sm font-black text-white">2,842</h4>
              </div>
              <div className="rounded-xl bg-white/10 p-2.5">
                <p className="text-[9px] text-red-200">Customers</p>
                <h4 className="mt-1 text-sm font-black text-white">1,240</h4>
              </div>
              <div className="rounded-xl bg-white/10 p-2.5">
                <p className="text-[9px] text-red-200">Growth</p>
                <h4 className="mt-1 text-sm font-black text-white">+24%</h4>
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
      <div className="relative flex flex-1 items-center justify-center px-5 py-4">
        <div className="w-full max-w-[420px]">
          {/* Mobile logo */}
          <div className="mb-5 flex items-center justify-center lg:hidden">
            <Logo tone="onColor" size="md" subtitle="Restaurant Intelligence" />
          </div>

          <div className="overflow-hidden rounded-3xl border border-white/20 bg-white shadow-2xl shadow-black/30">
            {/* Card header */}
            <div className="border-b border-slate-100 px-6 py-5">
              {step === "otp" && (
                <button
                  type="button"
                  onClick={() => setStep("form")}
                  className="mb-3 flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-slate-600"
                >
                  <ArrowLeftIcon className="h-3.5 w-3.5" /> Change email
                </button>
              )}
              <span className="inline-flex items-center rounded-full bg-red-50 border border-red-100 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#b10000]">
                {step === "form" ? "Create Account" : "Verify Email"}
              </span>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900">
                {step === "form" ? "Join DineInk" : "Check your inbox"}
              </h2>
              <p className="mt-1.5 text-sm leading-5 text-slate-500">
                {step === "form"
                  ? "Create your restaurant account and start managing your business smarter."
                  : (
                    <>We sent a 6-digit code to <span className="font-semibold text-slate-700">{form.email}</span>. Enter it below to finish creating your account.</>
                  )}
              </p>
            </div>

            {step === "form" ? (
            /* Form */
            <div className="px-6 py-5">
              <form className="space-y-3" onSubmit={handleSendOtp}>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Full Name
                  </label>
                  <input
                    name="name"
                    type="text"
                    required
                    placeholder="Enter your name"
                    onChange={handleChange}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-[#b10000] focus:bg-white focus:ring-4 focus:ring-red-100"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Email Address
                  </label>
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="Enter your email"
                    onChange={handleChange}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-[#b10000] focus:bg-white focus:ring-4 focus:ring-red-100"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Phone Number
                  </label>
                  <input
                    name="phone"
                    type="tel"
                    required
                    placeholder="Enter phone number"
                    onChange={handleChange}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-[#b10000] focus:bg-white focus:ring-4 focus:ring-red-100"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Create password"
                      onChange={handleChange}
                      className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 pr-11 text-sm text-slate-900 outline-none transition focus:border-[#b10000] focus:bg-white focus:ring-4 focus:ring-red-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="h-4.5 w-4.5" />
                      ) : (
                        <EyeIcon className="h-4.5 w-4.5" />
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      placeholder="Confirm password"
                      onChange={handleChange}
                      className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 pr-11 text-sm text-slate-900 outline-none transition focus:border-[#b10000] focus:bg-white focus:ring-4 focus:ring-red-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPassword ? (
                        <EyeSlashIcon className="h-4.5 w-4.5" />
                      ) : (
                        <EyeIcon className="h-4.5 w-4.5" />
                      )}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="mt-1 h-10 w-full rounded-xl bg-[#b10000] text-sm font-bold text-white shadow-lg shadow-red-900/20 transition hover:bg-[#8f0000] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Sending Code..." : "Send Verification Code →"}
                </button>
              </form>
            </div>
            ) : (
            /* OTP */
            <div className="px-6 py-5">
              <form className="space-y-3" onSubmit={handleVerifyOtp}>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Verification Code
                  </label>
                  <input
                    value={otp}
                    onChange={(e) => {
                      setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
                      setOtpError("");
                    }}
                    inputMode="numeric"
                    autoFocus
                    placeholder="Enter 6-digit code"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-center text-xl font-bold tracking-[0.5em] text-slate-900 outline-none transition focus:border-[#b10000] focus:bg-white focus:ring-4 focus:ring-red-100"
                  />
                  {otpError && (
                    <p className="mt-1.5 text-xs font-semibold text-red-600">{otpError}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-1 h-10 w-full rounded-xl bg-[#b10000] text-sm font-bold text-white shadow-lg shadow-red-900/20 transition hover:bg-[#8f0000] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Verifying..." : "Verify & Create Account →"}
                </button>

                <p className="text-center text-xs text-slate-400">
                  Didn't get the code?{" "}
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0 || loading}
                    className="font-bold text-[#b10000] hover:text-[#8f0000] disabled:cursor-not-allowed disabled:text-slate-300"
                  >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
                  </button>
                </p>
              </form>
            </div>
            )}
          </div>

          <p className="mt-3 text-center text-sm text-red-200">
            Already have an account?{" "}
            <Link to="/login" className="font-bold text-white hover:text-red-100">
              Sign In →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

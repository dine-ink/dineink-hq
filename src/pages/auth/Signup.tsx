import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

export default function Signup() {
  const navigate = useNavigate();
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
  const API_URL = import.meta.env.VITE_API_URL;
  const handleChange = (e: any) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
        }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem("token", data.token);

        localStorage.setItem("user", JSON.stringify(data.user));
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
    <div className="flex h-screen overflow-hidden bg-[#f7eff1]">
      {/* LEFT SIDE */}
      <div className="relative hidden w-1/2 overflow-hidden bg-gradient-to-br from-red-600 via-pink-500 to-rose-500 lg:flex">
        {/* BG EFFECT */}
        <div className="absolute inset-0">
          <div className="absolute left-[-120px] top-[-120px] h-[320px] w-[320px] rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-[-120px] right-[-120px] h-[320px] w-[320px] rounded-full bg-black/10 blur-3xl" />
        </div>
        <div className="relative z-10 flex h-full w-full flex-col justify-between px-10 py-8">
          {/* TOP */}
          <div>
            {/* LOGO */}
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/20 text-3xl font-black text-white backdrop-blur-xl">
                D
              </div>
              <div>
                <h1 className="text-4xl font-black tracking-tight text-white">
                  DineInk
                </h1>
                <p className="text-sm text-red-100">Restaurant Intelligence</p>
              </div>
            </div>
            {/* BADGE */}
            <div className="mt-8 inline-flex rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm font-semibold text-white backdrop-blur-xl">
              AI Powered Restaurant ERP
            </div>
            {/* HERO */}
            <div className="mt-7 max-w-xl">
              <h2 className="text-5xl font-black leading-[1] tracking-tight text-white">
                Build Your Restaurant Empire
              </h2>
              <p className="mt-5 text-lg leading-8 text-red-50">
                Billing, inventory, analytics, CRM, staff management and AI
                forecasting — everything your restaurant needs to scale.
              </p>
            </div>
            {/* FEATURES */}
            <div className="mt-7 grid grid-cols-2 gap-3">
              {[
                {
                  title: "AI",
                  desc: "Smart insights",
                },
                {
                  title: "POS",
                  desc: "Billing system",
                },
                {
                  title: "CRM",
                  desc: "Customer growth",
                },
                {
                  title: "ERP",
                  desc: "Operations",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur-xl"
                >
                  <p className="text-3xl font-black text-white">{item.title}</p>
                  <p className="mt-2 text-sm text-red-100">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
          {/* FOOTER */}
          <div className="flex items-center justify-between text-sm text-red-100">
            <p>© 2026 DineInk</p>
            <p>Restaurant Operating System</p>
          </div>
        </div>
      </div>
      {/* RIGHT SIDE */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden px-2 py-1 lg:px-4">
        <div className="origin-center w-full max-w-[520px] scale-[0.84] sm:scale-[0.88] lg:scale-[0.86] xl:scale-[0.94] 2xl:scale-100">
          {/* MOBILE LOGO */}
          <div className="mb-4 flex items-center justify-center gap-3 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-pink-500 text-lg font-black text-white shadow-xl">
              D
            </div>
            <div>
              <h1 className="text-lg font-black text-gray-900">DineInk</h1>
              <p className="text-[11px] text-gray-500">
                Restaurant Intelligence
              </p>
            </div>
          </div>
          {/* CARD */}
          <div className="overflow-hidden rounded-[34px] border border-white/60 bg-white/70 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-2xl">
            {/* HEADER */}
            <div className="border-b border-gray-100 px-6 py-4">
              <div className="inline-flex rounded-full bg-red-50 px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-red-600">
                Create Account
              </div>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-gray-900">
                Join DineInk
              </h2>
              <p className="mt-1 text-sm leading-5 text-gray-500">
                Create your restaurant account and start managing your business
                smarter.
              </p>
            </div>
            {/* FORM */}
            <div className="px-6 py-4">
              <form className="space-y-3" onSubmit={handleSubmit}>
                {/* NAME */}
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                    Full Name
                  </label>
                  <input
                    name="name"
                    type="text"
                    required
                    placeholder="Enter your name"
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-gray-200 bg-white px-5 py-2.5 text-sm outline-none transition-all focus:border-red-500 focus:ring-4 focus:ring-red-100"
                  />
                </div>
                {/* EMAIL */}
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                    Email Address
                  </label>
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="Enter your email"
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-gray-200 bg-white px-5 py-2.5 text-sm outline-none transition-all focus:border-red-500 focus:ring-4 focus:ring-red-100"
                  />
                </div>
                {/* PHONE */}
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                    Phone Number
                  </label>
                  <input
                    name="phone"
                    type="tel"
                    required
                    placeholder="Enter phone number"
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-gray-200 bg-white px-5 py-2.5 text-sm outline-none transition-all focus:border-red-500 focus:ring-4 focus:ring-red-100"
                  />
                </div>
                {/* PASSWORD */}
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Create password"
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-gray-200 bg-white px-5 py-2.5 pr-14 text-sm outline-none transition-all focus:border-red-500 focus:ring-4 focus:ring-red-100"
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
                {/* CONFIRM PASSWORD */}
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      placeholder="Confirm password"
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-gray-200 bg-white px-5 py-2.5 pr-14 text-sm outline-none transition-all focus:border-red-500 focus:ring-4 focus:ring-red-100"
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
                {/* BUTTON */}
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-red-600 via-pink-500 to-rose-500 px-5 py-2.5 text-sm font-bold text-white shadow-[0_15px_35px_rgba(255,0,80,0.25)] transition-all duration-300 hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Creating..." : "Create Account"}
                </button>
              </form>
            </div>
          </div>
          {/* FOOTER */}
          <p className="mt-3 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-bold text-red-600 hover:text-red-500"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

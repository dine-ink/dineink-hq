import { useState } from "react";
import { Link } from "react-router-dom";
import { EnvelopeIcon, ArrowLeftIcon, CheckCircleIcon } from "@heroicons/react/24/outline";

export default function ForgotPassword() {
  const API_URL = import.meta.env.VITE_API_URL;
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        setSent(true);
      } else {
        setError(data.message || "Failed to send reset email");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-red-600 via-red-500 to-rose-600 px-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-[-120px] top-[-120px] h-[220px] w-[220px] rounded-full bg-red-300/20 blur-3xl" />
        <div className="absolute bottom-[-120px] right-[-120px] h-[220px] w-[220px] rounded-full bg-rose-300/20 blur-3xl" />
      </div>

      <div className="relative w-full max-w-[420px]">
        <div className="mb-6 flex items-center justify-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-lg font-black text-white backdrop-blur-2xl">
            D
          </div>
          <div>
            <h1 className="text-xl font-black text-white">DineInk</h1>
            <p className="text-[10px] text-red-100">Restaurant Intelligence</p>
          </div>
        </div>

        <div className="overflow-hidden rounded-[28px] border border-white/60 bg-white">
          <div className="border-b border-red-50 px-6 py-5">
            <div className="inline-flex rounded-full bg-red-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-red-600">
              Password Reset
            </div>
            <h2 className="mt-4 text-[2rem] font-black tracking-tight text-gray-900">Forgot Password</h2>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              Enter the email address linked to your account and we'll send you a reset link.
            </p>
          </div>

          <div className="px-6 py-5">
            {sent ? (
              <div className="flex flex-col items-center gap-4 py-4 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
                  <CheckCircleIcon className="h-8 w-8 text-emerald-500" />
                </div>
                <div>
                  <p className="text-[15px] font-bold text-gray-900">Reset link sent!</p>
                  <p className="mt-1 text-sm text-gray-500">
                    Check your inbox at <span className="font-semibold text-gray-700">{email}</span>
                  </p>
                </div>
                <Link
                  to="/login"
                  className="mt-2 flex items-center gap-2 text-sm font-semibold text-red-600 hover:text-red-500"
                >
                  <ArrowLeftIcon className="h-4 w-4" />
                  Back to Sign In
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-bold text-gray-700">Email Address</label>
                  <div className="relative">
                    <EnvelopeIcon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      required
                      placeholder="Enter your email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="h-11 w-full rounded-2xl border border-gray-200 bg-[#f8fafc] pl-10 pr-4 text-sm font-medium outline-none transition-all focus:border-red-500 focus:ring-4 focus:ring-red-100"
                    />
                  </div>
                </div>

                {error && (
                  <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="h-11 w-full rounded-2xl bg-gradient-to-r from-red-600 via-red-500 to-rose-600 text-sm font-black text-white shadow-[0_20px_40px_rgba(239,68,68,0.25)] transition-all duration-300 hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Sending..." : "Send Reset Link"}
                </button>

                <Link
                  to="/login"
                  className="flex items-center justify-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-700"
                >
                  <ArrowLeftIcon className="h-4 w-4" />
                  Back to Sign In
                </Link>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

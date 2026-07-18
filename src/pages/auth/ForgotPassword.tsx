import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  EnvelopeIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"email" | "reset" | "done">("email");
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  useEffect(() => {
    if (step !== "done") return;
    const t = setTimeout(() => navigate("/login"), 3000);
    return () => clearTimeout(t);
  }, [step, navigate]);

  const requestOtp = async () => {
    const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    return res.json();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    try {
      setLoading(true);
      const data = await requestOtp();
      if (data.success) {
        setOtp("");
        setNewPassword("");
        setConfirmPassword("");
        setStep("reset");
        setResendCooldown(30);
      } else {
        setError(data.message || "Failed to send reset code");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError("");
    try {
      setLoading(true);
      const data = await requestOtp();
      if (data.success) {
        setResendCooldown(30);
      } else {
        setError(data.message || "Could not resend code");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    if (otp.trim().length !== 6) {
      setError("Enter the 6-digit code");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        setStep("done");
      } else {
        setError(data.message || "Failed to reset password");
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
            <div className="inline-flex rounded-full bg-[#b10000] px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-red-600">
              Password Reset
            </div>
            <h2 className="mt-4 text-[2rem] font-black tracking-tight text-gray-900">
              {step === "email"
                ? "Forgot Password"
                : step === "reset"
                  ? "Enter Reset Code"
                  : "Password Reset"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              {step === "email" && (
                "Enter the email address linked to your account and we'll send you a verification code."
              )}
              {step === "reset" && (
                <>We sent a 6-digit code to <span className="font-semibold text-gray-700">{email}</span>. Enter it below along with your new password.</>
              )}
              {step === "done" && "Your password has been reset successfully."}
            </p>
          </div>

          <div className="px-6 py-5">
            {step === "email" && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-bold text-gray-700">
                    Email Address
                  </label>
                  <div className="relative">
                    <EnvelopeIcon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      required
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-11 w-full rounded-2xl border border-gray-200 bg-[#f8fafc] pl-10 pr-4 text-sm font-medium outline-none transition-all focus:border-red-500 focus:ring-4 focus:ring-red-100"
                    />
                  </div>
                </div>

                {error && (
                  <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="h-11 w-full rounded-2xl bg-gradient-to-r from-red-600 via-red-500 to-rose-600 text-sm font-black text-white shadow-[0_20px_40px_rgba(239,68,68,0.25)] transition-all duration-300 hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Sending..." : "Send Reset Code"}
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

            {step === "reset" && (
              <form onSubmit={handleReset} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-bold text-gray-700">
                    Verification Code
                  </label>
                  <input
                    value={otp}
                    onChange={(e) => {
                      setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
                      setError("");
                    }}
                    inputMode="numeric"
                    autoFocus
                    placeholder="Enter 6-digit code"
                    className="h-12 w-full rounded-2xl border border-gray-200 bg-[#f8fafc] px-4 text-center text-xl font-bold tracking-[0.5em] outline-none transition-all focus:border-red-500 focus:ring-4 focus:ring-red-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-gray-700">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="h-11 w-full rounded-2xl border border-gray-200 bg-[#f8fafc] px-4 pr-11 text-sm font-medium outline-none transition-all focus:border-red-500 focus:ring-4 focus:ring-red-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
                  <label className="mb-2 block text-sm font-bold text-gray-700">
                    Confirm New Password
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-11 w-full rounded-2xl border border-gray-200 bg-[#f8fafc] px-4 text-sm font-medium outline-none transition-all focus:border-red-500 focus:ring-4 focus:ring-red-100"
                  />
                </div>

                {error && (
                  <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="h-11 w-full rounded-2xl bg-gradient-to-r from-red-600 via-red-500 to-rose-600 text-sm font-black text-white shadow-[0_20px_40px_rgba(239,68,68,0.25)] transition-all duration-300 hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Resetting..." : "Reset Password"}
                </button>

                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={() => setStep("email")}
                    className="flex items-center gap-1.5 font-semibold text-gray-500 hover:text-gray-700"
                  >
                    <ArrowLeftIcon className="h-4 w-4" />
                    Change email
                  </button>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendCooldown > 0 || loading}
                    className="font-bold text-red-600 hover:text-red-500 disabled:cursor-not-allowed disabled:text-gray-300"
                  >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
                  </button>
                </div>
              </form>
            )}

            {step === "done" && (
              <div className="flex flex-col items-center gap-4 py-4 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
                  <CheckCircleIcon className="h-8 w-8 text-emerald-500" />
                </div>
                <div>
                  <p className="text-[15px] font-bold text-gray-900">
                    Password reset!
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Redirecting you to sign in...
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

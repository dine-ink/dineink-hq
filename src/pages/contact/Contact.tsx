import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import {
  BuildingOffice2Icon,
  EnvelopeIcon,
  PhoneIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

/**
 * ────────────────────────────────────────────────────────────────
 * Published contact details. Any field left as an empty string is
 * simply not rendered, so it is safe to ship a blank social URL
 * rather than a dead link.
 * ────────────────────────────────────────────────────────────────
 */
const CONTACT = {
  companyName: "DineInk",
  addressLines: ["Chennai, Tamil Nadu, India"],
  phone: "+91 63005 52998",
  email: "support@dineink.in",
  hours: ["Mon – Sat: 9 AM – 7 PM IST", "Sunday: closed"],
  instagramUrl: "",
  linkedinUrl: "",
};

const subjects = [
  "DineInk DOT (mobile app for vendors and counters)",
  "Professional plan — one restaurant",
  "Enterprise plan — chains and franchises",
  "Pricing and billing",
  "Moving from another POS",
  "Setup and onboarding help",
  "Technical support",
  "Partnership or press",
  "Other",
];

const answerTimes = [
  {
    audience: "Existing customers",
    detail: "Support replies within one working day, priority on paid plans.",
  },
  {
    audience: "Enterprise enquiries",
    detail:
      "Multi-outlet setup and migration questions get a scheduled call, usually within two working days.",
  },
  {
    audience: "Everyone else",
    detail:
      "DOT and Professional need no sales call at all — pricing is published and you can start free today.",
  },
];

export default function Contact() {
  const [sent, setSent] = useState(false);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = `${form.get("first-name") ?? ""} ${form.get("last-name") ?? ""}`.trim();
    const subject = String(form.get("subject") || "Website enquiry");
    const body = [
      `Name: ${name}`,
      `Email: ${form.get("email") ?? ""}`,
      `Phone: ${form.get("phone-number") ?? ""}`,
      `Restaurant: ${form.get("restaurant") ?? ""}`,
      "",
      String(form.get("message") ?? ""),
    ].join("\n");

    window.location.href = `mailto:${CONTACT.email}?subject=${encodeURIComponent(
      `[Website] ${subject}`,
    )}&body=${encodeURIComponent(body)}`;
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />

      <main className="pt-24">
        {/* Hero */}
        <div className="mx-auto max-w-7xl px-6 pt-12 pb-16 text-center lg:px-8">
          <div className="inline-flex items-center rounded-full border border-red-100 bg-red-50 px-4 py-1 text-sm font-medium text-[#b10000]">
            Contact DineInk
          </div>
          <h1 className="mt-6 text-5xl font-bold tracking-tight text-slate-900 sm:text-6xl">
            Talk to us — or skip us entirely
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            Pricing is published and DOT and Professional are free to start, so
            you never need permission to try DineInk. If you do want a human —
            about a chain rollout, a migration, or something the FAQ missed —
            this is where to find one.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              to="/signup"
              className="rounded-xl bg-[#b10000] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-red-200 transition hover:bg-[#8f0000]"
            >
              Start free instead
            </Link>
            <Link
              to="/pricing"
              className="rounded-xl border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-[#b10000]"
            >
              See pricing
            </Link>
          </div>
        </div>

        {/* Content */}
        <div className="mx-auto max-w-7xl px-6 pb-24 lg:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
            {/* Info panel */}
            <div className="lg:col-span-2">
              <div className="h-full rounded-[32px] bg-[#b10000] p-8 shadow-2xl">
                <h2 className="text-2xl font-bold text-white">
                  Contact information
                </h2>
                <p className="mt-3 text-sm text-red-100">
                  Reach out through any of the channels below.
                </p>

                <dl className="mt-10 space-y-8">
                  {CONTACT.addressLines.length > 0 && (
                    <div className="flex gap-x-4">
                      <dt className="flex-none">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                          <BuildingOffice2Icon className="h-5 w-5 text-white" />
                        </div>
                      </dt>
                      <dd className="pt-2 text-sm text-red-100">
                        {CONTACT.companyName}
                        {CONTACT.addressLines.map((line) => (
                          <span key={line}>
                            <br />
                            {line}
                          </span>
                        ))}
                      </dd>
                    </div>
                  )}

                  {CONTACT.phone && (
                    <div className="flex gap-x-4">
                      <dt className="flex-none">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                          <PhoneIcon className="h-5 w-5 text-white" />
                        </div>
                      </dt>
                      <dd className="pt-2">
                        <a
                          href={`tel:${CONTACT.phone.replace(/\s/g, "")}`}
                          className="text-sm text-red-100 transition hover:text-white"
                        >
                          {CONTACT.phone}
                        </a>
                      </dd>
                    </div>
                  )}

                  <div className="flex gap-x-4">
                    <dt className="flex-none">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                        <EnvelopeIcon className="h-5 w-5 text-white" />
                      </div>
                    </dt>
                    <dd className="pt-2">
                      <a
                        href={`mailto:${CONTACT.email}`}
                        className="text-sm text-red-100 transition hover:text-white"
                      >
                        {CONTACT.email}
                      </a>
                    </dd>
                  </div>

                  {CONTACT.hours.length > 0 && (
                    <div className="flex gap-x-4">
                      <dt className="flex-none">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                          <ClockIcon className="h-5 w-5 text-white" />
                        </div>
                      </dt>
                      <dd className="pt-2 text-sm text-red-100">
                        {CONTACT.hours.map((line, index) => (
                          <span key={line}>
                            {index > 0 && <br />}
                            {line}
                          </span>
                        ))}
                      </dd>
                    </div>
                  )}
                </dl>

                <div className="mt-12 space-y-5 border-t border-white/10 pt-8">
                  <p className="text-sm font-semibold text-white">
                    What to expect
                  </p>
                  {answerTimes.map((item) => (
                    <div key={item.audience}>
                      <div className="text-sm font-semibold text-red-100">
                        {item.audience}
                      </div>
                      <div className="mt-1 text-sm leading-6 text-red-200">
                        {item.detail}
                      </div>
                    </div>
                  ))}
                </div>

                {(CONTACT.instagramUrl || CONTACT.linkedinUrl) && (
                  <div className="mt-12 border-t border-white/10 pt-8">
                    <p className="text-sm font-semibold text-white">Follow us</p>
                    <div className="mt-4 flex gap-4">
                      {CONTACT.instagramUrl && (
                        <a
                          href={CONTACT.instagramUrl}
                          className="rounded-lg bg-white/10 px-4 py-2 text-sm text-red-100 transition hover:bg-white/20 hover:text-white"
                        >
                          Instagram
                        </a>
                      )}
                      {CONTACT.linkedinUrl && (
                        <a
                          href={CONTACT.linkedinUrl}
                          className="rounded-lg bg-white/10 px-4 py-2 text-sm text-red-100 transition hover:bg-white/20 hover:text-white"
                        >
                          LinkedIn
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Form */}
            <div className="lg:col-span-3">
              <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-xl">
                <h2 className="text-2xl font-bold text-slate-900">
                  Send us a message
                </h2>
                <p className="mt-3 text-sm text-slate-500">
                  Tell us which product you are asking about and we will come
                  back with a straight answer.
                </p>

                {sent && (
                  <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-slate-700">
                    Your email client should have opened with this message ready
                    to send. If it did not, write to{" "}
                    <a
                      href={`mailto:${CONTACT.email}`}
                      className="font-semibold text-[#b10000]"
                    >
                      {CONTACT.email}
                    </a>{" "}
                    directly.
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="mt-8 grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="first-name"
                        className="block text-sm font-semibold text-slate-900"
                      >
                        First name
                      </label>
                      <div className="mt-2">
                        <input
                          id="first-name"
                          name="first-name"
                          type="text"
                          required
                          autoComplete="given-name"
                          className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-[#b10000] focus:ring-2 focus:ring-red-100"
                        />
                      </div>
                    </div>
                    <div>
                      <label
                        htmlFor="last-name"
                        className="block text-sm font-semibold text-slate-900"
                      >
                        Last name
                      </label>
                      <div className="mt-2">
                        <input
                          id="last-name"
                          name="last-name"
                          type="text"
                          autoComplete="family-name"
                          className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-[#b10000] focus:ring-2 focus:ring-red-100"
                        />
                      </div>
                    </div>
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-semibold text-slate-900"
                      >
                        Email
                      </label>
                      <div className="mt-2">
                        <input
                          id="email"
                          name="email"
                          type="email"
                          required
                          autoComplete="email"
                          className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-[#b10000] focus:ring-2 focus:ring-red-100"
                        />
                      </div>
                    </div>
                    <div>
                      <label
                        htmlFor="phone-number"
                        className="block text-sm font-semibold text-slate-900"
                      >
                        Phone number
                      </label>
                      <div className="mt-2">
                        <input
                          id="phone-number"
                          name="phone-number"
                          type="tel"
                          autoComplete="tel"
                          className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-[#b10000] focus:ring-2 focus:ring-red-100"
                        />
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <label
                        htmlFor="restaurant"
                        className="block text-sm font-semibold text-slate-900"
                      >
                        Restaurant or business name
                      </label>
                      <div className="mt-2">
                        <input
                          id="restaurant"
                          name="restaurant"
                          type="text"
                          autoComplete="organization"
                          className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-[#b10000] focus:ring-2 focus:ring-red-100"
                        />
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <label
                        htmlFor="subject"
                        className="block text-sm font-semibold text-slate-900"
                      >
                        What is this about?
                      </label>
                      <div className="mt-2">
                        <select
                          id="subject"
                          name="subject"
                          className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-[#b10000] focus:ring-2 focus:ring-red-100"
                        >
                          <option value="">Select a topic</option>
                          {subjects.map((subject) => (
                            <option key={subject}>{subject}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <label
                        htmlFor="message"
                        className="block text-sm font-semibold text-slate-900"
                      >
                        Message
                      </label>
                      <div className="mt-2">
                        <textarea
                          id="message"
                          name="message"
                          rows={5}
                          required
                          placeholder="How many outlets do you run, and what are you using today?"
                          className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-[#b10000] focus:ring-2 focus:ring-red-100"
                          defaultValue=""
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-slate-500">
                      We only use these details to answer your enquiry.
                    </p>
                    <button
                      type="submit"
                      className="rounded-xl bg-[#b10000] px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-red-200 transition hover:bg-[#8f0000]"
                    >
                      Send message
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import {
  BuildingOffice2Icon,
  EnvelopeIcon,
  PhoneIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

export default function Contact() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />

      <main className="pt-24">
        {/* Hero */}
        <div className="mx-auto max-w-7xl px-6 pb-16 pt-12 text-center lg:px-8">
          <div className="inline-flex items-center rounded-full border border-red-100 bg-red-50 px-4 py-1 text-sm font-medium text-red-700">
            Contact DineInk
          </div>
          <h1 className="mt-6 text-5xl font-bold tracking-tight text-slate-900 sm:text-6xl">
            Get in touch with us
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            Have questions about pricing, restaurant setup, billing, menu
            management or onboarding? Our team is here to help you.
          </p>
        </div>

        {/* Content */}
        <div className="mx-auto max-w-7xl px-6 pb-24 lg:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">

            {/* Info panel */}
            <div className="lg:col-span-2">
              <div className="rounded-[32px] bg-gradient-to-br from-red-900 via-rose-900 to-slate-900 p-8 shadow-2xl h-full">
                <h2 className="text-2xl font-bold text-white">Contact information</h2>
                <p className="mt-3 text-sm text-gray-300">
                  Reach out to us through any of the channels below.
                </p>

                <dl className="mt-10 space-y-8">
                  <div className="flex gap-x-4">
                    <dt className="flex-none">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                        <BuildingOffice2Icon className="h-5 w-5 text-white" />
                      </div>
                    </dt>
                    <dd className="text-sm text-gray-300 pt-2">
                      DineInk Solutions
                      <br />
                      Chennai, Tamil Nadu, India
                    </dd>
                  </div>

                  <div className="flex gap-x-4">
                    <dt className="flex-none">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                        <PhoneIcon className="h-5 w-5 text-white" />
                      </div>
                    </dt>
                    <dd className="pt-2">
                      <a
                        href="tel:+919876543210"
                        className="text-sm text-gray-300 transition hover:text-white"
                      >
                        +91 98765 43210
                      </a>
                    </dd>
                  </div>

                  <div className="flex gap-x-4">
                    <dt className="flex-none">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                        <EnvelopeIcon className="h-5 w-5 text-white" />
                      </div>
                    </dt>
                    <dd className="pt-2">
                      <a
                        href="mailto:support@dineink.com"
                        className="text-sm text-gray-300 transition hover:text-white"
                      >
                        support@dineink.com
                      </a>
                    </dd>
                  </div>

                  <div className="flex gap-x-4">
                    <dt className="flex-none">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                        <ClockIcon className="h-5 w-5 text-white" />
                      </div>
                    </dt>
                    <dd className="text-sm text-gray-300 pt-2">
                      Mon – Sat: 9 AM – 7 PM IST
                      <br />
                      Sunday: Closed
                    </dd>
                  </div>
                </dl>

                <div className="mt-12 border-t border-white/10 pt-8">
                  <p className="text-sm font-semibold text-white">Follow us</p>
                  <div className="mt-4 flex gap-4">
                    <a href="#" className="rounded-lg bg-white/10 px-4 py-2 text-sm text-gray-300 transition hover:bg-white/20 hover:text-white">
                      Instagram
                    </a>
                    <a href="#" className="rounded-lg bg-white/10 px-4 py-2 text-sm text-gray-300 transition hover:bg-white/20 hover:text-white">
                      LinkedIn
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="lg:col-span-3">
              <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-xl">
                <h2 className="text-2xl font-bold text-slate-900">
                  Send us a message
                </h2>
                <p className="mt-3 text-sm text-slate-500">
                  Fill out the form below and we will get back to you soon.
                </p>
                <form action="#" method="POST">
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
                          autoComplete="given-name"
                          className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
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
                          className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
                        />
                      </div>
                    </div>
                    <div className="sm:col-span-2">
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
                          autoComplete="email"
                          className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
                        />
                      </div>
                    </div>
                    <div className="sm:col-span-2">
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
                          className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
                        />
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <label
                        htmlFor="subject"
                        className="block text-sm font-semibold text-slate-900"
                      >
                        Subject
                      </label>
                      <div className="mt-2">
                        <select
                          id="subject"
                          name="subject"
                          className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
                        >
                          <option value="">Select a topic</option>
                          <option>Pricing & Plans</option>
                          <option>Restaurant Setup</option>
                          <option>Billing Help</option>
                          <option>Menu Management</option>
                          <option>Technical Support</option>
                          <option>Other</option>
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
                          className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
                          defaultValue=""
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-8 flex justify-end">
                    <button
                      type="submit"
                      className="rounded-xl bg-red-600 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-red-200 transition hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
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

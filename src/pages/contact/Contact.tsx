import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import {
  BuildingOffice2Icon,
  EnvelopeIcon,
  PhoneIcon,
} from "@heroicons/react/24/outline";

export default function Contact() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="relative isolate bg-white pt-24">
        <div className="mx-auto grid max-w-7xl grid-cols-1 lg:grid-cols-2">
          <div className="relative px-6 pt-24 pb-20 sm:pt-32 lg:static lg:px-8 lg:py-32">
            <div className="mx-auto max-w-xl lg:mx-0 lg:max-w-lg">
              <div className="absolute inset-y-0 left-0 -z-10 w-full overflow-hidden bg-red-50 ring-1 ring-red-100 lg:w-1/2">
                <svg
                  aria-hidden="true"
                  className="absolute inset-0 size-full stroke-red-100 [mask-image:radial-gradient(100%_100%_at_top_right,white,transparent)]"
                >
                  <defs>
                    <pattern
                      x="100%"
                      y={-1}
                      id="contact-pattern"
                      width={200}
                      height={200}
                      patternUnits="userSpaceOnUse"
                    >
                      <path d="M130 200V.5M.5 .5H200" fill="none" />
                    </pattern>
                  </defs>
                  <rect
                    fill="url(#contact-pattern)"
                    width="100%"
                    height="100%"
                    strokeWidth={0}
                  />
                </svg>
                <div
                  aria-hidden="true"
                  className="absolute top-[calc(100%-13rem)] -left-56 hidden transform-gpu blur-3xl lg:block"
                >
                  <div
                    style={{
                      clipPath:
                        "polygon(74.1% 56.1%, 100% 38.6%, 97.5% 73.3%, 85.5% 100%, 80.7% 98.2%, 72.5% 67.7%, 60.2% 37.8%, 52.4% 32.2%, 47.5% 41.9%, 45.2% 65.8%, 27.5% 23.5%, 0.1% 35.4%, 17.9% 0.1%, 27.6% 23.5%, 76.1% 2.6%, 74.1% 56.1%)",
                    }}
                    className="aspect-[1155/678] w-[72rem] bg-gradient-to-br from-red-400 to-rose-700 opacity-10"
                  />
                </div>
              </div>
              <div className="inline-flex items-center rounded-full border border-red-100 bg-red-50 px-4 py-1 text-sm font-medium text-red-700">
                Contact DineInk
              </div>
              <h1 className="mt-6 text-5xl font-bold tracking-tight text-slate-900 sm:text-6xl">
                Get in touch with DineInk
              </h1>
              <p className="mt-6 text-lg leading-8 text-slate-600">
                Have questions about pricing, restaurant setup, billing, menu
                management or onboarding? Our team is here to help you.
              </p>
              <dl className="mt-10 space-y-6 text-base text-slate-600">
                <div className="flex gap-x-4">
                  <dt className="flex-none">
                    <BuildingOffice2Icon
                      aria-hidden="true"
                      className="h-7 w-6 text-red-600"
                    />
                  </dt>
                  <dd>
                    DineInk Solutions
                    <br />
                    Chennai, Tamil Nadu
                    <br />
                    India
                  </dd>
                </div>
                <div className="flex gap-x-4">
                  <dt className="flex-none">
                    <PhoneIcon
                      aria-hidden="true"
                      className="h-7 w-6 text-red-600"
                    />
                  </dt>
                  <dd>
                    <a
                      href="tel:+919876543210"
                      className="transition hover:text-red-600"
                    >
                      +91 98765 43210
                    </a>
                  </dd>
                </div>
                <div className="flex gap-x-4">
                  <dt className="flex-none">
                    <EnvelopeIcon
                      aria-hidden="true"
                      className="h-7 w-6 text-red-600"
                    />
                  </dt>
                  <dd>
                    <a
                      href="mailto:support@dineink.com"
                      className="transition hover:text-red-600"
                    >
                      support@dineink.com
                    </a>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
          <form
            action="#"
            method="POST"
            className="px-6 pt-20 pb-24 sm:pb-32 lg:px-8 lg:py-32"
          >
            <div className="mx-auto max-w-xl rounded-[32px] border border-slate-200 bg-white p-8 shadow-xl lg:mr-0 lg:max-w-lg">
              <h2 className="text-2xl font-bold text-slate-900">
                Send us a message
              </h2>
              <p className="mt-3 text-sm text-slate-500">
                Fill out the form below and we will get back to you soon.
              </p>
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
                      className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
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
                      className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
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
                      className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
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
                      className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
                    />
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
                      className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
                      defaultValue=""
                    />
                  </div>
                </div>
              </div>
              <div className="mt-8 flex justify-end">
                <button
                  type="submit"
                  className="rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-red-200 transition hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                >
                  Send message
                </button>
              </div>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
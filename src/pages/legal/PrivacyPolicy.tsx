import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import { ShieldCheckIcon } from "@heroicons/react/24/outline";

const LAST_UPDATED = "July 25, 2026";

const SECTIONS = [
  { id: "introduction", label: "1. Introduction" },
  { id: "information-we-collect", label: "2. Information We Collect" },
  { id: "how-we-use-information", label: "3. How We Use the Information" },
  { id: "authentication-security", label: "4. Authentication and Account Security" },
  { id: "supplier-website-access", label: "5. Supplier Website Access Explanation" },
  { id: "data-sharing", label: "6. Data Sharing Policy" },
  { id: "cookies-local-storage", label: "7. Cookies and Local Storage" },
  { id: "data-retention", label: "8. Data Retention" },
  { id: "security-measures", label: "9. Security Measures" },
  { id: "third-party-services", label: "10. Third-Party Services" },
  { id: "user-rights", label: "11. User Rights" },
  { id: "contact-information", label: "12. Contact Information" },
  { id: "updates", label: "13. Updates to This Privacy Policy" },
];

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />

      <main className="pt-24">
        {/* Hero */}
        <div className="mx-auto max-w-7xl px-6 pb-12 pt-12 text-center lg:px-8">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-red-100 bg-red-50 px-4 py-1 text-sm font-medium text-[#b10000]">
            <ShieldCheckIcon className="h-4 w-4" />
            Legal
          </div>
          <h1 className="mt-6 text-5xl font-bold tracking-tight text-slate-900 sm:text-6xl">
            Privacy Policy
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            DineInk Procurement Intelligence Chrome Extension
          </p>
          <p className="mt-2 text-sm text-slate-400">
            Last updated: {LAST_UPDATED}
          </p>
        </div>

        {/* Content */}
        <div className="mx-auto max-w-7xl px-6 pb-24 lg:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
            {/* Table of contents */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                  On this page
                </h2>
                <nav className="mt-4 space-y-1">
                  {SECTIONS.map((s) => (
                    <a
                      key={s.id}
                      href={`#${s.id}`}
                      className="block rounded-lg px-2.5 py-1.5 text-sm text-slate-600 transition hover:bg-red-50 hover:text-[#b10000]"
                    >
                      {s.label}
                    </a>
                  ))}
                </nav>
              </div>
            </div>

            {/* Policy body */}
            <div className="lg:col-span-3">
              <div className="space-y-10 rounded-[32px] border border-slate-200 bg-white p-8 shadow-xl sm:p-12">
                <section id="introduction" className="scroll-mt-28">
                  <h2 className="text-2xl font-bold text-slate-900">
                    1. Introduction
                  </h2>
                  <p className="mt-4 text-base leading-7 text-slate-600">
                    This Privacy Policy explains how DineInk ("DineInk", "we",
                    "us", or "our") collects, uses, and protects information
                    in connection with the{" "}
                    <strong className="text-slate-800">
                      DineInk Procurement Intelligence
                    </strong>{" "}
                    Chrome Extension (the "Extension") and its related
                    features inside the DineInk platform. The Extension helps
                    restaurant owners compare ingredient prices across
                    supported supplier platforms directly from their DineInk
                    account.
                  </p>
                  <p className="mt-4 text-base leading-7 text-slate-600">
                    By installing or using the Extension, you agree to the
                    practices described in this policy. If you do not agree,
                    please do not install or use the Extension.
                  </p>
                </section>

                <section id="information-we-collect" className="scroll-mt-28">
                  <h2 className="text-2xl font-bold text-slate-900">
                    2. Information We Collect
                  </h2>
                  <p className="mt-4 text-base leading-7 text-slate-600">
                    The Extension collects only what is necessary to sign you
                    in and to provide procurement price comparisons:
                  </p>
                  <ul className="mt-4 list-disc space-y-2 pl-6 text-base leading-7 text-slate-600">
                    <li>
                      <strong className="text-slate-800">
                        DineInk account credentials
                      </strong>{" "}
                      you enter to sign in to the Extension (email/phone and
                      password) — sent directly to DineInk's own
                      authentication service and never stored by the
                      Extension itself.
                    </li>
                    <li>
                      <strong className="text-slate-800">
                        DineInk session token and basic profile information
                      </strong>{" "}
                      (your name and restaurant name), stored locally in your
                      browser so you stay signed in.
                    </li>
                    <li>
                      <strong className="text-slate-800">
                        Publicly displayed supplier product data
                      </strong>{" "}
                      — product name, price, unit, and stock availability —
                      read from supported supplier websites only when you
                      initiate a search.
                    </li>
                  </ul>
                  <p className="mt-4 text-base leading-7 text-slate-600">
                    The Extension does <strong className="text-slate-800">not</strong>{" "}
                    collect supplier account usernames or passwords, supplier
                    payment or financial information, or your general
                    browsing activity outside the specific supplier searches
                    it performs on your behalf.
                  </p>
                </section>

                <section id="how-we-use-information" className="scroll-mt-28">
                  <h2 className="text-2xl font-bold text-slate-900">
                    3. How We Use the Information
                  </h2>
                  <p className="mt-4 text-base leading-7 text-slate-600">
                    Information collected by the Extension is used solely to:
                  </p>
                  <ul className="mt-4 list-disc space-y-2 pl-6 text-base leading-7 text-slate-600">
                    <li>Authenticate the Extension against your DineInk account.</li>
                    <li>
                      Search supported supplier websites for ingredient
                      pricing when you request a comparison.
                    </li>
                    <li>
                      Synchronize the pricing information found with your
                      DineInk account's Procurement Intelligence feature.
                    </li>
                    <li>
                      Display supplier price comparisons and price history
                      inside DineInk.
                    </li>
                    <li>
                      Maintain and improve the reliability of the extraction
                      and comparison functionality.
                    </li>
                  </ul>
                  <p className="mt-4 text-base leading-7 text-slate-600">
                    Data is only used to provide procurement comparison
                    functionality — it is never used for advertising,
                    profiling, or any purpose unrelated to helping you
                    compare ingredient prices.
                  </p>
                </section>

                <section id="authentication-security" className="scroll-mt-28">
                  <h2 className="text-2xl font-bold text-slate-900">
                    4. Authentication and Account Security
                  </h2>
                  <ul className="mt-4 list-disc space-y-2 pl-6 text-base leading-7 text-slate-600">
                    <li>
                      The Extension signs in using the same authentication
                      system as the DineInk web application — there is no
                      separate account system for the Extension.
                    </li>
                    <li>
                      Your password is transmitted directly and securely to
                      DineInk's servers to authenticate you; it is never
                      stored by the Extension.
                    </li>
                    <li>
                      Only the resulting session token and minimal profile
                      details are kept locally, and only for as long as the
                      session remains valid.
                    </li>
                    <li>
                      Signing out of the Extension immediately clears all
                      locally stored authentication data from your browser.
                    </li>
                  </ul>
                </section>

                <section id="supplier-website-access" className="scroll-mt-28">
                  <h2 className="text-2xl font-bold text-slate-900">
                    5. Supplier Website Access Explanation
                  </h2>
                  <p className="mt-4 text-base leading-7 text-slate-600">
                    The Extension only accesses supported supplier websites
                    (currently Hyperpure, with additional suppliers planned)
                    when you initiate a price comparison from within DineInk
                    — it never browses supplier websites on its own or in
                    the background without your action.
                  </p>
                  <p className="mt-4 text-base leading-7 text-slate-600">
                    When triggered, the Extension opens the supplier's own
                    public search-results page using your existing,
                    authenticated browser session and reads only the product
                    information already visible on that page — product name,
                    price, unit, and stock status. It does not log in on
                    your behalf, does not bypass any authentication, and
                    does not access order history, saved payment methods, or
                    any page beyond the search results it opened.
                  </p>
                  <p className="mt-4 text-base leading-7 text-slate-600">
                    <strong className="text-slate-800">
                      Supplier credentials are never stored by DineInk.
                    </strong>{" "}
                    The Extension has no capability to request, capture, or
                    transmit a supplier account's username or password.
                  </p>
                </section>

                <section id="data-sharing" className="scroll-mt-28">
                  <h2 className="text-2xl font-bold text-slate-900">
                    6. Data Sharing Policy
                  </h2>
                  <ul className="mt-4 list-disc space-y-2 pl-6 text-base leading-7 text-slate-600">
                    <li>
                      <strong className="text-slate-800">
                        DineInk does not sell user data
                      </strong>{" "}
                      to any third party, under any circumstances.
                    </li>
                    <li>
                      Pricing information collected by the Extension is
                      transmitted only to DineInk's own backend, to power
                      the Procurement Intelligence feature for the account
                      that requested it.
                    </li>
                    <li>
                      Aggregated, non-identifying pricing trends (for
                      example, a general price range for an ingredient in a
                      city) may be used to improve comparison accuracy
                      across DineInk, without identifying any individual
                      restaurant or account.
                    </li>
                    <li>
                      Data is not shared with the supplier platforms being
                      compared, with advertisers, or with any other third
                      party for marketing purposes.
                    </li>
                  </ul>
                </section>

                <section id="cookies-local-storage" className="scroll-mt-28">
                  <h2 className="text-2xl font-bold text-slate-900">
                    7. Cookies and Local Storage
                  </h2>
                  <p className="mt-4 text-base leading-7 text-slate-600">
                    The Extension uses the browser's local extension storage
                    (not cookies) to keep you signed in — storing only your
                    DineInk session token and basic profile details. The
                    Extension does not set advertising or tracking cookies,
                    and it does not read, modify, or set cookies on any
                    supplier website.
                  </p>
                </section>

                <section id="data-retention" className="scroll-mt-28">
                  <h2 className="text-2xl font-bold text-slate-900">
                    8. Data Retention
                  </h2>
                  <ul className="mt-4 list-disc space-y-2 pl-6 text-base leading-7 text-slate-600">
                    <li>
                      Your session token is retained locally only until it
                      expires or you sign out, whichever happens first.
                    </li>
                    <li>
                      Pricing data synchronized to your DineInk account is
                      retained as part of your account's procurement
                      history, so you can review price trends over time.
                    </li>
                    <li>
                      Procurement data tied to your account is deleted if
                      your DineInk account is deleted, and you may request
                      earlier deletion at any time (see Section 12).
                    </li>
                  </ul>
                </section>

                <section id="security-measures" className="scroll-mt-28">
                  <h2 className="text-2xl font-bold text-slate-900">
                    9. Security Measures
                  </h2>
                  <ul className="mt-4 list-disc space-y-2 pl-6 text-base leading-7 text-slate-600">
                    <li>
                      <strong className="text-slate-800">
                        All data is transmitted securely over HTTPS
                      </strong>{" "}
                      between the Extension, your browser, and DineInk's
                      servers.
                    </li>
                    <li>
                      Every request to DineInk's backend is authenticated
                      and scoped to your specific account.
                    </li>
                    <li>
                      Session tokens expire automatically and are never
                      stored anywhere except your own browser's local
                      extension storage.
                    </li>
                    <li>
                      Because supplier credentials are never requested or
                      processed, an entire category of credential-related
                      risk simply does not apply to the Extension.
                    </li>
                  </ul>
                </section>

                <section id="third-party-services" className="scroll-mt-28">
                  <h2 className="text-2xl font-bold text-slate-900">
                    10. Third-Party Services
                  </h2>
                  <p className="mt-4 text-base leading-7 text-slate-600">
                    The Extension reads publicly displayed pricing
                    information from third-party supplier websites (such as
                    Hyperpure) solely to power price comparisons. DineInk is
                    not affiliated with these suppliers, and this policy
                    does not cover their own privacy practices — please
                    refer to each supplier's own privacy policy for how they
                    handle your data on their platform.
                  </p>
                  <p className="mt-4 text-base leading-7 text-slate-600">
                    DineInk's backend runs on standard cloud infrastructure
                    used to operate the service; no user data is shared with
                    infrastructure providers beyond what is necessary to run
                    DineInk.
                  </p>
                </section>

                <section id="user-rights" className="scroll-mt-28">
                  <h2 className="text-2xl font-bold text-slate-900">
                    11. User Rights
                  </h2>
                  <ul className="mt-4 list-disc space-y-2 pl-6 text-base leading-7 text-slate-600">
                    <li>
                      You may request access to, correction of, or deletion
                      of personal data DineInk holds about you.
                    </li>
                    <li>
                      You may sign out of the Extension at any time to clear
                      its locally stored session immediately.
                    </li>
                    <li>
                      You may uninstall the Extension at any time, which
                      removes all data it stored locally in that browser.
                    </li>
                    <li>
                      You may reach out using the contact details below to
                      exercise any of these rights.
                    </li>
                  </ul>
                </section>

                <section id="contact-information" className="scroll-mt-28">
                  <h2 className="text-2xl font-bold text-slate-900">
                    12. Contact Information
                  </h2>
                  <p className="mt-4 text-base leading-7 text-slate-600">
                    If you have questions about this Privacy Policy or how
                    your data is handled, please contact us:
                  </p>
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-6">
                    <p className="text-sm text-slate-600">
                      Email:{" "}
                      <a
                        href="mailto:support@dineink.in"
                        className="font-semibold text-[#b10000] hover:underline"
                      >
                        support@dineink.in
                      </a>
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      Website:{" "}
                      <a
                        href="https://www.dineink.in"
                        className="font-semibold text-[#b10000] hover:underline"
                      >
                        https://www.dineink.in
                      </a>
                    </p>
                  </div>
                </section>

                <section id="updates" className="scroll-mt-28">
                  <h2 className="text-2xl font-bold text-slate-900">
                    13. Updates to This Privacy Policy
                  </h2>
                  <p className="mt-4 text-base leading-7 text-slate-600">
                    We may update this Privacy Policy from time to time to
                    reflect changes to the Extension or applicable legal
                    requirements. Material changes will be reflected by
                    updating the "Last updated" date at the top of this
                    page. We encourage you to review this page periodically.
                    Continued use of the Extension after changes take effect
                    constitutes acceptance of the updated policy.
                  </p>
                </section>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

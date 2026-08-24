import { Link } from "react-router-dom";

import mobileAppScreen from "../../assets/images/Mobile-App-Screen.png";

const proofPoints = [
  "Free to start",
  "No credit card",
  "Published pricing — no sales call",
];

export default function HeroSection() {
  return (
    <div className="relative isolate overflow-hidden bg-gradient-to-br from-red-50 via-white to-rose-100 pt-14">
      <svg
        aria-hidden="true"
        className="absolute inset-0 -z-10 size-full mask-[radial-gradient(100%_100%_at_top_right,white,transparent)] stroke-gray-200"
      >
        <defs>
          <pattern
            x="50%"
            y={-1}
            id="83fd4e5a-9d52-42fc-97b6-718e5d7ee527"
            width={200}
            height={200}
            patternUnits="userSpaceOnUse"
          >
            <path d="M100 200V.5M.5 .5H200" fill="none" />
          </pattern>
        </defs>
        <svg x="50%" y={-1} className="overflow-visible fill-gray-50">
          <path
            d="M-100.5 0h201v201h-201Z M699.5 0h201v201h-201Z M499.5 400h201v201h-201Z M-300.5 600h201v201h-201Z"
            strokeWidth={0}
          />
        </svg>
        <rect
          fill="url(#83fd4e5a-9d52-42fc-97b6-718e5d7ee527)"
          width="100%"
          height="100%"
          strokeWidth={0}
        />
      </svg>
      <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:flex lg:items-center lg:gap-x-12 lg:px-8 lg:py-40">
        <div className="mx-auto max-w-2xl lg:mx-0 lg:flex-auto">
          <div className="flex">
            <div className="inline-flex items-center gap-x-3 rounded-full bg-white px-4 py-1.5 text-sm text-slate-600 ring-1 ring-red-100">
              <span className="font-semibold text-[#b10000]">Now live</span>
              <span aria-hidden="true" className="h-4 w-px bg-slate-900/10" />
              <span>Built for Indian restaurants</span>
            </div>
          </div>

          <h1 className="mt-10 text-5xl font-bold tracking-tight text-slate-900 sm:text-6xl">
            Every other POS tells you what you sold.
            <span className="mt-3 block text-[#b10000]">
              DineInk tells you what you earned.
            </span>
          </h1>

          <p className="mt-8 text-lg leading-8 text-slate-600 sm:text-xl">
            Billing, kitchen display and ingredient-level inventory — plus the
            layer no other POS ships: a real P&amp;L, budget-vs-actual variance,
            cash-flow prediction and what-if scenarios. GST-compliant, offline
            first, and it never stops for a dropped connection.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              to="/signup"
              className="rounded-xl bg-[#b10000] px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-red-200/60 transition hover:bg-[#8f0000]"
            >
              Start free
            </Link>
            <Link
              to="/pricing"
              className="rounded-xl border border-slate-300 bg-white/60 px-6 py-3.5 text-sm font-semibold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-[#b10000]"
            >
              See pricing
            </Link>
          </div>

          <ul className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-500">
            {proofPoints.map((point) => (
              <li key={point} className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="h-1.5 w-1.5 rounded-full bg-[#b10000]"
                />
                {point}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-16 sm:mt-24 lg:mt-0 lg:shrink-0 lg:grow">
          <svg
            role="img"
            viewBox="0 0 366 729"
            className="mx-auto w-91.5 max-w-full drop-shadow-[0_25px_50px_rgba(177,0,0,0.18)]"
          >
            <title>The DineInk owner dashboard on mobile</title>
            <defs>
              <clipPath id="2ade4387-9c63-4fc4-b754-10e687a0d332">
                <rect rx={36} width={316} height={684} />
              </clipPath>
            </defs>
            <path
              d="M363.315 64.213C363.315 22.99 341.312 1 300.092 1H66.751C25.53 1 3.528 22.99 3.528 64.213v44.68l-.857.143A2 2 0 0 0 1 111.009v24.611a2 2 0 0 0 1.671 1.973l.95.158a2.26 2.26 0 0 1-.093.236v26.173c.212.1.398.296.541.643l-1.398.233A2 2 0 0 0 1 167.009v47.611a2 2 0 0 0 1.671 1.973l1.368.228c-.139.319-.314.533-.511.653v16.637c.221.104.414.313.56.689l-1.417.236A2 2 0 0 0 1 237.009v47.611a2 2 0 0 0 1.671 1.973l1.347.225c-.135.294-.302.493-.49.607v377.681c0 41.213 22 63.208 63.223 63.208h95.074c.947-.504 2.717-.843 4.745-.843l.141.001h.194l.086-.001 33.704.005c1.849.043 3.442.37 4.323.838h95.074c41.222 0 63.223-21.999 63.223-63.212v-394.63c-.259-.275-.48-.796-.63-1.47l-.011-.133 1.655-.276A2 2 0 0 0 366 266.62v-77.611a2 2 0 0 0-1.671-1.973l-1.712-.285c.148-.839.396-1.491.698-1.811V64.213Z"
              fill="#3F3F46"
            />
            <path
              d="M16 59c0-23.748 19.252-43 43-43h246c23.748 0 43 19.252 43 43v615c0 23.196-18.804 42-42 42H58c-23.196 0-42-18.804-42-42V59Z"
              fill="#18181B"
            />
            <foreignObject
              width={316}
              height={684}
              clipPath="url(#2ade4387-9c63-4fc4-b754-10e687a0d332)"
              transform="translate(24 24)"
            >
              <img alt="" src={mobileAppScreen} />
            </foreignObject>
          </svg>
        </div>
      </div>
    </div>
  );
}

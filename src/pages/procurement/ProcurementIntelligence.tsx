import { useState } from "react";
import {
  ScaleIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  PuzzlePieceIcon,
  LockClosedIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";
import { useAppSelector } from "@/store";
import MobileTableCards from "@/components/common/MobileTableCards";

const API_URL = import.meta.env.VITE_API_URL;
const EXTENSION_ID = import.meta.env.VITE_PROCUREMENT_EXTENSION_ID;
// Not published to the Chrome Web Store yet — set this once a real listing
// exists. Until then the Install button below is shown but inert, with a
// note explaining why, rather than linking somewhere fake.
const INSTALL_URL = import.meta.env.VITE_PROCUREMENT_EXTENSION_INSTALL_URL as
  | string
  | undefined;

const SUPPLIERS = [
  { key: "HYPERPURE", name: "Hyperpure" },
  { key: "ZEPTO_BUSINESS", name: "Zepto Business" },
  { key: "INSTAMART", name: "Instamart" },
];

interface PriceRow {
  supplierId: number;
  supplierCode: string;
  supplierName: string;
  productName: string;
  price: number;
  unit: string;
  availability: "IN_STOCK" | "LIMITED_STOCK" | "OUT_OF_STOCK" | "UNKNOWN";
  currency: string;
  capturedAt: string;
  source: "LIVE" | "MOCK";
}

interface ExtensionResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

// Talks to the DineInk Procurement extension's background service worker via
// externally_connectable (see extension/manifest.json). Resolves to a
// failure response rather than throwing when the extension isn't installed,
// isn't reachable, or the browser has no chrome.runtime at all (e.g. non-Chromium
// browsers).
const sendMessageToExtension = <T = any,>(
  message: object,
  timeoutMs?: number,
): Promise<ExtensionResponse<T>> => {
  return new Promise((resolve) => {
    const runtime = (window as any).chrome?.runtime;
    if (!runtime?.sendMessage || !EXTENSION_ID) {
      resolve({
        success: false,
        message: "Procurement extension not detected",
      });
      return;
    }

    let settled = false;
    const timer = timeoutMs
      ? setTimeout(() => {
          if (!settled) {
            settled = true;
            resolve({
              success: false,
              message: "Procurement extension not detected",
            });
          }
        }, timeoutMs)
      : null;

    try {
      runtime.sendMessage(
        EXTENSION_ID,
        message,
        (response: ExtensionResponse<T>) => {
          if (settled) return;
          settled = true;
          if (timer) clearTimeout(timer);
          if (runtime.lastError) {
            resolve({ success: false, message: runtime.lastError.message });
            return;
          }
          resolve(
            response ?? {
              success: false,
              message: "No response from extension",
            },
          );
        },
      );
    } catch (err) {
      if (!settled) {
        settled = true;
        if (timer) clearTimeout(timer);
        resolve({
          success: false,
          message:
            err instanceof Error ? err.message : "Failed to reach extension",
        });
      }
    }
  });
};

const availabilityStyle: Record<string, string> = {
  IN_STOCK: "bg-emerald-50 text-emerald-700",
  LIMITED_STOCK: "bg-amber-50 text-amber-700",
  OUT_OF_STOCK: "bg-red-50 text-red-700",
  UNKNOWN: "bg-gray-100 text-gray-500",
};

const availabilityLabel: Record<string, string> = {
  IN_STOCK: "In Stock",
  LIMITED_STOCK: "Limited Stock",
  OUT_OF_STOCK: "Out of Stock",
  UNKNOWN: "Unknown",
};

const formatCapturedAt = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });

type CompareStatus = "idle" | "not_installed" | "not_logged_in" | "results";

export default function ProcurementIntelligence() {
  const { token } = useAppSelector((s) => s.auth);

  const [search, setSearch] = useState("");
  const [submittedTerm, setSubmittedTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [status, setStatus] = useState<CompareStatus>("idle");
  const [results, setResults] = useState<PriceRow[]>([]);
  const [cheapestSupplierCode, setCheapestSupplierCode] = useState<
    string | null
  >(null);

  const fetchPrices = async (term: string) => {
    if (!token) return;
    const res = await fetch(
      `${API_URL}/api/procurement/prices?term=${encodeURIComponent(term)}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    const body = await res.json();
    if (body.success) {
      setResults(body.data.results || []);
      setCheapestSupplierCode(body.data.cheapestSupplierCode ?? null);
      setStatus("results");
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const term = search.trim();
    if (!term) return;

    setSubmittedTerm(term);
    setLoading(true);
    setNotice(null);
    setResults([]);
    setCheapestSupplierCode(null);
    setStatus("idle");

    try {
      // 1. Is the extension installed at all? A quick PING that isn't
      // installed resolves almost instantly with a lastError, but bound it
      // anyway so a genuinely wedged browser can't hang the button forever.
      const ping = await sendMessageToExtension({ type: "PING" }, 2500);
      if (!ping.success) {
        setStatus("not_installed");
        return;
      }

      // 2. Installed — but is anyone signed in?
      const statusResult = await sendMessageToExtension<{
        authenticated: boolean;
      }>({ type: "GET_STATUS" }, 2500);
      if (!statusResult.success || !statusResult.data?.authenticated) {
        setStatus("not_logged_in");
        return;
      }

      // 3. Installed and signed in — do the real fetch. This can take a
      // while (the extension opens a hidden supplier tab), so no client
      // timeout here; the extension bounds its own attempt internally.
      const fetchResult = await sendMessageToExtension({
        type: "FETCH_PRICES",
        payload: { term },
      });
      if (!fetchResult.success) {
        setNotice(
          `Couldn't refresh live prices (${fetchResult.message}) — showing the latest cached data instead.`,
        );
      }

      await fetchPrices(term);
    } finally {
      setLoading(false);
    }
  };

  const showTable = status === "idle" || status === "results";

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto flex w-full  flex-col gap-3">
        {/* Header */}
        <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
          <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-red-100/50 blur-3xl" />
          <div className="relative z-10 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#b10000] shadow-sm">
                <ScaleIcon className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-gray-900">
                  Procurement Intelligence
                </h1>
                <p className="mt-0.5 text-[12px] text-gray-500">
                  Compare ingredient prices across Hyperpure, Zepto Business &
                  Instamart
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {SUPPLIERS.map((s) => (
                <div
                  key={s.key}
                  className="flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-2.5 py-1.5 shadow-sm"
                >
                  <p className="text-[11px] font-bold text-blue-700">
                    {s.name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-3">
            <h2 className="text-[17px] font-bold text-gray-900">
              Search an Ingredient
            </h2>
            <p className="text-[11px] text-gray-500">
              Find the cheapest supplier for any ingredient in seconds
            </p>
          </div>
          <form
            onSubmit={handleSearch}
            className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center"
          >
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="e.g. Milk, Tomato, Paneer..."
                className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-3 text-[12px] outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
              />
            </div>
            <button
              type="submit"
              disabled={!search.trim() || loading}
              className={`flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-[12px] font-bold shadow-sm transition ${
                !search.trim()
                  ? "cursor-not-allowed bg-gray-200 text-gray-400"
                  : "bg-[#b10000] text-white hover:bg-[#950000] disabled:cursor-not-allowed disabled:opacity-60"
              }`}
            >
              {loading ? (
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                <MagnifyingGlassIcon className="h-3.5 w-3.5" />
              )}
              {loading ? "Comparing..." : "Compare Prices"}
            </button>
          </form>
        </div>

        {/* Notice — only shown once we know the extension is installed and
            signed in, but this particular fetch attempt still failed
            (e.g. Hyperpure timed out). Falls back to cached backend data. */}
        {notice && (
          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5">
            <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            <p className="text-[11px] text-amber-800">{notice}</p>
          </div>
        )}

        {/* Extension not installed — no cached/mock data shown, just the CTA. */}
        {status === "not_installed" && (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-gray-200 bg-white px-5 py-14 text-center shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
              <PuzzlePieceIcon className="h-6 w-6 text-[#b10000]" />
            </div>
            <div>
              <p className="text-[14px] font-bold text-gray-900">
                Procurement extension required
              </p>
              <p className="mx-auto mt-1 max-w-sm text-[12px] text-gray-500">
                Live price comparison needs the DineInk Procurement Chrome
                extension installed in this browser. Install it to compare
                Hyperpure, Zepto Business & Instamart in seconds.
              </p>
            </div>
            {INSTALL_URL ? (
              <a
                href={INSTALL_URL}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-xl bg-[#b10000] px-4 py-2.5 text-[12px] font-bold text-white shadow-sm transition hover:bg-[#950000]"
              >
                Install Extension{" "}
                <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
              </a>
            ) : (
              <div>
                <button
                  disabled
                  title="Chrome Web Store listing not published yet"
                  className="flex cursor-not-allowed items-center gap-1.5 rounded-xl bg-gray-200 px-4 py-2.5 text-[12px] font-bold text-gray-500"
                >
                  Install Extension
                </button>
                <p className="mt-1.5 text-[10px] text-gray-400">
                  Chrome Web Store listing coming soon
                </p>
              </div>
            )}
          </div>
        )}

        {/* Extension installed but no one is signed in. */}
        {status === "not_logged_in" && (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-gray-200 bg-white px-5 py-14 text-center shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50">
              <LockClosedIcon className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-[14px] font-bold text-gray-900">
                Sign in to the extension
              </p>
              <p className="mx-auto mt-1 max-w-sm text-[12px] text-gray-500">
                The Procurement extension is installed but you're not signed in.
                Click its icon in your browser toolbar and sign in with your
                DineInk account, then try again.
              </p>
            </div>
          </div>
        )}

        {/* Results table — only for the idle prompt and real results, never
            as a stand-in for a missing/unauthenticated extension. */}
        {showTable && (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
              <div>
                <h2 className="text-[17px] font-bold text-gray-900">
                  {submittedTerm
                    ? `Results for "${submittedTerm}"`
                    : "Supplier Comparison"}
                </h2>
                <p className="text-[11px] text-gray-500">
                  Supplier, price, unit and availability side by side
                </p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <MobileTableCards>
              <table className="min-w-full text-[12px]">
                <thead className="border-b border-gray-100 bg-gray-50">
                  <tr>
                    {[
                      "Supplier",
                      "Price",
                      "Unit",
                      "Availability",
                      "Last Updated",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.length > 0 ? (
                    results.map((r) => {
                      const isCheapest =
                        r.supplierCode === cheapestSupplierCode;
                      return (
                        <tr
                          key={r.supplierId}
                          className={`border-b border-gray-50 transition ${isCheapest ? "bg-emerald-50/40" : "hover:bg-gray-50/60"}`}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-900">
                                {r.supplierName}
                              </span>
                              {isCheapest && (
                                <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700">
                                  Cheapest
                                </span>
                              )}
                              {r.source === "MOCK" && (
                                <span
                                  title="No live data captured yet for this ingredient — showing an estimate"
                                  className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[9px] font-bold text-gray-500"
                                >
                                  Estimated
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 truncate text-[10px] text-gray-400">
                              {r.productName}
                            </p>
                          </td>
                          <td className="px-4 py-3 font-bold text-gray-900">
                            ₹{r.price.toLocaleString("en-IN")}
                          </td>
                          <td className="px-4 py-3 text-gray-600">{r.unit}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${availabilityStyle[r.availability] || availabilityStyle.UNKNOWN}`}
                            >
                              {availabilityLabel[r.availability] || "Unknown"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-500">
                            {formatCapturedAt(r.capturedAt)}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-16 text-center text-[12px] text-gray-400"
                      >
                        {loading
                          ? "Comparing prices across suppliers..."
                          : "Search an ingredient above to compare live prices across suppliers"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              </MobileTableCards>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

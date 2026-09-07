import { useState, useEffect } from "react";
import { useAppSelector } from "@/store";
import {
  useGetDailyAuditPreviewQuery,
  useSubmitDailyAuditMutation,
} from "@/store/api/operationsApi";
import { formatQty } from "@/utils/units";
import {
  ClipboardDocumentCheckIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";

export default function DailyStockAudit() {
  const { selectedBranch } = useAppSelector((s) => s.branch);
  const { user } = useAppSelector((s) => s.auth);

  const todayStr = new Date().toISOString().slice(0, 10);
  const [auditDate, setAuditDate] = useState(todayStr);
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);
  const [search, setSearch] = useState("");
  // closingQty inputs keyed by ingredientId
  const [closingInputs, setClosingInputs] = useState<Record<number, string>>({});
  const [notesInputs, setNotesInputs] = useState<Record<number, string>>({});

  /**
   * The preview seeds two editable drafts — a closing quantity and a note per
   * ingredient — so the rows are seeded from the query rather than read off it.
   *
   * Re-seeding whenever the payload changes is what the old code did: filing an
   * audit called fetchPreview() again, and changing the date refetched. The
   * submit invalidates StockAudit, so both still happen.
   */
  const { data: preview, isFetching: loading } = useGetDailyAuditPreviewQuery(
    { branchId: selectedBranch?.id as number, date: auditDate },
    { skip: !selectedBranch?.id || !user?.restaurantId },
  );
  const [submitDailyAudit] = useSubmitDailyAuditMutation();

  useEffect(() => {
    if (!preview) return;
    const rows: any[] = Array.isArray(preview) ? preview : [];
    setIngredients(rows);

    // Pre-fill from an already-saved audit if one exists for this date;
    // otherwise default to the calculated Expected value instead of leaving it
    // blank — with 200+ ingredients, typing every single closing qty from
    // scratch isn't realistic. Staff only need to correct the rows where their
    // physical count actually differs; anything left untouched saves as
    // "matched expected, no wastage", which is exactly what a real, uneventful
    // count would show anyway.
    const initClosing: Record<number, string> = {};
    const initNotes: Record<number, string> = {};
    for (const ing of rows) {
      if (ing.closingQty !== null) initClosing[ing.ingredientId] = String(ing.closingQty);
      else if (ing.expectedClosing !== null && ing.expectedClosing !== undefined)
        initClosing[ing.ingredientId] = String(ing.expectedClosing);
      if (ing.notes) initNotes[ing.ingredientId] = ing.notes;
    }
    setClosingInputs(initClosing);
    setNotesInputs(initNotes);
  }, [preview]);

  const handleSave = async () => {
    if (!selectedBranch?.id) return;
    const entries = ingredients
      .filter((ing) => closingInputs[ing.ingredientId] !== undefined && closingInputs[ing.ingredientId] !== "")
      .map((ing) => ({
        ingredientId: ing.ingredientId,
        openingQty: ing.openingQty,
        sopConsumed: ing.sopConsumed,
        closingQty: Number(closingInputs[ing.ingredientId]),
        notes: notesInputs[ing.ingredientId] || "",
      }));

    if (entries.length === 0) { alert("Enter at least one closing stock value."); return; }

    setSaving(true);
    try {
      await submitDailyAudit({
        branchId: selectedBranch.id,
        date: auditDate,
        entries,
      }).unwrap();
      setSavedOk(true);
      // The preview refetches from the tag; no second call by hand.
    } catch { alert("Failed to save"); }
    setSaving(false);
  };

  // Quantities arrive from the API in the canonical unit (Kg/Litre/Piece);
  // this auto-scales small amounts to grams/ml so they're readable.
  const fmt = (n: number, unit: string) => formatQty(n, unit);

  const filtered = ingredients.filter((ing) =>
    ing.name.toLowerCase().includes(search.toLowerCase()),
  );

  // Summary
  const filledCount = ingredients.filter(
    (ing) => closingInputs[ing.ingredientId] !== undefined && closingInputs[ing.ingredientId] !== "",
  ).length;
  // Positive = wastage, negative = under-used. Summed as-is so the total
  // reflects net stock variance, not just one-directional loss.
  const totalWastage = ingredients.reduce((sum, ing) => {
    const cv = closingInputs[ing.ingredientId];
    if (cv === undefined || cv === "") return sum;
    const wastage = ing.expectedClosing - Number(cv);
    return sum + wastage;
  }, 0);
  const totalWastageCost = ingredients.reduce((sum, ing) => {
    const cv = closingInputs[ing.ingredientId];
    if (cv === undefined || cv === "" || !ing.pricePerUnit) return sum;
    const wastage = ing.expectedClosing - Number(cv);
    return sum + Math.max(0, wastage) * ing.pricePerUnit;
  }, 0);

  return (
    <main className="min-h-screen bg-gray-50 pb-10 pt-6">
      <div className="flex w-full flex-col gap-3">

        {/* Header */}
        <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
          <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-red-100/50 blur-3xl" />
          <div className="relative z-10 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#b10000] shadow-sm">
                <ClipboardDocumentCheckIcon className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-gray-900">
                  Daily Stock Audit
                </h1>
                <p className="mt-0.5 text-[12px] text-gray-500">
                  Enter end-of-day actual stock to calculate wastage
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {filledCount > 0 && (
                <>
                  <div className="flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-2.5 py-1.5 shadow-sm">
                    <div>
                      <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-blue-700 opacity-70">
                        Filled
                      </p>
                      <p className="text-[13px] font-black leading-none text-blue-700">
                        {filledCount} / {ingredients.length}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`flex items-center gap-2 rounded-xl border px-2.5 py-1.5 shadow-sm ${
                      totalWastage < 0
                        ? "border-sky-100 bg-sky-50"
                        : "border-red-100 bg-red-50"
                    }`}
                  >
                    <div>
                      <p
                        className={`text-[8px] font-bold uppercase tracking-[0.12em] opacity-70 ${
                          totalWastage < 0 ? "text-sky-700" : "text-red-700"
                        }`}
                      >
                        {totalWastage < 0 ? "Net Under-used" : "Net Wastage"}
                      </p>
                      <p
                        className={`text-[13px] font-black leading-none ${
                          totalWastage < 0 ? "text-sky-700" : "text-red-700"
                        }`}
                      >
                        {Math.abs(totalWastage).toFixed(2)} units
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl border border-amber-100 bg-amber-50 px-2.5 py-1.5 shadow-sm">
                    <div>
                      <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-amber-700 opacity-70">
                        Wastage Cost
                      </p>
                      <p className="text-[13px] font-black leading-none text-amber-700">
                        ₹{totalWastageCost.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                  </div>
                </>
              )}
              <input
                type="date"
                value={auditDate}
                onChange={(e) => setAuditDate(e.target.value)}
                className="h-9 rounded-xl border border-gray-200 bg-white px-3 text-[12px] font-medium text-gray-700 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
              />
            </div>
          </div>
        </div>

        {/* Formula hint */}
        <div className="flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-2.5 text-[11px] text-blue-700">
          <InformationCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            <strong>Wastage</strong> = (Opening Stock − SOP Consumption) − Actual Closing Stock.
            A positive number means more was used than expected; a negative number means less was used (under-used).
          </p>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
            <div>
              <h2 className="text-[17px] font-bold text-gray-900">Ingredients</h2>
              <p className="text-[11px] text-gray-500">
                {filtered.length} of {ingredients.length} ingredients
              </p>
            </div>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              <input
                placeholder="Search ingredient..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-64 rounded-xl border border-gray-200 bg-white pl-8 pr-3 text-[12px] outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
              />
            </div>
          </div>

          {/* Column headers */}
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1.4fr_1fr] gap-2 border-b border-gray-100 bg-gray-50 px-5 py-2.5 text-[10px] font-bold uppercase tracking-wide text-gray-500">
            <span>Ingredient</span>
            <span className="text-right">Opening</span>
            <span className="text-right">SOP Used</span>
            <span className="text-right">Expected</span>
            <span className="text-center">Actual Closing</span>
            <span className="text-right">Wastage</span>
          </div>

          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-red-500" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <ClipboardDocumentCheckIcon className="h-8 w-8 text-gray-300" />
              <p className="text-[12px] text-gray-400">
                {search
                  ? "No ingredients match your search"
                  : "No ingredients found for this branch"}
              </p>
            </div>
          ) : (
            filtered.map((ing) => {
              const cv = closingInputs[ing.ingredientId];
              const hasValue = cv !== undefined && cv !== "";
              const closingNum = hasValue ? Number(cv) : null;
              // Positive = wastage (used more than expected), negative = under-used.
              const wastage = closingNum !== null ? ing.expectedClosing - closingNum : null;
              const wastagePct = wastage !== null && ing.openingQty > 0
                ? ((wastage / ing.openingQty) * 100).toFixed(1)
                : null;
              const wastageCost = wastage !== null && wastage > 0 && ing.pricePerUnit > 0
                ? wastage * ing.pricePerUnit
                : null;
              const wastageColor =
                wastage === null ? "" :
                wastage < 0 ? "text-blue-600" :
                wastagePct !== null && Number(wastagePct) > 15 ? "text-red-600" :
                wastagePct !== null && Number(wastagePct) > 8 ? "text-amber-600" :
                "text-emerald-600";

              return (
                <div
                  key={ing.ingredientId}
                  className={`border-b border-gray-50 px-5 py-3 transition last:border-0 hover:bg-gray-50/50 ${ing.auditSaved ? "bg-emerald-50/30" : ""}`}
                >
                  <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1.4fr_1fr] items-center gap-2">
                    {/* Ingredient name */}
                    <div>
                      <p className="text-[12px] font-semibold text-gray-800">{ing.name}</p>
                      <p className="text-[10px] text-gray-400">{ing.unit}{ing.pricePerUnit ? ` · ₹${ing.pricePerUnit}/unit` : ""}</p>
                      {ing.auditSaved && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-emerald-600">
                          <CheckCircleIcon className="h-2.5 w-2.5" /> Saved
                        </span>
                      )}
                    </div>
                    {/* Opening */}
                    <p className="text-right text-[12px] text-gray-600">{fmt(ing.openingQty, ing.unit)}</p>
                    {/* SOP consumed */}
                    <p className="text-right text-[12px] text-emerald-700">{fmt(ing.sopConsumed, ing.unit)}</p>
                    {/* Expected closing */}
                    <p className="text-right text-[12px] font-semibold text-blue-700">{fmt(ing.expectedClosing, ing.unit)}</p>
                    {/* Actual closing input */}
                    <div className="flex justify-center">
                      <input
                        type="number"
                        step="0.001"
                        min="0"
                        placeholder="Qty"
                        value={closingInputs[ing.ingredientId] ?? ""}
                        onKeyDown={(e) => {
                          if (e.key === "-" || e.key === "Minus") e.preventDefault();
                        }}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v !== "" && Number(v) < 0) return;
                          setClosingInputs((prev) => ({ ...prev, [ing.ingredientId]: v }));
                        }}
                        className={`w-20 rounded-lg border px-2 py-1 text-center text-[12px] outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100 ${
                          hasValue
                            ? wastage !== null && wastage > 0
                              ? "border-red-200 bg-red-50"
                              : wastage !== null && wastage < 0
                                ? "border-blue-200 bg-blue-50"
                                : "border-emerald-200 bg-emerald-50"
                            : "border-gray-200"
                        }`}
                      />
                    </div>
                    {/* Wastage */}
                    <div className="text-right">
                      {wastage !== null ? (
                        <>
                          <p className={`text-[12px] font-bold ${wastageColor}`}>
                            {wastage === 0 ? "0" : wastage > 0 ? fmt(wastage, ing.unit) : `${fmt(Math.abs(wastage), ing.unit)} under`}
                          </p>
                          {wastagePct !== null && (
                            <p className={`text-[10px] ${wastageColor}`}>{wastage < 0 ? Math.abs(Number(wastagePct)) : wastagePct}%</p>
                          )}
                          {wastageCost !== null && wastageCost > 0 && (
                            <p className="text-[10px] text-gray-500">₹{wastageCost.toFixed(0)}</p>
                          )}
                        </>
                      ) : (
                        <span className="text-[11px] text-gray-300">—</span>
                      )}
                    </div>
                  </div>
                  {/* Notes row */}
                  {hasValue && (
                    <div className="mt-1.5">
                      <input
                        type="text"
                        placeholder="Notes (optional)"
                        value={notesInputs[ing.ingredientId] ?? ""}
                        onChange={(e) =>
                          setNotesInputs((prev) => ({ ...prev, [ing.ingredientId]: e.target.value }))
                        }
                        className="w-full rounded-lg border border-gray-100 bg-gray-50 px-2.5 py-1.5 text-[11px] text-gray-600 placeholder-gray-300 outline-none focus:border-red-200 focus:ring-2 focus:ring-red-100"
                      />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Save button */}
        {!loading && filtered.length > 0 && (
          <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-5 py-3 shadow-sm">
            {savedOk ? (
              <p className="flex items-center gap-1.5 text-[12px] font-semibold text-emerald-600">
                <CheckCircleIcon className="h-4 w-4" /> Audit saved successfully
              </p>
            ) : (
              <span />
            )}
            <button
              onClick={handleSave}
              disabled={saving || filledCount === 0}
              className="rounded-xl bg-[#b10000] px-6 py-2.5 text-[13px] font-semibold text-white shadow-sm transition hover:bg-[#900000] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving…" : `Save Audit (${filledCount} entries)`}
            </button>
          </div>
        )}

        {/* Legend */}
        <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-gray-400">
            Column Guide
          </p>
          <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-500 sm:grid-cols-3">
            <span><span className="font-semibold text-gray-700">Opening</span> — stock at start of day</span>
            <span><span className="font-semibold text-emerald-700">SOP Used</span> — Σ(orders × recipe qty)</span>
            <span><span className="font-semibold text-blue-700">Expected</span> — Opening − SOP Used</span>
            <span><span className="font-semibold text-gray-700">Actual Closing</span> — pre-filled with Expected; edit only where your physical count differs</span>
            <span><span className="font-semibold text-red-700">Wastage</span> — Expected − Actual</span>
            <span><span className="font-semibold text-blue-600">Under-used</span> — Actual &gt; Expected</span>
          </div>
        </div>

      </div>
    </main>
  );
}

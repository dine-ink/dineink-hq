import { useState, useEffect, useCallback } from "react";
import { useAppSelector } from "@/store";
import { formatQty } from "@/utils/units";

export default function DailyStockAudit() {
  const API_URL = import.meta.env.VITE_API_URL;
  const { selectedBranch } = useAppSelector((s) => s.branch);
  const { user, token } = useAppSelector((s) => s.auth);

  const todayStr = new Date().toISOString().slice(0, 10);
  const [auditDate, setAuditDate] = useState(todayStr);
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);
  const [search, setSearch] = useState("");
  // closingQty inputs keyed by ingredientId
  const [closingInputs, setClosingInputs] = useState<Record<number, string>>({});
  const [notesInputs, setNotesInputs] = useState<Record<number, string>>({});

  const headers = { Authorization: `Bearer ${token}` };

  const fetchPreview = useCallback(async () => {
    if (!selectedBranch?.id || !user?.restaurantId) return;
    setLoading(true);
    setSavedOk(false);
    try {
      const res = await fetch(
        `${API_URL}/api/inventory/daily-audit/preview?branchId=${selectedBranch.id}&date=${auditDate}`,
        { headers },
      );
      const json = await res.json();
      if (json.success) {
        setIngredients(json.data || []);
        // Pre-fill inputs from already-saved audits
        const initClosing: Record<number, string> = {};
        const initNotes: Record<number, string> = {};
        for (const ing of json.data || []) {
          if (ing.closingQty !== null) initClosing[ing.ingredientId] = String(ing.closingQty);
          if (ing.notes) initNotes[ing.ingredientId] = ing.notes;
        }
        setClosingInputs(initClosing);
        setNotesInputs(initNotes);
      }
    } catch { /* silent */ }
    setLoading(false);
  }, [selectedBranch?.id, auditDate, user?.restaurantId]);

  useEffect(() => { fetchPreview(); }, [fetchPreview]);

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
      const res = await fetch(`${API_URL}/api/inventory/daily-audit`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ branchId: selectedBranch.id, date: auditDate, entries }),
      });
      const json = await res.json();
      if (json.success) { setSavedOk(true); fetchPreview(); }
      else alert(json.message || "Failed to save");
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
    <main className="min-h-screen bg-gray-50 px-4 pb-10 pt-6">
      <div className="mx-auto max-w-4xl space-y-4">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-[18px] font-bold text-gray-800">Daily Stock Audit</h1>
            <p className="text-[12px] text-gray-500">
              Enter end-of-day actual stock. Wastage = (Opening − SOP Used) − Actual Closing
            </p>
          </div>
          <input
            type="date"
            value={auditDate}
            onChange={(e) => setAuditDate(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-[12px] focus:outline-none focus:ring-1 focus:ring-[#b10000]"
          />
        </div>

        {/* Formula banner */}
        <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-[11px] text-blue-700 space-y-0.5">
          <p><strong>Wastage</strong> = (Opening Stock − SOP Consumption) − Actual Closing Stock</p>
          <p><strong>Wastage %</strong> = (Wastage ÷ Opening Stock) × 100 &nbsp;|&nbsp; <strong>Wastage Cost</strong> = Wastage × Unit Price</p>
        </div>

        {/* Summary bar */}
        {filledCount > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Entries filled", value: `${filledCount} / ${ingredients.length}`, color: "blue" },
              { label: "Total wastage today", value: `${totalWastage.toFixed(2)} units`, color: "red" },
              { label: "Wastage cost", value: `₹${totalWastageCost.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`, color: "amber" },
            ].map((k) => (
              <div key={k.label} className={`rounded-xl border p-3 ${k.color === "red" ? "border-red-100 bg-red-50" : k.color === "amber" ? "border-amber-100 bg-amber-50" : "border-blue-100 bg-blue-50"}`}>
                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">{k.label}</p>
                <p className={`mt-1 text-[16px] font-bold ${k.color === "red" ? "text-red-700" : k.color === "amber" ? "text-amber-700" : "text-blue-700"}`}>{k.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Search */}
        <input
          type="text"
          placeholder="Search ingredient..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-[12px] focus:outline-none focus:ring-1 focus:ring-[#b10000]"
        />

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {/* Column headers */}
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1.4fr_1fr] gap-2 border-b border-gray-100 bg-gray-50 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wide text-gray-500">
            <span>Ingredient</span>
            <span className="text-right">Opening</span>
            <span className="text-right">SOP Used</span>
            <span className="text-right">Expected</span>
            <span className="text-center">Actual Closing</span>
            <span className="text-right">Wastage</span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-[12px] text-gray-400">Loading ingredients…</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-[12px] text-gray-400">No ingredients found.</div>
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
                <div key={ing.ingredientId} className={`border-b border-gray-50 px-4 py-3 last:border-0 ${ing.auditSaved ? "bg-emerald-50/30" : ""}`}>
                  <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1.4fr_1fr] items-center gap-2">
                    {/* Ingredient name */}
                    <div>
                      <p className="text-[12px] font-semibold text-gray-800">{ing.name}</p>
                      <p className="text-[10px] text-gray-400">{ing.unit}{ing.pricePerUnit ? ` · ₹${ing.pricePerUnit}/unit` : ""}</p>
                      {ing.auditSaved && <span className="text-[9px] font-semibold text-emerald-600">✓ Saved</span>}
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
                        placeholder="Enter qty"
                        value={closingInputs[ing.ingredientId] ?? ""}
                        onChange={(e) =>
                          setClosingInputs((prev) => ({ ...prev, [ing.ingredientId]: e.target.value }))
                        }
                        className={`w-full rounded-lg border px-2 py-1.5 text-center text-[12px] focus:outline-none focus:ring-1 focus:ring-[#b10000] ${
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
                    <div className="mt-1.5 pl-0">
                      <input
                        type="text"
                        placeholder="Notes (optional)"
                        value={notesInputs[ing.ingredientId] ?? ""}
                        onChange={(e) =>
                          setNotesInputs((prev) => ({ ...prev, [ing.ingredientId]: e.target.value }))
                        }
                        className="w-full rounded border border-gray-100 bg-gray-50 px-2 py-1 text-[11px] text-gray-600 placeholder-gray-300 focus:outline-none"
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
          <div className="flex items-center justify-between">
            {savedOk && (
              <p className="text-[12px] font-semibold text-emerald-600">
                ✓ Audit saved successfully
              </p>
            )}
            <button
              onClick={handleSave}
              disabled={saving || filledCount === 0}
              className="ml-auto rounded-xl bg-[#b10000] px-6 py-2.5 text-[13px] font-semibold text-white hover:bg-[#900000] disabled:opacity-50"
            >
              {saving ? "Saving…" : `Save Audit (${filledCount} entries)`}
            </button>
          </div>
        )}

        {/* Legend */}
        <div className="rounded-xl border border-gray-100 bg-white px-4 py-3 text-[11px] text-gray-500">
          <p className="font-semibold text-gray-600 mb-1">Column Guide</p>
          <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
            <span><span className="font-medium text-gray-700">Opening</span> — stock at start of day</span>
            <span><span className="font-medium text-emerald-700">SOP Used</span> — Σ(orders × recipe qty)</span>
            <span><span className="font-medium text-blue-700">Expected</span> — Opening − SOP Used</span>
            <span><span className="font-medium text-gray-700">Actual Closing</span> — you enter this</span>
            <span><span className="font-medium text-red-700">Wastage</span> — Expected − Actual</span>
          </div>
        </div>

      </div>
    </main>
  );
}

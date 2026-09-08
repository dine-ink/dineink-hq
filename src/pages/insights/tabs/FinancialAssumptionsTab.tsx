import { ChevronDownIcon, CheckIcon } from "@heroicons/react/24/outline";
import { ASSUMPTION_FIELD_GROUPS } from "@/pages/insights/assumptionFields";
import type { UseFinanceAssumptions } from "@/pages/insights/useFinanceAssumptions";
import { nonNegative } from "@/utils/numberInput";

/**
 * Financial Assumptions — the single source of truth for every target, rate and
 * commission percentage the rest of the app reads.
 *
 * Extracted from Insights.tsx as part of breaking up a 4,370-line component.
 * Everything it needs lives in useFinanceAssumptions, so it takes one prop.
 *
 * The field table moved to assumptionFields.ts rather than staying on the page:
 * the tab and the hook both need it, and neither can import from the page that
 * imports them.
 */

interface FinancialAssumptionsTabProps {
  assumptions: UseFinanceAssumptions;
  selectedBranch: any;
}

export default function FinancialAssumptionsTab({ assumptions, selectedBranch }: FinancialAssumptionsTabProps) {
  // Aliased back to the names the markup already used, so this is a move
  // rather than a rewrite.
  const {
    openAssumptionGroups,
    setOpenAssumptionGroups,
    assumptionsMode,
    setAssumptionsMode,
    assumptionsLoading,
    assumptionsSaving,
    assumptionsSavedAt,
    activeAssumptionValues,
    overriddenFields,
    handleAssumptionFieldChange,
    handleClearOverride,
    handleSaveAssumptions,
  } = assumptions;

  return (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-[16px] font-bold text-gray-900">
                    Financial Assumptions
                  </h3>
                  <p className="mt-1 text-[12px] text-gray-500">
                    The single source of truth for every target, rate, and
                    commission percentage used across Dashboard, Insights,
                    Branch Comparison, and reports.
                  </p>
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-gray-100 p-1">
                  <button
                    type="button"
                    onClick={() => setAssumptionsMode("defaults")}
                    className={`rounded-lg px-3 py-1.5 text-[12px] font-semibold transition ${
                      assumptionsMode === "defaults"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Restaurant Defaults
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssumptionsMode("branch")}
                    className={`rounded-lg px-3 py-1.5 text-[12px] font-semibold transition ${
                      assumptionsMode === "branch"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {selectedBranch?.name || "This Branch"}'s Overrides
                  </button>
                </div>
              </div>

              {assumptionsMode === "branch" && (
                <p className="rounded-lg bg-blue-50 px-3 py-2 text-[11px] text-blue-700">
                  Fields left blank here inherit the restaurant default shown
                  above. Only set a value if this branch is genuinely different
                  (e.g. a different landlord's rent rate).
                </p>
              )}

              {assumptionsLoading ? (
                <div className="flex h-40 items-center justify-center text-[12px] text-gray-400">
                  Loading assumptions…
                </div>
              ) : (
                <>
                  {(() => {
                    const allOpen = ASSUMPTION_FIELD_GROUPS.every(
                      (g) => openAssumptionGroups[g.title],
                    );
                    return (
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() =>
                            setOpenAssumptionGroups(
                              allOpen
                                ? {}
                                : Object.fromEntries(
                                    ASSUMPTION_FIELD_GROUPS.map((g) => [
                                      g.title,
                                      true,
                                    ]),
                                  ),
                            )
                          }
                          className="text-[11px] font-semibold text-[#b10000] hover:underline"
                        >
                          {allOpen ? "Collapse all" : "Expand all"}
                        </button>
                      </div>
                    );
                  })()}

                  {ASSUMPTION_FIELD_GROUPS.map((group) => {
                    const isOpen = !!openAssumptionGroups[group.title];
                    // Header summary — lets you see which groups still need
                    // attention without opening every one of them.
                    const setCount = group.fields.filter((f) => {
                      const v = activeAssumptionValues[f.key];
                      return v !== null && v !== undefined && v !== "";
                    }).length;
                    const overrideCount = group.fields.filter((f) =>
                      overriddenFields.includes(f.key),
                    ).length;

                    return (
                    <div
                      key={group.title}
                      className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setOpenAssumptionGroups((prev) => ({
                            ...prev,
                            [group.title]: !prev[group.title],
                          }))
                        }
                        aria-expanded={isOpen}
                        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-gray-50 active:bg-gray-50"
                      >
                        <span className="min-w-0">
                          <span className="block text-[13px] font-bold text-gray-900">
                            {group.title}
                          </span>
                          <span className="mt-0.5 block text-[11px] text-gray-400">
                            {setCount} of {group.fields.length} set
                            {assumptionsMode === "branch" && overrideCount > 0
                              ? ` · ${overrideCount} override${overrideCount > 1 ? "s" : ""}`
                              : ""}
                          </span>
                        </span>
                        <ChevronDownIcon
                          className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                        />
                      </button>

                      {isOpen && (
                      <div className="grid grid-cols-1 gap-3 border-t border-gray-100 p-4 md:grid-cols-2 xl:grid-cols-3">
                        {group.fields.map((field) => {
                          const isOverridden = overriddenFields.includes(
                            field.key,
                          );
                          const value = activeAssumptionValues[field.key];
                          return (
                            <div
                              key={field.key}
                              className="rounded-xl border border-gray-200 bg-white p-3"
                            >
                              <div className="mb-2 flex items-center justify-between">
                                <label className="block text-[12px] font-medium text-gray-700">
                                  {field.label}
                                </label>
                                {assumptionsMode === "branch" &&
                                  isOverridden && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleClearOverride(field.key)
                                      }
                                      className="text-[10px] font-semibold text-[#b10000] hover:underline"
                                    >
                                      Reset to default
                                    </button>
                                  )}
                              </div>
                              <div className="relative">
                                {field.unit === "₹" ? (
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                                    ₹
                                  </span>
                                ) : (
                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-gray-400">
                                    {field.unit}
                                  </span>
                                )}
                                <input
                                  type="number" {...nonNegative}
                                  value={value ?? ""}
                                  onChange={(e) =>
                                    handleAssumptionFieldChange(
                                      field.key,
                                      e.target.value,
                                    )
                                  }
                                  placeholder={
                                    assumptionsMode === "branch"
                                      ? "Inherit default"
                                      : "0"
                                  }
                                  className={`w-full rounded-xl border text-sm outline-none transition-all duration-200 focus:border-red-300 focus:bg-white ${
                                    isOverridden
                                      ? "border-[#b10000]/30 bg-red-50/40"
                                      : "border-gray-200 bg-gray-50"
                                  } py-2.5 ${field.unit === "₹" ? "pl-8 pr-3" : "pl-3 pr-14"}`}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      )}
                    </div>
                    );
                  })}

                  <div className="flex items-center justify-end gap-3">
                    {assumptionsSavedAt && (
                      <span className="text-[11px] text-emerald-600">
                        Saved
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={handleSaveAssumptions}
                      disabled={assumptionsSaving}
                      className="flex items-center gap-1.5 rounded-xl bg-[#b10000] px-4 py-2 text-[12px] font-semibold text-white shadow-sm transition hover:bg-[#950000] disabled:opacity-50"
                    >
                      <CheckIcon className="h-3.5 w-3.5" />
                      {assumptionsSaving
                        ? "Saving…"
                        : assumptionsMode === "defaults"
                          ? "Save Restaurant Defaults"
                          : "Save Branch Overrides"}
                    </button>
                  </div>
                </>
              )}
            </div>
  );
}

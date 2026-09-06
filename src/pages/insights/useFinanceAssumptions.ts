import { useState, useEffect } from "react";
import { useAppSelector } from "@/store";
import { ASSUMPTION_FIELD_GROUPS } from "./assumptionFields";

/**
 * The Financial Assumptions tab's data: restaurant-wide defaults, the optional
 * per-branch overrides layered on them, and everything that saves.
 *
 * Lifted out of Insights.tsx whole. Nothing outside that tab reads any of it --
 * the targets shown on Overview come from financeSummary.targets, which is the
 * backend applying these, not these values directly -- so this is a straight
 * move rather than a split.
 *
 * It takes `activeTab` rather than an `enabled` boolean for the same reason
 * useAddOns does: the original effect listed activeTab in its dependencies, and
 * a boolean would quietly change when the fetch fires.
 */

export function useFinanceAssumptions(activeTab: string) {
  const { user, token } = useAppSelector((s) => s.auth);
  const { selectedBranch } = useAppSelector((s) => s.branch);
  const API_URL = import.meta.env.VITE_API_URL;

  // Which Financial Assumptions groups are expanded. The first opens by
  // default so the tab is not a wall of six closed headers, and the rest stay
  // shut so all six titles are visible at once.
  const [openAssumptionGroups, setOpenAssumptionGroups] = useState<
    Record<string, boolean>
  >({ [ASSUMPTION_FIELD_GROUPS[0].title]: true });
  const [assumptionsMode, setAssumptionsMode] = useState<"defaults" | "branch">(
    "defaults",
  );
  const [assumptionDefaults, setAssumptionDefaults] = useState<any>({});
  const [assumptionResolved, setAssumptionResolved] = useState<any>(null);
  const [assumptionsLoading, setAssumptionsLoading] = useState(false);
  const [assumptionsSaving, setAssumptionsSaving] = useState(false);
  const [assumptionsSavedAt, setAssumptionsSavedAt] = useState<number | null>(
    null,
  );

  // Financial Assumptions — restaurant-wide defaults, with optional
  // per-branch overrides. Fetched whenever the tab is opened or the selected
  // branch changes (branch fetch is only meaningful in "branch" mode, but
  // fetching defaults on every branch change keeps them fresh too).
  useEffect(() => {
    if (activeTab !== "Financial Assumptions" || !user?.restaurantId) return;
    const fetchAssumptions = async () => {
      setAssumptionsLoading(true);
      try {
        const defaultsRes = await fetch(
          `${API_URL}/api/finance-assumptions/${user.restaurantId}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const defaultsJson = await defaultsRes.json();
        if (defaultsJson.success) setAssumptionDefaults(defaultsJson.data);

        if (selectedBranch?.id) {
          const branchRes = await fetch(
            `${API_URL}/api/finance-assumptions/${user.restaurantId}/${selectedBranch.id}`,
            { headers: { Authorization: `Bearer ${token}` } },
          );
          const branchJson = await branchRes.json();
          if (branchJson.success) setAssumptionResolved(branchJson.data);
        }
      } catch {
        // fetch error — silently ignored, form just stays blank
      } finally {
        setAssumptionsLoading(false);
      }
    };
    fetchAssumptions();
  }, [activeTab, selectedBranch?.id, user?.restaurantId]);

  const activeAssumptionValues =
    assumptionsMode === "defaults"
      ? assumptionDefaults
      : assumptionResolved || {};
  const overriddenFields: string[] = assumptionResolved?.overriddenFields || [];

  const handleAssumptionFieldChange = (key: string, value: string) => {
    const parsed = value === "" ? null : Number(value);
    if (assumptionsMode === "defaults") {
      setAssumptionDefaults((prev: any) => ({ ...prev, [key]: parsed }));
    } else {
      setAssumptionResolved((prev: any) => ({ ...prev, [key]: parsed }));
    }
  };

  const handleClearOverride = (key: string) => {
    setAssumptionResolved((prev: any) => ({ ...prev, [key]: null }));
  };

  const handleSaveAssumptions = async () => {
    if (!user?.restaurantId) return;
    // Hoisted so the two URLs below read one value. `assumptionsMode` is
    // "defaults" | "branch", so this guard already proves branchId is set on
    // every path that uses it — TypeScript just can't correlate a check on one
    // variable with a branch on another, and a template literal accepts the
    // undefined case anyway.
    const branchId = selectedBranch?.id;
    if (assumptionsMode === "branch" && !branchId) {
      alert("Please select a branch");
      return;
    }
    setAssumptionsSaving(true);
    try {
      const url =
        assumptionsMode === "defaults"
          ? `${API_URL}/api/finance-assumptions/${user.restaurantId}`
          : `${API_URL}/api/finance-assumptions/${user.restaurantId}/${branchId}`;
      const payload: any = {};
      ASSUMPTION_FIELD_GROUPS.flatMap((g) => g.fields).forEach(({ key }) => {
        payload[key] = activeAssumptionValues[key] ?? null;
      });
      const res = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        if (assumptionsMode === "defaults") {
          setAssumptionDefaults(json.data);
        } else {
          // The PUT response is just the raw override row (no
          // overriddenFields) — re-fetch the resolved view so "Reset to
          // default" badges reflect the save immediately, not just after
          // the next branch-change/tab-reopen refetch.
          const branchRes = await fetch(
            `${API_URL}/api/finance-assumptions/${user.restaurantId}/${branchId}`,
            { headers: { Authorization: `Bearer ${token}` } },
          );
          const branchJson = await branchRes.json();
          if (branchJson.success) setAssumptionResolved(branchJson.data);
        }
        setAssumptionsSavedAt(Date.now());
      } else {
        alert(json.message || "Failed to save");
      }
    } catch {
      alert("Failed to save financial assumptions");
    } finally {
      setAssumptionsSaving(false);
    }
  };
  return {
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
  };
}

export type UseFinanceAssumptions = ReturnType<typeof useFinanceAssumptions>;

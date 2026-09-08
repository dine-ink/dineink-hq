import { useState, useEffect } from "react";
import { useAppSelector } from "@/store";
import { ASSUMPTION_FIELD_GROUPS } from "./assumptionFields";
import {
  useGetAssumptionDefaultsQuery,
  useGetAssumptionsForBranchQuery,
  useSaveAssumptionDefaultsMutation,
  useSaveAssumptionOverridesMutation,
} from "@/store/api/insightsApi";
import { notify } from "@/utils/notify";

/**
 * The Financial Assumptions tab's data: restaurant-wide defaults, the optional
 * per-branch overrides layered on them, and everything that saves.
 *
 * Lifted out of Insights.tsx whole. Nothing outside that tab reads any of it --
 * the targets shown on Overview come from financeSummary.targets, which is the
 * backend applying these, not these values directly -- so this is a straight
 * move rather than a split.
 *
 * `activeTab` is still the gate, now as a `skip` rather than an effect guard.
 *
 * The fetched values become an editable draft -- typing in a field mutates the
 * local copy, not the cache -- so they are seeded from the queries rather than
 * read straight off them. Seeding on every arrival is safe here, and matches
 * what the old code did: the only things that invalidate "Assumptions" are
 * this hook's own two saves, so the only refetches are a mount, a branch
 * change, and a save. That is exactly when the old effect ran.
 */

export function useFinanceAssumptions(activeTab: string) {
  const { user } = useAppSelector((s) => s.auth);
  const { selectedBranch } = useAppSelector((s) => s.branch);

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
  const [assumptionsSaving, setAssumptionsSaving] = useState(false);
  const [assumptionsSavedAt, setAssumptionsSavedAt] = useState<number | null>(
    null,
  );

  const onTab = activeTab === "Financial Assumptions" && !!user?.restaurantId;

  const defaultsQ = useGetAssumptionDefaultsQuery(user?.restaurantId as number, {
    skip: !onTab,
  });
  const branchQ = useGetAssumptionsForBranchQuery(
    {
      restaurantId: user?.restaurantId as number,
      branchId: selectedBranch?.id as number,
    },
    { skip: !onTab || !selectedBranch?.id },
  );
  const [saveDefaults] = useSaveAssumptionDefaultsMutation();
  const [saveOverrides] = useSaveAssumptionOverridesMutation();

  const assumptionsLoading = defaultsQ.isFetching || branchQ.isFetching;

  // Seed the draft from whatever the queries hold. See the note above for why
  // doing this on every arrival is equivalent to the old effect.
  useEffect(() => {
    if (defaultsQ.data) setAssumptionDefaults(defaultsQ.data);
  }, [defaultsQ.data]);
  useEffect(() => {
    if (branchQ.data) setAssumptionResolved(branchQ.data);
  }, [branchQ.data]);

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
      notify("Please select a branch", "warning");
      return;
    }
    setAssumptionsSaving(true);
    try {
      const body: any = {};
      ASSUMPTION_FIELD_GROUPS.flatMap((g) => g.fields).forEach(({ key }) => {
        body[key] = activeAssumptionValues[key] ?? null;
      });
      if (assumptionsMode === "defaults") {
        setAssumptionDefaults(
          await saveDefaults({ restaurantId: user.restaurantId, body }).unwrap(),
        );
      } else {
        // The PUT answers with the raw override row, which carries no
        // overriddenFields. Invalidating "Assumptions" refetches the resolved
        // view, so the "Reset to default" badges reflect the save straight
        // away -- that used to be a second fetch written by hand here.
        await saveOverrides({
          restaurantId: user.restaurantId,
          branchId: branchId as number,
          body,
        }).unwrap();
      }
      setAssumptionsSavedAt(Date.now());
    } catch {
      notify("Failed to save financial assumptions");
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

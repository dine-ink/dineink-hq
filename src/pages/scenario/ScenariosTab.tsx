import { useState } from "react";
import { useAppSelector } from "@/store";
import { errorMessage } from "@/utils/apiRequest";
import {
  useCloneScenarioMutation,
  useCreateScenarioMutation,
  useDeleteScenarioMutation,
  useGetScenariosQuery,
  useResetScenarioFieldsMutation,
  useUpdateScenarioMutation,
} from "@/store/api/scenariosApi";
import { OVERRIDE_FIELD_GROUPS, OVERRIDE_FIELDS, SCENARIO_TYPE_STYLES } from "./scenarioCategories";
import MobileTableCards from "@/components/common/MobileTableCards";
import {
  ArchiveBoxIcon,
  ArrowLeftIcon,
  ArrowUturnLeftIcon,
  CheckCircleIcon,
  CheckIcon,
  DocumentDuplicateIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

export default function ScenariosTab() {
  const { branches } = useAppSelector((s) => s.branch);
  const { user } = useAppSelector((s) => s.auth);

  const [scopeBranchId, setScopeBranchId] = useState<string>("restaurant");

  const restaurantId = user?.restaurantId as number;
  const { data: scenarios = [], isFetching: loading } = useGetScenariosQuery(
    {
      restaurantId,
      branchId: scopeBranchId === "restaurant" ? null : Number(scopeBranchId),
    },
    { skip: !user?.restaurantId },
  );

  const [createScenario] = useCreateScenarioMutation();
  const [updateScenario] = useUpdateScenarioMutation();
  const [resetFields] = useResetScenarioFieldsMutation();
  const [cloneScenario] = useCloneScenarioMutation();
  const [deleteScenario] = useDeleteScenarioMutation();
  const [view, setView] = useState<"list" | "create" | "edit">("list");
  const [selectedScenario, setSelectedScenario] = useState<any>(null);
  const [overrideValues, setOverrideValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Create-form state
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formBranchId, setFormBranchId] = useState<string>("restaurant");

  const openCreate = () => {
    setFormName("");
    setFormDescription("");
    setFormBranchId(scopeBranchId);
    setOverrideValues({});
    setView("create");
  };

  const buildOverridesPayload = (): Record<string, number | null> => {
    const overrides: Record<string, number | null> = {};
    OVERRIDE_FIELDS.forEach((f) => {
      const raw = overrideValues[f.key];
      overrides[f.key] = raw === undefined || raw === "" ? null : Number(raw);
    });
    return overrides;
  };

  const handleCreate = async () => {
    if (!formName.trim()) {
      alert("Please enter a scenario name");
      return;
    }
    setSaving(true);
    try {
      const created = await createScenario({
        restaurantId,
        body: {
          name: formName.trim(),
          description: formDescription.trim() || null,
          branchId: formBranchId === "restaurant" ? null : Number(formBranchId),
          type: "CUSTOM",
          overrides: buildOverridesPayload(),
        },
      }).unwrap();
      if (created) openDetail(created);
    } catch (err) {
      alert(errorMessage(err, "Failed to create scenario"));
    } finally {
      setSaving(false);
    }
  };

  const openDetail = (scenario: any) => {
    setSelectedScenario(scenario);
    const values: Record<string, string> = {};
    OVERRIDE_FIELDS.forEach((f) => {
      values[f.key] = scenario[f.key] === null || scenario[f.key] === undefined ? "" : String(scenario[f.key]);
    });
    setOverrideValues(values);
    setView("edit");
  };

  const handleSave = async () => {
    if (!selectedScenario) return;
    setSaving(true);
    try {
      const saved = await updateScenario({
        restaurantId,
        id: selectedScenario.id,
        body: { overrides: buildOverridesPayload() },
      }).unwrap();
      if (saved) setSelectedScenario(saved);
    } catch (err) {
      alert(errorMessage(err, "Failed to save scenario"));
    } finally {
      setSaving(false);
    }
  };

  const handleResetField = (fieldKey: string) => {
    // Local-only until Save — clearing to "" and saving sends an explicit
    // null for this field, which the backend treats as "inherit the default".
    setOverrideValues((prev) => ({ ...prev, [fieldKey]: "" }));
  };

  const handleResetAll = async () => {
    if (!selectedScenario) return;
    if (!confirm("Reset every override on this scenario back to its inherited default?")) return;
    try {
      const reset = await resetFields({
        restaurantId,
        id: selectedScenario.id,
        fields: OVERRIDE_FIELDS.map((f) => f.key),
      }).unwrap();
      if (reset) openDetail(reset);
    } catch (err) {
      alert(errorMessage(err, "Failed to reset the overrides on this scenario"));
    }
  };

  const handleToggleActive = async () => {
    if (!selectedScenario) return;
    try {
      // A failed toggle used to leave the switch showing its old state, which
      // reads as "the click didn't land" rather than "that was rejected".
      const toggled = await updateScenario({
        restaurantId,
        id: selectedScenario.id,
        body: { isActive: !selectedScenario.isActive },
      }).unwrap();
      if (toggled) setSelectedScenario(toggled);
    } catch (err) {
      alert(errorMessage(err, "Failed to change whether this scenario is active"));
    }
  };

  const handleClone = async (scenarioId: number) => {
    try {
      const cloned = await cloneScenario({ restaurantId, id: scenarioId }).unwrap();
      if (cloned) openDetail(cloned);
    } catch (err) {
      alert(errorMessage(err, "Failed to clone this scenario"));
    }
  };

  const handleDelete = async (scenario: any) => {
    if (scenario.type !== "CUSTOM") {
      alert("Built-in scenarios can't be deleted — archive it instead.");
      return;
    }
    if (!confirm(`Delete scenario "${scenario.name}"? This can't be undone.`)) return;
    try {
      await deleteScenario({ restaurantId, id: scenario.id }).unwrap();
    } catch (err) {
      alert(errorMessage(err, "Failed to delete scenario"));
    }
  };

  const typeBadge = (type: string) => {
    const style = SCENARIO_TYPE_STYLES[type] || SCENARIO_TYPE_STYLES.CUSTOM;
    return <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${style.bg} ${style.text}`}>{type}</span>;
  };

  // ── LIST VIEW ──────────────────────────────────────────────────────────
  if (view === "list") {
    return (
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-[16px] font-bold text-gray-900">Scenarios</h3>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={scopeBranchId}
              onChange={(e) => setScopeBranchId(e.target.value)}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-[12px] font-semibold text-gray-700 outline-none"
            >
              <option value="restaurant">Restaurant-wide (all branches)</option>
              {(branches || []).map((b: any) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={openCreate}
              className="flex items-center gap-1.5 rounded-xl bg-[#b10000] px-4 py-2 text-[12px] font-semibold text-white shadow-sm transition hover:bg-[#950000]"
            >
              <PlusIcon className="h-3.5 w-3.5" /> Create Scenario
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex h-40 items-center justify-center text-[12px] text-gray-400">Loading…</div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <MobileTableCards>
            <table className="w-full text-[12px] min-w-[36rem]">
              <thead className="bg-gray-50 text-[10px] font-bold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Type</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {scenarios.map((s) => (
                  <tr key={s.id} className="border-t border-gray-100 hover:bg-gray-50/60">
                    <td className="px-4 py-2.5">
                      <button type="button" onClick={() => openDetail(s)} className="font-semibold text-gray-900 hover:text-[#b10000]">
                        {s.name}
                      </button>
                      {s.description && <p className="text-[10px] text-gray-400">{s.description}</p>}
                    </td>
                    <td className="px-4 py-2.5">{typeBadge(s.type)}</td>
                    <td className="px-4 py-2.5">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${s.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                        {s.isActive ? "Active" : "Archived"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleClone(s.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 text-[10px] font-semibold text-gray-600 hover:bg-gray-50"
                        >
                          <DocumentDuplicateIcon className="h-3 w-3" /> Clone
                        </button>
                        {s.type === "CUSTOM" && (
                          <button
                            type="button"
                            onClick={() => handleDelete(s)}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2 py-1 text-[10px] font-semibold text-red-600 hover:bg-red-50"
                          >
                            <TrashIcon className="h-3 w-3" /> Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </MobileTableCards>
          </div>
        )}
      </div>
    );
  }

  // ── CREATE VIEW ────────────────────────────────────────────────────────
  if (view === "create") {
    return (
      <div className="space-y-4">
        <button type="button" onClick={() => setView("list")} className="flex items-center gap-1 text-[12px] font-semibold text-gray-500 hover:text-gray-700">
          <ArrowLeftIcon className="h-3.5 w-3.5" /> Back to Scenarios
        </button>

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <h3 className="mb-4 text-[15px] font-bold text-gray-900">Create Scenario</h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-gray-600">Scenario Name</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Aggressive Delivery Push"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-red-300 focus:bg-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-gray-600">Description</label>
              <input
                type="text"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Optional"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-red-300 focus:bg-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-gray-600">Scope</label>
              <select
                value={formBranchId}
                onChange={(e) => setFormBranchId(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-red-300 focus:bg-white"
              >
                <option value="restaurant">Restaurant-wide (all branches)</option>
                {(branches || []).map((b: any) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>

          <p className="mb-3 mt-5 text-[11px] text-gray-500">
            Every field is optional — leave blank to inherit from Financial Assumptions / real actuals. Set only what this scenario should change.
          </p>
          {OVERRIDE_FIELD_GROUPS.map((group) => (
            <div key={group} className="mb-4">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-gray-500">{group}</p>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {OVERRIDE_FIELDS.filter((f) => f.group === group).map((f) => (
                  <div key={f.key}>
                    <label className="mb-1 block text-[11px] font-medium text-gray-600">{f.label}</label>
                    <div className="relative">
                      {f.unit === "currency" && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">₹</span>}
                      <input
                        type="number"
                        value={overrideValues[f.key] ?? ""}
                        onChange={(e) => setOverrideValues((prev) => ({ ...prev, [f.key]: e.target.value }))}
                        placeholder="Inherit"
                        className={`w-full rounded-xl border border-gray-200 bg-gray-50 py-2 text-sm outline-none focus:border-red-300 focus:bg-white ${f.unit === "currency" ? "pl-7 pr-3" : "px-3"}`}
                      />
                      {f.unit === "percentage" && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-gray-400">%</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={handleCreate}
              disabled={saving}
              className="flex items-center gap-1.5 rounded-xl bg-[#b10000] px-4 py-2 text-[12px] font-semibold text-white shadow-sm transition hover:bg-[#950000] disabled:opacity-50"
            >
              {saving ? "Creating…" : "Create Scenario"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── EDIT VIEW ─────────────────────────────────────────────────────────
  const isCustom = selectedScenario?.type === "CUSTOM";

  return (
    <div className="space-y-4">
      <button type="button" onClick={() => setView("list")} className="flex items-center gap-1 text-[12px] font-semibold text-gray-500 hover:text-gray-700">
        <ArrowLeftIcon className="h-3.5 w-3.5" /> Back to Scenarios
      </button>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-[16px] font-bold text-gray-900">{selectedScenario?.name}</h3>
          {typeBadge(selectedScenario?.type)}
          <span className="text-[11px] text-gray-400">
            {branches?.find((b: any) => b.id === selectedScenario?.branchId)?.name || "Restaurant-wide"}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {isCustom && (
            <button
              type="button"
              onClick={handleResetAll}
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-[12px] font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
            >
              <ArrowUturnLeftIcon className="h-3.5 w-3.5" /> Reset All
            </button>
          )}
          {!isCustom && (
            <button
              type="button"
              onClick={() => handleClone(selectedScenario.id)}
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-[12px] font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
            >
              <DocumentDuplicateIcon className="h-3.5 w-3.5" /> Clone to Customize
            </button>
          )}
          <button
            type="button"
            onClick={handleToggleActive}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[12px] font-semibold shadow-sm transition ${
              selectedScenario?.isActive ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100" : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            }`}
          >
            {selectedScenario?.isActive ? <ArchiveBoxIcon className="h-3.5 w-3.5" /> : <CheckCircleIcon className="h-3.5 w-3.5" />}
            {selectedScenario?.isActive ? "Archive" : "Reactivate"}
          </button>
          {isCustom && (
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 rounded-xl bg-[#b10000] px-3 py-2 text-[12px] font-semibold text-white shadow-sm transition hover:bg-[#950000] disabled:opacity-50"
            >
              <CheckIcon className="h-3.5 w-3.5" /> {saving ? "Saving…" : "Save Changes"}
            </button>
          )}
        </div>
      </div>

      {!isCustom && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-[11px] font-medium text-amber-800">
          Built-in scenarios have fixed assumptions (Conservative −5%, Expected 0%, Optimistic +10% revenue/order growth) so every restaurant shares the same baseline — they can't be edited. Use "Clone to Customize" above to start a Custom scenario from these values.
        </div>
      )}

      {OVERRIDE_FIELD_GROUPS.map((group) => (
        <div key={group} className="overflow-hidden rounded-xl border border-gray-200">
          <div className="bg-gray-50 px-4 py-2 text-[12px] font-bold text-gray-900">{group}</div>
          <div className="grid grid-cols-1 gap-3 p-3 md:grid-cols-2 xl:grid-cols-3">
            {OVERRIDE_FIELDS.filter((f) => f.group === group).map((f) => (
              <div key={f.key}>
                <div className="mb-1 flex items-center justify-between">
                  <label className="block text-[11px] font-medium text-gray-600">{f.label}</label>
                  {isCustom && overrideValues[f.key] !== "" && overrideValues[f.key] !== undefined && (
                    <button type="button" onClick={() => handleResetField(f.key)} className="text-[10px] font-semibold text-gray-400 hover:text-[#b10000]">
                      Reset
                    </button>
                  )}
                </div>
                <div className="relative">
                  {f.unit === "currency" && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">₹</span>}
                  <input
                    type="number"
                    value={overrideValues[f.key] ?? ""}
                    onChange={(e) => setOverrideValues((prev) => ({ ...prev, [f.key]: e.target.value }))}
                    placeholder="Inherit"
                    disabled={!isCustom}
                    className={`w-full rounded-xl border border-gray-200 py-2 text-sm outline-none focus:border-red-300 focus:bg-white ${f.unit === "currency" ? "pl-7 pr-3" : "px-3"} ${isCustom ? "bg-gray-50" : "cursor-not-allowed bg-gray-100 text-gray-400"}`}
                  />
                  {f.unit === "percentage" && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-gray-400">%</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

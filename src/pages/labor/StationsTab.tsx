import { useEffect, useMemo, useState } from "react";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Alert, Button, Dialog, FormField, Input, Select } from "../../design";
import { useAppSelector } from "../../store";
import { CHART_CARD } from "./laborCategories";
import { useLaborQuery, useLaborScope } from "./useLaborApi";
import MobileTableCards from "../../components/common/MobileTableCards";

// Station setup: the stations themselves, their productive-time factor, their
// throughput ceiling, and which equipment feeds each one. This is the table
// everything else on the page depends on — with no stations there is no
// workload model, only an order count.

interface Station {
  stationId: number;
  code: string;
  name: string;
  utilizationFactor: number | null;
  capacityPerHour: number | null;
  equipmentItemsPerHour: number | null;
  equipmentCount: number;
  standardsCount: number;
  skilledStaffCount: number;
  sortOrder: number;
  isActive: boolean;
}

interface EquipmentRow {
  id: number;
  name: string;
  category: string | null;
  itemsPerHour: number | null;
  stationId: number | null;
  isActive: boolean;
}

const emptyForm = { name: "", code: "", utilizationFactor: "", capacityPerHour: "", sortOrder: "" };

export default function StationsTab() {
  const { restaurantId, branchId, request } = useLaborScope();
  const { token } = useAppSelector((s) => s.auth);
  const API_URL = import.meta.env.VITE_API_URL;

  const stationsPath = restaurantId && branchId ? `/${restaurantId}/${branchId}/stations?includeInactive=true` : null;
  const { data: stations, loading, error, reload } = useLaborQuery<Station[]>(stationsPath);

  // Bumped after a write to re-pull the equipment list, which lives outside the
  // labor namespace and so isn't covered by useLaborQuery's own reload().
  const [equipmentNonce, setEquipmentNonce] = useState(0);

  const [equipment, setEquipment] = useState<EquipmentRow[] | null>(null);
  const [equipmentError, setEquipmentError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Station | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Equipment belongs to its own module, so the LIST comes from /api/equipment
  // directly; only the station link and items/hour rate are written through the
  // labor namespace (assignEquipmentToStationService, which enforces that a unit
  // and its station are at the same branch).
  useEffect(() => {
    if (!restaurantId || !branchId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/equipment/${restaurantId}/${branchId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json().catch(() => null);
        if (cancelled) return;
        if (!res.ok || !json?.success) throw new Error(json?.message || "Could not load equipment");
        setEquipment(json.data as EquipmentRow[]);
        setEquipmentError(null);
      } catch (err: any) {
        if (!cancelled) setEquipmentError(err.message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [API_URL, token, restaurantId, branchId, equipmentNonce]);

  const updateEquipmentLink = async (
    row: EquipmentRow,
    patch: { stationId?: number | null; itemsPerHour?: number | null },
  ) => {
    setBusy(true);
    setActionError(null);
    try {
      await request(`/equipment/${row.id}/station`, {
        method: "PUT",
        body: JSON.stringify({
          stationId: patch.stationId !== undefined ? patch.stationId : row.stationId,
          itemsPerHour: patch.itemsPerHour !== undefined ? patch.itemsPerHour : row.itemsPerHour,
        }),
      });
      setEquipmentNonce((n) => n + 1);
      reload(); // station rollups change when a unit's rate or station changes
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setActionError(null);
    setDialogOpen(true);
  };

  const openEdit = (station: Station) => {
    setEditing(station);
    setForm({
      name: station.name,
      code: station.code,
      utilizationFactor: station.utilizationFactor != null ? String(station.utilizationFactor) : "",
      capacityPerHour: station.capacityPerHour != null ? String(station.capacityPerHour) : "",
      sortOrder: String(station.sortOrder),
    });
    setActionError(null);
    setDialogOpen(true);
  };

  const save = async () => {
    setBusy(true);
    setActionError(null);
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        utilizationFactor: form.utilizationFactor === "" ? null : Number(form.utilizationFactor),
        capacityPerHour: form.capacityPerHour === "" ? null : Number(form.capacityPerHour),
        sortOrder: form.sortOrder === "" ? 0 : Number(form.sortOrder),
      };
      if (editing) {
        await request(`/stations/${editing.stationId}`, { method: "PUT", body: JSON.stringify(payload) });
      } else {
        // code is only settable at creation — see updateStationService's comment
        // on why renaming a code would orphan labor standards.
        await request("/stations", {
          method: "POST",
          body: JSON.stringify({ ...payload, branchId, code: form.code || form.name }),
        });
      }
      setDialogOpen(false);
      reload();
      setNotice(editing ? "Station updated." : "Station created.");
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (station: Station) => {
    const warning = [
      `Delete "${station.name}"?`,
      station.standardsCount > 0 ? `${station.standardsCount} labor standard(s) will be deleted.` : null,
      station.skilledStaffCount > 0 ? `${station.skilledStaffCount} staff skill entr(ies) will be deleted.` : null,
      station.equipmentCount > 0
        ? `${station.equipmentCount} equipment item(s) will be unassigned (the equipment itself is kept).`
        : null,
    ]
      .filter(Boolean)
      .join("\n");
    if (!window.confirm(warning)) return;

    setBusy(true);
    setActionError(null);
    try {
      const result = await request(`/stations/${station.stationId}`, { method: "DELETE" });
      reload();
      setNotice(
        `Deleted ${station.name} — removed ${result.removedStandards} standard(s), ${result.removedSkills} skill(s); ${result.unassignedEquipment} equipment item(s) unassigned.`,
      );
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const seed = async () => {
    setBusy(true);
    setActionError(null);
    try {
      const result = await request("/stations/seed", { method: "POST", body: JSON.stringify({ branchId }) });
      reload();
      setNotice(
        result.created > 0
          ? `Added ${result.created} starter station(s). Rename or delete any that don't match your kitchen, then set each one's throughput.`
          : "All starter stations already exist at this branch.",
      );
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const totalStandards = useMemo(
    () => (stations || []).reduce((s, x) => s + x.standardsCount, 0),
    [stations],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-[15px] font-bold text-gray-900">Kitchen Stations</h3>
          <p className="mt-0.5 max-w-3xl text-[11px] text-gray-500">
            A station is a place where work happens — grill, fryer, tandoor, the pass. Splitting workload by
            station is what lets the plan tell an equipment ceiling apart from a staffing shortage.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" size="sm" onClick={seed} loading={busy}>
            Add starter stations
          </Button>
          <Button size="sm" leftIcon={<PlusIcon className="h-4 w-4" />} onClick={openCreate}>
            New station
          </Button>
        </div>
      </div>

      {notice && (
        <Alert variant="success" onDismiss={() => setNotice(null)}>
          {notice}
        </Alert>
      )}
      {actionError && (
        <Alert variant="danger" title="Action failed" onDismiss={() => setActionError(null)}>
          {actionError}
        </Alert>
      )}
      {error && <Alert variant="danger" title="Could not load stations">{error}</Alert>}

      {loading && (
        <div className="flex h-32 items-center justify-center text-[12px] text-gray-400">Loading stations…</div>
      )}

      {!loading && stations && stations.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-200 bg-gray-50 py-12 text-center">
          <p className="text-[13px] font-semibold text-gray-700">No stations yet</p>
          <p className="max-w-md text-[11px] text-gray-500">
            "Add starter stations" creates a common set (prep, grill, fryer, curry, tandoor, pass) you can then
            rename or delete. Nothing is created automatically — a guessed layout would make every labor
            standard entered against it wrong.
          </p>
        </div>
      )}

      {!loading && stations && stations.length > 0 && (
        <div className={CHART_CARD}>
          <div className="overflow-x-auto">
            <MobileTableCards>
            <table className="min-w-full text-[12px]">
              <thead className="bg-gray-50">
                <tr className="border-b border-gray-100">
                  {[
                    "Station",
                    "Code",
                    "Productive time",
                    "Throughput ceiling",
                    "Equipment",
                    "Standards",
                    "Trained staff",
                    "",
                  ].map((h) => (
                    <th
                      key={h}
                      className="whitespace-nowrap px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-gray-400"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stations.map((s) => (
                  <tr
                    key={s.stationId}
                    className={`border-b border-gray-50 ${s.isActive ? "" : "bg-gray-50/60 opacity-60"}`}
                  >
                    <td className="px-4 py-2.5">
                      <button
                        type="button"
                        onClick={() => openEdit(s)}
                        className="text-left font-semibold text-gray-900 hover:text-[#b10000]"
                      >
                        {s.name}
                      </button>
                      {!s.isActive && <span className="ml-2 text-[10px] text-gray-400">(inactive)</span>}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-[11px] text-gray-500">{s.code}</td>
                    <td className="px-4 py-2.5 text-gray-700">
                      {s.utilizationFactor != null ? (
                        <>
                          {Math.round(s.utilizationFactor * 100)}%
                          <span className="ml-1 text-[10px] text-gray-400">
                            ({Math.round(s.utilizationFactor * 60)} min/hr)
                          </span>
                        </>
                      ) : (
                        <span className="text-[10px] text-gray-400">branch default</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      {s.capacityPerHour != null ? (
                        <span className="font-semibold text-gray-900">{s.capacityPerHour}/hr</span>
                      ) : s.equipmentItemsPerHour != null ? (
                        <>
                          <span className="font-semibold text-gray-900">{s.equipmentItemsPerHour}/hr</span>
                          <span className="ml-1 text-[10px] text-gray-400">from equipment</span>
                        </>
                      ) : (
                        <span className="text-[10px] text-amber-600">not set — no bottleneck detection</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-gray-500">{s.equipmentCount || "—"}</td>
                    <td className="px-4 py-2.5">
                      <span className={s.standardsCount > 0 ? "text-gray-700" : "text-amber-600"}>
                        {s.standardsCount || "none"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={s.skilledStaffCount > 0 ? "text-gray-700" : "text-amber-600"}>
                        {s.skilledStaffCount || "none"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => remove(s)}
                        disabled={busy}
                        className="rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                        aria-label={`Delete ${s.name}`}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </MobileTableCards>
          </div>
        </div>
      )}

      {!loading && stations && stations.length > 0 && totalStandards === 0 && (
        <Alert variant="warning" title="No labor standards yet">
          Stations exist but no menu item has per-station minutes, so every station will show zero workload.
          Enter them on the Labor Standards tab — or use its "split prep time" helper to get a first draft from
          the prep times already on your menu items.
        </Alert>
      )}

      <Alert variant="info" title="Setting a throughput ceiling">
        A ceiling is how many items the station can produce per hour at full tilt, regardless of headcount —
        one oven doesn't bake faster with two people at it. Leave it blank if you don't know it: blank means
        "no assessment", which is safer than a guess that would flag false bottlenecks. Setting an items/hour
        rate per machine below is the other way to get one: a station with no ceiling of its own sums its
        equipment's rates.
      </Alert>

      {/* EQUIPMENT → STATION */}
      <div className="pt-2">
        <h3 className="text-[15px] font-bold text-gray-900">Equipment Throughput</h3>
        <p className="mt-0.5 max-w-3xl text-[11px] text-gray-500">
          Assign each machine to the station it feeds and record how many items it sustains per hour. This is a
          rate, not a batch size — an oven that fits 6 pizzas and takes 12 minutes a batch sustains 30/hour, not
          6.
        </p>
      </div>

      {equipmentError && (
        <Alert variant="warning" title="Could not load equipment">
          {equipmentError}
        </Alert>
      )}

      {equipment && equipment.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 py-8 text-center text-[12px] text-gray-400">
          No equipment recorded for this branch yet — add it on the Equipment page first.
        </div>
      )}

      {equipment && equipment.length > 0 && (
        <div className={CHART_CARD}>
          <div className="overflow-x-auto">
            <MobileTableCards>
            <table className="min-w-full text-[12px]">
              <thead className="bg-gray-50">
                <tr className="border-b border-gray-100">
                  {["Equipment", "Category", "Station", "Sustained items/hr"].map((h) => (
                    <th
                      key={h}
                      className="whitespace-nowrap px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-gray-400"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {equipment
                  .filter((e) => e.isActive)
                  .map((e) => (
                    <tr key={e.id} className="border-b border-gray-50">
                      <td className="px-4 py-2 font-semibold text-gray-900">{e.name}</td>
                      <td className="px-4 py-2 text-gray-500">{e.category || "—"}</td>
                      <td className="px-4 py-2">
                        <select
                          value={e.stationId ?? ""}
                          disabled={busy}
                          onChange={(ev) =>
                            updateEquipmentLink(e, {
                              stationId: ev.target.value === "" ? null : Number(ev.target.value),
                            })
                          }
                          className="w-40 rounded-lg border border-gray-200 bg-white px-2 py-1 text-[11px] outline-none focus:border-red-400 disabled:opacity-50"
                        >
                          <option value="">Not assigned</option>
                          {(stations || [])
                            .filter((s) => s.isActive)
                            .map((s) => (
                              <option key={s.stationId} value={s.stationId}>
                                {s.name}
                              </option>
                            ))}
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          min={0}
                          step={1}
                          defaultValue={e.itemsPerHour ?? ""}
                          disabled={busy}
                          onBlur={(ev) => {
                            const raw = ev.target.value;
                            const next = raw === "" ? null : Number(raw);
                            if (next === (e.itemsPerHour ?? null)) return;
                            updateEquipmentLink(e, { itemsPerHour: next });
                          }}
                          placeholder="not set"
                          className="w-28 rounded-lg border border-gray-200 bg-white px-2 py-1 text-[11px] outline-none focus:border-red-400 disabled:opacity-50"
                          aria-label={`Items per hour for ${e.name}`}
                        />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            </MobileTableCards>
          </div>
        </div>
      )}

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editing ? `Edit ${editing.name}` : "New kitchen station"}
        footer={
          <>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} loading={busy} disabled={!form.name.trim()}>
              {editing ? "Save changes" : "Create station"}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          {actionError && <Alert variant="danger">{actionError}</Alert>}
          <FormField label="Station name" required>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Tandoor"
            />
          </FormField>
          {!editing && (
            <FormField
              label="Code"
              helperText="Uppercase key used to match labor standards. Leave blank to derive it from the name. Cannot be changed later."
            >
              <Input
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                placeholder="TANDOOR"
              />
            </FormField>
          )}
          <FormField
            label="Productive time factor"
            helperText="Fraction of the hour a person here is actually producing food. Blank inherits the branch default. 0.75 = 45 min/hr."
          >
            <Input
              type="number"
              min={0.1}
              max={1}
              step={0.05}
              value={form.utilizationFactor}
              onChange={(e) => setForm((f) => ({ ...f, utilizationFactor: e.target.value }))}
              placeholder="branch default"
            />
          </FormField>
          <FormField
            label="Throughput ceiling (items/hr)"
            helperText="Physical output limit of the station itself. Blank = derive from linked equipment, or make no assessment."
          >
            <Input
              type="number"
              min={1}
              step={1}
              value={form.capacityPerHour}
              onChange={(e) => setForm((f) => ({ ...f, capacityPerHour: e.target.value }))}
              placeholder="not set"
            />
          </FormField>
          <FormField label="Display order" helperText="Lower numbers appear first.">
            <Input
              type="number"
              min={0}
              step={1}
              value={form.sortOrder}
              onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
              placeholder="0"
            />
          </FormField>
          {editing && (
            <FormField label="Status">
              <Select
                value={editing.isActive ? "active" : "inactive"}
                onChange={async (e) => {
                  const isActive = e.target.value === "active";
                  setBusy(true);
                  try {
                    await request(`/stations/${editing.stationId}`, {
                      method: "PUT",
                      body: JSON.stringify({ isActive }),
                    });
                    setEditing({ ...editing, isActive });
                    reload();
                  } catch (err: any) {
                    setActionError(err.message);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive (excluded from plans)</option>
              </Select>
            </FormField>
          )}
        </div>
      </Dialog>
    </div>
  );
}

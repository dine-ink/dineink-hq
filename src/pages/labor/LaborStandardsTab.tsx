import { useMemo, useState } from "react";
import { Alert, Button, Dialog, FormField, Input } from "../../design";
import { CHART_CARD } from "./laborCategories";
import { useLaborQuery, useLaborScope } from "./useLaborApi";

// The labor-standards matrix: menu item × station minutes. This is the data the
// whole engine rests on — "don't only store total prep time, store
// station-specific task time". Every menu item is listed, including ones with
// nothing entered, because those gaps are exactly what makes a staffing plan
// under-count.

interface StationCell {
  standardMinutes: number;
  observedMinutes: number | null;
  observationCount: number;
  effectiveMinutes: number;
  effectiveSource: "observed" | "standard";
}

interface StandardsRow {
  menuItemId: number;
  itemName: string;
  categoryName: string | null;
  menuPrepTime: number;
  stations: Record<number, StationCell>;
  totalStationMinutes: number;
}

interface StandardsResponse {
  stations: { stationId: number; code: string; name: string }[];
  rows: StandardsRow[];
  itemsWithNoStandards: number;
}

export default function LaborStandardsTab() {
  const { restaurantId, branchId, request } = useLaborScope();
  const path = restaurantId && branchId ? `/${restaurantId}/${branchId}/standards` : null;
  const { data, loading, error, reload } = useLaborQuery<StandardsResponse>(path);

  const [search, setSearch] = useState("");
  const [onlyGaps, setOnlyGaps] = useState(false);
  // Pending edits, keyed "menuItemId:stationId" — batched into one bulk save so
  // a manager can fill in a whole row (or column) before writing anything.
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [seedOpen, setSeedOpen] = useState(false);
  const [seedWeights, setSeedWeights] = useState<Record<number, string>>({});
  const [seedOverwrite, setSeedOverwrite] = useState(false);

  const stations = data?.stations || [];

  const rows = useMemo(() => {
    let list = data?.rows || [];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (r) => r.itemName.toLowerCase().includes(q) || (r.categoryName || "").toLowerCase().includes(q),
      );
    }
    if (onlyGaps) list = list.filter((r) => r.totalStationMinutes <= 0);
    return list;
  }, [data?.rows, search, onlyGaps]);

  const cellKey = (menuItemId: number, stationId: number) => `${menuItemId}:${stationId}`;

  const cellValue = (row: StandardsRow, stationId: number): string => {
    const key = cellKey(row.menuItemId, stationId);
    if (key in edits) return edits[key];
    const cell = row.stations[stationId];
    return cell ? String(cell.standardMinutes) : "";
  };

  const setCell = (menuItemId: number, stationId: number, value: string) =>
    setEdits((e) => ({ ...e, [cellKey(menuItemId, stationId)]: value }));

  const pendingCount = Object.keys(edits).length;

  const saveEdits = async () => {
    const entries = Object.entries(edits)
      .map(([key, value]) => {
        const [menuItemId, stationId] = key.split(":").map(Number);
        return { menuItemId, stationId, raw: value.trim() };
      })
      // A cleared cell means "remove this standard", which is a delete rather
      // than an upsert of 0 — 0 is a meaningful stored value ("this item does
      // not touch this station") and the two must stay distinguishable.
      .filter((e) => e.raw !== "");

    const deletions = Object.entries(edits)
      .map(([key, value]) => {
        const [menuItemId, stationId] = key.split(":").map(Number);
        return { menuItemId, stationId, raw: value.trim() };
      })
      .filter((e) => e.raw === "");

    const invalid = entries.find((e) => !Number.isFinite(Number(e.raw)) || Number(e.raw) < 0);
    if (invalid) {
      setActionError("Minutes must be zero or a positive number.");
      return;
    }

    setBusy(true);
    setActionError(null);
    try {
      if (entries.length) {
        await request("/standards/bulk", {
          method: "POST",
          body: JSON.stringify({
            entries: entries.map((e) => ({
              menuItemId: e.menuItemId,
              stationId: e.stationId,
              standardMinutes: Number(e.raw),
            })),
          }),
        });
      }
      for (const d of deletions) {
        await request(`/standards/${d.menuItemId}/${d.stationId}`, { method: "DELETE" });
      }
      setEdits({});
      reload();
      setNotice(
        `Saved ${entries.length} standard(s)${deletions.length ? ` and removed ${deletions.length}` : ""}.`,
      );
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const runSeed = async () => {
    const weights = stations
      .map((s) => ({ stationId: s.stationId, weight: Number(seedWeights[s.stationId] || 0) }))
      .filter((w) => w.weight > 0);
    if (!weights.length) {
      setActionError("Give at least one station a weight above zero.");
      return;
    }
    setBusy(true);
    setActionError(null);
    try {
      const result = await request("/standards/seed-from-prep-time", {
        method: "POST",
        body: JSON.stringify({ branchId, weights, overwriteExisting: seedOverwrite }),
      });
      setSeedOpen(false);
      reload();
      setNotice(
        result.seeded > 0
          ? `Created ${result.seeded} draft standard(s) across ${result.itemsTouched} item(s) by splitting each item's prep time. Review and correct them — a split is a starting point, not a measurement.`
          : "Nothing to seed — every matching item already has standards (tick 'overwrite' to replace them).",
      );
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-[15px] font-bold text-gray-900">Labor Standards</h3>
          <p className="mt-0.5 max-w-3xl text-[11px] text-gray-500">
            Minutes of hands-on work one unit of each item creates at each station. A burger's 8 total minutes
            might be 4 grill + 2 fryer + 1 prep + 1 pass — and only the split tells you which station saturates
            first.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSeedOpen(true)}
            disabled={stations.length === 0}
          >
            Split prep time
          </Button>
          <Button size="sm" onClick={saveEdits} loading={busy} disabled={pendingCount === 0}>
            Save {pendingCount > 0 ? `${pendingCount} change${pendingCount === 1 ? "" : "s"}` : ""}
          </Button>
        </div>
      </div>

      {notice && (
        <Alert variant="success" onDismiss={() => setNotice(null)}>
          {notice}
        </Alert>
      )}
      {actionError && (
        <Alert variant="danger" title="Could not save" onDismiss={() => setActionError(null)}>
          {actionError}
        </Alert>
      )}
      {error && <Alert variant="danger" title="Could not load labor standards">{error}</Alert>}

      {!loading && stations.length === 0 && (
        <Alert variant="warning" title="No stations yet">
          Create kitchen stations first — standards are entered per station, so there are no columns to fill in
          until then.
        </Alert>
      )}

      {stations.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items or categories…"
            className="w-64 rounded-xl border border-gray-200 bg-white px-3 py-2 text-[12px] outline-none focus:border-red-400"
          />
          <label className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2">
            <input
              type="checkbox"
              checked={onlyGaps}
              onChange={(e) => setOnlyGaps(e.target.checked)}
              className="h-4 w-4 accent-[#b10000]"
            />
            <span className="text-[12px] text-gray-700">Only items with no standards</span>
          </label>
          {data && (
            <span className="text-[11px] text-gray-400">
              {data.rows.length - data.itemsWithNoStandards} of {data.rows.length} items have standards
            </span>
          )}
        </div>
      )}

      {loading && (
        <div className="flex h-32 items-center justify-center text-[12px] text-gray-400">Loading standards…</div>
      )}

      {!loading && stations.length > 0 && (
        <div className={CHART_CARD}>
          <div className="max-h-[540px] overflow-auto">
            <table className="min-w-full text-[12px]">
              <thead className="sticky top-0 z-10 bg-gray-50">
                <tr className="border-b border-gray-100">
                  <th className="sticky left-0 z-20 bg-gray-50 px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-gray-400">
                    Item
                  </th>
                  <th className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-gray-400">
                    Menu prep
                  </th>
                  {stations.map((s) => (
                    <th
                      key={s.stationId}
                      className="whitespace-nowrap px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-gray-400"
                    >
                      {s.name}
                    </th>
                  ))}
                  <th className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-gray-400">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={stations.length + 3} className="py-10 text-center text-[12px] text-gray-400">
                      No matching menu items.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.menuItemId} className="border-b border-gray-50">
                      <td className="sticky left-0 z-10 bg-white px-4 py-1.5">
                        <p className="font-semibold text-gray-900">{row.itemName}</p>
                        {row.categoryName && (
                          <p className="text-[10px] text-gray-400">{row.categoryName}</p>
                        )}
                      </td>
                      <td className="px-3 py-1.5 text-[11px] text-gray-400">
                        {row.menuPrepTime ? `${row.menuPrepTime}m` : "—"}
                      </td>
                      {stations.map((s) => {
                        const cell = row.stations[s.stationId];
                        const key = cellKey(row.menuItemId, s.stationId);
                        const dirty = key in edits;
                        return (
                          <td key={s.stationId} className="px-3 py-1.5">
                            <input
                              type="number"
                              min={0}
                              step={0.5}
                              value={cellValue(row, s.stationId)}
                              onChange={(e) => setCell(row.menuItemId, s.stationId, e.target.value)}
                              placeholder="—"
                              className={`w-16 rounded-lg border px-2 py-1 text-[11px] outline-none focus:border-red-400 ${
                                dirty ? "border-amber-400 bg-amber-50" : "border-gray-200 bg-white"
                              }`}
                              aria-label={`${row.itemName} minutes at ${s.name}`}
                            />
                            {cell?.effectiveSource === "observed" && (
                              <p
                                className="mt-0.5 text-[9px] font-semibold text-blue-600"
                                title={`Measured from ${cell.observationCount} orders — this is what the plan uses instead of your standard`}
                              >
                                meas. {cell.observedMinutes}m
                              </p>
                            )}
                            {cell && cell.observedMinutes != null && cell.effectiveSource === "standard" && (
                              <p
                                className="mt-0.5 text-[9px] text-gray-400"
                                title={`Measured at ${cell.observedMinutes}m from ${cell.observationCount} orders — not enough yet to override your standard`}
                              >
                                {cell.observedMinutes}m?
                              </p>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-3 py-1.5">
                        <span
                          className={
                            row.totalStationMinutes > 0 ? "font-bold text-gray-900" : "text-[11px] text-amber-600"
                          }
                        >
                          {row.totalStationMinutes > 0 ? `${row.totalStationMinutes}m` : "none"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Alert variant="info" title="Blank vs. zero">
        A blank cell means "no standard recorded" — the item's work at that station is invisible to the plan. A
        stored <strong>0</strong> means "this item genuinely doesn't touch this station", which is different and
        counts as configured. Clearing a cell deletes the standard; typing 0 keeps it.
      </Alert>

      <Dialog
        open={seedOpen}
        onClose={() => setSeedOpen(false)}
        title="Split existing prep time across stations"
        footer={
          <>
            <Button variant="outline" onClick={() => setSeedOpen(false)}>
              Cancel
            </Button>
            <Button onClick={runSeed} loading={busy}>
              Create draft standards
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-[12px] text-gray-600">
            Every menu item already carries a single prep-time figure. This splits it across stations by the
            weights below, giving you a first draft instead of hundreds of empty cells. It is a{" "}
            <strong>data-entry shortcut, not a measurement</strong> — correct the drafts against how your
            kitchen actually works.
          </p>
          <div className="space-y-2">
            {stations.map((s) => (
              <FormField key={s.stationId} label={s.name}>
                <Input
                  type="number"
                  min={0}
                  step={1}
                  value={seedWeights[s.stationId] ?? ""}
                  onChange={(e) => setSeedWeights((w) => ({ ...w, [s.stationId]: e.target.value }))}
                  placeholder="0"
                />
              </FormField>
            ))}
          </div>
          <p className="text-[11px] text-gray-400">
            Weights are relative — 4 / 2 / 1 / 1 splits each item's prep time into 50% / 25% / 12.5% / 12.5%.
          </p>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={seedOverwrite}
              onChange={(e) => setSeedOverwrite(e.target.checked)}
              className="h-4 w-4 accent-[#b10000]"
            />
            <span className="text-[12px] text-gray-700">
              Overwrite standards I've already entered
            </span>
          </label>
        </div>
      </Dialog>
    </div>
  );
}

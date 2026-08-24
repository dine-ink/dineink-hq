import { useMemo, useState } from "react";
import { Alert } from "../../design";
import { CHART_CARD, PROFICIENCY_LABELS } from "./laborCategories";
import { useLaborQuery, useLaborScope } from "./useLaborApi";
import MobileTableCards from "../../components/common/MobileTableCards";

// Who can work where, and how fast. This is what turns "how many people do I
// need?" into "who should stand where?" — a 4.5-FTE grill gap plus a 1.8-FTE
// pass gap doesn't mean 7 bodies if some of them can cover both.

interface SkillRow {
  userId: number;
  name: string;
  role: string;
  shift: string | null;
  stations: Record<number, { proficiency: number; speedFactor: number }>;
  stationCount: number;
}

interface SkillResponse {
  stations: { stationId: number; code: string; name: string }[];
  rows: SkillRow[];
  staffWithNoSkills: number;
}

export default function SkillMatrixTab() {
  const { restaurantId, branchId, request } = useLaborScope();
  const path = restaurantId && branchId ? `/${restaurantId}/${branchId}/skills` : null;
  const { data, loading, error, reload } = useLaborQuery<SkillResponse>(path);

  const [busyCell, setBusyCell] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const stations = data?.stations || [];
  const rows = data?.rows || [];

  const cellKey = (userId: number, stationId: number) => `${userId}:${stationId}`;

  const setProficiency = async (row: SkillRow, stationId: number, value: string) => {
    const key = cellKey(row.userId, stationId);
    setBusyCell(key);
    setActionError(null);
    try {
      if (value === "") {
        // Absence of a row is the only way to record "cannot work here" — see
        // StaffStationSkill.proficiency's comment on why a stored 0 isn't used.
        await request(`/skills/${row.userId}/${stationId}`, { method: "DELETE" });
      } else {
        await request("/skills", {
          method: "POST",
          body: JSON.stringify({
            userId: row.userId,
            stationId,
            proficiency: Number(value),
            speedFactor: row.stations[stationId]?.speedFactor ?? 1,
          }),
        });
      }
      reload();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setBusyCell(null);
    }
  };

  const setSpeed = async (row: SkillRow, stationId: number, value: string) => {
    const existing = row.stations[stationId];
    if (!existing) return; // no capability recorded yet — set proficiency first
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0.25 || parsed > 3) {
      setActionError("Speed must be between 0.25 and 3 (1 = exactly the standard time).");
      return;
    }
    const key = cellKey(row.userId, stationId);
    setBusyCell(key);
    setActionError(null);
    try {
      await request("/skills", {
        method: "POST",
        body: JSON.stringify({
          userId: row.userId,
          stationId,
          proficiency: existing.proficiency,
          speedFactor: parsed,
        }),
      });
      reload();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setBusyCell(null);
    }
  };

  // Depends on `data` rather than the derived `stations`/`rows` locals: those are
  // `data?.x || []` expressions that produce a fresh array identity every render,
  // which would defeat the memo entirely.
  const coverage = useMemo(
    () =>
      (data?.stations || []).map((s) => ({
        ...s,
        count: (data?.rows || []).filter((r) => r.stations[s.stationId]).length,
      })),
    [data],
  );

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-[15px] font-bold text-gray-900">Staff Skill Matrix</h3>
        <p className="mt-0.5 max-w-3xl text-[11px] text-gray-500">
          Set a proficiency for every station a person can work. Blank means they can't work it — the staffing
          plan will never assign them there, and a station nobody covers is reported as a training gap rather
          than a hiring one.
        </p>
      </div>

      {actionError && (
        <Alert variant="danger" title="Could not save" onDismiss={() => setActionError(null)}>
          {actionError}
        </Alert>
      )}
      {error && <Alert variant="danger" title="Could not load the skill matrix">{error}</Alert>}

      {!loading && stations.length === 0 && (
        <Alert variant="warning" title="No stations yet">
          Create kitchen stations first — skills are recorded per station.
        </Alert>
      )}

      {loading && (
        <div className="flex h-32 items-center justify-center text-[12px] text-gray-400">Loading matrix…</div>
      )}

      {!loading && stations.length > 0 && coverage.some((c) => c.count === 0) && (
        <Alert variant="warning" title="Some stations have nobody trained">
          {coverage
            .filter((c) => c.count === 0)
            .map((c) => c.name)
            .join(", ")}{" "}
          — any workload there will show as an untrainable shortfall until someone is marked able to work it.
        </Alert>
      )}

      {!loading && stations.length > 0 && (
        <div className={CHART_CARD}>
          <div className="max-h-[540px] overflow-auto">
            <MobileTableCards>
            <table className="min-w-full text-[12px]">
              <thead className="sticky top-0 z-10 bg-gray-50">
                <tr className="border-b border-gray-100">
                  <th className="sticky left-0 z-20 bg-gray-50 px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-gray-400">
                    Staff
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
                    Stations
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={stations.length + 2} className="py-10 text-center text-[12px] text-gray-400">
                      No active staff at this branch.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.userId} className="border-b border-gray-50">
                      <td className="sticky left-0 z-10 bg-white px-4 py-1.5">
                        <p className="font-semibold text-gray-900">{row.name}</p>
                        <p className="text-[10px] text-gray-400">
                          {row.role}
                          {row.shift ? ` · ${row.shift}` : ""}
                        </p>
                      </td>
                      {stations.map((s) => {
                        const cell = row.stations[s.stationId];
                        const key = cellKey(row.userId, s.stationId);
                        const busy = busyCell === key;
                        return (
                          <td key={s.stationId} className={`px-3 py-1.5 ${busy ? "opacity-50" : ""}`}>
                            <select
                              value={cell ? String(cell.proficiency) : ""}
                              disabled={busy}
                              onChange={(e) => setProficiency(row, s.stationId, e.target.value)}
                              className={`w-28 rounded-lg border px-2 py-1 text-[11px] outline-none focus:border-red-400 ${
                                cell ? "border-gray-200 bg-white" : "border-gray-100 bg-gray-50 text-gray-400"
                              }`}
                              aria-label={`${row.name} proficiency at ${s.name}`}
                            >
                              <option value="">can't work</option>
                              {[1, 2, 3, 4, 5].map((p) => (
                                <option key={p} value={p}>
                                  {p} · {PROFICIENCY_LABELS[p]}
                                </option>
                              ))}
                            </select>
                            {cell && (
                              <input
                                type="number"
                                min={0.25}
                                max={3}
                                step={0.05}
                                defaultValue={cell.speedFactor}
                                disabled={busy}
                                onBlur={(e) => {
                                  if (Number(e.target.value) === cell.speedFactor) return;
                                  setSpeed(row, s.stationId, e.target.value);
                                }}
                                className="mt-1 w-28 rounded-lg border border-gray-200 bg-white px-2 py-0.5 text-[10px] outline-none focus:border-red-400"
                                aria-label={`${row.name} speed factor at ${s.name}`}
                                title="Speed vs. the standard time — 1.1 is 10% faster"
                              />
                            )}
                          </td>
                        );
                      })}
                      <td className="px-3 py-1.5">
                        <span className={row.stationCount > 0 ? "font-bold text-gray-900" : "text-amber-600"}>
                          {row.stationCount || "none"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            </MobileTableCards>
          </div>
        </div>
      )}

      <Alert variant="info" title="How proficiency and speed are used">
        They do different jobs and are never multiplied together. <strong>Proficiency</strong> decides
        eligibility and who gets picked first when several people could cover a station.{" "}
        <strong>Speed</strong> scales how much of a requirement their time actually covers — a 1.1 closes a
        1.0-FTE gap with 0.91 of their shift. Speed stays yours to set: nothing in the POS records which cook
        prepared which item, so the app cannot honestly measure an individual's pace.
      </Alert>
    </div>
  );
}

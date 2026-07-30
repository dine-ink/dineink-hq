import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { useAppSelector } from "../../store";
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  ReferenceLine,
} from "recharts";
import { PencilSquareIcon, XMarkIcon } from "@heroicons/react/24/outline";

// Effective hours for payroll/display purposes: an owner-entered override
// takes precedence over whatever the POS clock-in/out computed.
const effectiveHours = (att: any) =>
  att?.manualTotalHours != null
    ? Number(att.manualTotalHours)
    : Number(att?.totalHours || 0);

const DEPT_COLOR: Record<string, string> = {
  KITCHEN: "bg-orange-100 text-orange-700",
  SERVICE: "bg-blue-100 text-blue-700",
  DELIVERY: "bg-green-100 text-green-700",
  CLEANING: "bg-purple-100 text-purple-700",
  ADMIN: "bg-red-100 text-red-700",
  SECURITY: "bg-yellow-100 text-yellow-700",
  PURCHASE: "bg-pink-100 text-pink-700",
  MAINTENANCE: "bg-teal-100 text-teal-700",
};

const fmt = (t: string) => (t ? dayjs(t).format("h:mm A") : "—");
const fmtHrs = (h: number) =>
  h > 0 ? `${Math.floor(h)}h ${Math.round((h % 1) * 60)}m` : "—";

// Late-arrival cutoff is the branch's own opening time + a 15-minute grace
// period — falls back to 9:00 AM if the branch hasn't set an opening time,
// so shops that open in the afternoon/evening/overnight aren't marked late
// against a morning assumption that doesn't apply to them.
const DEFAULT_OPENING_TIME = "09:00";
const LATE_GRACE_MINUTES = 15;

const lateCutoffMinutes = (openingTime?: string | null) => {
  const [h, m] = (openingTime || DEFAULT_OPENING_TIME).split(":").map(Number);
  return (h || 0) * 60 + (m || 0) + LATE_GRACE_MINUTES;
};

const isLateArrival = (loginTime: string, openingTime?: string | null) => {
  const d = dayjs(loginTime);
  return d.hour() * 60 + d.minute() > lateCutoffMinutes(openingTime);
};

const lateCutoffLabel = (openingTime?: string | null) => {
  const mins = lateCutoffMinutes(openingTime);
  return dayjs()
    .hour(Math.floor(mins / 60))
    .minute(mins % 60)
    .format("h:mm A");
};

// Standard hours-per-day assumption used to convert a monthly salary into an
// hourly rate, split by shift type since a morning/evening shift and a full
// day shift don't cover the same number of hours. Owner-configurable per
// branch in Settings → Branches → Payroll Policy; falls back to defaults.
const getStandardShiftHours = (shift: string | undefined, branch: any) => {
  const s = (shift || "").toUpperCase();
  if (s === "MORNING") return Number(branch?.morningShiftHours) || 6;
  if (s === "EVENING") return Number(branch?.eveningShiftHours) || 6;
  return Number(branch?.fullDayShiftHours) || 10;
};

const hourlyRate = (staff: any, branch: any) => {
  const standardHours = getStandardShiftHours(staff?.shift, branch);
  return standardHours > 0
    ? Number(staff?.salary || 0) / (30 * standardHours)
    : 0;
};

// Overtime hours (owner-entered on top of the regular shift) are paid at the
// branch's configurable overtime multiplier over the derived hourly rate.
const overtimePay = (staff: any, att: any, branch: any) =>
  Number(att?.overtimeHours || 0) *
  hourlyRate(staff, branch) *
  (Number(branch?.overtimeRateMultiplier) || 1.5);

const dailyPay = (staff: any, att: any, branch: any) =>
  Math.round(Number(staff?.salary || 0) / 30 + overtimePay(staff, att, branch));

export default function Attendance() {
  const API_URL = import.meta.env.VITE_API_URL;
  const { selectedBranch } = useAppSelector((s) => s.branch);
  const { user, token } = useAppSelector((s) => s.auth);
  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [viewMode, setViewMode] = useState<"daily" | "monthly">("daily");
  const [activeSection, setActiveSection] = useState<
    "attendance" | "productivity"
  >("attendance");
  const [productivity, setProductivity] = useState<any>(null);
  const [prodLoading, setProdLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [monthlyAttendance, setMonthlyAttendance] = useState<any[]>([]);
  const [allStaff, setAllStaff] = useState<any[]>([]);
  const [hoursModal, setHoursModal] = useState<{
    open: boolean;
    staff: any;
    att: any;
  }>({ open: false, staff: null, att: null });
  const [hoursInput, setHoursInput] = useState("");
  const [overtimeInput, setOvertimeInput] = useState("");
  const [savingHours, setSavingHours] = useState(false);

  const fetchAttendanceForDate = async () => {
    if (!selectedBranch?.id) return;
    const h = { Authorization: `Bearer ${token}` };
    const res = await fetch(
      `${API_URL}/api/attendance/branch/${selectedBranch.id}?date=${date}`,
      { headers: h },
    );
    const data = await res.json();
    if (data.success) setAttendance(data.data || []);
  };

  const openHoursModal = (staff: any, att: any) => {
    setHoursModal({ open: true, staff, att });
    setHoursInput(att ? String(effectiveHours(att)) : "");
    setOvertimeInput(att?.overtimeHours ? String(att.overtimeHours) : "");
  };

  const saveHours = async () => {
    if (!hoursModal.staff || !selectedBranch?.id) return;
    setSavingHours(true);
    try {
      const res = await fetch(`${API_URL}/api/attendance/manual`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: hoursModal.staff.id,
          restaurantId: user?.restaurantId,
          branchId: selectedBranch.id,
          date,
          manualTotalHours: hoursInput === "" ? null : Number(hoursInput),
          overtimeHours: overtimeInput === "" ? 0 : Number(overtimeInput),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setHoursModal({ open: false, staff: null, att: null });
        await fetchAttendanceForDate();
      } else {
        alert(data.message || "Failed to save hours");
      }
    } catch {
      alert("Failed to save hours");
    } finally {
      setSavingHours(false);
    }
  };

  // Fetch productivity data when tab switches
  useEffect(() => {
    if (activeSection !== "productivity" || !selectedBranch?.id) return;
    const fetchProd = async () => {
      try {
        setProdLoading(true);
        const h = { Authorization: `Bearer ${token}` };
        const from = dayjs(date).startOf("month").format("YYYY-MM-DD");
        const to = dayjs(date).endOf("month").format("YYYY-MM-DD");
        const res = await fetch(
          `${API_URL}/api/analytics/${user?.restaurantId}/staff-productivity?branchId=${selectedBranch.id}&from=${from}&to=${to}`,
          { headers: h },
        );
        const data = await res.json();
        if (data.success) setProductivity(data.data);
      } catch {
        /* silent */
      } finally {
        setProdLoading(false);
      }
    };
    fetchProd();
  }, [activeSection, selectedBranch, date]);

  useEffect(() => {
    const fetch_ = async () => {
      if (!selectedBranch?.id) return;
      try {
        setLoading(true);
        const h = { Authorization: `Bearer ${token}` };
        const from = dayjs(date).startOf("month").format("YYYY-MM-DD");
        const to = dayjs(date).endOf("month").format("YYYY-MM-DD");
        const [attRes, monthRes, staffRes] = await Promise.all([
          fetch(
            `${API_URL}/api/attendance/branch/${selectedBranch.id}?date=${date}`,
            { headers: h },
          ),
          fetch(
            `${API_URL}/api/attendance/branch/${selectedBranch.id}?from=${from}&to=${to}`,
            { headers: h },
          ),
          fetch(
            `${API_URL}/api/restaurant/staff/${user?.restaurantId}/${selectedBranch.id}`,
            { headers: h },
          ),
        ]);
        const [a, m, s] = await Promise.all([
          attRes.json(),
          monthRes.json(),
          staffRes.json(),
        ]);
        if (a.success) setAttendance(a.data || []);
        if (m.success) setMonthlyAttendance(m.data || []);
        if (s.success) setAllStaff(s.data || []);
      } catch {
        /* silent */
      } finally {
        setLoading(false);
      }
    };
    fetch_();
  }, [selectedBranch, date]);

  const presentIds = new Set(attendance.map((a: any) => a.userId));
  const presentCount = attendance.filter((a: any) => a.loginTime).length;
  const absentCount = allStaff.filter((s: any) => !presentIds.has(s.id)).length;
  const lateCount = attendance.filter((a: any) => {
    if (!a.loginTime) return false;
    return isLateArrival(a.loginTime, selectedBranch?.openingTime);
  }).length;
  const totalHours = attendance.reduce(
    (s: number, a: any) => s + effectiveHours(a) + Number(a.overtimeHours || 0),
    0,
  );
  const totalMonthlySalary = allStaff.reduce(
    (s: number, st: any) => s + Number(st.salary || 0),
    0,
  );
  const dailyPayroll = allStaff
    .filter((s: any) => presentIds.has(s.id))
    .reduce((sum: number, s: any) => {
      const att = attendance.find((a: any) => a.userId === s.id);
      return sum + dailyPay(s, att, selectedBranch);
    }, 0);
  const totalOvertimeCost = allStaff.reduce((sum: number, s: any) => {
    const att = attendance.find((a: any) => a.userId === s.id);
    return sum + overtimePay(s, att, selectedBranch);
  }, 0);

  const deptMap = allStaff.reduce((acc: any, s: any) => {
    const d = s.department || "OTHER";
    if (!acc[d]) acc[d] = { dept: d, total: 0, present: 0 };
    acc[d].total++;
    if (presentIds.has(s.id)) acc[d].present++;
    return acc;
  }, {});
  const deptData = Object.values(deptMap);

  const monthlyTrend = (() => {
    const byDate: any = {};
    monthlyAttendance.forEach((a: any) => {
      const d = dayjs(a.date || a.createdAt).format("DD");
      if (!byDate[d]) byDate[d] = { day: d, present: 0 };
      if (a.loginTime) byDate[d].present++;
    });
    return Object.values(byDate).sort(
      (a: any, b: any) => Number(a.day) - Number(b.day),
    );
  })();

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-red-500" />
          <p className="text-[12px] text-gray-500">Loading attendance...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto flex flex-col gap-3">
        {/* HEADER */}
        <div className="relative overflow-hidden rounded-md border border-gray-200 bg-white px-4 py-3 shadow-sm">
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-red-100/40 blur-3xl" />
          <div className="relative z-10 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#b10000] shadow-sm">
                <svg
                  className="h-5 w-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-gray-900">
                  Staff Attendance
                </h1>
                <p className="mt-0.5 text-[13px] text-gray-500">
                  Daily attendance, hours worked and staff productivity
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {/* Section toggle */}
              <div className="flex overflow-hidden rounded-xl border border-gray-200 bg-white">
                <button
                  onClick={() => setActiveSection("attendance")}
                  className={`px-4 py-2 text-[12px] font-semibold transition ${activeSection === "attendance" ? "bg-[#b10000] text-white" : "text-gray-600 hover:bg-gray-50"}`}
                >
                  Attendance
                </button>
                <button
                  onClick={() => setActiveSection("productivity")}
                  className={`px-4 py-2 text-[12px] font-semibold transition ${activeSection === "productivity" ? "bg-[#b10000] text-white" : "text-gray-600 hover:bg-gray-50"}`}
                >
                  Productivity
                </button>
              </div>
              {activeSection === "attendance" && (
                <>
                  <div className="flex overflow-hidden rounded-lg border border-gray-200 bg-white">
                    {(["daily", "monthly"] as const).map((m) => (
                      <button
                        key={m}
                        onClick={() => setViewMode(m)}
                        className={`px-3 py-1.5 text-[11px] font-semibold transition ${viewMode === m ? "bg-[#b10000] text-white" : "text-gray-600 hover:bg-gray-50"}`}
                      >
                        {m.charAt(0).toUpperCase() + m.slice(1)}
                      </button>
                    ))}
                  </div>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-[12px] text-gray-700 outline-none focus:border-red-300"
                  />
                </>
              )}
            </div>
          </div>
        </div>

        {activeSection === "attendance" && (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
              {[
                {
                  label: "Total Staff",
                  value: allStaff.length,
                  sub: "registered",
                  cls: "border-blue-100 bg-blue-50/60",
                  val: "text-blue-700",
                },
                {
                  label: "Present",
                  value: presentCount,
                  sub: "clocked in today",
                  cls: "border-emerald-100 bg-emerald-50/60",
                  val: "text-emerald-700",
                },
                {
                  label: "Absent",
                  value: absentCount,
                  sub: "not clocked in",
                  cls: "border-red-100 bg-red-50/60",
                  val: "text-red-700",
                },
                {
                  label: "Late Arrivals",
                  value: lateCount,
                  sub: `after ${lateCutoffLabel(selectedBranch?.openingTime)}`,
                  cls: "border-orange-100 bg-orange-50/60",
                  val: "text-orange-700",
                },
                {
                  label: "Hours Worked",
                  value: fmtHrs(totalHours),
                  sub: "total today",
                  cls: "border-violet-100 bg-violet-50/60",
                  val: "text-violet-700",
                },
              ].map((k) => (
                <div key={k.label} className={`rounded-xl border p-4 ${k.cls}`}>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                    {k.label}
                  </p>
                  <p className={`mt-2 text-[22px] font-bold ${k.val}`}>
                    {k.value}
                  </p>
                  <p className="mt-1 text-[11px] text-gray-500">{k.sub}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
              {/* DEPT CHART */}
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-4 py-3">
                  <h3 className="text-[15px] font-bold text-gray-900">
                    Attendance by Department
                  </h3>
                  <p className="mt-0.5 text-[11px] text-gray-500">
                    Present (green) vs total (gray)
                  </p>
                </div>
                <div className="p-3">
                  {deptData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={230}>
                      <BarChart data={deptData} barGap={2}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#f1f5f9"
                        />
                        <XAxis
                          dataKey="dept"
                          tick={{ fontSize: 8, fill: "#6b7280" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 10, fill: "#6b7280" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip />
                        <Bar
                          dataKey="total"
                          name="Total Staff"
                          fill="#e5e7eb"
                          radius={[3, 3, 0, 0]}
                        />
                        <Bar
                          dataKey="present"
                          name="Present"
                          fill="#10b981"
                          radius={[3, 3, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-[230px] items-center justify-center text-[12px] text-gray-400">
                      No staff data available
                    </div>
                  )}
                </div>
              </div>

              {/* MONTHLY TREND */}
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-4 py-3">
                  <h3 className="text-[15px] font-bold text-gray-900">
                    Monthly Presence Trend
                  </h3>
                  <p className="mt-0.5 text-[11px] text-gray-500">
                    {dayjs(date).format("MMMM YYYY")} — daily headcount
                  </p>
                </div>
                <div className="p-3">
                  {monthlyTrend.length > 0 ? (
                    <ResponsiveContainer width="100%" height={230}>
                      <LineChart data={monthlyTrend}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#f1f5f9"
                        />
                        <XAxis
                          dataKey="day"
                          tick={{ fontSize: 9, fill: "#6b7280" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 9, fill: "#6b7280" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip />
                        <ReferenceLine
                          y={allStaff.length}
                          stroke="#ef4444"
                          strokeDasharray="4 2"
                          strokeWidth={1}
                          label={{
                            value: "Full Team",
                            position: "right",
                            fontSize: 9,
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="present"
                          name="Present"
                          stroke="#ef4444"
                          strokeWidth={2}
                          dot={{ fill: "#ef4444", r: 2 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-[230px] items-center justify-center text-[12px] text-gray-400">
                      No monthly data yet
                    </div>
                  )}
                </div>
              </div>

              {/* PAYROLL */}
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-4 py-3">
                  <h3 className="text-[15px] font-bold text-gray-900">
                    Payroll Overview
                  </h3>
                  <p className="mt-0.5 text-[11px] text-gray-500">
                    Estimated cost for today's present staff
                  </p>
                </div>
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                      <p className="text-[9px] font-bold uppercase tracking-wide text-gray-400">
                        Monthly Total
                      </p>
                      <p className="mt-1.5 text-[18px] font-bold text-gray-900">
                        ₹{totalMonthlySalary.toLocaleString("en-IN")}
                      </p>
                    </div>
                    <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
                      <p className="text-[9px] font-bold uppercase tracking-wide text-gray-400">
                        Today (Present)
                      </p>
                      <p className="mt-1.5 text-[18px] font-bold text-emerald-700">
                        ₹{dailyPayroll.toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                  {totalOvertimeCost > 0 && (
                    <div className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2">
                      <p className="text-[10px] font-semibold text-amber-700">
                        Includes ₹
                        {Math.round(totalOvertimeCost).toLocaleString("en-IN")}{" "}
                        in overtime pay today
                      </p>
                    </div>
                  )}
                  <div className="space-y-1.5 max-h-[145px] overflow-y-auto">
                    {Object.values(deptMap).map((d: any) => {
                      const deptPresent = allStaff.filter(
                        (s: any) =>
                          s.department === d.dept && presentIds.has(s.id),
                      );
                      const deptCost = deptPresent.reduce(
                        (sum: number, s: any) => {
                          const att = attendance.find(
                            (a: any) => a.userId === s.id,
                          );
                          return sum + dailyPay(s, att, selectedBranch);
                        },
                        0,
                      );
                      return (
                        <div
                          key={d.dept}
                          className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold ${DEPT_COLOR[d.dept] || "bg-gray-100 text-gray-700"}`}
                            >
                              {d.dept}
                            </span>
                            <span className="text-[11px] text-gray-600">
                              {d.present}/{d.total}
                            </span>
                          </div>
                          <span className="text-[11px] font-semibold text-gray-900">
                            ₹{deptCost.toLocaleString("en-IN")}/day
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* ATTENDANCE REGISTER */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                <div>
                  <h3 className="text-[15px] font-bold text-gray-900">
                    Attendance Register
                  </h3>
                  <p className="mt-0.5 text-[11px] text-gray-500">
                    {dayjs(date).format("dddd, DD MMMM YYYY")} ·{" "}
                    {selectedBranch?.name}
                  </p>
                </div>
                <div className="flex gap-2">
                  <span className="rounded-lg bg-emerald-50 px-3 py-1.5 text-[10px] font-bold text-emerald-700">
                    {presentCount} Present
                  </span>
                  <span className="rounded-lg border border-red-100 bg-red-50 px-3 py-1.5 text-[10px] font-bold text-red-700">
                    {absentCount} Absent
                  </span>
                  {lateCount > 0 && (
                    <span className="rounded-lg bg-orange-50 px-3 py-1.5 text-[10px] font-bold text-orange-700">
                      {lateCount} Late
                    </span>
                  )}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-[12px]">
                  <thead className="bg-gray-50">
                    <tr className="border-b border-gray-100">
                      {[
                        "Staff",
                        "Dept",
                        "Role",
                        "Clock In",
                        "Clock Out",
                        "Hours",
                        "Salary/Day",
                        "Status",
                        "",
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-wide text-gray-400"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {allStaff.map((s: any) => {
                      const att = attendance.find(
                        (a: any) => a.userId === s.id,
                      );
                      const isPresent = !!att?.loginTime;
                      const isLate =
                        isPresent &&
                        isLateArrival(
                          att.loginTime,
                          selectedBranch?.openingTime,
                        );
                      return (
                        <tr
                          key={s.id}
                          className={`border-b border-gray-50 transition hover:bg-gray-50/40 ${!isPresent ? "bg-red-50/60" : isLate ? "bg-orange-50/20" : ""}`}
                        >
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#b10000] text-[11px] font-bold text-white">
                                {s.name?.charAt(0)?.toUpperCase()}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">
                                  {s.name}
                                </p>
                                <p className="text-[9px] text-gray-400">
                                  {s.phone || ""}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-2.5">
                            <span
                              className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold ${DEPT_COLOR[s.department] || "bg-gray-100 text-gray-700"}`}
                            >
                              {s.department || "—"}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-gray-600">
                            {s.role}
                          </td>
                          <td className="px-4 py-2.5">
                            <span
                              className={`font-medium ${isLate ? "text-orange-600" : "text-gray-900"}`}
                            >
                              {fmt(att?.loginTime)}
                            </span>
                            {isLate && (
                              <span className="ml-1 text-[9px] text-orange-500">
                                (Late)
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-gray-600">
                            {fmt(att?.logoutTime)}
                          </td>
                          <td className="px-4 py-2.5">
                            <p className="font-semibold text-gray-900">
                              {fmtHrs(effectiveHours(att))}
                              {att?.manualTotalHours != null && (
                                <span className="ml-1 text-[9px] font-semibold text-blue-500">
                                  (edited)
                                </span>
                              )}
                            </p>
                            {Number(att?.overtimeHours || 0) > 0 && (
                              <p className="text-[9px] font-semibold text-amber-600">
                                +{fmtHrs(Number(att.overtimeHours))} OT
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-gray-700">
                            <p className="font-semibold">
                              ₹
                              {dailyPay(s, att, selectedBranch).toLocaleString(
                                "en-IN",
                              )}
                            </p>
                            {Number(att?.overtimeHours || 0) > 0 && (
                              <p className="text-[9px] font-semibold text-amber-600">
                                +₹
                                {Math.round(
                                  overtimePay(s, att, selectedBranch),
                                ).toLocaleString("en-IN")}{" "}
                                OT
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-2.5">
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                                isPresent
                                  ? isLate
                                    ? "bg-orange-50 text-orange-600"
                                    : "bg-emerald-50 text-emerald-600"
                                  : "bg-red-50 text-red-700"
                              }`}
                            >
                              {isPresent
                                ? isLate
                                  ? "Late"
                                  : "Present"
                                : "Absent"}
                            </span>
                          </td>
                          <td className="px-4 py-2.5">
                            <button
                              onClick={() => openHoursModal(s, att)}
                              title="Edit hours worked"
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-400 transition hover:border-red-200 hover:bg-red-50 hover:text-[#b10000]"
                            >
                              <PencilSquareIcon className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {allStaff.length === 0 && (
                      <tr>
                        <td
                          colSpan={9}
                          className="py-14 text-center text-[12px] text-gray-400"
                        >
                          No staff found for this branch. Add staff in Shops →
                          Staff section.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ── PRODUCTIVITY SECTION ─────────────────────── */}
        {activeSection === "productivity" &&
          (prodLoading ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-red-500" />
                <p className="text-[12px] text-gray-500">
                  Calculating productivity...
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* KPIs */}
              <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                {[
                  {
                    label: "Total Staff",
                    value: productivity?.totals?.totalStaff || 0,
                    sub: "in this branch",
                    color: "blue",
                  },
                  {
                    label: "Total Hours Worked",
                    value: `${productivity?.totals?.totalHoursWorked || 0}h`,
                    sub: "this month",
                    color: "orange",
                  },
                  {
                    label: "Monthly Labour Cost",
                    value: `₹${(productivity?.totals?.totalLabourCost || 0).toLocaleString("en-IN")}`,
                    sub: "total salaries",
                    color: "red",
                  },
                  {
                    label: "Avg Hours/Staff",
                    value: productivity?.totals?.totalStaff
                      ? `${Math.round((productivity?.totals?.totalHoursWorked || 0) / productivity.totals.totalStaff)}h`
                      : "—",
                    sub: "per person",
                    color: "emerald",
                  },
                ].map((k) => (
                  <div
                    key={k.label}
                    className={`rounded-xl border p-4 ${k.color === "blue" ? "border-blue-100 bg-blue-50/60" : k.color === "orange" ? "border-orange-100 bg-orange-50/60" : k.color === "red" ? "border-red-100 bg-red-50/60" : "border-emerald-100 bg-emerald-50/60"}`}
                  >
                    <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                      {k.label}
                    </p>
                    <p
                      className={`mt-2 text-[22px] font-bold ${k.color === "blue" ? "text-blue-700" : k.color === "orange" ? "text-orange-700" : k.color === "red" ? "text-red-700" : "text-emerald-700"}`}
                    >
                      {k.value}
                    </p>
                    <p className="mt-1 text-[11px] text-gray-500">{k.sub}</p>
                  </div>
                ))}
              </div>

              {/* Shift Revenue + Dept Breakdown */}
              <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                  <div className="border-b border-gray-100 px-4 py-3">
                    <h3 className="text-[15px] font-bold text-gray-900">
                      Revenue by Shift
                    </h3>
                    <p className="mt-0.5 text-[11px] text-gray-500">
                      Revenue generated during each kitchen shift window
                    </p>
                  </div>
                  <div className="space-y-3 p-4">
                    {[
                      {
                        label: "Morning (6–12 AM)",
                        key: "morning",
                        color: "bg-yellow-500",
                      },
                      {
                        label: "Afternoon (12–5 PM)",
                        key: "afternoon",
                        color: "bg-orange-500",
                      },
                      {
                        label: "Evening (5–10 PM)",
                        key: "evening",
                        color: "bg-[#b10000]",
                      },
                      {
                        label: "Night (10 PM–6 AM)",
                        key: "night",
                        color: "bg-indigo-500",
                      },
                    ].map((s) => {
                      const rev = productivity?.shiftRevenue?.[s.key] || 0;
                      const totalRev =
                        (Object.values(productivity?.shiftRevenue || {}).reduce(
                          (a: number, v: any) => a + v,
                          0,
                        ) as number) || 1;
                      const pct = Math.round((rev / totalRev) * 100);
                      return (
                        <div key={s.key}>
                          <div className="flex items-center justify-between">
                            <p className="text-[12px] font-semibold text-gray-900">
                              {s.label}
                            </p>
                            <p className="text-[12px] font-bold text-gray-700">
                              ₹{rev.toLocaleString("en-IN")}{" "}
                              <span className="text-[10px] text-gray-400">
                                ({pct}%)
                              </span>
                            </p>
                          </div>
                          <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-100">
                            <div
                              className={`h-full rounded-full ${s.color} transition-all`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                  <div className="border-b border-gray-100 px-4 py-3">
                    <h3 className="text-[15px] font-bold text-gray-900">
                      Department Cost Breakdown
                    </h3>
                    <p className="mt-0.5 text-[11px] text-gray-500">
                      Monthly salary total per department
                    </p>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {(productivity?.deptData || []).map((d: any) => (
                      <div
                        key={d.dept}
                        className="flex items-center justify-between px-4 py-3"
                      >
                        <div>
                          <p className="text-[13px] font-bold text-gray-900">
                            {d.dept}
                          </p>
                          <p className="text-[11px] text-gray-400">
                            {d.count} staff · {d.totalHours}h worked
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[14px] font-bold text-red-600">
                            ₹{d.totalSalary.toLocaleString("en-IN")}
                          </p>
                          <p className="text-[10px] text-gray-400">
                            ₹{d.avgSalary.toLocaleString("en-IN")} avg
                          </p>
                        </div>
                      </div>
                    ))}
                    {!productivity?.deptData?.length && (
                      <div className="py-8 text-center text-[12px] text-gray-400">
                        No department data available
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Per-staff productivity table */}
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-4 py-3">
                  <h3 className="text-[15px] font-bold text-gray-900">
                    Staff Efficiency — This Month
                  </h3>
                  <p className="mt-0.5 text-[11px] text-gray-500">
                    Hours worked, attendance rate and cost per hour for each
                    staff member
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-[12px]">
                    <thead className="bg-gray-50">
                      <tr className="border-b border-gray-100">
                        {[
                          "Staff",
                          "Dept",
                          "Shift",
                          "Days Present",
                          "Hours Worked",
                          "Attendance %",
                          "Monthly Salary",
                          "Cost/Hour",
                        ].map((h) => (
                          <th
                            key={h}
                            className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-gray-400"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(productivity?.staff || []).map((s: any) => (
                        <tr
                          key={s.id}
                          className="border-b border-gray-50 hover:bg-gray-50/60"
                        >
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#b10000] text-[11px] font-bold text-white">
                                {s.name?.charAt(0)?.toUpperCase()}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">
                                  {s.name}
                                </p>
                                <p className="text-[10px] text-gray-400">
                                  {s.role}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-gray-600">
                            {s.department}
                          </td>
                          <td className="px-4 py-2.5 text-gray-500">
                            {s.shift}
                          </td>
                          <td className="px-4 py-2.5 text-gray-700">
                            {s.daysPresent}
                          </td>
                          <td className="px-4 py-2.5 font-semibold text-gray-900">
                            {s.totalHours}h
                          </td>
                          <td className="px-4 py-2.5">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${s.attendanceRate >= 80 ? "bg-emerald-50 text-emerald-600" : s.attendanceRate >= 50 ? "bg-orange-50 text-orange-600" : "bg-red-50 text-red-700"}`}
                            >
                              {s.attendanceRate}%
                            </span>
                          </td>
                          <td className="px-4 py-2.5 font-bold text-red-600">
                            ₹{s.monthlySalary.toLocaleString("en-IN")}
                            {Number(s.overtimeCost || 0) > 0 && (
                              <p className="text-[9px] font-semibold text-amber-600">
                                +₹{s.overtimeCost.toLocaleString("en-IN")} OT (
                                {s.overtimeHours}h)
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-gray-600">
                            {s.costPerHour > 0 ? `₹${s.costPerHour}/hr` : "—"}
                          </td>
                        </tr>
                      ))}
                      {!productivity?.staff?.length && (
                        <tr>
                          <td
                            colSpan={8}
                            className="py-12 text-center text-[12px] text-gray-400"
                          >
                            No staff productivity data available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))}

        {/* EDIT HOURS MODAL */}
        {hoursModal.open && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={() =>
              setHoursModal({ open: false, staff: null, att: null })
            }
          >
            <div
              className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-[16px] font-bold text-gray-900">
                    Edit Hours Worked
                  </h3>
                  <p className="mt-0.5 text-[11px] text-gray-500">
                    {hoursModal.staff?.name} ·{" "}
                    {dayjs(date).format("DD MMM YYYY")}
                  </p>
                </div>
                <button
                  onClick={() =>
                    setHoursModal({ open: false, staff: null, att: null })
                  }
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-gray-500">
                    Total Hours Worked
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    placeholder="e.g. 8.5"
                    value={hoursInput}
                    onChange={(e) => setHoursInput(e.target.value)}
                    className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none transition focus:border-red-300 focus:ring-2 focus:ring-red-100"
                  />
                  <p className="mt-1 text-[10px] text-gray-400">
                    Overrides whatever the clock-in/out computed for this day.
                  </p>
                </div>

                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-gray-500">
                    Overtime Hours
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    placeholder="e.g. 1.5"
                    value={overtimeInput}
                    onChange={(e) => setOvertimeInput(e.target.value)}
                    className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none transition focus:border-red-300 focus:ring-2 focus:ring-red-100"
                  />
                  <p className="mt-1 text-[10px] text-gray-400">
                    Extra hours worked beyond the normal shift, tracked
                    separately for payroll.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() =>
                      setHoursModal({ open: false, staff: null, att: null })
                    }
                    className="rounded-xl border border-gray-200 px-4 py-2 text-[13px] font-semibold text-gray-600 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveHours}
                    disabled={savingHours}
                    className="rounded-xl bg-[#b10000] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#950000] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {savingHours ? "Saving…" : "Save"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

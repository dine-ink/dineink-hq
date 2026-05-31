import { useCallback, useEffect, useState } from "react";
import { useBranchSync, getSelectedBranch } from "@/hooks/useBranchSync";
import dayjs from "dayjs";
import {
  BarChart, Bar, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip,
  LineChart, Line, ReferenceLine,
} from "recharts";

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

const fmt = (t: string) => t ? dayjs(t).format("h:mm A") : "—";
const fmtHrs = (h: number) => h > 0 ? `${Math.floor(h)}h ${Math.round((h % 1) * 60)}m` : "—";

export default function Attendance() {
  const API_URL = import.meta.env.VITE_API_URL;
  const branches = JSON.parse(localStorage.getItem("branches") || "[]");
  const [selectedBranch, setSelectedBranch] = useState<any>(() => {
    const s = localStorage.getItem("selectedBranch");
    return s ? JSON.parse(s) : branches[0] || null;
  });
  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [viewMode, setViewMode] = useState<"daily" | "monthly">("daily");
  const [loading, setLoading] = useState(false);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [monthlyAttendance, setMonthlyAttendance] = useState<any[]>([]);
  const [allStaff, setAllStaff] = useState<any[]>([]);

  const handleBranchChange = useCallback(() => setSelectedBranch(getSelectedBranch()), []);
  useBranchSync(handleBranchChange);

  useEffect(() => {
    const fetch_ = async () => {
      if (!selectedBranch?.id) return;
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        const h = { Authorization: `Bearer ${token}` };
        const from = dayjs(date).startOf("month").format("YYYY-MM-DD");
        const to = dayjs(date).endOf("month").format("YYYY-MM-DD");
        const [attRes, monthRes, staffRes] = await Promise.all([
          fetch(`${API_URL}/api/attendance/branch/${selectedBranch.id}?date=${date}`, { headers: h }),
          fetch(`${API_URL}/api/attendance/branch/${selectedBranch.id}?from=${from}&to=${to}`, { headers: h }),
          fetch(`${API_URL}/api/restaurant/staff/${user.restaurantId}/${selectedBranch.id}`, { headers: h }),
        ]);
        const [a, m, s] = await Promise.all([attRes.json(), monthRes.json(), staffRes.json()]);
        if (a.success) setAttendance(a.data || []);
        if (m.success) setMonthlyAttendance(m.data || []);
        if (s.success) setAllStaff(s.data || []);
      } catch { /* silent */ } finally { setLoading(false); }
    };
    fetch_();
  }, [selectedBranch, date]);

  const presentIds = new Set(attendance.map((a: any) => a.userId));
  const presentCount = attendance.filter((a: any) => a.loginTime).length;
  const absentCount = allStaff.filter((s: any) => !presentIds.has(s.id)).length;
  const lateCount = attendance.filter((a: any) => {
    if (!a.loginTime) return false;
    return dayjs(a.loginTime).hour() > 9 || (dayjs(a.loginTime).hour() === 9 && dayjs(a.loginTime).minute() > 15);
  }).length;
  const totalHours = attendance.reduce((s: number, a: any) => s + Number(a.totalHours || 0), 0);
  const totalMonthlySalary = allStaff.reduce((s: number, st: any) => s + Number(st.salary || 0), 0);
  const dailyPayroll = presentCount > 0
    ? Math.round(allStaff.filter((s: any) => presentIds.has(s.id)).reduce((sum: number, s: any) => sum + Number(s.salary || 0), 0) / 30)
    : 0;

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
    return Object.values(byDate).sort((a: any, b: any) => Number(a.day) - Number(b.day));
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
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-pink-500 shadow-sm">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" /></svg>
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-gray-900">Staff Attendance</h1>
                <p className="mt-0.5 text-[13px] text-gray-500">Daily attendance, hours worked and payroll overview</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex rounded-lg border border-gray-200 bg-white overflow-hidden">
                {(["daily", "monthly"] as const).map(m => (
                  <button key={m} onClick={() => setViewMode(m)} className={`px-3 py-1.5 text-[11px] font-semibold transition ${viewMode === m ? "bg-red-500 text-white" : "text-gray-600 hover:bg-gray-50"}`}>
                    {m.charAt(0).toUpperCase() + m.slice(1)}
                  </button>
                ))}
              </div>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-[12px] outline-none focus:border-red-400"
              />
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
          {[
            { label: "Total Staff", value: allStaff.length, sub: "registered", cls: "border-blue-100 bg-blue-50/60", val: "text-blue-700" },
            { label: "Present", value: presentCount, sub: "clocked in today", cls: "border-emerald-100 bg-emerald-50/60", val: "text-emerald-700" },
            { label: "Absent", value: absentCount, sub: "not clocked in", cls: "border-red-100 bg-red-50/60", val: "text-red-700" },
            { label: "Late Arrivals", value: lateCount, sub: "after 9:15 AM", cls: "border-orange-100 bg-orange-50/60", val: "text-orange-700" },
            { label: "Hours Worked", value: fmtHrs(totalHours), sub: "total today", cls: "border-violet-100 bg-violet-50/60", val: "text-violet-700" },
          ].map(k => (
            <div key={k.label} className={`rounded-xl border p-4 ${k.cls}`}>
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">{k.label}</p>
              <p className={`mt-2 text-[22px] font-bold ${k.val}`}>{k.value}</p>
              <p className="mt-1 text-[11px] text-gray-500">{k.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
          {/* DEPT CHART */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-4 py-3">
              <h3 className="text-[15px] font-bold text-gray-900">Attendance by Department</h3>
              <p className="mt-0.5 text-[11px] text-gray-500">Present (green) vs total (gray)</p>
            </div>
            <div className="p-3">
              {deptData.length > 0 ? (
                <ResponsiveContainer width="100%" height={230}>
                  <BarChart data={deptData} barGap={2}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="dept" tick={{ fontSize: 8, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Bar dataKey="total" name="Total Staff" fill="#e5e7eb" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="present" name="Present" fill="#10b981" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[230px] items-center justify-center text-[12px] text-gray-400">No staff data available</div>
              )}
            </div>
          </div>

          {/* MONTHLY TREND */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-4 py-3">
              <h3 className="text-[15px] font-bold text-gray-900">Monthly Presence Trend</h3>
              <p className="mt-0.5 text-[11px] text-gray-500">{dayjs(date).format("MMMM YYYY")} — daily headcount</p>
            </div>
            <div className="p-3">
              {monthlyTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={230}>
                  <LineChart data={monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="day" tick={{ fontSize: 9, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <ReferenceLine y={allStaff.length} stroke="#ef4444" strokeDasharray="4 2" strokeWidth={1} label={{ value: "Full Team", position: "right", fontSize: 9 }} />
                    <Line type="monotone" dataKey="present" name="Present" stroke="#ef4444" strokeWidth={2} dot={{ fill: "#ef4444", r: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[230px] items-center justify-center text-[12px] text-gray-400">No monthly data yet</div>
              )}
            </div>
          </div>

          {/* PAYROLL */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-4 py-3">
              <h3 className="text-[15px] font-bold text-gray-900">Payroll Overview</h3>
              <p className="mt-0.5 text-[11px] text-gray-500">Estimated cost for today's present staff</p>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                  <p className="text-[9px] font-bold uppercase tracking-wide text-gray-400">Monthly Total</p>
                  <p className="mt-1.5 text-[18px] font-bold text-gray-900">₹{totalMonthlySalary.toLocaleString()}</p>
                </div>
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
                  <p className="text-[9px] font-bold uppercase tracking-wide text-gray-400">Today (Present)</p>
                  <p className="mt-1.5 text-[18px] font-bold text-emerald-700">₹{dailyPayroll.toLocaleString()}</p>
                </div>
              </div>
              <div className="space-y-1.5 max-h-[145px] overflow-y-auto">
                {Object.values(deptMap).map((d: any) => {
                  const deptPresent = allStaff.filter((s: any) => s.department === d.dept && presentIds.has(s.id));
                  const deptCost = Math.round(deptPresent.reduce((sum: number, s: any) => sum + Number(s.salary || 0), 0) / 30);
                  return (
                    <div key={d.dept} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold ${DEPT_COLOR[d.dept] || "bg-gray-100 text-gray-700"}`}>{d.dept}</span>
                        <span className="text-[11px] text-gray-600">{d.present}/{d.total}</span>
                      </div>
                      <span className="text-[11px] font-semibold text-gray-900">₹{deptCost.toLocaleString()}/day</span>
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
              <h3 className="text-[15px] font-bold text-gray-900">Attendance Register</h3>
              <p className="mt-0.5 text-[11px] text-gray-500">{dayjs(date).format("dddd, DD MMMM YYYY")} · {selectedBranch?.name}</p>
            </div>
            <div className="flex gap-2">
              <span className="rounded-lg bg-emerald-50 px-3 py-1.5 text-[10px] font-bold text-emerald-700">{presentCount} Present</span>
              <span className="rounded-lg bg-red-50 px-3 py-1.5 text-[10px] font-bold text-red-700">{absentCount} Absent</span>
              {lateCount > 0 && <span className="rounded-lg bg-orange-50 px-3 py-1.5 text-[10px] font-bold text-orange-700">{lateCount} Late</span>}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-[12px]">
              <thead className="bg-gray-50">
                <tr className="border-b border-gray-100">
                  {["Staff", "Dept", "Role", "Clock In", "Clock Out", "Breaks", "Hours", "Salary/Day", "Status"].map(h => (
                    <th key={h} className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-wide text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allStaff.map((s: any) => {
                  const att = attendance.find((a: any) => a.userId === s.id);
                  const isPresent = !!att?.loginTime;
                  const isLate = isPresent && (dayjs(att.loginTime).hour() > 9 || (dayjs(att.loginTime).hour() === 9 && dayjs(att.loginTime).minute() > 15));
                  const breaks = att?.breaks || [];
                  const breakMins = breaks.reduce((sum: number, b: any) => sum + Number(b.totalMinutes || 0), 0);
                  return (
                    <tr key={s.id} className={`border-b border-gray-50 transition hover:bg-gray-50/40 ${!isPresent ? "bg-red-50/20" : isLate ? "bg-orange-50/20" : ""}`}>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-red-400 to-pink-500 text-[11px] font-bold text-white">
                            {s.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{s.name}</p>
                            <p className="text-[9px] text-gray-400">{s.phone || ""}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold ${DEPT_COLOR[s.department] || "bg-gray-100 text-gray-700"}`}>
                          {s.department || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-gray-600">{s.role}</td>
                      <td className="px-4 py-2.5">
                        <span className={`font-medium ${isLate ? "text-orange-600" : "text-gray-900"}`}>{fmt(att?.loginTime)}</span>
                        {isLate && <span className="ml-1 text-[9px] text-orange-500">(Late)</span>}
                      </td>
                      <td className="px-4 py-2.5 text-gray-600">{fmt(att?.logoutTime)}</td>
                      <td className="px-4 py-2.5 text-gray-500">{breakMins > 0 ? `${breakMins}m` : "—"}</td>
                      <td className="px-4 py-2.5 font-semibold text-gray-900">{fmtHrs(Number(att?.totalHours || 0))}</td>
                      <td className="px-4 py-2.5 text-gray-700">₹{Math.round(Number(s.salary || 0) / 30).toLocaleString()}</td>
                      <td className="px-4 py-2.5">
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                          isPresent ? (isLate ? "bg-orange-50 text-orange-600" : "bg-emerald-50 text-emerald-600") : "bg-red-50 text-red-600"
                        }`}>
                          {isPresent ? (isLate ? "Late" : "Present") : "Absent"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {allStaff.length === 0 && (
                  <tr><td colSpan={9} className="py-14 text-center text-[12px] text-gray-400">No staff found for this branch. Add staff in Shops → Staff section.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}

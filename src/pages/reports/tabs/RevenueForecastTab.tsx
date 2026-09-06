import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

/**
 * Projected revenue for the period ahead, from the forecasting engine.
 *
 * Extracted from Report.tsx as part of breaking up a 4,254-line component.
 * Chosen by measurement: it referenced a single value from the
 * parent scope, now its prop. The characterisation suite in
 * Report.characterisation.test.tsx is what verifies the move changed nothing.
 */

interface RevenueForecastTabProps {
  forecastData: any;
}

export default function RevenueForecastTab({ forecastData }: RevenueForecastTabProps) {
  return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              {[
                {
                  label: "Last 7-Day Avg",
                  value: `₹${(forecastData?.summary?.avg7 || 0).toLocaleString("en-IN")}`,
                  sub: "daily average",
                  color: "blue",
                },
                {
                  label: "Prev 7-Day Avg",
                  value: `₹${(forecastData?.summary?.avgPrev7 || 0).toLocaleString("en-IN")}`,
                  sub: "comparison period",
                  color: "gray",
                },
                {
                  label: "Growth Rate",
                  value: `${forecastData?.summary?.growthPercent >= 0 ? "+" : ""}${forecastData?.summary?.growthPercent || 0}%`,
                  sub: "week over week",
                  color:
                    (forecastData?.summary?.growthPercent || 0) >= 0
                      ? "emerald"
                      : "red",
                },
                {
                  label: "Forecast (7 days)",
                  value: `₹${(forecastData?.summary?.forecastTotal || 0).toLocaleString("en-IN")}`,
                  sub: "predicted next week",
                  color: "violet",
                },
              ].map((k) => (
                <div
                  key={k.label}
                  className={`rounded-xl border p-4 ${k.color === "blue" ? "border-blue-100 bg-blue-50/60" : k.color === "emerald" ? "border-emerald-100 bg-emerald-50/60" : k.color === "red" ? "border-red-100 bg-red-50/60" : k.color === "violet" ? "border-violet-100 bg-violet-50/60" : "border-gray-200 bg-gray-50"}`}
                >
                  <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                    {k.label}
                  </p>
                  <p
                    className={`mt-2 text-[20px] font-bold ${k.color === "blue" ? "text-blue-700" : k.color === "emerald" ? "text-emerald-700" : k.color === "red" ? "text-red-700" : k.color === "violet" ? "text-violet-700" : "text-gray-700"}`}
                  >
                    {k.value}
                  </p>
                  <p className="mt-1 text-[11px] text-gray-500">{k.sub}</p>
                </div>
              ))}
            </div>

            {/* History + Forecast chart */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-4 py-3">
                <h3 className="text-[15px] font-bold text-gray-900">
                  30-Day History + 7-Day Forecast
                </h3>
                <p className="mt-0.5 text-[11px] text-gray-500">
                  Solid line = actual · Dashed area = predicted range (±15%)
                </p>
              </div>
              <div className="p-3">
                {forecastData?.history?.length > 0 ? (
                  (() => {
                    const combined = [
                      ...(forecastData.history || []).map((d: any) => ({
                        ...d,
                        type: "actual",
                      })),
                      ...(forecastData.forecast || []).map((d: any) => ({
                        date: d.date,
                        revenue: d.predicted,
                        lower: d.lower,
                        upper: d.upper,
                        type: "forecast",
                      })),
                    ];
                    return (
                      <ResponsiveContainer width="100%" height={260}>
                        <AreaChart data={combined}>
                          <defs>
                            <linearGradient id="fg" x1="0" y1="0" x2="0" y2="1">
                              <stop
                                offset="5%"
                                stopColor="#8b5cf6"
                                stopOpacity={0.12}
                              />
                              <stop
                                offset="95%"
                                stopColor="#8b5cf6"
                                stopOpacity={0}
                              />
                            </linearGradient>
                            <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
                              <stop
                                offset="5%"
                                stopColor="#ef4444"
                                stopOpacity={0.12}
                              />
                              <stop
                                offset="95%"
                                stopColor="#ef4444"
                                stopOpacity={0}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="#f1f5f9"
                          />
                          <XAxis
                            dataKey="date"
                            tick={{ fontSize: 9, fill: "#6b7280" }}
                            axisLine={false}
                            tickLine={false}
                            interval={4}
                          />
                          <YAxis
                            tick={{ fontSize: 9, fill: "#6b7280" }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                          />
                          <Tooltip
                            formatter={(v: any) =>
                              `₹${Number(v).toLocaleString("en-IN")}`
                            }
                          />
                          <Area
                            type="monotone"
                            dataKey="revenue"
                            stroke="#ef4444"
                            strokeWidth={2}
                            fill="url(#ag)"
                            name="Actual Revenue"
                          />
                          <Area
                            type="monotone"
                            dataKey="upper"
                            stroke="#8b5cf6"
                            strokeWidth={1}
                            strokeDasharray="4 2"
                            fill="url(#fg)"
                            name="Upper Forecast"
                          />
                          <Line
                            type="monotone"
                            dataKey="lower"
                            stroke="#8b5cf6"
                            strokeWidth={1}
                            strokeDasharray="4 2"
                            dot={false}
                            name="Lower Forecast"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    );
                  })()
                ) : (
                  <div className="flex h-[260px] items-center justify-center text-[12px] text-gray-400">
                    Not enough historical data for forecast
                  </div>
                )}
              </div>
            </div>

            {/* Weekly breakdown + 7-day forecast table */}
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-4 py-3">
                  <h3 className="text-[15px] font-bold text-gray-900">
                    Last 4 Weeks Revenue
                  </h3>
                </div>
                <div className="p-3">
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={forecastData?.weeklyRevenue || []}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#f1f5f9"
                      />
                      <XAxis
                        dataKey="week"
                        tick={{ fontSize: 10, fill: "#6b7280" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 9, fill: "#6b7280" }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        formatter={(v: any) =>
                          `₹${Number(v).toLocaleString("en-IN")}`
                        }
                      />
                      <Bar
                        dataKey="revenue"
                        name="Revenue"
                        fill="#ef4444"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-violet-100 bg-white shadow-sm">
                <div className="border-b border-violet-100 bg-violet-50/40 px-4 py-3">
                  <h3 className="text-[15px] font-bold text-gray-900">
                    7-Day Revenue Forecast
                  </h3>
                  <p className="mt-0.5 text-[11px] text-gray-500">
                    Based on 7-day rolling average + growth rate
                  </p>
                </div>
                <div className="divide-y divide-gray-50">
                  {(forecastData?.forecast || []).map((f: any) => (
                    <div
                      key={f.date}
                      className="flex items-center justify-between px-4 py-2.5"
                    >
                      <p className="text-[12px] font-semibold text-gray-900">
                        {f.date}
                      </p>
                      <div className="text-right">
                        <p className="text-[13px] font-bold text-violet-700">
                          ₹{f.predicted.toLocaleString("en-IN")}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          ₹{f.lower.toLocaleString("en-IN")} – ₹
                          {f.upper.toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>
                  ))}
                  {!forecastData?.forecast?.length && (
                    <div className="py-8 text-center text-[12px] text-gray-400">
                      No forecast data available
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
  );
}

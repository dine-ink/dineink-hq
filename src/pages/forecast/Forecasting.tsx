import { useState } from "react";
import { PresentationChartLineIcon } from "@heroicons/react/24/outline";
import OverviewTab from "./OverviewTab";
import BranchComparisonTab from "./BranchComparisonTab";
import AccuracyTab from "./AccuracyTab";
import ReportsTab from "./ReportsTab";
import PeakHourForecastTab from "./PeakHourForecastTab";
import DemandForecastTab from "./DemandForecastTab";
import InventoryForecastTab from "./InventoryForecastTab";

const TABS = ["Overview", "Branch Comparison", "Peak Hour", "Demand", "Inventory", "Accuracy", "Reports"];

export default function Forecasting() {
  const [activeTab, setActiveTab] = useState("Overview");

  return (
    <main className="flex flex-col overflow-hidden bg-[#f5f6fa]">
      <div className="mx-auto flex h-full w-full flex-col gap-4 overflow-hidden">
        {/* HEADER */}
        <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
          <div className="relative z-10 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#b10000] shadow-sm">
                <PresentationChartLineIcon className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="text-[22px] font-black leading-none tracking-tight text-gray-900">
                  Forecasting
                </h1>
                <p className="mt-1 text-[12px] text-gray-500">
                  Predicted future performance from your own historical data — forecasts never overwrite actuals
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-xl px-3.5 py-2 text-[12px] font-semibold transition-all duration-200 ${
                    activeTab === tab
                      ? "bg-[#b10000] text-white shadow-sm"
                      : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          {activeTab === "Overview" && <OverviewTab />}
          {activeTab === "Branch Comparison" && <BranchComparisonTab />}
          {activeTab === "Peak Hour" && <PeakHourForecastTab />}
          {activeTab === "Demand" && <DemandForecastTab />}
          {activeTab === "Inventory" && <InventoryForecastTab />}
          {activeTab === "Accuracy" && <AccuracyTab />}
          {activeTab === "Reports" && <ReportsTab />}
        </div>
      </div>
    </main>
  );
}

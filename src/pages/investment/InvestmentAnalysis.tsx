import { useState } from "react";
import { BuildingLibraryIcon } from "@heroicons/react/24/outline";
import OverviewTab from "./OverviewTab";
import ProjectsTab from "./ProjectsTab";
import BranchComparisonTab from "./BranchComparisonTab";
import ReportsTab from "./ReportsTab";
import TabStrip from "@/components/common/TabStrip";

const TABS = ["Overview", "Projects", "Branch Comparison", "Reports"];

export default function InvestmentAnalysis() {
  const [activeTab, setActiveTab] = useState("Overview");

  return (
    <main className="flex flex-col overflow-hidden bg-[#f5f6fa]">
      <div className="mx-auto flex h-full w-full flex-col gap-4 overflow-hidden">
        {/* HEADER */}
        <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
          <div className="relative z-10 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#b10000] shadow-sm">
                <BuildingLibraryIcon className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="text-[22px] font-black leading-none tracking-tight text-gray-900">
                  Investment Analysis
                </h1>
                <p className="mt-1 text-[12px] text-gray-500">
                  Evaluate capital investments — new branches, upgrades, renovations — before committing money
                </p>
              </div>
            </div>

            <TabStrip tabs={TABS} value={activeTab} onChange={setActiveTab} />
          </div>
        </div>

        {/* CONTENT */}
        <div className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          {activeTab === "Overview" && <OverviewTab />}
          {activeTab === "Projects" && <ProjectsTab />}
          {activeTab === "Branch Comparison" && <BranchComparisonTab />}
          {activeTab === "Reports" && <ReportsTab />}
        </div>
      </div>
    </main>
  );
}

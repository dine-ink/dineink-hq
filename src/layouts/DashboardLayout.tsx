import { Outlet, Link, NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import Logo, { LogoWordmark } from "@/components/common/Logo";
import { logoMarkClasses } from "@/components/common/logoTokens";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  Menu,
  MenuButton,
  MenuItems,
  MenuItem,
} from "@headlessui/react";
import {
  Bars3Icon,
  BellIcon,
  BuildingStorefrontIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  CreditCardIcon,
  HomeIcon,
  UsersIcon,
  XMarkIcon,
  DocumentChartBarIcon,
  CalendarDaysIcon,
  BanknotesIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowsRightLeftIcon,
  FireIcon,
  ArrowDownTrayIcon,
  TruckIcon,
  ClipboardDocumentCheckIcon,
  ScaleIcon,
  DocumentTextIcon,
  ChartBarSquareIcon,
  BeakerIcon,
  PresentationChartLineIcon,
  BuildingLibraryIcon,
  Squares2X2Icon,
  SparklesIcon,
  WrenchScrewdriverIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";
import { useAppDispatch, useAppSelector } from "@/store";
import { setSelectedBranch } from "@/store/slices/branchSlice";
import { setPreset, setCustomRange } from "@/store/slices/dateRangeSlice";
import type { Preset } from "@/store/slices/dateRangeSlice";

const NAV = [
  { name: "Dashboard", href: "/dashboard", icon: HomeIcon },
  { name: "Shops", href: "/dashboard/shops", icon: BuildingStorefrontIcon },
  { name: "Bills", href: "/dashboard/bills", icon: CreditCardIcon },
  { name: "Customers", href: "/dashboard/customers", icon: UsersIcon },
  {
    name: "Operations",
    href: "/dashboard/menu-management",
    icon: ClipboardDocumentListIcon,
  },
  { name: "Insights", href: "/dashboard/insights", icon: ChartBarIcon },
  { name: "Reports", href: "/dashboard/reports", icon: DocumentChartBarIcon },
  {
    name: "Financial Statements",
    href: "/dashboard/financial-statements",
    icon: DocumentTextIcon,
  },
  {
    name: "Budget vs Actual",
    href: "/dashboard/budget",
    icon: ChartBarSquareIcon,
  },
  {
    name: "Scenario Analysis",
    href: "/dashboard/scenario-analysis",
    icon: BeakerIcon,
  },
  {
    name: "Forecasting",
    href: "/dashboard/forecasting",
    icon: PresentationChartLineIcon,
  },
  {
    name: "Investment Analysis",
    href: "/dashboard/investment-analysis",
    icon: BuildingLibraryIcon,
  },
  {
    name: "Executive Dashboard",
    href: "/dashboard/executive",
    icon: Squares2X2Icon,
  },
  {
    name: "AI Financial Advisor",
    href: "/dashboard/ai-advisor",
    icon: SparklesIcon,
  },
  {
    name: "Stock Audit",
    href: "/dashboard/daily-stock-audit",
    icon: ClipboardDocumentCheckIcon,
  },
  { name: "Attendance", href: "/dashboard/attendance", icon: CalendarDaysIcon },
  { name: "Cash", href: "/dashboard/cash", icon: BanknotesIcon },
  { name: "Vendors", href: "/dashboard/vendors", icon: TruckIcon },
  {
    name: "Procurement Intelligence",
    href: "/dashboard/procurement-intelligence",
    icon: ScaleIcon,
  },
  { name: "Compare", href: "/dashboard/comparison", icon: ArrowsRightLeftIcon },
  { name: "Kitchen", href: "/dashboard/kitchen", icon: FireIcon },
  { name: "Labor & Capacity", href: "/dashboard/labor-capacity", icon: UserGroupIcon, roles: ["OWNER", "MANAGER"] },
  { name: "Cash Flow", href: "/dashboard/cash-flow", icon: BanknotesIcon, roles: ["OWNER", "MANAGER"] },
  { name: "Dues", href: "/dashboard/dues", icon: DocumentTextIcon, roles: ["OWNER", "MANAGER"] },
  { name: "Equipment", href: "/dashboard/equipment", icon: WrenchScrewdriverIcon, roles: ["OWNER", "MANAGER"] },
  { name: "Compliance", href: "/dashboard/compliance", icon: ShieldCheckIcon, roles: ["OWNER", "MANAGER"] },
  { name: "WhatsApp", href: "/dashboard/whatsapp", icon: ChatBubbleLeftRightIcon, roles: ["OWNER", "MANAGER"] },
  { name: "Banking", href: "/dashboard/banking", icon: BuildingLibraryIcon, roles: ["OWNER", "MANAGER"] },
];

const navLinkCls = (isActive: boolean, collapsed: boolean) =>
  `group flex items-center rounded-lg text-[11px] font-semibold transition-all duration-200 ${
    collapsed ? "justify-center p-2.5" : "gap-2.5 px-2.5 py-2"
  } ${isActive ? "bg-white/15 text-white shadow-sm" : "text-white/60 hover:bg-white/10 hover:text-white"}`;

const iconCls = (isActive: boolean) =>
  `h-4 w-4 shrink-0 transition ${isActive ? "text-white" : "text-white/60 group-hover:text-white"}`;

const PRESETS: { key: Preset; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "week", label: "7D" },
  { key: "month", label: "30D" },
  { key: "quarter", label: "90D" },
  { key: "custom", label: "Custom" },
];

export default function DashboardLayout() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // Redux state
  const { branches, selectedBranch } = useAppSelector((s) => s.branch);
  const { user, token } = useAppSelector((s) => s.auth);
  const { preset, from, to } = useAppSelector((s) => s.dateRange);

  // Nav items with a `roles` allowlist are hidden from anyone whose role
  // isn't in it — the first role-based nav filtering in this app, backing
  // the RequireRole route guard on the same pages (see routes/RequireRole.tsx).
  const visibleNav = NAV.filter((item) => !item.roles || item.roles.includes(user?.role));

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [customFrom, setCustomFrom] = useState(from);
  const [customTo, setCustomTo] = useState(to);
  const [downloading, setDownloading] = useState(false);

  const handlePresetClick = (p: Preset) => {
    if (p === "custom") {
      setShowCustomPicker((v) => !v);
    } else {
      setShowCustomPicker(false);
      dispatch(setPreset(p));
    }
  };

  const handleCustomApply = () => {
    if (customFrom && customTo) {
      dispatch(setCustomRange({ from: customFrom, to: customTo }));
      setShowCustomPicker(false);
    }
  };

  const handleDownload = async () => {
    if (!user?.restaurantId || !selectedBranch?.id || !token) return;
    try {
      setDownloading(true);
      // Dynamically imported — jszip/jspdf/exceljs (pulled in transitively
      // via generateFullReport.ts) are only fetched when a download is
      // actually requested, instead of being forced into every dashboard
      // page's bundle just because this layout wraps all of them.
      const { generateAndDownloadFullReport } =
        await import("@/utils/generateFullReport");
      await generateAndDownloadFullReport({
        restaurantName: user?.name || "Restaurant",
        branchName: selectedBranch?.name || "Branch",
        from,
        to,
        restaurantId: user.restaurantId,
        branchId: selectedBranch.id,
        token,
        apiUrl: import.meta.env.VITE_API_URL,
        areaSqFt: selectedBranch?.areaSqFt,
      });
    } catch (e) {
      console.error("Report download failed", e);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* ── MOBILE SIDEBAR ─────────────────────────────────── */}
      <Dialog
        open={sidebarOpen}
        onClose={setSidebarOpen}
        className="relative z-40 lg:hidden"
      >
        <DialogBackdrop className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        <div className="fixed inset-0 flex">
          <DialogPanel className="relative flex w-72 flex-col bg-[#b10000] pt-5 pb-4">
            <div className="absolute top-3 right-3">
              <button
                onClick={() => setSidebarOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="px-5 pb-4">
              <Logo
                tone="onColor"
                size="md"
                subtitle="Restaurant Intelligence"
              />
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto px-3 no-scrollbar">
              {visibleNav.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
                >
                  <item.icon className="h-4.5 w-4.5 shrink-0" />
                  {item.name}
                </Link>
              ))}
            </nav>
          </DialogPanel>
        </div>
      </Dialog>

      {/* ── DESKTOP SIDEBAR ────────────────────────────────── */}
      <div
        className={`hidden lg:fixed lg:inset-y-0 lg:z-30 lg:flex lg:flex-col transition-all duration-300 ${collapsed ? "lg:w-[60px]" : "lg:w-[192px]"}`}
      >
        <div className="relative flex h-full flex-col overflow-hidden bg-[#b10000]">
          {/* <div className="pointer-events-none absolute -top-16 -left-8 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 right-0 h-40 w-40 rounded-full bg-black/10 blur-3xl" /> */}
          <div className="relative flex h-12 shrink-0 items-center justify-between px-3">
            <button
              onClick={() => setCollapsed(!collapsed)}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className={`${logoMarkClasses("onColor", "sm")} transition hover:bg-white/30`}
            >
              D
            </button>
            {!collapsed && (
              <div className="ml-2 flex-1 overflow-hidden">
                <LogoWordmark
                  tone="onColor"
                  size="sm"
                  subtitle="Restaurant OS"
                />
              </div>
            )}
            {!collapsed && (
              <button
                onClick={() => setCollapsed(true)}
                className="flex h-6 w-6 items-center justify-center rounded-lg text-white/60 hover:text-white"
              >
                <ChevronLeftIcon className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <nav className="flex flex-1 flex-col justify-between overflow-y-auto px-2 pb-2 no-scrollbar">
            <div className="space-y-0.5">
              {!collapsed && (
                <p className="mb-1.5 px-1.5 text-[8px] font-bold uppercase tracking-[0.2em] text-red-300/60">
                  Menu
                </p>
              )}
              {visibleNav.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  end
                  className={({ isActive }) => navLinkCls(isActive, collapsed)}
                  title={collapsed ? item.name : undefined}
                >
                  {({ isActive }) => (
                    <>
                      <item.icon className={iconCls(isActive)} />
                      {!collapsed && (
                        <span className="truncate">{item.name}</span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
            {collapsed && (
              <div className="space-y-1">
                <div className="border-t border-white/10 pt-2">
                  <button
                    onClick={() => setCollapsed(false)}
                    className="flex w-full items-center justify-center py-1.5 text-white/50 hover:text-white transition"
                  >
                    <ChevronRightIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </nav>
        </div>
      </div>

      {/* ── MAIN AREA ──────────────────────────────────────── */}
      <div
        className={`flex h-dvh flex-col overflow-hidden transition-all duration-300 ${collapsed ? "lg:pl-[60px]" : "lg:pl-[192px]"}`}
      >
        {/* TOP BAR */}
        <header className="relative z-20 shrink-0 bg-[#b10000] shadow-sm">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {/* <div className="absolute -top-8 left-1/3 h-32 w-32 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-red-300/20 blur-2xl" /> */}
          </div>
          {/* Left curve decoration */}
          <div className="hidden lg:block">
            <div className="absolute -bottom-2 left-0 h-2 w-2 bg-[#b10000]">
              <div className="h-2 w-2 rounded-tl-[24px] bg-gray-100"></div>
            </div>
          </div>

          {/* Top row: mobile menu + branch + notifications + profile */}
          <div className="relative flex flex-wrap items-center gap-x-2 gap-y-1 px-3 py-1.5 lg:h-11 lg:flex-nowrap lg:justify-between lg:px-4 lg:py-0">
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation menu"
              className="relative -m-1.5 shrink-0 p-1.5 text-white lg:hidden"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
            <div className="lg:hidden">
              <LogoWordmark tone="onColor" size="sm" />
            </div>
            {/* ── GLOBAL DATE FILTER BAR ─────────────────────── */}
            <div className="relative order-last w-full min-w-0 overflow-x-auto border-t border-white/10 px-0 py-1.5 lg:order-none lg:w-auto lg:flex-1 lg:border-t-0 lg:px-4">
              <div className="flex items-center gap-2 whitespace-nowrap">
                <div className="flex items-center gap-0.5 rounded-xl border border-white/15 bg-white/10 p-0.5 backdrop-blur">
                  {PRESETS.map((p) => (
                    <button
                      key={p.key}
                      onClick={() => handlePresetClick(p.key)}
                      className={`rounded-lg px-3 py-1 text-[11px] font-bold transition-all ${
                        preset === p.key
                          ? "bg-white text-red-600 shadow-sm"
                          : "text-white/70 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {/* Show selected range */}
                <span className="text-[10px] text-white/50">
                  {from} → {to}
                </span>

                {/* Custom date picker — inline below the pills */}
                {showCustomPicker && (
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={customFrom}
                      onChange={(e) => setCustomFrom(e.target.value)}
                      className="h-7 rounded-lg border border-white/20 bg-white/15 px-2 text-[11px] text-white outline-none focus:border-white/40 backdrop-blur"
                    />
                    <span className="text-[10px] text-white/60">→</span>
                    <input
                      type="date"
                      value={customTo}
                      onChange={(e) => setCustomTo(e.target.value)}
                      className="h-7 rounded-lg border border-white/20 bg-white/15 px-2 text-[11px] text-white outline-none focus:border-white/40 backdrop-blur"
                    />
                    <button
                      onClick={handleCustomApply}
                      className="rounded-lg bg-white px-3 py-1 text-[11px] font-bold text-red-600 transition hover:bg-[#b10000]"
                    >
                      Apply
                    </button>
                    <button
                      onClick={() => setShowCustomPicker(false)}
                      className="text-white/50 hover:text-white transition"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="relative ml-auto flex shrink-0 items-center gap-1.5 lg:gap-2">
              {/* Branch selector */}
              {branches.length > 0 && (
                <select
                  value={selectedBranch?.id || ""}
                  onChange={(e) => {
                    const b = branches.find(
                      (b: any) => b.id === Number(e.target.value),
                    );
                    if (b) dispatch(setSelectedBranch(b));
                  }}
                  className="flex min-w-[90px] max-w-[130px] cursor-pointer appearance-none rounded-xl border border-white/20 bg-white/15 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur-xl outline-none transition hover:bg-white/20 focus:border-white/40"
                  style={{
                    backgroundImage:
                      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='white' viewBox='0 0 20 20'%3E%3Cpath fill-rule='evenodd' d='M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z' clip-rule='evenodd'/%3E%3C/svg%3E\")",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 8px center",
                    backgroundSize: "12px",
                    paddingRight: "28px",
                  }}
                >
                  {branches.map((b: any) => (
                    <option
                      key={b.id}
                      value={b.id}
                      className="bg-white text-gray-900"
                    >
                      {b.name}
                    </option>
                  ))}
                </select>
              )}
              {/* Download Report */}
              <button
                onClick={handleDownload}
                disabled={downloading}
                title="Download full report as Excel"
                className="flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur-xl transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {downloading ? (
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <ArrowDownTrayIcon className="h-3.5 w-3.5" />
                )}
                <span className="hidden lg:inline">
                  {downloading ? "Generating..." : "Export"}
                </span>
              </button>

              <button
                aria-label="Notifications"
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/20 lg:h-7 lg:w-7"
              >
                <BellIcon className="h-4 w-4" />
              </button>
              <Menu as="div" className="relative">
                <MenuButton className="flex items-center gap-1.5 rounded-xl bg-white/10 px-2 py-1 transition hover:bg-white/20">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/30 text-[10px] font-black text-white">
                    {user?.name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                  <ChevronDownIcon className="h-3 w-3 text-white/70" />
                </MenuButton>
                <MenuItems className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-gray-200/80">
                  <div className="border-b border-gray-100 px-4 py-3">
                    <p className="text-[13px] font-bold text-gray-900">
                      {user?.name}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-gray-400">
                      {user?.email}
                    </p>
                  </div>
                  <div className="py-1.5">
                    <MenuItem>
                      <button
                        onClick={() => navigate("/dashboard/settings")}
                        className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-[13px] text-gray-700 transition hover:bg-gray-50"
                      >
                        <Cog6ToothIcon className="h-4 w-4 text-gray-400" />
                        Account Settings
                      </button>
                    </MenuItem>
                    <div className="my-1 border-t border-gray-100" />
                    <MenuItem>
                      <button
                        onClick={() => {
                          localStorage.clear();
                          window.location.href = "/login";
                        }}
                        className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-[13px] font-semibold text-red-600 transition hover:bg-[#b10000]"
                      >
                        <XMarkIcon className="h-4 w-4" />
                        Sign Out
                      </button>
                    </MenuItem>
                  </div>
                </MenuItems>
              </Menu>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 px-3 py-3 sm:px-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

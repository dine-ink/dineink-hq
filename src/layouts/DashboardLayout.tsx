import { Outlet, Link } from "react-router-dom";
import { useState } from "react";
import { NavLink } from "react-router-dom";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  TransitionChild,
  Menu,
  MenuButton,
  MenuItems,
  MenuItem,
} from "@headlessui/react";

import {
  Bars3CenterLeftIcon,
  BellIcon,
  BuildingStorefrontIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  CreditCardIcon,
  HomeIcon,
  MagnifyingGlassIcon,
  QueueListIcon,
  Squares2X2Icon,
  UsersIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: HomeIcon },
  { name: "Shops", href: "/dashboard/shops", icon: BuildingStorefrontIcon },
  { name: "Bills", href: "/dashboard/bills", icon: CreditCardIcon },
  { name: "Customers", href: "/dashboard/customers", icon: UsersIcon },
  {
    name: "Menu Management",
    href: "/dashboard/menu-management",
    icon: ClipboardDocumentListIcon,
  },
  { name: "Insights", href: "/dashboard/insights", icon: ChartBarIcon },
];

const secondaryNavigation = [
  { name: "Settings", href: "/dashboard/settings", icon: Cog6ToothIcon },
];

export default function DashboardLayout() {
  const branches = JSON.parse(localStorage.getItem("branches") || "[]");

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(branches[0]);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  return (
    <div className="min-h-screen ">
      {/* MOBILE SIDEBAR (SAME AS YOUR CODE) */}
      <Dialog
        open={sidebarOpen}
        onClose={setSidebarOpen}
        className="relative z-40 lg:hidden"
      >
        <DialogBackdrop className="fixed inset-0 bg-black/50" />
        <div className="fixed inset-0 flex">
          <DialogPanel className="relative flex w-full max-w-xs flex-1 flex-col bg-red-700 pt-5 pb-4">
            <TransitionChild>
              <div className="absolute top-0 right-0 -mr-12 pt-2">
                <button onClick={() => setSidebarOpen(false)}>
                  <XMarkIcon className="h-6 w-6 text-white" />
                </button>
              </div>
            </TransitionChild>
            <div className="px-6 text-2xl font-bold text-white">DineInk</div>
            <nav className="mt-8 flex-1 space-y-2 px-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="flex items-center rounded-xl px-4 py-3 text-sm font-medium text-red-100 hover:bg-red-600 hover:text-white"
                >
                  <item.icon className="mr-3 h-4.5 w-4.5" />
                  {item.name}
                </Link>
              ))}
            </nav>
          </DialogPanel>
        </div>
      </Dialog>
      {/* DESKTOP SIDEBAR (SAME) */}
      <div
        className={`hidden lg:fixed lg:inset-y-0 lg:z-30 lg:flex lg:flex-col transition-all duration-300 ${
          collapsed ? "lg:w-[68px]" : "lg:w-[200px]"
        }`}
      >
        <div className="relative flex h-full flex-col overflow-visible bg-gradient-to-b from-red-600 via-red-500 to-rose-600">
          {/* SIDEBAR GLOW */}
          <div className="pointer-events-none absolute -top-20 -left-10 h-56 w-56 rounded-full bg-white/10 blur-3xl"></div>
          <div className="pointer-events-none absolute bottom-0 left-0 h-48 w-48 rounded-full bg-black/10 blur-3xl"></div>
          {/* LOGO */}
          <div className={`relative py-3 transition-all duration-300 pl-3`}>
            <div className="flex items-center gap-3">
              {/* LOGO BUTTON */}
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="relative z-50 flex h-12 w-12 items-center justify-center rounded-xl bg-white/17 backdrop-blur transition hover:bg-white/25"
              >
                <span className="text-2xl font-bold text-red-300">D</span>
              </button>
              <div
                className={`pointer-events-none absolute top-3 z-50 transition-all duration-300 ${
                  collapsed
                    ? "left-[68px] opacity-0"
                    : "left-[64px] opacity-100"
                }`}
              >
                <div className="ml-3 backdrop-blur-md">
                  <h1 className="whitespace-nowrap text-lg font-bold tracking-tight">
                    <span className="text-white">Dine</span>
                    <span className="text-red-300">Ink</span>
                  </h1>
                  <p className="whitespace-nowrap text-[10px] text-red-100/80">
                    Restaurant Intelligence
                  </p>
                </div>
              </div>
            </div>
          </div>
          {/* NAVIGATION */}
          <nav className="flex flex-1 flex-col justify-between px-4 py-3">
            <div className="space-y-2">
              {!collapsed && (
                <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white via-white to-gray-100/90 px-4 py-3 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* TEXT */}
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-red-600">
                          Main Menu
                        </p>
                        <p className="mt-0.5 text-[9px] text-black/80">
                          Navigation & modules
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {navigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  end
                  className={({ isActive }) =>
                    `group flex items-center rounded-2xl text-sm font-medium transition-all duration-200 ${
                      collapsed
                        ? "justify-center px-0 py-2.5"
                        : "gap-3 px-3 py-2"
                    } ${
                      isActive
                        ? "bg-black/10 text-cyan-200 shadow-lg"
                        : "text-slate-200 hover:bg-black/10 hover:text-cyan-200 hover:shadow-lg"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div
                        className={`flex h-7 w-7 items-center justify-center rounded-xl transition-all duration-200  ${
                          isActive
                            ? "bg-black/20"
                            : "bg-black/10 group-hover:bg-black/20"
                        }`}
                      >
                        <item.icon
                          className={`h-4.5 w-4.5 transition ${
                            isActive
                              ? "text-cyan-200"
                              : "text-slate-300 group-hover:text-cyan-200"
                          }`}
                        />
                      </div>
                      {!collapsed && <span>{item.name}</span>}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
            {/* BOTTOM SECTION */}
            <div className="space-y-3">
              {/* SECONDARY NAV */}
              <div className="space-y-3">
                {/* SECTION CARD */}
                {!collapsed && (
                  <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white via-white to-gray-100/90 px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-red-600">
                          Preferences
                        </p>
                        <p className="mt-0.5 text-[9px] text-black/80">
                          Settings & account
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {/* NAV ITEMS */}
                <div className="space-y-2">
                  {secondaryNavigation.map((item) => (
                    <NavLink
                      key={item.name}
                      to={item.href}
                      className={({ isActive }) =>
                        `group flex items-center rounded-2xl text-sm font-medium transition-all duration-200 ${
                          collapsed
                            ? "justify-center px-0 py-2.5"
                            : "gap-3 px-3 py-2"
                        } ${
                          isActive
                            ? "bg-black/10 text-cyan-200 shadow-lg"
                            : "text-slate-200 hover:bg-black/10 hover:text-cyan-200 hover:shadow-lg"
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200 group-hover:scale-105 ${
                              isActive
                                ? "bg-black/20"
                                : "bg-black/10 group-hover:bg-black/20"
                            }`}
                          >
                            <item.icon
                              className={`h-4.5 w-4.5 transition ${
                                isActive
                                  ? "text-cyan-200"
                                  : "text-slate-300 group-hover:text-cyan-200"
                              }`}
                            />
                          </div>
                          {!collapsed && <span>{item.name}</span>}
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
              </div>
            </div>
          </nav>
        </div>
      </div>
      {/* MAIN */}
      <div
        className={`h-screen flex flex-col overflow-hidden transition-all duration-300 ${
          collapsed ? "lg:pl-[68px]" : "lg:pl-[200px]"
        }`}
      >
        {/* TOPBAR */}
        <div className="relative flex h-14 shrink-0 items-center justify-between bg-gradient-to-r from-red-600 via-red-500 to-rose-500 px-6">
          {/* TOPBAR GLOW */}
          <div className="pointer-events-none absolute -top-10 left-1/3 h-40 w-40 rounded-full bg-white/10 blur-3xl"></div>
          <div className="pointer-events-none absolute right-0 top-0 h-32 w-32 rounded-full bg-red-300/20 blur-2xl"></div>
          {/* CURVE */}
          <div className="hidden lg:block">
            <div className="absolute -bottom-3 left-0 h-3 w-3 bg-red-600">
              <div className="h-3 w-3 rounded-tl-[28px] bg-gray-100"></div>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden">
            <Bars3CenterLeftIcon className="h-6 w-6" />
          </button>
          {/* <div
            className={`flex flex-1 justify-center px-2 transition-all duration-300 lg:justify-start ${
              collapsed
                ? "lg:ml-24"
                : "lg:ml-6"
            }`}
          >
            <div className="grid w-full max-w-lg grid-cols-1 lg:max-w-xs">
              <input
                placeholder="Search"
                className="col-start-1 row-start-1 block w-full rounded-md bg-white py-2 pr-3 pl-10 text-sm text-gray-900 border border-gray-300 focus:ring-2 focus:ring-gray-200"
              />
              <MagnifyingGlassIcon className="pointer-events-none col-start-1 row-start-1 ml-3 size-5 self-center text-gray-400" />
            </div>
          </div> */}
          <div className="flex items-center gap-4">
            {/* BRANCH SELECTOR */}
            <select
              value={selectedBranch?.id || ""}
              onChange={(e) => {
                const branch = branches.find(
                  (s: any) => s.id === Number(e.target.value),
                );

                setSelectedBranch(branch);

                localStorage.setItem("selectedBranch", JSON.stringify(branch));

                window.dispatchEvent(new Event("branchChanged"));
              }}
              className="
                hidden lg:flex
                min-w-[180px]
                appearance-none
                rounded-2xl
                border border-white/20
                bg-white/15
                px-5 py-2.5
                text-sm font-semibold text-white
                shadow-lg shadow-red-900/10
                backdrop-blur-xl
                outline-none
                transition-all duration-200
                hover:bg-white/20
                focus:border-white/40
                focus:ring-2 focus:ring-white/20
                cursor-pointer
              "
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='white' viewBox='0 0 20 20'%3E%3Cpath fill-rule='evenodd' d='M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z' clip-rule='evenodd'/%3E%3C/svg%3E\")",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 14px center",
                backgroundSize: "16px",
              }}
            >
              {branches.map((branch: any) => (
                <option
                  key={branch.id}
                  value={branch.id}
                  className="bg-white text-gray-800"
                >
                  {branch.name}
                </option>
              ))}
            </select>

            <BellIcon className="h-4.5 w-4.5 text-white" />

            <Menu as="div" className="relative">
              <MenuButton className="flex items-center gap-2">
                <img
                  className="h-7 w-7 rounded-full"
                  src="https://i.pravatar.cc/40"
                />

                <ChevronDownIcon className="h-4 w-4 text-white" />
              </MenuButton>

              <MenuItems className="absolute right-0 top-full z-50 mt-3 w-56 overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-gray-200">
                {/* USER INFO */}
                <div className="border-b border-gray-100 px-4 py-3">
                  <p className="text-sm font-semibold text-gray-900">
                    {user?.name}
                  </p>

                  <p className="mt-1 text-xs text-gray-500">{user?.email}</p>
                </div>

                {/* MENU ITEMS */}
                <div className="py-2">
                  <MenuItem>
                    <button className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-gray-700 transition hover:bg-gray-50">
                      <QueueListIcon className="h-4.5 w-4.5 text-gray-500" />
                      Help & Support
                    </button>
                  </MenuItem>

                  <MenuItem>
                    <button className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-gray-700 transition hover:bg-gray-50">
                      <ClipboardDocumentListIcon className="h-4.5 w-4.5 text-gray-500" />
                      Documentation
                    </button>
                  </MenuItem>

                  <MenuItem>
                    <button
                      onClick={() => {
                        localStorage.clear();
                        window.location.href = "/login";
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-red-600 transition hover:bg-red-50"
                    >
                      <Cog6ToothIcon className="h-4.5 w-4.5" />
                      Logout
                    </button>
                  </MenuItem>
                </div>
              </MenuItems>
            </Menu>
          </div>
        </div>
        <main className="flex-1 overflow-y-auto bg-gray-100 px-4 py-3">
          <div className="mx-auto ">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

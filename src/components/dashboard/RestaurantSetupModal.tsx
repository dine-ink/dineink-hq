import { Fragment, useState } from "react";
import { useAppSelector } from "../../store";
import {
  Dialog,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import {
  BuildingStorefrontIcon,
  QueueListIcon,
  Squares2X2Icon,
  CreditCardIcon,
  UsersIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {
  MdRestaurant,
  MdLocalPizza,
  MdCoffee,
  MdCake,
  MdIcecream,
  MdLunchDining,
  MdFastfood,
  MdEmojiFoodBeverage,
  MdSetMeal,
  MdBakeryDining,
  MdLocalBar,
  MdLiquor,
  MdRamenDining,
  MdSoupKitchen,
  MdRiceBowl,
  MdDinnerDining,
  MdKebabDining,
  MdLocalCafe,
  MdBrunchDining,
  MdOutdoorGrill,
  MdWineBar,
  MdTapas,
  MdLocalDining,
  MdTakeoutDining,
  MdDeliveryDining,
  MdStorefront,
  MdRestaurantMenu,
  MdFlatware,
  MdBreakfastDining,
} from "react-icons/md";
import {
  GiNoodles,
  GiSandwich,
  GiSteak,
  GiChickenLeg,
  GiWok,
  GiTacos,
  GiHotDog,
  GiCupcake,
  GiShrimp,
  GiSushis,
  GiDumpling,
} from "react-icons/gi";
import {
  FaLeaf,
  FaEgg,
  FaCocktail,
  FaBeer,
  FaCheese,
  FaFish,
} from "react-icons/fa";
import { SparklesIcon } from "lucide-react";
import { State, City } from "country-state-city";

const tabs = [
  {
    name: "Restaurant Details",
    sub: "Business info & branding",
    icon: BuildingStorefrontIcon,
  },
  { name: "Branch Setup", sub: "Locations & seating", icon: Squares2X2Icon },
  { name: "Menu Setup", sub: "Categories & dishes", icon: QueueListIcon },
  {
    name: "Billing Settings",
    sub: "GST, payments & tax",
    icon: CreditCardIcon,
  },
  { name: "Staff Setup", sub: "Team & access", icon: UsersIcon },
];

type StaffType = {
  name: string;
  email: string;
  phone: string;
  role: string;
  hasLogin: boolean;
  password: string;
  department?: string;
  salary?: number;
  joiningDate?: string;
  shift?: string;
  branchId?: number | null;
};

type BillingType = {
  billingTypes: string[];
  gstPercentage: string;
  serviceCharge: string;
  includeGST: boolean;
  enableDiscount: boolean;
  enableTips: boolean;
  paymentMethods: string[];
};

type BranchType = {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  tables: { name: string; capacity: number }[];
  tablesCount: number;
  billing: BillingType;
};

interface Props {
  open: boolean;
  setOpen: (value: boolean) => void;
}

const iconOptions = [
  // Meal types
  { name: "Starter", icon: MdFlatware },
  { name: "Main Dish", icon: MdRestaurantMenu },
  { name: "Side Dish", icon: MdLunchDining },
  { name: "Breakfast", icon: MdBreakfastDining },
  { name: "Brunch", icon: MdBrunchDining },
  { name: "Dinner", icon: MdDinnerDining },
  { name: "Snacks", icon: MdFastfood },
  { name: "Dessert", icon: MdCake },
  // Cuisine types
  { name: "South Indian", icon: MdRiceBowl },
  { name: "North Indian", icon: MdDinnerDining },
  { name: "Biryani", icon: MdSetMeal },
  { name: "Kebab", icon: MdKebabDining },
  { name: "Chinese", icon: MdRamenDining },
  { name: "Noodles", icon: GiNoodles },
  { name: "Wok / Stir Fry", icon: GiWok },
  { name: "Soup", icon: MdSoupKitchen },
  { name: "Pizza", icon: MdLocalPizza },
  { name: "Burger", icon: MdFastfood },
  { name: "Sandwich", icon: GiSandwich },
  { name: "Hot Dog", icon: GiHotDog },
  { name: "Tacos", icon: GiTacos },
  { name: "Steak / BBQ", icon: GiSteak },
  { name: "Grill", icon: MdOutdoorGrill },
  { name: "Chicken", icon: GiChickenLeg },
  { name: "Chicken Wings", icon: GiChickenLeg },
  { name: "Seafood", icon: GiShrimp },
  { name: "Fish", icon: FaFish },
  { name: "Salad", icon: FaLeaf },
  { name: "Sushi", icon: GiSushis },
  { name: "Eggs", icon: FaEgg },
  { name: "Cheese / Dairy", icon: FaCheese },
  { name: "Vegan", icon: FaLeaf },
  { name: "Spicy", icon: FaLeaf },
  // Bakery & Sweet
  { name: "Bakery", icon: MdBakeryDining },
  { name: "Cupcake", icon: GiCupcake },
  { name: "Ice Cream", icon: MdIcecream },
  // Beverages
  { name: "Coffee", icon: MdCoffee },
  { name: "Cafe", icon: MdLocalCafe },
  { name: "Drinks", icon: MdEmojiFoodBeverage },
  { name: "Cocktail", icon: FaCocktail },
  { name: "Beer", icon: FaBeer },
  { name: "Liquor", icon: MdLiquor },
  { name: "Bar", icon: MdLocalBar },
  { name: "Wine Bar", icon: MdWineBar },
  // Service types
  { name: "Tapas", icon: MdTapas },
  { name: "Multi Cuisine", icon: MdLocalDining },
  { name: "Takeaway", icon: MdTakeoutDining },
  { name: "Delivery", icon: MdDeliveryDining },
  { name: "Restaurant", icon: MdRestaurant },
  { name: "Store", icon: MdStorefront },
];

const emptyBilling = (): BillingType => ({
  billingTypes: [],
  gstPercentage: "",
  serviceCharge: "",
  includeGST: false,
  enableDiscount: true,
  enableTips: false,
  paymentMethods: [],
});

const emptyBranch = (): BranchType => ({
  name: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  tables: [],
  tablesCount: 0,
  billing: emptyBilling(),
});

const INPUT_CLS =
  "w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-100";
const LABEL_CLS = "mb-1.5 block text-xs font-semibold text-gray-600";
const BRANCH_INPUT_CLS =
  "w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-red-500";

export default function RestaurantSetupModal({ open, setOpen }: Props) {
  const API_URL = import.meta.env.VITE_API_URL;
  const [selectedTab, setSelectedTab] = useState(0);
  const { user, token: authToken } = useAppSelector((s) => s.auth);

  const [showIconPicker, setShowIconPicker] = useState<number | null>(null);
  const [branches, setBranches] = useState<BranchType[]>([emptyBranch()]);
  const [categories, setCategories] = useState([
    {
      name: "",
      icon: "",
      items: [{ name: "", price: "", type: "Veg", prepTime: "" }],
    },
  ]);
  const [staff, setStaff] = useState<StaffType[]>([
    {
      name: "",
      email: "",
      phone: "",
      role: "STAFF",
      hasLogin: false,
      password: "1234",
      salary: 0,
      joiningDate: "",
      shift: "",
      branchId: null,
      department: "",
    },
  ]);
  const [restaurant, setRestaurant] = useState({
    name: "",
    email: user.email || "",
    phone: user.phone || "",
    address: "",
    gst: "",
    logoFile: null as File | null,
  });
  const [loading, setLoading] = useState(false);

  const updateBranch = (i: number, updates: Partial<BranchType>) =>
    setBranches((prev) =>
      prev.map((b, idx) => (idx === i ? { ...b, ...updates } : b)),
    );

  const updateBranchBilling = (i: number, updates: Partial<BillingType>) =>
    setBranches((prev) =>
      prev.map((b, idx) =>
        idx === i ? { ...b, billing: { ...b.billing, ...updates } } : b,
      ),
    );

  const copyBillingFrom = (targetIndex: number, sourceIndex: number) =>
    setBranches((prev) =>
      prev.map((b, i) =>
        i === targetIndex
          ? { ...b, billing: { ...prev[sourceIndex].billing } }
          : b,
      ),
    );

  const applyBillingToAll = (sourceIndex: number) =>
    setBranches((prev) => {
      const src = prev[sourceIndex].billing;
      return prev.map((b, i) =>
        i === sourceIndex ? b : { ...b, billing: { ...src } },
      );
    });

  const updateBranchTable = (
    bi: number,
    ti: number,
    updates: Partial<{ name: string; capacity: number }>,
  ) =>
    setBranches((prev) =>
      prev.map((b, i) =>
        i !== bi
          ? b
          : {
              ...b,
              tables: b.tables.map((t, j) =>
                j === ti ? { ...t, ...updates } : t,
              ),
            },
      ),
    );

  const updateCategory = (i: number, updates: object) =>
    setCategories((prev) =>
      prev.map((c, idx) => (idx === i ? { ...c, ...updates } : c)),
    );

  const updateCategoryItem = (ci: number, ii: number, updates: object) =>
    setCategories((prev) =>
      prev.map((c, i) =>
        i !== ci
          ? c
          : {
              ...c,
              items: c.items.map((item, j) =>
                j === ii ? { ...item, ...updates } : item,
              ),
            },
      ),
    );

  const updateStaff = (i: number, updates: Partial<StaffType>) =>
    setStaff((prev) =>
      prev.map((s, idx) => (idx === i ? { ...s, ...updates } : s)),
    );

  const handleCloseSetup = () => {
    if (
      window.confirm(
        "If you close now, all setup progress will be lost. Do you really want to close?",
      )
    ) {
      setOpen(false);
    }
  };

  const handleSubmitSetup = async () => {
    if (loading) return;
    if (
      !restaurant.name ||
      !restaurant.phone ||
      !restaurant.address ||
      !restaurant.email ||
      !restaurant.gst
    ) {
      alert("Please fill all required restaurant details");
      return;
    }
    try {
      setLoading(true);
      if (!authToken) {
        alert("Session expired. Please login again.");
        return;
      }
      const filteredStaff = staff.filter((s) => s.name && s.phone);
      const filteredBranches = branches
        .filter((b) => b.name)
        .map((b) => ({ ...b, tables: b.tables || [], billing: b.billing }));
      const filteredCategories = categories
        .filter((cat) => cat.name)
        .map((cat) => ({
          name: cat.name,
          icon: cat.icon,
          items: cat.items
            .filter((item) => item.name && item.price)
            .map((item) => ({
              name: item.name,
              price: item.price ? Number(item.price) : 0,
              type: item.type,
              prepTime: item.prepTime ? Number(item.prepTime) : 0,
            })),
        }));
      const formData = new FormData();
      if (restaurant.logoFile) formData.append("logo", restaurant.logoFile);
      formData.append(
        "data",
        JSON.stringify({
          restaurant: {
            name: restaurant.name,
            email: restaurant.email,
            phone: restaurant.phone,
            address: restaurant.address,
            gst: restaurant.gst,
          },
          branches: filteredBranches,
          categories: filteredCategories,
          staff: filteredStaff,
        }),
      );
      const res = await fetch(`${API_URL}/api/restaurant/setup`, {
        method: "POST",
        headers: { Authorization: `Bearer ${authToken}` },
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("restaurant", JSON.stringify(data.restaurant));
        localStorage.setItem("branches", JSON.stringify(data.branches));
        setOpen(false);
        window.location.reload();
      } else {
        alert(data.message);
      }
    } catch {
      alert("Setup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Transition show={open} as={Fragment}>
      <Dialog onClose={() => {}} className="relative z-50">
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </TransitionChild>
        <div className="fixed inset-0 overflow-hidden">
          <div className="flex min-h-full items-center justify-center p-4">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="relative flex h-[88vh] w-full overflow-hidden rounded-2xl border border-white/40 bg-gradient-to-br from-gray-50 via-white to-red-50/30 shadow-[0_25px_80px_rgba(0,0,0,0.12)] backdrop-blur-2xl">
                {loading && (
                  <div className="absolute inset-0 z-50 flex items-center justify-center rounded-2xl bg-white/75 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-10 w-10 animate-spin rounded-full border-4 border-red-200 border-t-red-600" />
                      <p className="text-sm font-semibold text-gray-700">
                        Saving your setup...
                      </p>
                    </div>
                  </div>
                )}
                {/* LEFT SIDEBAR */}
                <div className="hidden w-[280px] shrink-0 border-r border-white/40 bg-white/70 backdrop-blur-xl lg:flex lg:flex-col">
                  <div className="flex h-full flex-col overflow-hidden p-5">
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-500 to-rose-500 p-5 shadow-lg">
                      <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10 blur-3xl" />
                      <div className="relative z-10 flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
                          <SparklesIcon className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h2 className="text-base font-bold text-white">
                            DineInk Setup
                          </h2>
                          <p className="text-[11px] text-red-100">
                            Step {selectedTab + 1} of {tabs.length}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-semibold text-red-100 uppercase tracking-wide">
                            Progress
                          </span>
                          <span className="text-[10px] font-bold text-white">
                            {Math.round(
                              ((selectedTab + 1) / tabs.length) * 100,
                            )}
                            %
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-white/20">
                          <div
                            className="h-1.5 rounded-full bg-white transition-all duration-500"
                            style={{
                              width: `${((selectedTab + 1) / tabs.length) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex-1 overflow-y-auto">
                      <nav className="space-y-1.5">
                        {tabs.map((tab, index) => (
                          <button
                            key={tab.name}
                            onClick={() => setSelectedTab(index)}
                            className={`group flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition-all duration-200 ${
                              selectedTab === index
                                ? "border-red-100 bg-gradient-to-r from-red-50 to-white shadow-sm"
                                : "border-transparent text-gray-700 hover:bg-white hover:shadow-sm"
                            }`}
                          >
                            <div
                              className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition ${
                                selectedTab === index
                                  ? "bg-red-100"
                                  : "bg-gray-100 group-hover:bg-red-50"
                              }`}
                            >
                              <tab.icon
                                className={`h-4 w-4 ${selectedTab === index ? "text-red-600" : "text-gray-500"}`}
                              />
                              <span
                                className={`absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-black ${
                                  selectedTab === index
                                    ? "bg-red-500 text-white"
                                    : "bg-gray-300 text-gray-600"
                                }`}
                              >
                                {index + 1}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <p
                                className={`text-[12px] font-semibold truncate ${selectedTab === index ? "text-red-700" : "text-gray-800"}`}
                              >
                                {tab.name}
                              </p>
                              <p className="mt-0.5 text-[10px] text-gray-400 truncate">
                                {tab.sub}
                              </p>
                            </div>
                          </button>
                        ))}
                      </nav>
                    </div>
                  </div>
                </div>
                {/* RIGHT CONTENT */}
                <div className="flex flex-1 flex-col overflow-hidden bg-white/40 backdrop-blur-xl">
                  <div className="border-b border-white/40 bg-white/60 px-6 py-4 backdrop-blur-xl">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-rose-500 shadow-sm">
                          {(() => {
                            const Icon = tabs[selectedTab].icon;
                            return <Icon className="h-5 w-5 text-white" />;
                          })()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-xl font-bold tracking-tight text-gray-900">
                              {tabs[selectedTab].name}
                            </h3>
                            <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-500">
                              {selectedTab + 1}/{tabs.length}
                            </span>
                          </div>
                          <p className="mt-0.5 text-[12px] text-gray-400">
                            {tabs[selectedTab].sub}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleCloseSetup}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-gray-400 shadow-sm transition hover:bg-red-50 hover:text-red-500"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto px-5 py-4">
                    {selectedTab === 0 && (
                      <div className="rounded-2xl border border-white/40 bg-white/80 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.05)] backdrop-blur-xl">
                        <div className="mb-3">
                          <h2 className="text-base font-bold text-gray-900">
                            Restaurant Details
                          </h2>
                          <p className="mt-2 text-sm text-gray-500">
                            Basic business information and branding
                          </p>
                        </div>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          <div className="md:col-span-2">
                            <label className={LABEL_CLS}>Restaurant Name</label>
                            <input
                              type="text"
                              value={restaurant.name}
                              onChange={(e) =>
                                setRestaurant({
                                  ...restaurant,
                                  name: e.target.value,
                                })
                              }
                              placeholder="Enter restaurant name"
                              className={INPUT_CLS}
                            />
                          </div>
                          <div>
                            <label className={LABEL_CLS}>Email Address</label>
                            <input
                              type="email"
                              value={restaurant.email}
                              onChange={(e) =>
                                setRestaurant({
                                  ...restaurant,
                                  email: e.target.value,
                                })
                              }
                              placeholder="Enter email address"
                              className={INPUT_CLS}
                            />
                          </div>
                          <div>
                            <label className={LABEL_CLS}>Phone Number</label>
                            <input
                              type="text"
                              value={restaurant.phone}
                              onChange={(e) =>
                                setRestaurant({
                                  ...restaurant,
                                  phone: e.target.value,
                                })
                              }
                              placeholder="Enter phone number"
                              className={INPUT_CLS}
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className={LABEL_CLS}>Address</label>
                            <textarea
                              rows={1}
                              value={restaurant.address}
                              onChange={(e) =>
                                setRestaurant({
                                  ...restaurant,
                                  address: e.target.value,
                                })
                              }
                              placeholder="Enter complete restaurant address"
                              className={INPUT_CLS}
                            />
                          </div>
                          <div>
                            <label className={LABEL_CLS}>GST Number</label>
                            <input
                              type="text"
                              value={restaurant.gst}
                              onChange={(e) =>
                                setRestaurant({
                                  ...restaurant,
                                  gst: e.target.value,
                                })
                              }
                              placeholder="Enter GST number"
                              className={INPUT_CLS}
                            />
                          </div>
                          <div>
                            <label className={LABEL_CLS}>Restaurant Logo</label>
                            <div className="rounded-2xl border border-dashed border-red-300 bg-red-50 p-6 text-center">
                              <input
                                type="file"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file)
                                    setRestaurant({
                                      ...restaurant,
                                      logoFile: file,
                                    });
                                }}
                                className="block w-full text-sm text-gray-600"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {selectedTab === 1 && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h2 className="text-lg font-bold tracking-tight text-gray-900">
                              Branch Management
                            </h2>
                            <p className="mt-2 text-sm text-gray-500">
                              Configure branch details, seating and operational
                              setup
                            </p>
                          </div>
                          <div className="rounded-2xl border border-red-100 bg-gradient-to-r from-red-50 px-5 py-4 shadow-sm">
                            <p className="text-xs font-medium uppercase tracking-wide text-red-500">
                              Total Branches
                            </p>
                            <p className="mt-1 text-lg font-bold text-red-600">
                              {branches.length}
                            </p>
                          </div>
                        </div>
                        {branches.map((branch, index) => (
                          <div
                            key={index}
                            className="overflow-hidden rounded-[32px] border border-white/40 bg-white/80 shadow-[0_8px_30px_rgba(0,0,0,0.05)] backdrop-blur-xl"
                          >
                            <div className="relative overflow-hidden border-b border-gray-100 bg-gradient-to-r from-red-500 to-rose-500 px-4 py-3">
                              <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
                              <div className="relative z-10 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-9 w-9 items-center justify-center rounded-3xl bg-white/15 backdrop-blur">
                                    <BuildingStorefrontIcon className="h-5 w-5 text-white" />
                                  </div>
                                  <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-100">
                                      Restaurant Branch
                                    </p>
                                    <h3 className="mt-2 text-base font-bold text-white">
                                      {branch.name || `Branch ${index + 1}`}
                                    </h3>
                                    <p className="mt-1 text-sm text-red-100">
                                      Configure location and table setup
                                    </p>
                                  </div>
                                </div>
                                {branches.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setBranches(
                                        branches.filter((_, i) => i !== index),
                                      )
                                    }
                                    className="rounded-2xl bg-white/15 px-5 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
                                  >
                                    Remove Branch
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="p-8">
                              <div className="mb-3 flex items-center justify-between">
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-900">
                                    Branch Information
                                  </h4>
                                  <p className="mt-1 text-sm text-gray-500">
                                    Enter operational and location details
                                  </p>
                                </div>
                                <div className="rounded-2xl bg-gray-50 px-5 py-4">
                                  <p className="text-xs text-gray-500">
                                    Tables Configured
                                  </p>
                                  <p className="mt-1 text-base font-bold text-gray-900">
                                    {branch.tables?.length || 0}
                                  </p>
                                </div>
                              </div>
                              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                <div className="md:col-span-2">
                                  <label className={LABEL_CLS}>
                                    Branch Name
                                  </label>
                                  <input
                                    type="text"
                                    value={branch.name}
                                    onChange={(e) =>
                                      updateBranch(index, {
                                        name: e.target.value,
                                      })
                                    }
                                    placeholder="Enter branch name"
                                    className={INPUT_CLS}
                                  />
                                </div>
                                <div>
                                  <label className={LABEL_CLS}>
                                    Branch Phone
                                  </label>
                                  <input
                                    type="text"
                                    value={branch.phone}
                                    onChange={(e) =>
                                      updateBranch(index, {
                                        phone: e.target.value,
                                      })
                                    }
                                    placeholder="Enter phone number"
                                    className={INPUT_CLS}
                                  />
                                </div>
                                <div>
                                  <label className={LABEL_CLS}>
                                    Branch Email
                                  </label>
                                  <input
                                    type="email"
                                    value={branch.email}
                                    onChange={(e) =>
                                      updateBranch(index, {
                                        email: e.target.value,
                                      })
                                    }
                                    placeholder="Enter email address"
                                    className={INPUT_CLS}
                                  />
                                </div>
                                <div className="md:col-span-2">
                                  <label className={LABEL_CLS}>
                                    Branch Address
                                  </label>
                                  <textarea
                                    rows={1}
                                    value={branch.address}
                                    onChange={(e) =>
                                      updateBranch(index, {
                                        address: e.target.value,
                                      })
                                    }
                                    placeholder="Enter branch address"
                                    className={INPUT_CLS}
                                  />
                                </div>
                                <div>
                                  <label className={LABEL_CLS}>State</label>
                                  <select
                                    value={branch.state}
                                    onChange={(e) =>
                                      updateBranch(index, { state: e.target.value, city: "" })
                                    }
                                    className={INPUT_CLS}
                                  >
                                    <option value="">Select state</option>
                                    {State.getStatesOfCountry("IN").map((s) => (
                                      <option key={s.isoCode} value={s.name}>{s.name}</option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className={LABEL_CLS}>City</label>
                                  <select
                                    value={branch.city}
                                    onChange={(e) =>
                                      updateBranch(index, { city: e.target.value })
                                    }
                                    className={INPUT_CLS}
                                    disabled={!branch.state}
                                  >
                                    <option value="">{branch.state ? "Select city" : "Select state first"}</option>
                                    {branch.state && (() => {
                                      const stateObj = State.getStatesOfCountry("IN").find(s => s.name === branch.state);
                                      return stateObj
                                        ? City.getCitiesOfState("IN", stateObj.isoCode).map((c) => (
                                            <option key={c.name} value={c.name}>{c.name}</option>
                                          ))
                                        : null;
                                    })()}
                                  </select>
                                </div>
                                <div>
                                  <label className={LABEL_CLS}>Pincode</label>
                                  <input
                                    type="text"
                                    value={branch.pincode}
                                    onChange={(e) =>
                                      updateBranch(index, {
                                        pincode: e.target.value,
                                      })
                                    }
                                    placeholder="Enter pincode"
                                    className={INPUT_CLS}
                                  />
                                </div>
                                <div>
                                  <label className={LABEL_CLS}>
                                    Number of Tables
                                  </label>
                                  <input
                                    type="number"
                                    value={branch.tablesCount || ""}
                                    onChange={(e) => {
                                      const count = e.target.value === "" ? 0 : Number(e.target.value);
                                      updateBranch(index, {
                                        tablesCount: count,
                                        tables: Array.from(
                                          { length: count },
                                          (_, i) => ({
                                            name: `Table ${i + 1}`,
                                            capacity: 4,
                                          }),
                                        ),
                                      });
                                    }}
                                    placeholder="Enter number of tables"
                                    className={INPUT_CLS}
                                  />
                                </div>
                              </div>
                              {branch.tables?.length > 0 && (
                                <div className="mt-4">
                                  <div className="mb-2">
                                    <h4 className="text-sm font-semibold text-gray-900">
                                      Seating Configuration
                                    </h4>
                                    <p className="mt-1 text-sm text-gray-500">
                                      Customize table names and seating capacity
                                    </p>
                                  </div>
                                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    {branch.tables.map((table, tIndex) => (
                                      <div
                                        key={tIndex}
                                        className="rounded-2xl border border-gray-200 bg-gray-50 p-5"
                                      >
                                        <div className="mb-4">
                                          <p className="text-sm font-semibold text-gray-900">
                                            Table {tIndex + 1}
                                          </p>
                                          <p className="text-xs text-gray-500">
                                            Seating configuration
                                          </p>
                                        </div>
                                        <div className="space-y-4">
                                          <input
                                            value={table.name}
                                            onChange={(e) =>
                                              updateBranchTable(index, tIndex, {
                                                name: e.target.value,
                                              })
                                            }
                                            placeholder="Table name"
                                            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition-all focus:border-red-500 focus:ring-4 focus:ring-red-100"
                                          />
                                          <input
                                            type="number"
                                            value={table.capacity || ""}
                                            onChange={(e) =>
                                              updateBranchTable(index, tIndex, {
                                                capacity: e.target.value === "" ? 0 : Number(e.target.value),
                                              })
                                            }
                                            placeholder="Capacity"
                                            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition-all focus:border-red-500 focus:ring-4 focus:ring-red-100"
                                          />
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() =>
                            setBranches([...branches, emptyBranch()])
                          }
                          className="group flex w-full items-center justify-center gap-3 rounded-2xl border border-dashed border-red-300 bg-gradient-to-r from-red-50 px-6 py-6 text-sm font-semibold text-red-600 transition hover:shadow-lg"
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm">
                            <span className="text-xl">+</span>
                          </div>
                          Add Another Branch
                        </button>
                      </div>
                    )}
                    {selectedTab === 2 && (
                      <div className="space-y-4">
                        <div className="relative overflow-hidden rounded-2xl border border-red-100 bg-gradient-to-br from-red-500 to-rose-500 p-4 shadow-[0_25px_70px_rgba(255,0,80,0.18)]">
                          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
                          <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium text-red-100">
                                MENU MANAGEMENT
                              </p>
                              <h2 className="mt-2 text-lg font-bold text-white">
                                Configure Menu Categories
                              </h2>
                              <p className="mt-2 max-w-2xl text-sm leading-6 text-red-100">
                                Organize categories, menu items, pricing and
                                item types for your restaurant.
                              </p>
                            </div>
                            <div className="rounded-2xl bg-white/10 px-5 py-4 backdrop-blur-xl">
                              <p className="text-xs text-red-100">
                                Total Categories
                              </p>
                              <p className="mt-1 text-lg font-bold text-white">
                                {categories.length}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-6">
                          {categories.map((category, index) => (
                            <div
                              key={index}
                              className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:shadow-xl"
                            >
                              <div className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white px-6 py-5">
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                  <div className="flex flex-1 items-center gap-4">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setShowIconPicker(
                                          showIconPicker === index
                                            ? null
                                            : index,
                                        )
                                      }
                                      className="flex h-9 w-9 items-center justify-center rounded-2xl border border-red-100 bg-red-50 transition hover:scale-105"
                                    >
                                      {category.icon ? (
                                        (() => {
                                          const selected = iconOptions.find(
                                            (item) =>
                                              item.name === category.icon,
                                          );
                                          if (!selected) return null;
                                          const Icon = selected.icon;
                                          return (
                                            <Icon className="h-8 w-8 text-red-600" />
                                          );
                                        })()
                                      ) : (
                                        <span className="text-xs font-semibold text-red-500">
                                          ICON
                                        </span>
                                      )}
                                    </button>
                                    <div className="flex-1">
                                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                                        Category Name
                                      </p>
                                      <input
                                        type="text"
                                        value={category.name}
                                        onChange={(e) =>
                                          updateCategory(index, {
                                            name: e.target.value,
                                          })
                                        }
                                        className="w-full border-0 bg-transparent p-0 text-base font-bold text-gray-900 outline-none focus:ring-0"
                                        placeholder={`Category ${index + 1}`}
                                      />
                                      <p className="mt-1 text-sm text-gray-500">
                                        {category.items.length} menu items
                                      </p>
                                    </div>
                                  </div>
                                  {categories.length > 1 && (
                                    <button
                                      onClick={() =>
                                        setCategories(
                                          categories.filter(
                                            (_, i) => i !== index,
                                          ),
                                        )
                                      }
                                      className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                                    >
                                      Remove Category
                                    </button>
                                  )}
                                </div>
                                {showIconPicker === index && (
                                  <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-5">
                                    <p className="mb-4 text-sm font-semibold text-gray-700">
                                      Select Category Icon
                                    </p>
                                    <div className="grid grid-cols-4 gap-3 md:grid-cols-8">
                                      {iconOptions.map((item) => {
                                        const Icon = item.icon;
                                        return (
                                          <button
                                            key={item.name}
                                            onClick={() => {
                                              updateCategory(index, {
                                                icon: item.name,
                                              });
                                              setShowIconPicker(null);
                                            }}
                                            className={`flex h-16 items-center justify-center rounded-2xl border transition-all ${
                                              category.icon === item.name
                                                ? "border-red-500 bg-red-50 shadow-sm"
                                                : "border-gray-200 bg-white hover:border-red-300 hover:bg-red-50"
                                            }`}
                                          >
                                            <Icon className="h-7 w-7 text-red-600" />
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div className="space-y-4 p-6">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h4 className="text-sm font-semibold text-gray-900">
                                      Menu Items
                                    </h4>
                                    <p className="mt-1 text-sm text-gray-500">
                                      Add dishes, pricing and item type
                                    </p>
                                  </div>
                                  <button
                                    onClick={() =>
                                      updateCategory(index, {
                                        items: [
                                          ...category.items,
                                          {
                                            name: "",
                                            price: "",
                                            type: "Veg",
                                            prepTime: "",
                                          },
                                        ],
                                      })
                                    }
                                    className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500"
                                  >
                                    + Add Item
                                  </button>
                                </div>
                                <div className="space-y-4">
                                  {category.items.map((item, iIndex) => (
                                    <div
                                      key={iIndex}
                                      className="rounded-2xl border border-gray-200 bg-gray-50 p-5"
                                    >
                                      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
                                        <div className="xl:col-span-4">
                                          <label className="mb-2 block text-sm font-medium text-gray-700">
                                            Item Name
                                          </label>
                                          <input
                                            type="text"
                                            value={item.name}
                                            onChange={(e) =>
                                              updateCategoryItem(
                                                index,
                                                iIndex,
                                                { name: e.target.value },
                                              )
                                            }
                                            placeholder="Enter item name"
                                            className={BRANCH_INPUT_CLS}
                                          />
                                        </div>
                                        <div className="xl:col-span-2">
                                          <label className="mb-2 block text-sm font-medium text-gray-700">
                                            Price
                                          </label>
                                          <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                                              ₹
                                            </span>
                                            <input
                                              type="number"
                                              value={item.price}
                                              onChange={(e) =>
                                                updateCategoryItem(
                                                  index,
                                                  iIndex,
                                                  { price: e.target.value },
                                                )
                                              }
                                              placeholder="0"
                                              className="w-full rounded-2xl border border-gray-300 bg-white py-3 pl-9 pr-4 text-sm outline-none transition focus:border-red-500"
                                            />
                                          </div>
                                        </div>
                                        <div className="xl:col-span-2">
                                          <label className="mb-2 block text-sm font-medium text-gray-700">
                                            Prep Time
                                          </label>
                                          <div className="relative">
                                            <input
                                              type="number"
                                              value={item.prepTime || ""}
                                              onChange={(e) =>
                                                updateCategoryItem(
                                                  index,
                                                  iIndex,
                                                  { prepTime: e.target.value },
                                                )
                                              }
                                              placeholder="10"
                                              className="w-full rounded-2xl border border-gray-300 bg-white py-3 pl-4 pr-12 text-sm outline-none transition focus:border-red-500"
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400">
                                              mins
                                            </span>
                                          </div>
                                        </div>
                                        <div className="xl:col-span-3">
                                          <label className="mb-2 block text-sm font-medium text-gray-700">
                                            Type
                                          </label>
                                          <select
                                            value={item.type}
                                            onChange={(e) =>
                                              updateCategoryItem(
                                                index,
                                                iIndex,
                                                { type: e.target.value },
                                              )
                                            }
                                            className={BRANCH_INPUT_CLS}
                                          >
                                            <option value="Veg">Veg</option>
                                            <option value="Non Veg">
                                              Non Veg
                                            </option>
                                            <option value="Beverage">
                                              Beverage
                                            </option>
                                          </select>
                                        </div>
                                        <div className="flex items-end xl:col-span-1">
                                          <button
                                            onClick={() =>
                                              updateCategory(index, {
                                                items: category.items.filter(
                                                  (_, ii) => ii !== iIndex,
                                                ),
                                              })
                                            }
                                            className="w-full rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                                          >
                                            Remove
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ))}
                          <button
                            onClick={() =>
                              setCategories([
                                ...categories,
                                {
                                  name: "",
                                  icon: "",
                                  items: [
                                    {
                                      name: "",
                                      price: "",
                                      type: "Veg",
                                      prepTime: "",
                                    },
                                  ],
                                },
                              ])
                            }
                            className="flex w-full items-center justify-center gap-3 rounded-xl border-2 border-dashed border-red-300 bg-red-50 px-6 py-7 text-base font-semibold text-red-600 transition-all hover:bg-red-100"
                          >
                            + Add New Category
                          </button>
                        </div>
                      </div>
                    )}
                    {selectedTab === 3 && (
                      <div className="space-y-4 pb-24">
                        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-500 to-rose-500 p-4 shadow-[0_25px_70px_rgba(255,0,80,0.18)]">
                          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
                          <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium uppercase tracking-wide text-red-100">
                                BILLING CONFIGURATION
                              </p>
                              <h2 className="mt-2 text-lg font-bold text-white">
                                Configure Billing Settings
                              </h2>
                              <p className="mt-2 max-w-2xl text-sm leading-6 text-red-100">
                                Setup GST, service charges, payment methods and
                                billing workflows for every branch.
                              </p>
                            </div>
                            <div className="rounded-2xl bg-white/10 px-5 py-4 backdrop-blur-xl">
                              <p className="text-xs text-red-100">
                                Total Branches
                              </p>
                              <p className="mt-1 text-lg font-bold text-white">
                                {branches.length}
                              </p>
                            </div>
                          </div>
                        </div>
                        {branches.length > 1 && (
                          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3">
                            <div>
                              <p className="text-sm font-semibold text-red-700">
                                Apply same billing to all branches
                              </p>
                              <p className="text-xs text-red-400 mt-0.5">
                                Set up one branch and replicate to all others
                                instantly
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">
                                Use settings from
                              </span>
                              <select
                                defaultValue=""
                                onChange={(e) => {
                                  if (e.target.value !== "")
                                    applyBillingToAll(Number(e.target.value));
                                  e.target.value = "";
                                }}
                                className="rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 outline-none focus:border-red-400"
                              >
                                <option value="">Select branch...</option>
                                {branches.map((b, i) => (
                                  <option key={i} value={i}>
                                    {b.name || `Branch ${i + 1}`}
                                  </option>
                                ))}
                              </select>
                              <span className="text-xs text-gray-400">
                                → all branches
                              </span>
                            </div>
                          </div>
                        )}
                        {branches.map((branch, index) => (
                          <div
                            key={index}
                            className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:shadow-xl"
                          >
                            <div className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white px-4 py-3">
                              <div className="flex flex-wrap items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-red-50">
                                    <span className="text-xl font-bold text-red-600">
                                      {index + 1}
                                    </span>
                                  </div>
                                  <div>
                                    <h2 className="text-base font-bold text-gray-900">
                                      {branch.name || `Branch ${index + 1}`}
                                    </h2>
                                    <p className="mt-1 text-sm text-gray-500">
                                      Configure branch billing operations
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  {branches.length > 1 && (
                                    <div className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                                      <span className="text-xs text-gray-500 whitespace-nowrap">
                                        Same as
                                      </span>
                                      <select
                                        defaultValue=""
                                        onChange={(e) => {
                                          if (e.target.value !== "")
                                            copyBillingFrom(
                                              index,
                                              Number(e.target.value),
                                            );
                                          e.target.value = "";
                                        }}
                                        className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-700 outline-none focus:border-red-400"
                                      >
                                        <option value="">
                                          Choose branch...
                                        </option>
                                        {branches.map(
                                          (b, i) =>
                                            i !== index && (
                                              <option key={i} value={i}>
                                                {b.name || `Branch ${i + 1}`}
                                              </option>
                                            ),
                                        )}
                                      </select>
                                    </div>
                                  )}
                                  <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-3">
                                    <p className="text-xs text-gray-500">GST</p>
                                    <p className="mt-1 text-lg font-bold text-red-600">
                                      {branch.billing.gstPercentage || 0}%
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="space-y-5 p-4">
                              <div>
                                <div className="mb-2">
                                  <h3 className="text-sm font-bold text-gray-900">
                                    Billing Modules
                                  </h3>
                                  <p className="mt-1 text-sm text-gray-500">
                                    Select billing systems enabled for this
                                    branch
                                  </p>
                                </div>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                                  {[
                                    "Table Wise Billing",
                                    "Quick Billing",
                                    "Takeaway Billing",
                                    "Delivery Billing",
                                    "QR Ordering",
                                    "KOT Billing",
                                  ].map((type) => {
                                    const active =
                                      branch.billing.billingTypes.includes(
                                        type,
                                      );
                                    return (
                                      <label
                                        key={type}
                                        className={`group flex cursor-pointer items-center justify-between rounded-2xl border p-5 transition-all duration-200 ${
                                          active
                                            ? "border-red-500 bg-red-50 shadow-sm"
                                            : "border-gray-200 bg-white hover:border-red-300 hover:bg-red-50"
                                        }`}
                                      >
                                        <div>
                                          <p
                                            className={`text-sm font-semibold ${active ? "text-red-700" : "text-gray-800"}`}
                                          >
                                            {type}
                                          </p>
                                          <p className="mt-1 text-xs text-gray-500">
                                            Enable this billing workflow
                                          </p>
                                        </div>
                                        <input
                                          type="checkbox"
                                          checked={active}
                                          onChange={() => {
                                            const types =
                                              branch.billing.billingTypes;
                                            updateBranchBilling(index, {
                                              billingTypes: types.includes(type)
                                                ? types.filter(
                                                    (t) => t !== type,
                                                  )
                                                : [...types, type],
                                            });
                                          }}
                                          className="h-5 w-5 rounded border-gray-300 text-red-600 focus:ring-red-500"
                                        />
                                      </label>
                                    );
                                  })}
                                </div>
                              </div>
                              <div>
                                <div className="mb-2">
                                  <h3 className="text-sm font-bold text-gray-900">
                                    Tax & Service Charges
                                  </h3>
                                  <p className="mt-1 text-sm text-gray-500">
                                    Configure GST and service charge percentages
                                  </p>
                                </div>
                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                                      GST Percentage
                                    </label>
                                    <div className="relative">
                                      <input
                                        type="number"
                                        value={branch.billing.gstPercentage}
                                        onChange={(e) =>
                                          updateBranchBilling(index, {
                                            gstPercentage: e.target.value,
                                          })
                                        }
                                        placeholder="5"
                                        className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-4 pr-14 text-lg font-semibold outline-none transition focus:border-red-500"
                                      />
                                      <span className="absolute right-5 top-1/2 -translate-y-1/2 text-lg font-bold text-gray-400">
                                        %
                                      </span>
                                    </div>
                                  </div>
                                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                                      Service Charge
                                    </label>
                                    <div className="relative">
                                      <input
                                        type="number"
                                        value={branch.billing.serviceCharge}
                                        onChange={(e) =>
                                          updateBranchBilling(index, {
                                            serviceCharge: e.target.value,
                                          })
                                        }
                                        placeholder="10"
                                        className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-4 pr-14 text-lg font-semibold outline-none transition focus:border-red-500"
                                      />
                                      <span className="absolute right-5 top-1/2 -translate-y-1/2 text-lg font-bold text-gray-400">
                                        %
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div>
                                <div className="mb-2">
                                  <h3 className="text-sm font-bold text-gray-900">
                                    Billing Preferences
                                  </h3>
                                  <p className="mt-1 text-sm text-gray-500">
                                    Configure pricing and billing behaviors
                                  </p>
                                </div>
                                <div className="space-y-4">
                                  {(
                                    [
                                      {
                                        key: "includeGST",
                                        label: "Include GST In Item Price",
                                        desc: "GST will already be included in menu pricing",
                                      },
                                      {
                                        key: "enableDiscount",
                                        label: "Enable Discounts",
                                        desc: "Staff can apply discounts during billing",
                                      },
                                      {
                                        key: "enableTips",
                                        label: "Enable Customer Tips",
                                        desc: "Customers can add tips during checkout",
                                      },
                                    ] as const
                                  ).map(({ key, label, desc }) => (
                                    <label
                                      key={key}
                                      className="flex items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 p-5"
                                    >
                                      <div>
                                        <p className="text-sm font-semibold text-gray-900">
                                          {label}
                                        </p>
                                        <p className="mt-1 text-xs text-gray-500">
                                          {desc}
                                        </p>
                                      </div>
                                      <input
                                        type="checkbox"
                                        checked={branch.billing[key]}
                                        onChange={() =>
                                          updateBranchBilling(index, {
                                            [key]: !branch.billing[key],
                                          })
                                        }
                                        className="h-5 w-5 rounded border-gray-300 text-red-600 focus:ring-red-500"
                                      />
                                    </label>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <div className="mb-2">
                                  <h3 className="text-sm font-bold text-gray-900">
                                    Accepted Payment Methods
                                  </h3>
                                  <p className="mt-1 text-sm text-gray-500">
                                    Select available payment options for
                                    customers
                                  </p>
                                </div>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                                  {[
                                    "Cash",
                                    "Card",
                                    "UPI",
                                    "Net Banking",
                                    "Wallet",
                                    "Cheque",
                                  ].map((method) => {
                                    const active =
                                      branch.billing.paymentMethods.includes(
                                        method,
                                      );
                                    return (
                                      <label
                                        key={method}
                                        className={`group flex cursor-pointer items-center justify-between rounded-2xl border p-5 transition-all duration-200 ${
                                          active
                                            ? "border-red-500 bg-red-50 shadow-sm"
                                            : "border-gray-200 bg-white hover:border-red-300 hover:bg-red-50"
                                        }`}
                                      >
                                        <div>
                                          <p
                                            className={`text-sm font-semibold ${active ? "text-red-700" : "text-gray-800"}`}
                                          >
                                            {method}
                                          </p>
                                          <p className="mt-1 text-xs text-gray-500">
                                            Accept payments via {method}
                                          </p>
                                        </div>
                                        <input
                                          type="checkbox"
                                          checked={active}
                                          onChange={() => {
                                            const methods =
                                              branch.billing.paymentMethods;
                                            updateBranchBilling(index, {
                                              paymentMethods: methods.includes(
                                                method,
                                              )
                                                ? methods.filter(
                                                    (m) => m !== method,
                                                  )
                                                : [...methods, method],
                                            });
                                          }}
                                          className="h-5 w-5 rounded border-gray-300 text-red-600 focus:ring-red-500"
                                        />
                                      </label>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {selectedTab === 4 && (
                      <div className="space-y-4 pb-24">
                        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-500 to-rose-500 p-4 shadow-[0_25px_70px_rgba(255,0,80,0.18)]">
                          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
                          <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium uppercase tracking-wide text-red-100">
                                STAFF MANAGEMENT
                              </p>
                              <h2 className="mt-2 text-lg font-bold text-white">
                                Configure Restaurant Staff
                              </h2>
                              <p className="mt-2 max-w-2xl text-sm leading-6 text-red-100">
                                Add managers, cashiers, kitchen staff and assign
                                them to restaurant branches.
                              </p>
                            </div>
                            <div className="rounded-2xl bg-white/10 px-5 py-4 backdrop-blur-xl">
                              <p className="text-xs text-red-100">
                                Total Staff
                              </p>
                              <p className="mt-1 text-lg font-bold text-white">
                                {staff.length}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-6">
                          {staff.map((s, index) => (
                            <div
                              key={index}
                              className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:shadow-xl"
                            >
                              <div className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white px-6 py-5">
                                <div className="flex flex-wrap items-center justify-between gap-4">
                                  <div className="flex items-center gap-4">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-red-50">
                                      <span className="text-xl font-bold text-red-600">
                                        {s.name
                                          ? s.name.charAt(0).toUpperCase()
                                          : index + 1}
                                      </span>
                                    </div>
                                    <div>
                                      <h3 className="text-sm font-bold text-gray-900">
                                        {s.name || `Staff ${index + 1}`}
                                      </h3>
                                      <p className="mt-1 text-sm text-gray-500">
                                        {s.role || "STAFF"}
                                      </p>
                                    </div>
                                  </div>
                                  {staff.length > 1 && (
                                    <button
                                      onClick={() =>
                                        setStaff(
                                          staff.filter((_, i) => i !== index),
                                        )
                                      }
                                      className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                                    >
                                      Remove Staff
                                    </button>
                                  )}
                                </div>
                              </div>
                              <div className="p-6">
                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                                  <div>
                                    <label className={LABEL_CLS}>
                                      Full Name
                                    </label>
                                    <input
                                      placeholder="Enter staff name"
                                      value={s.name}
                                      onChange={(e) =>
                                        updateStaff(index, {
                                          name: e.target.value,
                                        })
                                      }
                                      className={BRANCH_INPUT_CLS}
                                    />
                                  </div>
                                  <div>
                                    <label className={LABEL_CLS}>
                                      Email Address
                                    </label>
                                    <input
                                      placeholder="Enter email"
                                      value={s.email}
                                      onChange={(e) =>
                                        updateStaff(index, {
                                          email: e.target.value,
                                        })
                                      }
                                      className={BRANCH_INPUT_CLS}
                                    />
                                  </div>
                                  <div>
                                    <label className={LABEL_CLS}>
                                      Phone Number
                                    </label>
                                    <input
                                      placeholder="Enter phone"
                                      value={s.phone}
                                      onChange={(e) =>
                                        updateStaff(index, {
                                          phone: e.target.value,
                                        })
                                      }
                                      className={BRANCH_INPUT_CLS}
                                    />
                                  </div>
                                  <div>
                                    <label className={LABEL_CLS}>Role</label>
                                    <select
                                      value={s.role}
                                      onChange={(e) =>
                                        updateStaff(index, {
                                          role: e.target.value,
                                        })
                                      }
                                      className={BRANCH_INPUT_CLS}
                                    >
                                      <option value="STAFF">Staff</option>
                                      <option value="MANAGER">Manager</option>
                                      <option value="CASHIER">Cashier</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className={LABEL_CLS}>
                                      Department
                                    </label>
                                    <select
                                      value={s.department || ""}
                                      onChange={(e) =>
                                        updateStaff(index, {
                                          department: e.target.value,
                                        })
                                      }
                                      className={BRANCH_INPUT_CLS}
                                    >
                                      <option value="">
                                        Select Department
                                      </option>
                                      <option value="KITCHEN">Kitchen</option>
                                      <option value="SERVICE">Service</option>
                                      <option value="CLEANING">Cleaning</option>
                                      <option value="DELIVERY">Delivery</option>
                                      <option value="ADMIN">Admin</option>
                                      <option value="SECURITY">Security</option>
                                      <option value="PURCHASE">Purchase</option>
                                      <option value="MAINTENANCE">
                                        Maintenance
                                      </option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className={LABEL_CLS}>
                                      Account Access
                                    </label>
                                    <div className="flex items-center gap-3 rounded-2xl border border-gray-300 bg-white px-4 py-3">
                                      <input
                                        type="checkbox"
                                        checked={s.hasLogin || false}
                                        onChange={(e) =>
                                          updateStaff(index, {
                                            hasLogin: e.target.checked,
                                          })
                                        }
                                        className="h-4 w-4 rounded border-gray-300 text-red-500"
                                      />
                                      <span className="text-sm font-medium text-gray-700">
                                        Enable Login Access
                                      </span>
                                    </div>
                                  </div>
                                  <div>
                                    <label className={LABEL_CLS}>Salary</label>
                                    <div className="relative">
                                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                                        ₹
                                      </span>
                                      <input
                                        type="number"
                                        placeholder="0"
                                        value={s.salary || ""}
                                        onChange={(e) =>
                                          updateStaff(index, {
                                            salary: Number(e.target.value),
                                          })
                                        }
                                        className="w-full rounded-2xl border border-gray-300 bg-white py-3 pl-9 pr-4 text-sm outline-none transition focus:border-red-500"
                                      />
                                    </div>
                                  </div>
                                  <div>
                                    <label className={LABEL_CLS}>
                                      Joining Date
                                    </label>
                                    <input
                                      type="date"
                                      value={s.joiningDate || ""}
                                      onChange={(e) =>
                                        updateStaff(index, {
                                          joiningDate: e.target.value,
                                        })
                                      }
                                      className={BRANCH_INPUT_CLS}
                                    />
                                  </div>
                                  <div>
                                    <label className={LABEL_CLS}>Shift</label>
                                    <select
                                      value={s.shift || ""}
                                      onChange={(e) =>
                                        updateStaff(index, {
                                          shift: e.target.value,
                                        })
                                      }
                                      className={BRANCH_INPUT_CLS}
                                    >
                                      <option value="">Select Shift</option>
                                      <option value="MORNING">Morning</option>
                                      <option value="EVENING">Evening</option>
                                      <option value="FULL_DAY">Full Day</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className={LABEL_CLS}>
                                      Assign Branch
                                    </label>
                                    <select
                                      value={s.branchId ?? ""}
                                      onChange={(e) =>
                                        updateStaff(index, {
                                          branchId: Number(e.target.value),
                                        })
                                      }
                                      className={BRANCH_INPUT_CLS}
                                    >
                                      <option value="">Select Branch</option>
                                      {branches.map((b, i) => (
                                        <option key={i} value={i}>
                                          {b.name || `Branch ${i + 1}`}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() =>
                              setStaff([
                                ...staff,
                                {
                                  name: "",
                                  email: "",
                                  phone: "",
                                  role: "STAFF",
                                  password: "1234",
                                  hasLogin: false,
                                },
                              ])
                            }
                            className="flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-red-300 bg-red-50 px-6 py-7 text-base font-semibold text-red-600 transition-all hover:bg-red-100"
                          >
                            + Add New Staff Member
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="border-t border-white/40 bg-white/70 px-5 py-3 backdrop-blur-xl">
                    <div className="flex items-center justify-between">
                      <button
                        disabled={selectedTab === 0}
                        onClick={() => setSelectedTab((prev) => prev - 1)}
                        className="rounded-2xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <div className="flex gap-3">
                        <button
                          onClick={handleCloseSetup}
                          className="rounded-2xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                        >
                          Save Later
                        </button>
                        <button
                          disabled={loading}
                          onClick={() =>
                            selectedTab === tabs.length - 1
                              ? handleSubmitSetup()
                              : setSelectedTab((prev) => prev + 1)
                          }
                          className="rounded-2xl bg-gradient-to-r from-red-500 to-rose-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-red-200 transition hover:opacity-95 disabled:opacity-50"
                        >
                          {loading
                            ? "Saving..."
                            : selectedTab === tabs.length - 1
                              ? "Finish Setup"
                              : "Next Step"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "@/store";
import { setBranches } from "@/store/slices/branchSlice";
import { clearAuth } from "@/store/slices/authSlice";
import { getIndianCitiesForState, getIndianStates } from "@/utils/indiaLocations";
import {
  BuildingStorefrontIcon,
  LockClosedIcon,
  BellIcon,
  CreditCardIcon,
  CheckIcon,
  PencilSquareIcon,
  XMarkIcon,
  PlusIcon,
  CameraIcon,
  MapPinIcon,
  TagIcon,
} from "@heroicons/react/24/outline";
import DiscountCodesTab from "./DiscountCodesTab";
import TabStrip from "@/components/common/TabStrip";

const TABS = [
  { id: "General", label: "Restaurant", icon: BuildingStorefrontIcon },
  { id: "Branches", label: "Branches", icon: MapPinIcon },
  { id: "Discounts", label: "Discounts", icon: TagIcon },
  { id: "Password", label: "Password", icon: LockClosedIcon },
  { id: "Notifications", label: "Notifications", icon: BellIcon },
  { id: "Plan", label: "Plan", icon: CreditCardIcon },
];

const INPUT_VIEW =
  "w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 outline-none cursor-default select-none";
const INPUT_EDIT =
  "w-full rounded-xl border border-red-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100";

function Field({
  label,
  value,
  editMode,
  onChange,
  type = "text",
  placeholder = "",
}: {
  label: string;
  value: string;
  editMode: boolean;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-gray-400">
        {label}
      </label>
      <input
        type={type}
        readOnly={!editMode}
        value={value || ""}
        placeholder={editMode ? placeholder : undefined}
        onChange={(e) => onChange(e.target.value)}
        className={editMode ? INPUT_EDIT : INPUT_VIEW}
      />
    </div>
  );
}

export default function Settings() {
  const API_URL = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("General");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [branchEditMode, setBranchEditMode] = useState(false);
  const [passwordMode, setPasswordMode] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const logoRef = useRef<HTMLInputElement>(null);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [savingBranch, setSavingBranch] = useState(false);
  const [addingBranch, setAddingBranch] = useState(false);
  const emptyNewBranch = () => ({
    name: "",
    city: "",
    state: "",
    pincode: "",
    phone: "",
    email: "",
    address: "",
    tablesCount: 0,
    tables: [] as { name: string; capacity: number }[],
    billing: {
      billingTypes: [] as string[],
      gstPercentage: "",
      serviceCharge: "",
      includeGST: false,
      enableDiscount: true,
      enableTips: false,
      paymentMethods: [] as string[],
    },
  });
  const [newBranch, setNewBranch] = useState(emptyNewBranch());
  const setNB = (updates: object) =>
    setNewBranch((p) => ({ ...p, ...updates }));
  const setNBBilling = (updates: object) =>
    setNewBranch((p) => ({ ...p, billing: { ...p.billing, ...updates } }));

  const { user, token } = useAppSelector((s) => s.auth);
  const dispatch = useAppDispatch();
  const [indiaStates, setIndiaStates] = useState<{ isoCode: string; name: string }[]>([]);
  const [newBranchCities, setNewBranchCities] = useState<{ name: string }[]>([]);

  useEffect(() => {
    fetchSettings();
  }, []);
  useEffect(() => {
    setLogoError(false);
  }, [data?.logo]);
  // Loaded on demand — country-state-city bundles a full world cities/states
  // database, only fetched once this page mounts, not by every page that
  // happens to share a chunk with it.
  useEffect(() => {
    getIndianStates().then(setIndiaStates);
  }, []);
  useEffect(() => {
    const st = indiaStates.find((s) => s.name === newBranch.state);
    if (st) getIndianCitiesForState(st.isoCode).then(setNewBranchCities);
    else setNewBranchCities([]);
  }, [indiaStates, newBranch.state]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      // token from Redux
      if (!user?.restaurantId) return;
      const res = await fetch(
        `${API_URL}/api/restaurant/settings/${user.restaurantId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        setEditMode(false);
        setLogoPreview(null);
        setLogoFile(null);
      }
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  };

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    setLogoError(false);
  };

  const handleSaveGeneral = async () => {
    try {
      // token from Redux
      // Upload logo first if changed
      if (logoFile) {
        const fd = new FormData();
        fd.append("logo", logoFile);
        fd.append("restaurantId", String(data.id));
        await fetch(`${API_URL}/api/restaurant/update-logo`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });
      }
      const res = await fetch(`${API_URL}/api/restaurant/general/${data.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          phone: data.phone,
          address: data.address,
          gstNumber: data.gstNumber,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setEditMode(false);
        setLogoFile(null);
        setLogoPreview(null);
        fetchSettings();
      } else {
        alert(json.message);
      }
    } catch {
      alert("Failed to save");
    }
  };

  const handleSaveBranches = async () => {
    try {
      setSavingBranch(true);
      // token from Redux
      const res = await fetch(`${API_URL}/api/restaurant/branches/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          restaurantId: data.id,
          branches: data.branches,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setBranchEditMode(false);
        fetchSettings();
        // Refresh localStorage branches so topbar picker updates
        const branchRes = await fetch(
          `${API_URL}/api/restaurant/my-restaurant`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        const branchData = await branchRes.json();
        if (branchData.success && branchData.data?.restaurant?.branches) {
          dispatch(setBranches(branchData.data.restaurant.branches));
        }
      } else {
        alert(json.message);
      }
    } catch {
      alert("Failed to save branches");
    } finally {
      setSavingBranch(false);
    }
  };

  const handleAddBranch = async () => {
    if (!newBranch.name.trim()) {
      alert("Branch name is required");
      return;
    }
    try {
      setSavingBranch(true);
      const res = await fetch(`${API_URL}/api/restaurant/branches/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ restaurantId: data.id, ...newBranch }),
      });
      const json = await res.json();
      if (json.success) {
        setAddingBranch(false);
        setNewBranch(emptyNewBranch());
        const updatedBranches = [...(data?.branches || []), json.data];
        setData((prev: any) => ({ ...prev, branches: updatedBranches }));
        dispatch(setBranches(updatedBranches));
        fetchSettings();
        window.dispatchEvent(new Event("branchChanged"));
      } else {
        alert(json.message);
      }
    } catch {
      alert("Failed to add branch");
    } finally {
      setSavingBranch(false);
    }
  };

  // boolean is in the union for autoThrottleEnabled (the kitchen-capacity
  // policy's only checkbox field) — every other branch field is text/number.
  const updateBranch = (id: number, field: string, value: string | number | boolean) =>
    setData((prev: any) => ({
      ...prev,
      branches: prev.branches.map((b: any) =>
        b.id === id ? { ...b, [field]: value } : b,
      ),
    }));

  const toggleBranchDeleted = (id: number) =>
    setData((prev: any) => ({
      ...prev,
      branches: prev.branches.map((b: any) =>
        b.id === id ? { ...b, isDeleted: !b.isDeleted } : b,
      ),
    }));

  const handleSignOutAll = () => {
    if (
      !window.confirm(
        "This will sign you out on this device. Active sessions on other devices will expire when their token times out. Continue?",
      )
    )
      return;
    dispatch(clearAuth());
    navigate("/login");
  };

  const handleUpdatePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    try {
      // token from Redux
      const res = await fetch(`${API_URL}/api/auth/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setPasswordMode(false);
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        alert("Password updated successfully");
      } else {
        alert(json.message);
      }
    } catch {
      alert("Failed to update password");
    }
  };

  const logoSrc =
    logoPreview ||
    (data?.logo && !logoError
      ? `${API_URL.replace(/\/$/, "")}${data.logo}`
      : null);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-red-500" />
          <p className="text-[12px] text-gray-500">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto flex flex-col gap-3">
        {/* ── HEADER ─────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-red-100/40 blur-3xl" />
          <div className="relative z-10 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#b10000] shadow-sm">
                <BuildingStorefrontIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-gray-900">
                  Settings
                </h1>
                <p className="mt-0.5 text-[12px] text-gray-500">
                  Manage your restaurant, branches and account
                </p>
              </div>
            </div>
            <TabStrip tabs={TABS} value={activeTab} onChange={setActiveTab} />
          </div>
        </div>

        {/* ── CONTENT ────────────────────────────────── */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {/* GENERAL / RESTAURANT ──────────────────────── */}
          {activeTab === "General" && (
            <div className="p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-[18px] font-bold text-gray-900">
                    Restaurant Details
                  </h2>
                  <p className="mt-0.5 text-[12px] text-gray-500">
                    Your restaurant profile and contact information
                  </p>
                </div>
                <div className="flex gap-2">
                  {editMode && (
                    <button
                      onClick={() => {
                        setEditMode(false);
                        setLogoFile(null);
                        setLogoPreview(null);
                        fetchSettings();
                      }}
                      className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2 text-[12px] font-medium text-gray-600 hover:bg-gray-50"
                    >
                      <XMarkIcon className="h-4 w-4" /> Cancel
                    </button>
                  )}
                  <button
                    onClick={() =>
                      editMode ? handleSaveGeneral() : setEditMode(true)
                    }
                    className="flex items-center gap-1.5 rounded-xl bg-[#b10000] px-4 py-2 text-[12px] font-semibold text-white shadow-sm transition hover:bg-[#950000]"
                  >
                    {editMode ? (
                      <>
                        <CheckIcon className="h-4 w-4" /> Save Changes
                      </>
                    ) : (
                      <>
                        <PencilSquareIcon className="h-4 w-4" /> Edit Profile
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-6 lg:flex-row">
                {/* Logo */}
                <div className="flex flex-col items-center gap-3">
                  <div
                    className={`relative h-28 w-28 overflow-hidden rounded-2xl border-2 border-gray-200 bg-gray-100 shadow-sm ${editMode ? "cursor-pointer" : ""}`}
                    onClick={() => editMode && logoRef.current?.click()}
                  >
                    {logoSrc ? (
                      <img
                        src={logoSrc}
                        alt="logo"
                        className="h-full w-full object-cover"
                        onError={() => setLogoError(true)}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <BuildingStorefrontIcon className="h-10 w-10 text-gray-300" />
                      </div>
                    )}
                    {editMode && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition hover:opacity-100">
                        <CameraIcon className="h-7 w-7 text-white" />
                      </div>
                    )}
                    <input
                      ref={logoRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoSelect}
                    />
                  </div>
                  {editMode && (
                    <p className="text-[10px] text-gray-400 text-center">
                      Click to change logo
                    </p>
                  )}
                </div>

                {/* Fields */}
                <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2">
                  <Field
                    label="Restaurant Name"
                    value={data?.name || ""}
                    editMode={editMode}
                    onChange={(v) => setData((p: any) => ({ ...p, name: v }))}
                    placeholder="Restaurant name"
                  />
                  <Field
                    label="Email"
                    type="email"
                    value={data?.email || ""}
                    editMode={editMode}
                    onChange={(v) => setData((p: any) => ({ ...p, email: v }))}
                    placeholder="Restaurant email"
                  />
                  <Field
                    label="Phone"
                    value={data?.phone || ""}
                    editMode={editMode}
                    onChange={(v) => setData((p: any) => ({ ...p, phone: v }))}
                    placeholder="Contact number"
                  />
                  <Field
                    label="GST Number"
                    value={data?.gstNumber || ""}
                    editMode={editMode}
                    onChange={(v) =>
                      setData((p: any) => ({ ...p, gstNumber: v }))
                    }
                    placeholder="GST registration number"
                  />
                  <div className="md:col-span-2">
                    <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-gray-400">
                      Address
                    </label>
                    <textarea
                      rows={2}
                      readOnly={!editMode}
                      value={data?.address || ""}
                      placeholder={editMode ? "Restaurant address" : undefined}
                      onChange={(e) =>
                        setData((p: any) => ({ ...p, address: e.target.value }))
                      }
                      className={editMode ? INPUT_EDIT : INPUT_VIEW}
                    />
                  </div>
                </div>
              </div>

              {/* Quick stats */}
              <div className="mt-6 grid grid-cols-2 gap-3 border-t border-gray-100 pt-5 md:grid-cols-4">
                {[
                  { label: "Branches", value: data?.branches?.length || 0 },
                  {
                    label: "Active Branches",
                    value:
                      data?.branches?.filter((b: any) => !b.isDeleted).length ||
                      0,
                  },
                  { label: "Staff", value: data?.users?.length || 0 },
                  { label: "Plan", value: "Professional" },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="rounded-xl border border-gray-100 bg-gray-50 p-4"
                  >
                    <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                      {s.label}
                    </p>
                    <p className="mt-1.5 text-[22px] font-black text-gray-900">
                      {s.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* BRANCHES ─────────────────────────────────── */}
          {activeTab === "Branches" && (
            <div className="p-6">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-[18px] font-bold text-gray-900">
                    Branch Management
                  </h2>
                  <p className="mt-0.5 text-[12px] text-gray-500">
                    {data?.branches?.length || 0} branches · Add or edit branch
                    details and locations
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {branchEditMode && (
                    <button
                      onClick={() => {
                        setBranchEditMode(false);
                        fetchSettings();
                      }}
                      className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2 text-[12px] font-medium text-gray-600 hover:bg-gray-50"
                    >
                      <XMarkIcon className="h-4 w-4" /> Cancel
                    </button>
                  )}
                  {branchEditMode && (
                    <button
                      onClick={handleSaveBranches}
                      disabled={savingBranch}
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-[12px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                      <CheckIcon className="h-4 w-4" />{" "}
                      {savingBranch ? "Saving..." : "Save Changes"}
                    </button>
                  )}
                  {!branchEditMode && (
                    <button
                      onClick={() => setBranchEditMode(true)}
                      className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2 text-[12px] font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      <PencilSquareIcon className="h-4 w-4" /> Edit Branches
                    </button>
                  )}
                  <button
                    onClick={() => setAddingBranch(true)}
                    className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-red-500 to-rose-500 px-4 py-2 text-[12px] font-semibold text-white shadow-sm hover:opacity-90"
                  >
                    <PlusIcon className="h-4 w-4" /> Add Branch
                  </button>
                </div>
              </div>

              {/* Add Branch Form */}
              {addingBranch && (
                <div className="mb-4 overflow-hidden rounded-xl border border-red-200 bg-white shadow-sm">
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-red-500 to-rose-500 px-5 py-3">
                    <div>
                      <p className="text-[14px] font-bold text-white">
                        Add New Branch
                      </p>
                      <p className="text-[11px] text-red-100">
                        Fill location, tables and billing settings
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setAddingBranch(false);
                        setNewBranch(emptyNewBranch());
                      }}
                      className="rounded-lg bg-white/15 p-1.5 text-white hover:bg-white/25"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="space-y-5 p-5">
                    {/* ── SECTION 1: Basic Info ── */}
                    <div>
                      <p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-gray-400">
                        Branch Details
                      </p>
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {[
                          {
                            field: "name",
                            label: "Branch Name *",
                            placeholder: "e.g. Anna Nagar Branch",
                          },
                          {
                            field: "phone",
                            label: "Phone",
                            placeholder: "Branch contact number",
                          },
                          {
                            field: "email",
                            label: "Email",
                            placeholder: "Branch email",
                          },
                          {
                            field: "pincode",
                            label: "Pincode",
                            placeholder: "e.g. 600001",
                          },
                        ].map((f) => (
                          <div key={f.field}>
                            <label className="mb-1 block text-[11px] font-semibold text-gray-500">
                              {f.label}
                            </label>
                            <input
                              value={(newBranch as any)[f.field] || ""}
                              onChange={(e) =>
                                setNB({ [f.field]: e.target.value })
                              }
                              placeholder={f.placeholder}
                              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-[13px] outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                            />
                          </div>
                        ))}
                        <div>
                          <label className="mb-1 block text-[11px] font-semibold text-gray-500">
                            State
                          </label>
                          <select
                            value={newBranch.state}
                            onChange={(e) =>
                              setNB({ state: e.target.value, city: "" })
                            }
                            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-[13px] outline-none focus:border-red-400"
                          >
                            <option value="">Select state</option>
                            {indiaStates.map((s) => (
                              <option key={s.isoCode} value={s.name}>
                                {s.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-[11px] font-semibold text-gray-500">
                            City
                          </label>
                          <select
                            value={newBranch.city}
                            onChange={(e) => setNB({ city: e.target.value })}
                            disabled={!newBranch.state}
                            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-[13px] outline-none focus:border-red-400 disabled:bg-gray-50 disabled:text-gray-400"
                          >
                            <option value="">
                              {newBranch.state
                                ? "Select city"
                                : "Select state first"}
                            </option>
                            {newBranchCities.map((c) => (
                              <option key={c.name} value={c.name}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="xl:col-span-3">
                          <label className="mb-1 block text-[11px] font-semibold text-gray-500">
                            Address
                          </label>
                          <input
                            value={newBranch.address || ""}
                            onChange={(e) => setNB({ address: e.target.value })}
                            placeholder="Full branch address"
                            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-[13px] outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                          />
                        </div>
                      </div>
                    </div>

                    {/* ── SECTION 2: Tables ── */}
                    <div>
                      <p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-gray-400">
                        Seating / Tables
                      </p>
                      <div className="flex items-center gap-3">
                        <label className="text-[12px] font-semibold text-gray-600">
                          Number of tables
                        </label>
                        <input
                          type="number"
                          value={newBranch.tablesCount || ""}
                          placeholder="0"
                          onChange={(e) => {
                            const count =
                              e.target.value === ""
                                ? 0
                                : Number(e.target.value);
                            setNB({
                              tablesCount: count,
                              tables: Array.from({ length: count }, (_, i) => ({
                                name: `Table ${i + 1}`,
                                capacity: 4,
                              })),
                            });
                          }}
                          className="w-24 rounded-xl border border-gray-200 bg-white px-3 py-2 text-[13px] outline-none focus:border-red-400"
                        />
                      </div>
                      {newBranch.tables.length > 0 && (
                        <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
                          {newBranch.tables.map((t, ti) => (
                            <div
                              key={ti}
                              className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2"
                            >
                              <span className="text-[11px] font-bold text-gray-400">
                                T{ti + 1}
                              </span>
                              <input
                                value={t.name}
                                placeholder="Table name"
                                onChange={(e) =>
                                  setNB({
                                    tables: newBranch.tables.map((x, j) =>
                                      j === ti
                                        ? { ...x, name: e.target.value }
                                        : x,
                                    ),
                                  })
                                }
                                className="flex-1 bg-transparent text-[12px] outline-none"
                              />
                              <input
                                type="number"
                                value={t.capacity || ""}
                                placeholder="Cap"
                                onChange={(e) =>
                                  setNB({
                                    tables: newBranch.tables.map((x, j) =>
                                      j === ti
                                        ? {
                                            ...x,
                                            capacity:
                                              e.target.value === ""
                                                ? 0
                                                : Number(e.target.value),
                                          }
                                        : x,
                                    ),
                                  })
                                }
                                className="w-14 rounded-lg border border-gray-200 bg-white px-2 py-1 text-[12px] text-center outline-none focus:border-red-400"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* ── SECTION 3: Billing Settings ── */}
                    <div>
                      <p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-gray-400">
                        Billing Settings
                      </p>
                      <div className="space-y-4">
                        {/* Billing modules */}
                        <div>
                          <p className="mb-2 text-[12px] font-semibold text-gray-600">
                            Billing Modules
                          </p>
                          <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                            {[
                              "Table Wise Billing",
                              "Quick Billing",
                              "Takeaway Billing",
                              "Delivery Billing",
                              "QR Ordering",
                              "KOT Billing",
                            ].map((type) => {
                              const active =
                                newBranch.billing.billingTypes.includes(type);
                              return (
                                <label
                                  key={type}
                                  className={`flex cursor-pointer items-center justify-between rounded-xl border p-2.5 transition ${active ? "border-red-400 bg-[#b10000]" : "border-gray-200 bg-white hover:border-red-200"}`}
                                >
                                  <span
                                    className={`text-[12px] font-semibold ${active ? "text-red-700" : "text-gray-700"}`}
                                  >
                                    {type}
                                  </span>
                                  <input
                                    type="checkbox"
                                    checked={active}
                                    onChange={() =>
                                      setNBBilling({
                                        billingTypes: active
                                          ? newBranch.billing.billingTypes.filter(
                                              (t) => t !== type,
                                            )
                                          : [
                                              ...newBranch.billing.billingTypes,
                                              type,
                                            ],
                                      })
                                    }
                                    className="h-4 w-4 rounded text-red-500"
                                  />
                                </label>
                              );
                            })}
                          </div>
                        </div>
                        {/* GST + Service Charge */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="mb-1 block text-[11px] font-semibold text-gray-500">
                              GST %
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                value={newBranch.billing.gstPercentage}
                                onChange={(e) =>
                                  setNBBilling({
                                    gstPercentage: e.target.value,
                                  })
                                }
                                placeholder="5"
                                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 pr-8 text-[13px] outline-none focus:border-red-400"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-gray-400">
                                %
                              </span>
                            </div>
                          </div>
                          <div>
                            <label className="mb-1 block text-[11px] font-semibold text-gray-500">
                              Service Charge %
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                value={newBranch.billing.serviceCharge}
                                onChange={(e) =>
                                  setNBBilling({
                                    serviceCharge: e.target.value,
                                  })
                                }
                                placeholder="0"
                                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 pr-8 text-[13px] outline-none focus:border-red-400"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-gray-400">
                                %
                              </span>
                            </div>
                          </div>
                        </div>
                        {/* Preferences */}
                        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                          {(
                            [
                              {
                                key: "includeGST",
                                label: "Include GST in price",
                              },
                              {
                                key: "enableDiscount",
                                label: "Enable Discounts",
                              },
                              { key: "enableTips", label: "Enable Tips" },
                            ] as const
                          ).map(({ key, label }) => (
                            <label
                              key={key}
                              className="flex cursor-pointer items-center justify-between rounded-xl border border-gray-200 bg-white px-3 py-2.5"
                            >
                              <span className="text-[12px] font-semibold text-gray-700">
                                {label}
                              </span>
                              <input
                                type="checkbox"
                                checked={newBranch.billing[key]}
                                onChange={() =>
                                  setNBBilling({
                                    [key]: !newBranch.billing[key],
                                  })
                                }
                                className="h-4 w-4 rounded text-red-500"
                              />
                            </label>
                          ))}
                        </div>
                        {/* Payment Methods */}
                        <div>
                          <p className="mb-2 text-[12px] font-semibold text-gray-600">
                            Payment Methods
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {[
                              "Cash",
                              "Card",
                              "UPI",
                            ].map((m) => {
                              const active =
                                newBranch.billing.paymentMethods.includes(m);
                              return (
                                <button
                                  key={m}
                                  type="button"
                                  onClick={() =>
                                    setNBBilling({
                                      paymentMethods: active
                                        ? newBranch.billing.paymentMethods.filter(
                                            (x) => x !== m,
                                          )
                                        : [
                                            ...newBranch.billing.paymentMethods,
                                            m,
                                          ],
                                    })
                                  }
                                  className={`rounded-xl border px-3 py-1.5 text-[12px] font-semibold transition ${active ? "border-red-400 bg-[#b10000] text-red-700" : "border-gray-200 bg-white text-gray-600 hover:border-red-300"}`}
                                >
                                  {m}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-3">
                    <button
                      onClick={() => {
                        setAddingBranch(false);
                        setNewBranch(emptyNewBranch());
                      }}
                      className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-[12px] font-semibold text-gray-600"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddBranch}
                      disabled={savingBranch}
                      className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-500 to-rose-500 px-5 py-2 text-[12px] font-bold text-white disabled:opacity-60"
                    >
                      {savingBranch ? "Creating..." : "Create Branch"}
                    </button>
                  </div>
                </div>
              )}

              {/* Branch Cards */}
              <div className="space-y-3">
                {data?.branches?.map((branch: any) => (
                  <div
                    key={branch.id}
                    className={`overflow-hidden rounded-xl border transition ${branch.isDeleted ? "border-red-200 bg-red-50/60 opacity-70" : "border-gray-200 bg-white"}`}
                  >
                    <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-xl ${branch.isDeleted ? "bg-red-100" : "bg-[#b10000]"}`}
                        >
                          <MapPinIcon
                            className={`h-5 w-5 ${branch.isDeleted ? "text-red-400" : "text-red-500"}`}
                          />
                        </div>
                        {branchEditMode ? (
                          <input
                            value={branch.name}
                            onChange={(e) =>
                              updateBranch(branch.id, "name", e.target.value)
                            }
                            className="rounded-xl border border-red-200 bg-white px-3 py-1.5 text-[14px] font-bold outline-none focus:border-red-400"
                          />
                        ) : (
                          <div>
                            <p className="text-[14px] font-bold text-gray-900">
                              {branch.name}
                            </p>
                            <p className="text-[11px] text-gray-400">
                              {[branch.city, branch.state, branch.pincode]
                                .filter(Boolean)
                                .join(", ") || "No location set"}
                            </p>
                          </div>
                        )}
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${branch.isDeleted ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600"}`}
                        >
                          {branch.isDeleted ? "CLOSED" : "ACTIVE"}
                        </span>
                      </div>
                      <button
                        onClick={() => toggleBranchDeleted(branch.id)}
                        className={`self-start rounded-xl px-3 py-1.5 text-[11px] font-semibold text-white sm:self-auto ${branch.isDeleted ? "bg-emerald-500 hover:bg-emerald-600" : "bg-[#b10000] hover:bg-[#b10000]"}`}
                      >
                        {branch.isDeleted ? "Reopen" : "Close"}
                      </button>
                    </div>

                    {branchEditMode && (
                      <div className="grid grid-cols-2 gap-3 border-t border-gray-100 px-5 py-4 md:grid-cols-3 xl:grid-cols-6">
                        {[
                          { field: "city", label: "City" },
                          { field: "state", label: "State" },
                          { field: "pincode", label: "Pincode" },
                          { field: "phone", label: "Phone" },
                          { field: "email", label: "Email" },
                          { field: "openingTime", label: "Opening Time" },
                          { field: "closingTime", label: "Closing Time" },
                          { field: "address", label: "Address" },
                        ].map((f) => (
                          <div
                            key={f.field}
                            className={
                              f.field === "address" ? "xl:col-span-2" : ""
                            }
                          >
                            <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-gray-400">
                              {f.label}
                            </p>
                            <input
                              type={
                                f.field === "closingTime" || f.field === "openingTime"
                                  ? "time"
                                  : "text"
                              }
                              value={(branch as any)[f.field] || ""}
                              onChange={(e) =>
                                updateBranch(branch.id, f.field, e.target.value)
                              }
                              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-[12px] outline-none focus:border-red-400"
                              placeholder={f.label}
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {branchEditMode && (
                      <div className="border-t border-gray-100 px-5 py-4">
                        <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-gray-400">
                          Payroll Policy
                        </p>
                        <p className="mb-3 text-[11px] text-gray-400">
                          Standard hours used to convert monthly salary into an
                          hourly rate, per shift type, plus the overtime pay
                          multiplier applied to extra hours logged in
                          Attendance.
                        </p>
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                          {[
                            {
                              field: "morningShiftHours",
                              label: "Morning Shift (hrs/day)",
                            },
                            {
                              field: "eveningShiftHours",
                              label: "Evening Shift (hrs/day)",
                            },
                            {
                              field: "fullDayShiftHours",
                              label: "Full Day Shift (hrs/day)",
                            },
                            {
                              field: "overtimeRateMultiplier",
                              label: "Overtime Multiplier (x)",
                            },
                            {
                              field: "areaSqFt",
                              label: "Floor Area (sq ft)",
                            },
                          ].map((f) => (
                            <div key={f.field}>
                              <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-gray-400">
                                {f.label}
                              </p>
                              <input
                                type="number"
                                min={0}
                                step={0.1}
                                value={(branch as any)[f.field] ?? ""}
                                onChange={(e) =>
                                  updateBranch(
                                    branch.id,
                                    f.field,
                                    e.target.value === ""
                                      ? ""
                                      : Number(e.target.value),
                                  )
                                }
                                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-[12px] outline-none focus:border-red-400"
                                placeholder={f.label}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {branchEditMode && (
                      <div className="border-t border-gray-100 px-5 py-4">
                        <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-gray-400">
                          Kitchen Capacity & Labor Policy
                        </p>
                        <p className="mb-3 text-[11px] text-gray-400">
                          Drives bottleneck detection on Kitchen Analytics and the
                          staffing plan on Labor & Capacity. Leave the hourly
                          ceiling blank if you don't know it — a blank means "no
                          assessment", which is safer than a guessed number
                          quietly flagging false bottlenecks.
                        </p>
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                          {[
                            {
                              field: "kitchenCapacityPerHour",
                              label: "Kitchen Capacity (orders/hr)",
                              step: 1,
                              hint: "Most orders the whole kitchen can complete in an hour",
                            },
                            {
                              field: "staffUtilizationFactor",
                              label: "Productive Time Factor",
                              step: 0.05,
                              hint: "0.75 = 45 productive minutes per hour",
                            },
                            {
                              field: "targetTicketMinutes",
                              label: "Target Ticket Time (min)",
                              step: 1,
                              hint: "Service level the staffing plan aims for",
                            },
                          ].map((f) => (
                            <div key={f.field}>
                              <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-gray-400">
                                {f.label}
                              </p>
                              <input
                                type="number"
                                min={0}
                                step={f.step}
                                value={(branch as any)[f.field] ?? ""}
                                onChange={(e) =>
                                  updateBranch(
                                    branch.id,
                                    f.field,
                                    e.target.value === ""
                                      ? ""
                                      : Number(e.target.value),
                                  )
                                }
                                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-[12px] outline-none focus:border-red-400"
                                placeholder={f.label}
                              />
                              <p className="mt-1 text-[10px] text-gray-400">{f.hint}</p>
                            </div>
                          ))}
                          <div>
                            <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-gray-400">
                              Order Hold Suggestion
                            </p>
                            <label className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2">
                              <input
                                type="checkbox"
                                checked={!!(branch as any).autoThrottleEnabled}
                                onChange={(e) =>
                                  updateBranch(
                                    branch.id,
                                    "autoThrottleEnabled",
                                    e.target.checked,
                                  )
                                }
                                className="h-4 w-4 accent-[#b10000]"
                              />
                              <span className="text-[12px] text-gray-700">
                                Suggest holding orders at capacity
                              </span>
                            </label>
                            <p className="mt-1 text-[10px] text-gray-400">
                              Advisory only — never auto-rejects an order
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Billing summary (read-only) */}
                    {!branchEditMode && branch.billing && (
                      <div className="flex flex-wrap gap-2 border-t border-gray-50 px-5 py-3">
                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold text-blue-700">
                          GST: {branch.billing.gstPercentage || 0}%
                        </span>
                        <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-semibold text-violet-700">
                          Service: {branch.billing.serviceCharge || 0}%
                        </span>
                        {(branch.billing.paymentMethods || []).map(
                          (m: string) => (
                            <span
                              key={m}
                              className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-semibold text-gray-600"
                            >
                              {m}
                            </span>
                          ),
                        )}
                        {(branch.billing.billingTypes || []).map(
                          (t: string) => (
                            <span
                              key={t}
                              className="rounded-full bg-[#b10000]/10 px-2.5 py-1 text-[10px] font-semibold text-[#b10000]"
                            >
                              {t}
                            </span>
                          ),
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {(!data?.branches || data.branches.length === 0) && (
                  <div className="flex min-h-[120px] items-center justify-center rounded-xl border border-dashed border-gray-200">
                    <p className="text-[12px] text-gray-400">
                      No branches yet. Click "Add Branch" to create one.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* DISCOUNTS ─────────────────────────────────── */}
          {activeTab === "Discounts" && (
            <div className="p-6">
              <DiscountCodesTab />
            </div>
          )}

          {/* PASSWORD ─────────────────────────────────── */}
          {activeTab === "Password" && (
            <div className="p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-[18px] font-bold text-gray-900">
                    Password & Security
                  </h2>
                  <p className="mt-0.5 text-[12px] text-gray-500">
                    Change your login password
                  </p>
                </div>
                <div className="flex gap-2">
                  {passwordMode && (
                    <button
                      onClick={() => {
                        setPasswordMode(false);
                        setPasswordForm({
                          currentPassword: "",
                          newPassword: "",
                          confirmPassword: "",
                        });
                      }}
                      className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2 text-[12px] font-medium text-gray-600 hover:bg-gray-50"
                    >
                      <XMarkIcon className="h-4 w-4" /> Cancel
                    </button>
                  )}
                  <button
                    onClick={() =>
                      passwordMode
                        ? handleUpdatePassword()
                        : setPasswordMode(true)
                    }
                    className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-[12px] font-semibold text-white transition ${passwordMode ? "bg-emerald-600 hover:bg-emerald-700" : "bg-gradient-to-r from-red-500 to-rose-500 hover:opacity-90"}`}
                  >
                    {passwordMode ? (
                      <>
                        <CheckIcon className="h-4 w-4" /> Update Password
                      </>
                    ) : (
                      <>
                        <LockClosedIcon className="h-4 w-4" /> Change Password
                      </>
                    )}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {[
                  { field: "currentPassword", label: "Current Password" },
                  { field: "", label: "" },
                  { field: "newPassword", label: "New Password" },
                  { field: "confirmPassword", label: "Confirm New Password" },
                ].map((f, i) =>
                  f.field ? (
                    <div key={f.field}>
                      <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-gray-400">
                        {f.label}
                      </label>
                      <input
                        type="password"
                        readOnly={!passwordMode}
                        value={(passwordForm as any)[f.field]}
                        onChange={(e) =>
                          setPasswordForm((p) => ({
                            ...p,
                            [f.field]: e.target.value,
                          }))
                        }
                        placeholder={passwordMode ? "Enter password" : ""}
                        className={passwordMode ? INPUT_EDIT : INPUT_VIEW}
                      />
                    </div>
                  ) : (
                    <div key={i} />
                  ),
                )}
              </div>
              <div className="mt-5 flex flex-col items-start justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 sm:flex-row sm:items-center">
                <div>
                  <p className="text-[13px] font-semibold text-gray-900">
                    Sign out of all devices
                  </p>
                  <p className="mt-0.5 text-[11px] text-gray-400">
                    Revoke all active sessions
                  </p>
                </div>
                <button
                  onClick={handleSignOutAll}
                  className="rounded-xl border border-red-200 bg-white px-4 py-2 text-[12px] font-semibold text-red-600 transition hover:bg-[#b10000] active:scale-95"
                >
                  Sign Out All
                </button>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS ────────────────────────────── */}
          {activeTab === "Notifications" && (
            <div className="p-6">
              <div className="mb-5">
                <h2 className="text-[18px] font-bold text-gray-900">
                  Notification Preferences
                </h2>
                <p className="mt-0.5 text-[12px] text-gray-500">
                  Control how you receive alerts from DineInk
                </p>
              </div>
              <div className="space-y-3">
                {[
                  {
                    icon: "📧",
                    title: "Email Notifications",
                    sub: "Billing summaries and reports via email",
                    on: true,
                  },
                  {
                    icon: "📱",
                    title: "SMS Alerts",
                    sub: "Order alerts via SMS",
                    on: false,
                  },
                  {
                    icon: "🔔",
                    title: "Subscription Reminders",
                    sub: "7 days before plan renewal",
                    on: true,
                  },
                  {
                    icon: "🔊",
                    title: "Sound Notifications",
                    sub: "Audio alerts for new orders on dashboard",
                    on: true,
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50/60 px-4 py-3.5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-lg shadow-sm">
                        {item.icon}
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-gray-900">
                          {item.title}
                        </p>
                        <p className="mt-0.5 text-[11px] text-gray-400">
                          {item.sub}
                        </p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked={item.on}
                      className="h-4 w-4 accent-red-500 cursor-pointer"
                    />
                  </div>
                ))}
              </div>
              <div className="mt-5 flex justify-end">
                <button className="rounded-xl bg-gradient-to-r from-red-500 to-rose-500 px-5 py-2.5 text-[12px] font-semibold text-white hover:opacity-90">
                  Save Preferences
                </button>
              </div>
            </div>
          )}

          {/* PLAN ──────────────────────────────────────── */}
          {activeTab === "Plan" && (
            <div className="p-6">
              <div className="mb-5">
                <h2 className="text-[18px] font-bold text-gray-900">
                  Subscription Plan
                </h2>
                <p className="mt-0.5 text-[12px] text-gray-500">
                  Your current DineInk plan and usage
                </p>
              </div>
              <div className="overflow-hidden rounded-xl bg-gradient-to-br from-[#b10000] to-[#7a0000] p-6 shadow-lg">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-red-200">
                      Current Plan
                    </p>
                    <h3 className="mt-1.5 text-[28px] font-black text-white">
                      Professional
                    </h3>
                    <div className="mt-3 flex flex-wrap gap-4">
                      <div>
                        <p className="text-[10px] text-red-200">Renewal Date</p>
                        <p className="mt-0.5 text-[13px] font-semibold text-white">
                          15 Aug 2026
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-red-200">Billing</p>
                        <p className="mt-0.5 text-[13px] font-semibold text-white">
                          Monthly · ₹499
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-red-200">Status</p>
                        <p className="mt-0.5 text-[13px] font-semibold text-emerald-300">
                          Active
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button className="rounded-xl bg-white px-5 py-2.5 text-[12px] font-bold text-red-600 transition hover:bg-[#b10000]">
                      Upgrade Plan
                    </button>
                    <button className="rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-[12px] font-semibold text-white transition hover:bg-white/20">
                      View Invoice
                    </button>
                  </div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {[
                  {
                    label: "Branches Used",
                    value: data?.branches?.length || 0,
                    max: 10,
                    color: "red",
                  },
                  {
                    label: "Staff Accounts",
                    value: data?.users?.length || 0,
                    max: 50,
                    color: "blue",
                  },
                  {
                    label: "Monthly Orders",
                    value: "—",
                    max: null,
                    color: "emerald",
                  },
                ].map((k) => (
                  <div
                    key={k.label}
                    className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                  >
                    <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                      {k.label}
                    </p>
                    <p className="mt-2 text-[24px] font-black text-gray-900">
                      {k.value}
                      {k.max ? (
                        <span className="text-[14px] font-medium text-gray-400">
                          {" "}
                          / {k.max}
                        </span>
                      ) : (
                        ""
                      )}
                    </p>
                    {k.max && (
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className={`h-full rounded-full ${k.color === "red" ? "bg-[#b10000]" : k.color === "blue" ? "bg-blue-500" : "bg-emerald-500"}`}
                          style={{
                            width: `${Math.min((Number(k.value) / k.max) * 100, 100)}%`,
                          }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

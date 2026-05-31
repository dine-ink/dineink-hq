import { useEffect, useRef, useState } from "react";
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
} from "@heroicons/react/24/outline";

const TABS = [
  { id: "General", label: "Restaurant", icon: BuildingStorefrontIcon },
  { id: "Branches", label: "Branches", icon: MapPinIcon },
  { id: "Password", label: "Password", icon: LockClosedIcon },
  { id: "Notifications", label: "Notifications", icon: BellIcon },
  { id: "Plan", label: "Plan", icon: CreditCardIcon },
];

const INPUT_VIEW = "w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 outline-none cursor-default select-none";
const INPUT_EDIT = "w-full rounded-xl border border-red-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100";

function Field({ label, value, editMode, onChange, type = "text", placeholder = "" }: {
  label: string; value: string; editMode: boolean;
  onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-gray-400">{label}</label>
      <input
        type={type}
        readOnly={!editMode}
        value={value || ""}
        placeholder={editMode ? placeholder : undefined}
        onChange={e => onChange(e.target.value)}
        className={editMode ? INPUT_EDIT : INPUT_VIEW}
      />
    </div>
  );
}

export default function Settings() {
  const API_URL = import.meta.env.VITE_API_URL;
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
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [savingBranch, setSavingBranch] = useState(false);
  const [addingBranch, setAddingBranch] = useState(false);
  const [newBranch, setNewBranch] = useState({ name: "", city: "", state: "", pincode: "", phone: "", email: "", address: "" });

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => { fetchSettings(); }, []);
  useEffect(() => { setLogoError(false); }, [data?.logo]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/restaurant/settings/${user.restaurantId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        setEditMode(false);
        setLogoPreview(null);
        setLogoFile(null);
      }
    } catch { /* silent */ } finally { setLoading(false); }
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
      const token = localStorage.getItem("token");
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
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
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
      } else { alert(json.message); }
    } catch { alert("Failed to save"); }
  };

  const handleSaveBranches = async () => {
    try {
      setSavingBranch(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/restaurant/branches/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ restaurantId: data.id, branches: data.branches }),
      });
      const json = await res.json();
      if (json.success) {
        setBranchEditMode(false);
        fetchSettings();
        // Refresh localStorage branches so topbar picker updates
        const branchRes = await fetch(`${API_URL}/api/restaurant/my-restaurant`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const branchData = await branchRes.json();
        if (branchData.success?.restaurant?.branches) {
          localStorage.setItem("branches", JSON.stringify(branchData.success.restaurant.branches));
        }
      } else { alert(json.message); }
    } catch { alert("Failed to save branches"); } finally { setSavingBranch(false); }
  };

  const handleAddBranch = async () => {
    if (!newBranch.name.trim()) { alert("Branch name is required"); return; }
    try {
      setSavingBranch(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/restaurant/branches/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ restaurantId: data.id, ...newBranch }),
      });
      const json = await res.json();
      if (json.success) {
        setAddingBranch(false);
        setNewBranch({ name: "", city: "", state: "", pincode: "", phone: "", email: "", address: "" });
        fetchSettings();
        // Refresh branches in localStorage
        setData((prev: any) => ({ ...prev, branches: [...(prev.branches || []), json.data] }));
        localStorage.setItem("branches", JSON.stringify([...(data.branches || []), json.data]));
        window.dispatchEvent(new Event("branchChanged"));
      } else { alert(json.message); }
    } catch { alert("Failed to add branch"); } finally { setSavingBranch(false); }
  };

  const updateBranch = (id: number, field: string, value: string) =>
    setData((prev: any) => ({
      ...prev,
      branches: prev.branches.map((b: any) => b.id === id ? { ...b, [field]: value } : b),
    }));

  const toggleBranchDeleted = (id: number) =>
    setData((prev: any) => ({
      ...prev,
      branches: prev.branches.map((b: any) => b.id === id ? { ...b, isDeleted: !b.isDeleted } : b),
    }));

  const handleUpdatePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) { alert("Passwords do not match"); return; }
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/auth/change-password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword }),
      });
      const json = await res.json();
      if (json.success) {
        setPasswordMode(false);
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        alert("Password updated successfully");
      } else { alert(json.message); }
    } catch { alert("Failed to update password"); }
  };

  const logoSrc = logoPreview || (data?.logo && !logoError ? `${API_URL.replace(/\/$/, "")}${data.logo}` : null);

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
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-rose-500 shadow-sm">
                <BuildingStorefrontIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-gray-900">Settings</h1>
                <p className="mt-0.5 text-[12px] text-gray-500">Manage your restaurant, branches and account</p>
              </div>
            </div>
            <div className="hide-scrollbar flex gap-1.5 overflow-x-auto">
              {TABS.map(tab => {
                const Icon = tab.icon;
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-[12px] font-semibold transition-all ${
                      activeTab === tab.id
                        ? "bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-sm"
                        : "border border-gray-200 bg-white text-gray-600 hover:bg-red-50 hover:border-red-200 hover:text-red-600"
                    }`}>
                    <Icon className="h-3.5 w-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── CONTENT ────────────────────────────────── */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

          {/* GENERAL / RESTAURANT ──────────────────────── */}
          {activeTab === "General" && (
            <div className="p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-[18px] font-bold text-gray-900">Restaurant Details</h2>
                  <p className="mt-0.5 text-[12px] text-gray-500">Your restaurant profile and contact information</p>
                </div>
                <div className="flex gap-2">
                  {editMode && (
                    <button onClick={() => { setEditMode(false); setLogoFile(null); setLogoPreview(null); fetchSettings(); }}
                      className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2 text-[12px] font-medium text-gray-600 hover:bg-gray-50">
                      <XMarkIcon className="h-4 w-4" /> Cancel
                    </button>
                  )}
                  <button onClick={() => editMode ? handleSaveGeneral() : setEditMode(true)}
                    className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-[12px] font-semibold text-white transition ${editMode ? "bg-emerald-600 hover:bg-emerald-700" : "bg-gradient-to-r from-red-500 to-rose-500 hover:opacity-90"}`}>
                    {editMode ? <><CheckIcon className="h-4 w-4" /> Save Changes</> : <><PencilSquareIcon className="h-4 w-4" /> Edit Profile</>}
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
                      <img src={logoSrc} alt="logo" className="h-full w-full object-cover"
                        onError={() => setLogoError(true)} />
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
                    <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoSelect} />
                  </div>
                  {editMode && (
                    <p className="text-[10px] text-gray-400 text-center">Click to change logo</p>
                  )}
                </div>

                {/* Fields */}
                <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2">
                  <Field label="Restaurant Name" value={data?.name || ""} editMode={editMode}
                    onChange={v => setData((p: any) => ({ ...p, name: v }))} placeholder="Restaurant name" />
                  <Field label="Email" type="email" value={data?.email || ""} editMode={editMode}
                    onChange={v => setData((p: any) => ({ ...p, email: v }))} placeholder="Restaurant email" />
                  <Field label="Phone" value={data?.phone || ""} editMode={editMode}
                    onChange={v => setData((p: any) => ({ ...p, phone: v }))} placeholder="Contact number" />
                  <Field label="GST Number" value={data?.gstNumber || ""} editMode={editMode}
                    onChange={v => setData((p: any) => ({ ...p, gstNumber: v }))} placeholder="GST registration number" />
                  <div className="md:col-span-2">
                    <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-gray-400">Address</label>
                    <textarea rows={2} readOnly={!editMode} value={data?.address || ""}
                      placeholder={editMode ? "Restaurant address" : undefined}
                      onChange={e => setData((p: any) => ({ ...p, address: e.target.value }))}
                      className={editMode ? INPUT_EDIT : INPUT_VIEW} />
                  </div>
                </div>
              </div>

              {/* Quick stats */}
              <div className="mt-6 grid grid-cols-2 gap-3 border-t border-gray-100 pt-5 md:grid-cols-4">
                {[
                  { label: "Branches", value: data?.branches?.length || 0 },
                  { label: "Active Branches", value: data?.branches?.filter((b: any) => !b.isDeleted).length || 0 },
                  { label: "Staff", value: data?.users?.length || 0 },
                  { label: "Plan", value: "Professional" },
                ].map(s => (
                  <div key={s.label} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">{s.label}</p>
                    <p className="mt-1.5 text-[22px] font-black text-gray-900">{s.value}</p>
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
                  <h2 className="text-[18px] font-bold text-gray-900">Branch Management</h2>
                  <p className="mt-0.5 text-[12px] text-gray-500">
                    {data?.branches?.length || 0} branches · Add or edit branch details and locations
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {branchEditMode && (
                    <button onClick={() => { setBranchEditMode(false); fetchSettings(); }}
                      className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2 text-[12px] font-medium text-gray-600 hover:bg-gray-50">
                      <XMarkIcon className="h-4 w-4" /> Cancel
                    </button>
                  )}
                  {branchEditMode && (
                    <button onClick={handleSaveBranches} disabled={savingBranch}
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-[12px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">
                      <CheckIcon className="h-4 w-4" /> {savingBranch ? "Saving..." : "Save Changes"}
                    </button>
                  )}
                  {!branchEditMode && (
                    <button onClick={() => setBranchEditMode(true)}
                      className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2 text-[12px] font-semibold text-gray-700 hover:bg-gray-50">
                      <PencilSquareIcon className="h-4 w-4" /> Edit Branches
                    </button>
                  )}
                  <button onClick={() => setAddingBranch(true)}
                    className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-red-500 to-rose-500 px-4 py-2 text-[12px] font-semibold text-white shadow-sm hover:opacity-90">
                    <PlusIcon className="h-4 w-4" /> Add Branch
                  </button>
                </div>
              </div>

              {/* Add Branch Form */}
              {addingBranch && (
                <div className="mb-4 overflow-hidden rounded-xl border-2 border-dashed border-red-200 bg-red-50/40 p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-[14px] font-bold text-gray-900">New Branch</p>
                      <p className="text-[11px] text-gray-500">Fill in the details and save to create</p>
                    </div>
                    <button onClick={() => { setAddingBranch(false); setNewBranch({ name: "", city: "", state: "", pincode: "", phone: "", email: "", address: "" }); }}
                      className="rounded-lg bg-white p-1.5 text-gray-400 hover:text-gray-600">
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {[
                      { field: "name", label: "Branch Name *", placeholder: "e.g. Anna Nagar Branch" },
                      { field: "city", label: "City", placeholder: "e.g. Chennai" },
                      { field: "state", label: "State", placeholder: "e.g. Tamil Nadu" },
                      { field: "pincode", label: "Pincode", placeholder: "e.g. 600001" },
                      { field: "phone", label: "Phone", placeholder: "Branch contact number" },
                      { field: "email", label: "Email", placeholder: "Branch email" },
                    ].map(f => (
                      <div key={f.field}>
                        <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-gray-400">{f.label}</label>
                        <input
                          value={(newBranch as any)[f.field] || ""}
                          onChange={e => setNewBranch(p => ({ ...p, [f.field]: e.target.value }))}
                          placeholder={f.placeholder}
                          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-[13px] outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                        />
                      </div>
                    ))}
                    <div className="xl:col-span-3">
                      <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-gray-400">Address</label>
                      <input
                        value={newBranch.address || ""}
                        onChange={e => setNewBranch(p => ({ ...p, address: e.target.value }))}
                        placeholder="Full branch address"
                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-[13px] outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end gap-2">
                    <button onClick={() => { setAddingBranch(false); }}
                      className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-[12px] font-semibold text-gray-600">
                      Cancel
                    </button>
                    <button onClick={handleAddBranch} disabled={savingBranch}
                      className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-500 to-rose-500 px-5 py-2 text-[12px] font-bold text-white disabled:opacity-60">
                      {savingBranch ? "Creating..." : "Create Branch"}
                    </button>
                  </div>
                </div>
              )}

              {/* Branch Cards */}
              <div className="space-y-3">
                {data?.branches?.map((branch: any) => (
                  <div key={branch.id} className={`overflow-hidden rounded-xl border transition ${branch.isDeleted ? "border-red-100 bg-red-50/30 opacity-70" : "border-gray-200 bg-white"}`}>
                    <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${branch.isDeleted ? "bg-red-100" : "bg-red-50"}`}>
                          <MapPinIcon className={`h-5 w-5 ${branch.isDeleted ? "text-red-400" : "text-red-500"}`} />
                        </div>
                        {branchEditMode ? (
                          <input value={branch.name} onChange={e => updateBranch(branch.id, "name", e.target.value)}
                            className="rounded-xl border border-red-200 bg-white px-3 py-1.5 text-[14px] font-bold outline-none focus:border-red-400" />
                        ) : (
                          <div>
                            <p className="text-[14px] font-bold text-gray-900">{branch.name}</p>
                            <p className="text-[11px] text-gray-400">
                              {[branch.city, branch.state, branch.pincode].filter(Boolean).join(", ") || "No location set"}
                            </p>
                          </div>
                        )}
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${branch.isDeleted ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600"}`}>
                          {branch.isDeleted ? "CLOSED" : "ACTIVE"}
                        </span>
                      </div>
                      <button onClick={() => toggleBranchDeleted(branch.id)}
                        className={`self-start rounded-xl px-3 py-1.5 text-[11px] font-semibold text-white sm:self-auto ${branch.isDeleted ? "bg-emerald-500 hover:bg-emerald-600" : "bg-red-500 hover:bg-red-600"}`}>
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
                          { field: "address", label: "Address" },
                        ].map(f => (
                          <div key={f.field} className={f.field === "address" ? "xl:col-span-2" : ""}>
                            <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-gray-400">{f.label}</p>
                            <input value={(branch as any)[f.field] || ""}
                              onChange={e => updateBranch(branch.id, f.field, e.target.value)}
                              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-[12px] outline-none focus:border-red-400"
                              placeholder={f.label} />
                          </div>
                        ))}
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
                        {(branch.billing.paymentMethods || []).map((m: string) => (
                          <span key={m} className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-semibold text-gray-600">{m}</span>
                        ))}
                        {(branch.billing.billingTypes || []).map((t: string) => (
                          <span key={t} className="rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-semibold text-red-600">{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {(!data?.branches || data.branches.length === 0) && (
                  <div className="flex min-h-[120px] items-center justify-center rounded-xl border border-dashed border-gray-200">
                    <p className="text-[12px] text-gray-400">No branches yet. Click "Add Branch" to create one.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PASSWORD ─────────────────────────────────── */}
          {activeTab === "Password" && (
            <div className="p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-[18px] font-bold text-gray-900">Password & Security</h2>
                  <p className="mt-0.5 text-[12px] text-gray-500">Change your login password</p>
                </div>
                <div className="flex gap-2">
                  {passwordMode && (
                    <button onClick={() => { setPasswordMode(false); setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" }); }}
                      className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2 text-[12px] font-medium text-gray-600 hover:bg-gray-50">
                      <XMarkIcon className="h-4 w-4" /> Cancel
                    </button>
                  )}
                  <button onClick={() => passwordMode ? handleUpdatePassword() : setPasswordMode(true)}
                    className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-[12px] font-semibold text-white transition ${passwordMode ? "bg-emerald-600 hover:bg-emerald-700" : "bg-gradient-to-r from-red-500 to-rose-500 hover:opacity-90"}`}>
                    {passwordMode ? <><CheckIcon className="h-4 w-4" /> Update Password</> : <><LockClosedIcon className="h-4 w-4" /> Change Password</>}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {[
                  { field: "currentPassword", label: "Current Password" },
                  { field: "", label: "" },
                  { field: "newPassword", label: "New Password" },
                  { field: "confirmPassword", label: "Confirm New Password" },
                ].map((f, i) => f.field ? (
                  <div key={f.field}>
                    <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-gray-400">{f.label}</label>
                    <input type="password" readOnly={!passwordMode}
                      value={(passwordForm as any)[f.field]}
                      onChange={e => setPasswordForm(p => ({ ...p, [f.field]: e.target.value }))}
                      placeholder={passwordMode ? "Enter password" : ""}
                      className={passwordMode ? INPUT_EDIT : INPUT_VIEW} />
                  </div>
                ) : <div key={i} />)}
              </div>
              <div className="mt-5 flex flex-col items-start justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 sm:flex-row sm:items-center">
                <div>
                  <p className="text-[13px] font-semibold text-gray-900">Sign out of all devices</p>
                  <p className="mt-0.5 text-[11px] text-gray-400">Revoke all active sessions</p>
                </div>
                <button className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-[12px] font-semibold text-red-600 transition hover:bg-red-50">
                  Sign Out All
                </button>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS ────────────────────────────── */}
          {activeTab === "Notifications" && (
            <div className="p-6">
              <div className="mb-5">
                <h2 className="text-[18px] font-bold text-gray-900">Notification Preferences</h2>
                <p className="mt-0.5 text-[12px] text-gray-500">Control how you receive alerts from DineInk</p>
              </div>
              <div className="space-y-3">
                {[
                  { icon: "📧", title: "Email Notifications", sub: "Billing summaries and reports via email", on: true },
                  { icon: "📱", title: "SMS Alerts", sub: "Order alerts via SMS", on: false },
                  { icon: "🔔", title: "Subscription Reminders", sub: "7 days before plan renewal", on: true },
                  { icon: "🔊", title: "Sound Notifications", sub: "Audio alerts for new orders on dashboard", on: true },
                ].map(item => (
                  <div key={item.title} className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50/60 px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-lg shadow-sm">{item.icon}</div>
                      <div>
                        <p className="text-[13px] font-semibold text-gray-900">{item.title}</p>
                        <p className="mt-0.5 text-[11px] text-gray-400">{item.sub}</p>
                      </div>
                    </div>
                    <input type="checkbox" defaultChecked={item.on} className="h-4 w-4 accent-red-500 cursor-pointer" />
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
                <h2 className="text-[18px] font-bold text-gray-900">Subscription Plan</h2>
                <p className="mt-0.5 text-[12px] text-gray-500">Your current DineInk plan and usage</p>
              </div>
              <div className="overflow-hidden rounded-xl bg-gradient-to-br from-red-500 via-rose-500 to-red-600 p-6 shadow-lg">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-red-200">Current Plan</p>
                    <h3 className="mt-1.5 text-[28px] font-black text-white">Professional</h3>
                    <div className="mt-3 flex flex-wrap gap-4">
                      <div><p className="text-[10px] text-red-200">Renewal Date</p><p className="mt-0.5 text-[13px] font-semibold text-white">15 Aug 2026</p></div>
                      <div><p className="text-[10px] text-red-200">Billing</p><p className="mt-0.5 text-[13px] font-semibold text-white">Monthly · ₹499</p></div>
                      <div><p className="text-[10px] text-red-200">Status</p><p className="mt-0.5 text-[13px] font-semibold text-emerald-300">Active</p></div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button className="rounded-xl bg-white px-5 py-2.5 text-[12px] font-bold text-red-600 transition hover:bg-red-50">Upgrade Plan</button>
                    <button className="rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-[12px] font-semibold text-white transition hover:bg-white/20">View Invoice</button>
                  </div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {[
                  { label: "Branches Used", value: data?.branches?.length || 0, max: 10, color: "red" },
                  { label: "Staff Accounts", value: data?.users?.length || 0, max: 50, color: "blue" },
                  { label: "Monthly Orders", value: "—", max: null, color: "emerald" },
                ].map(k => (
                  <div key={k.label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">{k.label}</p>
                    <p className="mt-2 text-[24px] font-black text-gray-900">
                      {k.value}{k.max ? <span className="text-[14px] font-medium text-gray-400"> / {k.max}</span> : ""}
                    </p>
                    {k.max && (
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100">
                        <div className={`h-full rounded-full ${k.color === "red" ? "bg-red-500" : k.color === "blue" ? "bg-blue-500" : "bg-emerald-500"}`}
                          style={{ width: `${Math.min((Number(k.value) / k.max) * 100, 100)}%` }} />
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

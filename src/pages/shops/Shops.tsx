import { useCallback, useState, useEffect, useRef } from "react";
import { useBranchSync, getSelectedBranch } from "@/hooks/useBranchSync";
import CommonTable from "@/components/common/CommonTable";
import {
  BuildingStorefrontIcon,
  BanknotesIcon,
  ReceiptPercentIcon,
  PencilSquareIcon,
  CheckIcon,
  XMarkIcon,
  CameraIcon,
} from "@heroicons/react/24/outline";

const INPUT_BASE = "w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none transition-all";
const INPUT_EDIT = `${INPUT_BASE} border-red-200 focus:border-red-400 focus:ring-2 focus:ring-red-100`;
const INPUT_VIEW = `${INPUT_BASE} border-gray-100 text-gray-700 cursor-default select-none`;

function InfoField({ label, value, editMode, onChange }: {
  label: string; value: string; editMode: boolean; onChange: (v: string) => void;
}) {
  return (
    <div>
      <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">{label}</p>
      <input
        type="text"
        value={value || ""}
        readOnly={!editMode}
        onChange={e => onChange(e.target.value)}
        className={editMode ? INPUT_EDIT : INPUT_VIEW}
      />
    </div>
  );
}

const PAYMENT_METHODS = [
  { name: "Cash", icon: "💵", bg: "bg-emerald-50 border-emerald-100", text: "text-emerald-700" },
  { name: "UPI", icon: "📱", bg: "bg-violet-50 border-violet-100", text: "text-violet-700" },
  { name: "Card", icon: "💳", bg: "bg-blue-50 border-blue-100", text: "text-blue-700" },
  { name: "Wallet", icon: "👛", bg: "bg-orange-50 border-orange-100", text: "text-orange-700" },
];

export default function Shops() {
  const API_URL = import.meta.env.VITE_API_URL;
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<any>(() => {
    const saved = localStorage.getItem("selectedBranch");
    return saved ? JSON.parse(saved) : null;
  });
  const [branchDetails, setBranchDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [staff, setStaff] = useState<any[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const rowsPerPage = 6;
  const [tablesPage, setTablesPage] = useState(1);
  const [staffPage, setStaffPage] = useState(1);

  useEffect(() => {
    const fetchShops = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/api/restaurant/shops`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        const branchList = json.data?.branches || [];
        setBranches(branchList);
        if (branchList.length) {
          const saved = localStorage.getItem("selectedBranch");
          let branch = branchList[0];
          if (saved) {
            const parsed = JSON.parse(saved);
            const matched = branchList.find((b: any) => b.id === parsed.id);
            if (matched) branch = matched;
          }
          setSelectedBranch(branch);
          fetchBranchDetails(branch.id);
        }
      } catch { /* silent */ } finally { setLoading(false); }
    };
    fetchShops();
  }, []);

  // Reset logo error state whenever the restaurant logo path changes
  useEffect(() => { setLogoError(false); }, [branchDetails?.restaurant?.logo]);

  const handleBranchChange = useCallback(() => {
    const branch = getSelectedBranch();
    if (branch) { setSelectedBranch(branch); fetchBranchDetails(branch.id); }
  }, []);
  useBranchSync(handleBranchChange);

  const fetchBranchDetails = async (branchId: number) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/restaurant/branch/${branchId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        setBranchDetails(json.data);
        setStaff(json.data.users || []);
        setLogoError(false);
        setLogoPreview(null);
        setLogoFile(null);
      }
    } catch { /* silent */ }
  };

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    setLogoError(false);
  };

  const handleSaveChanges = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem("token");

      // Upload logo first if a new one was selected
      if (logoFile) {
        const formData = new FormData();
        formData.append("logo", logoFile);
        formData.append("restaurantId", String(branchDetails.restaurant?.id));
        await fetch(`${API_URL}/api/restaurant/update-logo`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
      }

      const res = await fetch(`${API_URL}/api/restaurant/branch/${branchDetails.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(branchDetails),
      });
      const data = await res.json();
      if (data.success) {
        setEditMode(false);
        setLogoFile(null);
        setLogoPreview(null);
        fetchBranchDetails(branchDetails.id);
      } else {
        alert(data.message);
      }
    } catch { alert("Update failed"); } finally { setSaving(false); }
  };

  const updateBranchField = (field: string, value: string) =>
    setBranchDetails((prev: any) => ({ ...prev, [field]: value }));
  const updateRestaurantField = (field: string, value: string) =>
    setBranchDetails((prev: any) => ({ ...prev, restaurant: { ...prev.restaurant, [field]: value } }));

  const handleAddTable = () => {
    setBranchDetails((prev: any) => ({
      ...prev,
      tables: [{ id: Date.now(), name: "", capacity: 4, status: "AVAILABLE" }, ...(prev.tables || [])],
    }));
    setTablesPage(1);
  };

  const handleDeleteTable = (id: number) =>
    setBranchDetails((prev: any) => ({ ...prev, tables: prev.tables.filter((t: any) => t.id !== id) }));

  const updateTableField = (id: number, field: string, value: string) =>
    setBranchDetails((prev: any) => ({
      ...prev,
      tables: prev.tables.map((t: any) => t.id === id ? { ...t, [field]: value } : t),
    }));

  const handleAddStaff = () => {
    setStaff(prev => [{ id: Date.now(), name: "", role: "STAFF", email: "", phone: "", salary: 0, shift: "", isActive: true }, ...prev]);
    setStaffPage(1);
  };

  const tables = branchDetails?.tables || [];
  const paginatedTables = tables.slice((tablesPage - 1) * rowsPerPage, tablesPage * rowsPerPage);
  const paginatedStaff = staff.slice((staffPage - 1) * rowsPerPage, staffPage * rowsPerPage);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-red-500" />
          <p className="text-[12px] text-gray-500">Loading branch...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-3">

        {/* ── HERO ─────────────────────────────────────────────────────── */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {/* Gradient top strip */}
          <div className="relative overflow-hidden bg-gradient-to-r from-red-500 to-rose-500 px-6 py-5">
            <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-white/10 blur-3xl" />
            <div className="relative z-10 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-center gap-4">
                {/* Logo — clickable in edit mode to change */}
                <div
                  className={`relative h-16 w-16 overflow-hidden rounded-2xl border-2 border-white/20 bg-white/10 shadow-lg backdrop-blur ${editMode ? "cursor-pointer" : ""}`}
                  onClick={() => editMode && logoInputRef.current?.click()}
                  title={editMode ? "Click to change logo" : undefined}
                >
                  {/* Image — shows preview > existing logo > icon fallback */}
                  {logoPreview ? (
                    <img src={logoPreview} className="h-full w-full object-cover" alt="logo preview" />
                  ) : branchDetails?.restaurant?.logo && !logoError ? (
                    <img
                      src={`${API_URL.replace(/\/$/, "")}${branchDetails.restaurant.logo}`}
                      className="h-full w-full object-cover"
                      alt="restaurant logo"
                      onError={() => setLogoError(true)}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <BuildingStorefrontIcon className="h-7 w-7 text-white/70" />
                    </div>
                  )}

                  {/* Camera overlay in edit mode */}
                  {editMode && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition hover:opacity-100">
                      <CameraIcon className="h-6 w-6 text-white" />
                    </div>
                  )}

                  {/* Hidden file input */}
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoSelect}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-black text-white">{branchDetails?.restaurant?.name || "Your Restaurant"}</h1>
                    <span className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-[9px] font-bold text-emerald-100">ACTIVE</span>
                  </div>
                  <p className="mt-0.5 text-[12px] text-red-100">
                    {[branchDetails?.name, branchDetails?.city, branchDetails?.state].filter(Boolean).join(" · ")}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {[
                      { label: "Branch", value: branchDetails?.name },
                      { label: "Tables", value: tables.length },
                      { label: "Staff", value: staff.length },
                    ].map(item => item.value && (
                      <span key={item.label} className="rounded-lg bg-white/15 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur">
                        {item.label}: {item.value}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {editMode ? (
                  <>
                    <button
                      onClick={() => { setEditMode(false); setLogoFile(null); setLogoPreview(null); setLogoError(false); fetchBranchDetails(branchDetails.id); }}
                      className="flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-[12px] font-semibold text-white backdrop-blur transition hover:bg-white/20"
                    >
                      <XMarkIcon className="h-4 w-4" /> Cancel
                    </button>
                    <button
                      onClick={handleSaveChanges}
                      disabled={saving}
                      className="flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-[12px] font-bold text-red-600 shadow-lg transition hover:bg-red-50 disabled:opacity-60"
                    >
                      <CheckIcon className="h-4 w-4" /> {saving ? "Saving..." : "Save Changes"}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setEditMode(true)}
                    className="flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-[12px] font-semibold text-white backdrop-blur transition hover:bg-white/20"
                  >
                    <PencilSquareIcon className="h-4 w-4" /> Edit Branch
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Branch info fields */}
          <div className="grid grid-cols-1 gap-3 p-5 md:grid-cols-2 xl:grid-cols-3">
            <InfoField label="Email" value={branchDetails?.restaurant?.email} editMode={editMode}
              onChange={v => updateRestaurantField("email", v)} />
            <InfoField label="Phone" value={branchDetails?.restaurant?.phone} editMode={editMode}
              onChange={v => updateRestaurantField("phone", v)} />
            <InfoField label="Branch Address" value={branchDetails?.address} editMode={editMode}
              onChange={v => updateBranchField("address", v)} />
            <InfoField label="City" value={branchDetails?.city} editMode={editMode}
              onChange={v => updateBranchField("city", v)} />
            <InfoField label="State" value={branchDetails?.state} editMode={editMode}
              onChange={v => updateBranchField("state", v)} />
            <InfoField label="Pincode" value={branchDetails?.pincode} editMode={editMode}
              onChange={v => updateBranchField("pincode", v)} />
          </div>
        </div>

        {/* ── TABLES + STAFF ───────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          {/* TABLES */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <CommonTable
              title="Tables"
              subtitle={`${tables.length} tables configured`}
              compact
              data={paginatedTables}
              page={tablesPage}
              totalPages={Math.ceil(tables.length / rowsPerPage)}
              onPageChange={setTablesPage}
              headerAction={
                editMode && (
                  <button onClick={handleAddTable}
                    className="flex items-center gap-1 rounded-lg bg-red-500 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-red-600">
                    + Add Table
                  </button>
                )
              }
              columns={[
                {
                  header: "Table",
                  key: "name",
                  render: (t) => editMode ? (
                    <input value={t.name} onChange={e => updateTableField(t.id, "name", e.target.value)}
                      className="w-full rounded-lg border border-red-200 px-2.5 py-1.5 text-[12px] outline-none focus:border-red-400" />
                  ) : (
                    <div>
                      <p className="text-[13px] font-semibold text-gray-900">{t.name}</p>
                      <p className="text-[10px] text-gray-400">{t.capacity} seats</p>
                    </div>
                  ),
                },
                {
                  header: "Status",
                  key: "status",
                  render: (t) => (
                    <span className={`inline-flex rounded-full px-2 py-[3px] text-[10px] font-semibold ${
                      t.status === "OCCUPIED" ? "bg-red-50 text-red-600" :
                      t.status === "RESERVED" ? "bg-orange-50 text-orange-600" :
                      "bg-emerald-50 text-emerald-600"
                    }`}>
                      {t.status || "AVAILABLE"}
                    </span>
                  ),
                },
                ...(editMode ? [{
                  header: "",
                  key: "actions",
                  render: (t: any) => (
                    <button onClick={() => handleDeleteTable(t.id)}
                      className="rounded-lg border border-red-100 bg-red-50 px-2 py-1 text-[10px] font-semibold text-red-600 transition hover:bg-red-100">
                      Remove
                    </button>
                  ),
                }] : []),
              ]}
            />
          </div>

          {/* STAFF */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <CommonTable
              title="Staff"
              subtitle={`${staff.length} team members`}
              compact
              data={paginatedStaff}
              page={staffPage}
              totalPages={Math.ceil(staff.length / rowsPerPage)}
              onPageChange={setStaffPage}
              headerAction={
                editMode && (
                  <button onClick={handleAddStaff}
                    className="flex items-center gap-1 rounded-lg bg-red-500 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-red-600">
                    + Add Staff
                  </button>
                )
              }
              columns={[
                {
                  header: "Staff Member",
                  key: "name",
                  render: (s) => (
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-red-400 to-pink-500 text-[11px] font-bold text-white">
                        {s.name?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-gray-900">{s.name || "—"}</p>
                        <p className="text-[10px] text-gray-400">{s.email || "No email"}</p>
                      </div>
                    </div>
                  ),
                },
                {
                  header: "Role",
                  key: "role",
                  render: (s) => (
                    <span className="inline-flex rounded-full border border-gray-200 bg-gray-50 px-2 py-[3px] text-[10px] font-semibold text-gray-700">
                      {s.role}
                    </span>
                  ),
                },
                {
                  header: "Phone",
                  key: "phone",
                  render: (s) => <span className="text-[12px] text-gray-600">{s.phone || "—"}</span>,
                },
                {
                  header: "Salary",
                  key: "salary",
                  render: (s) => (
                    <span className="text-[12px] font-semibold text-gray-900">
                      {s.salary ? `₹${Number(s.salary).toLocaleString()}` : "—"}
                    </span>
                  ),
                },
              ]}
            />
          </div>
        </div>

        {/* ── BILLING SETTINGS ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_360px]">
          <div className="space-y-3">
            {/* GST + Service */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                <div>
                  <h3 className="text-[15px] font-bold text-gray-900">Billing Settings</h3>
                  <p className="mt-0.5 text-[11px] text-gray-500">Tax configuration for this branch</p>
                </div>
                <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-1.5 text-center">
                  <p className="text-[9px] font-bold uppercase tracking-wide text-red-400">GST Rate</p>
                  <p className="text-[16px] font-black text-red-600">{selectedBranch?.billing?.gstPercentage || 0}%</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 p-4">
                {[
                  { label: "GST Percentage", value: `${selectedBranch?.billing?.gstPercentage || 0}%`, icon: ReceiptPercentIcon, color: "blue", desc: "Applied on taxable bills" },
                  { label: "Service Charge", value: `${selectedBranch?.billing?.serviceCharge || 0}%`, icon: BanknotesIcon, color: "emerald", desc: "Added during checkout" },
                ].map(item => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className={`rounded-xl border p-4 ${item.color === "blue" ? "border-blue-100 bg-blue-50/60" : "border-emerald-100 bg-emerald-50/60"}`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">{item.label}</p>
                          <p className={`mt-2 text-[26px] font-black ${item.color === "blue" ? "text-blue-700" : "text-emerald-700"}`}>{item.value}</p>
                          <p className="mt-1 text-[11px] text-gray-500">{item.desc}</p>
                        </div>
                        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${item.color === "blue" ? "bg-blue-100" : "bg-emerald-100"}`}>
                          <Icon className={`h-4 w-4 ${item.color === "blue" ? "text-blue-700" : "text-emerald-700"}`} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Payment Methods */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-4 py-3">
                <h3 className="text-[15px] font-bold text-gray-900">Payment Methods</h3>
                <p className="mt-0.5 text-[11px] text-gray-500">Accepted payment options at this branch</p>
              </div>
              <div className="grid grid-cols-2 gap-2 p-4 md:grid-cols-4">
                {PAYMENT_METHODS.map(method => (
                  <div key={method.name} className={`flex items-center gap-2.5 rounded-xl border px-3 py-3 ${method.bg} transition hover:brightness-95`}>
                    <span className="text-lg leading-none">{method.icon}</span>
                    <div>
                      <p className={`text-[12px] font-bold ${method.text}`}>{method.name}</p>
                      <p className="text-[9px] text-gray-400">Enabled</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-4 py-3">
              <h3 className="text-[15px] font-bold text-gray-900">Billing Preferences</h3>
              <p className="mt-0.5 text-[11px] text-gray-500">Workflow controls</p>
            </div>
            <div className="space-y-2 p-4">
              {[
                { icon: "🧾", title: "GST Included in Price", sub: "Tax included in menu pricing", on: selectedBranch?.billing?.includeGST },
                { icon: "🏷️", title: "Enable Discounts", sub: "Allow discounts during billing", on: selectedBranch?.billing?.enableDiscount },
                { icon: "💰", title: "Customer Tips", sub: "Enable tip collection at checkout", on: selectedBranch?.billing?.enableTips },
              ].map(item => (
                <div key={item.title} className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/70 px-3 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200 bg-white text-base shadow-sm">
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-[12px] font-semibold text-gray-900">{item.title}</p>
                      <p className="text-[10px] text-gray-400">{item.sub}</p>
                    </div>
                  </div>
                  <div className={`relative h-5 w-9 cursor-pointer rounded-full transition-colors ${item.on ? "bg-emerald-500" : "bg-gray-200"}`}>
                    <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${item.on ? "left-[18px]" : "left-[2px]"}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

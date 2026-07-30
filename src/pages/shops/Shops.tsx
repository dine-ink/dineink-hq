import { useState, useEffect, useRef } from "react";
import { useAppSelector } from "../../store";
import CommonTable from "@/components/common/CommonTable";
import {
  BuildingStorefrontIcon,
  PencilSquareIcon,
  CheckIcon,
  XMarkIcon,
  CameraIcon,
} from "@heroicons/react/24/outline";
import {
  getIndianCitiesForState,
  getIndianStates,
} from "../../utils/indiaLocations";

const INPUT_BASE =
  "w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none transition-all";
const INPUT_EDIT = `${INPUT_BASE} border-red-200 focus:border-red-400 focus:ring-2 focus:ring-red-100`;
const INPUT_VIEW = `${INPUT_BASE} border-gray-100 text-gray-700 cursor-default select-none`;

function InfoField({
  label,
  value,
  editMode,
  onChange,
}: {
  label: string;
  value: string;
  editMode: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
        {label}
      </p>
      <input
        type="text"
        value={value || ""}
        readOnly={!editMode}
        onChange={(e) => onChange(e.target.value)}
        className={editMode ? INPUT_EDIT : INPUT_VIEW}
      />
    </div>
  );
}

const BILLING_MODULES = [
  "Table Wise Billing",
  "Quick Billing",
  "Takeaway Billing",
  "Delivery Billing",
  "QR Ordering",
  "KOT Billing",
];
const ALL_PAYMENT_METHODS = ["Cash", "Card", "UPI"];

export default function Shops() {
  const API_URL = import.meta.env.VITE_API_URL;
  const { selectedBranch } = useAppSelector((s) => s.branch);
  const { token } = useAppSelector((s) => s.auth);

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
  const [states, setStates] = useState<{ isoCode: string; name: string }[]>([]);
  const [cities, setCities] = useState<{ name: string }[]>([]);

  useEffect(() => {
    if (selectedBranch?.id) {
      setLoading(true);
      fetchBranchDetails(selectedBranch.id).finally(() => setLoading(false));
    }
  }, [selectedBranch?.id]);
  useEffect(() => {
    setLogoError(false);
  }, [branchDetails?.restaurant?.logo]);
  // Loaded on demand (not a static import) — country-state-city bundles a
  // full world cities/states database, only fetched once the state/city
  // dropdown is actually needed (edit mode).
  useEffect(() => {
    if (editMode && states.length === 0) getIndianStates().then(setStates);
  }, [editMode, states.length]);
  useEffect(() => {
    const stateObj = states.find((s) => s.name === branchDetails?.state);
    if (stateObj) getIndianCitiesForState(stateObj.isoCode).then(setCities);
    else setCities([]);
  }, [states, branchDetails?.state]);

  const fetchBranchDetails = async (branchId: number) => {
    try {
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
    } catch {
      /* silent */
    }
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
      const h = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      // 1. Logo upload
      if (logoFile) {
        const fd = new FormData();
        fd.append("logo", logoFile);
        fd.append("restaurantId", String(branchDetails.restaurant?.id));
        await fetch(`${API_URL}/api/restaurant/update-logo`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });
      }

      // 2. Branch + tables + billing
      const res = await fetch(
        `${API_URL}/api/restaurant/branch/${branchDetails.id}`,
        {
          method: "PUT",
          headers: h,
          body: JSON.stringify({
            ...branchDetails,
            tables: branchDetails.tables || [],
          }),
        },
      );
      const data = await res.json();
      if (!data.success) {
        alert(data.message);
        return;
      }

      // 3. Staff — create new, update existing
      await Promise.all(
        staff.map(async (s: any) => {
          if (s._isNew && s.name) {
            await fetch(`${API_URL}/api/restaurant/staff/create`, {
              method: "POST",
              headers: h,
              body: JSON.stringify({
                ...s,
                restaurantId: branchDetails.restaurant?.id,
                branchId: branchDetails.id,
              }),
            });
          } else if (!s._isNew && s.name) {
            await fetch(`${API_URL}/api/restaurant/staff/${s.id}`, {
              method: "PUT",
              headers: h,
              body: JSON.stringify({ ...s, branchId: branchDetails.id }),
            });
          }
        }),
      );

      setEditMode(false);
      setLogoFile(null);
      setLogoPreview(null);
      fetchBranchDetails(branchDetails.id);
    } catch {
      alert("Update failed");
    } finally {
      setSaving(false);
    }
  };

  const updateBranchField = (field: string, value: any) =>
    setBranchDetails((prev: any) => ({ ...prev, [field]: value }));
  const updateRestaurantField = (field: string, value: string) =>
    setBranchDetails((prev: any) => ({
      ...prev,
      restaurant: { ...prev.restaurant, [field]: value },
    }));
  const updateBillingField = (field: string, value: any) =>
    setBranchDetails((prev: any) => ({
      ...prev,
      billing: { ...(prev.billing || {}), [field]: value },
    }));
  const toggleBillingArray = (
    field: "billingTypes" | "paymentMethods",
    item: string,
  ) => {
    const arr: string[] = branchDetails?.billing?.[field] || [];
    updateBillingField(
      field,
      arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item],
    );
  };

  const handleAddTable = () => {
    setBranchDetails((prev: any) => ({
      ...prev,
      tables: [
        {
          id: Date.now(),
          name: "",
          capacity: 4,
          status: "AVAILABLE",
          _isNew: true,
        },
        ...(prev.tables || []),
      ],
    }));
    setTablesPage(1);
  };
  const handleDeleteTable = (id: number) =>
    setBranchDetails((prev: any) => ({
      ...prev,
      tables: prev.tables.filter((t: any) => t.id !== id),
    }));
  const updateTableField = (id: number, field: string, value: string) =>
    setBranchDetails((prev: any) => ({
      ...prev,
      tables: prev.tables.map((t: any) =>
        t.id === id ? { ...t, [field]: value } : t,
      ),
    }));

  const handleAddStaff = () => {
    setStaff((prev) => [
      {
        id: Date.now(),
        _isNew: true,
        name: "",
        role: "STAFF",
        email: "",
        phone: "",
        salary: "",
        shift: "",
        department: "",
        isActive: true,
      },
      ...prev,
    ]);
  };
  const updateStaffField = (id: number, field: string, value: any) =>
    setStaff((prev) =>
      prev.map((s: any) => (s.id === id ? { ...s, [field]: value } : s)),
    );

  const tables = branchDetails?.tables || [];
  const paginatedTables = tables.slice(
    (tablesPage - 1) * rowsPerPage,
    tablesPage * rowsPerPage,
  );
  const billing = branchDetails?.billing || {};

  if (loading)
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-red-500" />
          <p className="text-[12px] text-gray-500">Loading branch...</p>
        </div>
      </div>
    );

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto flex  flex-col gap-3">
        {/* ── HERO ─────────────────────────────────────────────────────── */}
        <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
          <div className="relative overflow-hidden bg-white px-6 py-5">
            <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-red-100/40 blur-3xl" />
            {/* Top Section*/}
            <div className="relative z-10 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-center gap-4">
                <div
                  className={`relative h-16 w-16 overflow-hidden rounded-2xl border-2 border-gray-200 bg-gray-50 shadow-sm ${editMode ? "cursor-pointer" : ""}`}
                  onClick={() => editMode && logoInputRef.current?.click()}
                  title={editMode ? "Click to change logo" : undefined}
                >
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      className="h-full w-full object-cover"
                      alt="logo preview"
                    />
                  ) : branchDetails?.restaurant?.logo && !logoError ? (
                    <img
                      src={`${API_URL.replace(/\/$/, "")}${branchDetails.restaurant.logo}`}
                      className="h-full w-full object-cover"
                      alt="logo"
                      onError={() => setLogoError(true)}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <BuildingStorefrontIcon className="h-7 w-7 text-gray-400" />
                    </div>
                  )}
                  {editMode && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition hover:opacity-100">
                      <CameraIcon className="h-6 w-6 text-white" />
                    </div>
                  )}
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
                    <h1 className="text-xl font-black text-gray-900">
                      {branchDetails?.restaurant?.name || "Your Restaurant"}
                    </h1>
                    <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[9px] font-bold text-emerald-600">
                      ACTIVE
                    </span>
                  </div>
                  <p className="mt-0.5 text-[12px] text-gray-500">
                    {[
                      branchDetails?.name,
                      branchDetails?.city,
                      branchDetails?.state,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {[
                      { label: "Branch", value: branchDetails?.name },
                      { label: "Staff", value: staff.length },
                    ].map(
                      (item) =>
                        item.value && (
                          <span
                            key={item.label}
                            className="rounded-lg bg-gray-100 border border-gray-200 px-2 py-0.5 text-[10px] font-semibold text-gray-700"
                          >
                            {item.label}: {item.value}
                          </span>
                        ),
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {editMode ? (
                  <>
                    <button
                      onClick={() => {
                        setEditMode(false);
                        setLogoFile(null);
                        setLogoPreview(null);
                        setLogoError(false);
                        fetchBranchDetails(branchDetails.id);
                      }}
                      className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2 text-[12px] font-semibold text-gray-700 transition hover:bg-gray-50"
                    >
                      <XMarkIcon className="h-4 w-4" /> Cancel
                    </button>
                    <button
                      onClick={handleSaveChanges}
                      disabled={saving}
                      className="flex items-center gap-1.5 rounded-xl bg-[#b10000] px-4 py-2 text-[12px] font-bold text-white shadow-sm transition hover:bg-[#950000] disabled:opacity-60"
                    >
                      <CheckIcon className="h-4 w-4" />{" "}
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setEditMode(true)}
                    className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-[#b10000] px-4 py-2 text-[12px] font-semibold text-white shadow-sm transition hover:bg-[#950000]"
                  >
                    <PencilSquareIcon className="h-4 w-4" /> Edit Branch
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Branch info fields */}
          <div className="grid grid-cols-1 gap-3 p-5 md:grid-cols-2 xl:grid-cols-3">
            <InfoField
              label="Email"
              value={branchDetails?.restaurant?.email}
              editMode={editMode}
              onChange={(v) => updateRestaurantField("email", v)}
            />
            <InfoField
              label="Phone"
              value={branchDetails?.restaurant?.phone}
              editMode={editMode}
              onChange={(v) => updateRestaurantField("phone", v)}
            />
            <InfoField
              label="Branch Address"
              value={branchDetails?.address}
              editMode={editMode}
              onChange={(v) => updateBranchField("address", v)}
            />

            {/* State — dropdown in edit mode */}
            <div>
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                State
              </p>
              {editMode ? (
                <select
                  value={branchDetails?.state || ""}
                  onChange={(e) => {
                    updateBranchField("state", e.target.value);
                    updateBranchField("city", "");
                  }}
                  className={INPUT_EDIT}
                >
                  <option value="">Select state</option>
                  {states.map((s) => (
                    <option key={s.isoCode} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  readOnly
                  value={branchDetails?.state || ""}
                  className={INPUT_VIEW}
                />
              )}
            </div>

            {/* City — dropdown in edit mode */}
            <div>
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                City
              </p>
              {editMode ? (
                <select
                  value={branchDetails?.city || ""}
                  onChange={(e) => updateBranchField("city", e.target.value)}
                  disabled={!branchDetails?.state}
                  className={
                    INPUT_EDIT + " disabled:bg-gray-50 disabled:text-gray-400"
                  }
                >
                  <option value="">
                    {branchDetails?.state
                      ? "Select city"
                      : "Select state first"}
                  </option>
                  {cities.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  readOnly
                  value={branchDetails?.city || ""}
                  className={INPUT_VIEW}
                />
              )}
            </div>

            <InfoField
              label="Pincode"
              value={branchDetails?.pincode}
              editMode={editMode}
              onChange={(v) => updateBranchField("pincode", v)}
            />
          </div>
        </div>

        {/* ── TABLES + STAFF ───────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[360px_1fr]">
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
                  <button
                    onClick={handleAddTable}
                    className="flex items-center gap-1 rounded-lg bg-[#b10000] px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-[#b10000]"
                  >
                    + Add Table
                  </button>
                )
              }
              columns={[
                {
                  header: "Table",
                  key: "name",
                  render: (t) =>
                    editMode ? (
                      <input
                        value={t.name}
                        onChange={(e) =>
                          updateTableField(t.id, "name", e.target.value)
                        }
                        placeholder="Table name"
                        autoFocus={t._isNew}
                        className="w-full rounded-lg border border-red-200 px-2.5 py-1.5 text-[12px] outline-none focus:border-red-400"
                      />
                    ) : (
                      <div>
                        <p className="text-[13px] font-semibold text-gray-900">
                          {t.name}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          {t.capacity} seats
                        </p>
                      </div>
                    ),
                },
                {
                  header: "Capacity",
                  key: "capacity",
                  render: (t) =>
                    editMode ? (
                      <input
                        type="number"
                        value={t.capacity || ""}
                        onChange={(e) =>
                          updateTableField(t.id, "capacity", e.target.value)
                        }
                        placeholder="4"
                        className="w-20 rounded-lg border border-red-200 px-2.5 py-1.5 text-[12px] text-center outline-none focus:border-red-400"
                      />
                    ) : (
                      <span className="text-[12px] text-gray-600">
                        {t.capacity} seats
                      </span>
                    ),
                },
                {
                  header: "Status",
                  key: "status",
                  render: (t) => (
                    <span
                      className={`inline-flex rounded-full px-2 py-[3px] text-[10px] font-semibold ${t.status === "OCCUPIED" ? "bg-red-50 text-red-700" : t.status === "RESERVED" ? "bg-orange-50 text-orange-600" : "bg-emerald-50 text-emerald-600"}`}
                    >
                      {t.status || "AVAILABLE"}
                    </span>
                  ),
                },
                ...(editMode
                  ? [
                      {
                        header: "",
                        key: "actions",
                        render: (t: any) => (
                          <button
                            onClick={() => handleDeleteTable(t.id)}
                            className="rounded-lg border border-red-100 bg-[#b10000] px-2 py-1 text-[10px] font-semibold text-red-600 transition hover:bg-red-100"
                          >
                            Remove
                          </button>
                        ),
                      },
                    ]
                  : []),
              ]}
            />
          </div>

          {/* STAFF */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <div>
                <h3 className="text-[14px] font-bold text-gray-900">Staff</h3>
                <p className="mt-0.5 text-[11px] text-gray-400">
                  {staff.length} team members
                </p>
              </div>
              {editMode && (
                <button
                  onClick={handleAddStaff}
                  className="flex items-center gap-1 rounded-lg bg-[#b10000] px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-[#b10000]"
                >
                  + Add Staff
                </button>
              )}
            </div>

            {/* ── VIEW MODE: compact table ── */}
            {!editMode && (
              <div className="overflow-x-auto">
                {staff.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10">
                    <span className="text-2xl">👤</span>
                    <p className="mt-2 text-xs font-bold text-gray-500">
                      No staff added yet
                    </p>
                  </div>
                ) : (
                  <table className="min-w-full text-left">
                    <thead className="border-b border-gray-100 bg-gray-50">
                      <tr>
                        {[
                          "Name",
                          "Role",
                          "Dept",
                          "Shift",
                          "Phone",
                          "Salary",
                          "Login",
                        ].map((h) => (
                          <th
                            key={h}
                            className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wide text-gray-400"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {staff.map((s: any) => (
                        <tr key={s.id} className="hover:bg-gray-50/60">
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-2">
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#b10000] text-[10px] font-bold text-white">
                                {s.name?.charAt(0)?.toUpperCase() || "?"}
                              </div>
                              <div className="min-w-0">
                                <p className="text-[12px] font-semibold text-gray-900 truncate max-w-[120px]">
                                  {s.name || "—"}
                                </p>
                                <p className="text-[10px] text-gray-400 truncate max-w-[120px]">
                                  {s.email || ""}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] font-semibold text-gray-700">
                              {s.role || "—"}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-[11px] text-gray-600">
                            {s.department
                              ? s.department.charAt(0) +
                                s.department.slice(1).toLowerCase()
                              : "—"}
                          </td>
                          <td className="px-3 py-2.5 text-[11px] text-gray-600">
                            {s.shift
                              ? s.shift.charAt(0) +
                                s.shift.slice(1).toLowerCase().replace("_", " ")
                              : "—"}
                          </td>
                          <td className="px-3 py-2.5 text-[11px] text-gray-600">
                            {s.phone || "—"}
                          </td>
                          <td className="px-3 py-2.5 text-[11px] font-semibold text-gray-700">
                            {s.salary
                              ? `₹${Number(s.salary).toLocaleString("en-IN")}`
                              : "—"}
                          </td>
                          <td className="px-3 py-2.5">
                            <span
                              className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${s.hasLogin ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}
                            >
                              {s.hasLogin ? "Active" : "None"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* ── EDIT MODE: cards with all fields ── */}
            {editMode && (
              <div className="max-h-[480px] overflow-y-auto p-3 space-y-3">
                {staff.length === 0 && (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-10">
                    <span className="text-2xl">👤</span>
                    <p className="mt-2 text-xs font-bold text-gray-500">
                      No staff added yet
                    </p>
                    {editMode && (
                      <p className="text-[11px] text-gray-400">
                        Click "+ Add Staff" to add team members
                      </p>
                    )}
                  </div>
                )}
                {staff.map((s: any) => (
                  <div
                    key={s.id}
                    className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
                  >
                    {/* Card header */}
                    <div className="flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#b10000] text-[11px] font-bold text-white">
                          {s.name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div>
                          <p className="text-[13px] font-bold text-gray-900">
                            {s.name || "New Staff"}
                          </p>
                          <p className="text-[10px] text-gray-400">
                            {s.role || "STAFF"}
                          </p>
                        </div>
                      </div>
                      {editMode && (
                        <button
                          onClick={() =>
                            setStaff((prev) =>
                              prev.filter((x: any) => x.id !== s.id),
                            )
                          }
                          className="rounded-lg border border-red-100 bg-[#b10000] px-2.5 py-1 text-[10px] font-semibold text-white hover:bg-red-100"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    {/* Fields */}
                    <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 xl:grid-cols-3">
                      {[
                        {
                          key: "name",
                          label: "Full Name",
                          placeholder: "Enter name",
                        },
                        {
                          key: "email",
                          label: "Email",
                          placeholder: "Enter email",
                        },
                        {
                          key: "phone",
                          label: "Phone",
                          placeholder: "Enter phone",
                        },
                      ].map((f) => (
                        <div key={f.key}>
                          <p className="mb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                            {f.label}
                          </p>
                          {editMode ? (
                            <input
                              value={(s as any)[f.key] || ""}
                              placeholder={f.placeholder}
                              onChange={(e) =>
                                updateStaffField(s.id, f.key, e.target.value)
                              }
                              className="w-full rounded-lg border border-red-200 px-3 py-1.5 text-[12px] outline-none focus:border-red-400"
                            />
                          ) : (
                            <p className="text-[12px] text-gray-700">
                              {(s as any)[f.key] || "—"}
                            </p>
                          )}
                        </div>
                      ))}
                      {/* Role */}
                      <div>
                        <p className="mb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                          Role
                        </p>
                        {editMode ? (
                          <select
                            value={s.role || "STAFF"}
                            onChange={(e) =>
                              updateStaffField(s.id, "role", e.target.value)
                            }
                            className="w-full rounded-lg border border-red-200 px-3 py-1.5 text-[12px] outline-none focus:border-red-400"
                          >
                            <option value="STAFF">Staff</option>
                            <option value="MANAGER">Manager</option>
                            <option value="CASHIER">Cashier</option>
                          </select>
                        ) : (
                          <span className="inline-flex rounded-full border border-gray-200 bg-gray-50 px-2 py-[3px] text-[10px] font-semibold text-gray-700">
                            {s.role}
                          </span>
                        )}
                      </div>
                      {/* Department */}
                      <div>
                        <p className="mb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                          Department
                        </p>
                        {editMode ? (
                          <select
                            value={s.department || ""}
                            onChange={(e) =>
                              updateStaffField(
                                s.id,
                                "department",
                                e.target.value,
                              )
                            }
                            className="w-full rounded-lg border border-red-200 px-3 py-1.5 text-[12px] outline-none focus:border-red-400"
                          >
                            <option value="">Select</option>
                            {[
                              "KITCHEN",
                              "SERVICE",
                              "CLEANING",
                              "DELIVERY",
                              "ADMIN",
                              "SECURITY",
                              "PURCHASE",
                              "MAINTENANCE",
                            ].map((d) => (
                              <option key={d} value={d}>
                                {d.charAt(0) + d.slice(1).toLowerCase()}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <p className="text-[12px] text-gray-700">
                            {s.department
                              ? s.department.charAt(0) +
                                s.department.slice(1).toLowerCase()
                              : "—"}
                          </p>
                        )}
                      </div>
                      {/* Shift */}
                      <div>
                        <p className="mb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                          Shift
                        </p>
                        {editMode ? (
                          <select
                            value={s.shift || ""}
                            onChange={(e) =>
                              updateStaffField(s.id, "shift", e.target.value)
                            }
                            className="w-full rounded-lg border border-red-200 px-3 py-1.5 text-[12px] outline-none focus:border-red-400"
                          >
                            <option value="">Select</option>
                            <option value="MORNING">Morning</option>
                            <option value="EVENING">Evening</option>
                            <option value="FULL_DAY">Full Day</option>
                          </select>
                        ) : (
                          <p className="text-[12px] text-gray-700">
                            {s.shift
                              ? s.shift.charAt(0) +
                                s.shift.slice(1).toLowerCase().replace("_", " ")
                              : "—"}
                          </p>
                        )}
                      </div>
                      {/* Salary */}
                      <div>
                        <p className="mb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                          Salary
                        </p>
                        {editMode ? (
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-gray-400">
                              ₹
                            </span>
                            <input
                              type="number"
                              value={s.salary || ""}
                              placeholder="0"
                              onChange={(e) =>
                                updateStaffField(s.id, "salary", e.target.value)
                              }
                              className="w-full rounded-lg border border-red-200 pl-7 pr-3 py-1.5 text-[12px] outline-none focus:border-red-400"
                            />
                          </div>
                        ) : (
                          <p className="text-[12px] font-semibold text-gray-700">
                            {s.salary
                              ? `₹${Number(s.salary).toLocaleString("en-IN")}`
                              : "—"}
                          </p>
                        )}
                      </div>
                      {/* Joining Date */}
                      <div>
                        <p className="mb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                          Joining Date
                        </p>
                        {editMode ? (
                          <input
                            type="date"
                            value={
                              s.joiningDate
                                ? String(s.joiningDate).slice(0, 10)
                                : ""
                            }
                            onChange={(e) =>
                              updateStaffField(
                                s.id,
                                "joiningDate",
                                e.target.value,
                              )
                            }
                            className="w-full rounded-lg border border-red-200 px-3 py-1.5 text-[12px] outline-none focus:border-red-400"
                          />
                        ) : (
                          <p className="text-[12px] text-gray-700">
                            {s.joiningDate
                              ? new Date(s.joiningDate).toLocaleDateString(
                                  "en-IN",
                                )
                              : "—"}
                          </p>
                        )}
                      </div>
                      {/* Login Access */}
                      <div className="sm:col-span-2 xl:col-span-3">
                        <p className="mb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                          Login Access
                        </p>
                        {editMode ? (
                          <div className="flex flex-wrap items-center gap-3">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={s.hasLogin || false}
                                onChange={(e) =>
                                  updateStaffField(
                                    s.id,
                                    "hasLogin",
                                    e.target.checked,
                                  )
                                }
                                className="h-4 w-4 rounded border-gray-300 text-red-500"
                              />
                              <span className="text-[12px] font-medium text-gray-700">
                                Enable login access
                              </span>
                            </label>
                            {s.hasLogin && (
                              <input
                                type="text"
                                value={s.password || ""}
                                placeholder="Password (leave blank to keep)"
                                onChange={(e) =>
                                  updateStaffField(
                                    s.id,
                                    "password",
                                    e.target.value,
                                  )
                                }
                                className="rounded-lg border border-red-200 px-3 py-1.5 text-[12px] outline-none focus:border-red-400 w-52"
                              />
                            )}
                          </div>
                        ) : (
                          <span
                            className={`inline-flex rounded-full px-2 py-[3px] text-[10px] font-semibold ${s.hasLogin ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}
                          >
                            {s.hasLogin ? "Login enabled" : "No login"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── BILLING SETTINGS ─────────────────────────────────────────── */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
            <div>
              <h3 className="text-[15px] font-bold text-gray-900">
                Billing Settings
              </h3>
              <p className="mt-0.5 text-[11px] text-gray-500">
                Configure billing modules, tax, payments and checkout
                preferences
              </p>
            </div>
            {!editMode && (
              <button
                onClick={() => setEditMode(true)}
                className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                <PencilSquareIcon className="h-3.5 w-3.5" /> Edit
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-5 p-5 xl:grid-cols-3">
            {/* Billing Modules */}
            <div>
              <p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-gray-400">
                Billing Modules
              </p>
              <div className="space-y-2">
                {BILLING_MODULES.map((mod) => {
                  const active = (billing.billingTypes || []).includes(mod);
                  return (
                    <label
                      key={mod}
                      className={`flex cursor-pointer items-center justify-between rounded-xl border px-3 py-2.5 transition ${active ? "border-red-200 bg-red-50" : "border-gray-200 bg-gray-50/50"} ${!editMode ? "pointer-events-none" : ""}`}
                    >
                      <span
                        className={`text-[12px] font-semibold ${active ? "text-[#b10000]" : "text-gray-600"}`}
                      >
                        {mod}
                      </span>
                      <div
                        className={`relative h-5 w-9 rounded-full transition-colors ${active ? "bg-[#b10000]" : "bg-gray-200"}`}
                        onClick={() =>
                          editMode && toggleBillingArray("billingTypes", mod)
                        }
                      >
                        <div
                          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${active ? "left-[18px]" : "left-[2px]"}`}
                        />
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* GST + Service Charge + Preferences */}
            <div className="space-y-4">
              <div>
                <p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-gray-400">
                  Tax & Charges
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-gray-500">
                      GST Percentage
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={billing.gstPercentage || ""}
                        placeholder="0"
                        readOnly={!editMode}
                        onChange={(e) =>
                          editMode &&
                          updateBillingField("gstPercentage", e.target.value)
                        }
                        className={`${editMode ? INPUT_EDIT : INPUT_VIEW} pr-8`}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-gray-400">
                        %
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-gray-500">
                      Service Charge
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={billing.serviceCharge || ""}
                        placeholder="0"
                        readOnly={!editMode}
                        onChange={(e) =>
                          editMode &&
                          updateBillingField("serviceCharge", e.target.value)
                        }
                        className={`${editMode ? INPUT_EDIT : INPUT_VIEW} pr-8`}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-gray-400">
                        %
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-gray-400">
                  Preferences
                </p>
                <div className="space-y-2">
                  {(
                    [
                      {
                        key: "includeGST",
                        label: "GST Included in Price",
                        sub: "Tax already in menu prices",
                      },
                      {
                        key: "enableDiscount",
                        label: "Enable Discounts",
                        sub: "Allow discounts at billing",
                      },
                      {
                        key: "enableTips",
                        label: "Customer Tips",
                        sub: "Enable tip at checkout",
                      },
                    ] as const
                  ).map(({ key, label, sub }) => {
                    const on = billing[key] ?? false;
                    return (
                      <div
                        key={key}
                        className={`flex items-center justify-between rounded-xl border px-3 py-2.5 transition ${on ? "border-emerald-200 bg-emerald-50/50" : "border-gray-200 bg-gray-50/50"}`}
                      >
                        <div>
                          <p className="text-[12px] font-semibold text-gray-900">
                            {label}
                          </p>
                          <p className="text-[10px] text-gray-400">{sub}</p>
                        </div>
                        <div
                          className={`relative h-5 w-9 rounded-full transition-colors ${on ? "bg-emerald-500" : "bg-gray-200"} ${editMode ? "cursor-pointer" : ""}`}
                          onClick={() =>
                            editMode && updateBillingField(key, !on)
                          }
                        >
                          <div
                            className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${on ? "left-[18px]" : "left-[2px]"}`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Payment Methods */}
            <div>
              <p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-gray-400">
                Payment Methods
              </p>
              <div className="grid grid-cols-2 gap-2">
                {ALL_PAYMENT_METHODS.map((m) => {
                  const active = (billing.paymentMethods || []).includes(m);
                  return (
                    <label
                      key={m}
                      className={`flex cursor-pointer items-center justify-between rounded-xl border px-3 py-2.5 transition ${active ? "border-red-200 bg-red-50" : "border-gray-200 bg-gray-50/50"} ${!editMode ? "pointer-events-none" : ""}`}
                      onClick={() =>
                        editMode && toggleBillingArray("paymentMethods", m)
                      }
                    >
                      <span
                        className={`text-[12px] font-semibold ${active ? "text-[#b10000]" : "text-gray-500"}`}
                      >
                        {m}
                      </span>
                      <div
                        className={`h-4 w-4 rounded border-2 transition ${active ? "border-[#b10000] bg-white" : "border-gray-300 bg-white"} flex items-center justify-center`}
                      >
                        {active && (
                          <CheckIcon className="h-2.5 w-2.5 text-[#b10000]" />
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

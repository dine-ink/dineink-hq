import { useState, useEffect } from "react";
import Dropdown from "../../components/common/Dropdown";
import CommonTable from "@/components/common/CommonTable";
import {
  BanknotesIcon,
  BuildingStorefrontIcon,
  CheckCircleIcon,
  ReceiptPercentIcon,
} from "@heroicons/react/24/outline";

export default function Shops() {
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<any>(() => {
    const savedBranch = localStorage.getItem("selectedBranch");

    if (savedBranch) {
      return JSON.parse(savedBranch);
    }

    return null;
  });
  const [branchDetails, setBranchDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [staff, setStaff] = useState<any[]>([]);
  const rowsPerPage = 5;
  const [tablesPage, setTablesPage] = useState(1);
  const [staffPage, setStaffPage] = useState(1);
  const [editMode, setEditMode] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL;
  /* ================= FETCH SHOPS ================= */
  useEffect(() => {
    const fetchShops = async () => {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/restaurant/shops`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const json = await res.json();
      const restaurant = json.data;

      const branchList = restaurant?.branches || [];

      setBranches(branchList);

      if (branchList.length) {
        const savedBranch = localStorage.getItem("selectedBranch");

        let branch = branchList[0];

        if (savedBranch) {
          const parsed = JSON.parse(savedBranch);

          const matched = branchList.find((b: any) => b.id === parsed.id);

          if (matched) {
            branch = matched;
          }
        }

        setSelectedBranch(branch);

        fetchBranchDetails(branch.id);
      }
      setLoading(false);
    };
    fetchShops();
  }, []);
  useEffect(() => {
    const handleBranchChange = () => {
      const savedBranch = localStorage.getItem("selectedBranch");

      if (savedBranch) {
        const branch = JSON.parse(savedBranch);

        setSelectedBranch(branch);

        fetchBranchDetails(branch.id);
      }
    };

    window.addEventListener("branchChanged", handleBranchChange);

    return () => {
      window.removeEventListener("branchChanged", handleBranchChange);
    };
  }, []);
  /* ================= FETCH BRANCH ================= */
  const fetchBranchDetails = async (branchId: number) => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/api/restaurant/branch/${branchId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const json = await res.json();
    if (json.success) {
      const data = json.data;
      setBranchDetails(data);
      setStaff(data.users || []);
    }
  };
  /* ================= OPTIONS ================= */

  /* ================= PAGINATION ================= */
  const tables = branchDetails?.tables || [];
  const paginatedTables = tables.slice(
    (tablesPage - 1) * rowsPerPage,
    tablesPage * rowsPerPage,
  );
  const tablesTotalPages = Math.ceil(tables.length / rowsPerPage);
  const paginatedStaff = staff.slice(
    (staffPage - 1) * rowsPerPage,
    staffPage * rowsPerPage,
  );
  const staffTotalPages = Math.ceil(staff.length / rowsPerPage);
  if (loading) {
    return <div className="p-6 text-sm">Loading...</div>;
  }
  const handleSaveChanges = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:5000/api/restaurant/branch/${branchDetails.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(branchDetails),
        },
      );
      const data = await res.json();
      if (data.success) {
        alert("Branch updated");
        setEditMode(false);
        fetchBranchDetails(branchDetails.id);
      }
    } catch (err) {
      console.log(err);
      alert("Update failed");
    }
  };
  const handleAddTable = () => {
    setBranchDetails({
      ...branchDetails,
      tables: [
        {
          id: Date.now(),
          name: "",
          capacity: 4,
          status: "AVAILABLE",
        },
        ...branchDetails.tables,
      ],
    });
    setTablesPage(1);
  };

  const handleAddStaff = () => {
    setStaff([
      {
        id: Date.now(),
        name: "",
        role: "STAFF",
        email: "",
        phone: "",
        salary: 0,
        shift: "",
        isActive: true,
      },
      ...staff,
    ]);
    setStaffPage(1);
  };

  const handleToggleStaff = (id: number) => {
    const updated = [...staff];
    const index = updated.findIndex((s: any) => s.id === id);
    updated[index].isActive = !updated[index].isActive;
    setStaff(updated);
  };

  const handleDeleteTable = (id: number) => {
    setBranchDetails({
      ...branchDetails,
      tables: branchDetails.tables.filter((t: any) => t.id !== id),
    });
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-4">
        {/* ================= HERO ================= */}

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 px-4 py-4 xl:flex-row xl:items-center xl:justify-between">
            {/* LEFT */}

            <div className="flex items-center gap-4">
              {/* LOGO */}

              <div className="h-14 w-14 overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
                {branchDetails?.restaurant?.logo ? (
                  <img
                    src={`http://localhost:5000${branchDetails.restaurant.logo}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[10px] text-gray-400">
                    No Logo
                  </div>
                )}
              </div>

              {/* INFO */}

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-[20px] font-bold tracking-tight text-gray-900">
                    {branchDetails?.restaurant?.name}
                  </h1>

                  <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-600">
                    Active
                  </span>
                </div>

                <p className="mt-1 text-[12px] text-gray-500">
                  {branchDetails?.address}, {branchDetails?.city},{" "}
                  {branchDetails?.state} - {branchDetails?.pincode}
                </p>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <div className="rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-[11px] font-medium text-gray-700">
                    Branch: {branchDetails?.name}
                  </div>

                  <div className="rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-[11px] font-medium text-gray-700">
                    Tables: {branchDetails?.tables?.length || 0}
                  </div>

                  <div className="rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-[11px] font-medium text-gray-700">
                    Staff: {staff?.length || 0}
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT */}

            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditMode(!editMode)}
                className={`rounded-lg px-3 py-2 text-[12px] font-semibold text-white transition-all duration-200 ${
                  editMode
                    ? "bg-gray-700 hover:bg-gray-800"
                    : "bg-red-500 hover:bg-red-600"
                }`}
              >
                {editMode ? "Cancel" : "Edit Branch"}
              </button>
            </div>
          </div>

          {/* INFO GRID */}

          <div className="grid grid-cols-1 gap-3 border-t border-gray-100 p-4 md:grid-cols-2 xl:grid-cols-3">
            <Input
              label="Email"
              value={branchDetails?.restaurant?.email}
              editMode={editMode}
              onChange={(e: any) =>
                setBranchDetails({
                  ...branchDetails,
                  restaurant: {
                    ...branchDetails.restaurant,
                    email: e.target.value,
                  },
                })
              }
            />

            <Input
              label="Phone"
              value={branchDetails?.restaurant?.phone}
              editMode={editMode}
              onChange={(e: any) =>
                setBranchDetails({
                  ...branchDetails,
                  restaurant: {
                    ...branchDetails.restaurant,
                    phone: e.target.value,
                  },
                })
              }
            />

            <Input
              label="Address"
              value={branchDetails?.address}
              editMode={editMode}
              onChange={(e: any) =>
                setBranchDetails({
                  ...branchDetails,
                  address: e.target.value,
                })
              }
            />

            <Input
              label="City"
              value={branchDetails?.city}
              editMode={editMode}
              onChange={(e: any) =>
                setBranchDetails({
                  ...branchDetails,
                  city: e.target.value,
                })
              }
            />

            <Input
              label="State"
              value={branchDetails?.state}
              editMode={editMode}
              onChange={(e: any) =>
                setBranchDetails({
                  ...branchDetails,
                  state: e.target.value,
                })
              }
            />

            <Input
              label="Pincode"
              value={branchDetails?.pincode}
              editMode={editMode}
              onChange={(e: any) =>
                setBranchDetails({
                  ...branchDetails,
                  pincode: e.target.value,
                })
              }
            />
          </div>
        </div>

        {/* ================= STAFF + TABLES ================= */}

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {/* TABLES */}

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <CommonTable
              title="Tables"
              subtitle="Manage restaurant seating"
              compact
              data={paginatedTables}
              page={tablesPage}
              totalPages={tablesTotalPages}
              onPageChange={setTablesPage}
              headerAction={
                editMode && (
                  <button
                    onClick={handleAddTable}
                    className="rounded-md bg-red-500 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-red-600"
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
                        onChange={(e) => {
                          const updated = [...branchDetails.tables];

                          const index = updated.findIndex(
                            (x: any) => x.id === t.id,
                          );

                          updated[index].name = e.target.value;

                          setBranchDetails({
                            ...branchDetails,
                            tables: updated,
                          });
                        }}
                        className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-[12px]"
                      />
                    ) : (
                      <div>
                        <p className="text-[13px] font-semibold text-gray-800">
                          {t.name}
                        </p>

                        <p className="text-[10px] text-gray-400">
                          {t.capacity} Seats
                        </p>
                      </div>
                    ),
                },

                {
                  header: "Status",
                  key: "status",
                  render: (t) => (
                    <span
                      className={`inline-flex rounded-full px-2 py-[3px] text-[10px] font-medium ${
                        t.status === "OCCUPIED"
                          ? "bg-red-50 text-red-600"
                          : t.status === "RESERVED"
                            ? "bg-orange-50 text-orange-600"
                            : "bg-emerald-50 text-emerald-600"
                      }`}
                    >
                      {t.status || "AVAILABLE"}
                    </span>
                  ),
                },
              ]}
            />
          </div>

          {/* STAFF */}

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <CommonTable
              title="Staff"
              subtitle="Restaurant workforce"
              compact
              data={paginatedStaff}
              page={staffPage}
              totalPages={staffTotalPages}
              onPageChange={setStaffPage}
              columns={[
                {
                  header: "Staff",
                  key: "name",
                  render: (s) => (
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-[12px] font-bold text-gray-700">
                        {s.name?.charAt(0)}
                      </div>

                      <div>
                        <p className="text-[13px] font-semibold text-gray-800">
                          {s.name}
                        </p>

                        <p className="text-[10px] text-gray-400">
                          {s.email || "No email"}
                        </p>
                      </div>
                    </div>
                  ),
                },

                {
                  header: "Role",
                  key: "role",
                  render: (s) => (
                    <span className="inline-flex rounded-full border border-gray-200 bg-white px-2 py-[3px] text-[10px] font-medium text-gray-700">
                      {s.role}
                    </span>
                  ),
                },

                {
                  header: "Phone",
                  key: "phone",
                  render: (s) => (
                    <span className="text-[12px] text-gray-600">
                      {s.phone || "-"}
                    </span>
                  ),
                },

                {
                  header: "Salary",
                  key: "salary",
                  render: (s) => (
                    <span className="text-[12px] font-semibold text-gray-900">
                      {s.salary ? `₹${s.salary}` : "-"}
                    </span>
                  ),
                },
              ]}
            />
          </div>
        </div>

        {/* ================= SETTINGS ================= */}

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_0.7fr]">
          {/* BILLING */}

          <div className="space-y-4">
            {/* BILLING SETTINGS */}

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              {/* HEADER */}

              <div className="border-b border-gray-100 px-4 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-[18px] font-bold tracking-tight text-gray-900">
                      Billing Settings
                    </h3>

                    <p className="mt-0.5 text-[12px] text-gray-500">
                      Taxation & billing configuration
                    </p>
                  </div>

                  <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
                    <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-gray-400">
                      GST
                    </p>

                    <p className="text-[16px] font-bold text-gray-900">
                      {selectedBranch?.billing?.gstPercentage || 0}%
                    </p>
                  </div>
                </div>
              </div>

              {/* CONTENT */}

              <div className="grid grid-cols-1 gap-3 p-3 md:grid-cols-2">
                {/* GST */}

                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400">
                        GST Percentage
                      </p>

                      <h4 className="mt-1.5 text-xl font-bold text-gray-900">
                        {selectedBranch?.billing?.gstPercentage || 0}%
                      </h4>

                      <p className="mt-1 text-[11px] text-gray-500">
                        Applied on taxable bills
                      </p>
                    </div>

                    <div className="rounded-lg bg-gray-200 p-2">
                      <ReceiptPercentIcon className="h-4 w-4 text-gray-700" />
                    </div>
                  </div>
                </div>

                {/* SERVICE */}

                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400">
                        Service Charge
                      </p>

                      <h4 className="mt-1.5 text-xl font-bold text-gray-900">
                        {selectedBranch?.billing?.serviceCharge || 0}%
                      </h4>

                      <p className="mt-1 text-[11px] text-gray-500">
                        Added during checkout
                      </p>
                    </div>

                    <div className="rounded-lg bg-gray-200 p-2">
                      <BanknotesIcon className="h-4 w-4 text-gray-700" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* PAYMENT METHODS */}

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              {/* HEADER */}

              <div className="border-b border-gray-100 px-4 py-3">
                <h3 className="text-[18px] font-bold tracking-tight text-gray-900">
                  Payment Methods
                </h3>

                <p className="mt-0.5 text-[12px] text-gray-500">
                  Supported payment options
                </p>
              </div>

              {/* GRID */}

              <div className="grid grid-cols-2 gap-2 p-3 md:grid-cols-4">
                {["Cash", "UPI", "Card", "Wallet"].map((method) => (
                  <div
                    key={method}
                    className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-3"
                  >
                    <div className="mb-2 h-7 w-7 rounded-lg bg-gray-200" />

                    <h4 className="text-[13px] font-semibold text-gray-900">
                      {method}
                    </h4>

                    <p className="mt-0.5 text-[10px] text-gray-500">Enabled</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* PREFERENCES */}

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            {/* HEADER */}

            <div className="border-b border-gray-100 px-4 py-3">
              <h3 className="text-[18px] font-bold tracking-tight text-gray-900">
                Preferences
              </h3>

              <p className="mt-0.5 text-[12px] text-gray-500">
                Billing & workflow controls
              </p>
            </div>

            {/* SETTINGS */}

            <div className="space-y-2 p-3">
              {[
                {
                  title: "GST Included",
                  subtitle: "Tax included in billing",
                },

                {
                  title: "Enable Discounts",
                  subtitle: "Allow discounts",
                },

                {
                  title: "Customer Tips",
                  subtitle: "Enable tip collection",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-7 w-7 rounded-lg bg-gray-200" />

                    <div>
                      <p className="text-[12px] font-semibold text-gray-900">
                        {item.title}
                      </p>

                      <p className="text-[10px] text-gray-500">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* TOGGLE */}

                  <button className="relative h-5 w-10 rounded-full bg-emerald-500">
                    <div className="absolute right-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* SAVE BAR */}

      {editMode && (
        <div className="sticky bottom-0 mt-4 border-t border-gray-200 bg-white/95 px-4 py-3 backdrop-blur">
          <div className="flex justify-end">
            <button
              onClick={handleSaveChanges}
              className="rounded-lg bg-red-500 px-5 py-2 text-[12px] font-semibold text-white transition hover:bg-red-600"
            >
              Save Changes
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
/* ================= INPUT ================= */

const Input = ({
  label,
  value,
  onChange,
  editMode = false,
  type = "text",
}: any) => (
  <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3">
    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
      {label}
    </p>
    <input
      type={type}
      value={value || ""}
      onChange={onChange}
      readOnly={!editMode}
      className={`w-full rounded-2xl border px-3 py-2 text-sm font-medium outline-none transition-all duration-200 ${
        editMode
          ? "border-red-200 bg-white text-gray-800 focus:border-red-400"
          : "border-gray-100 bg-white text-gray-800"
      }`}
    />
  </div>
);

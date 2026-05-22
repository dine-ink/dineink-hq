import { useState, useEffect } from "react";
import Dropdown from "../../components/common/Dropdown";
import CommonTable from "@/components/common/CommonTable";

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
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50/30 px-6 py-6">
      <div className="mx-auto space-y-4">
        {/* ================= HEADER ================= */}
        <div className="relative overflow-visible z-50 rounded-2xl p-5 border border-white/40 bg-white/80 shadow-[0_8px_30px_rgba(0,0,0,0.05)] backdrop-blur-xl">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-red-100 blur-3xl"></div>
          <div className="relative z-10 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-red-600">
                Restaurant Intelligence
              </div>
              <h1 className="mt-4 text-2xl font-bold tracking-tight text-gray-900">
                Shops Overview
              </h1>
              <p className="mt-2 text-sm text-gray-500">
                Manage branches, operations, staff and restaurant settings
              </p>
            </div>
          </div>
        </div>
        {/* ================= HERO CARD ================= */}
        <div className="relative overflow-hidden rounded-2xl border border-white/40 bg-white/80 p-6 shadow-[0_8px_30px_rgba(0,0,0,0.05)] backdrop-blur-xl">
          {/* BG GLOW */}
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-red-100 blur-3xl"></div>
          <div className="relative z-10 flex flex-col gap-8 xl:flex-row xl:items-start xl:justify-between">
            {/* LEFT */}
            <div className="flex flex-1 flex-col gap-6">
              {/* TOP */}
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                {/* LOGO */}
                <div className="h-20 w-20 overflow-hidden rounded-3xl border border-gray-100 bg-gray-100 shadow-sm">
                  {branchDetails?.restaurant?.logo ? (
                    <img
                      src={`http://localhost:5000${branchDetails.restaurant.logo}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-gray-400">
                      No Logo
                    </div>
                  )}
                </div>
                {/* TITLE */}
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                    {branchDetails?.restaurant?.name}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-gray-500">
                    {branchDetails?.address}, {branchDetails?.city},{" "}
                    {branchDetails?.state} - {branchDetails?.pincode}
                  </p>
                </div>
              </div>
              {/* INFO + ACTIONS */}
              <div className="flex flex-col gap-5 xl:flex-row xl:items-start">
                {/* INFO GRID */}
                <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
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
                {/* RIGHT PANEL */}
                <div className="flex min-w-[220px] flex-col gap-4 rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Branch
                    </p>
                    <div className="mt-2 inline-flex rounded-2xl bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700">
                      {branchDetails?.name}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Status
                    </p>
                    <div className="mt-2 inline-flex rounded-2xl bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-600">
                      Active
                    </div>
                  </div>
                  <button
                    onClick={() => setEditMode(!editMode)}
                    className={`mt-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all duration-200 ${
                      editMode
                        ? "bg-gray-700 hover:bg-gray-800"
                        : "bg-red-500 hover:bg-red-600"
                    }`}
                  >
                    {editMode ? "Cancel Editing" : "Edit Branch"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= TABLES ================= */}
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-1">
          {/* TABLES */}
          <div className="overflow-hidden rounded-2xl border border-white/40 bg-white/80 shadow-[0_8px_30px_rgba(0,0,0,0.05)] backdrop-blur-xl">
            <CommonTable
              title="Tables"
              subtitle="Manage seating"
              data={paginatedTables}
              page={tablesPage}
              totalPages={tablesTotalPages}
              onPageChange={setTablesPage}
              headerAction={
                editMode && (
                  <button
                    onClick={handleAddTable}
                    className="rounded-2xl bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
                  >
                    + Add Table
                  </button>
                )
              }
              columns={[
                {
                  header: "Table Name",
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
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                      />
                    ) : (
                      t.name
                    ),
                },
                {
                  header: "Capacity",
                  key: "capacity",
                  render: (t) =>
                    editMode ? (
                      <input
                        type="number"
                        value={t.capacity}
                        onChange={(e) => {
                          const updated = [...branchDetails.tables];
                          const index = updated.findIndex(
                            (x: any) => x.id === t.id,
                          );
                          updated[index].capacity = Number(e.target.value);
                          setBranchDetails({
                            ...branchDetails,
                            tables: updated,
                          });
                        }}
                        className="w-24 rounded-xl border border-gray-200 px-3 py-2 text-sm"
                      />
                    ) : (
                      t.capacity
                    ),
                },
                {
                  header: "Status",
                  key: "status",
                  render: (t) =>
                    editMode ? (
                      <select
                        value={t.status}
                        onChange={(e) => {
                          const updated = [...branchDetails.tables];
                          const index = updated.findIndex(
                            (x: any) => x.id === t.id,
                          );
                          updated[index].status = e.target.value;
                          setBranchDetails({
                            ...branchDetails,
                            tables: updated,
                          });
                        }}
                        className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
                      >
                        <option value="AVAILABLE">AVAILABLE</option>
                        <option value="RESERVED">RESERVED</option>
                        <option value="OCCUPIED">OCCUPIED</option>
                      </select>
                    ) : (
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          t.status === "OCCUPIED"
                            ? "bg-red-100 text-red-700"
                            : t.status === "RESERVED"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-green-100 text-green-700"
                        }`}
                      >
                        {t.status || "AVAILABLE"}
                      </span>
                    ),
                },
                ...(editMode
                  ? [
                      {
                        header: "Actions",
                        key: "actions",
                        render: (t: any) => (
                          <button
                            onClick={() => handleDeleteTable(t.id)}
                            className="rounded-lg bg-red-50 px-3 py-1 text-xs font-semibold text-red-600"
                          >
                            Delete
                          </button>
                        ),
                      },
                    ]
                  : []),
              ]}
            />
          </div>
        </div>
        {/* ================= STAFF ================= */}
        <div className="overflow-hidden rounded-3xl border border-white/40 bg-white/80 shadow-[0_8px_30px_rgba(0,0,0,0.05)] backdrop-blur-xl">
          <CommonTable
            title="Staff"
            subtitle="Manage team"
            data={paginatedStaff}
            page={staffPage}
            totalPages={staffTotalPages}
            onPageChange={setStaffPage}
            headerAction={
              editMode && (
                <button
                  onClick={handleAddStaff}
                  className="rounded-2xl bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
                >
                  + Add Staff
                </button>
              )
            }
            columns={[
              {
                header: "Name",
                key: "name",
                render: (s) =>
                  editMode ? (
                    <input
                      value={s.name}
                      onChange={(e) => {
                        const updated = [...staff];
                        const index = updated.findIndex(
                          (x: any) => x.id === s.id,
                        );
                        updated[index].name = e.target.value;
                        setStaff(updated);
                      }}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                    />
                  ) : (
                    s.name
                  ),
              },
              {
                header: "Role",
                key: "role",
                render: (s) =>
                  editMode ? (
                    <select
                      value={s.role}
                      onChange={(e) => {
                        const updated = [...staff];
                        const index = updated.findIndex(
                          (x: any) => x.id === s.id,
                        );
                        updated[index].role = e.target.value;
                        setStaff(updated);
                      }}
                      className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
                    >
                      <option value="STAFF">STAFF</option>
                      <option value="MANAGER">MANAGER</option>
                      <option value="CASHIER">CASHIER</option>
                    </select>
                  ) : (
                    <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                      {s.role}
                    </span>
                  ),
              },
              {
                header: "Email",
                key: "email",
                render: (s) =>
                  editMode ? (
                    <input
                      value={s.email || ""}
                      onChange={(e) => {
                        const updated = [...staff];
                        const index = updated.findIndex(
                          (x: any) => x.id === s.id,
                        );
                        updated[index].email = e.target.value;
                        setStaff(updated);
                      }}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                    />
                  ) : (
                    s.email || "-"
                  ),
              },
              {
                header: "Phone",
                key: "phone",
                render: (s) =>
                  editMode ? (
                    <input
                      value={s.phone || ""}
                      onChange={(e) => {
                        const updated = [...staff];
                        const index = updated.findIndex(
                          (x: any) => x.id === s.id,
                        );
                        updated[index].phone = e.target.value;
                        setStaff(updated);
                      }}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                    />
                  ) : (
                    s.phone || "-"
                  ),
              },
              {
                header: "Salary",
                key: "salary",
                render: (s) =>
                  editMode ? (
                    <input
                      type="number"
                      value={s.salary || 0}
                      onChange={(e) => {
                        const updated = [...staff];
                        const index = updated.findIndex(
                          (x: any) => x.id === s.id,
                        );
                        updated[index].salary = Number(e.target.value);
                        setStaff(updated);
                      }}
                      className="w-28 rounded-xl border border-gray-200 px-3 py-2 text-sm"
                    />
                  ) : s.salary ? (
                    `₹${s.salary}`
                  ) : (
                    "-"
                  ),
              },
              {
                header: "Shift",
                key: "shift",
                render: (s) =>
                  editMode ? (
                    <input
                      value={s.shift || ""}
                      onChange={(e) => {
                        const updated = [...staff];
                        const index = updated.findIndex(
                          (x: any) => x.id === s.id,
                        );
                        updated[index].shift = e.target.value;
                        setStaff(updated);
                      }}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                    />
                  ) : (
                    s.shift || "-"
                  ),
              },
              {
                header: "Status",
                key: "isActive",
                render: (s) => (
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      s.isActive
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {s.isActive ? "ACTIVE" : "INACTIVE"}
                  </span>
                ),
              },
              ...(editMode
                ? [
                    {
                      header: "Actions",
                      key: "actions",
                      render: (s: any) => (
                        <button
                          onClick={() => handleToggleStaff(s.id)}
                          className={`rounded-lg px-3 py-1 text-xs font-semibold ${
                            s.isActive
                              ? "bg-red-50 text-red-600"
                              : "bg-emerald-50 text-emerald-600"
                          }`}
                        >
                          {s.isActive ? "Deactivate" : "Activate"}
                        </button>
                      ),
                    },
                  ]
                : []),
            ]}
          />
        </div>
        {/* ================= BILLING ================= */}
        <div className="rounded-3xl border border-white/40 bg-white/80 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.05)] backdrop-blur-xl">
          {/* HEADER */}
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-900">
              Billing Settings
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Taxation, billing workflows & payment configuration
            </p>
          </div>
          {/* TOP GRID */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            <Input
              label="GST Percentage"
              value={selectedBranch?.billing?.gstPercentage}
              editMode={editMode}
              onChange={(e: any) =>
                setBranchDetails({
                  ...branchDetails,
                  billing: {
                    ...branchDetails.billing,
                    gstPercentage: e.target.value,
                  },
                })
              }
            />
            <Input
              label="Service Charge"
              value={selectedBranch?.billing?.serviceCharge}
              editMode={editMode}
              onChange={(e: any) =>
                setBranchDetails({
                  ...selectedBranch,
                  billing: {
                    ...selectedBranch.billing,
                    serviceCharge: e.target.value,
                  },
                })
              }
            />
            <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
              <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-gray-400">
                Payment Methods
              </p>
              <div className="flex flex-wrap gap-3">
                {["Cash", "UPI", "Card", "Wallet", "Net Banking", "cheque"].map(
                  (method) => {
                    const active =
                      selectedBranch?.billing?.paymentMethods?.includes(method);
                    return (
                      <button
                        key={method}
                        disabled={!editMode}
                        onClick={() => {
                          if (!editMode) return;
                          const current =
                            selectedBranch.billing.paymentMethods || [];
                          const updated = current.includes(method)
                            ? current.filter((x: string) => x !== method)
                            : [...current, method];
                          setBranchDetails({
                            ...selectedBranch,
                            billing: {
                              ...selectedBranch.billing,
                              paymentMethods: updated,
                            },
                          });
                        }}
                        className={`rounded-2xl px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                          active
                            ? "bg-red-500 text-white"
                            : "bg-gray-100 text-gray-600"
                        } ${!editMode ? "cursor-default" : "hover:scale-105"}`}
                      >
                        {method}
                      </button>
                    );
                  },
                )}
              </div>
            </div>
          </div>
          {/* BILLING MODULES */}
          <div className="mt-8">
            <h4 className="text-sm font-bold uppercase tracking-wide text-gray-500">
              Billing Modules
            </h4>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[
                "Table Wise Billing",
                "Quick Billing",
                "Takeaway Billing",
                "Delivery Billing",
                "QR Ordering",
                "KOT Billing",
              ].map((type) => {
                const active =
                  selectedBranch?.billing?.billingTypes?.includes(type);
                return (
                  <button
                    key={type}
                    disabled={!editMode}
                    onClick={() => {
                      if (!editMode) return;
                      const current = selectedBranch.billing.billingTypes || [];
                      const updated = current.includes(type)
                        ? current.filter((x: string) => x !== type)
                        : [...current, type];
                      setBranchDetails({
                        ...selectedBranch,
                        billing: {
                          ...selectedBranch.billing,
                          billingTypes: updated,
                        },
                      });
                    }}
                    className={`rounded-2xl border p-4 text-left transition-all duration-200 ${
                      active
                        ? "border-red-500 bg-red-50"
                        : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p
                          className={`text-sm font-semibold ${
                            active ? "text-red-700" : "text-gray-700"
                          }`}
                        >
                          {type}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          Enable this billing workflow
                        </p>
                      </div>
                      <div
                        className={`flex h-6 w-6 items-center justify-center rounded-md border text-xs font-bold ${
                          active
                            ? "border-red-500 bg-red-500 text-white"
                            : "border-gray-300 bg-white text-transparent"
                        }`}
                      >
                        ✓
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          {/* BILLING PREFERENCES */}
          <div className="mt-8">
            <h4 className="text-sm font-bold uppercase tracking-wide text-gray-500">
              Billing Preferences
            </h4>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[
                {
                  key: "includeGST",
                  label: "GST Included In Price",
                },
                {
                  key: "enableDiscount",
                  label: "Enable Discounts",
                },
                {
                  key: "enableTips",
                  label: "Enable Customer Tips",
                },
              ].map((item) => {
                const active = selectedBranch?.billing?.[item.key];
                return (
                  <div
                    key={item.key}
                    className={`rounded-3xl border p-5 transition-all duration-200 ${
                      active
                        ? "border-emerald-200 bg-emerald-50"
                        : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {item.label}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {active ? "Enabled" : "Disabled"}
                        </p>
                      </div>
                      <button
                        disabled={!editMode}
                        onClick={() => {
                          if (!editMode) return;
                          setBranchDetails({
                            ...selectedBranch,
                            billing: {
                              ...selectedBranch.billing,
                              [item.key]: !active,
                            },
                          });
                        }}
                        className={`relative h-7 w-14 rounded-full transition-all duration-200 ${
                          active ? "bg-emerald-500" : "bg-gray-300"
                        }`}
                      >
                        <div
                          className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all duration-200 ${
                            active ? "left-8" : "left-1"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      {editMode && (
        <div className="sticky bottom-5 z-50 flex justify-end">
          <button
            onClick={handleSaveChanges}
            className="rounded-2xl bg-red-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:bg-red-600"
          >
            Save Changes
          </button>
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

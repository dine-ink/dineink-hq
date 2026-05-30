import { useEffect, useState } from "react";

const tabs = [
  "General",
  "Branches",
  "Password",
  "Notifications",
  "Plan",
];

export default function Settings() {
  const API_URL = import.meta.env.VITE_API_URL;
  const [activeTab, setActiveTab] = useState("General");
  const [settingsData, setSettingsData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [branchEditMode, setBranchEditMode] = useState(false);
  const [passwordEditMode, setPasswordEditMode] = useState(false);
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const res = await fetch(`${API_URL}/api/restaurant/settings/${user.restaurantId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await res.json();
      if (data.success) {
        setEditMode(false)
        setSettingsData(data.data);
      }
    } catch {
      // fetch error
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBranches = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/restaurant/branches/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ branches: settingsData.branches }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Branches updated successfully");
        setBranchEditMode(false);
        fetchSettings();
      } else {
        alert(data.message);
      }
    } catch {
      alert("Failed to update branches");
    }
  };

  const handleSaveGeneral = async () => {
    try {
      const token = localStorage.getItem("token");
      const updatedOwner = settingsData.users.find((u: any) => u.role === "OWNER");
      const res = await fetch(`${API_URL}/api/restaurant/general/${settingsData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: updatedOwner?.name, email: updatedOwner.email, phone: updatedOwner.phone }),
      });
      const data = await res.json();
      if (data.success) {
        alert("General settings updated");
        setEditMode(false);
        const existingUser = JSON.parse(localStorage.getItem("user") || "{}");
        existingUser.name = updatedOwner?.name;
        existingUser.email = updatedOwner?.email;
        existingUser.phone = updatedOwner?.phone;
        setSettingsData((prev: any) => ({
          ...prev,
          users: prev.users.map((u: any) =>
            u.role === "OWNER" ? { ...u, name: updatedOwner?.name, email: updatedOwner?.email, phone: updatedOwner?.phone } : u
          ),
        }));
        localStorage.setItem("user", JSON.stringify(existingUser));
      } else {
        alert(data.message);
      }
    } catch {
      alert("Failed to update settings");
    }
  };

  const handleUpdatePassword = async () => {
    try {
      if (settingsData.newPassword !== settingsData.confirmPassword) {
        alert("Passwords do not match");
        return;
      }
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/auth/change-password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: settingsData.currentPassword, newPassword: settingsData.newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Password updated successfully");
        setPasswordEditMode(false);
        setSettingsData({ ...settingsData, currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        alert(data.message);
      }
    } catch {
      alert("Password update failed");
    }
  };
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
    <main className="min-h-screen bg-gray-50 px-6 py-6 border border-gray-200">
      <div className="mx-auto space-y-5">
        {/* HEADER */}
        <div className="shrink-0 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            {/* TITLE */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Settings
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage your DineInk account preferences
              </p>
            </div>
            {/* TABS */}
            <div className="hide-scrollbar overflow-x-auto">
              <div className="flex min-w-max gap-2">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() =>
                      setActiveTab(tab)
                    }
                    className={`rounded-xl border px-5 py-2 text-sm font-medium transition ${
                      activeTab === tab
                        ? "border-red-600 bg-red-600 text-white"
                        : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        {/* CONTENT */}
        <div className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          {/* ================= GENERAL ================= */}
          {activeTab === "General" && (
            <div className="space-y-8">
              {/* HEADER */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  General Settings
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Manage your account information and preferences
                </p>
              </div>
              {/* PROFILE */}
              <div className="rounded-2xl border border-gray-200 p-6">
                <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
                  {/* IMAGE */}
                  <div className="flex flex-col items-center gap-4">
                    <img
                      src={
                        settingsData?.logo
                          ? `${API_URL}${settingsData.logo}`
                          : "https://i.pravatar.cc/150?img=12"
                      }
                      alt=""
                      className="size-24 rounded-full object-cover"
                    />
                    <div className="flex gap-2">
                      <button className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white">
                        Upload
                      </button>
                      <button className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700">
                        Remove
                      </button>
                    </div>
                  </div>
                  {/* FORM */}
                  <div className="grid flex-1 grid-cols-1 gap-5 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Full Name
                      </label>
                      <input
                        type="text"
                        readOnly={!editMode}
                        value={
                          settingsData?.users?.find(
                            (u: any) =>
                              u.role === "OWNER"
                          )?.name || ""
                        }
                        onChange={(e) => {
                          setSettingsData({
                            ...settingsData,
                            users:
                              settingsData.users.map(
                                (u: any) =>
                                  u.role === "OWNER"
                                    ? {
                                        ...u,
                                        name:
                                          e.target.value,
                                      }
                                    : u
                              ),
                          });
                        }}
                        className={`w-full rounded-xl border px-4 py-3 outline-none ${
                          editMode
                            ? "border-red-300 bg-white focus:border-red-500"
                            : "border-gray-200 bg-gray-100"
                        }`}
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Email Address
                      </label>
                      <input
                        type="email"
                        readOnly={!editMode}
                        value={settingsData?.email || ""}
                        onChange={(e) =>
                          setSettingsData({
                            ...settingsData,
                            email: e.target.value,
                          })
                        }
                        className={`w-full rounded-xl border px-4 py-3 outline-none ${
                          editMode
                            ? "border-red-300 bg-white focus:border-red-500"
                            : "border-gray-200 bg-gray-100"
                        }`}
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Phone Number
                      </label>
                      <input
                        type="text"
                        readOnly={!editMode}
                        value={settingsData?.phone || ""}
                        onChange={(e) =>
                          setSettingsData({
                            ...settingsData,
                            phone: e.target.value,
                          })
                        }
                        className={`w-full rounded-xl border px-4 py-3 outline-none ${
                          editMode
                            ? "border-red-300 bg-white focus:border-red-500"
                            : "border-gray-200 bg-gray-100"
                        }`}
                      />
                    </div>
                    {/* <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Language
                      </label>
                      <select

                        disabled={!editMode}

                        value={settingsData?.language || "English"}

                        onChange={(e) =>

                          setSettingsData({
                            ...settingsData,
                            language: e.target.value,
                          })
                        }

                        className={`w-full rounded-xl border px-4 py-3 outline-none ${
                          editMode
                            ? "border-red-300 bg-white focus:border-red-500"
                            : "border-gray-200 bg-gray-100"
                        }`}
                      >

                        <option>English</option>

                        <option>Tamil</option>

                      </select>
                    </div> */}
                    {/* <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Timezone
                      </label>
                      <select className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-red-500">
                        <option>Asia/Kolkata</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Date Format
                      </label>
                      <select className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-red-500">
                        <option>DD-MM-YYYY</option>
                        <option>MM-DD-YYYY</option>
                      </select>
                    </div> */}
                  </div>
                </div>
              </div>
              {/* ACTION BUTTONS */}
              <div className="flex justify-end gap-3">
                {editMode && (
                  <button
                    onClick={fetchSettings}
                    className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                )}
                <button
                  onClick={() => {
                    if (editMode) {
                      handleSaveGeneral();
                    } else {
                      setEditMode(true);
                    }
                  }}
                  className={`rounded-xl px-5 py-3 text-sm font-medium text-white transition ${
                    editMode
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {editMode
                    ? "Save Changes"
                    : "Edit Settings"}
                </button>
              </div>
            </div>
          )}
          {/* ================= BRANCHES ================= */}
          {activeTab === "Branches" && (
            <div className="space-y-8">
              {/* HEADER */}
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Branch Management
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Manage all your restaurant branches
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  {branchEditMode && (
                    <button
                      onClick={() => {
                        fetchSettings();
                        setBranchEditMode(false);
                      }}
                      className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (!branchEditMode) {
                        setBranchEditMode(true);
                      } else {
                        handleSaveBranches();
                      }
                    }}
                    className={`rounded-xl px-5 py-3 text-sm font-medium text-white ${
                      branchEditMode
                        ? "bg-emerald-600 hover:bg-emerald-700"
                        : "bg-red-600 hover:bg-red-700"
                    }`}
                  >
                    {branchEditMode
                      ? "Save Branches"
                      : "Edit Branches"}
                  </button>
                  <button
                    disabled={!branchEditMode}
                    onClick={() => {
                      setSettingsData({
                        ...settingsData,
                        branches: [
                          {
                            id: Date.now(),
                            name: "",
                            city: "",
                            state: "",
                            pincode: "",
                            phone: "",
                            isDeleted: false,
                          },
                          ...settingsData.branches,
                        ],
                      });
                    }}
                    className="rounded-xl bg-black px-5 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Add Branch
                  </button>
                </div>
              </div>
              {/* BRANCH LIST */}
              <div className="space-y-4">
                {settingsData?.branches?.map(
                  (branch: any) => (
                    <div
                      key={branch.id}
                      className="rounded-2xl border border-gray-200 p-5"
                    >
                      <div className="flex flex-col gap-5">
                        {/* TOP */}
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          {/* LEFT */}
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-3">
                              {branchEditMode ? (
                                <input
                                  value={branch.name}
                                  onChange={(e) => {
                                    setSettingsData({
                                      ...settingsData,
                                      branches:
                                        settingsData.branches.map(
                                          (b: any) =>
                                            b.id === branch.id
                                              ? {
                                                  ...b,
                                                  name:
                                                    e.target.value,
                                                }
                                              : b
                                        ),
                                    });
                                  }}
                                  className="rounded-xl border border-gray-300 px-4 py-2 text-lg font-semibold outline-none focus:border-red-500"
                                />
                              ) : (
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {branch.name}
                                </h3>
                              )}
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-medium ${
                                  branch.isDeleted
                                    ? "bg-red-100 text-red-700"
                                    : "bg-green-100 text-green-700"
                                }`}
                              >
                                {branch.isDeleted
                                  ? "INACTIVE"
                                  : "ACTIVE"}
                              </span>
                            </div>
                            {/* GRID */}
                            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                              {/* CITY */}
                              <div>
                                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                                  City
                                </p>
                                {branchEditMode ? (
                                  <input
                                    value={branch.city || ""}
                                    onChange={(e) => {
                                      setSettingsData({
                                        ...settingsData,
                                        branches:
                                          settingsData.branches.map(
                                            (b: any) =>
                                              b.id === branch.id
                                                ? {
                                                    ...b,
                                                    city:
                                                      e.target.value,
                                                  }
                                                : b
                                          ),
                                      });
                                    }}
                                    className="w-full rounded-xl border border-gray-300 px-4 py-2 outline-none focus:border-red-500"
                                  />
                                ) : (
                                  <p className="font-medium text-gray-900">
                                    {branch.city || "-"}
                                  </p>
                                )}
                              </div>
                              {/* PHONE */}
                              <div>
                                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                                  Phone
                                </p>
                                {branchEditMode ? (
                                  <input
                                    value={branch.phone || ""}
                                    onChange={(e) => {
                                      setSettingsData({
                                        ...settingsData,
                                        branches:
                                          settingsData.branches.map(
                                            (b: any) =>
                                              b.id === branch.id
                                                ? {
                                                    ...b,
                                                    phone:
                                                      e.target.value,
                                                  }
                                                : b
                                          ),
                                      });
                                    }}
                                    className="w-full rounded-xl border border-gray-300 px-4 py-2 outline-none focus:border-red-500"
                                  />
                                ) : (
                                  <p className="font-medium text-gray-900">
                                    {branch.phone || "-"}
                                  </p>
                                )}
                              </div>
                              {/* STATE */}
                              <div>
                                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                                  State
                                </p>
                                {branchEditMode ? (
                                  <input
                                    value={branch.state || ""}
                                    onChange={(e) => {
                                      setSettingsData({
                                        ...settingsData,
                                        branches:
                                          settingsData.branches.map(
                                            (b: any) =>
                                              b.id === branch.id
                                                ? {
                                                    ...b,
                                                    state:
                                                      e.target.value,
                                                  }
                                                : b
                                          ),
                                      });
                                    }}
                                    className="w-full rounded-xl border border-gray-300 px-4 py-2 outline-none focus:border-red-500"
                                  />
                                ) : (
                                  <p className="font-medium text-gray-900">
                                    {branch.state || "-"}
                                  </p>
                                )}
                              </div>
                              {/* PINCODE */}
                              <div>
                                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                                  Pincode
                                </p>
                                {branchEditMode ? (
                                  <input
                                    value={branch.pincode || ""}
                                    onChange={(e) => {
                                      setSettingsData({
                                        ...settingsData,
                                        branches:
                                          settingsData.branches.map(
                                            (b: any) =>
                                              b.id === branch.id
                                                ? {
                                                    ...b,
                                                    pincode:
                                                      e.target.value,
                                                  }
                                                : b
                                          ),
                                      });
                                    }}
                                    className="w-full rounded-xl border border-gray-300 px-4 py-2 outline-none focus:border-red-500"
                                  />
                                ) : (
                                  <p className="font-medium text-gray-900">
                                    {branch.pincode || "-"}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                          {/* ACTIONS */}
                          <div className="flex flex-wrap gap-3">
                            <button
                              onClick={() => {
                                setSettingsData({
                                  ...settingsData,
                                  branches:
                                    settingsData.branches.map(
                                      (b: any) =>
                                        b.id === branch.id
                                          ? {
                                              ...b,
                                              isDeleted:
                                                !b.isDeleted,
                                            }
                                          : b
                                    ),
                                });
                              }}
                              className={`rounded-xl px-4 py-2 text-sm font-medium text-white ${
                                branch.isDeleted
                                  ? "bg-green-600"
                                  : "bg-red-600"
                              }`}
                            >
                              {branch.isDeleted
                                ? "Reopen"
                                : "Close Branch"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}
          {/* ================= PASSWORD ================= */}
          {activeTab === "Password" && (
            <div className="space-y-8">
              {/* HEADER */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Password Settings
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Update your password and manage account security
                </p>
              </div>
              {/* FORM */}
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Current Password
                  </label>
                  <input
                    type="password"
                    readOnly={!passwordEditMode}
                    value={settingsData?.currentPassword || ""}
                    onChange={(e) =>
                      setSettingsData({
                        ...settingsData,
                        currentPassword:
                          e.target.value,
                      })
                    }
                    placeholder="Enter current password"
                    className={`w-full rounded-xl border px-4 py-3 outline-none ${
                      editMode
                        ? "border-red-300 bg-white focus:border-red-500"
                        : "border-gray-200 bg-gray-100"
                    }`}
                  />
                  </div>
                <div />
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    New Password
                  </label>
                  <input
                    type="password"
                    readOnly={!passwordEditMode}
                    value={settingsData?.newPassword || ""}
                    onChange={(e) =>
                      setSettingsData({
                        ...settingsData,
                        newPassword:
                          e.target.value,
                      })
                    }
                    placeholder="Enter new password"
                    className={`w-full rounded-xl border px-4 py-3 outline-none ${
                      editMode
                        ? "border-red-300 bg-white focus:border-red-500"
                        : "border-gray-200 bg-gray-100"
                    }`}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    readOnly={!passwordEditMode}
                    value={
                      settingsData?.confirmPassword || ""
                    }
                    onChange={(e) =>
                      setSettingsData({
                        ...settingsData,
                        confirmPassword:
                          e.target.value,
                      })
                    }
                    placeholder="Confirm new password"
                    className={`w-full rounded-xl border px-4 py-3 outline-none ${
                      editMode
                        ? "border-red-300 bg-white focus:border-red-500"
                        : "border-gray-200 bg-gray-100"
                    }`}
                  />
                </div>
              </div>
              {/* ACTIONS */}
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-200 p-5">
                <div>
                  <h3 className="font-medium text-gray-900">
                    Logout from all devices
                  </h3>
                  <p className="text-sm text-gray-500">
                    This will sign you out everywhere
                  </p>
                </div>
                <button className="rounded-xl border border-gray-200 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Logout All
                </button>
              </div>
              {/* SAVE */}
              <div className="flex justify-end gap-3">
                {passwordEditMode && (
                  <button
                    onClick={() => {
                      setPasswordEditMode(false);
                      setSettingsData({
                        ...settingsData,
                        currentPassword: "",
                        newPassword: "",
                        confirmPassword: "",
                      });
                    }}
                    className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                )}
                <button
                  onClick={() => {
                    if (passwordEditMode) {
                      handleUpdatePassword();
                    } else {
                      setPasswordEditMode(true);
                    }
                  }}
                  className={`rounded-xl px-5 py-3 text-sm font-medium text-white transition ${
                    passwordEditMode
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {passwordEditMode
                    ? "Save Password"
                    : "Update Password"}
                </button>
              </div>
            </div>
          )}
          {/* ================= NOTIFICATIONS ================= */}
          {activeTab === "Notifications" && (
            <div className="space-y-8">
              {/* HEADER */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Notification Settings
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Manage your alerts and notification preferences
                </p>
              </div>
              {/* OPTIONS */}
              <div className="space-y-4">
                {[
                  {
                    title:
                      "Email Notifications",
                    sub:
                      "Receive updates through email",
                  },
                  {
                    title:
                      "SMS Alerts",
                    sub:
                      "Receive SMS order alerts",
                  },
                  {
                    title:
                      "Subscription Reminders",
                    sub:
                      "Get notified before plan expiry",
                  },
                  {
                    title:
                      "Sound Notifications",
                    sub:
                      "Enable dashboard sound alerts",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="flex items-center justify-between rounded-2xl border border-gray-200 p-5"
                  >
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {item.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {item.sub}
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      readOnly={!editMode}
                      defaultChecked
                      className="size-5 accent-red-600"
                    />
                  </div>
                ))}
              </div>
              {/* SAVE */}
              <div className="flex justify-end">
                <button className="rounded-xl bg-red-600 px-6 py-3 text-sm font-medium text-white">
                  Save Preferences
                </button>
              </div>
            </div>
          )}
          {/* ================= PLAN ================= */}
          {activeTab === "Plan" && (
            <div className="space-y-8">
              {/* HEADER */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Subscription Plan
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Manage your current DineInk plan and billing
                </p>
              </div>
              {/* PLAN CARD */}
              <div className="rounded-2xl border border-gray-200 p-6">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-sm text-gray-500">
                      Current Plan
                    </p>
                    <h3 className="mt-1 text-3xl font-bold text-gray-900">
                      Professional Plan
                    </h3>
                    <p className="mt-3 text-sm text-gray-500">
                      Renewal Date:
                      <span className="ml-2 font-medium text-gray-900">
                        15 Aug 2026
                      </span>
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      Billing Cycle:
                      <span className="ml-2 font-medium text-gray-900">
                        Monthly
                      </span>
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50">
                      View Invoice
                    </button>
                    <button className="rounded-xl bg-red-600 px-5 py-3 text-sm font-medium text-white">
                      Upgrade Plan
                    </button>
                  </div>
                </div>
              </div>
              {/* USAGE */}
              <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                {[
                  {
                    label: "Branches",
                    value: "3 / 10",
                  },
                  {
                    label: "Staff Accounts",
                    value: "18 / 50",
                  },
                  {
                    label: "Monthly Orders",
                    value: "12,420",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-gray-200 p-5"
                  >
                    <p className="text-sm text-gray-500">
                      {item.label}
                    </p>
                    <h3 className="mt-2 text-2xl font-bold text-gray-900">
                      {item.value}
                    </h3>
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
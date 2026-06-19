import { useState, useEffect } from "react";
import { useAppSelector } from "../../store";
import {
  TruckIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  BanknotesIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";

const API_URL = import.meta.env.VITE_API_URL;

export default function Vendors() {
  const { user, token } = useAppSelector((s) => s.auth);
  const { selectedBranch } = useAppSelector((s) => s.branch);

  const [vendors, setVendors] = useState<any[]>([]);
  const [outstanding, setOutstanding] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // Modals
  const [vendorModal, setVendorModal] = useState<{ open: boolean; editing: any | null }>({ open: false, editing: null });
  const [paymentModal, setPaymentModal] = useState<{ open: boolean; vendor: any | null }>({ open: false, vendor: null });
  const [invoiceModal, setInvoiceModal] = useState<{ open: boolean; vendor: any | null }>({ open: false, vendor: null });
  const [detailModal, setDetailModal] = useState<{ open: boolean; vendor: any | null; payments: any[]; invoices: any[] }>({ open: false, vendor: null, payments: [], invoices: [] });

  // Forms
  const [vendorForm, setVendorForm] = useState({ name: "", address: "", phone: "", email: "" });
  const [paymentForm, setPaymentForm] = useState({ amount: "", paymentMethod: "CASH", paymentDate: new Date().toISOString().split("T")[0], notes: "" });
  const [invoiceForm, setInvoiceForm] = useState({ invoiceNumber: "", invoiceDate: new Date().toISOString().split("T")[0], dueDate: "", totalAmount: "", notes: "" });

  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const fetchVendors = async () => {
    if (!user?.restaurantId || !selectedBranch?.id) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/ingredients/${user.restaurantId}/${selectedBranch.id}/fetchVendors`, { headers });
      const data = await res.json();
      setVendors(data.data || []);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  };

  const fetchOutstanding = async () => {
    if (!user?.restaurantId || !selectedBranch?.id) return;
    try {
      const res = await fetch(`${API_URL}/api/vendors/outstanding/${user.restaurantId}/${selectedBranch.id}`, { headers });
      const data = await res.json();
      setOutstanding(data.data || []);
    } catch { /* silent */ }
  };

  useEffect(() => {
    fetchVendors();
    fetchOutstanding();
  }, [selectedBranch?.id]);

  const openVendorModal = (v?: any) => {
    setVendorForm(v ? { name: v.name, address: v.address || "", phone: v.phone || "", email: v.email || "" } : { name: "", address: "", phone: "", email: "" });
    setVendorModal({ open: true, editing: v ?? null });
  };

  const saveVendor = async () => {
    if (!vendorForm.name.trim() || !user?.restaurantId || !selectedBranch?.id) return;
    const url = vendorModal.editing
      ? `${API_URL}/api/ingredients/vendors/${vendorModal.editing.id}`
      : `${API_URL}/api/ingredients/vendors`;
    const method = vendorModal.editing ? "PUT" : "POST";
    await fetch(url, { method, headers, body: JSON.stringify({ ...vendorForm, restaurantId: user.restaurantId, branchId: selectedBranch.id }) });
    setVendorModal({ open: false, editing: null });
    fetchVendors();
    fetchOutstanding();
  };

  const deleteVendor = async (id: number) => {
    if (!confirm("Delete this vendor? This will also remove all ingredient links.")) return;
    await fetch(`${API_URL}/api/ingredients/vendors/${id}`, { method: "DELETE", headers });
    fetchVendors();
    fetchOutstanding();
  };

  const openDetailModal = async (vendor: any) => {
    try {
      const [pRes, iRes] = await Promise.all([
        fetch(`${API_URL}/api/vendors/${vendor.id}/payments`, { headers }),
        fetch(`${API_URL}/api/vendors/${vendor.id}/invoices`, { headers }),
      ]);
      const [pData, iData] = await Promise.all([pRes.json(), iRes.json()]);
      setDetailModal({ open: true, vendor, payments: pData.data || [], invoices: iData.data || [] });
    } catch { /* silent */ }
  };

  const recordPayment = async () => {
    if (!paymentForm.amount || !paymentModal.vendor || !user?.restaurantId || !selectedBranch?.id) return;
    await fetch(`${API_URL}/api/vendors/payments`, {
      method: "POST",
      headers,
      body: JSON.stringify({ vendorId: paymentModal.vendor.id, restaurantId: user.restaurantId, branchId: selectedBranch.id, ...paymentForm, amount: Number(paymentForm.amount), createdById: user.id }),
    });
    setPaymentModal({ open: false, vendor: null });
    setPaymentForm({ amount: "", paymentMethod: "CASH", paymentDate: new Date().toISOString().split("T")[0], notes: "" });
    fetchOutstanding();
  };

  const createInvoice = async () => {
    if (!invoiceForm.totalAmount || !invoiceModal.vendor || !user?.restaurantId || !selectedBranch?.id) return;
    await fetch(`${API_URL}/api/vendors/invoices`, {
      method: "POST",
      headers,
      body: JSON.stringify({ vendorId: invoiceModal.vendor.id, restaurantId: user.restaurantId, branchId: selectedBranch.id, ...invoiceForm, totalAmount: Number(invoiceForm.totalAmount), createdById: user.id }),
    });
    setInvoiceModal({ open: false, vendor: null });
    setInvoiceForm({ invoiceNumber: "", invoiceDate: new Date().toISOString().split("T")[0], dueDate: "", totalAmount: "", notes: "" });
    fetchOutstanding();
  };

  const payInvoice = async (invoiceId: number, remaining: number) => {
    const amt = prompt(`Pay how much? (Remaining: ₹${remaining})`);
    if (!amt || isNaN(Number(amt))) return;
    await fetch(`${API_URL}/api/vendors/invoices/${invoiceId}/pay`, { method: "PUT", headers, body: JSON.stringify({ amount: Number(amt) }) });
    if (detailModal.vendor) openDetailModal(detailModal.vendor);
    fetchOutstanding();
  };

  const totalOutstanding = outstanding.reduce((s, v) => s + (v.outstanding ?? 0), 0);
  const filtered = vendors.filter((v) => v.name.toLowerCase().includes(search.toLowerCase()) || (v.phone || "").includes(search));

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-3">

        {/* Header */}
        <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
          <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-red-100/50 blur-3xl" />
          <div className="relative z-10 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-pink-500 shadow-sm">
                <TruckIcon className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-gray-900">Vendor Management</h1>
                <p className="mt-0.5 text-[12px] text-gray-500">Manage suppliers, payments, and purchase invoices</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { label: "Vendors", value: vendors.length, cls: "border-blue-100 bg-blue-50", val: "text-blue-700", icon_bg: "bg-blue-100", icon_cls: "text-blue-600" },
                { label: "Outstanding", value: `₹${totalOutstanding.toLocaleString()}`, cls: "border-red-100 bg-red-50", val: "text-red-700", icon_bg: "bg-red-100", icon_cls: "text-red-600" },
              ].map((k) => (
                <div key={k.label} className={`flex items-center gap-2 rounded-xl border px-2.5 py-1.5 shadow-sm ${k.cls}`}>
                  <div>
                    <p className={`text-[8px] font-bold uppercase tracking-[0.12em] ${k.val} opacity-70`}>{k.label}</p>
                    <p className={`text-[13px] font-black leading-none ${k.val}`}>{k.value}</p>
                  </div>
                </div>
              ))}
              <button onClick={() => openVendorModal()} className="flex items-center gap-1.5 rounded-xl bg-red-500 px-3 py-2 text-[11px] font-bold text-white shadow-sm hover:bg-red-600 transition">
                <PlusIcon className="h-3.5 w-3.5" /> Add Vendor
              </button>
            </div>
          </div>
        </div>

        {/* Outstanding cards */}
        {outstanding.filter(v => v.outstanding > 0).length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 shadow-sm">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-amber-700">Outstanding Balances</p>
            <div className="flex flex-wrap gap-2">
              {outstanding.filter(v => v.outstanding > 0).map((v) => (
                <div key={v.id} className="flex items-center gap-2 rounded-xl border border-amber-200 bg-white px-3 py-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-[10px] font-black text-amber-700">
                    {v.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-gray-900">{v.name}</p>
                    <p className="text-[10px] text-red-600 font-semibold">₹{Number(v.outstanding).toLocaleString()} due</p>
                  </div>
                  <button onClick={() => setPaymentModal({ open: true, vendor: v })} className="ml-1 rounded-lg bg-emerald-500 px-2 py-1 text-[9px] font-bold text-white">Pay</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Vendor table */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-3 flex items-center justify-between">
            <div>
              <h2 className="text-[17px] font-bold text-gray-900">Vendors</h2>
              <p className="text-[11px] text-gray-500">{filtered.length} suppliers</p>
            </div>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              <input placeholder="Search vendors..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-64 rounded-xl border border-gray-200 bg-white pl-8 pr-3 text-[12px] outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100" />
            </div>
          </div>
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-red-500" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-[12px]">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {["Vendor", "Phone", "Address", "Email", "Outstanding", "Actions"].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length > 0 ? filtered.map((v) => {
                    const outs = outstanding.find((o) => o.id === v.id);
                    return (
                      <tr key={v.id} className="border-b border-gray-50 hover:bg-gray-50/60 transition">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-pink-500 text-[10px] font-bold text-white">
                              {v.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-semibold text-gray-900">{v.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{v.phone || "—"}</td>
                        <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">{v.address || "—"}</td>
                        <td className="px-4 py-3 text-gray-500">{v.email || "—"}</td>
                        <td className="px-4 py-3">
                          {outs?.outstanding > 0 ? (
                            <span className="inline-flex rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600">
                              ₹{Number(outs.outstanding).toLocaleString()}
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600">Clear</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button onClick={() => openDetailModal(v)} title="View details" className="flex h-7 w-7 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100">
                              <DocumentTextIcon className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => setInvoiceModal({ open: true, vendor: v })} title="Add invoice" className="flex h-7 w-7 items-center justify-center rounded-lg border border-violet-200 bg-violet-50 text-violet-600 hover:bg-violet-100">
                              <PlusIcon className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => setPaymentModal({ open: true, vendor: v })} title="Record payment" className="flex h-7 w-7 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100">
                              <BanknotesIcon className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => openVendorModal(v)} title="Edit" className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100">
                              <PencilSquareIcon className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => deleteVendor(v.id)} title="Delete" className="flex h-7 w-7 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-500 hover:bg-red-100">
                              <TrashIcon className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-[12px] text-gray-400">
                        {search ? "No vendors match your search" : "No vendors yet — click Add Vendor to get started"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Vendor Add/Edit Modal */}
      {vendorModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-black text-gray-900">{vendorModal.editing ? "Edit Vendor" : "Add Vendor"}</h3>
              <button onClick={() => setVendorModal({ open: false, editing: null })} className="text-gray-400 hover:text-gray-600"><XMarkIcon className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3">
              {[
                { label: "Vendor Name *", key: "name", placeholder: "e.g. Fresh Farms" },
                { label: "Phone", key: "phone", placeholder: "Contact number" },
                { label: "Email", key: "email", placeholder: "Email address" },
                { label: "Address", key: "address", placeholder: "Full address" },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="mb-1 block text-[11px] font-bold text-gray-600">{label}</label>
                  <input value={(vendorForm as any)[key]} onChange={(e) => setVendorForm((f) => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-[12px] outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100" />
                </div>
              ))}
            </div>
            <div className="mt-5 flex gap-2">
              <button onClick={() => setVendorModal({ open: false, editing: null })} className="flex-1 rounded-xl border border-gray-200 py-2 text-[12px] font-semibold text-gray-600">Cancel</button>
              <button onClick={saveVendor} disabled={!vendorForm.name.trim()} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-red-500 py-2 text-[12px] font-bold text-white disabled:opacity-40">
                <CheckIcon className="h-3.5 w-3.5" /> Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {paymentModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-black text-gray-900">Record Payment</h3>
              <button onClick={() => setPaymentModal({ open: false, vendor: null })} className="text-gray-400 hover:text-gray-600"><XMarkIcon className="h-5 w-5" /></button>
            </div>
            <p className="mb-3 text-[12px] text-gray-500">Paying to: <span className="font-bold text-gray-800">{paymentModal.vendor?.name}</span></p>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-[11px] font-bold text-gray-600">Amount (₹) *</label>
                <input type="number" value={paymentForm.amount} onChange={(e) => setPaymentForm((f) => ({ ...f, amount: e.target.value }))}
                  placeholder="0.00" className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-[12px] outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100" />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-bold text-gray-600">Payment Method</label>
                <select value={paymentForm.paymentMethod} onChange={(e) => setPaymentForm((f) => ({ ...f, paymentMethod: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-[12px] outline-none focus:border-red-400">
                  {["CASH", "BANK_TRANSFER", "CHEQUE", "UPI", "OTHER"].map((m) => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-bold text-gray-600">Payment Date</label>
                <input type="date" value={paymentForm.paymentDate} onChange={(e) => setPaymentForm((f) => ({ ...f, paymentDate: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-[12px] outline-none focus:border-red-400" />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-bold text-gray-600">Notes</label>
                <input value={paymentForm.notes} onChange={(e) => setPaymentForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Optional notes" className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-[12px] outline-none focus:border-red-400" />
              </div>
            </div>
            <div className="mt-5 flex gap-2">
              <button onClick={() => setPaymentModal({ open: false, vendor: null })} className="flex-1 rounded-xl border border-gray-200 py-2 text-[12px] font-semibold text-gray-600">Cancel</button>
              <button onClick={recordPayment} disabled={!paymentForm.amount} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-500 py-2 text-[12px] font-bold text-white disabled:opacity-40">
                <BanknotesIcon className="h-3.5 w-3.5" /> Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Invoice Modal */}
      {invoiceModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-black text-gray-900">Add Purchase Invoice</h3>
              <button onClick={() => setInvoiceModal({ open: false, vendor: null })} className="text-gray-400 hover:text-gray-600"><XMarkIcon className="h-5 w-5" /></button>
            </div>
            <p className="mb-3 text-[12px] text-gray-500">Vendor: <span className="font-bold text-gray-800">{invoiceModal.vendor?.name}</span></p>
            <div className="space-y-3">
              {[
                { label: "Invoice Number", key: "invoiceNumber", placeholder: "INV-001", type: "text" },
                { label: "Invoice Date", key: "invoiceDate", placeholder: "", type: "date" },
                { label: "Due Date", key: "dueDate", placeholder: "", type: "date" },
                { label: "Total Amount (₹) *", key: "totalAmount", placeholder: "0.00", type: "number" },
                { label: "Notes", key: "notes", placeholder: "Items purchased...", type: "text" },
              ].map(({ label, key, placeholder, type }) => (
                <div key={key}>
                  <label className="mb-1 block text-[11px] font-bold text-gray-600">{label}</label>
                  <input type={type} value={(invoiceForm as any)[key]} onChange={(e) => setInvoiceForm((f) => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-[12px] outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100" />
                </div>
              ))}
            </div>
            <div className="mt-5 flex gap-2">
              <button onClick={() => setInvoiceModal({ open: false, vendor: null })} className="flex-1 rounded-xl border border-gray-200 py-2 text-[12px] font-semibold text-gray-600">Cancel</button>
              <button onClick={createInvoice} disabled={!invoiceForm.totalAmount} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-violet-500 py-2 text-[12px] font-bold text-white disabled:opacity-40">
                <DocumentTextIcon className="h-3.5 w-3.5" /> Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vendor Detail Modal */}
      {detailModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-black text-gray-900">{detailModal.vendor?.name}</h3>
              <button onClick={() => setDetailModal({ open: false, vendor: null, payments: [], invoices: [] })} className="text-gray-400 hover:text-gray-600"><XMarkIcon className="h-5 w-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {/* Payments */}
              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-gray-500">Payments</p>
                {detailModal.payments.length === 0 ? (
                  <p className="text-[11px] text-gray-400">No payments recorded</p>
                ) : (
                  <div className="space-y-1.5">
                    {detailModal.payments.map((p) => (
                      <div key={p.id} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                        <div className="flex justify-between">
                          <span className="text-[11px] font-bold text-emerald-600">₹{Number(p.amount).toLocaleString()}</span>
                          <span className="text-[10px] text-gray-400">{new Date(p.paymentDate).toLocaleDateString("en-IN")}</span>
                        </div>
                        <p className="text-[10px] text-gray-500">{p.paymentMethod} {p.notes ? `· ${p.notes}` : ""}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* Invoices */}
              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-gray-500">Invoices</p>
                {detailModal.invoices.length === 0 ? (
                  <p className="text-[11px] text-gray-400">No invoices recorded</p>
                ) : (
                  <div className="space-y-1.5">
                    {detailModal.invoices.map((i) => (
                      <div key={i.id} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-gray-800">{i.invoiceNumber || `INV-${i.id}`}</span>
                          <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${i.status === "PAID" ? "bg-emerald-100 text-emerald-700" : i.status === "PARTIAL" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>{i.status}</span>
                        </div>
                        <div className="flex justify-between mt-0.5">
                          <span className="text-[10px] text-gray-500">₹{Number(i.totalAmount).toLocaleString()} · Paid ₹{Number(i.paidAmount).toLocaleString()}</span>
                          {i.status !== "PAID" && (
                            <button onClick={() => payInvoice(i.id, i.totalAmount - i.paidAmount)} className="text-[9px] font-bold text-emerald-600 underline">Pay</button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

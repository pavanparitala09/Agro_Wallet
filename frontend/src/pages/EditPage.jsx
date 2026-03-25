import { useEffect, useState } from "react";
import { api } from "../lib/api.js";

export function EditPage() {
  const [bills, setBills] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [originalForm, setOriginalForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editImageFile, setEditImageFile] = useState(null);

  useEffect(() => {
    loadBills();
  }, []);

  async function loadBills() {
    setLoading(true);
    try {
      const res = await api.get("/bills");
      const billsData = res.data || [];
      //console.log("Bills loaded from API:", billsData.length, "bills");
      const billsWithImages = billsData.filter((b) => b.imageUrl);
      setBills(billsData);
    } finally {
      setLoading(false);
    }
  }

  function startEdit(bill) {
    //console.log("Starting edit for bill:", bill);
    const formData = {
      title: bill.title,
      amount: bill.amount,
      billDate: bill.billDate ? bill.billDate.slice(0, 10) : "",
      status: bill.status,
      paidAmount: bill.paidAmount != null ? String(bill.paidAmount) : "",
      vendorName: bill.vendorName || "",
      notes: bill.notes || "",
      imageUrl: bill.imageUrl || "",
      interestEnabled: bill.interestEnabled || false,
      interestType: bill.interestType || "simple",
      interestFrequency: bill.interestFrequency || "monthly",
      interestRate: bill.interestRate != null ? String(bill.interestRate) : "",
      interestStartDate: bill.interestStartDate
        ? bill.interestStartDate.slice(0, 10)
        : "",
    };
    setEditingId(bill._id);
    setEditForm(formData);
    setOriginalForm(JSON.parse(JSON.stringify(formData)));
  }

  function hasChanges() {
    return (
      JSON.stringify(editForm) !== JSON.stringify(originalForm) || editImageFile
    );
  }

  function updateField(field, value) {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  }

  async function saveEdit(id) {
    setSaving(true);
    try {
      const data = new FormData();

      // Append all form fields
      data.append("title", editForm.title);
      data.append("amount", editForm.amount);
      data.append("billDate", editForm.billDate);
      data.append("status", editForm.status);
      if (editForm.status === "partial_paid") {
        data.append("paidAmount", editForm.paidAmount);
      }
      data.append("vendorName", editForm.vendorName);
      data.append("notes", editForm.notes);

      // Append interest fields
      data.append("interestEnabled", editForm.interestEnabled);
      data.append("interestType", editForm.interestType);
      data.append("interestFrequency", editForm.interestFrequency);
      data.append("interestRate", editForm.interestRate);
      data.append("interestStartDate", editForm.interestStartDate);

      // Append image file if selected, otherwise keep existing image URL
      if (editImageFile) {
        data.append("image", editImageFile);
      } else if (editForm.imageUrl) {
        // Preserve existing image URL when no new file is selected
        data.append("existingImageUrl", editForm.imageUrl);
      }

      await api.put(`/bills/${id}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setEditingId(null);
      setEditImageFile(null);
      await loadBills();
    } finally {
      setSaving(false);
    }
  }

  async function markAsPaid(id) {
    await api.patch(`/bills/${id}/mark-paid`);
    await loadBills();
  }

  async function markAsUnpaid(id) {
    await api.patch(`/bills/${id}/mark-unpaid`);
    await loadBills();
  }

  async function deleteBill(id) {
    if (
      !window.confirm(
        "Are you sure you want to delete this bill? This cannot be undone.",
      )
    )
      return;
    await api.delete(`/bills/${id}`);
    setEditingId(null);
    await loadBills();
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border-2 border-primary-700 bg-white p-5 md:p-6 shadow-lg">
        <h2 className="text-2xl md:text-3xl font-black text-slate-700">
          ✏️ Edit Entries
        </h2>
        <p className="text-base font-semibold text-slate-800 mt-2">
          Recently created bills with edit history badges.
        </p>
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm">
        {loading && (
          <div className="py-6 text-center text-xs text-slate-400">
            Loading bills…
          </div>
        )}
        {!loading && bills.length === 0 && (
          <div className="py-6 text-center text-xs text-slate-400">
            No bills yet.
          </div>
        )}

        <div className="space-y-2">
          {bills.map((b) => {
            const isEditing = editingId === b._id;
            return (
              <div
                key={b._id}
                className={`space-y-2 rounded-lg border-2 p-3 text-xs text-slate-800 ${
                  isEditing
                    ? "border-primary-500 bg-primary-50/30"
                    : "border-slate-200 bg-slate-50/60"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{b.title}</span>
                    {b.edited && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                        Edited
                      </span>
                    )}
                    <span
                      className={
                        "rounded-full px-2 py-0.5 text-[10px] font-semibold " +
                        (b.status === "paid"
                          ? "bg-emerald-100 text-emerald-700"
                          : b.status === "partial_paid"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-rose-100 text-rose-700")
                      }
                    >
                      {b.status === "paid"
                        ? "Paid"
                        : b.status === "partial_paid"
                          ? "Partial Paid"
                          : "Unpaid"}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Created{" "}
                    {b.createdAt
                      ? new Date(b.createdAt).toISOString().slice(0, 10)
                      : "-"}
                    {b.editedAt && (
                      <span>
                        {" "}
                        · Edited{" "}
                        {new Date(b.editedAt).toISOString().slice(0, 10)}
                      </span>
                    )}
                  </div>
                </div>

                {isEditing ? (
                  <div className="grid gap-2 sm:grid-cols-4">
                    <Input
                      label="Title"
                      value={editForm.title}
                      onChange={(v) => updateField("title", v)}
                    />
                    <Input
                      label="Amount"
                      type="number"
                      value={editForm.amount}
                      onChange={(v) => updateField("amount", v)}
                    />
                    <Input
                      label="Bill Date"
                      type="date"
                      value={editForm.billDate}
                      onChange={(v) => updateField("billDate", v)}
                    />
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-medium text-slate-700">
                        Status
                      </label>
                      <select
                        value={editForm.status}
                        onChange={(e) => updateField("status", e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                      >
                        <option value="unpaid">Unpaid</option>
                        <option value="partial_paid">Partial Paid</option>
                        <option value="paid">Paid</option>
                      </select>
                    </div>
                    {editForm.status === "partial_paid" && (
                      <Input
                        label="Amount paid (₹)"
                        type="number"
                        value={editForm.paidAmount}
                        onChange={(v) => updateField("paidAmount", v)}
                      />
                    )}
                    <Input
                      label="Vendor"
                      value={editForm.vendorName}
                      onChange={(v) => updateField("vendorName", v)}
                    />
                    <div className="sm:col-span-3">
                      <Input
                        label="Notes"
                        value={editForm.notes}
                        onChange={(v) => updateField("notes", v)}
                      />
                    </div>

                    {/* Interest Section */}
                    <div className="sm:col-span-4">
                      <div className="rounded-lg border border-dashed border-primary-200 bg-primary-50/40 p-3">
                        <label className="flex items-center gap-2 text-xs font-semibold text-primary-800">
                          <input
                            type="checkbox"
                            checked={editForm.interestEnabled}
                            onChange={(e) =>
                              updateField("interestEnabled", e.target.checked)
                            }
                            className="h-3.5 w-3.5 rounded border-primary-400 text-primary-600"
                          />
                          Enable Interest
                        </label>

                        {editForm.interestEnabled && (
                          <div className="mt-2 grid gap-2 sm:grid-cols-4">
                            <div className="space-y-1">
                              <label className="block text-[10px] font-medium text-primary-900">
                                Type
                              </label>
                              <select
                                value={editForm.interestType}
                                onChange={(e) =>
                                  updateField("interestType", e.target.value)
                                }
                                className="w-full rounded-lg border border-primary-300 bg-white px-2 py-1.5 text-xs"
                              >
                                <option value="simple">Simple</option>
                                <option value="compound">Compound</option>
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="block text-[10px] font-medium text-primary-900">
                                Frequency
                              </label>
                              <select
                                value={editForm.interestFrequency}
                                onChange={(e) =>
                                  updateField(
                                    "interestFrequency",
                                    e.target.value,
                                  )
                                }
                                className="w-full rounded-lg border border-primary-300 bg-white px-2 py-1.5 text-xs"
                              >
                                <option value="daily">Daily</option>
                                <option value="monthly">Monthly</option>
                                <option value="yearly">Yearly</option>
                              </select>
                            </div>
                            <Input
                              label="Rate (%)"
                              type="number"
                              value={editForm.interestRate}
                              onChange={(v) => updateField("interestRate", v)}
                            />
                            <Input
                              label="Start Date"
                              type="date"
                              value={editForm.interestStartDate}
                              onChange={(v) =>
                                updateField("interestStartDate", v)
                              }
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Image Upload Section */}
                    <div className="sm:col-span-4">
                      <div className="space-y-2">
                        <label className="block text-xs font-medium text-slate-700">
                          Bill Image
                        </label>
                        {editImageFile ? (
                          <div className="flex gap-2 items-center">
                            <img
                              src={URL.createObjectURL(editImageFile)}
                              alt="New Bill"
                              className="h-16 w-16 rounded-lg object-cover border border-slate-200"
                            />
                            <span className="text-xs text-slate-500">
                              New image to upload
                            </span>
                          </div>
                        ) : editForm.imageUrl ? (
                          <div className="flex gap-2 items-center">
                            <img
                              src={editForm.imageUrl}
                              alt="Bill"
                              className="h-16 w-16 rounded-lg object-cover border border-slate-200"
                              onError={(e) => {
                                e.target.style.display = "none";
                              }}
                            />
                            <span className="text-xs text-slate-500">
                              Current image
                            </span>
                          </div>
                        ) : (
                          <div className="py-3 px-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 text-center">
                            <p className="text-xs text-slate-500">
                              No image attached. Upload one below to add.
                            </p>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            setEditImageFile(e.target.files?.[0] || null)
                          }
                          className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border file:border-slate-200 file:bg-slate-50 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-slate-700"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-4 flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(null);
                          setEditImageFile(null);
                        }}
                        disabled={saving}
                        className="cursor-pointer rounded-lg bg-slate-100 px-3 py-1.5 text-[11px] font-medium text-slate-700 hover:bg-slate-200 disabled:opacity-50 disabled:hover:bg-slate-100"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => saveEdit(b._id)}
                        disabled={saving || !hasChanges()}
                        className="cursor-pointer rounded-lg bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-slate-800 disabled:opacity-60 disabled:hover:bg-slate-900 disabled:cursor-not-allowed flex items-center gap-1.5"
                      >
                        {saving ? (
                          <>
                            <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                            Saving...
                          </>
                        ) : (
                          "Save"
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                      <div className="space-y-0.5">
                        <div>
                          Section:{" "}
                          <span className="font-medium">
                            {b.sectionId?.sectionName || "—"}
                          </span>
                        </div>
                        <div className="text-slate-500">
                          Vendor: {b.vendorName || "—"} · Notes:{" "}
                          {b.notes || "—"}
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end gap-2">
                        <div className="font-semibold text-slate-900">
                          ₹{(b.amount || 0).toFixed(2)}
                        </div>
                        <div className="flex flex-wrap gap-2 justify-end">
                          <button
                            type="button"
                            onClick={() => startEdit(b)}
                            className="cursor-pointer rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-slate-700 transition-colors"
                          >
                            Edit
                          </button>
                          {(b.status === "unpaid" ||
                            b.status === "partial_paid") && (
                            <button
                              type="button"
                              onClick={() => markAsPaid(b._id)}
                              className="cursor-pointer rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-emerald-500 transition-colors"
                            >
                              Mark as Paid
                            </button>
                          )}
                          {b.status === "paid" && (
                            <button
                              type="button"
                              onClick={() => markAsUnpaid(b._id)}
                              className="cursor-pointer rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-amber-500 transition-colors"
                            >
                              Mark as Unpaid
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => deleteBill(b._id)}
                            className="cursor-pointer rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-red-500 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Image and Interest Display */}
                    <div className="flex flex-wrap gap-4 border-t border-slate-200 pt-2">
                      {b.imageUrl && (
                        <div className="flex items-center gap-2">
                          <img
                            src={b.imageUrl}
                            alt="Bill"
                            className="h-20 w-20 rounded-lg object-cover border border-slate-200"
                          />
                          <div className="text-[10px]">
                            <p className="text-slate-600 font-medium">
                              Bill Image
                            </p>
                            <a
                              href={b.imageUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="cursor-pointer text-primary-600 hover:text-primary-700 underline"
                            >
                              View Full Size
                            </a>
                          </div>
                        </div>
                      )}

                      {b.interestEnabled && (
                        <div className="text-[10px] space-y-0.5">
                          <p className="text-slate-600 font-medium">
                            Interest Details
                          </p>
                          <div className="text-slate-700">
                            <p>
                              Type:{" "}
                              <span className="font-semibold">
                                {b.interestType}
                              </span>
                            </p>
                            <p>
                              Frequency:{" "}
                              <span className="font-semibold">
                                {b.interestFrequency}
                              </span>
                            </p>
                            <p>
                              Rate:{" "}
                              <span className="font-semibold">
                                {b.interestRate}%
                              </span>
                            </p>
                            {b.interestStartDate && (
                              <p>
                                Start:{" "}
                                <span className="font-semibold">
                                  {new Date(b.interestStartDate)
                                    .toISOString()
                                    .slice(0, 10)}
                                </span>
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type = "text" }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[10px] font-medium text-slate-700">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
      />
    </div>
  );
}

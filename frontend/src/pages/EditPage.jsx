import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';

export function EditPage() {
  const [bills, setBills] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadBills();
  }, []);

  async function loadBills() {
    setLoading(true);
    try {
      const res = await api.get('/bills');
      setBills(res.data || []);
    } finally {
      setLoading(false);
    }
  }

  function startEdit(bill) {
    setEditingId(bill._id);
    setEditForm({
      title: bill.title,
      amount: bill.amount,
      billDate: bill.billDate ? bill.billDate.slice(0, 10) : '',
      status: bill.status,
      paidAmount: bill.paidAmount != null ? String(bill.paidAmount) : '',
      vendorName: bill.vendorName || '',
      notes: bill.notes || ''
    });
  }

  function updateField(field, value) {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  }

  async function saveEdit(id) {
    await api.put(`/bills/${id}`, editForm);
    setEditingId(null);
    await loadBills();
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
    if (!window.confirm('Are you sure you want to delete this bill? This cannot be undone.')) return;
    await api.delete(`/bills/${id}`);
    setEditingId(null);
    await loadBills();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Edit Entries</h2>
          <p className="text-xs text-slate-500">
            Recently created bills with edit history badges.
          </p>
        </div>
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
                className="space-y-2 rounded-lg border border-slate-100 bg-slate-50/60 p-3 text-xs text-slate-800"
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
                        'rounded-full px-2 py-0.5 text-[10px] font-semibold ' +
                        (b.status === 'paid'
                          ? 'bg-emerald-100 text-emerald-700'
                          : b.status === 'partial_paid'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-rose-100 text-rose-700')
                      }
                    >
                      {b.status === 'paid' ? 'Paid' : b.status === 'partial_paid' ? 'Partial Paid' : 'Unpaid'}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Created{' '}
                    {b.createdAt
                      ? new Date(b.createdAt).toISOString().slice(0, 10)
                      : '-'}
                    {b.editedAt && (
                      <span>
                        {' '}
                        · Edited{' '}
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
                      onChange={(v) => updateField('title', v)}
                    />
                    <Input
                      label="Amount"
                      type="number"
                      value={editForm.amount}
                      onChange={(v) => updateField('amount', v)}
                    />
                    <Input
                      label="Bill Date"
                      type="date"
                      value={editForm.billDate}
                      onChange={(v) => updateField('billDate', v)}
                    />
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-medium text-slate-700">
                        Status
                      </label>
                      <select
                        value={editForm.status}
                        onChange={(e) =>
                          updateField('status', e.target.value)
                        }
                        className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                      >
                        <option value="unpaid">Unpaid</option>
                        <option value="partial_paid">Partial Paid</option>
                        <option value="paid">Paid</option>
                      </select>
                    </div>
                    {editForm.status === 'partial_paid' && (
                      <Input
                        label="Amount paid (₹)"
                        type="number"
                        value={editForm.paidAmount}
                        onChange={(v) => updateField('paidAmount', v)}
                      />
                    )}
                    <Input
                      label="Vendor"
                      value={editForm.vendorName}
                      onChange={(v) => updateField('vendorName', v)}
                    />
                    <div className="sm:col-span-3">
                      <Input
                        label="Notes"
                        value={editForm.notes}
                        onChange={(v) => updateField('notes', v)}
                      />
                    </div>
                    <div className="sm:col-span-4 flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="rounded-lg bg-slate-100 px-3 py-1.5 text-[11px] font-medium text-slate-700 hover:bg-slate-200"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => saveEdit(b._id)}
                        className="rounded-lg bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-slate-800"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                    <div className="space-y-0.5">
                      <div>
                        Section:{' '}
                        <span className="font-medium">
                          {b.sectionId?.sectionName || '—'}
                        </span>
                      </div>
                      <div className="text-slate-500">
                        Vendor: {b.vendorName || '—'} · Notes:{' '}
                        {b.notes || '—'}
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
                          className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-slate-700"
                        >
                          Edit
                        </button>
                        {(b.status === 'unpaid' || b.status === 'partial_paid') && (
                          <button
                            type="button"
                            onClick={() => markAsPaid(b._id)}
                            className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-emerald-500"
                          >
                            Mark as Paid
                          </button>
                        )}
                        {b.status === 'paid' && (
                          <button
                            type="button"
                            onClick={() => markAsUnpaid(b._id)}
                            className="rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-amber-500"
                          >
                            Mark as Unpaid
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => deleteBill(b._id)}
                          className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-red-500"
                        >
                          Delete
                        </button>
                      </div>
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

function Input({ label, value, onChange, type = 'text' }) {
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


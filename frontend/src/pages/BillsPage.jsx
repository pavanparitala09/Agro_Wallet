import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function BillsPage() {
  const [sections, setSections] = useState([]);
  const [bills, setBills] = useState([]);
  const [form, setForm] = useState(() => {
    const t = today();
    return {
      sectionId: '',
      title: '',
      amount: '',
      billDate: t,
      status: 'unpaid',
      paidAmount: '',
      vendorName: '',
      notes: '',
      interestEnabled: false,
      interestType: 'simple',
      interestFrequency: 'monthly',
      interestRate: '',
      interestStartDate: t
    };
  });
  const [newSectionName, setNewSectionName] = useState('');
  const [addingSection, setAddingSection] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const showError = (field) => {
    if (!submitAttempted) return false;
    if (field === 'amount') return !form.amount && form.amount !== 0;
    if (field === 'billDate') return !form.billDate;
    if (field === 'status') return !form.status;
    if (field === 'interestRate') return form.interestEnabled && (form.interestRate === '' || form.interestRate == null);
    return false;
  };

  useEffect(() => {
    async function loadInitial() {
      try {
        const [sectionsRes, billsRes] = await Promise.all([
          api.get('/sections'),
          api.get('/bills')
        ]);
        setSections(sectionsRes.data || []);
        setBills(billsRes.data || []);
      } catch (_) {
        setSections([]);
        setBills([]);
      }
    }
    loadInitial();
  }, []);

  async function loadBills() {
    try {
      const res = await api.get('/bills');
      setBills(res.data || []);
    } catch (_) {
      setBills([]);
    }
  }

  async function loadSections() {
    try {
      const res = await api.get('/sections');
      setSections(res.data || []);
    } catch (_) {
      setSections([]);
    }
  }

  async function handleAddSection(e) {
    e.preventDefault();
    const name = newSectionName.trim();
    if (!name) return;
    setAddingSection(true);
    try {
      const res = await api.post('/sections', { sectionName: name });
      await loadSections();
      setForm((prev) => ({ ...prev, sectionId: res.data._id }));
      setNewSectionName('');
    } catch (_) {
      // error could be shown in UI
    } finally {
      setAddingSection(false);
    }
  }

  function updateForm(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleCreateBill(e) {
    e.preventDefault();
    setSubmitAttempted(true);

    const amountInvalid = !form.amount && form.amount !== 0;
    const billDateInvalid = !form.billDate;
    const statusInvalid = !form.status;
    const interestRateInvalid = form.interestEnabled && (form.interestRate === '' || form.interestRate == null);
    if (amountInvalid || billDateInvalid || statusInvalid || interestRateInvalid) {
      return;
    }
    if (!form.sectionId || form.sectionId === '__new__') return;

    setSubmitting(true);
    try {
      const data = new FormData();
      data.append('sectionId', form.sectionId);
      data.append('title', form.title);
      data.append('amount', form.amount);
      data.append('billDate', form.billDate);
      data.append('status', form.status);
      if (form.status === 'partial_paid' && form.paidAmount !== '') {
        data.append('paidAmount', form.paidAmount);
      }
      if (form.vendorName) data.append('vendorName', form.vendorName);
      if (form.notes) data.append('notes', form.notes);
      if (form.interestEnabled) {
        data.append('interestEnabled', 'true');
        data.append('interestType', form.interestType);
        data.append('interestFrequency', form.interestFrequency);
        if (form.interestRate) data.append('interestRate', form.interestRate);
        if (form.interestStartDate) {
          data.append('interestStartDate', form.interestStartDate);
        }
      }
      if (imageFile) {
        data.append('image', imageFile);
      }

      await api.post('/bills', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSubmitAttempted(false);
      setForm((prev) => ({
        ...prev,
        title: '',
        amount: '',
        billDate: today(),
        vendorName: '',
        notes: '',
        interestRate: '',
        interestStartDate: today(),
        paidAmount: ''
      }));
      setImageFile(null);
      await loadBills();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Add Bills</h2>
        <p className="text-xs text-slate-500">
          Create new bills, set interest and track credit entries.
        </p>
      </div>

      {/* Create new bill form + list */}
      <div className="grid gap-4 lg:grid-cols-[1.1fr_minmax(0,1fr)]">
        <form
          onSubmit={handleCreateBill}
          className="space-y-3 rounded-xl bg-white p-4 shadow-sm"
        >
          <h3 className="text-sm font-semibold text-slate-900">
            Create New Bill
          </h3>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700">
                Section
              </label>
              <select
                required={form.sectionId !== '__new__'}
                value={form.sectionId}
                onChange={(e) => updateForm('sectionId', e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              >
                <option value="">Select section</option>
                {sections.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.sectionName}
                  </option>
                ))}
                <option value="__new__">+ Create new section</option>
              </select>
              {form.sectionId === '__new__' && (
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={newSectionName}
                    onChange={(e) => setNewSectionName(e.target.value)}
                    placeholder="New section name"
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddSection}
                    disabled={addingSection || !newSectionName.trim()}
                    className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {addingSection ? 'Adding…' : 'Add'}
                  </button>
                </div>
              )}
            </div>

            <TextInput
              label="Title"
              required
              value={form.title}
              onChange={(v) => updateForm('title', v)}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <TextInput
              label="Amount (Principal)"
              type="number"
              required
              value={form.amount}
              onChange={(v) => updateForm('amount', v)}
              error={showError('amount')}
            />
            <TextInput
              label="Bill Date"
              type="date"
              required
              value={form.billDate}
              onChange={(v) => updateForm('billDate', v)}
              error={showError('billDate')}
            />
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) => updateForm('status', e.target.value)}
                className={
                  'w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 ' +
                  (showError('status')
                    ? 'border-red-500 bg-red-50/50 focus:border-red-500 focus:ring-red-200'
                    : 'border-slate-200 focus:border-primary-500 focus:ring-primary-500')
                }
              >
                <option value="unpaid">Unpaid</option>
                <option value="partial_paid">Partial Paid</option>
                <option value="paid">Paid</option>
              </select>
            </div>
          </div>

          {form.status === 'partial_paid' && (
            <TextInput
              label="Amount paid (₹)"
              type="number"
              required
              value={form.paidAmount}
              onChange={(v) => updateForm('paidAmount', v)}
              placeholder="0"
            />
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <TextInput
              label="Vendor Name (optional)"
              value={form.vendorName}
              onChange={(v) => updateForm('vendorName', v)}
            />
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700">
                Bill Image (optional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border file:border-slate-200 file:bg-slate-50 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-slate-700 hover:file:bg-slate-100"
              />
              <p className="text-[10px] text-slate-400">
                Max size 5MB. Stored locally in development.
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-700">
              Notes (optional)
            </label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => updateForm('notes', e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              placeholder="Any remarks about this bill…"
            />
          </div>

          {/* Interest section */}
          <div className="mt-2 rounded-lg border border-dashed border-primary-200 bg-primary-50/40 p-3">
            <div className="flex items-center justify-between gap-2">
              <label className="flex items-center gap-2 text-xs font-semibold text-primary-800">
                <input
                  type="checkbox"
                  checked={form.interestEnabled}
                  onChange={(e) =>
                    updateForm('interestEnabled', e.target.checked)
                  }
                  className="h-3.5 w-3.5 rounded border-primary-400 text-primary-600 focus:ring-primary-500"
                />
                Enable Interest
              </label>
              <span className="text-[10px] text-primary-700">
                Simple/compound · Daily/Monthly
              </span>
            </div>

            {form.interestEnabled && (
              <div className="mt-2 grid gap-2 sm:grid-cols-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-medium text-primary-900">
                    Type
                  </label>
                  <select
                    value={form.interestType}
                    onChange={(e) =>
                      updateForm('interestType', e.target.value)
                    }
                    className="w-full rounded-lg border border-primary-100 bg-white px-2 py-1.5 text-xs outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
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
                    value={form.interestFrequency}
                    onChange={(e) =>
                      updateForm('interestFrequency', e.target.value)
                    }
                    className="w-full rounded-lg border border-primary-100 bg-white px-2 py-1.5 text-xs outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  >
                    <option value="daily">Daily</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <TextInput
                  label="Rate % per period"
                  type="number"
                  value={form.interestRate}
                  onChange={(v) => updateForm('interestRate', v)}
                  error={showError('interestRate')}
                />
                <TextInput
                  label="Start Date"
                  type="date"
                  value={form.interestStartDate}
                  onChange={(v) => updateForm('interestStartDate', v)}
                />
              </div>
            )}
          </div>

          <div className="pt-1">
            <button
              type="submit"
              disabled={submitting || !form.sectionId || form.sectionId === '__new__'}
              className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-slate-800 disabled:opacity-60"
            >
              {submitting ? 'Saving…' : 'Save Bill'}
            </button>
          </div>
        </form>

        {/* Bills list */}
        <div className="space-y-2 rounded-xl bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">
            Bills ({bills.length})
          </h3>
          <div className="max-h-[480px] space-y-2 overflow-y-auto pr-1">
            {bills.length === 0 && (
              <p className="py-6 text-center text-xs text-slate-400">
                No bills yet. Create your first entry.
              </p>
            )}
            {bills.map((b) => (
              <div
                key={b._id}
                className="flex flex-col gap-1 rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2 text-xs text-slate-800"
              >
                <div className="flex items-center justify-between">
                  <div className="font-semibold">{b.title}</div>
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
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <div className="space-x-2">
                    <span className="font-semibold text-slate-900">
                      {b.status === 'partial_paid' && b.amountDue != null
                        ? `₹${Number(b.amountDue).toFixed(2)} due`
                        : `₹${(b.totalPayable || b.amount || 0).toFixed(2)}`}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Principal ₹{(b.amount || 0).toFixed(2)}
                      {b.status === 'partial_paid' && b.paidAmount > 0 && (
                        <> · Paid ₹{Number(b.paidAmount).toFixed(2)}</>
                      )}
                      {' · '}Interest ₹{(b.calculatedInterest || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {b.sectionId?.sectionName && (
                      <span className="mr-2">
                        {b.sectionId.sectionName}
                      </span>
                    )}
                    {b.vendorName && <span>• {b.vendorName}</span>}
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] text-slate-500">
                  <span>
                    Bill:{' '}
                    {b.billDate
                      ? new Date(b.billDate).toISOString().slice(0, 10)
                      : '-'}
                  </span>
                  {b.imageUrl && (
                    <a
                      href={b.imageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-700 hover:bg-slate-300"
                    >
                      View Image
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TextInput({
  label,
  value,
  onChange,
  type = 'text',
  required,
  placeholder,
  error
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-slate-700">
        {label}
      </label>
      <input
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={
          'w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 ' +
          (error
            ? 'border-red-500 bg-red-50/50 focus:border-red-500 focus:ring-red-200'
            : 'border-slate-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500')
        }
      />
    </div>
  );
}


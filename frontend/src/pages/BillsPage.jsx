import { useEffect, useState } from "react";
import { api } from "../lib/api.js";
import { Toast } from "../components/Toast.jsx";
import { useTranslation } from "react-i18next";

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function BillsPage() {
  const { t } = useTranslation();
  const [sections, setSections] = useState([]);
  const [bills, setBills] = useState([]);
  const [form, setForm] = useState(() => {
    const t = today();
    return {
      sectionId: "",
      title: "",
      amount: "",
      billDate: t,
      status: "unpaid",
      paidAmount: "",
      vendorName: "",
      notes: "",
      interestEnabled: false,
      interestType: "simple",
      interestFrequency: "monthly",
      interestRate: "",
      interestStartDate: t,
    };
  });
  const [newSectionName, setNewSectionName] = useState("");
  const [addingSection, setAddingSection] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const showError = (field) => {
    if (!submitAttempted) return false;
    if (field === "amount") return !form.amount && form.amount !== 0;
    if (field === "billDate") return !form.billDate;
    if (field === "status") return !form.status;
    if (field === "interestRate")
      return (
        form.interestEnabled &&
        (form.interestRate === "" || form.interestRate == null)
      );
    return false;
  };

  useEffect(() => {
    async function loadInitial() {
      try {
        const [sectionsRes, billsRes] = await Promise.all([
          api.get("/sections"),
          api.get("/bills"),
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
      const res = await api.get("/bills");
      setBills(res.data || []);
    } catch (_) {
      setBills([]);
    }
  }

  async function loadSections() {
    try {
      const res = await api.get("/sections");
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
      const res = await api.post("/sections", { sectionName: name });
      await loadSections();
      setForm((prev) => ({ ...prev, sectionId: res.data._id }));
      setNewSectionName("");
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
    const interestRateInvalid =
      form.interestEnabled &&
      (form.interestRate === "" || form.interestRate == null);
    if (
      amountInvalid ||
      billDateInvalid ||
      statusInvalid ||
      interestRateInvalid
    ) {
      return;
    }
    if (!form.sectionId || form.sectionId === "__new__") return;

    setSubmitting(true);
    try {
      const data = new FormData();
      data.append("sectionId", form.sectionId);
      data.append("title", form.title);
      data.append("amount", form.amount);
      data.append("billDate", form.billDate);
      data.append("status", form.status);
      if (form.status === "partial_paid" && form.paidAmount !== "") {
        data.append("paidAmount", form.paidAmount);
      }
      if (form.vendorName) data.append("vendorName", form.vendorName);
      if (form.notes) data.append("notes", form.notes);
      if (form.interestEnabled) {
        data.append("interestEnabled", "true");
        data.append("interestType", form.interestType);
        data.append("interestFrequency", form.interestFrequency);
        if (form.interestRate) data.append("interestRate", form.interestRate);
        if (form.interestStartDate) {
          data.append("interestStartDate", form.interestStartDate);
        }
      }
      if (imageFile) {
        data.append("image", imageFile);
      }

      await api.post("/bills", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setToastMessage("Bill added successfully! ✓");
      setSubmitAttempted(false);
      setForm((prev) => ({
        ...prev,
        title: "",
        amount: "",
        billDate: today(),
        vendorName: "",
        notes: "",
        interestRate: "",
        interestStartDate: today(),
        paidAmount: "",
      }));
      setImageFile(null);
      await loadBills();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border-2 border-primary-700 bg-white p-5 md:p-6 shadow-lg">
        <h2 className="text-2xl md:text-3xl font-black text-slate-700">
          ➕ {t("layout.addBills")}
        </h2>
        <p className="text-base font-semibold text-slate-800 mt-2">
          Create new bills, set interest and track credit entries.
        </p>
      </div>

      {/* Create new bill form + list */}
      <div className="grid gap-4 lg:grid-cols-[1.1fr_minmax(0,1fr)]">
        <form
          onSubmit={handleCreateBill}
          className="space-y-4 rounded-xl bg-white p-4 md:p-5 shadow-sm"
        >
          <h3 className="text-base md:text-lg font-bold text-slate-900">
            {t("bills.addBill")}
          </h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700">
                {t("bills.section")}
              </label>
              <select
                required={form.sectionId !== "__new__"}
                value={form.sectionId}
                onChange={(e) => updateForm("sectionId", e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              >
                <option value="">{t("bills.selectSection")}</option>
                {sections.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.sectionName}
                  </option>
                ))}
                <option value="__new__">{t("bills.createNewSection")}</option>
              </select>
              {form.sectionId === "__new__" && (
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={newSectionName}
                    onChange={(e) => setNewSectionName(e.target.value)}
                    placeholder={t("bills.newSectionName")}
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddSection}
                    disabled={addingSection || !newSectionName.trim()}
                    className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {addingSection ? t("bills.adding") : t("bills.add")}
                  </button>
                </div>
              )}
            </div>

            <TextInput
              label={t("bills.title")}
              value={form.title}
              onChange={(v) => updateForm("title", v)}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <TextInput
              label={t("bills.billAmount")}
              type="number"
              required
              value={form.amount}
              onChange={(v) => updateForm("amount", v)}
              error={showError("amount")}
            />
            <TextInput
              label={t("bills.billDate")}
              type="date"
              required
              value={form.billDate}
              onChange={(v) => updateForm("billDate", v)}
              error={showError("billDate")}
            />
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700">
                {t("bills.status")}
              </label>
              <select
                value={form.status}
                onChange={(e) => updateForm("status", e.target.value)}
                className={
                  "w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 " +
                  (showError("status")
                    ? "border-red-500 bg-red-50/50 focus:border-red-500 focus:ring-red-200"
                    : "border-slate-200 focus:border-primary-500 focus:ring-primary-500")
                }
              >
                <option value="unpaid">{t("bills.unpaid")}</option>
                <option value="partial_paid">{t("bills.partialPaid")}</option>
                <option value="paid">{t("bills.paid")}</option>
              </select>
            </div>
          </div>

          {form.status === "partial_paid" && (
            <TextInput
              label={t("bills.amountPaid")}
              type="number"
              required
              value={form.paidAmount}
              onChange={(v) => updateForm("paidAmount", v)}
              placeholder="0"
            />
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <TextInput
              label={t("bills.vendorName")}
              value={form.vendorName}
              onChange={(v) => updateForm("vendorName", v)}
            />
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700">
                {t("bills.billImage")}
              </label>
              {imageFile && (
                <div className="flex gap-2 items-center mb-2">
                  <img
                    src={URL.createObjectURL(imageFile)}
                    alt="Preview"
                    className="h-16 w-16 rounded-lg object-cover border border-slate-200"
                  />
                  <span className="text-xs text-slate-500">{t("bills.preview")}</span>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border file:border-slate-200 file:bg-slate-50 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-slate-700 hover:file:bg-slate-100"
              />
              <p className="text-[10px] text-slate-400">{t("bills.maxSize")}</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-700">
              {t("bills.notes")}
            </label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => updateForm("notes", e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              placeholder=""
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
                    updateForm("interestEnabled", e.target.checked)
                  }
                  className="h-3.5 w-3.5 rounded border-primary-400 text-primary-600 focus:ring-primary-500"
                />
                {t("bills.enableInterest")}
              </label>
              <span className="text-[10px] text-primary-700">
                {t("bills.simpleCompound")}
              </span>
            </div>

            {form.interestEnabled && (
              <div className="mt-2 grid gap-2 sm:grid-cols-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-medium text-primary-900">
                    {t("bills.type")}
                  </label>
                  <select
                    value={form.interestType}
                    onChange={(e) => updateForm("interestType", e.target.value)}
                    className="w-full rounded-lg border border-primary-100 bg-white px-2 py-1.5 text-xs outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  >
                    <option value="simple">{t("bills.simple")}</option>
                    <option value="compound">{t("bills.compound")}</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-medium text-primary-900">
                    {t("bills.frequency")}
                  </label>
                  <select
                    value={form.interestFrequency}
                    onChange={(e) =>
                      updateForm("interestFrequency", e.target.value)
                    }
                    className="w-full rounded-lg border border-primary-100 bg-white px-2 py-1.5 text-xs outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  >
                    <option value="daily">{t("bills.daily")}</option>
                    <option value="monthly">{t("bills.monthly")}</option>
                  </select>
                </div>
                <TextInput
                  label={t("bills.interestRate")}
                  type="number"
                  value={form.interestRate}
                  onChange={(v) => updateForm("interestRate", v)}
                  error={showError("interestRate")}
                />
                <TextInput
                  label={t("bills.startDate")}
                  type="date"
                  value={form.interestStartDate}
                  onChange={(v) => updateForm("interestStartDate", v)}
                />
              </div>
            )}
          </div>

          <div className="pt-1">
            <button
              type="submit"
              disabled={
                submitting || !form.sectionId || form.sectionId === "__new__"
              }
              className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-slate-800 disabled:opacity-60"
            >
              {submitting ? t("bills.saving") : t("bills.saveBill")}
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
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <div className="space-x-2">
                    <span className="font-semibold text-slate-900">
                      {b.status === "partial_paid" && b.amountDue != null
                        ? `₹${Number(b.amountDue).toFixed(2)} due`
                        : `₹${(b.totalPayable || b.amount || 0).toFixed(2)}`}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Principal ₹{(b.amount || 0).toFixed(2)}
                      {b.status === "partial_paid" && b.paidAmount > 0 && (
                        <> · Paid ₹{Number(b.paidAmount).toFixed(2)}</>
                      )}
                      {" · "}Interest ₹{(b.calculatedInterest || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {b.sectionId?.sectionName && (
                      <span className="mr-2">{b.sectionId.sectionName}</span>
                    )}
                    {b.vendorName && <span>• {b.vendorName}</span>}
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] text-slate-500">
                  <span>
                    Bill:{" "}
                    {b.billDate
                      ? new Date(b.billDate).toISOString().slice(0, 10)
                      : "-"}
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

      {toastMessage && (
        <Toast
          message={toastMessage}
          type="success"
          onClose={() => setToastMessage("")}
        />
      )}
    </div>
  );
}

function TextInput({
  label,
  value,
  onChange,
  type = "text",
  required,
  placeholder,
  error,
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
          "w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 " +
          (error
            ? "border-red-500 bg-red-50/50 focus:border-red-500 focus:ring-red-200"
            : "border-slate-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500")
        }
      />
    </div>
  );
}

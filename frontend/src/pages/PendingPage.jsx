import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api.js";

export function PendingPage() {
  const [sections, setSections] = useState([]);
  const [bills, setBills] = useState([]);
  const [filters, setFilters] = useState({
    sectionId: "",
    search: "",
    startDate: "",
    endDate: "",
  });
  const [sortBy, setSortBy] = useState("highest"); // 'highest' | 'oldest' | 'newest'
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadInitial() {
      try {
        const [sectionsRes, billsRes] = await Promise.all([
          api.get("/sections"),
          api.get("/bills/pending"),
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

  function updateFilter(field, value) {
    setFilters((prev) => ({ ...prev, [field]: value }));
  }

  async function loadPending() {
    setLoading(true);
    try {
      const params = { status: "unpaid" };
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params[key] = value;
      });
      const res = await api.get("/bills/pending", { params });
      setBills(res.data || []);
    } finally {
      setLoading(false);
    }
  }

  async function markPaid(id) {
    await api.patch(`/bills/${id}/mark-paid`);
    await loadPending();
  }

  const grouped = useMemo(() => {
    const map = new Map();
    bills.forEach((b) => {
      const sectionName = b.sectionId?.sectionName || "Other";
      const entry = map.get(sectionName) || { section: sectionName, bills: [] };
      entry.bills.push(b);
      map.set(sectionName, entry);
    });

    const groups = Array.from(map.values());

    groups.forEach((g) => {
      g.bills.sort((a, b) => {
        if (sortBy === "highest") {
          return (
            (b.totalPayable || b.amount || 0) -
            (a.totalPayable || a.amount || 0)
          );
        }
        if (sortBy === "oldest") {
          return (
            new Date(a.billDate || a.createdAt) -
            new Date(b.billDate || b.createdAt)
          );
        }
        return (
          new Date(b.billDate || b.createdAt) -
          new Date(a.billDate || a.createdAt)
        );
      });
    });

    return groups.sort(
      (a, b) =>
        b.bills.reduce((sum, x) => sum + (x.totalPayable || x.amount || 0), 0) -
        a.bills.reduce((sum, x) => sum + (x.totalPayable || x.amount || 0), 0),
    );
  }, [bills, sortBy]);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border-2 border-primary-700 bg-white p-5 md:p-6 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex-1">
            <h2 className="text-2xl md:text-3xl font-black text-slate-700">
              ⏳ Pending Bills
            </h2>
            <p className="text-base font-semibold text-slate-800 mt-2">
              Only unpaid bills with live interest calculation.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-700 bg-white bg-opacity-60 px-3 py-2 rounded-lg">
            <span className="font-medium">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 cursor-pointer"
            >
              <option value="highest">Highest Amount</option>
              <option value="oldest">Oldest First</option>
              <option value="newest">Newest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-700">
              Section
            </label>
            <select
              value={filters.sectionId}
              onChange={(e) => updateFilter("sectionId", e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            >
              <option value="">All</option>
              {sections.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.sectionName}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-700">
              Search
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => updateFilter("search", e.target.value)}
              placeholder="Title, vendor, notes"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700">
                From
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => updateFilter("startDate", e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700">
                To
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => updateFilter("endDate", e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={loadPending}
              className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-emerald-700 disabled:opacity-60"
            >
              {loading ? "Loading…" : "Search"}
            </button>
          </div>
        </div>
      </div>

      {/* Groups */}
      <div className="space-y-3">
        {grouped.length === 0 && (
          <p className="py-6 text-center text-xs text-slate-400">
            No pending bills. Great job!
          </p>
        )}
        {grouped.map((group) => {
          const totalPrincipal = group.bills.reduce(
            (sum, b) => sum + (b.amount || 0),
            0,
          );
          const totalInterest = group.bills.reduce(
            (sum, b) => sum + (b.calculatedInterest || 0),
            0,
          );
          const totalPayable = group.bills.reduce(
            (sum, b) => sum + (b.totalPayable || b.amount || 0),
            0,
          );

          return (
            <div
              key={group.section}
              className="space-y-2 rounded-xl bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    {group.section}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {group.bills.length} bills · Principal ₹
                    {totalPrincipal.toFixed(2)} · Interest ₹
                    {totalInterest.toFixed(2)}
                  </p>
                </div>
                <div className="rounded-full bg-rose-100 px-3 py-1 text-[11px] font-semibold text-rose-700">
                  Total Payable: ₹{totalPayable.toFixed(2)}
                </div>
              </div>

              <div className="space-y-2">
                {group.bills.map((b) => (
                  <div
                    key={b._id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-rose-100 bg-rose-50/50 px-3 py-2 text-xs text-slate-800"
                  >
                    <div className="space-y-0.5">
                      <div className="font-semibold">{b.title}</div>
                      <div className="text-[10px] text-slate-500">
                        Vendor: {b.vendorName || "—"} · Bill:{" "}
                        {b.billDate
                          ? new Date(b.billDate).toISOString().slice(0, 10)
                          : "-"}
                      </div>
                      <div className="mt-1.5 rounded bg-slate-100 px-2 py-1 text-[10px] text-slate-600 inline-block">
                        <span className="font-medium text-slate-500">
                          Interest:
                        </span>{" "}
                        ₹{(b.calculatedInterest ?? 0).toFixed(2)}
                      </div>
                    </div>
                    <div className="text-right text-[10px]">
                      <div className="font-semibold text-rose-700">
                        ₹{(b.totalPayable || b.amount || 0).toFixed(2)}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Principal ₹{(b.amount || 0).toFixed(2)}
                      </div>
                      <button
                        onClick={() => markPaid(b._id)}
                        className="mt-1 inline-flex items-center justify-center rounded-full bg-emerald-600 px-3 py-0.5 text-[10px] font-semibold text-white hover:bg-emerald-500"
                      >
                        Mark as Paid
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

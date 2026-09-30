import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, CheckCircle, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import api from "../../lib/api";
import { PageLoader } from "../../components/ui/Spinner";
import EmptyState from "../../components/ui/EmptyState";
import Modal from "../../components/ui/Modal";
import CreateExpenseForm from "./forms/CreateExpenseForm";
import type { Expense } from "../../types/finance.types";

function fmtCurrency(amount: number, currency = "NGN") {
  return new Intl.NumberFormat("en-NG", {
    style: "currency", currency,
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount);
}

const STATUS_STYLES: Record<string, { bg: string; color: string; icon: React.ElementType }> = {
  pending:  { bg: "rgba(245,158,11,0.12)",  color: "#f59e0b",  icon: Clock       },
  approved: { bg: "rgba(34,197,94,0.12)",   color: "#22c55e",  icon: CheckCircle },
  rejected: { bg: "rgba(239,68,68,0.12)",   color: "#ef4444",  icon: XCircle     },
  paid:     { bg: "rgba(218,165,32,0.12)",  color: "#DAA520",  icon: CheckCircle },
};

const CATEGORY_LABELS: Record<string, string> = {
  salary: "Salary", utilities: "Utilities", maintenance: "Maintenance",
  office_supplies: "Office Supplies", ministry_activities: "Ministry",
  missions: "Missions", benevolence: "Benevolence", equipment: "Equipment",
  media_production: "Media", transport: "Transport", catering: "Catering", other: "Other",
};

function ApproveModal({
  expense, onClose, onDone,
}: { expense: Expense; onClose: () => void; onDone: () => void }) {
  const [action, setAction] = useState<"approved" | "rejected">("approved");
  const [comment, setComment] = useState("");

  const mutation = useMutation({
    mutationFn: () => api.patch(`/finance/expenses/${expense._id}/approve`, { action, comment }),
    onSuccess: () => { toast.success(`Expense ${action}`); onDone(); onClose(); },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed"),
  });

  return (
    <div className="space-y-4">
      <div className="rounded-xl p-4 space-y-2" style={{ background: "var(--bg-hover)", border: "1px solid var(--bg-border)" }}>
        <p className="text-sm font-semibold text-text-primary">{expense.title}</p>
        <p className="text-lg font-bold text-gold font-display">{fmtCurrency(expense.amount, expense.currency)}</p>
        <p className="text-xs text-text-muted">Payable to: {expense.paidTo}</p>
      </div>

      <div>
        <label className="label">Decision</label>
        <div className="flex gap-2">
          {(["approved","rejected"] as const).map((a) => (
            <button
              key={a} type="button"
              onClick={() => setAction(a)}
              className="flex-1 py-2 rounded-xl text-sm font-medium transition-all"
              style={{
                background: action === a
                  ? a === "approved" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)"
                  : "var(--bg-hover)",
                color: action === a
                  ? a === "approved" ? "#22c55e" : "#ef4444"
                  : "var(--text-secondary)",
                border: `1px solid ${action === a ? (a === "approved" ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)") : "transparent"}`,
              }}
            >
              {a === "approved" ? "✓ Approve" : "✗ Reject"}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="label">Comment (optional)</label>
        <textarea
          className="input resize-none min-h-[70px]"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Add a comment..."
        />
      </div>

      <div className="flex justify-end gap-3">
        <button onClick={onClose} className="btn-ghost">Cancel</button>
        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="btn-gold"
          style={action === "rejected" ? { background: "rgba(239,68,68,0.8)", color: "#fff" } : {}}
        >
          {mutation.isPending ? "Processing..." : `Confirm ${action === "approved" ? "Approval" : "Rejection"}`}
        </button>
      </div>
    </div>
  );
}

export default function ExpensesPage() {
  const qc = useQueryClient();
  const [showAdd, setShowAdd]       = useState(false);
  const [approving, setApproving]   = useState<Expense | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["expenses", statusFilter, categoryFilter],
    queryFn: async () => {
      const p = new URLSearchParams();
      if (statusFilter)   p.set("status",   statusFilter);
      if (categoryFilter) p.set("category", categoryFilter);
      p.set("limit", "50");
      const res = await api.get(`/finance/expenses?${p}`);
      return { expenses: res.data.data as Expense[], total: res.data.pagination?.total };
    },
  });

  const expenses = data?.expenses ?? [];

  return (
    <div className="space-y-5">
      <style>{`
        @keyframes fadeInRow { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        .exp-row { animation: fadeInRow 0.25s ease both; transition: background 0.15s; }
        .exp-row:hover { background: rgba(218,165,32,0.02); }
      `}</style>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-3xl text-text-primary">Expenses</h1>
          <p className="text-text-muted text-sm mt-0.5">{data?.total ?? 0} expense record{data?.total !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-gold flex items-center gap-2">
          <Plus size={16} /> Submit Expense
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input w-auto">
          <option value="">All Status</option>
          {["pending","approved","rejected","paid"].map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="input w-auto">
          <option value="">All Categories</option>
          {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? <PageLoader /> : expenses.length === 0 ? (
          <EmptyState
            icon="📋"
            title="No expenses yet"
            description="Submit an expense for approval"
            action={<button onClick={() => setShowAdd(true)} className="btn-gold">Submit Expense</button>}
          />
        ) : (
          <table className="w-full">
            <thead className="bg-bg-hover/50 border-b border-bg-border">
              <tr>
                {["Title","Category","Amount","Payable To","Date","Status","Actions"].map((h) => (
                  <th key={h} className="table-header text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {expenses.map((e, i) => {
                const s = STATUS_STYLES[e.status] || STATUS_STYLES.pending;
                const StatusIcon = s.icon;
                return (
                  <tr key={e._id} className="exp-row" style={{ animationDelay: `${i * 0.03}s` }}>
                    <td className="table-cell">
                      <p className="font-medium text-text-primary text-sm">{e.title}</p>
                      {e.notes && <p className="text-xs text-text-muted truncate max-w-[180px]">{e.notes}</p>}
                    </td>
                    <td className="table-cell">
                      <span className="text-xs px-2 py-1 rounded-lg bg-bg-hover text-text-secondary">
                        {CATEGORY_LABELS[e.category] || e.category}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className="font-semibold text-text-primary">
                        {fmtCurrency(e.amount, e.currency)}
                      </span>
                    </td>
                    <td className="table-cell text-text-secondary text-sm">{e.paidTo}</td>
                    <td className="table-cell text-text-muted text-xs">
                      {e.expenseDate ? format(new Date(e.expenseDate), "dd MMM yyyy") : "—"}
                    </td>
                    <td className="table-cell">
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ background: s.bg, color: s.color, border: `1px solid ${s.color}30` }}
                      >
                        <StatusIcon size={11} />
                        {e.status.charAt(0).toUpperCase() + e.status.slice(1)}
                      </span>
                    </td>
                    <td className="table-cell">
                      {e.status === "pending" && (
                        <button
                          onClick={() => setApproving(e)}
                          className="text-xs px-3 py-1 rounded-lg font-medium transition-all hover:shadow-md"
                          style={{ background: "rgba(218,165,32,0.12)", color: "#DAA520", border: "1px solid rgba(218,165,32,0.25)" }}
                        >
                          Review
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Submit Expense" size="lg">
        <CreateExpenseForm
          onSuccess={() => { setShowAdd(false); qc.invalidateQueries({ queryKey: ["expenses"] }); }}
          onCancel={() => setShowAdd(false)}
        />
      </Modal>

      <Modal isOpen={!!approving} onClose={() => setApproving(null)} title="Review Expense" size="sm">
        {approving && (
          <ApproveModal
            expense={approving}
            onClose={() => setApproving(null)}
            onDone={() => qc.invalidateQueries({ queryKey: ["expenses"] })}
          />
        )}
      </Modal>
    </div>
  );
}
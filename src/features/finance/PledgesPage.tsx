import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Eye } from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import api from "../../lib/api";
import { PageLoader } from "../../components/ui/Spinner";
import EmptyState from "../../components/ui/EmptyState";
import Modal from "../../components/ui/Modal";
import Avatar from "../../components/ui/Avatar";
import CreatePledgeForm from "./forms/CreatePledgeForm";
import type { Pledge } from "../../types/finance.types";

function fmtCurrency(amount: number, currency = "NGN") {
  return new Intl.NumberFormat("en-NG", {
    style: "currency", currency,
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount);
}

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  active:    { bg: "rgba(34,197,94,0.12)",   color: "#22c55e" },
  completed: { bg: "rgba(218,165,32,0.12)",  color: "#DAA520" },
  defaulted: { bg: "rgba(239,68,68,0.12)",   color: "#ef4444" },
  cancelled: { bg: "rgba(148,163,184,0.12)", color: "#94a3b8" },
};

function ProgressBar({ percent, color = "#DAA520" }: { percent: number; color?: string }) {
  return (
    <div className="w-full h-1.5 rounded-full bg-bg-hover overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${Math.min(percent, 100)}%`, background: color }}
      />
    </div>
  );
}

export default function PledgesPage() {
  const qc = useQueryClient();
  const [showAdd, setShowAdd]       = useState(false);
  const [hoverAction, setHoverAction] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter]   = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["pledges", statusFilter, typeFilter],
    queryFn: async () => {
      const p = new URLSearchParams();
      if (statusFilter) p.set("status",      statusFilter);
      if (typeFilter)   p.set("pledgeType",  typeFilter);
      p.set("limit", "50");
      const res = await api.get(`/finance/pledges?${p}`);
      return { pledges: res.data.data as Pledge[], total: res.data.pagination?.total };
    },
  });

  const pledges = data?.pledges ?? [];

  return (
    <div className="space-y-5">
      <style>{`
        @keyframes fadeInRow { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        .pledge-row { animation: fadeInRow 0.25s ease both; transition: background 0.15s ease; }
        .pledge-row:hover { background: rgba(218,165,32,0.03); }
        .action-btn { transition: all 0.25s cubic-bezier(0.23,1,0.32,1); }
        .action-btn:hover { transform: translateY(-2px); }
      `}</style>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-3xl text-text-primary">Pledges</h1>
          <p className="text-text-muted text-sm mt-0.5">{data?.total ?? 0} pledge commitment{data?.total !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-gold flex items-center gap-2">
          <Plus size={16} /> New Pledge
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input w-auto">
          <option value="">All Status</option>
          {["active","completed","defaulted","cancelled"].map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="input w-auto">
          <option value="">All Types</option>
          {[["tithe","Tithe"],["building_fund","Building Fund"],["missions","Missions"],
            ["partnership","Partnership"],["project_fund","Project Fund"],["other","Other"],
          ].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? <PageLoader /> : pledges.length === 0 ? (
          <EmptyState
            icon="🤝"
            title="No pledges yet"
            description="Create the first pledge commitment"
            action={<button onClick={() => setShowAdd(true)} className="btn-gold">New Pledge</button>}
          />
        ) : (
          <table className="w-full">
            <thead className="bg-bg-hover/50 border-b border-bg-border">
              <tr>
                {["Donor","Type","Total","Paid","Balance","Progress","Frequency","Status","Actions"].map((h) => (
                  <th key={h} className="table-header text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pledges.map((p, i) => {
                const donorName = p.memberId
                  ? `${p.memberId.firstName} ${p.memberId.lastName}`
                  : p.donorName || "Unknown";
                const s = STATUS_STYLES[p.status] || STATUS_STYLES.active;
                const progressColor = p.completionPercent >= 100 ? "#22c55e"
                  : p.completionPercent >= 50 ? "#DAA520" : "#3b82f6";

                return (
                  <tr key={p._id} className="pledge-row" style={{ animationDelay: `${i * 0.03}s` }}>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        {p.memberId ? (
                          <Avatar name={donorName} photoUrl={p.memberId.photoUrl} size="sm" />
                        ) : (
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                            style={{ background: "rgba(218,165,32,0.12)", color: "#DAA520" }}>
                            {donorName.charAt(0)}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-text-primary">{donorName}</p>
                          {p.memberId && <p className="text-xs text-text-muted font-mono">{p.memberId.membershipId}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className="text-xs px-2 py-1 rounded-lg bg-bg-hover text-text-secondary capitalize">
                        {p.pledgeType.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="table-cell font-semibold text-text-primary">
                      {fmtCurrency(p.totalAmount, p.currency)}
                    </td>
                    <td className="table-cell text-emerald-400 font-medium">
                      {fmtCurrency(p.paidAmount, p.currency)}
                    </td>
                    <td className="table-cell text-red-400 font-medium">
                      {fmtCurrency(p.balanceDue, p.currency)}
                    </td>
                    <td className="table-cell min-w-[100px]">
                      <div className="space-y-1">
                        <ProgressBar percent={p.completionPercent} color={progressColor} />
                        <p className="text-xs text-text-muted">{p.completionPercent}%</p>
                      </div>
                    </td>
                    <td className="table-cell text-text-muted text-xs capitalize">
                      {p.frequency.replace(/_/g, " ")}
                    </td>
                    <td className="table-cell">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ background: s.bg, color: s.color, border: `1px solid ${s.color}30` }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
                        {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                      </span>
                    </td>
                    <td className="table-cell">
                      <button
                        onMouseEnter={() => setHoverAction(`view-${p._id}`)}
                        onMouseLeave={() => setHoverAction(null)}
                        className={`action-btn w-7 h-7 flex items-center justify-center rounded-lg ${
                          hoverAction === `view-${p._id}`
                            ? "bg-blue-500/20 text-blue-400" : "text-text-muted hover:text-blue-400"}`}
                      >
                        <Eye size={14} strokeWidth={2.2} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Create Pledge" size="lg">
        <CreatePledgeForm
          onSuccess={() => { setShowAdd(false); qc.invalidateQueries({ queryKey: ["pledges"] }); }}
          onCancel={() => setShowAdd(false)}
        />
      </Modal>
    </div>
  );
}
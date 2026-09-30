import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Plus, Eye, Trash2, Download } from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import api from "../../lib/api";
import { PageLoader } from "../../components/ui/Spinner";
import EmptyState from "../../components/ui/EmptyState";
import StatusBadge from "../../components/ui/StatusBadge";
import SearchInput from "../../components/ui/SearchInput";
import Modal from "../../components/ui/Modal";
import Avatar from "../../components/ui/Avatar";
import RecordContributionForm from "./forms/RecordContributionForm";
import type { Contribution } from "../../types/finance.types";

const TYPE_LABELS: Record<string, string> = {
  tithe: "Tithe", sunday_offering: "Sunday Offering",
  midweek_offering: "Midweek Offering", special_donation: "Special Donation",
  building_fund: "Building Fund", partnership: "Partnership",
  covenant_seed: "Covenant Seed", pledge_payment: "Pledge Payment",
  project_fund: "Project Fund", missions: "Missions",
  benevolence: "Benevolence", thanksgiving: "Thanksgiving",
  first_fruit: "First Fruit", other: "Other",
};

const CHANNEL_COLORS: Record<string, string> = {
  cash: "#22c55e", bank_transfer: "#3b82f6", card: "#8b5cf6",
  mobile_money: "#f59e0b", paystack: "#06b6d4", ussd: "#ec4899",
  cheque: "#94a3b8", flutterwave: "#f97316",
};

const STATUS_COLORS: Record<string, string> = {
  successful: "#22c55e", pending: "#f59e0b", failed: "#ef4444", reversed: "#94a3b8",
};

function fmtCurrency(amount: number, currency = "NGN") {
  return new Intl.NumberFormat("en-NG", {
    style: "currency", currency,
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount);
}

function ChannelBadge({ channel }: { channel: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{
        background: `${CHANNEL_COLORS[channel] || "#888"}18`,
        color: CHANNEL_COLORS[channel] || "#888",
        border: `1px solid ${CHANNEL_COLORS[channel] || "#888"}30`,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: CHANNEL_COLORS[channel] || "#888" }}
      />
      {channel.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
    </span>
  );
}

export default function ContributionsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showAdd, setShowAdd]       = useState(false);
  const [deleting, setDeleting]     = useState<string | null>(null);
  const [hoverAction, setHoverAction] = useState<string | null>(null);

  // Filters
  const [search, setSearch]         = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [channelFilter, setChannelFilter] = useState("");
  const [startDate, setStartDate]   = useState("");
  const [endDate, setEndDate]       = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["contributions", search, typeFilter, statusFilter, channelFilter, startDate, endDate],
    queryFn: async () => {
      const p = new URLSearchParams();
      if (search)        p.set("search",          search);
      if (typeFilter)    p.set("contributionType", typeFilter);
      if (statusFilter)  p.set("status",           statusFilter);
      if (channelFilter) p.set("paymentChannel",   channelFilter);
      if (startDate)     p.set("startDate",         startDate);
      if (endDate)       p.set("endDate",           endDate);
      p.set("limit", "50");
      const res = await api.get(`/finance/contributions?${p}`);
      return { contributions: res.data.data as Contribution[], total: res.data.pagination?.total };
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/finance/contributions/${id}`),
    onSuccess: () => {
      toast.success("Contribution deleted");
      qc.invalidateQueries({ queryKey: ["contributions"] });
      qc.invalidateQueries({ queryKey: ["finance-dashboard"] });
      setDeleting(null);
    },
    onError: () => toast.error("Failed to delete"),
  });

  const contributions = data?.contributions ?? [];

  const TYPES    = Object.keys(TYPE_LABELS);
  const CHANNELS = ["cash","bank_transfer","card","mobile_money","paystack","ussd","cheque","flutterwave"];
  const STATUSES = ["successful","pending","failed","reversed"];

  return (
    <div className="space-y-5">
      <style>{`
        @keyframes fadeInRow {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .contrib-row { animation: fadeInRow 0.25s ease both; transition: background 0.15s ease; }
        .contrib-row:hover { background: rgba(218,165,32,0.03); }
        .action-btn { transition: all 0.25s cubic-bezier(0.23,1,0.32,1); }
        .action-btn:hover { transform: translateY(-2px); }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-3xl text-text-primary">Contributions</h1>
          <p className="text-text-muted text-sm mt-0.5">{data?.total ?? 0} giving record{data?.total !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-ghost flex items-center gap-2 text-sm">
            <Download size={15} /> Export
          </button>
          <button onClick={() => setShowAdd(true)} className="btn-gold flex items-center gap-2">
            <Plus size={16} /> Record Giving
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by name, receipt..." />
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="input w-auto">
          <option value="">All Types</option>
          {TYPES.map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input w-auto">
          <option value="">All Status</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
        <select value={channelFilter} onChange={(e) => setChannelFilter(e.target.value)} className="input w-auto">
          <option value="">All Channels</option>
          {CHANNELS.map((c) => <option key={c} value={c}>{c.replace(/_/g, " ").replace(/\b\w/g, (x) => x.toUpperCase())}</option>)}
        </select>
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input w-auto" />
        <input type="date" value={endDate}   onChange={(e) => setEndDate(e.target.value)}   className="input w-auto" />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? <PageLoader /> : contributions.length === 0 ? (
          <EmptyState
            icon="💰"
            title="No contributions found"
            description="Record your first giving entry"
            action={<button onClick={() => setShowAdd(true)} className="btn-gold">Record Giving</button>}
          />
        ) : (
          <table className="w-full">
            <thead className="bg-bg-hover/50 border-b border-bg-border">
              <tr>
                {["Donor", "Type", "Amount", "Channel", "Receipt", "Date", "Status", "Actions"].map((h) => (
                  <th key={h} className="table-header text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {contributions.map((c, i) => {
                const donorName = c.memberId
                  ? `${c.memberId.firstName} ${c.memberId.lastName}`
                  : c.isAnonymous ? "Anonymous" : c.donorName || "Guest Donor";

                return (
                  <tr key={c._id} className="contrib-row" style={{ animationDelay: `${i * 0.03}s` }}>
                    {/* Donor */}
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        {c.memberId ? (
                          <Avatar name={donorName} photoUrl={c.memberId.photoUrl} size="sm" />
                        ) : (
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                            style={{ background: "rgba(218,165,32,0.12)", color: "#DAA520" }}
                          >
                            {donorName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-text-primary text-sm">{donorName}</p>
                          {c.memberId && (
                            <p className="text-xs text-text-muted font-mono">{c.memberId.membershipId}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Type */}
                    <td className="table-cell">
                      <span className="text-xs px-2 py-1 rounded-lg bg-bg-hover text-text-secondary">
                        {TYPE_LABELS[c.contributionType] || c.contributionType}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="table-cell">
                      <span className="font-semibold text-emerald-400 font-display">
                        {fmtCurrency(c.amount, c.currency)}
                      </span>
                      {c.currency !== "NGN" && c.amountInNGN && (
                        <p className="text-xs text-text-muted">≈ {fmtCurrency(c.amountInNGN)}</p>
                      )}
                    </td>

                    {/* Channel */}
                    <td className="table-cell"><ChannelBadge channel={c.paymentChannel} /></td>

                    {/* Receipt */}
                    <td className="table-cell">
                      <span className="font-mono text-gold text-xs">{c.receiptNumber}</span>
                    </td>

                    {/* Date */}
                    <td className="table-cell text-text-muted text-xs">
                      {c.serviceDate ? format(new Date(c.serviceDate), "dd MMM yyyy") : "—"}
                    </td>

                    {/* Status */}
                    <td className="table-cell">
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          background: `${STATUS_COLORS[c.status] || "#888"}18`,
                          color: STATUS_COLORS[c.status] || "#888",
                          border: `1px solid ${STATUS_COLORS[c.status] || "#888"}30`,
                        }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: STATUS_COLORS[c.status] || "#888" }} />
                        {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="table-cell">
                      <div className="flex items-center gap-1.5">
                        <button
                          onMouseEnter={() => setHoverAction(`view-${c._id}`)}
                          onMouseLeave={() => setHoverAction(null)}
                          onClick={() => navigate(`/finance/contributions/${c._id}`)}
                          className={`action-btn w-7 h-7 flex items-center justify-center rounded-lg ${
                            hoverAction === `view-${c._id}`
                              ? "bg-blue-500/20 text-blue-400"
                              : "text-text-muted hover:text-blue-400"
                          }`}
                        >
                          <Eye size={14} strokeWidth={2.2} />
                        </button>
                        <button
                          onMouseEnter={() => setHoverAction(`del-${c._id}`)}
                          onMouseLeave={() => setHoverAction(null)}
                          onClick={() => setDeleting(c._id)}
                          className={`action-btn w-7 h-7 flex items-center justify-center rounded-lg ${
                            hoverAction === `del-${c._id}`
                              ? "bg-red-500/20 text-red-400"
                              : "text-text-muted hover:text-red-400"
                          }`}
                        >
                          <Trash2 size={14} strokeWidth={2.2} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Record Modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Record Giving" size="lg">
        <RecordContributionForm
          onSuccess={() => {
            setShowAdd(false);
            qc.invalidateQueries({ queryKey: ["contributions"] });
            qc.invalidateQueries({ queryKey: ["finance-dashboard"] });
          }}
          onCancel={() => setShowAdd(false)}
        />
      </Modal>

      {/* Delete Confirm */}
      <Modal isOpen={!!deleting} onClose={() => setDeleting(null)} title="Delete Contribution" size="sm">
        <p className="text-text-secondary mb-5">Are you sure you want to delete this contribution record?</p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setDeleting(null)} className="btn-ghost">Cancel</button>
          <button
            onClick={() => deleting && deleteMutation.mutate(deleting)}
            className="btn-danger"
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
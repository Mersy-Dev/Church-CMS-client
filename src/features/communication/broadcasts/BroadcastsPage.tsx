import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Send, BarChart2, Clock, CheckCircle, AlertCircle, FileText } from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import api from "../../../lib/api";
import Modal from "../../../components/ui/Modal";
import { PageLoader } from "../../../components/ui/Spinner";
import EmptyState from "../../../components/ui/EmptyState";
import type { Broadcast, BroadcastStatsDetail, CommChannel } from "../../../types/communication.types";
import CreateBroadcastForm from "../CreateBroadcastForm";

const CHANNEL_COLORS: Record<CommChannel, string> = {
  email:    "#3b82f6",
  sms:      "#10b981",
  whatsapp: "#22c55e",
  push:     "#8b5cf6",
  in_app:   "#DAA520",
};

const STATUS_CONFIG: Record<string, { color: string; icon: React.ElementType; label: string }> = {
  draft:     { color: "#888",    icon: FileText,     label: "Draft"     },
  scheduled: { color: "#DAA520", icon: Clock,        label: "Scheduled" },
  sending:   { color: "#3b82f6", icon: Send,         label: "Sending"   },
  sent:      { color: "#10b981", icon: CheckCircle,  label: "Sent"      },
  cancelled: { color: "#ef4444", icon: AlertCircle,  label: "Cancelled" },
};

function StatusPill({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  const Icon = cfg.icon;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: `${cfg.color}18`, color: cfg.color, border: `1px solid ${cfg.color}30` }}
    >
      <Icon size={10} />
      {cfg.label}
    </span>
  );
}

function ChannelDot({ channel }: { channel: CommChannel }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize"
      style={{
        background: `${CHANNEL_COLORS[channel] ?? "#888"}18`,
        color: CHANNEL_COLORS[channel] ?? "#888",
        border: `1px solid ${CHANNEL_COLORS[channel] ?? "#888"}30`,
      }}
    >
      {channel}
    </span>
  );
}

export default function BroadcastsPage() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate]   = useState(false);
  const [statsId,    setStatsId]      = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [channelFilter, setChannelFilter] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["broadcasts", statusFilter, channelFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter)  params.set("status",  statusFilter);
      if (channelFilter) params.set("channel", channelFilter);
      const res = await api.get(`/communications/broadcasts?${params}`);
      return {
        broadcasts: res.data.data as Broadcast[],
        total: res.data.pagination?.total ?? res.data.data?.length,
      };
    },
  });

  const { data: broadcastStats, isLoading: statsLoading } = useQuery<BroadcastStatsDetail>({
    queryKey: ["broadcast-stats", statsId],
    queryFn: async () => {
      const res = await api.get(`/communications/broadcasts/${statsId}/stats`);
      return res.data.data;
    },
    enabled: !!statsId,
  });

  const sendMutation = useMutation({
    mutationFn: (id: string) => api.post(`/communications/broadcasts/${id}/send`),
    onSuccess: () => {
      toast.success("Broadcast sent!");
      qc.invalidateQueries({ queryKey: ["broadcasts"] });
      qc.invalidateQueries({ queryKey: ["comm-stats"] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Send failed"),
  });

  const broadcasts = data?.broadcasts ?? [];

  return (
    <div className="space-y-5">
      <style>{`
        @keyframes fadeInRow {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .bc-row { animation: fadeInRow 0.25s ease both; transition: background 0.15s; }
        .bc-row:hover { background: rgba(218,165,32,0.03); }
        .stat-bubble { border-radius: 12px; padding: 12px 16px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); }
      `}</style>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-3xl text-text-primary">Broadcasts</h1>
          <p className="text-text-muted text-sm mt-0.5">{data?.total ?? 0} campaigns</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-gold flex items-center gap-2">
          <Plus size={15} /> New Broadcast
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input w-auto">
          <option value="">All Status</option>
          {Object.entries(STATUS_CONFIG).map(([v, c]) => (
            <option key={v} value={v}>{c.label}</option>
          ))}
        </select>
        <select value={channelFilter} onChange={(e) => setChannelFilter(e.target.value)} className="input w-auto">
          <option value="">All Channels</option>
          {["email","sms","whatsapp","push","in_app"].map((c) => (
            <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? <PageLoader /> : broadcasts.length === 0 ? (
          <EmptyState
            icon="📢"
            title="No broadcasts yet"
            description="Create your first broadcast campaign"
            action={<button onClick={() => setShowCreate(true)} className="btn-gold">New Broadcast</button>}
          />
        ) : (
          <table className="w-full">
            <thead className="bg-bg-hover/50 border-b border-bg-border">
              <tr>
                {["Title", "Channel", "Audience", "Status", "Sent At", "Stats", "Actions"].map((h) => (
                  <th key={h} className="table-header text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {broadcasts.map((bc, i) => (
                <tr key={bc._id} className="bc-row" style={{ animationDelay: `${i * 0.04}s` }}>
                  <td className="table-cell">
                    <p className="font-medium text-text-primary text-sm">{bc.title}</p>
                    {bc.subject && <p className="text-xs text-text-muted truncate max-w-[200px]">{bc.subject}</p>}
                  </td>
                  <td className="table-cell">
                    <ChannelDot channel={bc.channel} />
                  </td>
                  <td className="table-cell">
                    <span className="text-xs text-text-secondary capitalize">{bc.audience.scope}</span>
                    {bc.recipientCount > 0 && (
                      <p className="text-xs text-text-muted">{bc.recipientCount.toLocaleString()} recipients</p>
                    )}
                  </td>
                  <td className="table-cell">
                    <StatusPill status={bc.status} />
                  </td>
                  <td className="table-cell text-xs text-text-muted">
                    {bc.sentAt ? format(new Date(bc.sentAt), "dd MMM yyyy HH:mm") : "—"}
                  </td>
                  <td className="table-cell">
                    {bc.status === "sent" && (
                      <div className="text-xs space-y-0.5">
                        <p className="text-text-muted">
                          <span className="text-green-400 font-semibold">{bc.stats?.delivered ?? 0}</span> delivered
                        </p>
                        <p className="text-text-muted">
                          <span className="text-blue-400 font-semibold">{bc.stats?.opened ?? 0}</span> opened
                        </p>
                      </div>
                    )}
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center gap-1.5">
                      {bc.status === "sent" && (
                        <button
                          onClick={() => setStatsId(bc._id)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-blue-400 hover:bg-blue-500/10 transition-all"
                          title="View analytics"
                        >
                          <BarChart2 size={14} />
                        </button>
                      )}
                      {(bc.status === "draft" || bc.status === "scheduled") && (
                        <button
                          onClick={() => {
                            if (confirm(`Send "${bc.title}" now to all recipients?`)) {
                              sendMutation.mutate(bc._id);
                            }
                          }}
                          disabled={sendMutation.isPending}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-gold hover:bg-gold/10 transition-all"
                          title="Send now"
                        >
                          <Send size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Broadcast" size="lg">
        <CreateBroadcastForm
          onSuccess={() => { setShowCreate(false); qc.invalidateQueries({ queryKey: ["broadcasts"] }); }}
          onCancel={() => setShowCreate(false)}
        />
      </Modal>

      {/* Stats Modal */}
      <Modal isOpen={!!statsId} onClose={() => setStatsId(null)} title="Broadcast Analytics" size="md">
        {statsLoading ? <PageLoader /> : broadcastStats ? (
          <div className="space-y-4">
            <div>
              <p className="font-semibold text-text-primary">{broadcastStats.broadcast.title}</p>
              {broadcastStats.broadcast.sentAt && (
                <p className="text-xs text-text-muted">
                  Sent {format(new Date(broadcastStats.broadcast.sentAt), "dd MMM yyyy HH:mm")}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Recipients",    value: broadcastStats.recipientCount, color: "#888"    },
                { label: "Delivered",     value: broadcastStats.stats.delivered ?? 0, color: "#10b981" },
                { label: "Opened",        value: broadcastStats.stats.opened    ?? 0, color: "#3b82f6" },
                { label: "Failed",        value: broadcastStats.stats.failed    ?? 0, color: "#ef4444" },
              ].map((s) => (
                <div key={s.label} className="stat-bubble">
                  <p className="text-xs text-text-muted">{s.label}</p>
                  <p className="font-bold text-xl mt-1" style={{ color: s.color }}>{s.value}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="stat-bubble">
                <p className="text-xs text-text-muted">Open Rate</p>
                <p className="font-bold text-xl mt-1 text-gold">{broadcastStats.openRate}</p>
              </div>
              <div className="stat-bubble">
                <p className="text-xs text-text-muted">Delivery Rate</p>
                <p className="font-bold text-xl mt-1 text-gold">{broadcastStats.deliveryRate}</p>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
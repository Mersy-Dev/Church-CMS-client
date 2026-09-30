import { useQuery, useMutation } from "@tanstack/react-query";
import {
  MessageSquare,
  Mail,
  Phone,
  Smartphone,
  Bell,
  Megaphone,
  Zap, 
  FileText,
  TrendingUp,
  Send,
  Users,
  CheckCircle,
  AlertCircle,
  Eye,
} from "lucide-react";
import api from "../../lib/api";
import { PageLoader } from "../../components/ui/Spinner";
import type { CommStats, CommStatus, CommTrigger, CommChannel } from "../../types/communication.types";
import toast from "react-hot-toast";

const CHANNEL_META: Record<
  CommChannel,
  { icon: React.ElementType; label: string; color: string }
> = {
  email: { icon: Mail, label: "Email", color: "#3b82f6" },
  sms: { icon: Phone, label: "SMS", color: "#10b981" },
  whatsapp: { icon: MessageSquare, label: "WhatsApp", color: "#22c55e" },
  push: { icon: Smartphone, label: "Push", color: "#8b5cf6" },
  in_app: { icon: Bell, label: "In-App", color: "#DAA520" },
};

const TRIGGER_LABELS: Record<string, string> = {
  manual_broadcast: "Broadcast",
  birthday: "Birthday",
  anniversary: "Anniversary",
  event_reminder: "Event Reminder",
  welcome_sequence: "Welcome",
  absentee_followup: "Absentee",
  prayer_chain: "Prayer Chain",
  giving_receipt: "Giving Receipt",
  pledge_reminder: "Pledge Reminder",
  staff_message: "Staff Message",
};

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-text-muted text-xs font-semibold uppercase tracking-widest">
          {label}
        </p>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: `${color ?? "#DAA520"}18` }}
        >
          <Icon size={15} style={{ color: color ?? "#DAA520" }} />
        </div>
      </div>
      <p className="font-display font-bold text-2xl text-text-primary">
        {value}
      </p>
      {sub && <p className="text-text-muted text-xs">{sub}</p>}
    </div>
  );
}

export default function CommunicationPage() {
  const { data: stats, isLoading } = useQuery<CommStats>({
    queryKey: ["comm-stats"],
    queryFn: async () => {
      const res = await api.get("/communications/stats");
      return res.data.data;
    },
  });

  const prayerChainMutation = useMutation({
    mutationFn: (body: string) =>
      api.post("/communications/prayer-chain", { body, channel: "sms" }),
    onSuccess: () => toast.success("Prayer chain alert sent!"),
    onError: () => toast.error("Failed to send prayer chain alert"),
  });

  if (isLoading) return <PageLoader />;

  const byChannel = (stats?.byChannel ?? {}) as Record<CommChannel, number>;
  const byStatus = (stats?.byStatus ?? {}) as Record<CommStatus, number>;
  const byTrigger = (stats?.byTrigger ?? {}) as Record<CommTrigger, number>;
  const total = stats?.totalLast30 ?? 0;

  const deliveryRate = total
    ? Math.round(
        (((byStatus.delivered ?? 0) + (byStatus.opened ?? 0)) / total) * 100,
      )
    : 0;
  const openRate = total
    ? Math.round(((byStatus.opened ?? 0) / total) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .comm-card { animation: slideUp 0.3s ease both; }
        .comm-card:nth-child(1) { animation-delay: 0.05s; }
        .comm-card:nth-child(2) { animation-delay: 0.10s; }
        .comm-card:nth-child(3) { animation-delay: 0.15s; }
        .comm-card:nth-child(4) { animation-delay: 0.20s; }
        .channel-bar {
          height: 6px; border-radius: 999px;
          transition: width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .trigger-row:hover { background: rgba(218,165,32,0.04); }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-3xl text-text-primary">
            Communications
          </h1>
          <p className="text-text-muted text-sm mt-0.5">
            Module 08 · Messaging & Automation
          </p>
        </div>
        <button
          onClick={() => {
            const msg = prompt("Prayer chain message:");
            if (msg) prayerChainMutation.mutate(msg);
          }}
          className="btn-gold flex items-center gap-2"
        >
          <Zap size={15} /> Prayer Chain Alert
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="comm-card">
          <StatCard
            icon={Send}
            label="Sent (30d)"
            value={total}
            sub="All channels combined"
          />
        </div>
        <div className="comm-card">
          <StatCard
            icon={CheckCircle}
            label="Delivery Rate"
            value={`${deliveryRate}%`}
            color="#10b981"
            sub="Delivered + opened"
          />
        </div>
        <div className="comm-card">
          <StatCard
            icon={Eye}
            label="Open Rate"
            value={`${openRate}%`}
            color="#3b82f6"
            sub="Email & push"
          />
        </div>
        <div className="comm-card">
          <StatCard
            icon={AlertCircle}
            label="Failed"
            value={byStatus.failed ?? 0}
            color="#ef4444"
            sub="Delivery failures"
          />
        </div>
      </div>

      {/* Channels + Triggers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Channel breakdown */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-bg-border">
            <Megaphone size={14} className="text-gold" />
            <h3 className="text-sm font-semibold uppercase tracking-widest text-text-secondary">
              By Channel (30d)
            </h3>
          </div>
          <div className="space-y-4">
            {Object.entries(CHANNEL_META).map(([key, meta]) => {
              const count = (byChannel as any)[key] ?? 0;
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              const Icon = meta.icon;
              return (
                <div key={key} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon size={13} style={{ color: meta.color }} />
                      <span className="text-xs text-text-secondary font-medium">
                        {meta.label}
                      </span>
                    </div>
                    <span className="text-xs font-mono text-text-muted">
                      {count.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-bg-hover overflow-hidden">
                    <div
                      className="channel-bar"
                      style={{ width: `${pct}%`, background: meta.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Trigger breakdown */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-bg-border">
            <TrendingUp size={14} className="text-gold" />
            <h3 className="text-sm font-semibold uppercase tracking-widest text-text-secondary">
              By Trigger (30d)
            </h3>
          </div>
          <div className="space-y-1">
            {Object.entries(TRIGGER_LABELS).map(([key, label]) => {
              const count = (byTrigger as any)[key] ?? 0;
              return (
                <div
                  key={key}
                  className="trigger-row flex items-center justify-between px-2 py-2 rounded-lg transition-colors"
                >
                  <span className="text-xs text-text-secondary">{label}</span>
                  <span className="text-xs font-mono font-semibold text-text-primary">
                    {count.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-bg-border">
          <Zap size={14} className="text-gold" />
          <h3 className="text-sm font-semibold uppercase tracking-widest text-text-secondary">
            Quick Actions
          </h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {
              icon: Megaphone,
              label: "New Broadcast",
              href: "/communications/broadcasts",
              color: "#DAA520",
            },
            {
              icon: FileText,
              label: "Add Template",
              href: "/communications/templates",
              color: "#3b82f6",
            },
            {
              icon: Bell,
              label: "Post Announcement",
              href: "/communications/announcements",
              color: "#8b5cf6",
            },
            {
              icon: Users,
              label: "Staff Message",
              href: "/communications/staff-messages",
              color: "#10b981",
            },
          ].map((action) => {
            const Icon = action.icon;
            return (
              <a
                key={action.href}
                href={action.href}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-bg-border hover:border-gold/30 transition-all duration-200 hover:bg-gold/5 group"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
                  style={{ background: `${action.color}18` }}
                >
                  <Icon size={18} style={{ color: action.color }} />
                </div>
                <span className="text-xs text-text-secondary font-medium text-center leading-tight">
                  {action.label}
                </span>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}

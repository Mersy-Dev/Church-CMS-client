import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Mail, Phone, MessageSquare, Smartphone, Bell,
  CheckCircle, AlertCircle, Eye, Clock, Send,
} from "lucide-react";
import Modal from "../../components/ui/Modal";
import { PageLoader } from "../../components/ui/Spinner";
import type { Communication, CommChannel, CommStatus } from "../../types/communication.types";
import api from "../../lib/api";

const CHANNEL_META: Record<CommChannel, { icon: React.ElementType; color: string; label: string }> = {
  email:    { icon: Mail,          color: "#3b82f6", label: "Email"    },
  sms:      { icon: Phone,         color: "#10b981", label: "SMS"      },
  whatsapp: { icon: MessageSquare, color: "#22c55e", label: "WhatsApp" },
  push:     { icon: Smartphone,    color: "#8b5cf6", label: "Push"     },
  in_app:   { icon: Bell,          color: "#DAA520", label: "In-App"   },
};

const STATUS_META: Record<CommStatus, { icon: React.ElementType; color: string }> = {
  queued:    { icon: Clock,        color: "#888"    },
  sent:      { icon: Send,         color: "#3b82f6" },
  delivered: { icon: CheckCircle,  color: "#10b981" },
  opened:    { icon: Eye,          color: "#DAA520" },
  failed:    { icon: AlertCircle,  color: "#ef4444" },
  bounced:   { icon: AlertCircle,  color: "#f97316" },
};

const TRIGGER_LABELS: Record<string, string> = {
  manual_broadcast:  "Broadcast",
  birthday:          "Birthday",
  anniversary:       "Anniversary",
  event_reminder:    "Event Reminder",
  welcome_sequence:  "Welcome",
  absentee_followup: "Absentee",
  prayer_chain:      "Prayer Chain",
  giving_receipt:    "Giving Receipt",
  pledge_reminder:   "Pledge Reminder",
  staff_message:     "Staff Message",
};

interface Props {
  memberId:   string;
  memberName: string;
  isOpen:     boolean;
  onClose:    () => void;
}

export default function MemberHistoryModal({ memberId, memberName, isOpen, onClose }: Props) {
  const { data: history, isLoading } = useQuery<Communication[]>({
    queryKey: ["member-comm-history", memberId],
    queryFn: async () => {
      const res = await api.get(`/communications/history/${memberId}?limit=50`);
      return res.data.data;
    },
    enabled: isOpen && !!memberId,
  });

  // Group by channel for summary
  const summary = history?.reduce((acc, c) => {
    acc[c.channel] = (acc[c.channel] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Communication History — ${memberName}`} size="lg">
      <style>{`
        .hist-row { transition: background 0.15s; }
        .hist-row:hover { background: rgba(218,165,32,0.03); }
        @keyframes histIn { from { opacity:0; } to { opacity:1; } }
        .hist-list { animation: histIn 0.3s ease; }
      `}</style>

      {isLoading ? (
        <PageLoader />
      ) : !history?.length ? (
        <div className="py-12 text-center">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-text-muted text-sm">No messages sent to this member yet</p>
        </div>
      ) : (
        <div className="space-y-4 hist-list">
          {/* Summary pills */}
          <div className="flex flex-wrap gap-2">
            {Object.entries(summary ?? {}).map(([channel, count]) => {
              const meta = CHANNEL_META[channel as CommChannel];
              if (!meta) return null;
              const Icon = meta.icon;
              return (
                <div
                  key={channel}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                  style={{ background: `${meta.color}12`, color: meta.color, border: `1px solid ${meta.color}25` }}
                >
                  <Icon size={10} /> {meta.label}: {count}
                </div>
              );
            })}
            <span className="text-xs text-text-muted self-center ml-auto">
              {history.length} total messages
            </span>
          </div>

          {/* Message list */}
          <div className="space-y-1 max-h-[420px] overflow-y-auto pr-1">
            {history.map((comm) => {
              const channelMeta = CHANNEL_META[comm.channel];
              const statusMeta  = STATUS_META[comm.status] ?? STATUS_META.sent;
              const ChannelIcon = channelMeta?.icon ?? Bell;
              const StatusIcon  = statusMeta.icon;

              return (
                <div
                  key={comm._id}
                  className="hist-row rounded-xl px-3 py-2.5"
                >
                  <div className="flex items-start gap-3">
                    {/* Channel icon */}
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: `${channelMeta?.color ?? "#888"}12` }}
                    >
                      <ChannelIcon size={14} style={{ color: channelMeta?.color ?? "#888" }} />
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Header row */}
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="text-xs font-semibold text-text-secondary capitalize">
                          {channelMeta?.label ?? comm.channel}
                        </span>
                        <span className="text-xs text-text-muted">
                          {TRIGGER_LABELS[comm.trigger] ?? comm.trigger}
                        </span>
                        {/* Status badge */}
                        <span
                          className="inline-flex items-center gap-0.5 ml-auto text-xs font-medium"
                          style={{ color: statusMeta.color }}
                        >
                          <StatusIcon size={10} />
                          {comm.status}
                        </span>
                      </div>

                      {/* Subject */}
                      {comm.subject && (
                        <p className="text-xs font-medium text-text-primary truncate">{comm.subject}</p>
                      )}

                      {/* Body preview */}
                      <p className="text-xs text-text-muted line-clamp-1 mt-0.5">{comm.body}</p>

                      {/* Timestamps */}
                      <div className="flex items-center gap-3 mt-1 text-xs text-text-muted">
                        {comm.sentAt && (
                          <span>Sent {format(new Date(comm.sentAt), "dd MMM yyyy HH:mm")}</span>
                        )}
                        {comm.openedAt && (
                          <span className="text-blue-400">
                            Opened {format(new Date(comm.openedAt), "HH:mm")}
                          </span>
                        )}
                        {comm.failureReason && (
                          <span className="text-red-400 truncate max-w-[200px]">{comm.failureReason}</span>
                        )}
                        {comm.provider && (
                          <span className="ml-auto capitalize text-text-muted opacity-60">{comm.provider}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Modal>
  );
}
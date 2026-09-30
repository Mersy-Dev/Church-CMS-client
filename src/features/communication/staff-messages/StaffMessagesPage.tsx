import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Send, AlertOctagon, CheckCheck, Circle } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import api from "../../../lib/api";
import Modal from "../../../components/ui/Modal";
import { PageLoader } from "../../../components/ui/Spinner";
import EmptyState from "../../../components/ui/EmptyState";
import type { StaffMessage, StaffMessageFormData } from "../../../types/communication.types";

// ── Compose Form ──────────────────────────────────────────────────────────────

function ComposeForm({ parentId, onSuccess, onCancel }: {
  parentId?: string; onSuccess: () => void; onCancel: () => void;
}) {
  const [recipientInput, setRecipientInput] = useState("");
  const [recipients, setRecipients]         = useState<string[]>([]);

  const { register, handleSubmit, formState: { errors } } = useForm<StaffMessageFormData>({
    defaultValues: { isUrgent: false },
  });

  // Fetch staff users for recipient search
  const { data: users } = useQuery({
    queryKey: ["staff-users"],
    queryFn: async () => {
      const res = await api.get("/auth/users?limit=100");
      return res.data.data as { _id: string; email: string; role: string }[];
    },
  });

  const filteredUsers = users?.filter(
    (u) =>
      u.email.toLowerCase().includes(recipientInput.toLowerCase()) &&
      !recipients.includes(u._id)
  );

  const addRecipient = (id: string) => {
    setRecipients((p) => [...p, id]);
    setRecipientInput("");
  };

  const removeRecipient = (id: string) => setRecipients((p) => p.filter((r) => r !== id));

  const mutation = useMutation({
    mutationFn: (data: StaffMessageFormData) =>
      api.post("/communications/staff-messages", {
        ...data,
        recipientIds: recipients,
        parentId,
      }),
    onSuccess: () => { toast.success("Message sent"); onSuccess(); },
    onError:   (err: any) => toast.error(err.response?.data?.message || "Failed to send"),
  });

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
      {/* Recipients */}
      <div>
        <label className="label">Recipients *</label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {recipients.map((id) => {
            const u = users?.find((u) => u._id === id);
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
                style={{ background: "rgba(218,165,32,0.12)", color: "#DAA520", border: "1px solid rgba(218,165,32,0.25)" }}
              >
                {u?.email ?? id}
                <button type="button" onClick={() => removeRecipient(id)} className="hover:opacity-60">×</button>
              </span>
            );
          })}
        </div>
        <div className="relative">
          <input
            className="input"
            placeholder="Search staff by email..."
            value={recipientInput}
            onChange={(e) => setRecipientInput(e.target.value)}
          />
          {recipientInput && filteredUsers && filteredUsers.length > 0 && (
            <div
              className="absolute z-50 w-full mt-1 rounded-xl border overflow-hidden shadow-xl"
              style={{ background: "var(--bg-card, #1a1a2e)", borderColor: "var(--bg-border)" }}
            >
              {filteredUsers.slice(0, 6).map((u) => (
                <button
                  key={u._id}
                  type="button"
                  onClick={() => addRecipient(u._id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 transition-colors text-left"
                >
                  <div className="w-7 h-7 rounded-full bg-gold/10 flex items-center justify-center text-xs font-bold text-gold">
                    {u.email[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm text-text-primary">{u.email}</p>
                    <p className="text-xs text-text-muted capitalize">{u.role.replace(/_/g, " ")}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        {recipients.length === 0 && (
          <p className="text-red-400 text-xs mt-1">Add at least one recipient</p>
        )}
      </div>

      <div>
        <label className="label">Subject (optional)</label>
        <input className="input" {...register("subject")} placeholder="Message subject..." />
      </div>

      <div>
        <label className="label">Message *</label>
        <textarea
          className="input min-h-[120px] resize-y"
          placeholder="Write your message..."
          {...register("body", { required: "Message body is required" })}
        />
        {errors.body && <p className="text-red-400 text-xs mt-1">{errors.body.message}</p>}
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" className="w-4 h-4 rounded accent-yellow-500" {...register("isUrgent")} />
        <span className="text-sm text-text-secondary flex items-center gap-1.5">
          <AlertOctagon size={13} className="text-red-400" /> Mark as urgent
        </span>
      </label>

      <div className="flex justify-end gap-3 pt-2 border-t border-bg-border">
        <button type="button" onClick={onCancel} className="btn-ghost">Cancel</button>
        <button
          type="submit"
          disabled={mutation.isPending || recipients.length === 0}
          className="btn-gold flex items-center gap-2"
        >
          <Send size={14} />
          {mutation.isPending ? "Sending..." : "Send Message"}
        </button>
      </div>
    </form>
  );
}

// ── Message Thread ────────────────────────────────────────────────────────────

function MessageCard({ msg, currentUserId, onReply, onMarkRead }: {
  msg: StaffMessage;
  currentUserId?: string;
  onReply: () => void;
  onMarkRead: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const sender = typeof msg.senderId === "object" ? msg.senderId.email : msg.senderId;
  const isRead = msg.readBy?.some((r) => r.userId === currentUserId);
  const isMine = typeof msg.senderId === "object" ? msg.senderId._id === currentUserId : msg.senderId === currentUserId;

  return (
    <div
      className={`card p-4 space-y-3 transition-all duration-200 hover:border-gold/20 ${
        msg.isUrgent ? "border-red-500/30" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <div className="w-6 h-6 rounded-full bg-gold/10 flex items-center justify-center text-xs font-bold text-gold shrink-0">
              {sender[0]?.toUpperCase()}
            </div>
            <span className="text-xs font-medium text-text-secondary">{sender}</span>
            {msg.isUrgent && (
              <span className="flex items-center gap-0.5 text-xs text-red-400 font-semibold">
                <AlertOctagon size={10} /> Urgent
              </span>
            )}
            {!isRead && !isMine && (
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" title="Unread" />
            )}
          </div>
          {msg.subject && (
            <p className="font-semibold text-sm text-text-primary">{msg.subject}</p>
          )}
        </div>
        <div className="text-xs text-text-muted shrink-0 text-right">
          <p>{formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}</p>
          <p className="mt-0.5 flex items-center gap-0.5 justify-end">
            {msg.status === "read"
              ? <><CheckCheck size={10} className="text-blue-400" /> Read</>
              : <><Circle size={8} /> {msg.status}</>
            }
          </p>
        </div>
      </div>

      <p
        className={`text-sm text-text-secondary leading-relaxed ${!expanded && "line-clamp-2"}`}
        onClick={() => setExpanded((p) => !p)}
        style={{ cursor: "pointer" }}
      >
        {msg.body}
      </p>

      <div className="flex items-center justify-between pt-1 border-t border-bg-border">
        <div className="flex items-center gap-2 text-xs text-text-muted">
          {Array.isArray(msg.recipientIds) && (
            <span>
              To: {msg.recipientIds.map((r) =>
                typeof r === "object" ? r.email : r
              ).join(", ")}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isRead && !isMine && (
            <button onClick={onMarkRead} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
              Mark read
            </button>
          )}
          <button
            onClick={onReply}
            className="flex items-center gap-1 text-xs text-text-muted hover:text-gold transition-colors"
          >
            <Send size={10} /> Reply
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Staff Messages Page ──────────────────────────────────────────────────

export default function StaffMessagesPage() {
  const qc = useQueryClient();
  const [showCompose, setShowCompose] = useState(false);
  const [replyTo,     setReplyTo]     = useState<string | undefined>();

  // Get current user from auth store / local storage
  const currentUser = (() => {
    try { return JSON.parse(localStorage.getItem("user") ?? "{}"); } catch { return {}; }
  })();

  const { data: messages, isLoading } = useQuery<StaffMessage[]>({
    queryKey: ["staff-messages"],
    queryFn: async () => {
      const res = await api.get("/communications/staff-messages");
      return res.data.data;
    },
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/communications/staff-messages/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff-messages"] }),
  });

  const unreadCount = messages?.filter(
    (m) => !m.readBy?.some((r) => r.userId === currentUser._id) &&
      (typeof m.senderId === "object" ? m.senderId._id !== currentUser._id : m.senderId !== currentUser._id)
  ).length ?? 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display font-bold text-3xl text-text-primary">Staff Messages</h1>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="text-text-muted text-sm mt-0.5">Internal team messaging</p>
        </div>
        <button onClick={() => setShowCompose(true)} className="btn-gold flex items-center gap-2">
          <Plus size={15} /> Compose
        </button>
      </div>

      {isLoading ? <PageLoader /> : !messages?.length ? (
        <EmptyState icon="💬" title="No messages" description="Send your first internal staff message"
          action={<button onClick={() => setShowCompose(true)} className="btn-gold">Compose</button>}
        />
      ) : (
        <div className="space-y-3">
          {messages.map((msg) => (
            <MessageCard
              key={msg._id}
              msg={msg}
              currentUserId={currentUser._id}
              onReply={() => { setReplyTo(msg.threadId ?? msg._id); setShowCompose(true); }}
              onMarkRead={() => markReadMutation.mutate(msg._id)}
            />
          ))}
        </div>
      )}

      <Modal
        isOpen={showCompose}
        onClose={() => { setShowCompose(false); setReplyTo(undefined); }}
        title={replyTo ? "Reply" : "New Message"}
        size="md"
      >
        <ComposeForm
          parentId={replyTo}
          onSuccess={() => {
            setShowCompose(false);
            setReplyTo(undefined);
            qc.invalidateQueries({ queryKey: ["staff-messages"] });
          }}
          onCancel={() => { setShowCompose(false); setReplyTo(undefined); }}
        />
      </Modal>
    </div>
  );
}
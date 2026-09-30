import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Play, Pause, Plus, Pencil, Zap, ChevronDown, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import api from "../../../lib/api";
import Modal from "../../../components/ui/Modal";
import { PageLoader } from "../../../components/ui/Spinner";
import EmptyState from "../../../components/ui/EmptyState";
import type { AutomationRule, CommChannel, CommTrigger, AutomationStatus } from "../../../types/communication.types";

const TRIGGER_LABELS: Record<string, string> = {
  birthday:          "🎂 Birthday",
  anniversary:       "💍 Anniversary",
  event_reminder:    "📅 Event Reminder",
  welcome_sequence:  "👋 Welcome Sequence",
  absentee_followup: "🔁 Absentee Follow-Up",
  prayer_chain:      "🙏 Prayer Chain",
  giving_receipt:    "💰 Giving Receipt",
  pledge_reminder:   "📋 Pledge Reminder",
};

const STATUS_CONFIG: Record<AutomationStatus, { color: string; label: string }> = {
  active:   { color: "#10b981", label: "Active"   },
  inactive: { color: "#888",    label: "Inactive" },
  paused:   { color: "#DAA520", label: "Paused"   },
};

const CHANNELS: CommChannel[]  = ["email", "sms", "whatsapp", "push", "in_app"];
const TRIGGERS: CommTrigger[]  = [
  "birthday", "anniversary", "event_reminder", "welcome_sequence",
  "absentee_followup", "prayer_chain", "giving_receipt", "pledge_reminder",
];

// ── Rule Form ─────────────────────────────────────────────────────────────────

function RuleForm({ initial, onSuccess, onCancel }: {
  initial?: AutomationRule; onSuccess: () => void; onCancel: () => void;
}) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      name:        initial?.name        ?? "",
      description: initial?.description ?? "",
      trigger:     initial?.trigger     ?? "birthday",
      status:      initial?.status      ?? "active",
      channel:     initial?.channel     ?? "sms",
      subject:     initial?.subject     ?? "",
      body:        initial?.body        ?? "",
      absenteeThreshold: initial?.conditions?.absenteeThreshold ?? 3,
    },
  });

  const mutation = useMutation({
    mutationFn: (data: any) =>
      initial
        ? api.patch(`/communications/automations/${initial._id}`, data)
        : api.post("/communications/automations", data),
    onSuccess: () => { toast.success(initial ? "Rule updated" : "Rule created"); onSuccess(); },
    onError:   (err: any) => toast.error(err.response?.data?.message || "Failed"),
  });

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate({
      ...d,
      conditions: { absenteeThreshold: Number(d.absenteeThreshold) },
    }))} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Rule Name *</label>
          <input className="input" {...register("name", { required: "Name is required" })} placeholder="e.g. Birthday SMS" />
          {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name?.message as string}</p>}
        </div>
        <div>
          <label className="label">Status</label>
          <select className="input" {...register("status")}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="paused">Paused</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Trigger *</label>
          <select className="input" {...register("trigger")}>
            {TRIGGERS.map((t) => (
              <option key={t} value={t}>{t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Channel *</label>
          <select className="input" {...register("channel")}>
            {CHANNELS.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </select>
        </div>
      </div>

      {watch("trigger") === "absentee_followup" && (
        <div>
          <label className="label">Missed Services Threshold</label>
          <input type="number" className="input" min={1} max={10} {...register("absenteeThreshold")} />
          <p className="text-xs text-text-muted mt-1">Number of missed services before sending follow-up</p>
        </div>
      )}

      {watch("channel") === "email" && (
        <div>
          <label className="label">Email Subject</label>
          <input className="input" placeholder="Use {{firstName}} for personalization" {...register("subject")} />
        </div>
      )}

      <div>
        <label className="label">Message Body *</label>
        <textarea
          className="input min-h-[100px] resize-y font-mono text-sm"
          placeholder="Hello {{firstName}}, ..."
          {...register("body", { required: "Body is required" })}
        />
        <p className="text-xs text-text-muted mt-1">
          Available variables: <span className="text-gold font-mono">{"{{firstName}} {{lastName}} {{fullName}}"}</span>
        </p>
      </div>

      <div>
        <label className="label">Description</label>
        <input className="input" {...register("description")} placeholder="Brief description of this automation..." />
      </div>

      <div className="flex justify-end gap-3 pt-2 border-t border-bg-border">
        <button type="button" onClick={onCancel} className="btn-ghost">Cancel</button>
        <button type="submit" disabled={mutation.isPending} className="btn-gold">
          {mutation.isPending ? "Saving..." : initial ? "Update Rule" : "Create Rule"}
        </button>
      </div>
    </form>
  );
}

// ── Main Automations Page ─────────────────────────────────────────────────────

export default function AutomationsPage() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editing,    setEditing]    = useState<AutomationRule | null>(null);
  const [expanded,   setExpanded]   = useState<string | null>(null);

  const { data: rules, isLoading } = useQuery<AutomationRule[]>({
    queryKey: ["comm-automations"],
    queryFn: async () => {
      const res = await api.get("/communications/automations");
      return res.data.data;
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AutomationStatus }) =>
      api.patch(`/communications/automations/${id}`, { status }),
    onSuccess: () => { toast.success("Status updated"); qc.invalidateQueries({ queryKey: ["comm-automations"] }); },
    onError:   () => toast.error("Failed to update"),
  });

  const runMutation = useMutation({
    mutationFn: (id: string) => api.post(`/communications/automations/${id}/run`),
    onSuccess: () => toast.success("Job triggered manually"),
    onError:   () => toast.error("Failed to trigger job"),
  });

  return (
    <div className="space-y-5">
      <style>{`
        .rule-row { transition: all 0.2s ease; }
        .rule-row:hover { background: rgba(218,165,32,0.03); }
        @keyframes ruleIn { from { opacity:0; transform: translateY(6px); } to { opacity:1; transform: translateY(0); } }
        .rule-row { animation: ruleIn 0.25s ease both; }
      `}</style>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-3xl text-text-primary">Automations</h1>
          <p className="text-text-muted text-sm mt-0.5">Event-driven automated messaging rules</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-gold flex items-center gap-2">
          <Plus size={15} /> New Rule
        </button>
      </div>

      {/* Info banner */}
      <div
        className="rounded-xl px-4 py-3 flex items-center gap-3 text-sm"
        style={{ background: "rgba(218,165,32,0.06)", border: "1px solid rgba(218,165,32,0.15)" }}
      >
        <Zap size={14} className="text-gold shrink-0" />
        <p className="text-text-secondary">
          Automation jobs run on a cron schedule (birthdays & anniversaries at 08:00 WAT, absentee check on Mondays).
          Use <span className="text-gold font-mono">▶ Run</span> to trigger manually.
        </p>
      </div>

      {isLoading ? <PageLoader /> : !rules?.length ? (
        <EmptyState icon="⚡" title="No automation rules" description="Create rules to automate birthday greetings, absentee follow-ups, and more"
          action={<button onClick={() => setShowCreate(true)} className="btn-gold">New Rule</button>}
        />
      ) : (
        <div className="card overflow-hidden divide-y divide-bg-border">
          {rules.map((rule, i) => {
            const cfg = STATUS_CONFIG[rule.status];
            const isExpanded = expanded === rule._id;

            return (
              <div key={rule._id} className="rule-row" style={{ animationDelay: `${i * 0.04}s` }}>
                <div className="p-4 flex items-center gap-4">
                  {/* Status dot */}
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0 mt-0.5"
                    style={{ background: cfg.color, boxShadow: rule.status === "active" ? `0 0 6px ${cfg.color}60` : "none" }}
                  />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-semibold text-sm text-text-primary truncate">{rule.name}</p>
                      <span
                        className="px-1.5 py-0.5 rounded text-xs font-medium shrink-0"
                        style={{ background: `${cfg.color}18`, color: cfg.color }}
                      >
                        {cfg.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-text-muted flex-wrap">
                      <span>{TRIGGER_LABELS[rule.trigger] ?? rule.trigger}</span>
                      {rule.channel && (
                        <span className="capitalize">{rule.channel}</span>
                      )}
                      <span>Sent {rule.sentCount.toLocaleString()}×</span>
                      {rule.lastRunAt && (
                        <span>Last run {format(new Date(rule.lastRunAt), "dd MMM HH:mm")}</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Expand */}
                    <button
                      onClick={() => setExpanded(isExpanded ? null : rule._id)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-hover transition-all"
                    >
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                    {/* Edit */}
                    <button
                      onClick={() => setEditing(rule)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-gold hover:bg-gold/10 transition-all"
                    >
                      <Pencil size={13} />
                    </button>
                    {/* Toggle active/paused */}
                    <button
                      onClick={() => toggleMutation.mutate({
                        id: rule._id,
                        status: rule.status === "active" ? "paused" : "active",
                      })}
                      disabled={toggleMutation.isPending}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:bg-bg-hover transition-all"
                      title={rule.status === "active" ? "Pause" : "Activate"}
                    >
                      {rule.status === "active"
                        ? <Pause size={13} className="text-gold" />
                        : <Play  size={13} className="text-green-400" />
                      }
                    </button>
                    {/* Manual run */}
                    <button
                      onClick={() => { if (confirm(`Manually trigger "${rule.name}"?`)) runMutation.mutate(rule._id); }}
                      disabled={runMutation.isPending}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-bg-border text-xs text-text-muted hover:border-gold/40 hover:text-gold transition-all"
                    >
                      <Zap size={11} /> Run
                    </button>
                  </div>
                </div>

                {/* Expanded body preview */}
                {isExpanded && (
                  <div
                    className="px-6 pb-4 space-y-2"
                    style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
                  >
                    {rule.subject && (
                      <p className="text-xs text-text-muted">
                        Subject: <span className="text-text-secondary font-mono">{rule.subject}</span>
                      </p>
                    )}
                    <div
                      className="text-xs text-text-secondary p-3 rounded-lg font-mono whitespace-pre-wrap"
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
                    >
                      {rule.body ?? "(No body configured)"}
                    </div>
                    {rule.conditions?.absenteeThreshold && (
                      <p className="text-xs text-text-muted">
                        Triggers after <span className="text-gold">{rule.conditions.absenteeThreshold}</span> missed services
                      </p>
                    )}
                    {rule.isSequence && rule.steps.length > 0 && (
                      <div className="space-y-1 mt-2">
                        <p className="text-xs font-semibold text-text-muted uppercase tracking-widest">Sequence Steps</p>
                        {rule.steps.map((s) => (
                          <div key={s.stepIndex} className="flex items-center gap-3 text-xs text-text-muted">
                            <span className="w-5 h-5 flex items-center justify-center rounded-full bg-gold/10 text-gold font-bold text-[10px]">{s.stepIndex + 1}</span>
                            <span>{s.delayHours === 0 ? "Immediately" : `After ${s.delayHours}h`}</span>
                            <span className="capitalize">{s.channel}</span>
                            <span className="flex-1 truncate text-text-secondary">{s.body}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Automation Rule" size="lg">
        <RuleForm
          onSuccess={() => { setShowCreate(false); qc.invalidateQueries({ queryKey: ["comm-automations"] }); }}
          onCancel={() => setShowCreate(false)}
        />
      </Modal>

      {editing && (
        <Modal isOpen={!!editing} onClose={() => setEditing(null)} title="Edit Automation Rule" size="lg">
          <RuleForm
            initial={editing}
            onSuccess={() => { setEditing(null); qc.invalidateQueries({ queryKey: ["comm-automations"] }); }}
            onCancel={() => setEditing(null)}
          />
        </Modal>
      )}
    </div>
  );
}
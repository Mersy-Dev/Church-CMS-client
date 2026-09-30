/**
 * TemplatesPage.tsx  (refactored)
 *
 * Fixes applied:
 *   • Full page scrolls properly (flex + overflow-y-auto + min-h-0)
 *   • UseTemplateModal scrolls inside the modal (max-h + overflow-y-auto)
 *   • All var(--text-*) / var(--bg-border) replaced with explicit Tailwind
 *     gray-* classes so light mode is fully legible
 *   • Channel grid on cards is responsive (wraps on small screens)
 *   • Action buttons pinned outside the scroll area in both modals
 *   • TemplateForm submit button uses form="template-form" so it works
 *     outside the <form> element (pinned footer pattern)
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Pencil, Trash2, Lock,
  Send, Users, UserCheck, Loader2,
  ChevronRight, Eye, Mail, Phone,
  MessageSquare, Smartphone, Bell,
} from "lucide-react";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import api from "../../../lib/api";
import Modal from "../../../components/ui/Modal";
import { PageLoader } from "../../../components/ui/Spinner";
import EmptyState from "../../../components/ui/EmptyState";
import type {
  MessageTemplate,
  TemplateFormData,
  CommChannel,
  CommTrigger,
} from "../../../types/communication.types";
import type { Department } from "../../../types";
import { TemplateVariableFiller } from "../../communication/TemplateVariableFiller";
// ── Static config ─────────────────────────────────────────────────────────────

const CHANNELS: CommChannel[] = ["email", "sms", "whatsapp", "push", "in_app"];

const TRIGGERS: { value: CommTrigger; label: string }[] = [
  { value: "manual_broadcast",  label: "Manual Broadcast"   },
  { value: "birthday",          label: "Birthday"           },
  { value: "anniversary",       label: "Anniversary"        },
  { value: "event_reminder",    label: "Event Reminder"     },
  { value: "welcome_sequence",  label: "Welcome Sequence"   },
  { value: "absentee_followup", label: "Absentee Follow-Up" },
  { value: "prayer_chain",      label: "Prayer Chain"       },
  { value: "giving_receipt",    label: "Giving Receipt"     },
  { value: "pledge_reminder",   label: "Pledge Reminder"    },
];

const CHANNEL_COLORS: Record<CommChannel, string> = {
  email:    "#3b82f6",
  sms:      "#10b981",
  whatsapp: "#22c55e",
  push:     "#8b5cf6",
  in_app:   "#DAA520",
};

const CHANNEL_ICONS: Record<CommChannel, React.ElementType> = {
  email:    Mail,
  sms:      Phone,
  whatsapp: MessageSquare,
  push:     Smartphone,
  in_app:   Bell,
};

// ── Shared styles ─────────────────────────────────────────────────────────────

const inputCls =
  "w-full rounded-lg border border-gray-200 dark:border-gray-700 " +
  "bg-white dark:bg-gray-800 " +
  "text-gray-900 dark:text-gray-100 text-sm px-3 py-2 " +
  "placeholder:text-gray-400 dark:placeholder:text-gray-500 " +
  "focus:outline-none focus:ring-2 focus:ring-yellow-500/40 focus:border-yellow-500 " +
  "transition-colors duration-150";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 tracking-wide uppercase">
      {children}
    </label>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-red-500 dark:text-red-400 text-xs mt-1">{message}</p>;
}

// ── UseTemplateModal ──────────────────────────────────────────────────────────

function UseTemplateModal({
  template,
  onClose,
}: {
  template: MessageTemplate;
  onClose:  () => void;
}) {
  const [mode,            setMode]            = useState<"broadcast" | "direct">("broadcast");
  const [audienceScope,   setAudienceScope]   = useState("all");
  const [selectedDepts,   setSelectedDepts]   = useState<string[]>([]);
  const [recipientId,     setRecipientId]     = useState<string>("");
  const [recipientSearch, setRecipientSearch] = useState("");

  // ── Variable state (replaces old varValues) ────────────────────────────────
  // Only context vars need admin input — merge vars are auto-resolved server-side
  const MERGE_VARS = new Set([
    "firstName","lastName","fullName",
    "email","phone","memberCode","department","role","joinDate",
  ]);
  const contextVarNames = (template.variables ?? []).filter(v => !MERGE_VARS.has(v));
  const [contextValues, setContextValues] = useState<Record<string, string>>(
    Object.fromEntries(contextVarNames.map(v => [v, ""])),
  );
  const allContextFilled = contextVarNames.every(v => (contextValues[v] ?? "").trim().length > 0);
  // ──────────────────────────────────────────────────────────────────────────

  const { data: departments } = useQuery<Department[]>({
    queryKey: ["departments-list"],
    queryFn:  async () => (await api.get("/departments?limit=100")).data.data,
    enabled:  mode === "broadcast" && audienceScope === "department",
  });

  const { data: staffUsers } = useQuery<{ _id: string; email: string; role: string }[]>({
    queryKey: ["staff-users"],
    queryFn:  async () => (await api.get("/auth/users?limit=100")).data.data,
    enabled:  mode === "direct",
  });

  const filteredStaff = staffUsers?.filter(
    (u) => u.email.toLowerCase().includes(recipientSearch.toLowerCase()) && u._id !== recipientId,
  );
  const selectedStaff = staffUsers?.find((u) => u._id === recipientId);

  // ── Mutations (now pass contextVars instead of variables) ──────────────────
  const broadcastMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post("/communications/broadcasts", {
        title:       `[Template] ${template.name}`,
        channel:     template.channel,
        templateId:  template._id,
        subject:     template.subject,
        body:        template.body,
        contextVars: contextValues,       // ← server merges these + recipient profile fields
        audience: {
          scope:         audienceScope,
          departmentIds: audienceScope === "department" ? selectedDepts : undefined,
        },
      });
      await api.post(`/communications/broadcasts/${res.data.data._id}/send`);
    },
    onSuccess: () => { toast.success("Broadcast sent!"); onClose(); },
    onError:   (err: any) => toast.error(err.response?.data?.message || "Send failed"),
  });

  const directMutation = useMutation({
    mutationFn: async () => {
      await api.post("/communications/staff-messages", {
        recipientIds: [recipientId],
        subject:      template.subject,
        body:         template.body,
        channel:      template.channel,
        templateId:   template._id,
        contextVars:  contextValues,      // ← server interpolates before sending
      });
    },
    onSuccess: () => { toast.success("Message sent!"); onClose(); },
    onError:   (err: any) => toast.error(err.response?.data?.message || "Send failed"),
  });

  const isPending = broadcastMutation.isPending || directMutation.isPending;

  const handleSend = () => {
    if (mode === "direct" && !recipientId) {
      toast.error("Select a recipient first"); return;
    }
    if (mode === "broadcast" && audienceScope === "department" && !selectedDepts.length) {
      toast.error("Select at least one department"); return;
    }
    if (mode === "broadcast") broadcastMutation.mutate();
    else directMutation.mutate();
  };

  const toggleDept = (id: string) =>
    setSelectedDepts((p) => p.includes(id) ? p.filter((d) => d !== id) : [...p, id]);

  const channelColor = CHANNEL_COLORS[template.channel] ?? "#DAA520";
  const ChannelIcon  = CHANNEL_ICONS[template.channel]  ?? Bell;

  return (
    <div className="flex flex-col max-h-[78vh] min-h-0">

      {/* ── Scrollable content ── */}
      <div className="overflow-y-auto flex-1 space-y-5 pr-1 pb-2">

        {/* Template summary */}
        <div
        className="rounded-xl p-4"
          style={{ background: `${channelColor}0d`, border: `1px solid ${channelColor}28` }}
        >
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <ChannelIcon size={13} style={{ color: channelColor }} />
            <span className="text-xs font-bold capitalize" style={{ color: channelColor }}>
              {template.channel}
            </span>
            {template.trigger && (
              <span className="text-xs text-gray-400 dark:text-gray-500 capitalize ml-auto">
                {template.trigger.replace(/_/g, " ")}
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-1">
            {template.name}
          </p>
          {template.subject && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              Subject:{" "}
              <span className="font-medium text-gray-700 dark:text-gray-300">{template.subject}</span>
            </p>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-3 leading-relaxed font-mono">
            {template.body}
          </p>
        </div>

        {/* ── Variable filler (replaces old grid of plain inputs) ── */}
        {template.variables && template.variables.length > 0 && (
          <TemplateVariableFiller
            variables={template.variables}
            body={template.body ?? ""}
            subject={template.subject}
            contextValues={contextValues}
            onChange={setContextValues}
          />
        )}

        {/* Send mode */}
        <div>
          <FieldLabel>Send Mode</FieldLabel>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: "broadcast", label: "Broadcast",      desc: "Send to an audience group", icon: <Users size={14} />     },
              { value: "direct",    label: "Direct Message", desc: "Send to one staff member",  icon: <UserCheck size={14} /> },
            ].map((m) => {
              const active = mode === m.value;
              return (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMode(m.value as "broadcast" | "direct")}
                  className={`flex flex-col items-start gap-1 p-3 rounded-xl border text-xs transition-all ${
                    active
                      ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-500/10"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  <span className={`flex items-center gap-1.5 font-bold ${
                    active ? "text-yellow-700 dark:text-yellow-400" : "text-gray-700 dark:text-gray-300"
                  }`}>
                    {m.icon}{m.label}
                  </span>
                  <span className={active
                    ? "text-yellow-600 dark:text-yellow-500 opacity-80"
                    : "text-gray-500 dark:text-gray-400"
                  }>
                    {m.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Broadcast: audience */}
        {mode === "broadcast" && (
          <div className="space-y-3">
            <FieldLabel>Audience</FieldLabel>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "all",        label: "Everyone"   },
                { value: "workers",    label: "Workers"    },
                { value: "department", label: "Department" },
              ].map((s) => {
                const active = audienceScope === s.value;
                return (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setAudienceScope(s.value)}
                    className={`py-2 rounded-xl border text-xs font-semibold transition-all ${
                      active
                        ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
                        : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>

            {audienceScope === "department" && (
              <div>
                <FieldLabel>Select Department(s)</FieldLabel>
                {!departments?.length ? (
                  <p className="text-xs text-gray-400 dark:text-gray-500 italic">Loading departments…</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {departments.map((d) => {
                      const sel = selectedDepts.includes(d._id);
                      return (
                        <button
                          key={d._id}
                          type="button"
                          onClick={() => toggleDept(d._id)}
                          className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-all ${
                            sel
                              ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
                              : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
                          }`}
                        >
                          {d.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Direct: recipient search */}
        {mode === "direct" && (
          <div>
            <FieldLabel>Recipient</FieldLabel>
            {selectedStaff ? (
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-yellow-500 bg-yellow-50 dark:bg-yellow-500/10">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ background: "rgba(218,165,32,0.2)", color: "#b8972e" }}
                >
                  {selectedStaff.email[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
                    {selectedStaff.email}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                    {selectedStaff.role.replace(/_/g, " ")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => { setRecipientId(""); setRecipientSearch(""); }}
                  className="text-xs font-medium text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                >
                  Change
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  className={inputCls}
                  placeholder="Search staff by email…"
                  value={recipientSearch}
                  onChange={(e) => setRecipientSearch(e.target.value)}
                />
                {recipientSearch && filteredStaff && filteredStaff.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-xl bg-white dark:bg-gray-800">
                    {filteredStaff.slice(0, 6).map((u) => (
                      <button
                        key={u._id}
                        type="button"
                        onClick={() => { setRecipientId(u._id); setRecipientSearch(""); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                      >
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                          style={{ background: "rgba(218,165,32,0.12)", color: "#b8972e" }}
                        >
                          {u.email[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-800 dark:text-gray-100 truncate">{u.email}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                            {u.role.replace(/_/g, " ")}
                          </p>
                        </div>
                        <ChevronRight size={12} className="text-gray-400 dark:text-gray-500 shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>{/* end scrollable */}

      {/* ── Pinned action bar ── */}
      <div className="flex justify-end gap-2 pt-3 mt-2 border-t border-gray-100 dark:border-gray-700 shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSend}
          disabled={isPending || !allContextFilled}   // ← blocks send if context vars missing
        className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl text-bg-base disabled:opacity-40 transition-opacity hover:opacity-90"
          style={{ background: "var(--gold, #b8972e)" }}
        >
          {isPending ? (
            <><Loader2 size={14} className="animate-spin" /> Sending…</>
          ) : (
            <><Send size={14} /> {mode === "broadcast" ? "Send Broadcast" : "Send Message"}</>
          )}
        </button>
      </div>
    </div>
  );
}
// ── TemplateForm ──────────────────────────────────────────────────────────────

function TemplateForm({
  initial,
  onSuccess,
  onCancel,
}: {
  initial?: MessageTemplate;
  onSuccess: () => void;
  onCancel:  () => void;
}) {
  const [variables, setVariables] = useState<string[]>(initial?.variables ?? []);
  const [varInput,  setVarInput]  = useState("");
  const [preview,   setPreview]   = useState<{ subject?: string; body: string } | null>(null);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<TemplateFormData>({
    defaultValues: {
      name:        initial?.name        ?? "",
      description: initial?.description ?? "",
      channel:     initial?.channel     ?? "sms",
      trigger:     initial?.trigger,
      subject:     initial?.subject     ?? "",
      body:        initial?.body        ?? "",
    },
  });

  const body    = watch("body")    ?? "";
  const channel = watch("channel") ?? "sms";

  const mutation = useMutation({
    mutationFn: (data: TemplateFormData) =>
      initial
        ? api.patch(`/communications/templates/${initial._id}`, { ...data, variables })
        : api.post("/communications/templates", { ...data, variables }),
    onSuccess: () => { toast.success(initial ? "Template updated" : "Template created"); onSuccess(); },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed"),
  });

  const previewMutation = useMutation({
    mutationFn: () =>
      api.post(`/communications/templates/${initial?._id}/preview`, {
        vars: Object.fromEntries(variables.map((v) => [v, `[${v}]`])),
      }),
    onSuccess: (res) => setPreview(res.data.data),
    onError: () => toast.error("Preview failed"),
  });

  const addVar = () => {
    const v = varInput.trim().replace(/\s+/g, "_");
    if (v && !variables.includes(v)) setVariables((p) => [...p, v]);
    setVarInput("");
  };

  const autoDetect = () => {
    const found = [...body.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]);
    setVariables((prev) => [...new Set([...prev, ...found])]);
    toast.success("Variables detected from body");
  };

  return (
    <div className="flex flex-col max-h-[72vh] min-h-0">

      {/* Scrollable form body */}
      <div className="overflow-y-auto flex-1 pr-1 pb-2">
        <form id="template-form" onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel>Template Name *</FieldLabel>
              <input className={inputCls} {...register("name", { required: "Name is required" })} placeholder="e.g. Birthday SMS" />
              <FieldError message={errors.name?.message} />
            </div>
            <div>
              <FieldLabel>Channel *</FieldLabel>
              <select className={inputCls} {...register("channel")}>
                {CHANNELS.map((c) => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel>Trigger (optional)</FieldLabel>
              <select className={inputCls} {...register("trigger")}>
                <option value="">— None —</option>
                {TRIGGERS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <FieldLabel>Description</FieldLabel>
              <input className={inputCls} {...register("description")} placeholder="Brief description..." />
            </div>
          </div>

          {channel === "email" && (
            <div>
              <FieldLabel>Subject Line</FieldLabel>
              <input className={inputCls} {...register("subject")} placeholder="Hello {{firstName}}, ..." />
            </div>
          )}

          <div>
            <FieldLabel>Body *</FieldLabel>
            <textarea
              className={`${inputCls} min-h-[140px] resize-y font-mono leading-relaxed`}
              placeholder={"Use {{variable}} syntax — e.g. Hello {{firstName}}, ..."}
              {...register("body", { required: "Body is required" })}
            />
            <FieldError message={errors.body?.message} />
            <div className="flex justify-end mt-1.5">
              <button type="button" onClick={autoDetect}
                className="text-xs font-medium text-yellow-600 dark:text-yellow-400 hover:underline">
                Auto-detect variables
              </button>
            </div>
          </div>

          <div>
            <FieldLabel>Variables</FieldLabel>
            {variables.length > 0 && (
              <div className="flex gap-2 mb-2.5 flex-wrap">
                {variables.map((v) => (
                  <span key={v}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono"
                    style={{ background: "rgba(218,165,32,0.12)", color: "#b8972e", border: "1px solid rgba(218,165,32,0.3)" }}>
                    {`{{${v}}}`}
                    <button type="button" onClick={() => setVariables((p) => p.filter((x) => x !== v))}
                      className="ml-0.5 opacity-60 hover:opacity-100 transition-opacity">×</button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input className={`${inputCls} flex-1`} placeholder="Add variable name..."
                value={varInput} onChange={(e) => setVarInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addVar())} />
              <button type="button" onClick={addVar}
                className="px-3 py-2 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                Add
              </button>
            </div>
          </div>

          {preview && (
            <div className="rounded-xl p-4 space-y-2"
              style={{ background: "rgba(218,165,32,0.06)", border: "1px solid rgba(218,165,32,0.2)" }}>
              <p className="text-xs font-bold text-yellow-600 dark:text-yellow-400 uppercase tracking-widest">Preview</p>
              {preview.subject && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Subject:{" "}
                  <span className="text-gray-800 dark:text-gray-200 font-medium">{preview.subject}</span>
                </p>
              )}
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{preview.body}</p>
            </div>
          )}
        </form>
      </div>

      {/* Pinned footer — submit references form by id so it works outside <form> */}
      <div className="flex flex-wrap justify-end gap-2 pt-3 mt-2 border-t border-gray-100 dark:border-gray-700 shrink-0">
        <button type="button" onClick={onCancel}
          className="px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
          Cancel
        </button>
        {initial && (
          <button type="button" onClick={() => previewMutation.mutate()} disabled={previewMutation.isPending}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50">
            <Eye size={14} /> Preview
          </button>
        )}
        <button
          type="submit"
          form="template-form"
          disabled={mutation.isPending}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl text-white disabled:opacity-60 transition-opacity hover:opacity-90"
          style={{ background: "var(--gold, #b8972e)" }}
        >
          {mutation.isPending ? "Saving…" : initial ? "Update Template" : "Create Template"}
        </button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function TemplatesPage() {
  const qc = useQueryClient();
  const [showCreate,    setShowCreate]    = useState(false);
  const [editing,       setEditing]       = useState<MessageTemplate | null>(null);
  const [using,         setUsing]         = useState<MessageTemplate | null>(null);
  const [channelFilter, setChannelFilter] = useState("");

  const { data: templates, isLoading } = useQuery<MessageTemplate[]>({
    queryKey: ["comm-templates-all", channelFilter],
    queryFn: async () => {
      const params = channelFilter ? `?channel=${channelFilter}` : "";
      const res = await api.get(`/communications/templates${params}`);
      return res.data.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/communications/templates/${id}`),
    onSuccess: () => {
      toast.success("Template deleted");
      qc.invalidateQueries({ queryKey: ["comm-templates-all"] });
    },
    onError: () => toast.error("Cannot delete system templates"),
  });

  return (
    <div className="flex flex-col h-full min-h-0 overflow-y-auto">
      <style>{`
        .tmpl-card { transition: border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease; }
        .tmpl-card:hover { border-color: rgba(218,165,32,0.35) !important; transform: translateY(-2px); box-shadow: 0 6px 24px rgba(0,0,0,0.10); }
        @keyframes cardIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .tmpl-card { animation: cardIn 0.3s ease both; }
      `}</style>

      <div className="flex-1 p-4 sm:p-6 space-y-5 max-w-screen-xl mx-auto w-full">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-text-primary">
              Templates
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
              Create reusable templates, then send as broadcasts or direct messages
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="self-start sm:self-auto flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl text-white shrink-0 transition-opacity hover:opacity-90"
            style={{ background: "var(--gold, #b8972e)" }}
          >
            <Plus size={15} /> New Template
          </button>
        </div>

        {/* Channel filter */}
        <div className="flex flex-wrap gap-2">
          {["", ...CHANNELS].map((c) => (
            <button
              key={c || "all"}
              onClick={() => setChannelFilter(c)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold capitalize transition-all ${
                channelFilter === c
                  ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
                  : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
            >
              {c ? c.replace("_", " ") : "All"}
            </button>
          ))}
        </div>

        {/* Cards */}
        {isLoading ? (
          <PageLoader />
        ) : !templates?.length ? (
          <EmptyState
            icon="📝"
            title="No templates yet"
            description="Create reusable message templates for broadcasts, automations, and direct messages"
            action={
              <button onClick={() => setShowCreate(true)}
                className="px-4 py-2 text-sm font-semibold rounded-xl text-white"
                style={{ background: "var(--gold, #b8972e)" }}>
                New Template
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 items-start pb-6">
            {templates.map((t, i) => {
              const color = CHANNEL_COLORS[t.channel] ?? "#888";
              const Icon  = CHANNEL_ICONS[t.channel]  ?? Bell;

              return (
                <div
                  key={t._id}
                  className="tmpl-card rounded-2xl border border-gray-100 dark:border-gray-700/60 bg-white dark:bg-gray-800/60 p-4"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold capitalize"
                          style={{ background: `${color}18`, color, border: `1px solid ${color}35` }}
                        >
                          <Icon size={10} /> {t.channel}
                        </span>
                        {t.isSystem && (
                          <span className="flex items-center gap-0.5 text-xs text-gray-400 dark:text-gray-500">
                            <Lock size={9} /> System
                          </span>
                        )}
                      </div>
                      <p className="font-semibold text-sm text-gray-800 dark:text-gray-100 truncate">
                        {t.name}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => setUsing(t)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all hover:opacity-80"
                        style={{ borderColor: color, background: `${color}12`, color }}
                        title="Use this template"
                      >
                        <Send size={10} /> Use
                      </button>
                      {!t.isSystem && (
                        <>
                          <button onClick={() => setEditing(t)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-500/10 transition-all"
                            title="Edit">
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => { if (confirm("Delete this template?")) deleteMutation.mutate(t._id); }}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
                            title="Delete">
                            <Trash2 size={13} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Body preview */}
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-3 leading-relaxed mb-3">
                    {t.body}
                  </p>

                  {/* Variable pills */}
                  {t.variables?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {t.variables.map((v) => (
                        <span key={v} className="px-1.5 py-0.5 rounded text-xs font-mono"
                          style={{ background: "rgba(218,165,32,0.08)", color: "#b8972e" }}>
                          {`{{${v}}}`}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700/60">
                    <span className="text-xs text-gray-400 dark:text-gray-500">Used {t.usageCount}×</span>
                    {t.trigger && (
                      <span className="text-xs text-gray-400 dark:text-gray-500 capitalize">
                        {t.trigger.replace(/_/g, " ")}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Template" size="lg">
        <TemplateForm
          onSuccess={() => { setShowCreate(false); qc.invalidateQueries({ queryKey: ["comm-templates-all"] }); }}
          onCancel={() => setShowCreate(false)}
        />
      </Modal>

      {/* Edit Modal */}
      {editing && (
        <Modal isOpen={!!editing} onClose={() => setEditing(null)} title="Edit Template" size="lg">
          <TemplateForm
            initial={editing}
            onSuccess={() => { setEditing(null); qc.invalidateQueries({ queryKey: ["comm-templates-all"] }); }}
            onCancel={() => setEditing(null)}
          />
        </Modal>
      )}

      {/* Use Template Modal */}
      {using && (
        <Modal isOpen={!!using} onClose={() => setUsing(null)} title={`Send — ${using.name}`} size="md">
          <UseTemplateModal
            template={using}
            onClose={() => {
              setUsing(null);
              qc.invalidateQueries({ queryKey: ["broadcasts"] });
              qc.invalidateQueries({ queryKey: ["staff-messages"] });
            }}
          />
        </Modal>
      )}
    </div>
  );
}
/**
 * CreateBroadcastForm.tsx
 *
 * Full broadcast pipeline:
 *   1. Pick channel  (email / SMS / WhatsApp / push / in-app)
 *   2. Optionally load a saved template (filtered to that channel)
 *   3. Compose / edit subject + body with live variable hints
 *   4. Choose audience scope  (all / department / workers / custom)
 *   5. Send now  OR  schedule for a future datetime
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import {
  Send, Calendar, Users, FileText,
  Mail, Phone, MessageSquare, Smartphone, Bell,
  ChevronRight, Loader2, Eye, EyeOff,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../lib/api";
import type { CommChannel } from "../../types/communication.types";
import type { Department } from "../../types";

// ── Static config ─────────────────────────────────────────────────────────────

const CHANNELS: { value: CommChannel; label: string; icon: React.ElementType; color: string }[] = [
  { value: "email",    label: "Email",    icon: Mail,          color: "#3b82f6" },
  { value: "sms",      label: "SMS",      icon: Phone,         color: "#10b981" },
  { value: "whatsapp", label: "WhatsApp", icon: MessageSquare, color: "#22c55e" },
  { value: "push",     label: "Push",     icon: Smartphone,    color: "#8b5cf6" },
  { value: "in_app",   label: "In-App",   icon: Bell,          color: "#DAA520" },
];

const AUDIENCE_SCOPES = [
  { value: "all",        label: "Everyone",   desc: "All active members"      },
  { value: "workers",    label: "Workers",    desc: "Staff & volunteers only" },
  { value: "department", label: "Department", desc: "Specific department(s)"  },
  { value: "custom",     label: "Custom",     desc: "Manually-tagged members" },
];

const MERGE_TAGS = ["{{firstName}}", "{{lastName}}", "{{fullName}}", "{{email}}", "{{phone}}"];

// ── Types ─────────────────────────────────────────────────────────────────────

interface TemplateOption {
  _id: string;
  name: string;
  body: string;
  subject?: string;
  variables: string[];
}

interface FormValues {
  title:       string;
  subject:     string;
  body:        string;
  scheduledAt: string;
}

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

// ── Component ─────────────────────────────────────────────────────────────────

export default function CreateBroadcastForm({
  onSuccess,
  onCancel,
}: {
  onSuccess: () => void;
  onCancel:  () => void;
}) {
  const [channel,          setChannel]          = useState<CommChannel>("email");
  const [audienceScope,    setAudienceScope]     = useState("all");
  const [selectedDepts,    setSelectedDepts]     = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate]  = useState<string>("");
  const [sendMode,         setSendMode]          = useState<"now" | "scheduled">("now");
  const [showPreview,      setShowPreview]       = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: { title: "", subject: "", body: "", scheduledAt: "" },
  });

  const body    = watch("body")    ?? "";
  const subject = watch("subject") ?? "";

  // ── Queries ──────────────────────────────────────────────────────────────────

  const { data: templates, isLoading: templatesLoading } = useQuery<TemplateOption[]>({
    queryKey: ["comm-templates-channel", channel],
    queryFn: async () => {
      const res = await api.get(`/communications/templates?channel=${channel}&limit=50`);
      return res.data.data;
    },
  });

  const { data: departments } = useQuery<Department[]>({
    queryKey: ["departments-list"],
    queryFn: async () => {
      const res = await api.get("/departments?limit=100");
      return res.data.data;
    },
    enabled: audienceScope === "department",
  });

  // ── Mutations ────────────────────────────────────────────────────────────────

  const mutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post("/communications/broadcasts", payload);
      const id  = res.data.data._id as string;
      if (sendMode === "now") await api.post(`/communications/broadcasts/${id}/send`);
      return id;
    },
    onSuccess: () => {
      toast.success(sendMode === "now" ? "Broadcast sent!" : "Broadcast scheduled!");
      onSuccess();
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || "Failed to send broadcast"),
  });

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const switchChannel = (ch: CommChannel) => {
    setChannel(ch);
    setSelectedTemplate("");
  };

  const applyTemplate = (templateId: string) => {
    const tpl = templates?.find((t) => t._id === templateId);
    if (!tpl) return;
    setValue("body", tpl.body, { shouldDirty: true });
    if (tpl.subject) setValue("subject", tpl.subject, { shouldDirty: true });
    setSelectedTemplate(templateId);
    toast.success(`Template "${tpl.name}" loaded`);
  };

  const toggleDept = (id: string) =>
    setSelectedDepts((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id],
    );

  const insertTag = (tag: string) =>
    setValue("body", body ? `${body} ${tag}` : tag, { shouldDirty: true });

  const onSubmit = (data: FormValues) => {
    if (audienceScope === "department" && selectedDepts.length === 0) {
      toast.error("Select at least one department");
      return;
    }
    mutation.mutate({
      title:      data.title,
      channel,
      subject:    channel === "email" ? data.subject : undefined,
      body:       data.body,
      templateId: selectedTemplate || undefined,
      audience: {
        scope:         audienceScope,
        departmentIds: audienceScope === "department" ? selectedDepts : undefined,
      },
      scheduledAt: sendMode === "scheduled" ? data.scheduledAt : undefined,
    });
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    /*
      Outer wrapper: scrollable, max height fits inside the modal.
      The form content scrolls; the action buttons stay outside the scroll
      so they're always visible at the bottom.
    */
    <div className="flex flex-col max-h-[78vh] min-h-0">

      {/* ── Scrollable body ── */}
      <div className="overflow-y-auto flex-1 pr-1 space-y-5 pb-2">

        {/* Step 1 — Channel */}
        <Section step={1} title="Choose Channel">
          {/* 5-col on sm+, 3-col on xs to avoid overflow */}
          <div className="grid grid-cols-3 xs:grid-cols-5 sm:grid-cols-5 gap-2">
            {CHANNELS.map(({ value, label, icon: Icon, color }) => {
              const active = channel === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => switchChannel(value)}
                  className="flex flex-col items-center gap-1.5 py-3 px-1 rounded-xl border text-xs font-semibold transition-all"
                  style={{
                    borderColor: active ? color : undefined,
                    background:  active ? `${color}18` : undefined,
                    color:       active ? color : undefined,
                  }}
                  // Fallback border + text for inactive (light mode safe)
                  data-inactive={!active || undefined}
                >
                  <Icon size={16} />
                  <span className={active ? "" : "text-gray-500 dark:text-gray-400"}>
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
          <style>{`
            button[data-inactive] {
              border-color: #e5e7eb;
              background: transparent;
            }
            @media (prefers-color-scheme: dark) {
              button[data-inactive] { border-color: #374151; }
            }
          `}</style>
        </Section>

        {/* Step 2 — Title */}
        <Section step={2} title="Broadcast Title">
          <FieldLabel>Title *</FieldLabel>
          <input
            className={inputCls}
            placeholder="e.g. Sunday Service Update, Monthly Newsletter…"
            {...register("title", { required: "Title is required" })}
          />
          <FieldError message={errors.title?.message} />
        </Section>

        {/* Step 3 — Template */}
        <Section step={3} title="Load a Template" subtitle="Optional — pre-fills subject & body">
          {templatesLoading ? (
            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
              <Loader2 size={12} className="animate-spin" /> Loading templates…
            </p>
          ) : !templates?.length ? (
            <p className="text-xs text-gray-500 dark:text-gray-400 italic">
              No {channel} templates saved yet —{" "}
              <a href="/communications/templates" className="text-yellow-600 dark:text-yellow-400 hover:underline font-medium">
                create one
              </a>
            </p>
          ) : (
            <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-0.5">
              <TemplateChip
                name="— Write from scratch —"
                preview=""
                active={!selectedTemplate}
                onClick={() => setSelectedTemplate("")}
              />
              {templates.map((t) => (
                <TemplateChip
                  key={t._id}
                  name={t.name}
                  preview={t.body}
                  active={selectedTemplate === t._id}
                  onClick={() => applyTemplate(t._id)}
                />
              ))}
            </div>
          )}
        </Section>

        {/* Step 4 — Compose */}
        <Section step={4} title="Compose Message">
          {channel === "email" && (
            <div className="mb-3">
              <FieldLabel>Subject Line *</FieldLabel>
              <input
                className={inputCls}
                placeholder="Hello {{firstName}}, here's this week's update…"
                {...register("subject", {
                  required: channel === "email" ? "Subject is required for email" : false,
                })}
              />
              <FieldError message={errors.subject?.message} />
            </div>
          )}

          <FieldLabel>Message Body *</FieldLabel>
          <textarea
            className={`${inputCls} min-h-[140px] resize-y font-mono leading-relaxed`}
            placeholder={"Hello {{firstName}},\n\nWrite your message here…"}
            {...register("body", { required: "Message body is required" })}
          />
          <FieldError message={errors.body?.message} />

          {/* Merge-tag quick insert */}
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">Insert:</span>
            {MERGE_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => insertTag(tag)}
                className="px-2 py-0.5 rounded text-xs font-mono transition-all border"
                style={{
                  background:   "rgba(218,165,32,0.10)",
                  color:        "#b8972e",
                  borderColor:  "rgba(218,165,32,0.3)",
                }}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Inline preview */}
          {body && (
            <div className="mt-3">
              <button
                type="button"
                onClick={() => setShowPreview((p) => !p)}
                className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                {showPreview ? <EyeOff size={12} /> : <Eye size={12} />}
                {showPreview ? "Hide preview" : "Show preview"}
              </button>
              {showPreview && (
                <div className="mt-2 p-4 rounded-xl text-sm leading-relaxed whitespace-pre-wrap border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300">
                  {channel === "email" && subject && (
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                      Subject: {subject}
                    </p>
                  )}
                  {body}
                </div>
              )}
            </div>
          )}
        </Section>

        {/* Step 5 — Audience */}
        <Section step={5} title="Audience" icon={<Users size={13} className="text-gray-500 dark:text-gray-400" />}>
          <div className="grid grid-cols-2 gap-2">
            {AUDIENCE_SCOPES.map((scope) => {
              const active = audienceScope === scope.value;
              return (
                <button
                  key={scope.value}
                  type="button"
                  onClick={() => setAudienceScope(scope.value)}
                  className={`text-left p-3 rounded-xl border text-xs transition-all ${
                    active
                      ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-500/10"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  <span className={`font-bold block mb-0.5 ${active ? "text-yellow-700 dark:text-yellow-400" : "text-gray-700 dark:text-gray-300"}`}>
                    {scope.label}
                  </span>
                  <span className={active ? "text-yellow-600 dark:text-yellow-500 opacity-80" : "text-gray-500 dark:text-gray-400"}>
                    {scope.desc}
                  </span>
                </button>
              );
            })}
          </div>

          {audienceScope === "department" && (
            <div className="mt-3">
              <FieldLabel>Select Department(s) *</FieldLabel>
              {!departments?.length ? (
                <p className="text-xs text-gray-500 dark:text-gray-400 italic">Loading departments…</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {departments.map((d) => {
                    const selected = selectedDepts.includes(d._id);
                    return (
                      <button
                        key={d._id}
                        type="button"
                        onClick={() => toggleDept(d._id)}
                        className={`px-3 py-1 rounded-lg border text-xs font-medium transition-all ${
                          selected
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
        </Section>

        {/* Step 6 — When to send */}
        <Section step={6} title="When to Send" icon={<Calendar size={13} className="text-gray-500 dark:text-gray-400" />}>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {[
              { value: "now",       label: "Send Now",  desc: "Dispatch immediately" },
              { value: "scheduled", label: "Schedule",  desc: "Pick a date & time"   },
            ].map((m) => {
              const active = sendMode === m.value;
              return (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setSendMode(m.value as "now" | "scheduled")}
                  className={`text-left p-3 rounded-xl border text-xs transition-all ${
                    active
                      ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-500/10"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  <span className={`font-bold block mb-0.5 ${active ? "text-yellow-700 dark:text-yellow-400" : "text-gray-700 dark:text-gray-300"}`}>
                    {m.label}
                  </span>
                  <span className={active ? "text-yellow-600 dark:text-yellow-500 opacity-80" : "text-gray-500 dark:text-gray-400"}>
                    {m.desc}
                  </span>
                </button>
              );
            })}
          </div>

          {sendMode === "scheduled" && (
            <>
              <input
                type="datetime-local"
                className={inputCls}
                {...register("scheduledAt", {
                  required: sendMode === "scheduled" ? "Pick a date & time" : false,
                })}
              />
              <FieldError message={errors.scheduledAt?.message} />
            </>
          )}
        </Section>

      </div>{/* end scrollable body */}

      {/* ── Fixed action bar — always visible ── */}
      <div className="flex flex-wrap justify-end gap-2 pt-3 mt-2 border-t border-gray-100 dark:border-gray-700 shrink-0">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={mutation.isPending}
          onClick={handleSubmit(onSubmit)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl text-bg-base disabled:opacity-60 transition-opacity hover:opacity-90"
          style={{ background: "var(--gold, #b8972e)" }}
        >
          {mutation.isPending ? (
            <><Loader2 size={14} className="animate-spin" /> Sending…</>
          ) : sendMode === "now" ? (
            <><Send size={14} /> Send Broadcast</>
          ) : (
            <><Calendar size={14} /> Schedule Broadcast</>
          )}
        </button>
      </div>

    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Section({
  step,
  title,
  subtitle,
  icon,
  children,
}: {
  step:      number;
  title:     string;
  subtitle?: string;
  icon?:     React.ReactNode;
  children:  React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
          style={{ background: "rgba(218,165,32,0.15)", color: "#b8972e" }}
        >
          {step}
        </span>
        <div className="flex items-center gap-1.5 flex-wrap">
          {icon}
          <p className="text-xs font-bold uppercase tracking-widest text-gray-600 dark:text-gray-400">
            {title}
          </p>
          {subtitle && (
            <span className="text-xs text-gray-400 dark:text-gray-500 normal-case tracking-normal font-normal">
              — {subtitle}
            </span>
          )}
        </div>
      </div>
      <div className="pl-7">{children}</div>
    </div>
  );
}

function TemplateChip({
  name,
  preview,
  active,
  onClick,
}: {
  name:    string;
  preview: string;
  active:  boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 text-left px-3 py-2.5 rounded-xl border text-xs transition-all w-full ${
        active
          ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-500/10"
          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
      }`}
    >
      <FileText
        size={11}
        className={`shrink-0 mt-0.5 ${active ? "text-yellow-600 dark:text-yellow-400" : "text-gray-400 dark:text-gray-500"}`}
      />
      <div className="flex-1 min-w-0">
        <span className={`font-semibold block ${active ? "text-yellow-700 dark:text-yellow-400" : "text-gray-700 dark:text-gray-300"}`}>
          {name}
        </span>
        {preview && (
          <span className="block truncate mt-0.5 text-gray-400 dark:text-gray-500">
            {preview}
          </span>
        )}
      </div>
      {active && <ChevronRight size={12} className="shrink-0 text-yellow-600 dark:text-yellow-400" />}
    </button>
  );
}
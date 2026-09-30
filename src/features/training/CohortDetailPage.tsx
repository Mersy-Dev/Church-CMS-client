import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  ArrowLeft, Users, Plus, Trash2, ChevronRight, Search,
  GraduationCap, Calendar, CheckCircle2, Clock, Award,
} from "lucide-react";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import api from "../../lib/api";
import { PageLoader } from "../../components/ui/Spinner";
import Avatar from "../../components/ui/Avatar";
import Modal from "../../components/ui/Modal";
import StatusBadge from "../../components/ui/StatusBadge";
import type { TrainingCohort, CohortEnrollment, EnrollmentStatus } from "../../types/training.types";
import type { Member } from "../../types";

// ── Word House Brand Colors ───────────────────────────────────────────────────
const NAVY       = "#1A56A0";
const NAVY_LIGHT = "#4A8FD4";
const CRIMSON    = "#C41E3A";
const GREEN      = "#2E8B57";

function fmt(d?: string) {
  if (!d) return "—";
  try { return format(new Date(d), "dd MMM yyyy"); } catch { return "—"; }
}

// Status pills: navy-anchored palette (was gold/indigo/random)
const statusColor: Record<string, { bg: string; text: string; border: string }> = {
  active:    { bg: "rgba(46,139,87,0.1)",   text: GREEN,      border: "rgba(46,139,87,0.25)"  },
  draft:     { bg: "rgba(100,100,100,0.08)", text: "#888",     border: "rgba(100,100,100,0.2)" },
  completed: { bg: "rgba(26,86,160,0.1)",    text: NAVY_LIGHT, border: "rgba(26,86,160,0.25)"  },
  archived:  { bg: "rgba(100,100,100,0.08)", text: "#888",     border: "rgba(100,100,100,0.2)" },
  upcoming:  { bg: "rgba(74,143,212,0.1)",   text: NAVY_LIGHT, border: "rgba(74,143,212,0.25)" },
  graduated: { bg: "rgba(196,30,58,0.1)",    text: CRIMSON,    border: "rgba(196,30,58,0.25)"  },
  cancelled: { bg: "rgba(239,68,68,0.08)",   text: "#f87171",  border: "rgba(239,68,68,0.2)"   },
  enrolled:  { bg: "rgba(26,86,160,0.1)",    text: NAVY_LIGHT, border: "rgba(26,86,160,0.25)"  },
  dropped:   { bg: "rgba(239,68,68,0.08)",   text: "#f87171",  border: "rgba(239,68,68,0.2)"   },
};

function StatusPill({ status }: { status: string }) {
  const c = statusColor[status] ?? statusColor.draft;
  return (
    <span
      className="text-xs px-2.5 py-1 rounded-full font-medium"
      style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}
    >
      {status}
    </span>
  );
}

function Section({ title, icon, action, children }: {
  title: string; icon: React.ReactNode; action?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "var(--bg-card)", border: "1px solid rgba(26,86,160,0.18)" }}
    >
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: "1px solid rgba(26,86,160,0.12)" }}
      >
        <div className="flex items-center gap-2">
          {/* Section icon: navy */}
          <span style={{ color: NAVY }}>{icon}</span>
          {/* Section title: navyLight */}
          <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: NAVY_LIGHT }}>
            {title}
          </h3>
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ── Enroll Members Modal ───────────────────────────────────────────────────────
function EnrollMembersModal({ cohortId, existingMemberIds, onClose, onSuccess }: {
  cohortId: string; existingMemberIds: string[];
  onClose: () => void; onSuccess: () => void;
}) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  const { data: members, isLoading } = useQuery<Member[]>({
    queryKey: ["members-search", search],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "30" });
      if (search) params.set("search", search);
      return (await api.get(`/members?${params}`)).data.data;
    },
  });

  const mutation = useMutation({
    mutationFn: () => api.post(`/training/cohorts/${cohortId}/enroll`, { memberIds: selected }),
    onSuccess: () => { toast.success(`${selected.length} member(s) enrolled`); onSuccess(); },
    onError: (e: any) => toast.error(e.response?.data?.message || "Failed to enroll members"),
  });

  const available = (members ?? []).filter((m) => !existingMemberIds.includes(m._id));
  const toggle = (id: string) =>
    setSelected((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: NAVY_LIGHT }} />
        <input className="input pl-9" placeholder="Search members..." value={search}
          onChange={(e) => setSearch(e.target.value)} autoFocus />
      </div>
      <div className="space-y-1 max-h-72 overflow-y-auto">
        {isLoading ? (
          <p className="text-sm text-center py-6 text-text-muted">Searching...</p>
        ) : available.length === 0 ? (
          <p className="text-sm text-center py-6 text-text-muted">
            {search ? "No members found" : "All members already enrolled"}
          </p>
        ) : (
          available.map((m) => {
            const checked = selected.includes(m._id);
            return (
              <label
                key={m._id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors"
                style={{ background: checked ? "rgba(26,86,160,0.1)" : "transparent" }}
              >
                {/* Checkbox: navy */}
                <input type="checkbox" checked={checked} onChange={() => toggle(m._id)}
                  className="w-4 h-4 rounded" style={{ accentColor: NAVY }} />
                <Avatar name={`${m.firstName} ${m.lastName}`} photoUrl={m.photoUrl} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate text-text-primary">{m.firstName} {m.lastName}</p>
                  <p className="text-xs text-text-muted">{m.membershipId}{m.phone ? ` · ${m.phone}` : ""}</p>
                </div>
                {/* Checkmark: navyLight (was gold) */}
                {checked && <span className="text-xs font-bold" style={{ color: NAVY_LIGHT }}>✓</span>}
              </label>
            );
          })
        )}
      </div>
      {selected.length > 0 && (
        <p className="text-xs text-center font-medium" style={{ color: NAVY_LIGHT }}>
          {selected.length} member{selected.length !== 1 ? "s" : ""} selected
        </p>
      )}
      <div className="flex justify-end gap-3 pt-2">
        <button onClick={onClose} className="btn-ghost">Cancel</button>
        {/* Enroll button: navy (was gold) */}
        <button
          onClick={() => mutation.mutate()}
          disabled={selected.length === 0 || mutation.isPending}
          className="px-4 py-2 rounded-lg font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: NAVY }}
          onMouseEnter={(e) => { if (!mutation.isPending) (e.currentTarget as HTMLElement).style.background = "#164882"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = NAVY; }}
        >
          {mutation.isPending ? "Enrolling..." : `Enroll ${selected.length || ""} Member${selected.length !== 1 ? "s" : ""}`}
        </button>
      </div>
    </div>
  );
}

// ── Attendance Modal ───────────────────────────────────────────────────────────
function MarkAttendanceModal({ cohortId, enrollments, members, onClose, onSuccess }: {
  cohortId: string; enrollments: CohortEnrollment[];
  members: Member[]; onClose: () => void; onSuccess: () => void;
}) {
  const today = new Date().toISOString().split("T")[0];
  const { register, handleSubmit } = useForm({
    defaultValues: { title: `Session — ${fmt(today)}`, date: today, notes: "" },
  });
  const [attendance, setAttendance] = useState<Record<string, "present" | "absent" | "excused">>({});

  const mutation = useMutation({
    mutationFn: (data: any) => api.post(`/training/cohorts/${cohortId}/sessions`, {
      ...data,
      attendance: Object.entries(attendance).map(([memberId, status]) => ({ memberId, status })),
    }),
    onSuccess: () => { toast.success("Session recorded"); onSuccess(); },
    onError: (e: any) => toast.error(e.response?.data?.message || "Failed to record session"),
  });

  const setStatus = (memberId: string, status: "present" | "absent" | "excused") =>
    setAttendance((p) => ({ ...p, [memberId]: status }));

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Session Title</label>
          <input className="input" {...register("title", { required: true })} />
        </div>
        <div>
          <label className="label">Date</label>
          <input type="date" className="input" {...register("date", { required: true })} />
        </div>
      </div>
      <div>
        <label className="label">Notes (optional)</label>
        <textarea className="input resize-none" rows={2} {...register("notes")} />
      </div>

      <div>
        <p className="label mb-2">Attendance ({enrollments.length} members)</p>
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {enrollments.map((e) => {
            const memberId = typeof e.memberId === "object" ? e.memberId._id : e.memberId;
            const member = members.find((m) => m._id === memberId);
            const name = member ? `${member.firstName} ${member.lastName}` : memberId;
            const current = attendance[memberId];
            return (
              <div
                key={memberId}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                style={{ background: "var(--bg-hover)" }}
              >
                <Avatar name={name} photoUrl={member?.photoUrl} size="sm" />
                <span className="flex-1 text-sm font-medium truncate text-text-primary">{name}</span>
                <div className="flex items-center gap-1">
                  {(["present", "absent", "excused"] as const).map((s) => {
                    // Attendance colors kept meaningful (green/red/amber)
                    const colors = {
                      present: { active: "#4ade80", bg: "rgba(34,197,94,0.15)" },
                      absent:  { active: "#f87171", bg: "rgba(239,68,68,0.15)" },
                      excused: { active: "#facc15", bg: "rgba(234,179,8,0.15)" },
                    };
                    const isActive = current === s;
                    return (
                      <button type="button" key={s} onClick={() => setStatus(memberId, s)}
                        className="px-2 py-1 rounded-lg text-xs font-medium transition-all"
                        style={{
                          background: isActive ? colors[s].bg : "transparent",
                          color: isActive ? colors[s].active : "var(--text-muted)",
                          border: `1px solid ${isActive ? colors[s].active + "40" : "transparent"}`,
                        }}
                      >
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
        {/* Save Session: navy (was gold) */}
        <button
          type="submit" disabled={mutation.isPending}
          className="px-4 py-2 rounded-lg font-semibold text-white transition-all disabled:opacity-50"
          style={{ background: NAVY }}
          onMouseEnter={(e) => { if (!mutation.isPending) (e.currentTarget as HTMLElement).style.background = "#164882"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = NAVY; }}
        >
          {mutation.isPending ? "Saving..." : "Save Session"}
        </button>
      </div>
    </form>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function CohortDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showEnroll, setShowEnroll] = useState(false);
  const [showAttendance, setShowAttendance] = useState(false);
  const [removingEnrollment, setRemovingEnrollment] = useState<string | null>(null);
  const [graduatingMember, setGraduatingMember] = useState<string | null>(null);

  const { data: cohort, isLoading } = useQuery<TrainingCohort>({
    queryKey: ["training-cohort", id],
    queryFn: async () => (await api.get(`/training/cohorts/${id}`)).data.data,
    enabled: !!id,
  });

  const { data: allMembers } = useQuery<Member[]>({
    queryKey: ["members-list"],
    queryFn: async () => (await api.get("/members?limit=200")).data.data,
  });

  const unenroll = useMutation({
    mutationFn: (memberId: string) => api.delete(`/training/cohorts/${id}/enrollments/${memberId}`),
    onSuccess: () => {
      toast.success("Member unenrolled");
      qc.invalidateQueries({ queryKey: ["training-cohort", id] });
      setRemovingEnrollment(null);
    },
    onError: () => toast.error("Failed to unenroll member"),
  });

  const graduate = useMutation({
    mutationFn: (memberId: string) =>
      api.patch(`/training/cohorts/${id}/enrollments/${memberId}`, {
        status: "graduated", graduatedAt: new Date().toISOString(),
      }),
    onSuccess: () => {
      toast.success("Member graduated! 🎓");
      qc.invalidateQueries({ queryKey: ["training-cohort", id] });
      setGraduatingMember(null);
    },
    onError: () => toast.error("Failed to graduate member"),
  });

  if (isLoading) return <PageLoader />;
  if (!cohort) return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
      <p className="text-text-muted">Cohort not found.</p>
      <button onClick={() => navigate("/training")} className="btn-ghost flex items-center gap-2">
        <ArrowLeft size={16} /> Back to Training
      </button>
    </div>
  );

  const enrollments: CohortEnrollment[] = cohort.enrollments ?? [];
  const sessions = cohort.sessions ?? [];
  const programName = typeof cohort.programId === "object" ? cohort.programId.name : "—";
  const existingMemberIds = enrollments.map((e) =>
    typeof e.memberId === "object" ? e.memberId._id : e.memberId);

  const getMember = (ref: any): Member | undefined => {
    if (typeof ref === "object" && ref?.firstName) return ref as Member;
    return allMembers?.find((m) => m._id === ref);
  };

  const graduated = enrollments.filter((e) => e.status === "graduated");
  const active    = enrollments.filter((e) => e.status !== "graduated" && e.status !== "dropped");
  const dropped   = enrollments.filter((e) => e.status === "dropped");

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <style>{`
        /* ── Word House Brand Colors ────────────────────────────────────────
           Dominant  : #1A56A0  (Word House Navy Blue)
           Accent    : #C41E3A  (Word House Crimson)
           TEXT RULE : Always CSS vars for body text — no hardcoded dark hex.
        ──────────────────────────────────────────────────────────────────── */
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .ds { animation: slideUp 0.35s ease both; }
        .ds:nth-child(1) { animation-delay: .05s; }
        .ds:nth-child(2) { animation-delay: .10s; }
        .ds:nth-child(3) { animation-delay: .15s; }
        .ds:nth-child(4) { animation-delay: .20s; }
        .ds:nth-child(5) { animation-delay: .25s; }

        .erow { transition: background 0.15s; }
        .erow:hover { background: rgba(26,86,160,0.05) !important; }

        .back-btn { color: var(--text-muted); transition: color 0.15s; }
        .back-btn:hover { color: #4A8FD4; }
      `}</style>

      {/* Back */}
      <button onClick={() => navigate("/training")} className="back-btn flex items-center gap-2 text-sm">
        <ArrowLeft size={16} /> Back to Training
      </button>

      {/* Hero */}
      <div
        className="ds rounded-2xl p-6"
        style={{
          background: "var(--bg-card)",
          border: "1.5px solid rgba(26,86,160,0.25)",
          boxShadow: "0 4px 24px rgba(26,86,160,0.08)",
        }}
      >
        <div className="flex items-start gap-4">
          {/* Icon: navy (was indigo) */}
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(26,86,160,0.12)", border: "1px solid rgba(26,86,160,0.25)" }}
          >
            <Users size={22} style={{ color: NAVY_LIGHT }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-display font-bold text-2xl text-text-primary">{cohort.name}</h1>
              <StatusPill status={cohort.status} />
            </div>
            <p className="mt-1 text-sm text-text-muted">
              Program: <span style={{ color: NAVY_LIGHT, fontWeight: 600 }}>{programName}</span>
            </p>
            <div className="flex items-center gap-5 mt-2 flex-wrap">
              {cohort.startDate && (
                <span className="flex items-center gap-1.5 text-xs text-text-muted">
                  <Calendar size={12} style={{ color: NAVY }} />
                  {fmt(cohort.startDate)}{cohort.endDate ? ` → ${fmt(cohort.endDate)}` : ""}
                </span>
              )}
              <span className="flex items-center gap-1.5 text-xs text-text-muted">
                <Users size={12} style={{ color: NAVY }} />
                {enrollments.length}{cohort.maxEnrollment ? `/${cohort.maxEnrollment}` : ""} enrolled
              </span>
              {/* Graduated count: crimson */}
              <span className="flex items-center gap-1.5 text-xs text-text-muted">
                <GraduationCap size={12} style={{ color: CRIMSON }} /> {graduated.length} graduated
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="ds grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Enrolled",  value: active.length,    color: NAVY_LIGHT },
          { label: "Graduated", value: graduated.length, color: CRIMSON    },
          { label: "Dropped",   value: dropped.length,   color: "#f87171"  },
          { label: "Sessions",  value: sessions.length,  color: GREEN      },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="rounded-xl p-4 text-center"
            style={{ background: "var(--bg-card)", border: `1px solid ${color}28` }}
          >
            <p className="text-2xl font-bold font-display" style={{ color }}>{value}</p>
            <p className="text-xs mt-0.5 text-text-muted">{label}</p>
          </div>
        ))}
      </div>

      {/* Enrolled Members */}
      <div className="ds">
        <Section
          title={`Enrolled Members (${enrollments.length})`}
          icon={<Users size={15} />}
          action={
            <div className="flex items-center gap-2">
              {/* Mark Attendance: navy tint */}
              <button
                onClick={() => setShowAttendance(true)}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
                style={{ background: "rgba(26,86,160,0.1)", color: NAVY_LIGHT, border: "1px solid rgba(26,86,160,0.25)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(26,86,160,0.18)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(26,86,160,0.1)"; }}
              >
                <CheckCircle2 size={13} /> Mark Attendance
              </button>
              {/* Enroll Members: crimson tint (accent) */}
              <button
                onClick={() => setShowEnroll(true)}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
                style={{ background: "rgba(196,30,58,0.1)", color: CRIMSON, border: "1px solid rgba(196,30,58,0.25)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(196,30,58,0.18)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(196,30,58,0.1)"; }}
              >
                <Plus size={13} /> Enroll Members
              </button>
            </div>
          }
        >
          {enrollments.length === 0 ? (
            <div className="text-center py-8">
              <Users size={32} className="mx-auto mb-3 opacity-20 text-text-muted" />
              <p className="text-sm text-text-muted">No members enrolled yet</p>
              <button
                onClick={() => setShowEnroll(true)}
                className="mt-3 text-xs font-medium transition-opacity hover:opacity-70"
                style={{ color: NAVY_LIGHT }}
              >
                + Enroll first member
              </button>
            </div>
          ) : (
            <div className="-mx-5 -mb-5">
              {enrollments.map((e, i) => {
                const memberId = typeof e.memberId === "object" ? e.memberId._id : e.memberId;
                const m = getMember(e.memberId);
                const name = m ? `${m.firstName} ${m.lastName}` : memberId;
                return (
                  <div
                    key={memberId}
                    className="erow flex items-center gap-3 px-5 py-3"
                    style={{ borderTop: i === 0 ? "none" : "1px solid rgba(26,86,160,0.08)" }}
                  >
                    <Avatar name={name} photoUrl={m?.photoUrl} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate text-text-primary">{name}</p>
                      <p className="text-xs text-text-muted">
                        Enrolled {fmt(e.enrolledAt)}{e.graduatedAt ? ` · Graduated ${fmt(e.graduatedAt)}` : ""}
                      </p>
                    </div>
                    <StatusPill status={e.status} />
                    {m && (
                      <button
                        onClick={() => navigate(`/members/${m._id}`)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary opacity-40 hover:opacity-100 transition-all"
                      >
                        <ChevronRight size={14} />
                      </button>
                    )}
                    {/* Graduate button: crimson (was gold) */}
                    {e.status !== "graduated" && (
                      <button
                        onClick={() => setGraduatingMember(memberId)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg opacity-40 hover:opacity-100 transition-all"
                        style={{ color: CRIMSON }}
                        title="Graduate"
                      >
                        <Award size={13} />
                      </button>
                    )}
                    <button
                      onClick={() => setRemovingEnrollment(memberId)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-text-muted hover:text-red-400 hover:bg-red-500/10 opacity-40 hover:opacity-100 transition-all"
                      title="Remove"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </Section>
      </div>

      {/* Session history */}
      {sessions.length > 0 && (
        <div className="ds">
          <Section title={`Sessions (${sessions.length})`} icon={<Clock size={15} />}>
            <div className="space-y-3">
              {[...sessions].reverse().map((s, i) => {
                const present = s.attendance?.filter((a) => a.status === "present").length ?? 0;
                const total = s.attendance?.length ?? 0;
                return (
                  <div
                    key={s._id ?? i}
                    className="rounded-xl p-4"
                    style={{ background: "rgba(26,86,160,0.05)", border: "1px solid rgba(26,86,160,0.12)" }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-text-primary">{s.title}</p>
                      <span className="text-xs text-text-muted">{fmt(s.date)}</span>
                    </div>
                    {total > 0 && (
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${(present / total) * 100}%`, background: GREEN }}
                          />
                        </div>
                        <span className="text-xs flex-shrink-0 text-text-muted">{present}/{total} present</span>
                      </div>
                    )}
                    {s.notes && <p className="text-xs mt-1.5 text-text-muted">{s.notes}</p>}
                  </div>
                );
              })}
            </div>
          </Section>
        </div>
      )}

      {/* Meta */}
      <div
        className="ds rounded-xl px-5 py-3 flex gap-6 flex-wrap"
        style={{ background: "var(--bg-card)", border: "1px solid rgba(26,86,160,0.15)" }}
      >
        {[["Created", cohort.createdAt], ["Updated", cohort.updatedAt]].map(([l, v]) => (
          <div key={l}>
            <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: NAVY_LIGHT }}>{l}</p>
            <p className="text-sm font-medium text-text-primary">{fmt(v)}</p>
          </div>
        ))}
      </div>

      {/* Enroll Modal */}
      <Modal isOpen={showEnroll} onClose={() => setShowEnroll(false)} title="Enroll Members" size="md">
        <EnrollMembersModal
          cohortId={id!} existingMemberIds={existingMemberIds}
          onClose={() => setShowEnroll(false)}
          onSuccess={() => { qc.invalidateQueries({ queryKey: ["training-cohort", id] }); setShowEnroll(false); }}
        />
      </Modal>

      {/* Attendance Modal */}
      <Modal isOpen={showAttendance} onClose={() => setShowAttendance(false)} title="Record Session Attendance" size="lg">
        <MarkAttendanceModal
          cohortId={id!} enrollments={enrollments} members={allMembers ?? []}
          onClose={() => setShowAttendance(false)}
          onSuccess={() => { qc.invalidateQueries({ queryKey: ["training-cohort", id] }); setShowAttendance(false); }}
        />
      </Modal>

      {/* Graduate confirm */}
      <Modal isOpen={!!graduatingMember} onClose={() => setGraduatingMember(null)} title="Graduate Member" size="sm">
        <p className="text-text-secondary mb-5">
          Mark this member as graduated from <strong>{cohort.name}</strong>?
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setGraduatingMember(null)} className="btn-ghost">Cancel</button>
          {/* Graduate: crimson (fits "achievement" semantic) */}
          <button
            onClick={() => graduatingMember && graduate.mutate(graduatingMember)}
            disabled={graduate.isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-white transition-all disabled:opacity-50"
            style={{ background: CRIMSON }}
            onMouseEnter={(e) => { if (!graduate.isPending) (e.currentTarget as HTMLElement).style.background = "#a01830"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = CRIMSON; }}
          >
            <GraduationCap size={14} />
            {graduate.isPending ? "Graduating..." : "Graduate 🎓"}
          </button>
        </div>
      </Modal>

      {/* Unenroll confirm */}
      <Modal isOpen={!!removingEnrollment} onClose={() => setRemovingEnrollment(null)} title="Unenroll Member" size="sm">
        <p className="text-text-secondary mb-5">Remove this member from the cohort?</p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setRemovingEnrollment(null)} className="btn-ghost">Cancel</button>
          <button
            onClick={() => removingEnrollment && unenroll.mutate(removingEnrollment)}
            className="btn-danger" disabled={unenroll.isPending}
          >
            {unenroll.isPending ? "Removing..." : "Unenroll"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
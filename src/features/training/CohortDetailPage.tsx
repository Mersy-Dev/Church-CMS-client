import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  ArrowLeft,
  Users,
  Plus,
  Trash2,
  ChevronRight,
  Search,
  GraduationCap,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Award,
} from "lucide-react";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import api from "../../lib/api";
import { PageLoader } from "../../components/ui/Spinner";
import Avatar from "../../components/ui/Avatar";
import Modal from "../../components/ui/Modal";
import StatusBadge from "../../components/ui/StatusBadge";
import type {
  TrainingCohort,
  CohortEnrollment,
  EnrollmentStatus,
} from "../../types/training.types";
import type { Member } from "../../types";

function fmt(d?: string) {
  if (!d) return "—";
  try {
    return format(new Date(d), "dd MMM yyyy");
  } catch {
    return "—";
  }
}

const statusColor: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  active: {
    bg: "rgba(34,197,94,0.08)",
    text: "#4ade80",
    border: "rgba(34,197,94,0.2)",
  },
  draft: {
    bg: "rgba(148,163,184,0.08)",
    text: "#94a3b8",
    border: "rgba(148,163,184,0.2)",
  },
  completed: {
    bg: "rgba(218,165,32,0.08)",
    text: "#DAA520",
    border: "rgba(218,165,32,0.2)",
  },
  archived: {
    bg: "rgba(100,100,100,0.08)",
    text: "#888",
    border: "rgba(100,100,100,0.2)",
  },
  upcoming: {
    bg: "rgba(99,102,241,0.08)",
    text: "#818cf8",
    border: "rgba(99,102,241,0.2)",
  },
  graduated: {
    bg: "rgba(218,165,32,0.08)",
    text: "#DAA520",
    border: "rgba(218,165,32,0.2)",
  },
  cancelled: {
    bg: "rgba(239,68,68,0.08)",
    text: "#f87171",
    border: "rgba(239,68,68,0.2)",
  },
  enrolled: {
    bg: "rgba(99,102,241,0.08)",
    text: "#818cf8",
    border: "rgba(99,102,241,0.2)",
  },
  dropped: {
    bg: "rgba(239,68,68,0.08)",
    text: "#f87171",
    border: "rgba(239,68,68,0.2)",
  },
};

function StatusPill({ status }: { status: string }) {
  const c = statusColor[status] ?? statusColor.draft;
  return (
    <span
      className="text-xs px-2.5 py-1 rounded-full font-medium"
      style={{
        background: c.bg,
        color: c.text,
        border: `1px solid ${c.border}`,
      }}
    >
      {status}
    </span>
  );
}

function Section({
  title,
  icon,
  action,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--bg-border)",
      }}
    >
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: "1px solid var(--bg-border)" }}
      >
        <div className="flex items-center gap-2">
          <span style={{ color: "#DAA520" }}>{icon}</span>
          <h3
            className="text-sm font-semibold uppercase tracking-wide"
            style={{ color: "var(--text-secondary)" }}
          >
            {title}
          </h3>
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ── Enroll Members Modal ───────────────────────────────────────────────────

function EnrollMembersModal({
  cohortId,
  existingMemberIds,
  onClose,
  onSuccess,
}: {
  cohortId: string;
  existingMemberIds: string[];
  onClose: () => void;
  onSuccess: () => void;
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
    mutationFn: () =>
      api.post(`/training/cohorts/${cohortId}/enroll`, { memberIds: selected }),
    onSuccess: () => {
      toast.success(`${selected.length} member(s) enrolled`);
      onSuccess();
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.message || "Failed to enroll members"),
  });

  const available = (members ?? []).filter(
    (m) => !existingMemberIds.includes(m._id),
  );
  const toggle = (id: string) =>
    setSelected((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : [...p, id],
    );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: "var(--text-muted)" }}
        />
        <input
          className="input pl-9"
          placeholder="Search members..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />
      </div>
      <div className="space-y-1 max-h-72 overflow-y-auto">
        {isLoading ? (
          <p
            className="text-sm text-center py-6"
            style={{ color: "var(--text-muted)" }}
          >
            Searching...
          </p>
        ) : available.length === 0 ? (
          <p
            className="text-sm text-center py-6"
            style={{ color: "var(--text-muted)" }}
          >
            {search ? "No members found" : "All members already enrolled"}
          </p>
        ) : (
          available.map((m) => {
            const checked = selected.includes(m._id);
            return (
              <label
                key={m._id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors"
                style={{
                  background: checked ? "rgba(218,165,32,0.07)" : "transparent",
                }}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(m._id)}
                  className="w-4 h-4 rounded accent-yellow-500"
                />
                <Avatar
                  name={`${m.firstName} ${m.lastName}`}
                  photoUrl={m.photoUrl}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium truncate"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {m.firstName} {m.lastName}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {m.membershipId}
                    {m.phone ? ` · ${m.phone}` : ""}
                  </p>
                </div>
                {checked && (
                  <span
                    className="text-xs font-bold"
                    style={{ color: "#DAA520" }}
                  >
                    ✓
                  </span>
                )}
              </label>
            );
          })
        )}
      </div>
      {selected.length > 0 && (
        <p className="text-xs text-center" style={{ color: "#DAA520" }}>
          {selected.length} member{selected.length !== 1 ? "s" : ""} selected
        </p>
      )}
      <div className="flex justify-end gap-3 pt-2">
        <button onClick={onClose} className="btn-ghost">
          Cancel
        </button>
        <button
          onClick={() => mutation.mutate()}
          disabled={selected.length === 0 || mutation.isPending}
          className="btn-gold"
        >
          {mutation.isPending
            ? "Enrolling..."
            : `Enroll ${selected.length || ""} Member${selected.length !== 1 ? "s" : ""}`}
        </button>
      </div>
    </div>
  );
}

// ── Attendance Modal ───────────────────────────────────────────────────────

function MarkAttendanceModal({
  cohortId,
  enrollments,
  members,
  onClose,
  onSuccess,
}: {
  cohortId: string;
  enrollments: CohortEnrollment[];
  members: Member[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const today = new Date().toISOString().split("T")[0];
  const { register, handleSubmit } = useForm({
    defaultValues: { title: `Session — ${fmt(today)}`, date: today, notes: "" },
  });
  const [attendance, setAttendance] = useState<
    Record<string, "present" | "absent" | "excused">
  >({});

  const mutation = useMutation({
    mutationFn: (data: any) =>
      api.post(`/training/cohorts/${cohortId}/sessions`, {
        ...data,
        attendance: Object.entries(attendance).map(([memberId, status]) => ({
          memberId,
          status,
        })),
      }),
    onSuccess: () => {
      toast.success("Session recorded");
      onSuccess();
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.message || "Failed to record session"),
  });

  const setStatus = (
    memberId: string,
    status: "present" | "absent" | "excused",
  ) => setAttendance((p) => ({ ...p, [memberId]: status }));

  return (
    <form
      onSubmit={handleSubmit((d) => mutation.mutate(d))}
      className="space-y-4"
    >
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Session Title</label>
          <input className="input" {...register("title", { required: true })} />
        </div>
        <div>
          <label className="label">Date</label>
          <input
            type="date"
            className="input"
            {...register("date", { required: true })}
          />
        </div>
      </div>
      <div>
        <label className="label">Notes (optional)</label>
        <textarea
          className="input resize-none"
          rows={2}
          {...register("notes")}
        />
      </div>

      <div>
        <p className="label mb-2">Attendance ({enrollments.length} members)</p>
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {enrollments.map((e) => {
            const memberId =
              typeof e.memberId === "object" ? e.memberId._id : e.memberId;
            const member = members.find((m) => m._id === memberId);
            const name = member
              ? `${member.firstName} ${member.lastName}`
              : memberId;
            const current = attendance[memberId];
            return (
              <div
                key={memberId}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                style={{ background: "var(--bg-hover)" }}
              >
                <Avatar name={name} photoUrl={member?.photoUrl} size="sm" />
                <span
                  className="flex-1 text-sm font-medium truncate"
                  style={{ color: "var(--text-primary)" }}
                >
                  {name}
                </span>
                <div className="flex items-center gap-1">
                  {(["present", "absent", "excused"] as const).map((s) => {
                    const colors = {
                      present: {
                        active: "#4ade80",
                        bg: "rgba(34,197,94,0.15)",
                      },
                      absent: { active: "#f87171", bg: "rgba(239,68,68,0.15)" },
                      excused: {
                        active: "#facc15",
                        bg: "rgba(234,179,8,0.15)",
                      },
                    };
                    const isActive = current === s;
                    return (
                      <button
                        type="button"
                        key={s}
                        onClick={() => setStatus(memberId, s)}
                        className="px-2 py-1 rounded-lg text-xs font-medium transition-all"
                        style={{
                          background: isActive ? colors[s].bg : "transparent",
                          color: isActive
                            ? colors[s].active
                            : "var(--text-muted)",
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
        <button type="button" onClick={onClose} className="btn-ghost">
          Cancel
        </button>
        <button
          type="submit"
          disabled={mutation.isPending}
          className="btn-gold"
        >
          {mutation.isPending ? "Saving..." : "Save Session"}
        </button>
      </div>
    </form>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function CohortDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showEnroll, setShowEnroll] = useState(false);
  const [showAttendance, setShowAttendance] = useState(false);
  const [removingEnrollment, setRemovingEnrollment] = useState<string | null>(
    null,
  );
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
    mutationFn: (memberId: string) =>
      api.delete(`/training/cohorts/${id}/enrollments/${memberId}`),
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
        status: "graduated",
        graduatedAt: new Date().toISOString(),
      }),
    onSuccess: () => {
      toast.success("Member graduated! 🎓");
      qc.invalidateQueries({ queryKey: ["training-cohort", id] });
      setGraduatingMember(null);
    },
    onError: () => toast.error("Failed to graduate member"),
  });

  if (isLoading) return <PageLoader />;
  if (!cohort)
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
        <p style={{ color: "var(--text-muted)" }}>Cohort not found.</p>
        <button
          onClick={() => navigate("/training")}
          className="btn-ghost flex items-center gap-2"
        >
          <ArrowLeft size={16} /> Back to Training
        </button>
      </div>
    );

  const enrollments: CohortEnrollment[] = cohort.enrollments ?? [];
  const sessions = cohort.sessions ?? [];
  const programName =
    typeof cohort.programId === "object" ? cohort.programId.name : "—";
  const existingMemberIds = enrollments.map((e) =>
    typeof e.memberId === "object" ? e.memberId._id : e.memberId,
  );

  const getMember = (ref: any): Member | undefined => {
    if (typeof ref === "object" && ref?.firstName) return ref as Member;
    return allMembers?.find((m) => m._id === ref);
  };

  const graduated = enrollments.filter((e) => e.status === "graduated");
  const active = enrollments.filter(
    (e) => e.status !== "graduated" && e.status !== "dropped",
  );
  const dropped = enrollments.filter((e) => e.status === "dropped");

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <style>{`
        @keyframes slideUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        .ds{animation:slideUp 0.35s ease both}
        .ds:nth-child(1){animation-delay:.05s}.ds:nth-child(2){animation-delay:.10s}
        .ds:nth-child(3){animation-delay:.15s}.ds:nth-child(4){animation-delay:.20s}
        .ds:nth-child(5){animation-delay:.25s}
        .erow:hover{background:rgba(218,165,32,0.03)!important}
      `}</style>

      <button
        onClick={() => navigate("/training")}
        className="flex items-center gap-2 text-sm hover:opacity-70 transition-opacity"
        style={{ color: "var(--text-muted)" }}
      >
        <ArrowLeft size={16} /> Back to Training
      </button>

      {/* Hero */}
      <div
        className="ds rounded-2xl p-6"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--bg-border)",
        }}
      >
        <div className="flex items-start gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{
              background: "rgba(99,102,241,0.1)",
              border: "1px solid rgba(99,102,241,0.25)",
            }}
          >
            <Users size={22} style={{ color: "#818cf8" }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1
                className="font-display font-bold text-2xl"
                style={{ color: "var(--text-primary)" }}
              >
                {cohort.name}
              </h1>
              <StatusPill status={cohort.status} />
            </div>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              Program: <span style={{ color: "#DAA520" }}>{programName}</span>
            </p>
            <div className="flex items-center gap-5 mt-2 flex-wrap">
              {cohort.startDate && (
                <span
                  className="flex items-center gap-1.5 text-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  <Calendar size={12} style={{ color: "#818cf8" }} />
                  {fmt(cohort.startDate)}
                  {cohort.endDate ? ` → ${fmt(cohort.endDate)}` : ""}
                </span>
              )}
              <span
                className="flex items-center gap-1.5 text-xs"
                style={{ color: "var(--text-muted)" }}
              >
                <Users size={12} style={{ color: "#818cf8" }} />
                {enrollments.length}
                {cohort.maxEnrollment ? `/${cohort.maxEnrollment}` : ""}{" "}
                enrolled
              </span>
              <span
                className="flex items-center gap-1.5 text-xs"
                style={{ color: "var(--text-muted)" }}
              >
                <GraduationCap size={12} style={{ color: "#DAA520" }} />{" "}
                {graduated.length} graduated
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="ds grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Enrolled", value: active.length, color: "#818cf8" },
          { label: "Graduated", value: graduated.length, color: "#DAA520" },
          { label: "Dropped", value: dropped.length, color: "#f87171" },
          { label: "Sessions", value: sessions.length, color: "#4ade80" },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="rounded-xl p-4 text-center"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--bg-border)",
            }}
          >
            <p className="text-2xl font-bold font-display" style={{ color }}>
              {value}
            </p>
            <p
              className="text-xs mt-0.5"
              style={{ color: "var(--text-muted)" }}
            >
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* Enrolled members */}
      <div className="ds">
        <Section
          title={`Enrolled Members (${enrollments.length})`}
          icon={<Users size={15} />}
          action={
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAttendance(true)}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
                style={{
                  background: "rgba(99,102,241,0.1)",
                  color: "#818cf8",
                  border: "1px solid rgba(99,102,241,0.2)",
                }}
              >
                <CheckCircle2 size={13} /> Mark Attendance
              </button>
              <button
                onClick={() => setShowEnroll(true)}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
                style={{
                  background: "rgba(218,165,32,0.1)",
                  color: "#DAA520",
                  border: "1px solid rgba(218,165,32,0.2)",
                }}
              >
                <Plus size={13} /> Enroll Members
              </button>
            </div>
          }
        >
          {enrollments.length === 0 ? (
            <div className="text-center py-8">
              <Users
                size={32}
                className="mx-auto mb-3 opacity-20"
                style={{ color: "var(--text-muted)" }}
              />
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                No members enrolled yet
              </p>
              <button
                onClick={() => setShowEnroll(true)}
                className="mt-3 text-xs font-medium"
                style={{ color: "#DAA520" }}
              >
                + Enroll first member
              </button>
            </div>
          ) : (
            <div className="-mx-5 -mb-5">
              {enrollments.map((e, i) => {
                const memberId =
                  typeof e.memberId === "object" ? e.memberId._id : e.memberId;
                const m = getMember(e.memberId);
                const name = m ? `${m.firstName} ${m.lastName}` : memberId;
                return (
                  <div
                    key={memberId}
                    className="erow flex items-center gap-3 px-5 py-3 transition-colors"
                    style={{
                      borderTop:
                        i === 0 ? "none" : "1px solid var(--bg-border)",
                    }}
                  >
                    <Avatar name={name} photoUrl={m?.photoUrl} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-medium truncate"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {name}
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Enrolled {fmt(e.enrolledAt)}
                        {e.graduatedAt
                          ? ` · Graduated ${fmt(e.graduatedAt)}`
                          : ""}
                      </p>
                    </div>
                    <StatusPill status={e.status} />
                    {m && (
                      <button
                        onClick={() => navigate(`/members/${m._id}`)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg opacity-40 hover:opacity-100 transition-opacity"
                        style={{ color: "var(--text-muted)" }}
                      >
                        <ChevronRight size={14} />
                      </button>
                    )}
                    {e.status !== "graduated" && (
                      <button
                        onClick={() => setGraduatingMember(memberId)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg opacity-40 hover:opacity-100 transition-all"
                        style={{ color: "#DAA520" }}
                        title="Graduate"
                      >
                        <Award size={13} />
                      </button>
                    )}
                    <button
                      onClick={() => setRemovingEnrollment(memberId)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg opacity-40 hover:opacity-100 hover:text-red-400 transition-all"
                      style={{ color: "var(--text-muted)" }}
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
          <Section
            title={`Sessions (${sessions.length})`}
            icon={<Clock size={15} />}
          >
            <div className="space-y-3">
              {[...sessions].reverse().map((s, i) => {
                const present =
                  s.attendance?.filter((a) => a.status === "present").length ??
                  0;
                const total = s.attendance?.length ?? 0;
                return (
                  <div
                    key={s._id ?? i}
                    className="rounded-xl p-4"
                    style={{
                      background: "var(--bg-hover)",
                      border: "1px solid var(--bg-border)",
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p
                        className="text-sm font-semibold"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {s.title}
                      </p>
                      <span
                        className="text-xs"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {fmt(s.date)}
                      </span>
                    </div>
                    {total > 0 && (
                      <div className="flex items-center gap-3">
                        <div
                          className="flex-1 h-1.5 rounded-full overflow-hidden"
                          style={{ background: "var(--bg-border)" }}
                        >
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${(present / total) * 100}%`,
                              background: "#4ade80",
                            }}
                          />
                        </div>
                        <span
                          className="text-xs flex-shrink-0"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {present}/{total} present
                        </span>
                      </div>
                    )}
                    {s.notes && (
                      <p
                        className="text-xs mt-1.5"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {s.notes}
                      </p>
                    )}
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
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--bg-border)",
        }}
      >
        {[
          ["Created", cohort.createdAt],
          ["Updated", cohort.updatedAt],
        ].map(([l, v]) => (
          <div key={l}>
            <p
              className="text-xs uppercase tracking-widest"
              style={{ color: "var(--text-muted)" }}
            >
              {l}
            </p>
            <p
              className="text-sm font-medium"
              style={{ color: "var(--text-primary)" }}
            >
              {fmt(v)}
            </p>
          </div>
        ))}
      </div>

      {/* Enroll Modal */}
      <Modal
        isOpen={showEnroll}
        onClose={() => setShowEnroll(false)}
        title="Enroll Members"
        size="md"
      >
        <EnrollMembersModal
          cohortId={id!}
          existingMemberIds={existingMemberIds}
          onClose={() => setShowEnroll(false)}
          onSuccess={() => {
            qc.invalidateQueries({ queryKey: ["training-cohort", id] });
            setShowEnroll(false);
          }}
        />
      </Modal>

      {/* Attendance Modal */}
      <Modal
        isOpen={showAttendance}
        onClose={() => setShowAttendance(false)}
        title="Record Session Attendance"
        size="lg"
      >
        <MarkAttendanceModal
          cohortId={id!}
          enrollments={enrollments}
          members={allMembers ?? []}
          onClose={() => setShowAttendance(false)}
          onSuccess={() => {
            qc.invalidateQueries({ queryKey: ["training-cohort", id] });
            setShowAttendance(false);
          }}
        />
      </Modal>

      {/* Graduate confirm */}
      <Modal
        isOpen={!!graduatingMember}
        onClose={() => setGraduatingMember(null)}
        title="Graduate Member"
        size="sm"
      >
        <p className="text-text-secondary mb-5">
          Mark this member as graduated from <strong>{cohort.name}</strong>?
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setGraduatingMember(null)}
            className="btn-ghost"
          >
            Cancel
          </button>
          <button
            onClick={() =>
              graduatingMember && graduate.mutate(graduatingMember)
            }
            className="btn-gold flex items-center gap-2"
            disabled={graduate.isPending}
          >
            <GraduationCap size={14} />
            {graduate.isPending ? "Graduating..." : "Graduate 🎓"}
          </button>
        </div>
      </Modal>

      {/* Unenroll confirm */}
      <Modal
        isOpen={!!removingEnrollment}
        onClose={() => setRemovingEnrollment(null)}
        title="Unenroll Member"
        size="sm"
      >
        <p className="text-text-secondary mb-5">
          Remove this member from the cohort?
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setRemovingEnrollment(null)}
            className="btn-ghost"
          >
            Cancel
          </button>
          <button
            onClick={() =>
              removingEnrollment && unenroll.mutate(removingEnrollment)
            }
            className="btn-danger"
            disabled={unenroll.isPending}
          >
            {unenroll.isPending ? "Removing..." : "Unenroll"}
          </button>
        </div>
      </Modal>
    </div>
  );
}

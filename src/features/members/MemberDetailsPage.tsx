import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  ArrowLeft, Mail, Phone, MapPin, Briefcase,
  Calendar, User, Church, Star, BookOpen, GitBranch,
} from "lucide-react";
import api from "../../lib/api";
import { PageLoader } from "../../components/ui/Spinner";
import type { Member, Department } from "../../types";

/* ── Helpers ──────────────────────────────────────────────────────────────── */

function fmt(date?: string) {
  if (!date) return "—";
  try { return format(new Date(date), "dd MMM yyyy"); }
  catch { return "—"; }
}

function capitalize(str?: string) {
  if (!str) return "—";
  return str.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function getDeptNames(member: Member, departments?: Department[]): string[] {
  const ids = member.departmentIds ?? [];
  if (!ids.length) return [];
  return ids.map((d: any) => {
    if (typeof d === "object" && d?.name) return d.name;
    const id = typeof d === "object" ? d?._id : d;
    return departments?.find((dep) => dep._id === id)?.name || id || "";
  }).filter(Boolean);
}

/* ── Design tokens (inline, CSS-var based) ────────────────────────────────── */

const S = {
  card: {
    background: "var(--bg-card)",
    border: "1px solid var(--bg-border)",
    borderRadius: 16,
  } as React.CSSProperties,

  sectionHead: {
    display: "flex", alignItems: "center", gap: 8,
    paddingBottom: 12, marginBottom: 16,
    borderBottom: "1px solid var(--bg-border)",
  } as React.CSSProperties,

  label: {
    display: "block", fontSize: 11, fontWeight: 600,
    textTransform: "uppercase" as const, letterSpacing: "0.08em",
    color: "var(--text-muted)", marginBottom: 3,
  } as React.CSSProperties,

  value: {
    fontSize: 13, fontWeight: 500,
    color: "var(--text-primary)",
  } as React.CSSProperties,

  pill: {
    display: "inline-flex", alignItems: "center",
    padding: "2px 10px", borderRadius: 999,
    fontSize: 11, fontWeight: 600,
    background: "var(--bg-hover)",
    color: "var(--text-secondary)",
    border: "1px solid var(--bg-border)",
    whiteSpace: "nowrap" as const,
  } as React.CSSProperties,

  chip: {
    display: "inline-flex", alignItems: "center",
    padding: "2px 8px", borderRadius: 6,
    fontSize: 11, fontWeight: 500,
    background: "var(--bg-hover)",
    color: "var(--text-secondary)",
    border: "1px solid var(--bg-border)",
  } as React.CSSProperties,
};

/* ── Sub-components ───────────────────────────────────────────────────────── */

function Monogram({ name, size = 48 }: { name: string; size?: number }) {
  const parts = name.trim().split(" ");
  const initials = ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--bg-hover)", border: "1px solid var(--bg-border)",
      color: "var(--text-secondary)", fontSize: size * 0.3,
      fontWeight: 700, letterSpacing: "0.02em",
    }}>
      {initials}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  return <span style={S.pill}>{capitalize(status)}</span>;
}

function InfoRow({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div>
      <span style={S.label}>{label}</span>
      <span style={S.value}>{value || "—"}</span>
    </div>
  );
}

function SectionCard({
  icon, title, children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ ...S.card, padding: 20 }}>
      <div style={S.sectionHead}>
        <span style={{ color: "var(--text-muted)", display: "flex" }}>{icon}</span>
        <h3 style={{
          fontSize: 11, fontWeight: 700, textTransform: "uppercase",
          letterSpacing: "0.1em", color: "var(--text-muted)", margin: 0,
        }}>
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

function InfoGrid({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 24px",
    }}>
      {children}
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────────────────── */

export default function MemberDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: member, isLoading, isError } = useQuery<Member>({
    queryKey: ["member", id],
    queryFn: async () => {
      const res = await api.get(`/members/${id}`);
      return res.data.data as Member;
    },
    enabled: !!id,
  });

  const { data: departments } = useQuery<Department[]>({
    queryKey: ["departments-list"],
    queryFn: async () => {
      const res = await api.get("/departments?limit=100");
      return res.data.data as Department[];
    },
  });

  if (isLoading) return <PageLoader />;

  if (isError || !member) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
        <p style={{ color: "var(--text-muted)" }}>Member not found.</p>
        <button onClick={() => navigate("/members")} className="btn-ghost">
          <ArrowLeft size={16} /> Back to Members
        </button>
      </div>
    );
  }

  const deptNames = getDeptNames(member, departments);
  const fullName  = `${member.firstName} ${member.lastName}`;
  const m         = member as any; // for optional fields

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Back */}
      <button
        onClick={() => navigate("/members")}
        className="btn-ghost"
        style={{ alignSelf: "flex-start" }}
      >
        <ArrowLeft size={15} /> Back to Members
      </button>

      {/* ── Hero Card ──────────────────────────────────────────────────────── */}
      <div style={{ ...S.card, padding: 24 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 20, flexWrap: "wrap" }}>

          <Monogram name={fullName} size={64} />

          <div style={{ flex: 1, minWidth: 200 }}>
            {/* Name + status */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                {fullName}
              </h1>
              <StatusPill status={member.status} />
            </div>

            {/* ID + departments */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
              <span style={{ ...S.chip, fontFamily: "monospace", fontSize: 12 }}>
                {member.membershipId}
              </span>
              {deptNames.map((n, i) => <span key={i} style={S.chip}>{n}</span>)}
            </div>

            {/* Contact strip */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
              {member.email && (
                <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--text-muted)" }}>
                  <Mail size={12} /> {member.email}
                </span>
              )}
              {member.phone && (
                <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--text-muted)" }}>
                  <Phone size={12} /> {member.phone}
                </span>
              )}
              {m.city && (
                <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--text-muted)" }}>
                  <MapPin size={12} /> {m.city}{m.state ? `, ${m.state}` : ""}
                </span>
              )}
            </div>
          </div>

          {/* Meta dates — top right */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4, textAlign: "right" }}>
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
              Joined {fmt(member.dateJoined)}
            </span>
            {member.createdAt && (
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                Added {fmt(member.createdAt)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Two-column grid ────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 16 }}>

        {/* Personal */}
        <SectionCard icon={<User size={14} />} title="Personal Information">
          <InfoGrid>
            <InfoRow label="First Name"     value={member.firstName} />
            <InfoRow label="Last Name"      value={member.lastName} />
            {m.middleName && <InfoRow label="Middle Name" value={m.middleName} />}
            <InfoRow label="Gender"         value={capitalize(member.gender)} />
            <InfoRow label="Date of Birth"  value={fmt(member.dateOfBirth)} />
            <InfoRow label="Age"            value={member.age ? `${member.age} yrs` : undefined} />
            <InfoRow label="Marital Status" value={capitalize(member.maritalStatus)} />
            {m.weddingAnniversary && (
              <InfoRow label="Anniversary"  value={fmt(m.weddingAnniversary)} />
            )}
          </InfoGrid>
        </SectionCard>

        {/* Contact */}
        <SectionCard icon={<Phone size={14} />} title="Contact Information">
          <InfoGrid>
            <InfoRow label="Phone"      value={member.phone} />
            <InfoRow label="Alt. Phone" value={m.alternatePhone} />
            <InfoRow label="Email"      value={member.email} />
            <InfoRow label="Address"    value={member.address} />
            <InfoRow label="City"       value={m.city} />
            <InfoRow label="State"      value={m.state} />
            <InfoRow label="Country"    value={m.country} />
          </InfoGrid>
        </SectionCard>

        {/* Church */}
        <SectionCard icon={<Church size={14} />} title="Church Information">
          <InfoGrid>
            <InfoRow label="Status"         value={<StatusPill status={member.status} />} />
            <InfoRow label="Membership ID"  value={
              <span style={{ ...S.chip, fontFamily: "monospace" }}>{member.membershipId}</span>
            } />
            <InfoRow label="Date Joined"    value={fmt(member.dateJoined)} />
            <InfoRow label="Baptism Status" value={capitalize(m.baptismStatus)} />
            <InfoRow label="Baptism Date"   value={fmt(m.baptismDate)} />
            <InfoRow label="Worker Status"  value={capitalize(member.workerStatus)} />
            <div style={{ gridColumn: "1 / -1" }}>
              <span style={S.label}>Departments</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
                {deptNames.length > 0
                  ? deptNames.map((n, i) => <span key={i} style={S.chip}>{n}</span>)
                  : <span style={{ fontSize: 13, color: "var(--text-muted)" }}>—</span>
                }
              </div>
            </div>
          </InfoGrid>
        </SectionCard>

        {/* Professional */}
        <SectionCard icon={<Briefcase size={14} />} title="Professional">
          <InfoGrid>
            <InfoRow label="Occupation" value={member.occupation} />
            <InfoRow label="Employer"   value={m.employer} />
          </InfoGrid>
        </SectionCard>
      </div>

      {/* ── Spiritual Milestones ──────────────────────────────────────────── */}
      {m.spiritualMilestones?.length > 0 && (
        <SectionCard icon={<Star size={14} />} title="Spiritual Milestones">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {m.spiritualMilestones.map((ms: any, i: number) => (
              <div key={i} style={{ display: "flex", gap: 12 }}>
                <div style={{
                  width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
                  background: "var(--text-muted)", marginTop: 5,
                }} />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", margin: "0 0 2px" }}>
                    {capitalize(ms.type)}{ms.title ? ` — ${ms.title}` : ""}
                  </p>
                  {ms.date && <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "0 0 2px" }}>{fmt(ms.date)}</p>}
                  {ms.notes && <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: 0 }}>{ms.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* ── Pastoral Notes ────────────────────────────────────────────────── */}
      {m.pastoralNotes?.length > 0 && (
        <SectionCard icon={<BookOpen size={14} />} title="Pastoral Notes">
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {m.pastoralNotes.map((n: any, i: number) => (
              <div key={i} style={{
                padding: "10px 14px", borderRadius: 8,
                background: "var(--bg-hover)",
                border: "1px solid var(--bg-border)",
                borderLeft: "3px solid var(--bg-border)",
              }}>
                <p style={{ fontSize: 13, color: "var(--text-primary)", margin: "0 0 4px" }}>
                  {n.note || n.content || n.text}
                </p>
                <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>
                  {n.createdAt ? fmt(n.createdAt) : ""}{n.author ? ` · ${n.author}` : ""}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* ── Transfer Records ─────────────────────────────────────────────── */}
      {m.transferRecords?.length > 0 && (
        <SectionCard icon={<GitBranch size={14} />} title="Transfer Records">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {m.transferRecords.map((t: any, i: number) => (
              <div key={i} style={{ display: "flex", gap: 12 }}>
                <div style={{
                  width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
                  background: "var(--text-muted)", marginTop: 5,
                }} />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", margin: "0 0 2px" }}>
                    {t.from || "—"} → {t.to || "—"}
                  </p>
                  {t.date && <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "0 0 2px" }}>{fmt(t.date)}</p>}
                  {t.reason && <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: 0 }}>{t.reason}</p>}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* ── Footer meta ──────────────────────────────────────────────────── */}
      <div style={{
        ...S.card, padding: "12px 20px",
        display: "flex", gap: 32, flexWrap: "wrap",
      }}>
        <InfoRow label="Record Created"  value={fmt(member.createdAt)} />
        <InfoRow label="Last Updated"    value={fmt(member.updatedAt)} />
      </div>
    </div>
  );
} 
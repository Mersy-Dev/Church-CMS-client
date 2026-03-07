import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  ArrowLeft, Mail, Phone, MapPin, Briefcase, Calendar,
  User, Shield, Church, Star, BookOpen, GitBranch, QrCode
} from 'lucide-react';
import api from '../../lib/api';
import Avatar from '../../components/ui/Avatar';
import StatusBadge from '../../components/ui/StatusBadge';
import { PageLoader } from '../../components/ui/Spinner';
import type { Member, Department } from '../../types';

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmt(date?: string) {
  if (!date) return '—';
  try { return format(new Date(date), 'dd MMM yyyy'); } catch { return '—'; }
}

function capitalize(str?: string) {
  if (!str) return '—';
  return str.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function InfoRow({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--text-muted, #888)' }}>
        {label}
      </span>
      <span className="text-sm font-medium" style={{ color: 'var(--text-primary, #fff)' }}>
        {value || '—'}
      </span>
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl p-5 space-y-4"
      style={{
        background: 'var(--bg-card, rgba(255,255,255,0.04))',
        border: '1px solid var(--bg-border, rgba(255,255,255,0.08))',
      }}
    >
      <div className="flex items-center gap-2 pb-2" style={{ borderBottom: '1px solid var(--bg-border, rgba(255,255,255,0.06))' }}>
        <span style={{ color: '#DAA520' }}>{icon}</span>
        <h3 className="text-sm font-semibold tracking-wide uppercase" style={{ color: 'var(--text-secondary, #ccc)' }}>
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function MemberDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: member, isLoading, isError } = useQuery<Member>({
    queryKey: ['member', id],
    queryFn: async () => {
      const res = await api.get(`/members/${id}`);
      return res.data.data as Member;
    },
    enabled: !!id,
  });

  const { data: departments } = useQuery<Department[]>({
    queryKey: ['departments-list'],
    queryFn: async () => {
      const res = await api.get('/departments?limit=100');
      return res.data.data as Department[];
    },
  });

  // Resolve department names from departmentIds
  function getDeptNames(): string[] {
    if (!member) return [];
    const ids = member.departmentIds ?? [];
    if (ids.length === 0) return [];
    return ids.map((d: any) => {
      if (typeof d === 'object' && d?.name) return d.name;
      if (typeof d === 'object' && d?._id)
        return departments?.find((dep) => dep._id === d._id)?.name || d._id;
      if (typeof d === 'string')
        return departments?.find((dep) => dep._id === d)?.name || d;
      return '';
    }).filter(Boolean);
  }

  if (isLoading) return <PageLoader />;

  if (isError || !member) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
        <p className="text-text-muted">Member not found.</p>
        <button onClick={() => navigate('/members')} className="btn-ghost flex items-center gap-2">
          <ArrowLeft size={16} /> Back to Members
        </button>
      </div>
    );
  }

  const deptNames = getDeptNames();
  const fullName = `${member.firstName} ${member.lastName}`;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .detail-section {
          animation: slideUp 0.35s ease both;
        }
        .detail-section:nth-child(1) { animation-delay: 0.05s; }
        .detail-section:nth-child(2) { animation-delay: 0.10s; }
        .detail-section:nth-child(3) { animation-delay: 0.15s; }
        .detail-section:nth-child(4) { animation-delay: 0.20s; }
        .detail-section:nth-child(5) { animation-delay: 0.25s; }
        .detail-section:nth-child(6) { animation-delay: 0.30s; }
        .gold-tag {
          display: inline-flex; align-items: center;
          padding: 2px 10px; border-radius: 999px;
          font-size: 11px; font-weight: 600;
          background: rgba(218,165,32,0.12);
          color: #DAA520;
          border: 1px solid rgba(218,165,32,0.25);
        }
        .milestone-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: #DAA520; flex-shrink: 0; margin-top: 4px;
        }
        .note-card {
          border-left: 3px solid rgba(218,165,32,0.4);
          padding: 10px 14px;
          border-radius: 0 8px 8px 0;
          background: rgba(218,165,32,0.04);
        }
      `}</style>

      {/* ── Back Button ── */}
      <button
        onClick={() => navigate('/members')}
        className="flex items-center gap-2 text-sm transition-colors duration-200 hover:opacity-80"
        style={{ color: 'var(--text-muted, #888)' }}
      >
        <ArrowLeft size={16} /> Back to Members
      </button>

      {/* ── Hero Card ── */}
      <div
        className="detail-section rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5"
        style={{
          background: 'var(--bg-card, rgba(255,255,255,0.04))',
          border: '1px solid var(--bg-border, rgba(255,255,255,0.08))',
        }}
      >
        <Avatar name={fullName} photoUrl={member.photoUrl} size="lg" />

        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display font-bold text-2xl" style={{ color: 'var(--text-primary, #fff)' }}>
              {fullName}
            </h1>
            <StatusBadge status={member.status} />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(218,165,32,0.1)', color: '#DAA520' }}>
              {member.membershipId}
            </span>
            {deptNames.map((name, i) => (
              <span key={i} className="gold-tag">{name}</span>
            ))}
            {deptNames.length === 0 && (
              <span className="text-xs" style={{ color: 'var(--text-muted, #888)' }}>No department</span>
            )}
          </div>

          <div className="flex flex-wrap gap-4 pt-1">
            {member.email && (
              <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted, #888)' }}>
                <Mail size={12} /> {member.email}
              </span>
            )}
            {member.phone && (
              <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted, #888)' }}>
                <Phone size={12} /> {member.phone}
              </span>
            )}
            {(member as any).city && (
              <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted, #888)' }}>
                <MapPin size={12} /> {(member as any).city}, {(member as any).state || ''}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Grid Layout ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Personal Information */}
        <div className="detail-section">
          <Section icon={<User size={15} />} title="Personal Information">
            <div className="grid grid-cols-2 gap-4">
              <InfoRow label="First Name" value={member.firstName} />
              <InfoRow label="Last Name" value={member.lastName} />
              {(member as any).middleName && (
                <InfoRow label="Middle Name" value={(member as any).middleName} />
              )}
              <InfoRow label="Gender" value={capitalize(member.gender)} />
              <InfoRow label="Date of Birth" value={fmt(member.dateOfBirth)} />
              <InfoRow label="Age" value={member.age ? `${member.age} yrs` : undefined} />
              <InfoRow label="Marital Status" value={capitalize(member.maritalStatus)} />
              {(member as any).weddingAnniversary && (
                <InfoRow label="Anniversary" value={fmt((member as any).weddingAnniversary)} />
              )}
            </div>
          </Section>
        </div>

        {/* Contact Information */}
        <div className="detail-section">
          <Section icon={<Phone size={15} />} title="Contact Information">
            <div className="grid grid-cols-2 gap-4">
              <InfoRow label="Phone" value={member.phone} />
              <InfoRow label="Alt. Phone" value={(member as any).alternatePhone} />
              <InfoRow label="Email" value={member.email} />
              <InfoRow label="Address" value={member.address} />
              <InfoRow label="City" value={(member as any).city} />
              <InfoRow label="State" value={(member as any).state} />
              <InfoRow label="Country" value={(member as any).country} />
            </div>
          </Section>
        </div>

        {/* Professional */}
        <div className="detail-section">
          <Section icon={<Briefcase size={15} />} title="Professional">
            <div className="grid grid-cols-2 gap-4">
              <InfoRow label="Occupation" value={member.occupation} />
              <InfoRow label="Employer" value={(member as any).employer} />
            </div>
          </Section>
        </div>

        {/* Church Information */}
        <div className="detail-section">
          <Section icon={<Church size={15} />} title="Church Information">
            <div className="grid grid-cols-2 gap-4">
              <InfoRow label="Status" value={<StatusBadge status={member.status} />} />
              <InfoRow label="Membership ID" value={
                <span className="font-mono text-xs" style={{ color: '#DAA520' }}>{member.membershipId}</span>
              } />
              <InfoRow label="Date Joined" value={fmt(member.dateJoined)} />
              <InfoRow label="Baptism Status" value={capitalize((member as any).baptismStatus)} />
              <InfoRow label="Baptism Date" value={fmt((member as any).baptismDate)} />
              <InfoRow label="Worker Status" value={capitalize(member.workerStatus)} />
              <div className="col-span-2">
                <span className="text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--text-muted, #888)' }}>
                  Departments
                </span>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {deptNames.length > 0
                    ? deptNames.map((n, i) => <span key={i} className="gold-tag">{n}</span>)
                    : <span className="text-sm" style={{ color: 'var(--text-muted)' }}>—</span>
                  }
                </div>
              </div>
            </div>
          </Section>
        </div>
      </div>

      {/* ── Spiritual Milestones ── */}
      {(member as any).spiritualMilestones?.length > 0 && (
        <div className="detail-section">
          <Section icon={<Star size={15} />} title="Spiritual Milestones">
            <div className="space-y-3">
              {(member as any).spiritualMilestones.map((m: any, i: number) => (
                <div key={i} className="flex gap-3">
                  <div className="milestone-dot mt-1.5" />
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {capitalize(m.type)} {m.title ? `— ${m.title}` : ''}
                    </p>
                    {m.date && (
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{fmt(m.date)}</p>
                    )}
                    {m.notes && (
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{m.notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}

      {/* ── Pastoral Notes ── */}
      {(member as any).pastoralNotes?.length > 0 && (
        <div className="detail-section">
          <Section icon={<BookOpen size={15} />} title="Pastoral Notes">
            <div className="space-y-3">
              {(member as any).pastoralNotes.map((n: any, i: number) => (
                <div key={i} className="note-card">
                  <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{n.note || n.content || n.text}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    {n.createdAt ? fmt(n.createdAt) : ''}
                    {n.author ? ` · ${n.author}` : ''}
                  </p>
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}

      {/* ── Transfer Records ── */}
      {(member as any).transferRecords?.length > 0 && (
        <div className="detail-section">
          <Section icon={<GitBranch size={15} />} title="Transfer Records">
            <div className="space-y-3">
              {(member as any).transferRecords.map((t: any, i: number) => (
                <div key={i} className="flex gap-3">
                  <div className="milestone-dot" style={{ background: '#6366f1' }} />
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {t.from || '—'} → {t.to || '—'}
                    </p>
                    {t.date && (
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{fmt(t.date)}</p>
                    )}
                    {t.reason && (
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{t.reason}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}

      {/* ── Meta ── */}
      <div
        className="detail-section rounded-2xl px-5 py-3 flex flex-wrap gap-6"
        style={{
          background: 'var(--bg-card, rgba(255,255,255,0.02))',
          border: '1px solid var(--bg-border, rgba(255,255,255,0.06))',
        }}
      >
        <InfoRow label="Created" value={fmt(member.createdAt)} />
        <InfoRow label="Last Updated" value={fmt(member.updatedAt)} />
      </div>
    </div>
  );
}
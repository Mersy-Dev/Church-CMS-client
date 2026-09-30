import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  ArrowLeft, BookOpen, Clock, Tag, Users, Plus, Trash2,
  GraduationCap, Calendar, ChevronRight, Search,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { PageLoader } from '../../components/ui/Spinner';
import Avatar from '../../components/ui/Avatar';
import Modal from '../../components/ui/Modal';
import StatusBadge from '../../components/ui/StatusBadge';
import type { TrainingProgram, TrainingCohort } from '../../types/training.types';
import type { Member } from '../../types';

// ── Word House Brand Colors ───────────────────────────────────────────────────
// TEXT RULE: Never hardcode dark hex values for body text — use CSS vars:
//   text-text-primary   → var(--text-primary)   adapts to dark/light theme
//   text-text-secondary → var(--text-secondary)
//   text-text-muted     → var(--text-muted)
// Brand colors are ONLY used for decorative elements (icons, borders, badges).
const COLORS = {
  navy:      '#1A56A0',  // Dominant — Word House navy blue
  navyLight: '#4A8FD4',  // Lighter navy — accents/tags on dark cards
  crimson:   '#C41E3A',  // Accent — Word House crimson
  green:     '#2E8B57',  // Functional green
};

function fmt(d?: string) {
  if (!d) return '—';
  try { return format(new Date(d), 'dd MMM yyyy'); } catch { return '—'; }
}

const statusColor: Record<string, { bg: string; text: string; border: string }> = {
  active:    { bg: 'rgba(26,86,160,0.12)',  text: '#4A8FD4',  border: 'rgba(26,86,160,0.3)'   },
  draft:     { bg: 'rgba(100,100,100,0.1)', text: '#888',     border: 'rgba(100,100,100,0.2)'  },
  completed: { bg: 'rgba(46,139,87,0.12)',  text: '#2E8B57',  border: 'rgba(46,139,87,0.3)'   },
  archived:  { bg: 'rgba(100,100,100,0.1)', text: '#888',     border: 'rgba(100,100,100,0.2)'  },
  upcoming:  { bg: 'rgba(129,140,248,0.1)', text: '#818cf8',  border: 'rgba(129,140,248,0.25)' },
  graduated: { bg: 'rgba(196,30,58,0.1)',   text: '#C41E3A',  border: 'rgba(196,30,58,0.25)'  },
  cancelled: { bg: 'rgba(239,68,68,0.1)',   text: '#ef4444',  border: 'rgba(239,68,68,0.25)'  },
};

function StatusPill({ status }: { status: string }) {
  const c = statusColor[status] ?? statusColor.draft;
  return (
    <span
      className="text-xs px-2.5 py-1 rounded-full font-semibold"
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
      style={{
        background: 'var(--bg-card, rgba(255,255,255,0.04))',
        border: '1px solid rgba(26,86,160,0.2)',
      }}
    >
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: '1px solid rgba(26,86,160,0.12)' }}
      >
        <div className="flex items-center gap-2">
          <span style={{ color: COLORS.navy }}>{icon}</span>
          <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: COLORS.navyLight }}>
            {title}
          </h3>
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function AddMemberModal({ programId, existingMemberIds, onClose, onSuccess }: {
  programId: string; existingMemberIds: string[];
  onClose: () => void; onSuccess: () => void;
}) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);

  const { data: members, isLoading } = useQuery<Member[]>({
    queryKey: ['members-search', search],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '30' });
      if (search) params.set('search', search);
      return (await api.get(`/members?${params}`)).data.data;
    },
  });

  const mutation = useMutation({
    mutationFn: () => api.post(`/training/programs/${programId}/members`, { memberIds: selected }),
    onSuccess: () => { toast.success(`${selected.length} member(s) added`); onSuccess(); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to add members'),
  });

  const available = (members ?? []).filter((m) => !existingMemberIds.includes(m._id));
  const toggle = (id: string) =>
    setSelected((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

  return (
    <div className="space-y-4">
      {/* Search — no inline color on the input itself; let the .input class handle it */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: COLORS.navyLight }} />
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
          <p className="text-sm text-center py-6 text-text-muted">Searching...</p>
        ) : available.length === 0 ? (
          <p className="text-sm text-center py-6 text-text-muted">
            {search ? 'No members found' : 'All members already added'}
          </p>
        ) : (
          available.map((m) => {
            const checked = selected.includes(m._id);
            return (
              <label
                key={m._id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all"
                style={{ background: checked ? 'rgba(26,86,160,0.1)' : 'transparent' }}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(m._id)}
                  className="w-4 h-4 rounded"
                  style={{ accentColor: COLORS.navy }}
                />
                <Avatar name={`${m.firstName} ${m.lastName}`} photoUrl={m.photoUrl} size="sm" />
                <div className="flex-1 min-w-0">
                  {/* CSS vars — safe on dark bg */}
                  <p className="text-sm font-medium truncate text-text-primary">
                    {m.firstName} {m.lastName}
                  </p>
                  <p className="text-xs text-text-muted">
                    {m.membershipId}{m.phone ? ` · ${m.phone}` : ''}
                  </p>
                </div>
                {checked && (
                  <span className="text-xs font-bold" style={{ color: COLORS.navyLight }}>✓</span>
                )}
              </label>
            );
          })
        )}
      </div>

      {selected.length > 0 && (
        <p className="text-xs text-center font-medium" style={{ color: COLORS.navyLight }}>
          {selected.length} member{selected.length !== 1 ? 's' : ''} selected
        </p>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <button onClick={onClose} className="btn-ghost">Cancel</button>
        <button
          onClick={() => mutation.mutate()}
          disabled={selected.length === 0 || mutation.isPending}
          className="px-4 py-2 rounded-lg font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: COLORS.navy }}
          onMouseEnter={(e) => { if (!mutation.isPending) (e.currentTarget as HTMLElement).style.background = '#164882'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = COLORS.navy; }}
        >
          {mutation.isPending ? 'Adding...' : `Add ${selected.length || ''} Member${selected.length !== 1 ? 's' : ''}`}
        </button>
      </div>
    </div>
  );
}

export default function ProgramDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showAddMember, setShowAddMember] = useState(false);
  const [removingMember, setRemovingMember] = useState<string | null>(null);

  const { data: program, isLoading } = useQuery<TrainingProgram & { members?: Member[] }>({
    queryKey: ['training-program', id],
    queryFn: async () => (await api.get(`/training/programs/${id}`)).data.data,
    enabled: !!id,
  });

  const { data: cohorts } = useQuery<TrainingCohort[]>({
    queryKey: ['training-cohorts-for-program', id],
    queryFn: async () => (await api.get(`/training/cohorts?programId=${id}&limit=50`)).data.data,
    enabled: !!id,
  });

  const removeMember = useMutation({
    mutationFn: (memberId: string) => api.delete(`/training/programs/${id}/members/${memberId}`),
    onSuccess: () => {
      toast.success('Member removed');
      qc.invalidateQueries({ queryKey: ['training-program', id] });
      setRemovingMember(null);
    },
    onError: () => toast.error('Failed to remove member'),
  });

  if (isLoading) return <PageLoader />;
  if (!program) return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
      <p className="text-text-muted">Program not found.</p>
      <button onClick={() => navigate('/training')} className="btn-ghost flex items-center gap-2">
        <ArrowLeft size={16} /> Back to Training
      </button>
    </div>
  );

  const members: Member[] = program.members ?? [];
  const existingMemberIds = members.map((m) => m._id);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <style>{`
        /* ── Word House Brand Colors ────────────────────────────────────────
           Dominant  : #1A56A0  (Word House Navy Blue)
           Accent    : #C41E3A  (Word House Crimson)

           TEXT RULE — prevents dark-on-dark / light-on-light clashing:
           • Body text  → text-text-primary / text-text-secondary / text-text-muted
           • Label text → style={{ color: COLORS.navyLight }} (visible on dark cards)
           • NEVER use hardcoded dark hex (#0A1628 etc.) for text
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

        .mrow { transition: background 0.15s; }
        .mrow:hover { background: rgba(26,86,160,0.06) !important; }

        .ccard { transition: border-color 0.2s, transform 0.2s; }
        .ccard:hover { border-color: rgba(26,86,160,0.4) !important; transform: translateY(-1px); }

        .back-btn { color: var(--text-muted); transition: color 0.15s; }
        .back-btn:hover { color: #4A8FD4; }

        .add-members-btn {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 12px; font-weight: 600;
          padding: 6px 12px; border-radius: 8px;
          background: rgba(26,86,160,0.12);
          color: #4A8FD4;
          border: 1px solid rgba(26,86,160,0.3);
          cursor: pointer; transition: background 0.15s;
        }
        .add-members-btn:hover { background: rgba(26,86,160,0.22); }
      `}</style>

      {/* Back */}
      <button onClick={() => navigate('/training')} className="back-btn flex items-center gap-2 text-sm">
        <ArrowLeft size={16} /> Back to Training
      </button>

      {/* Hero */}
      <div
        className="ds rounded-2xl p-6"
        style={{
          background: 'var(--bg-card, rgba(255,255,255,0.04))',
          border: '1.5px solid rgba(26,86,160,0.25)',
          boxShadow: '0 4px 24px rgba(26,86,160,0.08)',
        }}
      >
        <div className="flex items-start gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(26,86,160,0.12)', border: '1px solid rgba(26,86,160,0.25)' }}
          >
            <BookOpen size={22} style={{ color: COLORS.navyLight }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-display font-bold text-2xl text-text-primary">{program.name}</h1>
              <StatusPill status={program.status} />
            </div>
            {program.description && (
              <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">{program.description}</p>
            )}
            <div className="flex items-center gap-5 mt-3 flex-wrap">
              {program.category && (
                <span className="flex items-center gap-1.5 text-xs text-text-muted">
                  <Tag size={12} style={{ color: COLORS.navy }} /> {program.category}
                </span>
              )}
              {program.durationWeeks && (
                <span className="flex items-center gap-1.5 text-xs text-text-muted">
                  <Clock size={12} style={{ color: COLORS.navy }} /> {program.durationWeeks} weeks
                </span>
              )}
              <span className="flex items-center gap-1.5 text-xs text-text-muted">
                <Users size={12} style={{ color: COLORS.navy }} /> {members.length} member{members.length !== 1 ? 's' : ''}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-text-muted">
                <GraduationCap size={12} style={{ color: COLORS.navy }} /> {cohorts?.length ?? 0} cohort{cohorts?.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="ds grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Members',  value: members.length,               color: COLORS.navy     },
          { label: 'Modules',  value: program.modules?.length ?? 0, color: COLORS.navyLight },
          { label: 'Cohorts',  value: cohorts?.length ?? 0,         color: COLORS.crimson   },
          { label: 'Duration', value: program.durationWeeks ? `${program.durationWeeks}w` : '—', color: COLORS.green },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="rounded-xl p-4 text-center"
            style={{
              background: 'var(--bg-card, rgba(255,255,255,0.04))',
              border: `1px solid ${color}28`,
            }}
          >
            <p className="text-2xl font-bold font-display" style={{ color }}>{value}</p>
            <p className="text-xs mt-0.5 text-text-muted">{label}</p>
          </div>
        ))}
      </div>

      {/* Members */}
      <div className="ds">
        <Section
          title={`Members (${members.length})`}
          icon={<Users size={15} />}
          action={
            <button onClick={() => setShowAddMember(true)} className="add-members-btn">
              <Plus size={13} /> Add Members
            </button>
          }
        >
          {members.length === 0 ? (
            <div className="text-center py-8">
              <Users size={32} className="mx-auto mb-3 opacity-20 text-text-muted" />
              <p className="text-sm text-text-muted">No members enrolled yet</p>
              <button
                onClick={() => setShowAddMember(true)}
                className="mt-3 text-xs font-semibold transition-opacity hover:opacity-70"
                style={{ color: COLORS.navyLight }}
              >
                + Add first member
              </button>
            </div>
          ) : (
            <div className="-mx-5 -mb-5">
              {members.map((m, i) => (
                <div
                  key={m._id}
                  className="mrow flex items-center gap-3 px-5 py-3"
                  style={{ borderTop: i === 0 ? 'none' : '1px solid rgba(26,86,160,0.08)' }}
                >
                  <Avatar name={`${m.firstName} ${m.lastName}`} photoUrl={m.photoUrl} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-text-primary">
                      {m.firstName} {m.lastName}
                    </p>
                    <p className="text-xs text-text-muted">
                      {m.membershipId}{m.phone ? ` · ${m.phone}` : ''}
                    </p>
                  </div>
                  <StatusBadge status={m.status} />
                  <button
                    onClick={() => navigate(`/members/${m._id}`)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary opacity-40 hover:opacity-100 transition-all"
                  >
                    <ChevronRight size={14} />
                  </button>
                  <button
                    onClick={() => setRemovingMember(m._id)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-text-muted hover:text-red-400 hover:bg-red-500/10 opacity-40 hover:opacity-100 transition-all"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>

      {/* Linked cohorts */}
      {cohorts && cohorts.length > 0 && (
        <div className="ds">
          <Section title={`Cohorts (${cohorts.length})`} icon={<GraduationCap size={15} />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {cohorts.map((c) => (
                <div
                  key={c._id}
                  className="ccard rounded-xl p-4 cursor-pointer"
                  style={{
                    background: 'var(--bg-hover, rgba(255,255,255,0.03))',
                    border: '1px solid rgba(26,86,160,0.18)',
                  }}
                  onClick={() => navigate(`/training/cohorts/${c._id}`)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-text-primary">{c.name}</p>
                    <StatusPill status={c.status} />
                  </div>
                  <div className="flex items-center gap-3 text-xs text-text-muted">
                    <span className="flex items-center gap-1">
                      <Users size={11} /> {c.enrollments?.length ?? 0} enrolled
                    </span>
                    {c.startDate && (
                      <span className="flex items-center gap-1">
                        <Calendar size={11} /> {fmt(c.startDate)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}

      {/* Modules */}
      {program.modules && program.modules.length > 0 && (
        <div className="ds">
          <Section title={`Modules (${program.modules.length})`} icon={<BookOpen size={15} />}>
            <div className="space-y-2">
              {program.modules.map((mod, i) => (
                <div
                  key={mod._id ?? i}
                  className="flex items-start gap-3 p-3 rounded-xl"
                  style={{ background: 'rgba(26,86,160,0.06)' }}
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
                    style={{ background: COLORS.navy }}
                  >
                    {mod.weekNumber ?? i + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{mod.title}</p>
                    {mod.description && (
                      <p className="text-xs mt-0.5 text-text-muted">{mod.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}

      {/* Meta */}
      <div
        className="ds rounded-xl px-5 py-3 flex gap-6 flex-wrap"
        style={{
          background: 'var(--bg-card, rgba(255,255,255,0.02))',
          border: '1px solid rgba(26,86,160,0.15)',
        }}
      >
        {[['Created', program.createdAt], ['Updated', program.updatedAt]].map(([l, v]) => (
          <div key={l}>
            <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: COLORS.navyLight }}>{l}</p>
            <p className="text-sm font-medium text-text-primary">{fmt(v)}</p>
          </div>
        ))}
      </div>

      {/* Add Member Modal */}
      <Modal isOpen={showAddMember} onClose={() => setShowAddMember(false)} title="Add Members to Program" size="md">
        <AddMemberModal
          programId={id!}
          existingMemberIds={existingMemberIds}
          onClose={() => setShowAddMember(false)}
          onSuccess={() => {
            qc.invalidateQueries({ queryKey: ['training-program', id] });
            setShowAddMember(false);
          }}
        />
      </Modal>

      {/* Remove Confirm Modal */}
      <Modal isOpen={!!removingMember} onClose={() => setRemovingMember(null)} title="Remove Member" size="sm">
        <p className="mb-5 text-text-secondary">Remove this member from the program?</p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setRemovingMember(null)} className="btn-ghost">Cancel</button>
          <button
            onClick={() => removingMember && removeMember.mutate(removingMember)}
            disabled={removeMember.isPending}
            className="btn-danger"
          >
            {removeMember.isPending ? 'Removing...' : 'Remove'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
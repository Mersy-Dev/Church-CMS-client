/**
 * ChurchOS — src/features/training/MentorshipsTab.tsx
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Plus, Heart, ArrowRight, Search, X, ChevronDown, ChevronUp, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import Modal from '../../components/ui/Modal';
import { PageLoader } from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import Avatar from '../../components/ui/Avatar';
import type { Mentorship, MentorshipStatus } from '../../types/training.types';
import type { Member } from '../../types';

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(d?: string) {
  if (!d) return '—';
  try { return format(new Date(d), 'dd MMM yyyy'); } catch { return '—'; }
}

const STATUS_META: Record<MentorshipStatus, { label: string; color: string }> = {
  active:    { label: 'Active',    color: '#5ce08a' },
  completed: { label: 'Completed', color: '#DAA520' },
  paused:    { label: 'Paused',    color: '#5c9ee0' },
  cancelled: { label: 'Cancelled', color: '#e05c5c' },
};

// ── Inline member dropdown ─────────────────────────────────────────────────────
function MemberSelect({ label, value, onChange, members, excludeIds = [] }: {
  label: string; value: string; onChange: (id: string) => void; members: Member[]; excludeIds?: string[];
}) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const selected = members.find((m) => m._id === value);
  const filtered = members.filter((m) => {
    if (excludeIds.includes(m._id) && m._id !== value) return false;
    if (!q) return true;
    const query = q.toLowerCase();
    return m.firstName.toLowerCase().includes(query) || m.lastName.toLowerCase().includes(query) || (m.membershipId || '').toLowerCase().includes(query);
  });

  return (
    <div className="form-field" style={{ position: 'relative' }}>
      <label className="label">{label} *</label>
      <div onClick={() => setOpen((o) => !o)}
        className="input cursor-pointer flex items-center gap-2" style={{ userSelect: 'none' }}>
        {selected ? (
          <>
            <Avatar name={`${selected.firstName} ${selected.lastName}`} photoUrl={selected.photoUrl} size="xs" />
            <span className="flex-1 text-sm" style={{ color: 'var(--text-primary)' }}>{selected.firstName} {selected.lastName}</span>
            <button type="button" onClick={(e) => { e.stopPropagation(); onChange(''); }} style={{ color: 'var(--text-muted)' }}><X size={13} /></button>
          </>
        ) : <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Search member...</span>}
      </div>
      {open && (
        <div style={{
          position: 'absolute', zIndex: 50, top: '100%', left: 0, right: 0, marginTop: 4,
          background: 'var(--bg-surface, #111)', border: '1px solid var(--bg-border)',
          borderRadius: 12, boxShadow: '0 16px 40px rgba(0,0,0,0.4)', maxHeight: 240,
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          <div className="flex items-center gap-2 px-3 py-2.5" style={{ borderBottom: '1px solid var(--bg-border)' }}>
            <Search size={13} style={{ color: 'var(--text-muted)' }} />
            <input autoFocus type="text" value={q} onChange={(e) => setQ(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              placeholder="Search..." className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: 'var(--text-primary)' }} />
            {q && <button type="button" onClick={() => setQ('')} style={{ color: 'var(--text-muted)' }}><X size={12} /></button>}
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {filtered.slice(0, 20).map((m) => (
              <button key={m._id} type="button"
                onClick={() => { onChange(m._id); setOpen(false); setQ(''); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-white/5 transition-colors">
                <Avatar name={`${m.firstName} ${m.lastName}`} photoUrl={m.photoUrl} size="xs" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{m.firstName} {m.lastName}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{m.membershipId}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Mentorship Card ───────────────────────────────────────────────────────────
function MentorshipCard({ mentorship, onAddLog, onUpdateStatus, onClick }: {
  mentorship: Mentorship;
  onAddLog: () => void;
  onUpdateStatus: (s: MentorshipStatus) => void;
  onClick: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const meta = STATUS_META[mentorship.status];

  return (
    <div
      className="rounded-2xl overflow-hidden cursor-pointer"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--bg-border)',
        transition: 'box-shadow 0.2s, border-color 0.2s, transform 0.2s',
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(218,165,32,0.3)';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--bg-border)';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
      }}
    >
      <div className="h-1 w-full" style={{ background: meta.color }} />
      <div className="p-5 space-y-4">
        {/* Status + focus */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: `${meta.color}18`, color: meta.color, border: `1px solid ${meta.color}28` }}>
                {meta.label}
              </span>
            </div>
            {mentorship.focus && (
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{mentorship.focus}</p>
            )}
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Since {fmt(mentorship.startDate)}{mentorship.endDate ? ` → ${fmt(mentorship.endDate)}` : ''}
            </p>
          </div>
        </div>

        {/* Mentor → Mentee */}
        <div className="flex items-center gap-3">
          <div className="flex-1 flex items-center gap-2 p-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--bg-border)' }}>
            <Avatar name={`${mentorship.mentorId.firstName} ${mentorship.mentorId.lastName}`} photoUrl={mentorship.mentorId.photoUrl} size="sm" />
            <div className="min-w-0">
              <p className="text-xs text-text-muted">Mentor</p>
              <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                {mentorship.mentorId.firstName} {mentorship.mentorId.lastName}
              </p>
            </div>
          </div>
          <ArrowRight size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <div className="flex-1 flex items-center gap-2 p-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--bg-border)' }}>
            <Avatar name={`${mentorship.menteeId.firstName} ${mentorship.menteeId.lastName}`} photoUrl={mentorship.menteeId.photoUrl} size="sm" />
            <div className="min-w-0">
              <p className="text-xs text-text-muted">Mentee</p>
              <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                {mentorship.menteeId.firstName} {mentorship.menteeId.lastName}
              </p>
            </div>
          </div>
        </div>

        {/* Meeting logs toggle */}
        <div>
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
            className="flex items-center gap-1.5 text-xs font-medium transition-opacity hover:opacity-70"
            style={{ color: meta.color }}
          >
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            {mentorship.meetingLogs.length} meeting log{mentorship.meetingLogs.length !== 1 ? 's' : ''}
          </button>
          {expanded && (
            <div className="mt-2 space-y-2">
              {mentorship.meetingLogs.length === 0 ? (
                <p className="text-xs text-text-muted pl-1">No logs yet.</p>
              ) : (
                [...mentorship.meetingLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((log) => (
                  <div key={log._id} className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--bg-border)' }}>
                    <p className="text-xs font-medium" style={{ color: '#DAA520' }}>{fmt(log.date)}</p>
                    {log.summary && <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{log.summary}</p>}
                    {log.nextSteps && <p className="text-xs mt-1 italic" style={{ color: 'var(--text-muted)' }}>Next: {log.nextSteps}</p>}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1" style={{ borderTop: '1px solid var(--bg-border)' }}>
          {mentorship.status === 'active' && (
            <button
              onClick={(e) => { e.stopPropagation(); onAddLog(); }}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg font-medium"
              style={{ background: 'rgba(218,165,32,0.1)', color: '#DAA520', border: '1px solid rgba(218,165,32,0.2)' }}>
              <Plus size={12} /> Log Meeting
            </button>
          )}
          {mentorship.status === 'active' && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); onUpdateStatus('paused'); }}
                className="text-xs px-2.5 py-1.5 rounded-lg font-medium"
                style={{ background: 'rgba(92,158,224,0.08)', color: '#5c9ee0', border: '1px solid rgba(92,158,224,0.2)' }}>
                Pause
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onUpdateStatus('completed'); }}
                className="text-xs px-2.5 py-1.5 rounded-lg font-medium"
                style={{ background: 'rgba(92,224,138,0.08)', color: '#5ce08a', border: '1px solid rgba(92,224,138,0.2)' }}>
                Complete
              </button>
            </>
          )}
          {mentorship.status === 'paused' && (
            <button
              onClick={(e) => { e.stopPropagation(); onUpdateStatus('active'); }}
              className="text-xs px-2.5 py-1.5 rounded-lg font-medium"
              style={{ background: 'rgba(92,224,138,0.08)', color: '#5ce08a', border: '1px solid rgba(92,224,138,0.2)' }}>
              Resume
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Add Meeting Log Modal ─────────────────────────────────────────────────────
function AddLogModal({ isOpen, onClose, mentorshipId, onSuccess }: {
  isOpen: boolean; onClose: () => void; mentorshipId: string; onSuccess: () => void;
}) {
  const [form, setForm] = useState({ date: format(new Date(), 'yyyy-MM-dd'), summary: '', nextSteps: '' });
  const mutation = useMutation({
    mutationFn: (data: any) => api.post(`/training/mentorships/${mentorshipId}/logs`, data),
    onSuccess: () => { toast.success('Meeting logged!'); onSuccess(); onClose(); setForm({ date: format(new Date(), 'yyyy-MM-dd'), summary: '', nextSteps: '' }); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Log Meeting" size="sm">
      <div className="space-y-4">
        <div className="form-field">
          <label className="label">Meeting Date *</label>
          <input type="date" className="input" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} />
        </div>
        <div className="form-field">
          <label className="label">Summary</label>
          <textarea className="input resize-none h-20" value={form.summary} onChange={(e) => setForm((p) => ({ ...p, summary: e.target.value }))} placeholder="What was discussed?" />
        </div>
        <div className="form-field">
          <label className="label">Next Steps</label>
          <textarea className="input resize-none h-16" value={form.nextSteps} onChange={(e) => setForm((p) => ({ ...p, nextSteps: e.target.value }))} placeholder="Action items..." />
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="btn-ghost">Cancel</button>
          <button onClick={() => mutation.mutate(form)} disabled={mutation.isPending} className="btn-gold">
            {mutation.isPending ? 'Saving...' : 'Save Log'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Create Mentorship Modal ───────────────────────────────────────────────────
function CreateMentorshipModal({ isOpen, onClose, onSuccess }: {
  isOpen: boolean; onClose: () => void; onSuccess: () => void;
}) {
  const [mentorId, setMentorId] = useState('');
  const [menteeId, setMenteeId] = useState('');
  const [focus, setFocus] = useState('');
  const [goalNotes, setGoalNotes] = useState('');

  const { data: members = [] } = useQuery<Member[]>({
    queryKey: ['members-dropdown'],
    queryFn: async () => {
      const res = await api.get('/members?limit=300');
      return res.data.data as Member[];
    },
    enabled: isOpen,
  });

  const mutation = useMutation({
    mutationFn: (data: any) => api.post('/training/mentorships', data),
    onSuccess: () => { toast.success('Mentorship created!'); onSuccess(); onClose(); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const submit = () => {
    if (!mentorId || !menteeId) { toast.error('Both mentor and mentee are required'); return; }
    if (mentorId === menteeId) { toast.error('Mentor and mentee cannot be the same person'); return; }
    mutation.mutate({ mentorId, menteeId, focus: focus || undefined, goalNotes: goalNotes || undefined });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Mentorship" size="md">
      <div className="space-y-4">
        <MemberSelect label="Mentor" value={mentorId} onChange={setMentorId} members={members} excludeIds={[menteeId]} />
        <MemberSelect label="Mentee" value={menteeId} onChange={setMenteeId} members={members} excludeIds={[mentorId]} />
        <div className="form-field">
          <label className="label">Focus Area</label>
          <input className="input" value={focus} onChange={(e) => setFocus(e.target.value)} placeholder="e.g. Prayer & Spiritual Growth" />
        </div>
        <div className="form-field">
          <label className="label">Goals / Notes</label>
          <textarea className="input resize-none h-20" value={goalNotes} onChange={(e) => setGoalNotes(e.target.value)} placeholder="What are the goals for this mentorship?" />
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="btn-ghost">Cancel</button>
          <button onClick={submit} disabled={mutation.isPending} className="btn-gold">
            {mutation.isPending ? 'Creating...' : 'Create Mentorship'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function MentorshipsTab() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [loggingId, setLoggingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<MentorshipStatus | 'all'>('all');

  const { data, isLoading } = useQuery({
    queryKey: ['mentorships', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '50' });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const res = await api.get(`/training/mentorships?${params}`);
      return res.data.data as Mentorship[];
    },
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: MentorshipStatus }) =>
      api.patch(`/training/mentorships/${id}`, { status }),
    onSuccess: () => { toast.success('Status updated'); qc.invalidateQueries({ queryKey: ['mentorships'] }); qc.invalidateQueries({ queryKey: ['training-stats'] }); },
    onError: () => toast.error('Failed'),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['mentorships'] });
    qc.invalidateQueries({ queryKey: ['training-stats'] });
  };

  const mentorships = data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {(['all', 'active', 'paused', 'completed', 'cancelled'] as const).map((s) => {
            const meta = s !== 'all' ? STATUS_META[s] : null;
            return (
              <button key={s} onClick={() => setStatusFilter(s)}
                className="text-xs px-3 py-1.5 rounded-lg font-medium capitalize transition-all"
                style={statusFilter === s
                  ? { background: meta ? `${meta.color}18` : 'rgba(218,165,32,0.12)', color: meta?.color ?? '#DAA520', border: `1px solid ${meta?.color ?? '#DAA520'}30` }
                  : { background: 'rgba(255,255,255,0.04)', color: 'var(--text-muted)', border: '1px solid var(--bg-border)' }}>
                {s === 'all' ? 'All' : STATUS_META[s].label}
              </button>
            );
          })}
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-gold flex items-center gap-2 text-sm">
          <Plus size={14} /> New Mentorship
        </button>
      </div>

      {isLoading ? (
        <PageLoader />
      ) : mentorships.length === 0 ? (
        <EmptyState
          icon="🤝"
          title="No mentorships found"
          description="Pair a mentor with a mentee to start tracking discipleship"
          action={<button onClick={() => setShowCreate(true)} className="btn-gold">Create Mentorship</button>}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {mentorships.map((m) => (
            <MentorshipCard
              key={m._id}
              mentorship={m}
              onClick={() => navigate(`/training/mentorships/${m._id}`)}
              onAddLog={() => setLoggingId(m._id)}
              onUpdateStatus={(s) => updateStatus.mutate({ id: m._id, status: s })}
            />
          ))}
        </div>
      )}

      <CreateMentorshipModal isOpen={showCreate} onClose={() => setShowCreate(false)} onSuccess={invalidate} />

      {loggingId && (
        <AddLogModal
          isOpen={!!loggingId}
          onClose={() => setLoggingId(null)}
          mentorshipId={loggingId}
          onSuccess={() => { qc.invalidateQueries({ queryKey: ['mentorships'] }); setLoggingId(null); }}
        />
      )}
    </div>
  );
}
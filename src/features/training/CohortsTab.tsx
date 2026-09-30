/**
 * ChurchOS — src/features/training/CohortsTab.tsx
 * Word House Brand: Navy #1A56A0 (dominant) + Crimson #C41E3A (accent)
 * TEXT RULE: All body text uses CSS vars — never hardcoded dark hex.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, Calendar, MapPin, Eye } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import Modal from '../../components/ui/Modal';
import { PageLoader } from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import Avatar from '../../components/ui/Avatar';
import type { TrainingCohort, CohortStatus, TrainingProgram } from '../../types/training.types';

// ── Word House Brand Colors ───────────────────────────────────────────────────
const NAVY       = '#1A56A0';
const NAVY_LIGHT = '#4A8FD4';
const CRIMSON    = '#C41E3A';
const GREEN      = '#2E8B57';

// Status → brand-anchored palette (was arbitrary bright colors)
const STATUS_META: Record<CohortStatus, { label: string; color: string }> = {
  upcoming:  { label: 'Upcoming',  color: NAVY_LIGHT }, // was #5c9ee0
  active:    { label: 'Active',    color: GREEN      }, // was #5ce08a
  completed: { label: 'Completed', color: NAVY       }, // was gold #DAA520
  cancelled: { label: 'Cancelled', color: CRIMSON    }, // was #e05c5c
};

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

function fmt(d?: string) {
  if (!d) return '—';
  try { return format(new Date(d), 'dd MMM yyyy'); } catch { return '—'; }
}

// ── Cohort Card ───────────────────────────────────────────────────────────────
function CohortCard({ cohort }: { cohort: TrainingCohort }) {
  const navigate = useNavigate();
  const meta = STATUS_META[cohort.status];
  const program = cohort.programId as TrainingProgram;
  const total = cohort.maxEnrollment;
  const enrolled = cohort.enrolledCount ?? 0;
  const pct = total ? Math.min(100, Math.round((enrolled / total) * 100)) : null;

  return (
    <div
      className="rounded-2xl overflow-hidden cursor-pointer"
      style={{
        background: 'var(--bg-card, rgba(255,255,255,0.04))',
        border: '1px solid rgba(26,86,160,0.18)',
        transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(26,86,160,0.18)';
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(26,86,160,0.4)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform = '';
        (e.currentTarget as HTMLElement).style.boxShadow = '';
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(26,86,160,0.18)';
      }}
      onClick={() => navigate(`/training/cohorts/${cohort._id}`)}
    >
      {/* Status color bar */}
      <div className="h-1.5 w-full" style={{ background: meta.color }} />

      <div className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: `${meta.color}18`, color: meta.color, border: `1px solid ${meta.color}30` }}
              >
                {meta.label}
              </span>
            </div>
            {/* Cohort name: CSS var */}
            <h3 className="font-display font-bold text-base leading-tight text-text-primary">
              {cohort.name}
            </h3>
            {program?.name && (
              <p className="text-xs mt-0.5 text-text-muted">{program.name}</p>
            )}
          </div>
        </div>

        {/* Facilitator */}
        {cohort.facilitatorId && (
          <div className="flex items-center gap-2">
            <Avatar
              name={`${cohort.facilitatorId.firstName} ${cohort.facilitatorId.lastName}`}
              photoUrl={cohort.facilitatorId.photoUrl}
              size="xs"
            />
            <span className="text-xs text-text-secondary">
              {cohort.facilitatorId.firstName} {cohort.facilitatorId.lastName}
            </span>
            <span className="text-xs ml-auto text-text-muted">Facilitator</span>
          </div>
        )}

        {/* Dates / Venue */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            <Calendar size={11} style={{ color: NAVY }} />
            {fmt(cohort.startDate)}{cohort.endDate ? ` → ${fmt(cohort.endDate)}` : ''}
          </div>
          {cohort.venue && (
            <div className="flex items-center gap-1.5 text-xs text-text-muted">
              <MapPin size={11} style={{ color: NAVY }} /> {cohort.venue}
            </div>
          )}
          {cohort.meetingDays?.length ? (
            <p className="text-xs text-text-muted">
              {cohort.meetingDays.join(', ')}{cohort.meetingTime ? ` · ${cohort.meetingTime}` : ''}
            </p>
          ) : null}
        </div>

        {/* Enrollment bar */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-text-muted">
              {enrolled} enrolled{cohort.graduatedCount ? ` · ${cohort.graduatedCount} graduated` : ''}
            </span>
            {total && <span className="text-xs text-text-muted">/ {total} max</span>}
          </div>
          {pct !== null && (
            <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div
                className="h-1.5 rounded-full transition-all"
                style={{ width: `${pct}%`, background: pct >= 90 ? CRIMSON : meta.color }}
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-1" style={{ borderTop: '1px solid rgba(26,86,160,0.12)' }}>
          <button
            onClick={() => navigate(`/training/cohorts/${cohort._id}`)}
            className="flex items-center gap-1.5 text-xs font-medium hover:opacity-70 transition-opacity"
            style={{ color: meta.color }}
          >
            <Eye size={13} /> View Details
          </button>
          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            <Users size={11} /> {enrolled}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Create Cohort Modal ───────────────────────────────────────────────────────
function CreateCohortModal({ isOpen, onClose, onSuccess }: {
  isOpen: boolean; onClose: () => void; onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    programId: '', name: '', startDate: '', endDate: '',
    venue: '', meetingDays: [] as string[], meetingTime: '',
    maxEnrollment: '', notes: '',
    facilitatorId: '', coFacilitatorId: '',
  });

  const set = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  const { data: programs = [] } = useQuery<TrainingProgram[]>({
    queryKey: ['training-programs'],
    queryFn: async () => {
      const res = await api.get('/training/programs?active=true');
      return res.data.data as TrainingProgram[];
    },
    enabled: isOpen,
  });

  const mutation = useMutation({
    mutationFn: (data: any) => api.post('/training/cohorts', data),
    onSuccess: () => { toast.success('Cohort created!'); onSuccess(); onClose(); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const toggleDay = (d: string) => {
    set('meetingDays', form.meetingDays.includes(d)
      ? form.meetingDays.filter((x) => x !== d)
      : [...form.meetingDays, d]);
  };

  const submit = () => {
    if (!form.programId || !form.name || !form.startDate) {
      toast.error('Program, name and start date are required');
      return;
    }
    mutation.mutate({
      ...form,
      maxEnrollment: form.maxEnrollment ? Number(form.maxEnrollment) : undefined,
      facilitatorId: form.facilitatorId || undefined,
      coFacilitatorId: form.coFacilitatorId || undefined,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Cohort" size="lg">
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
        <div className="form-field">
          <label className="label">Program *</label>
          <select className="input" value={form.programId} onChange={(e) => set('programId', e.target.value)}>
            <option value="">Select a program...</option>
            {programs.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>
        </div>
        <div className="form-field">
          <label className="label">Cohort Name *</label>
          <input
            className="input" value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="e.g. Integration Class – May 2025"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="form-field">
            <label className="label">Start Date *</label>
            <input type="date" className="input" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} />
          </div>
          <div className="form-field">
            <label className="label">End Date</label>
            <input type="date" className="input" value={form.endDate} onChange={(e) => set('endDate', e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="form-field">
            <label className="label">Venue</label>
            <input className="input" value={form.venue} onChange={(e) => set('venue', e.target.value)} placeholder="Church Hall A" />
          </div>
          <div className="form-field">
            <label className="label">Meeting Time</label>
            <input className="input" value={form.meetingTime} onChange={(e) => set('meetingTime', e.target.value)} placeholder="9:00 AM" />
          </div>
        </div>

        {/* Meeting Days: navy active (was gold) */}
        <div className="form-field">
          <label className="label">Meeting Days</label>
          <div className="flex flex-wrap gap-2 mt-1">
            {DAYS.map((d) => (
              <button
                key={d} type="button" onClick={() => toggleDay(d)}
                className="text-xs px-2.5 py-1 rounded-lg font-medium transition-all"
                style={form.meetingDays.includes(d)
                  ? { background: 'rgba(26,86,160,0.15)', color: NAVY_LIGHT, border: '1px solid rgba(26,86,160,0.35)' }
                  : { background: 'rgba(255,255,255,0.04)', color: 'var(--text-muted)', border: '1px solid var(--bg-border)' }
                }
              >
                {d.slice(0, 3)}
              </button>
            ))}
          </div>
        </div>

        <div className="form-field">
          <label className="label">Max Enrollment</label>
          <input
            type="number" min={1} className="input"
            value={form.maxEnrollment}
            onChange={(e) => set('maxEnrollment', e.target.value)}
            placeholder="Leave blank for unlimited"
          />
        </div>
        <div className="form-field">
          <label className="label">Notes</label>
          <textarea
            className="input resize-none h-16"
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            placeholder="Any notes about this cohort..."
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 mt-2" style={{ borderTop: '1px solid var(--bg-border)' }}>
        <button onClick={onClose} className="btn-ghost">Cancel</button>
        {/* Create Cohort: navy (was gold) */}
        <button
          onClick={submit} disabled={mutation.isPending}
          className="px-4 py-2 rounded-lg font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          style={{ background: NAVY }}
          onMouseEnter={(e) => { if (!mutation.isPending) (e.currentTarget as HTMLElement).style.background = '#164882'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = NAVY; }}
        >
          {mutation.isPending ? 'Creating...' : 'Create Cohort'}
        </button>
      </div>
    </Modal>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function CohortsTab() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [statusFilter, setStatusFilter] = useState<CohortStatus | 'all'>('all');

  const { data, isLoading } = useQuery({
    queryKey: ['training-cohorts', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '50' });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const res = await api.get(`/training/cohorts?${params}`);
      return res.data.data as TrainingCohort[];
    },
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['training-cohorts'] });
    qc.invalidateQueries({ queryKey: ['training-stats'] });
  };

  const cohorts = data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Filter pills: navy active (was gold fallback) */}
        <div className="flex flex-wrap gap-2">
          {(['all', 'upcoming', 'active', 'completed', 'cancelled'] as const).map((s) => {
            const meta = s !== 'all' ? STATUS_META[s] : null;
            const isActive = statusFilter === s;
            const activeColor = meta?.color ?? NAVY;
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all capitalize"
                style={isActive
                  ? { background: `${activeColor}18`, color: activeColor, border: `1px solid ${activeColor}35` }
                  : { background: 'rgba(255,255,255,0.04)', color: 'var(--text-muted)', border: '1px solid var(--bg-border)' }
                }
              >
                {s === 'all' ? 'All' : STATUS_META[s].label}
              </button>
            );
          })}
        </div>

        {/* New Cohort: navy (was gold) */}
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg font-semibold text-white transition-all"
          style={{ background: NAVY }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#164882'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = NAVY; }}
        >
          <Plus size={14} /> New Cohort
        </button>
      </div>

      {isLoading ? (
        <PageLoader />
      ) : cohorts.length === 0 ? (
        <EmptyState
          icon="🎓"
          title="No cohorts found"
          description="Create a cohort to start enrolling members"
          action={
            <button
              onClick={() => setShowCreate(true)}
              className="px-4 py-2 rounded-lg font-semibold text-white transition-all"
              style={{ background: NAVY }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#164882'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = NAVY; }}
            >
              Create Cohort
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cohorts.map((c) => <CohortCard key={c._id} cohort={c} />)}
        </div>
      )}

      <CreateCohortModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onSuccess={invalidate}
      />
    </div>
  );
}
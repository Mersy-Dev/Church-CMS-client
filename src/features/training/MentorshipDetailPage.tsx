import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  ArrowLeft, Heart, User, Plus, Trash2, Star, MessageSquare,
  ChevronRight, Calendar, Target,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import api from '../../lib/api';
import { PageLoader } from '../../components/ui/Spinner';
import Avatar from '../../components/ui/Avatar';
import Modal from '../../components/ui/Modal';
import type { Mentorship, MeetingLog, MeetingLogFormData } from '../../types/training.types';
import type { Member } from '../../types';

// ── Word House Brand Colors ───────────────────────────────────────────────────
// TEXT RULE: Body text always uses CSS vars — never hardcoded dark hex values.
const COLORS = {
  navy:      '#1A56A0',  // Dominant
  navyLight: '#4A8FD4',  // Lighter navy — readable on dark cards
  crimson:   '#C41E3A',  // Accent
  green:     '#2E8B57',  // Functional
};

function fmt(d?: string) {
  if (!d) return '—';
  try { return format(new Date(d), 'dd MMM yyyy'); } catch { return '—'; }
}

const statusColor: Record<string, { bg: string; text: string; border: string }> = {
  active:    { bg: 'rgba(26,86,160,0.12)',  text: '#4A8FD4',  border: 'rgba(26,86,160,0.3)'  },
  completed: { bg: 'rgba(46,139,87,0.12)',  text: '#2E8B57',  border: 'rgba(46,139,87,0.3)'  },
  paused:    { bg: 'rgba(26,86,160,0.08)',  text: '#1A56A0',  border: 'rgba(26,86,160,0.25)' },
  cancelled: { bg: 'rgba(239,68,68,0.1)',   text: '#ef4444',  border: 'rgba(239,68,68,0.25)' },
};

function StatusPill({ status }: { status: string }) {
  const c = statusColor[status] ?? statusColor.active;
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
          {/* Section title: navyLight — readable on dark card header */}
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

// ── Log Meeting Modal ─────────────────────────────────────────────────────────
function LogMeetingModal({ mentorshipId, onClose, onSuccess }: {
  mentorshipId: string; onClose: () => void; onSuccess: () => void;
}) {
  const today = new Date().toISOString().split('T')[0];
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<MeetingLogFormData>({
    defaultValues: { date: today, rating: 3 },
  });
  const [hoveredStar, setHoveredStar] = useState(0);
  const rating = watch('rating') ?? 0;

  const mutation = useMutation({
    mutationFn: (data: MeetingLogFormData) =>
      api.post(`/training/mentorships/${mentorshipId}/logs`, data),
    onSuccess: () => { toast.success('Meeting logged'); onSuccess(); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to log meeting'),
  });

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
      <div>
        {/* Labels: navyLight */}
        <label className="label" style={{ color: COLORS.navyLight, fontWeight: 600 }}>Meeting Date *</label>
        {/* Input: no inline color — let .input class handle */}
        <input type="date" className="input" {...register('date', { required: true })} />
      </div>
      <div>
        <label className="label" style={{ color: COLORS.navyLight, fontWeight: 600 }}>Summary *</label>
        <textarea
          className="input resize-none" rows={3}
          {...register('summary', { required: 'Summary is required' })}
          placeholder="What was discussed? Key takeaways..."
        />
        {errors.summary && <p className="text-red-400 text-xs mt-1">{errors.summary.message}</p>}
      </div>
      <div>
        <label className="label" style={{ color: COLORS.navyLight, fontWeight: 600 }}>Next Steps</label>
        <textarea
          className="input resize-none" rows={2}
          {...register('nextSteps')}
          placeholder="Action items for next meeting..."
        />
      </div>
      <div>
        <label className="label" style={{ color: COLORS.navyLight, fontWeight: 600 }}>Session Rating</label>
        <div className="flex items-center gap-1 mt-1">
          {[1,2,3,4,5].map((star) => (
            <button
              type="button" key={star}
              onMouseEnter={() => setHoveredStar(star)}
              onMouseLeave={() => setHoveredStar(0)}
              onClick={() => setValue('rating', star as any)}
              className="text-2xl transition-transform hover:scale-110"
            >
              {/* Stars: navy (was gold) */}
              <span style={{ color: star <= (hoveredStar || rating) ? COLORS.navyLight : 'rgba(26,86,160,0.25)' }}>★</span>
            </button>
          ))}
          <span className="ml-2 text-xs font-medium text-text-muted">{rating}/5</span>
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
        {/* Log Meeting: navy (was gold) */}
        <button
          type="submit" disabled={mutation.isPending}
          className="px-4 py-2 rounded-lg font-semibold text-white transition-all disabled:opacity-50"
          style={{ background: COLORS.navy }}
          onMouseEnter={(e) => { if (!mutation.isPending) (e.currentTarget as HTMLElement).style.background = '#164882'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = COLORS.navy; }}
        >
          {mutation.isPending ? 'Saving...' : 'Log Meeting'}
        </button>
      </div>
    </form>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function MentorshipDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showLog, setShowLog] = useState(false);
  const [deletingLog, setDeletingLog] = useState<string | null>(null);

  const { data: mentorship, isLoading } = useQuery<Mentorship>({
    queryKey: ['training-mentorship', id],
    queryFn: async () => (await api.get(`/training/mentorships/${id}`)).data.data,
    enabled: !!id,
  });

  const { data: allMembers } = useQuery<Member[]>({
    queryKey: ['members-list'],
    queryFn: async () => (await api.get('/members?limit=200')).data.data,
  });

  const deleteLog = useMutation({
    mutationFn: (logId: string) => api.delete(`/training/mentorships/${id}/logs/${logId}`),
    onSuccess: () => {
      toast.success('Log deleted');
      qc.invalidateQueries({ queryKey: ['training-mentorship', id] });
      setDeletingLog(null);
    },
    onError: () => toast.error('Failed to delete log'),
  });

  const updateStatus = useMutation({
    mutationFn: (status: string) => api.patch(`/training/mentorships/${id}`, { status }),
    onSuccess: () => {
      toast.success('Status updated');
      qc.invalidateQueries({ queryKey: ['training-mentorship', id] });
    },
    onError: () => toast.error('Failed to update status'),
  });

  if (isLoading) return <PageLoader />;
  if (!mentorship) return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
      <p className="text-text-muted">Mentorship not found.</p>
      <button onClick={() => navigate('/training')} className="btn-ghost flex items-center gap-2">
        <ArrowLeft size={16} /> Back to Training
      </button>
    </div>
  );

  const getMember = (ref: any): Member | undefined => {
    if (typeof ref === 'object' && ref?.firstName) return ref as Member;
    return allMembers?.find((m) => m._id === ref);
  };

  const mentor = getMember(mentorship.mentorId);
  const mentee = getMember(mentorship.menteeId);
  const logs: MeetingLog[] = mentorship.meetingLogs ?? [];
  const programName = mentorship.programId && typeof mentorship.programId === 'object'
    ? (mentorship.programId as any).name : null;

  const avgRating = logs.length > 0 && logs.some((l) => l.rating)
    ? (logs.reduce((s, l) => s + (l.rating ?? 0), 0) / logs.filter((l) => l.rating).length).toFixed(1)
    : null;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <style>{`
        /* ── Word House Brand Colors ────────────────────────────────────────
           Dominant  : #1A56A0  (Word House Navy Blue)
           Accent    : #C41E3A  (Word House Crimson)
           TEXT RULE : Always use CSS vars for body text — never dark hex.
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

        .log-card { transition: border-color 0.2s; }
        .log-card:hover { border-color: rgba(26,86,160,0.4) !important; }

        .back-btn { color: var(--text-muted); transition: color 0.15s; }
        .back-btn:hover { color: #4A8FD4; }

        .view-link { color: var(--text-muted); transition: color 0.15s; }
        .view-link:hover { color: #4A8FD4; }

        .log-meeting-btn {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 12px; font-weight: 600;
          padding: 6px 12px; border-radius: 8px;
          background: rgba(26,86,160,0.12);
          color: #4A8FD4;
          border: 1px solid rgba(26,86,160,0.3);
          cursor: pointer; transition: background 0.15s;
        }
        .log-meeting-btn:hover { background: rgba(26,86,160,0.22); }
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
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Mentor ←Heart→ Mentee */}
          <div className="flex items-center gap-4">
            {[
              { role: 'Mentor', person: mentor, color: COLORS.navy },
              { role: 'Mentee', person: mentee, color: COLORS.navyLight },
            ].map(({ role, person, color }, idx) => (
              <>
                {idx === 1 && (
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-px h-6" style={{ background: 'rgba(26,86,160,0.2)' }} />
                    {/* Heart: crimson accent */}
                    <Heart size={20} style={{ color: COLORS.crimson }} />
                    <div className="w-px h-6" style={{ background: 'rgba(26,86,160,0.2)' }} />
                  </div>
                )}
                <div key={role} className="text-center">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-1.5"
                    style={{ background: `${color}15`, border: `1px solid ${color}40` }}
                  >
                    {person
                      ? <Avatar name={`${person.firstName} ${person.lastName}`} photoUrl={person.photoUrl} size="md" />
                      : <User size={20} style={{ color }} />
                    }
                  </div>
                  {/* Role label: brand color */}
                  <p className="text-xs font-semibold" style={{ color }}>{role}</p>
                  {/* Name: CSS var */}
                  <p className="text-sm font-medium text-text-primary">
                    {person ? `${person.firstName} ${person.lastName}` : '—'}
                  </p>
                  {person && (
                    <button
                      onClick={() => navigate(`/members/${person._id}`)}
                      className="view-link text-xs mt-0.5 flex items-center gap-0.5 mx-auto"
                    >
                      View <ChevronRight size={11} />
                    </button>
                  )}
                </div>
              </>
            ))}
          </div>

          {/* Right meta */}
          <div className="flex flex-col items-end gap-2">
            <StatusPill status={mentorship.status} />
            {mentorship.focus && (
              <span
                className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(26,86,160,0.1)', color: COLORS.navyLight, border: '1px solid rgba(26,86,160,0.25)' }}
              >
                <Target size={11} /> {mentorship.focus}
              </span>
            )}
            {programName && (
              <span className="text-xs text-text-muted">
                Program: <span style={{ color: COLORS.navyLight, fontWeight: 600 }}>{programName}</span>
              </span>
            )}
            {/* Status select: no inline color on value text */}
            <select
              className="input text-xs py-1 h-auto w-auto"
              value={mentorship.status}
              onChange={(e) => updateStatus.mutate(e.target.value)}
              disabled={updateStatus.isPending}
            >
              {['active', 'paused', 'completed', 'cancelled'].map((s) => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>

        {mentorship.notes && (
          <p
            className="mt-4 text-sm leading-relaxed p-3 rounded-xl text-text-secondary"
            style={{ background: 'rgba(26,86,160,0.06)', borderLeft: '3px solid rgba(26,86,160,0.35)' }}
          >
            {mentorship.notes}
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="ds grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Meetings',   value: logs.length,                              color: COLORS.navy      },
          { label: 'Avg Rating', value: avgRating ? `${avgRating}★` : '—',        color: COLORS.navyLight },
          { label: 'Started',    value: fmt(mentorship.startDate),                color: COLORS.crimson   },
          { label: 'Duration',   value: mentorship.startDate
              ? `${Math.round((Date.now() - new Date(mentorship.startDate).getTime()) / (1000*60*60*24*7))}w`
              : '—',                                                               color: COLORS.green     },
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
            {/* Stat label: CSS var */}
            <p className="text-xs mt-0.5 text-text-muted">{label}</p>
          </div>
        ))}
      </div>

      {/* Meeting logs */}
      <div className="ds">
        <Section
          title={`Meeting Logs (${logs.length})`}
          icon={<MessageSquare size={15} />}
          action={
            <button onClick={() => setShowLog(true)} className="log-meeting-btn">
              <Plus size={13} /> Log Meeting
            </button>
          }
        >
          {logs.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare size={32} className="mx-auto mb-3 opacity-20 text-text-muted" />
              <p className="text-sm text-text-muted">No meetings logged yet</p>
              <button
                onClick={() => setShowLog(true)}
                className="mt-3 text-xs font-semibold transition-opacity hover:opacity-70"
                style={{ color: COLORS.navyLight }}
              >
                + Log first meeting
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {[...logs].reverse().map((log, i) => (
                <div
                  key={log._id ?? i}
                  className="log-card rounded-xl p-4"
                  style={{ background: 'rgba(26,86,160,0.05)', border: '1px solid rgba(26,86,160,0.14)' }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        {/* Date: navyLight */}
                        <span className="flex items-center gap-1 text-xs font-medium" style={{ color: COLORS.navyLight }}>
                          <Calendar size={11} /> {fmt(log.date)}
                        </span>
                        {/* Stars: navy */}
                        {log.rating && (
                          <span className="text-xs" style={{ color: COLORS.navyLight }}>
                            {'★'.repeat(log.rating)}{'☆'.repeat(5 - log.rating)}
                          </span>
                        )}
                      </div>
                      {/* Summary: CSS var — never darkNavy */}
                      <p className="text-sm leading-relaxed text-text-primary">{log.summary}</p>
                      {log.nextSteps && (
                        <p
                          className="text-xs mt-2 p-2 rounded-lg text-text-secondary"
                          style={{ background: 'rgba(26,86,160,0.08)', borderLeft: '2px solid rgba(26,86,160,0.35)' }}
                        >
                          <span style={{ color: COLORS.navyLight, fontWeight: 600 }}>Next: </span>{log.nextSteps}
                        </p>
                      )}
                    </div>
                    {log._id && (
                      <button
                        onClick={() => setDeletingLog(log._id!)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg flex-shrink-0 text-text-muted hover:text-red-400 hover:bg-red-500/10 opacity-30 hover:opacity-100 transition-all"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>

      {/* Meta */}
      <div
        className="ds rounded-xl px-5 py-3 flex gap-6 flex-wrap"
        style={{
          background: 'var(--bg-card, rgba(255,255,255,0.02))',
          border: '1px solid rgba(26,86,160,0.15)',
        }}
      >
        {[['Started', mentorship.startDate], ['Created', mentorship.createdAt], ['Updated', mentorship.updatedAt]].map(([l, v]) => (
          <div key={l}>
            <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: COLORS.navyLight }}>{l}</p>
            {/* Date value: CSS var */}
            <p className="text-sm font-medium text-text-primary">{fmt(v)}</p>
          </div>
        ))}
      </div>

      {/* Log Meeting Modal */}
      <Modal isOpen={showLog} onClose={() => setShowLog(false)} title="Log Meeting" size="md">
        <LogMeetingModal
          mentorshipId={id!}
          onClose={() => setShowLog(false)}
          onSuccess={() => { qc.invalidateQueries({ queryKey: ['training-mentorship', id] }); setShowLog(false); }}
        />
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal isOpen={!!deletingLog} onClose={() => setDeletingLog(null)} title="Delete Log" size="sm">
        <p className="mb-5 text-text-secondary">Delete this meeting log? This cannot be undone.</p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setDeletingLog(null)} className="btn-ghost">Cancel</button>
          <button
            onClick={() => deletingLog && deleteLog.mutate(deletingLog)}
            disabled={deleteLog.isPending}
            className="btn-danger"
          >
            {deleteLog.isPending ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
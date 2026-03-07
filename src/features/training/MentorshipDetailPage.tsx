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

function fmt(d?: string) {
  if (!d) return '—';
  try { return format(new Date(d), 'dd MMM yyyy'); } catch { return '—'; }
}

const statusColor: Record<string, { bg: string; text: string; border: string }> = {
  active:    { bg: 'rgba(34,197,94,0.08)',   text: '#4ade80', border: 'rgba(34,197,94,0.2)'   },
  completed: { bg: 'rgba(218,165,32,0.08)',  text: '#DAA520', border: 'rgba(218,165,32,0.2)'  },
  paused:    { bg: 'rgba(234,179,8,0.08)',   text: '#facc15', border: 'rgba(234,179,8,0.2)'   },
  cancelled: { bg: 'rgba(239,68,68,0.08)',   text: '#f87171', border: 'rgba(239,68,68,0.2)'   },
};

function StatusPill({ status }: { status: string }) {
  const c = statusColor[status] ?? statusColor.active;
  return (
    <span className="text-xs px-2.5 py-1 rounded-full font-medium"
      style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
      {status}
    </span>
  );
}

function Section({ title, icon, action, children }: {
  title: string; icon: React.ReactNode; action?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-border)' }}>
      <div className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: '1px solid var(--bg-border)' }}>
        <div className="flex items-center gap-2">
          <span style={{ color: '#DAA520' }}>{icon}</span>
          <h3 className="text-sm font-semibold uppercase tracking-wide"
            style={{ color: 'var(--text-secondary)' }}>{title}</h3>
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ── Log Meeting Modal ──────────────────────────────────────────────────────

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
        <label className="label">Meeting Date *</label>
        <input type="date" className="input" {...register('date', { required: true })} />
      </div>
      <div>
        <label className="label">Summary *</label>
        <textarea className="input resize-none" rows={3}
          {...register('summary', { required: 'Summary is required' })}
          placeholder="What was discussed? Key takeaways..." />
        {errors.summary && <p className="text-red-400 text-xs mt-1">{errors.summary.message}</p>}
      </div>
      <div>
        <label className="label">Next Steps</label>
        <textarea className="input resize-none" rows={2} {...register('nextSteps')}
          placeholder="Action items for next meeting..." />
      </div>
      <div>
        <label className="label">Session Rating</label>
        <div className="flex items-center gap-1 mt-1">
          {[1,2,3,4,5].map((star) => (
            <button type="button" key={star}
              onMouseEnter={() => setHoveredStar(star)}
              onMouseLeave={() => setHoveredStar(0)}
              onClick={() => setValue('rating', star as any)}
              className="text-2xl transition-transform hover:scale-110">
              <span style={{ color: star <= (hoveredStar || rating) ? '#DAA520' : 'var(--bg-border)' }}>★</span>
            </button>
          ))}
          <span className="ml-2 text-xs" style={{ color: 'var(--text-muted)' }}>
            {rating}/5
          </span>
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
        <button type="submit" disabled={mutation.isPending} className="btn-gold">
          {mutation.isPending ? 'Saving...' : 'Log Meeting'}
        </button>
      </div>
    </form>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

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
    mutationFn: (logId: string) =>
      api.delete(`/training/mentorships/${id}/logs/${logId}`),
    onSuccess: () => {
      toast.success('Log deleted');
      qc.invalidateQueries({ queryKey: ['training-mentorship', id] });
      setDeletingLog(null);
    },
    onError: () => toast.error('Failed to delete log'),
  });

  const updateStatus = useMutation({
    mutationFn: (status: string) =>
      api.patch(`/training/mentorships/${id}`, { status }),
    onSuccess: () => {
      toast.success('Status updated');
      qc.invalidateQueries({ queryKey: ['training-mentorship', id] });
    },
    onError: () => toast.error('Failed to update status'),
  });

  if (isLoading) return <PageLoader />;
  if (!mentorship) return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
      <p style={{ color: 'var(--text-muted)' }}>Mentorship not found.</p>
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
        @keyframes slideUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        .ds{animation:slideUp 0.35s ease both}
        .ds:nth-child(1){animation-delay:.05s}.ds:nth-child(2){animation-delay:.10s}
        .ds:nth-child(3){animation-delay:.15s}.ds:nth-child(4){animation-delay:.20s}
        .log-card{transition:border-color .2s}
        .log-card:hover{border-color:rgba(218,165,32,0.3)!important}
      `}</style>

      <button onClick={() => navigate('/training')}
        className="flex items-center gap-2 text-sm hover:opacity-70 transition-opacity"
        style={{ color: 'var(--text-muted)' }}>
        <ArrowLeft size={16} /> Back to Training
      </button>

      {/* Hero */}
      <div className="ds rounded-2xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-border)' }}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Pair display */}
          <div className="flex items-center gap-4">
            {/* Mentor */}
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-1.5"
                style={{ background: 'rgba(218,165,32,0.1)', border: '1px solid rgba(218,165,32,0.25)' }}>
                {mentor
                  ? <Avatar name={`${mentor.firstName} ${mentor.lastName}`} photoUrl={mentor.photoUrl} size="md" />
                  : <User size={20} style={{ color: '#DAA520' }} />
                }
              </div>
              <p className="text-xs font-semibold" style={{ color: '#DAA520' }}>Mentor</p>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {mentor ? `${mentor.firstName} ${mentor.lastName}` : '—'}
              </p>
              {mentor && (
                <button onClick={() => navigate(`/members/${mentor._id}`)}
                  className="text-xs mt-0.5 flex items-center gap-0.5 mx-auto"
                  style={{ color: 'var(--text-muted)' }}>
                  View <ChevronRight size={11} />
                </button>
              )}
            </div>

            {/* Heart connector */}
            <div className="flex flex-col items-center gap-1">
              <div className="w-px h-6" style={{ background: 'var(--bg-border)' }} />
              <Heart size={20} style={{ color: '#DAA520' }} />
              <div className="w-px h-6" style={{ background: 'var(--bg-border)' }} />
            </div>

            {/* Mentee */}
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-1.5"
                style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)' }}>
                {mentee
                  ? <Avatar name={`${mentee.firstName} ${mentee.lastName}`} photoUrl={mentee.photoUrl} size="md" />
                  : <User size={20} style={{ color: '#818cf8' }} />
                }
              </div>
              <p className="text-xs font-semibold" style={{ color: '#818cf8' }}>Mentee</p>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {mentee ? `${mentee.firstName} ${mentee.lastName}` : '—'}
              </p>
              {mentee && (
                <button onClick={() => navigate(`/members/${mentee._id}`)}
                  className="text-xs mt-0.5 flex items-center gap-0.5 mx-auto"
                  style={{ color: 'var(--text-muted)' }}>
                  View <ChevronRight size={11} />
                </button>
              )}
            </div>
          </div>

          {/* Right meta */}
          <div className="flex flex-col items-end gap-2">
            <StatusPill status={mentorship.status} />
            {mentorship.focus && (
              <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(218,165,32,0.06)', color: 'var(--text-muted)', border: '1px solid var(--bg-border)' }}>
                <Target size={11} style={{ color: '#DAA520' }} /> {mentorship.focus}
              </span>
            )}
            {programName && (
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Program: <span style={{ color: '#DAA520' }}>{programName}</span>
              </span>
            )}
            {/* Quick status change */}
            <select
              className="input text-xs py-1 h-auto w-auto"
              value={mentorship.status}
              onChange={(e) => updateStatus.mutate(e.target.value)}
              disabled={updateStatus.isPending}>
              {['active', 'paused', 'completed', 'cancelled'].map((s) => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>

        {mentorship.notes && (
          <p className="mt-4 text-sm leading-relaxed p-3 rounded-xl"
            style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)', borderLeft: '3px solid rgba(218,165,32,0.4)' }}>
            {mentorship.notes}
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="ds grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Meetings',   value: logs.length,                              color: '#DAA520' },
          { label: 'Avg Rating', value: avgRating ? `${avgRating}★` : '—',        color: '#facc15' },
          { label: 'Started',    value: fmt(mentorship.startDate),                color: '#818cf8' },
          { label: 'Duration',   value: mentorship.startDate
              ? `${Math.round((Date.now() - new Date(mentorship.startDate).getTime()) / (1000*60*60*24*7))}w`
              : '—',                                                               color: '#4ade80' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl p-4 text-center"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-border)' }}>
            <p className="text-2xl font-bold font-display" style={{ color }}>{value}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Meeting logs */}
      <div className="ds">
        <Section title={`Meeting Logs (${logs.length})`} icon={<MessageSquare size={15} />}
          action={
            <button onClick={() => setShowLog(true)}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg"
              style={{ background: 'rgba(218,165,32,0.1)', color: '#DAA520', border: '1px solid rgba(218,165,32,0.2)' }}>
              <Plus size={13} /> Log Meeting
            </button>
          }>
          {logs.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare size={32} className="mx-auto mb-3 opacity-20" style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No meetings logged yet</p>
              <button onClick={() => setShowLog(true)} className="mt-3 text-xs font-medium" style={{ color: '#DAA520' }}>
                + Log first meeting
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {[...logs].reverse().map((log, i) => (
                <div key={log._id ?? i} className="log-card rounded-xl p-4"
                  style={{ background: 'var(--bg-hover)', border: '1px solid var(--bg-border)' }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="flex items-center gap-1 text-xs"
                          style={{ color: '#DAA520' }}>
                          <Calendar size={11} /> {fmt(log.date)}
                        </span>
                        {log.rating && (
                          <span className="text-xs" style={{ color: '#facc15' }}>
                            {'★'.repeat(log.rating)}{'☆'.repeat(5 - log.rating)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                        {log.summary}
                      </p>
                      {log.nextSteps && (
                        <p className="text-xs mt-2 p-2 rounded-lg"
                          style={{ background: 'rgba(218,165,32,0.06)', color: 'var(--text-muted)',
                                   borderLeft: '2px solid rgba(218,165,32,0.3)' }}>
                          <span style={{ color: '#DAA520' }}>Next: </span>{log.nextSteps}
                        </p>
                      )}
                    </div>
                    {log._id && (
                      <button onClick={() => setDeletingLog(log._id!)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg flex-shrink-0 opacity-30 hover:opacity-100 hover:text-red-400 transition-all"
                        style={{ color: 'var(--text-muted)' }}>
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
      <div className="ds rounded-xl px-5 py-3 flex gap-6 flex-wrap"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-border)' }}>
        {[['Started', mentorship.startDate], ['Created', mentorship.createdAt], ['Updated', mentorship.updatedAt]].map(([l, v]) => (
          <div key={l}>
            <p className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{l}</p>
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{fmt(v)}</p>
          </div>
        ))}
      </div>

      <Modal isOpen={showLog} onClose={() => setShowLog(false)} title="Log Meeting" size="md">
        <LogMeetingModal mentorshipId={id!} onClose={() => setShowLog(false)}
          onSuccess={() => { qc.invalidateQueries({ queryKey: ['training-mentorship', id] }); setShowLog(false); }} />
      </Modal>

      <Modal isOpen={!!deletingLog} onClose={() => setDeletingLog(null)} title="Delete Log" size="sm">
        <p className="text-text-secondary mb-5">Delete this meeting log? This cannot be undone.</p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setDeletingLog(null)} className="btn-ghost">Cancel</button>
          <button onClick={() => deletingLog && deleteLog.mutate(deletingLog)}
            className="btn-danger" disabled={deleteLog.isPending}>
            {deleteLog.isPending ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
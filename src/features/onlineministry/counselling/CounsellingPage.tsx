/**
 * ChurchOS — src/features/onlineMinistry/counselling/CounsellingPage.tsx
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { CheckCircle, Trash2 } from 'lucide-react';
import { counsellingApi } from '../../../lib/onlineministry.api';
import Modal from '../../../components/ui/Modal';
import { PageLoader } from '../../../components/ui/Spinner';
import EmptyState from '../../../components/ui/EmptyState';
import type { CounsellingSession, CounsellingStatus } from '../../../types/onlineministry.types';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<CounsellingStatus, { bg: string; text: string }> = {
  requested: { bg: 'rgba(245,158,11,0.12)',  text: '#fbbf24' },
  scheduled: { bg: 'rgba(99,102,241,0.12)',  text: '#818cf8' },
  completed: { bg: 'rgba(16,185,129,0.12)',  text: '#34d399' },
  cancelled: { bg: 'rgba(107,114,128,0.12)', text: '#9ca3af' },
  no_show:   { bg: 'rgba(239,68,68,0.12)',   text: '#f87171' },
};

const STATUS_OPTIONS: CounsellingStatus[] = [
  'requested', 'scheduled', 'completed', 'cancelled', 'no_show',
];

// ─── Schedule Modal Form ──────────────────────────────────────────────────────

function ScheduleForm({
  session,
  onSuccess,
  onCancel,
}: {
  session: CounsellingSession;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [scheduledAt, setScheduledAt]   = useState(session.scheduledAt?.slice(0, 16) ?? '');
  const [meetingLink, setMeetingLink]   = useState(session.meetingLink ?? '');
  const [status, setStatus]             = useState<CounsellingStatus>(session.status);

  const mutation = useMutation({
    mutationFn: () =>
      counsellingApi.update(session._id, { status, scheduledAt: scheduledAt || undefined, meetingLink: meetingLink || undefined } as any),
    onSuccess: () => { toast.success('Session updated'); onSuccess(); },
    onError: () => toast.error('Failed to update session'),
  });

  return (
    <div className="space-y-4">
      <div>
        <label className="label">Status</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as CounsellingStatus)}
          className="input w-full"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label">Schedule Date & Time</label>
        <input
          type="datetime-local"
          className="input w-full"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
        />
      </div>

      <div>
        <label className="label">Meeting Link (Zoom / Google Meet)</label>
        <input
          className="input w-full"
          value={meetingLink}
          onChange={(e) => setMeetingLink(e.target.value)}
          placeholder="https://zoom.us/j/..."
        />
      </div>

      <div className="flex justify-end gap-3 pt-3 border-t border-bg-border">
        <button type="button" onClick={onCancel} className="btn-ghost">Cancel</button>
        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="btn-gold"
        >
          {mutation.isPending ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CounsellingPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [scheduling, setScheduling]     = useState<CounsellingSession | null>(null);
  const [deleting, setDeleting]         = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['counselling', statusFilter],
    queryFn: async () => {
      const res = await counsellingApi.getAll({
        status: statusFilter || undefined,
        limit: 50,
      });
      return {
        sessions: res.data.data as CounsellingSession[],
        total: res.data.pagination?.total,
      };
    },
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) =>
      counsellingApi.update(id, { status: 'completed' } as any),
    onSuccess: () => {
      toast.success('Session marked complete');
      qc.invalidateQueries({ queryKey: ['counselling'] });
    },
    onError: () => toast.error('Failed to update'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => counsellingApi.delete(id),
    onSuccess: () => {
      toast.success('Session archived');
      qc.invalidateQueries({ queryKey: ['counselling'] });
      setDeleting(null);
    },
    onError: () => toast.error('Failed to archive'),
  });

  const sessions = data?.sessions ?? [];

  return (
    <div className="space-y-5">
      <style>{`
        .table-row { transition: background-color 0.2s ease; }
        .table-row:hover { background-color: rgba(218, 165, 32, 0.03); }
        .fade-in { animation: fadeInRow 0.3s ease-out; }
        @keyframes fadeInRow {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Header */}
      <div>
        <h1 className="font-display font-bold text-3xl" style={{ color: 'var(--text-primary)' }}>
          Counselling Sessions
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {data?.total ?? 0} session{data?.total !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input w-auto"
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <PageLoader />
        ) : sessions.length === 0 ? (
          <EmptyState
            icon="🎧"
            title="No counselling requests"
            description="Online counselling requests submitted through your forms will appear here"
          />
        ) : (
          <table className="w-full">
            <thead className="bg-bg-hover/50 border-b border-bg-border">
              <tr>
                {['Client', 'Topic', 'Status', 'Scheduled', 'Meeting', 'Actions'].map((h) => (
                  <th key={h} className="table-header text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => {
                const sc = STATUS_COLORS[s.status];
                return (
                  <tr key={s._id} className="table-row fade-in">
                    {/* Client */}
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}
                        >
                          {s.clientName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                            {s.clientName}
                          </p>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {s.clientEmail || s.clientPhone || '—'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Topic */}
                    <td className="table-cell max-w-xs">
                      <p className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>
                        {s.topic}
                      </p>
                      {s.followUpRequired && (
                        <p className="text-xs mt-0.5" style={{ color: '#fbbf24' }}>
                          ⚠ Follow-up required
                        </p>
                      )}
                    </td>

                    {/* Status */}
                    <td className="table-cell">
                      <span
                        className="text-xs font-semibold px-2 py-1 rounded-full capitalize"
                        style={{ background: sc.bg, color: sc.text }}
                      >
                        {s.status.replace('_', ' ')}
                      </span>
                    </td>

                    {/* Scheduled */}
                    <td className="table-cell text-xs" style={{ color: 'var(--text-muted)' }}>
                      {s.scheduledAt
                        ? format(new Date(s.scheduledAt), 'dd MMM yyyy · h:mm a')
                        : '—'}
                    </td>

                    {/* Meeting Link */}
                    <td className="table-cell">
                      {s.meetingLink ? (
                        <a
                          href={s.meetingLink}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-medium hover:opacity-70 transition-opacity"
                          style={{ color: '#38bdf8' }}
                        >
                          Join ↗
                        </a>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="table-cell">
                      <div className="flex items-center gap-1">
                        {/* Schedule / Edit */}
                        <button
                          onClick={() => setScheduling(s)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-indigo-500/15 hover:text-indigo-400 text-text-muted transition-all"
                          title="Schedule / Edit"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                            <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                        </button>

                        {/* Complete */}
                        {s.status !== 'completed' && s.status !== 'cancelled' && (
                          <button
                            onClick={() => completeMutation.mutate(s._id)}
                            disabled={completeMutation.isPending}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-green-500/15 hover:text-green-400 text-text-muted transition-all"
                            title="Mark complete"
                          >
                            <CheckCircle size={13} />
                          </button>
                        )}

                        {/* Delete */}
                        <button
                          onClick={() => setDeleting(s._id)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-500/15 hover:text-red-400 text-text-muted transition-all"
                          title="Archive"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Schedule Modal */}
      {scheduling && (
        <Modal
          isOpen={!!scheduling}
          onClose={() => setScheduling(null)}
          title="Update Session"
          size="md"
        >
          <ScheduleForm
            session={scheduling}
            onSuccess={() => {
              setScheduling(null);
              qc.invalidateQueries({ queryKey: ['counselling'] });
            }}
            onCancel={() => setScheduling(null)}
          />
        </Modal>
      )}

      {/* Delete Confirm */}
      <Modal isOpen={!!deleting} onClose={() => setDeleting(null)} title="Archive Session" size="sm">
        <p className="text-text-secondary mb-5">
          Archive this counselling session? It will be removed from the active list.
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setDeleting(null)} className="btn-ghost">Cancel</button>
          <button
            onClick={() => deleting && deleteMutation.mutate(deleting)}
            className="btn-danger"
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Archiving...' : 'Archive'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
/**
 * ChurchOS — src/features/onlineMinistry/visitors/VisitorsPage.tsx
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { MessageSquare, UserCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { onlineVisitorsApi } from '../../../lib/onlineministry.api';
import Modal from '../../../components/ui/Modal';
import { PageLoader } from '../../../components/ui/Spinner';
import EmptyState from '../../../components/ui/EmptyState';
import type { OnlineVisitor, FollowUpStatus } from '../../../types/onlineministry.types';

// ─── Constants ────────────────────────────────────────────────────────────────

const FOLLOW_UP_COLORS: Record<FollowUpStatus, { bg: string; text: string }> = {
  pending:   { bg: 'rgba(245,158,11,0.12)', text: '#fbbf24' },
  contacted: { bg: 'rgba(99,102,241,0.12)', text: '#818cf8' },
  assigned:  { bg: 'rgba(14,165,233,0.12)', text: '#38bdf8' },
  converted: { bg: 'rgba(16,185,129,0.12)', text: '#34d399' },
  closed:    { bg: 'rgba(107,114,128,0.12)', text: '#9ca3af' },
};

const ACTION_TYPES = [
  'call_made',
  'email_sent',
  'sms_sent',
  'meeting_scheduled',
  'whatsapp_sent',
  'other',
];

// ─── Expanded Detail Row ──────────────────────────────────────────────────────

function VisitorDetail({ visitor }: { visitor: OnlineVisitor }) {
  return (
    <tr>
      <td colSpan={7} className="px-6 py-4" style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--bg-border)' }}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
          {visitor.location && (
            <div>
              <p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>Location</p>
              <p style={{ color: 'var(--text-primary)' }}>{visitor.location}</p>
            </div>
          )}
          {visitor.howHeard && (
            <div>
              <p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>How They Found Us</p>
              <p style={{ color: 'var(--text-primary)' }}>{visitor.howHeard}</p>
            </div>
          )}
          {visitor.prayerPoint && (
            <div className="col-span-2">
              <p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>Prayer Point</p>
              <p style={{ color: 'var(--text-primary)' }}>{visitor.prayerPoint}</p>
            </div>
          )}
          <div>
            <p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>Emails Sent</p>
            <p style={{ color: 'var(--text-primary)' }}>{visitor.emailsSent}</p>
          </div>
          {visitor.lastEmailSentAt && (
            <div>
              <p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>Last Email</p>
              <p style={{ color: 'var(--text-primary)' }}>{format(new Date(visitor.lastEmailSentAt), 'dd MMM yyyy')}</p>
            </div>
          )}
        </div>

        {/* Follow-up action history */}
        {visitor.followUpActions.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
              Follow-up History
            </p>
            <div className="space-y-1.5">
              {visitor.followUpActions.map((a) => (
                <div
                  key={a._id}
                  className="flex items-start gap-3 px-3 py-2 rounded-lg text-xs"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--bg-border)' }}
                >
                  <span
                    className="px-1.5 py-0.5 rounded font-semibold capitalize flex-shrink-0"
                    style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8' }}
                  >
                    {a.action.replace(/_/g, ' ')}
                  </span>
                  <span style={{ color: 'var(--text-secondary)' }}>{a.note || '—'}</span>
                  <span className="ml-auto flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                    {format(new Date(a.performedAt), 'dd MMM · h:mm a')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </td>
    </tr>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function VisitorsPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedId, setExpandedId]     = useState<string | null>(null);
  const [actionModal, setActionModal]   = useState<OnlineVisitor | null>(null);
  const [actionType, setActionType]     = useState('call_made');
  const [actionNote, setActionNote]     = useState('');
  const [convertModal, setConvertModal] = useState<OnlineVisitor | null>(null);
  const [memberId, setMemberId]         = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['online-visitors', statusFilter],
    queryFn: async () => {
      const res = await onlineVisitorsApi.getAll({
        followUpStatus: statusFilter || undefined,
        limit: 50,
      });
      return {
        visitors: res.data.data as OnlineVisitor[],
        total: res.data.pagination?.total,
      };
    },
  });

  const logActionMutation = useMutation({
    mutationFn: ({ id, action, note }: { id: string; action: string; note: string }) =>
      onlineVisitorsApi.logAction(id, { action, note }),
    onSuccess: () => {
      toast.success('Follow-up action logged');
      qc.invalidateQueries({ queryKey: ['online-visitors'] });
      setActionModal(null);
      setActionNote('');
      setActionType('call_made');
    },
    onError: () => toast.error('Failed to log action'),
  });

  const convertMutation = useMutation({
    mutationFn: ({ id, mId }: { id: string; mId: string }) =>
      onlineVisitorsApi.convert(id, mId),
    onSuccess: () => {
      toast.success('Visitor marked as converted');
      qc.invalidateQueries({ queryKey: ['online-visitors'] });
      setConvertModal(null);
      setMemberId('');
    },
    onError: () => toast.error('Failed to convert visitor'),
  });

  const visitors = data?.visitors ?? [];

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

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
          Online Visitors
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {data?.total ?? 0} visitor capture{data?.total !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input w-auto"
        >
          <option value="">All Statuses</option>
          {Object.keys(FOLLOW_UP_COLORS).map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <PageLoader />
        ) : visitors.length === 0 ? (
          <EmptyState
            icon="👥"
            title="No visitors captured"
            description="Submissions from your online visitor capture form will appear here"
          />
        ) : (
          <table className="w-full">
            <thead className="bg-bg-hover/50 border-b border-bg-border">
              <tr>
                {['Visitor', 'Contact', 'Platform', 'Actions Taken', 'Status', 'Captured', 'Actions'].map((h) => (
                  <th key={h} className="table-header text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visitors.map((v) => {
                const sc = FOLLOW_UP_COLORS[v.followUpStatus];
                const isExpanded = expandedId === v._id;

                return (
                  <>
                    <tr key={v._id} className="table-row fade-in">
                      {/* Visitor */}
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleExpand(v._id)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors hover:bg-white/5"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                          </button>
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                            style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}
                          >
                            {v.firstName[0]}{v.lastName[0]}
                          </div>
                          <div>
                            <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                              {v.firstName} {v.lastName}
                            </p>
                            {v.location && (
                              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{v.location}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="table-cell text-xs" style={{ color: 'var(--text-muted)' }}>
                        {v.email && <p>{v.email}</p>}
                        {v.phone && <p>{v.phone}</p>}
                        {!v.email && !v.phone && '—'}
                      </td>

                      {/* Platform */}
                      <td className="table-cell">
                        <span
                          className="text-xs capitalize px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8' }}
                        >
                          {v.platform}
                        </span>
                      </td>

                      {/* Actions taken count */}
                      <td className="table-cell">
                        <span className="font-mono text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {v.followUpActions.length}
                        </span>
                        {v.emailsSent > 0 && (
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {v.emailsSent} email{v.emailsSent !== 1 ? 's' : ''}
                          </p>
                        )}
                      </td>

                      {/* Status */}
                      <td className="table-cell">
                        <span
                          className="text-xs font-semibold px-2 py-1 rounded-full capitalize"
                          style={{ background: sc.bg, color: sc.text }}
                        >
                          {v.followUpStatus}
                        </span>
                      </td>

                      {/* Captured */}
                      <td className="table-cell text-xs" style={{ color: 'var(--text-muted)' }}>
                        {format(new Date(v.createdAt), 'dd MMM yyyy')}
                      </td>

                      {/* Actions */}
                      <td className="table-cell">
                        <div className="flex items-center gap-1">
                          {/* Log action */}
                          <button
                            onClick={() => setActionModal(v)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-indigo-500/15 hover:text-indigo-400 text-text-muted transition-all"
                            title="Log follow-up action"
                          >
                            <MessageSquare size={13} />
                          </button>

                          {/* Convert to member */}
                          {v.followUpStatus !== 'converted' && (
                            <button
                              onClick={() => setConvertModal(v)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-green-500/15 hover:text-green-400 text-text-muted transition-all"
                              title="Convert to member"
                            >
                              <UserCheck size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Expandable detail row */}
                    {isExpanded && <VisitorDetail visitor={v} />}
                  </>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Log Action Modal */}
      <Modal
        isOpen={!!actionModal}
        onClose={() => { setActionModal(null); setActionNote(''); }}
        title="Log Follow-up Action"
        size="sm"
      >
        {actionModal && (
          <div className="space-y-4">
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              For:{' '}
              <strong style={{ color: 'var(--text-primary)' }}>
                {actionModal.firstName} {actionModal.lastName}
              </strong>
            </p>

            <div>
              <label className="label">Action Type</label>
              <select
                value={actionType}
                onChange={(e) => setActionType(e.target.value)}
                className="input w-full"
              >
                {ACTION_TYPES.map((a) => (
                  <option key={a} value={a}>
                    {a.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Note</label>
              <textarea
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
                className="input w-full"
                rows={3}
                placeholder="Describe what happened during this follow-up..."
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-bg-border">
              <button onClick={() => { setActionModal(null); setActionNote(''); }} className="btn-ghost">
                Cancel
              </button>
              <button
                onClick={() =>
                  logActionMutation.mutate({
                    id: actionModal._id,
                    action: actionType,
                    note: actionNote,
                  })
                }
                disabled={logActionMutation.isPending}
                className="btn-gold"
              >
                {logActionMutation.isPending ? 'Logging...' : 'Log Action'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Convert to Member Modal */}
      <Modal
        isOpen={!!convertModal}
        onClose={() => { setConvertModal(null); setMemberId(''); }}
        title="Convert to Member"
        size="sm"
      >
        {convertModal && (
          <div className="space-y-4">
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Link{' '}
              <strong style={{ color: 'var(--text-primary)' }}>
                {convertModal.firstName} {convertModal.lastName}
              </strong>{' '}
              to an existing member record.
            </p>
            <div>
              <label className="label">Member ID</label>
              <input
                className="input w-full"
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                placeholder="Paste the member's _id from the Members module"
              />
            </div>
            <div className="flex justify-end gap-3 pt-3 border-t border-bg-border">
              <button onClick={() => { setConvertModal(null); setMemberId(''); }} className="btn-ghost">
                Cancel
              </button>
              <button
                onClick={() => convertMutation.mutate({ id: convertModal._id, mId: memberId })}
                disabled={convertMutation.isPending || !memberId.trim()}
                className="btn-gold"
              >
                {convertMutation.isPending ? 'Saving...' : 'Mark as Converted'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
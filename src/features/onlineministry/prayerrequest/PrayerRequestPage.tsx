/**
 * ChurchOS — src/features/onlineMinistry/prayerRequests/PrayerRequestsPage.tsx
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Heart, CheckCircle, Trash2, UserPlus } from 'lucide-react';
import { prayerRequestsApi } from '../../../lib/onlineministry.api';
import Modal from '../../../components/ui/Modal';
import { PageLoader } from '../../../components/ui/Spinner';
import EmptyState from '../../../components/ui/EmptyState';
import type { PrayerRequest, PrayerStatus } from '../../../types/onlineministry.types';

const STATUS_COLORS: Record<PrayerStatus, { bg: string; text: string }> = {
  pending:  { bg: 'rgba(245,158,11,0.12)', text: '#fbbf24' },
  prayed:   { bg: 'rgba(16,185,129,0.12)', text: '#34d399' },
  assigned: { bg: 'rgba(99,102,241,0.12)', text: '#818cf8' },
  closed:   { bg: 'rgba(107,114,128,0.12)', text: '#9ca3af' },
};

export default function PrayerRequestsPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatus] = useState('');
  const [viewItem, setViewItem]   = useState<PrayerRequest | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['prayer-requests', statusFilter],
    queryFn: async () => {
      const res = await prayerRequestsApi.getAll({ status: statusFilter || undefined, limit: 50 });
      return { requests: res.data.data as PrayerRequest[], total: res.data.pagination?.total };
    },
  });

  const markPrayedMutation = useMutation({
    mutationFn: (id: string) => prayerRequestsApi.update(id, { status: 'prayed' }),
    onSuccess: () => { toast.success('Marked as prayed'); qc.invalidateQueries({ queryKey: ['prayer-requests'] }); },
    onError: () => toast.error('Failed to update'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => prayerRequestsApi.delete(id),
    onSuccess: () => { toast.success('Prayer request removed'); qc.invalidateQueries({ queryKey: ['prayer-requests'] }); },
  });

  const requests = data?.requests ?? [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-3xl" style={{ color: 'var(--text-primary)' }}>Prayer Wall</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{data?.total ?? 0} requests</p>
        </div>
      </div>

      <select value={statusFilter} onChange={(e) => setStatus(e.target.value)} className="input w-auto">
        <option value="">All Statuses</option>
        {Object.keys(STATUS_COLORS).map(s => (
          <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
        ))}
      </select>

      <div className="card overflow-hidden">
        {isLoading ? <PageLoader /> : requests.length === 0 ? (
          <EmptyState icon="🙏" title="No prayer requests" description="Prayer requests submitted online will appear here" />
        ) : (
          <table className="w-full">
            <thead className="bg-bg-hover/50 border-b border-bg-border">
              <tr>
                {['Requester', 'Request', 'Status', 'Submitted', 'Actions'].map(h => (
                  <th key={h} className="table-header text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => {
                const sc = STATUS_COLORS[r.status];
                return (
                  <tr key={r._id} className="table-row" style={{ transition: 'background 0.2s' }}>
                    <td className="table-cell">
                      <div>
                        <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                          {r.isAnonymous ? 'Anonymous' : r.requesterName}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{r.requesterEmail || r.requesterPhone || ''}</p>
                      </div>
                    </td>
                    <td className="table-cell max-w-xs">
                      <p className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>{r.request}</p>
                    </td>
                    <td className="table-cell">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize" style={{ background: sc.bg, color: sc.text }}>
                        {r.status}
                      </span>
                    </td>
                    <td className="table-cell text-xs" style={{ color: 'var(--text-muted)' }}>
                      {format(new Date(r.createdAt), 'dd MMM yyyy')}
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setViewItem(r)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-pink-500/15 hover:text-pink-400 text-text-muted transition-all" title="View">
                          <Heart size={13} />
                        </button>
                        {r.status === 'pending' && (
                          <button onClick={() => markPrayedMutation.mutate(r._id)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-green-500/15 hover:text-green-400 text-text-muted transition-all" title="Mark prayed">
                            <CheckCircle size={13} />
                          </button>
                        )}
                        <button onClick={() => deleteMutation.mutate(r._id)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-500/15 hover:text-red-400 text-text-muted transition-all">
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

      {/* View Modal */}
      <Modal isOpen={!!viewItem} onClose={() => setViewItem(null)} title="Prayer Request" size="md">
        {viewItem && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl" style={{ background: 'rgba(236,72,153,0.06)', border: '1px solid rgba(236,72,153,0.2)' }}>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>{viewItem.request}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-xs" style={{ color: 'var(--text-muted)' }}>From</p>
                <p style={{ color: 'var(--text-primary)' }}>{viewItem.isAnonymous ? 'Anonymous' : viewItem.requesterName}</p></div>
              <div><p className="text-xs" style={{ color: 'var(--text-muted)' }}>Status</p>
                <p className="capitalize" style={{ color: 'var(--text-primary)' }}>{viewItem.status}</p></div>
            </div>
            {viewItem.adminNotes && (
              <div><p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Admin Notes</p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{viewItem.adminNotes}</p></div>
            )}
            <div className="flex justify-end gap-2 pt-3 border-t border-bg-border">
              <button onClick={() => setViewItem(null)} className="btn-ghost">Close</button>
              {viewItem.status === 'pending' && (
                <button onClick={() => { markPrayedMutation.mutate(viewItem._id); setViewItem(null); }} className="btn-gold">
                  Mark as Prayed
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
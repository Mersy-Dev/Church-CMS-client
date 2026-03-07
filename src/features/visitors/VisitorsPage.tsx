import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, ChevronDown, UserCheck } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import SearchInput from '../../components/ui/SearchInput';
import StatusBadge from '../../components/ui/StatusBadge';
import Modal from '../../components/ui/Modal';
import { PageLoader } from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import type { Visitor, FollowUpStatus } from '../../types';
import RegisterVisitorForm from './RegisterVisitorForm';

const SOURCE_LABELS: Record<string, string> = {
  invited_by_member: 'Invited by Member',
  online: 'Online',
  outreach: 'Outreach',
  walk_in: 'Walk-in',
  social_media: 'Online / Social Media',
  flyer: 'Flyer',
  other: 'Other',
};

const FOLLOWUP_OPTIONS: FollowUpStatus[] = [
  'pending','in_progress','contacted','visited','converted','unreachable','closed',
];

export default function VisitorsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [converting, setConverting] = useState<Visitor | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['visitors', search, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '50' });
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      const res = await api.get(`/visitors?${params}`);
      return { visitors: res.data.data as Visitor[], total: res.data.pagination?.total ?? res.data.data?.length };
    },
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/visitors/${id}`, { followUpStatus: status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['visitors'] }); toast.success('Status updated'); },
    onError: () => toast.error('Failed to update status'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/visitors/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['visitors'] }); toast.success('Visitor deleted'); setDeleting(null); },
    onError: () => toast.error('Failed to delete'),
  });

  const convertMutation = useMutation({
    mutationFn: (id: string) => api.post(`/visitors/${id}/convert`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['visitors'] });
      qc.invalidateQueries({ queryKey: ['members'] });
      toast.success(`${converting?.fullName} has been added as a member! 🎉`);
      setConverting(null);
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || 'Failed to convert visitor'),
  });

  const visitors = data?.visitors ?? [];

  return (
    <div className="space-y-5">
      <style>{`
        .convert-btn {
          transition: all 0.2s ease;
        }
        .convert-btn:hover {
          background: rgba(34, 197, 94, 0.15);
          color: #22c55e;
          transform: translateY(-1px);
        }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-3xl text-text-primary">Visitors</h1>
          <p className="text-text-muted text-sm mt-0.5">
            {data?.total ?? 0} visitor{(data?.total ?? 0) !== 1 ? 's' : ''} recorded
          </p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-gold flex items-center gap-2">
          <Plus size={15} /> Register Visitor
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Search visitors..." />
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input pr-8 appearance-none"
          >
            <option value="">All Follow-up Status</option>
            {FOLLOWUP_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
              </option>
            ))}
          </select>
          <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <PageLoader />
        ) : visitors.length === 0 ? (
          <EmptyState
            icon="🤝"
            title="No visitors recorded"
            description="Register your first visitor"
            action={<button onClick={() => setShowAdd(true)} className="btn-gold">Register Visitor</button>}
          />
        ) : (
          <table className="w-full">
            <thead className="bg-bg-hover/50 border-b border-bg-border">
              <tr>
                {['Name', 'Phone', 'Visit Date', 'Source', 'Follow-Up', 'Actions'].map((h) => (
                  <th key={h} className="table-header text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visitors.map((v) => (
                <tr key={v._id} className="table-row">
                  {/* Name */}
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <div>
                        <p className="font-medium text-text-primary">{v.fullName}</p>
                        {v.email && <p className="text-text-muted text-xs">{v.email}</p>}
                      </div>
                      {v.convertedToMember && (
                        <span
                          className="text-xs px-1.5 py-0.5 rounded font-medium"
                          style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }}
                        >
                          Member
                        </span>
                      )}
                    </div>
                  </td>
                  {/* Phone */}
                  <td className="table-cell text-text-secondary">{v.phone || '—'}</td>
                  {/* Visit Date */}
                  <td className="table-cell text-text-muted text-xs">
                    {format(new Date(v.visitDate), 'yyyy-MM-dd')}
                  </td>
                  {/* Source */}
                  <td className="table-cell">
                    <span className="bg-bg-hover text-text-secondary text-xs px-2.5 py-1 rounded-lg">
                      {SOURCE_LABELS[v.source] || v.source}
                    </span>
                  </td>
                  {/* Follow-up status */}
                  <td className="table-cell">
                    <StatusBadge status={v.followUpStatus} size="sm" />
                  </td>
                  {/* Actions */}
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      {/* Inline status dropdown */}
                      <div className="relative">
                        <select
                          value={v.followUpStatus}
                          onChange={(e) => updateStatus.mutate({ id: v._id, status: e.target.value })}
                          className="text-xs bg-bg-hover border border-bg-border text-text-secondary rounded-lg px-2 py-1.5 appearance-none pr-6 focus:outline-none focus:border-gold cursor-pointer"
                        >
                          {FOLLOWUP_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                      </div>

                      {/* Convert to Member — only for 'converted' status, not already a member */}
                      {v.followUpStatus === 'converted' && !v.convertedToMember && (
                        <button
                          onClick={() => setConverting(v)}
                          className="convert-btn w-7 h-7 flex items-center justify-center rounded-lg text-text-muted"
                          title="Convert to Member"
                        >
                          <UserCheck size={14} />
                        </button>
                      )}

                      <button
                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-bg-hover text-text-muted hover:text-gold transition-colors"
                        title="Edit"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => setDeleting(v._id)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-900/30 text-text-muted hover:text-red-400 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Register Modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Register Visitor" size="md">
        <RegisterVisitorForm
          onSuccess={() => { setShowAdd(false); qc.invalidateQueries({ queryKey: ['visitors'] }); }}
          onCancel={() => setShowAdd(false)}
        />
      </Modal>

      {/* ── Convert to Member Confirmation Modal ── */}
      <Modal
        isOpen={!!converting}
        onClose={() => setConverting(null)}
        title="Convert to Member"
        size="sm"
      >
        <div className="space-y-4">
          <div
            className="rounded-xl p-4 flex items-start gap-3"
            style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)' }}
          >
            <UserCheck size={18} className="mt-0.5 flex-shrink-0" style={{ color: '#22c55e' }} />
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {converting?.fullName}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {converting?.phone || converting?.email || 'No contact info'}
              </p>
            </div>
          </div>

          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            This visitor will be registered as a full church member. A new member profile will be created using their visitor information.
          </p>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setConverting(null)}
              className="btn-ghost"
              disabled={convertMutation.isPending}
            >
              Cancel
            </button>
            <button
              onClick={() => converting && convertMutation.mutate(converting._id)}
              disabled={convertMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-60"
              style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }}
            >
              {convertMutation.isPending ? (
                <>
                  <span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Converting...
                </>
              ) : (
                <>
                  <UserCheck size={14} /> Convert to Member
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal isOpen={!!deleting} onClose={() => setDeleting(null)} title="Delete Visitor" size="sm">
        <p className="text-text-secondary mb-5">Are you sure you want to delete this visitor record?</p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setDeleting(null)} className="btn-ghost">Cancel</button>
          <button
            onClick={() => deleting && deleteMutation.mutate(deleting)}
            className="btn-danger"
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
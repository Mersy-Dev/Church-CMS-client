import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, ChevronDown, UserCheck } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import SearchInput from '../../components/ui/SearchInput';
import Modal from '../../components/ui/Modal';
import { PageLoader } from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import type { Visitor, FollowUpStatus } from '../../types';
import RegisterVisitorForm from './RegisterVisitorForm';

/* ── Constants ───────────────────────────────────────────────────────────── */

const SOURCE_LABELS: Record<string, string> = {
  invited_by_member: 'Invited by Member',
  online:            'Online',
  outreach:          'Outreach',
  walk_in:           'Walk-in',
  social_media:      'Social Media',
  flyer:             'Flyer',
  other:             'Other',
};

const FOLLOWUP_OPTIONS: FollowUpStatus[] = [
  'pending', 'in_progress', 'contacted', 'visited', 'converted', 'unreachable', 'closed',
];

function fmtStatus(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ── Sub-components ──────────────────────────────────────────────────────── */

/** Single neutral status pill — same style for every status */
function StatusPill({ status }: { status: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 10px', borderRadius: 999,
      fontSize: 11, fontWeight: 500,
      background: 'var(--bg-hover)',
      color: 'var(--text-secondary)',
      border: '1px solid var(--bg-border)',
      whiteSpace: 'nowrap',
    }}>
      {fmtStatus(status)}
    </span>
  );
}

function ActionBtn({
  children, onClick, title, danger = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  title: string;
  danger?: boolean;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: 28, height: 28, borderRadius: 8, border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 0.15s, color 0.15s',
        background: hov ? (danger ? 'rgba(220,38,38,0.1)' : 'var(--bg-hover)') : 'transparent',
        color: hov ? (danger ? '#ef4444' : 'var(--text-primary)') : 'var(--text-muted)',
      }}
    >
      {children}
    </button>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */

export default function VisitorsPage() {
  const qc = useQueryClient();
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAdd, setShowAdd]       = useState(false);
  const [deleting, setDeleting]     = useState<string | null>(null);
  const [converting, setConverting] = useState<Visitor | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['visitors', search, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '50' });
      if (search)       params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      const res = await api.get(`/visitors?${params}`);
      return {
        visitors: res.data.data as Visitor[],
        total:    res.data.pagination?.total ?? res.data.data?.length,
      };
    },
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/visitors/${id}`, { followUpStatus: status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['visitors'] }); toast.success('Status updated'); },
    onError:   () => toast.error('Failed to update status'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/visitors/${id}`),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['visitors'] }); toast.success('Visitor deleted'); setDeleting(null); },
    onError:    () => toast.error('Failed to delete'),
  });

  const convertMutation = useMutation({
    mutationFn: (id: string) => api.post(`/visitors/${id}/convert`),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['visitors'] });
      qc.invalidateQueries({ queryKey: ['members'] });
      toast.success(`${converting?.fullName} has been added as a member!`);
      setConverting(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to convert visitor'),
  });

  const visitors = data?.visitors ?? [];

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-3xl text-text-primary">Visitors</h1>
          <p className="text-text-muted text-sm mt-0.5">
            {data?.total ?? 0} visitor{(data?.total ?? 0) !== 1 ? 's' : ''} recorded
          </p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-gold">
          <Plus size={15} /> Register Visitor
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <SearchInput value={search} onChange={setSearch} placeholder="Search visitors..." />
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input pr-8 appearance-none w-auto"
          >
            <option value="">All Follow-up Status</option>
            {FOLLOWUP_OPTIONS.map((s) => (
              <option key={s} value={s}>{fmtStatus(s)}</option>
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
            action={
              <button onClick={() => setShowAdd(true)} className="btn-gold">
                Register Visitor
              </button>
            }
          />
        ) : (
          <table className="w-full">
            <thead className="border-b border-bg-border">
              <tr className="bg-bg-hover">
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
                        <p className="font-medium" style={{ color: 'var(--text-primary)', fontSize: 13 }}>
                          {v.fullName}
                        </p>
                        {v.email && (
                          <p style={{ color: 'var(--text-muted)', fontSize: 11 }}>{v.email}</p>
                        )}
                      </div>
                      {/* "Member" tag — neutral, not green */}
                      {v.convertedToMember && (
                        <span style={{
                          fontSize: 10, fontWeight: 600, padding: '1px 7px',
                          borderRadius: 999, letterSpacing: '0.04em',
                          background: 'var(--bg-hover)',
                          color: 'var(--text-muted)',
                          border: '1px solid var(--bg-border)',
                        }}>
                          Member
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Phone */}
                  <td className="table-cell">
                    <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{v.phone || '—'}</span>
                  </td>

                  {/* Visit Date */}
                  <td className="table-cell">
                    <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                      {format(new Date(v.visitDate), 'yyyy-MM-dd')}
                    </span>
                  </td>

                  {/* Source */}
                  <td className="table-cell">
                    <span style={{
                      display: 'inline-flex', alignItems: 'center',
                      padding: '2px 8px', borderRadius: 6,
                      fontSize: 11, fontWeight: 500,
                      background: 'var(--bg-hover)',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--bg-border)',
                    }}>
                      {SOURCE_LABELS[v.source] || v.source}
                    </span>
                  </td>

                  {/* Follow-Up status pill */}
                  <td className="table-cell">
                    <StatusPill status={v.followUpStatus} />
                  </td>

                  {/* Actions */}
                  <td className="table-cell">
                    <div className="flex items-center gap-1">

                      {/* Inline status dropdown */}
                      <div className="relative">
                        <select
                          value={v.followUpStatus}
                          onChange={(e) => updateStatus.mutate({ id: v._id, status: e.target.value })}
                          style={{
                            fontSize: 11, padding: '4px 22px 4px 8px',
                            borderRadius: 6, appearance: 'none', cursor: 'pointer',
                            background: 'var(--bg-hover)',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--bg-border)',
                            outline: 'none',
                          }}
                        >
                          {FOLLOWUP_OPTIONS.map((s) => (
                            <option key={s} value={s}>{fmtStatus(s)}</option>
                          ))}
                        </select>
                        <ChevronDown
                          size={10}
                          style={{
                            position: 'absolute', right: 6, top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'var(--text-muted)', pointerEvents: 'none',
                          }}
                        />
                      </div>

                      {/* Convert to Member — only shown when status is 'converted' */}
                      {v.followUpStatus === 'converted' && !v.convertedToMember && (
                        <ActionBtn onClick={() => setConverting(v)} title="Convert to Member">
                          <UserCheck size={13} strokeWidth={1.8} />
                        </ActionBtn>
                      )}

                      <ActionBtn title="Edit">
                        <Pencil size={13} strokeWidth={1.8} />
                      </ActionBtn>

                      <ActionBtn onClick={() => setDeleting(v._id)} title="Delete" danger>
                        <Trash2 size={13} strokeWidth={1.8} />
                      </ActionBtn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Register Visitor Modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Register Visitor" size="md">
        <RegisterVisitorForm
          onSuccess={() => { setShowAdd(false); qc.invalidateQueries({ queryKey: ['visitors'] }); }}
          onCancel={() => setShowAdd(false)}
        />
      </Modal>

      {/* Convert to Member Modal */}
      <Modal isOpen={!!converting} onClose={() => setConverting(null)} title="Convert to Member" size="sm">
        <div className="space-y-4">
          {/* Visitor summary */}
          <div style={{
            padding: '12px 14px', borderRadius: 10,
            background: 'var(--bg-hover)',
            border: '1px solid var(--bg-border)',
            display: 'flex', alignItems: 'flex-start', gap: 12,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'var(--bg-card)', border: '1px solid var(--bg-border)',
              fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)',
            }}>
              {converting?.fullName?.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()}
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 2px' }}>
                {converting?.fullName}
              </p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
                {converting?.phone || converting?.email || 'No contact info'}
              </p>
            </div>
          </div>

          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            This visitor will be registered as a full church member. A new member profile will be created using their visitor information.
          </p>

          <div className="flex justify-end gap-3 pt-1">
            <button onClick={() => setConverting(null)} className="btn-ghost" disabled={convertMutation.isPending}>
              Cancel
            </button>
            <button
              onClick={() => converting && convertMutation.mutate(converting._id)}
              disabled={convertMutation.isPending}
              className="btn-gold"
            >
              {convertMutation.isPending ? (
                <>
                  <span style={{
                    display: 'inline-block', width: 13, height: 13,
                    border: '2px solid currentColor', borderTopColor: 'transparent',
                    borderRadius: '50%', animation: 'spin 0.7s linear infinite',
                  }} />
                  Converting...
                </>
              ) : (
                <><UserCheck size={14} /> Convert to Member</>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal isOpen={!!deleting} onClose={() => setDeleting(null)} title="Delete Visitor" size="sm">
        <p className="text-text-secondary mb-5">
          Are you sure you want to delete this visitor record?
        </p>
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
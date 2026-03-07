/**
 * ChurchOS — src/features/onlineMinistry/streams/StreamsPage.tsx
 * Livestream management — list, schedule, update status, record metrics
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Pencil, Trash2, Radio, Youtube, Facebook, Video, Upload } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { streamsApi } from '../../../lib/onlineministry.api';
import Modal from '../../../components/ui/Modal';
import { PageLoader } from '../../../components/ui/Spinner';
import EmptyState from '../../../components/ui/EmptyState';
import type { LiveStream, LiveStreamFormData, StreamStatus } from '../../../types/onlineministry.types';
import StreamForm from './StreamFormPage';

const STATUS_COLORS: Record<StreamStatus, { bg: string; text: string; label: string }> = {
  scheduled: { bg: 'rgba(99,102,241,0.12)', text: '#818cf8', label: 'Scheduled' },
  live:       { bg: 'rgba(239,68,68,0.12)',  text: '#f87171', label: 'Live' },
  ended:      { bg: 'rgba(107,114,128,0.12)', text: '#9ca3af', label: 'Ended' },
  cancelled:  { bg: 'rgba(245,158,11,0.12)', text: '#fbbf24', label: 'Cancelled' },
};

function PlatformIcons({ stream }: { stream: LiveStream }) {
  return (
    <div className="flex items-center gap-1.5">
      {stream.youtubeUrl  && <Youtube  size={13} className="text-red-400"   />}
      {stream.facebookUrl && <Facebook size={13} className="text-blue-400"  />}
      {stream.zoomUrl     && <Video    size={13} className="text-sky-400"   />}
    </div>
  );
}

export default function StreamsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showAdd, setShowAdd]     = useState(false);
  const [editing, setEditing]     = useState<LiveStream | null>(null);
  const [deleting, setDeleting]   = useState<string | null>(null);
  const [statusFilter, setStatus] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['streams', statusFilter],
    queryFn: async () => {
      const params: Record<string, any> = { limit: 50 };
      if (statusFilter) params.status = statusFilter;
      const res = await streamsApi.getAll(params);
      return { streams: res.data.data as LiveStream[], total: res.data.pagination?.total };
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => streamsApi.delete(id),
    onSuccess: () => { toast.success('Stream archived'); qc.invalidateQueries({ queryKey: ['streams'] }); setDeleting(null); },
    onError: () => toast.error('Failed to archive stream'),
  });

  const streams = data?.streams ?? [];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-3xl" style={{ color: 'var(--text-primary)' }}>Livestreams</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{data?.total ?? 0} total streams</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-gold flex items-center gap-2">
          <Plus size={16} /> Schedule Stream
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <select value={statusFilter} onChange={(e) => setStatus(e.target.value)} className="input w-auto">
          <option value="">All Status</option>
          {Object.entries(STATUS_COLORS).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? <PageLoader /> : streams.length === 0 ? (
          <EmptyState icon="📡" title="No streams yet" description="Schedule your first livestream"
            action={<button onClick={() => setShowAdd(true)} className="btn-gold">Schedule Stream</button>}
          />
        ) : (
          <table className="w-full">
            <thead className="bg-bg-hover/50 border-b border-bg-border">
              <tr>
                {['Title', 'Date', 'Platforms', 'Viewers', 'Status', 'Actions'].map(h => (
                  <th key={h} className="table-header text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {streams.map((s) => {
                const sc = STATUS_COLORS[s.status];
                return (
                  <tr key={s._id} className="table-row" style={{ transition: 'background 0.2s' }}>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(99,102,241,0.12)' }}>
                          <Radio size={14} className="text-indigo-400" />
                        </div>
                        <div>
                          <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{s.title}</p>
                          {s.givingLink && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>💳 Giving link attached</p>}
                        </div>
                      </div>
                    </td>
                    <td className="table-cell text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {format(new Date(s.serviceDate), 'dd MMM yyyy')}
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{format(new Date(s.serviceDate), 'h:mm a')}</p>
                    </td>
                    <td className="table-cell"><PlatformIcons stream={s} /></td>
                    <td className="table-cell">
                      <span className="font-mono text-sm" style={{ color: 'var(--text-primary)' }}>
                        {s.totalOnlineViewers.toLocaleString()}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ background: sc.bg, color: sc.text }}>
                        {sc.label}
                        {s.status === 'live' && <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <button onClick={() => navigate(`/online-ministry/streams/${s._id}`)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-blue-500/15 hover:text-blue-400 text-text-muted transition-all">
                          <Eye size={14} />
                        </button>
                        <button onClick={() => setEditing(s)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gold/15 hover:text-gold text-text-muted transition-all">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => setDeleting(s._id)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-500/15 hover:text-red-400 text-text-muted transition-all">
                          <Trash2 size={14} />
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

      {/* Add Modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Schedule Stream" size="lg">
        <StreamForm
          onSuccess={() => { setShowAdd(false); qc.invalidateQueries({ queryKey: ['streams'] }); }}
          onCancel={() => setShowAdd(false)}
        />
      </Modal>

      {/* Edit Modal */}
      {editing && (
        <Modal isOpen={!!editing} onClose={() => setEditing(null)} title="Edit Stream" size="lg">
          <StreamForm
            stream={editing}
            onSuccess={() => { setEditing(null); qc.invalidateQueries({ queryKey: ['streams'] }); }}
            onCancel={() => setEditing(null)}
          />
        </Modal>
      )}

      {/* Delete Confirm */}
      <Modal isOpen={!!deleting} onClose={() => setDeleting(null)} title="Archive Stream" size="sm">
        <p className="text-text-secondary mb-5">Archive this stream? It will be removed from active view.</p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setDeleting(null)} className="btn-ghost">Cancel</button>
          <button onClick={() => deleting && deleteMutation.mutate(deleting)} className="btn-danger" disabled={deleteMutation.isPending}>
            {deleteMutation.isPending ? 'Archiving...' : 'Archive'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
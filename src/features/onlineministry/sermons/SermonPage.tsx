/**
 * ChurchOS — src/features/onlineMinistry/sermons/SermonsPage.tsx
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, BookOpen, Pencil, Trash2, Eye, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { sermonsApi } from '../../../lib/onlineministry.api';
import Modal from '../../../components/ui/Modal';
import { PageLoader } from '../../../components/ui/Spinner';
import EmptyState from '../../../components/ui/EmptyState';
import SermonForm from './SermonFormPage';
import type { Sermon } from '../../../types/onlineministry.types';

export default function SermonsPage() {
  const qc = useQueryClient();
  const [search, setSearch]     = useState('');
  const [showAdd, setShowAdd]   = useState(false);
  const [editing, setEditing]   = useState<Sermon | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['sermons', search],
    queryFn: async () => {
      const res = await sermonsApi.getAll({ search: search || undefined, limit: 50 });
      return { sermons: res.data.data as Sermon[], total: res.data.pagination?.total };
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => sermonsApi.delete(id),
    onSuccess: () => { toast.success('Sermon archived'); qc.invalidateQueries({ queryKey: ['sermons'] }); setDeleting(null); },
    onError: () => toast.error('Failed to archive sermon'),
  });

  const sermons = data?.sermons ?? [];

  const primaryLink = (sermon: Sermon) => {
    const video = sermon.media.find(m => m.type === 'video');
    return video?.url;
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-3xl" style={{ color: 'var(--text-primary)' }}>Sermon Library</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{data?.total ?? 0} sermons</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-gold flex items-center gap-2">
          <Plus size={16} /> Add Sermon
        </button>
      </div>

      <div className="flex items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input w-72"
          placeholder="Search by title, speaker, series..."
        />
      </div>

      <div className="card overflow-hidden">
        {isLoading ? <PageLoader /> : sermons.length === 0 ? (
          <EmptyState icon="📖" title="No sermons yet" description="Add your first sermon to the library"
            action={<button onClick={() => setShowAdd(true)} className="btn-gold">Add Sermon</button>}
          />
        ) : (
          <table className="w-full">
            <thead className="bg-bg-hover/50 border-b border-bg-border">
              <tr>
                {['Title', 'Speaker', 'Series', 'Date', 'Scripture', 'Published', 'Actions'].map(h => (
                  <th key={h} className="table-header text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sermons.map((s) => (
                <tr key={s._id} className="table-row" style={{ transition: 'background 0.2s' }}>
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ background: 'rgba(218,165,32,0.12)' }}>
                        <BookOpen size={14} style={{ color: '#DAA520' }} />
                      </div>
                      <div>
                        <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{s.title}</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.media.length} media link{s.media.length !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell text-sm" style={{ color: 'var(--text-secondary)' }}>{s.speaker}</td>
                  <td className="table-cell text-sm" style={{ color: 'var(--text-muted)' }}>{s.series || '—'}</td>
                  <td className="table-cell text-xs" style={{ color: 'var(--text-muted)' }}>
                    {format(new Date(s.preachedDate), 'dd MMM yyyy')}
                  </td>
                  <td className="table-cell">
                    <div className="flex flex-wrap gap-1">
                      {s.scriptureTags.slice(0, 2).map((tag, i) => (
                        <span key={i} className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(218,165,32,0.1)', color: '#DAA520' }}>
                          {tag}
                        </span>
                      ))}
                      {s.scriptureTags.length > 2 && (
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>+{s.scriptureTags.length - 2}</span>
                      )}
                    </div>
                  </td>
                  <td className="table-cell">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${s.isPublished ? 'bg-green-500/12 text-green-400' : 'bg-gray-500/12 text-gray-400'}`}>
                      {s.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center gap-1">
                      {primaryLink(s) && (
                        <a href={primaryLink(s)} target="_blank" rel="noreferrer"
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-sky-500/15 hover:text-sky-400 text-text-muted transition-all">
                          <ExternalLink size={13} />
                        </a>
                      )}
                      <button onClick={() => setEditing(s)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gold/15 hover:text-gold text-text-muted transition-all">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => setDeleting(s._id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-500/15 hover:text-red-400 text-text-muted transition-all">
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

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add Sermon" size="lg">
        <SermonForm onSuccess={() => { setShowAdd(false); qc.invalidateQueries({ queryKey: ['sermons'] }); }} onCancel={() => setShowAdd(false)} />
      </Modal>

      {editing && (
        <Modal isOpen={!!editing} onClose={() => setEditing(null)} title="Edit Sermon" size="lg">
          <SermonForm sermon={editing} onSuccess={() => { setEditing(null); qc.invalidateQueries({ queryKey: ['sermons'] }); }} onCancel={() => setEditing(null)} />
        </Modal>
      )}

      <Modal isOpen={!!deleting} onClose={() => setDeleting(null)} title="Archive Sermon" size="sm">
        <p className="text-text-secondary mb-5">Archive this sermon from the library?</p>
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
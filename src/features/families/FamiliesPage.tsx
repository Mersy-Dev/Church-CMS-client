import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, Eye, Trash2, Crown, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import Modal from '../../components/ui/Modal';
import { PageLoader } from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import Avatar from '../../components/ui/Avatar';
import CreateFamilyForm from './CreateFamilyForm';

interface Family {
  _id: string;
  familyName: string;
  headId?: { _id: string; firstName: string; lastName: string; photoUrl?: string; membershipId: string };
  assistantHeadId?: { _id: string; firstName: string; lastName: string; photoUrl?: string };
  spouseId?: { _id: string; firstName: string; lastName: string; photoUrl?: string };
  memberCount: number;
  activityCount: number;
  announcementCount: number;
  address?: string;
  city?: string;
  createdAt: string;
}

const FAMILY_COLORS = [
  '#DAA520', '#e05c5c', '#5c9ee0', '#5ce08a', '#c05ce0',
  '#e08a5c', '#5ce0d8', '#e0c05c', '#8a5ce0', '#5ce06e',
];

export default function FamiliesPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['families'],
    queryFn: async () => {
      const res = await api.get('/families?limit=50');
      return {
        families: res.data.data as Family[],
        total: res.data.pagination?.total ?? res.data.data?.length,
      };
    },
  });

  const { data: statsData } = useQuery({
    queryKey: ['family-stats'],
    queryFn: async () => {
      const res = await api.get('/families/stats');
      return res.data.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/families/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['families'] });
      qc.invalidateQueries({ queryKey: ['family-stats'] });
      toast.success('Family deleted');
      setDeleting(null);
    },
    onError: () => toast.error('Failed to delete family'),
  });

  const families = data?.families ?? [];

  return (
    <div className="space-y-6">
      <style>{`
        @keyframes cardReveal {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .family-card {
          animation: cardReveal 0.3s ease both;
          transition: all 0.25s cubic-bezier(0.23, 1, 0.32, 1);
        }
        .family-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 32px rgba(0,0,0,0.3);
        }
        .family-card:nth-child(1) { animation-delay: 0.04s; }
        .family-card:nth-child(2) { animation-delay: 0.08s; }
        .family-card:nth-child(3) { animation-delay: 0.12s; }
        .family-card:nth-child(4) { animation-delay: 0.16s; }
        .family-card:nth-child(5) { animation-delay: 0.20s; }
        .family-card:nth-child(6) { animation-delay: 0.24s; }
        .family-card:nth-child(7) { animation-delay: 0.28s; }
        .family-card:nth-child(8) { animation-delay: 0.32s; }
        .family-card:nth-child(9) { animation-delay: 0.36s; }
        .stat-pill {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 2px 8px; border-radius: 999px;
          font-size: 11px; font-weight: 600;
        }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-3xl text-text-primary">Families</h1>
          <p className="text-text-muted text-sm mt-0.5">
            {data?.total ?? 0} church {(data?.total ?? 0) !== 1 ? 'families' : 'family'}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="btn-gold flex items-center gap-2"
        >
          <Plus size={15} /> Create Family
        </button>
      </div>

      {/* Stats Bar */}
      {statsData && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Families', value: statsData.totalFamilies, color: '#DAA520' },
            { label: 'Members in Families', value: statsData.totalMembersInFamilies, color: '#5c9ee0' },
            { label: 'Avg Members / Family', value: statsData.avgMembersPerFamily, color: '#5ce08a' },
            { label: 'Total Activities', value: statsData.totalActivities, color: '#c05ce0' },
          ].map((s, i) => (
            <div
              key={i}
              className="rounded-xl p-4"
              style={{
                background: 'var(--bg-card, rgba(255,255,255,0.04))',
                border: '1px solid var(--bg-border, rgba(255,255,255,0.08))',
              }}
            >
              <p className="text-xs text-text-muted mb-1">{s.label}</p>
              <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value ?? 0}</p>
            </div>
          ))}
        </div>
      )}

      {/* Families Grid */}
      {isLoading ? (
        <PageLoader />
      ) : families.length === 0 ? (
        <EmptyState
          icon="🏠"
          title="No families yet"
          description="Create your first church family"
          action={
            <button onClick={() => setShowCreate(true)} className="btn-gold">
              Create Family
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {families.map((family, index) => {
            const color = FAMILY_COLORS[index % FAMILY_COLORS.length];
            return (
              <div
                key={family._id}
                className="family-card rounded-2xl overflow-hidden cursor-pointer"
                style={{
                  background: 'var(--bg-card, rgba(255,255,255,0.04))',
                  border: `1px solid var(--bg-border, rgba(255,255,255,0.08))`,
                }}
                onClick={() => navigate(`/families/${family._id}`)}
              >
                {/* Color bar */}
                <div className="h-1.5 w-full" style={{ background: color }} />

                <div className="p-5 space-y-4">
                  {/* Family Name */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3
                        className="font-display font-bold text-lg leading-tight"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {family.familyName}
                      </h3>
                      {family.city && (
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          {family.city}
                        </p>
                      )}
                    </div>
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-base font-bold flex-shrink-0"
                      style={{ background: `${color}18`, color }}
                    >
                      {family.familyName.charAt(0)}
                    </div>
                  </div>

                  {/* Leadership */}
                  <div className="space-y-2">
                    {family.headId && (
                      <div className="flex items-center gap-2">
                        <Crown size={11} style={{ color: '#DAA520' }} />
                        <Avatar
                          name={`${family.headId.firstName} ${family.headId.lastName}`}
                          photoUrl={family.headId.photoUrl}
                          size="xs"
                        />
                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          {family.headId.firstName} {family.headId.lastName}
                        </span>
                        <span
                          className="text-xs ml-auto"
                          style={{ color: '#DAA520' }}
                        >
                          Head
                        </span>
                      </div>
                    )}
                    {family.assistantHeadId && (
                      <div className="flex items-center gap-2">
                        <Shield size={11} style={{ color: '#5c9ee0' }} />
                        <Avatar
                          name={`${family.assistantHeadId.firstName} ${family.assistantHeadId.lastName}`}
                          photoUrl={family.assistantHeadId.photoUrl}
                          size="xs"
                        />
                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          {family.assistantHeadId.firstName} {family.assistantHeadId.lastName}
                        </span>
                        <span className="text-xs ml-auto" style={{ color: '#5c9ee0' }}>
                          Asst.
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Stats pills */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <span
                      className="stat-pill"
                      style={{ background: `${color}14`, color }}
                    >
                      <Users size={10} /> {family.memberCount} members
                    </span>
                    {family.activityCount > 0 && (
                      <span
                        className="stat-pill"
                        style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}
                      >
                        {family.activityCount} activities
                      </span>
                    )}
                    {family.announcementCount > 0 && (
                      <span
                        className="stat-pill"
                        style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e' }}
                      >
                        {family.announcementCount} active
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div
                    className="flex items-center justify-between pt-2"
                    style={{ borderTop: '1px solid var(--bg-border, rgba(255,255,255,0.06))' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => navigate(`/families/${family._id}`)}
                      className="flex items-center gap-1.5 text-xs font-medium transition-colors hover:opacity-80"
                      style={{ color }}
                    >
                      <Eye size={13} /> View Details
                    </button>
                    <button
                      onClick={() => setDeleting(family._id)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-text-muted hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="Create Family"
        size="md"
      >
        <CreateFamilyForm
          onSuccess={() => {
            setShowCreate(false);
            qc.invalidateQueries({ queryKey: ['families'] });
            qc.invalidateQueries({ queryKey: ['family-stats'] });
          }}
          onCancel={() => setShowCreate(false)}
        />
      </Modal>

      {/* Delete Confirm */}
      <Modal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete Family"
        size="sm"
      >
        <p className="text-text-secondary mb-5">
          Are you sure? All family data including activities, prayer requests and announcements will be removed.
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
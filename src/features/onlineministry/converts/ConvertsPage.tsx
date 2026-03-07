/**
 * ChurchOS — src/features/onlineMinistry/converts/ConvertsPage.tsx
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, UserCheck, UserPlus } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { convertsApi } from '../../../lib/onlineministry.api';
import Modal from '../../../components/ui/Modal';
import { PageLoader } from '../../../components/ui/Spinner';
import EmptyState from '../../../components/ui/EmptyState';
import type { OnlineConvert, OnlineConvertFormData, FollowUpStatus } from '../../../types/onlineministry.types';

const FOLLOW_UP_COLORS: Record<FollowUpStatus, { bg: string; text: string }> = {
  pending:   { bg: 'rgba(245,158,11,0.12)', text: '#fbbf24' },
  contacted: { bg: 'rgba(99,102,241,0.12)', text: '#818cf8' },
  assigned:  { bg: 'rgba(14,165,233,0.12)', text: '#38bdf8' },
  converted: { bg: 'rgba(16,185,129,0.12)', text: '#34d399' },
  closed:    { bg: 'rgba(107,114,128,0.12)', text: '#9ca3af' },
};

function AddConvertForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const { register, handleSubmit, formState: { errors } } = useForm<OnlineConvertFormData>({
    defaultValues: { platform: 'youtube' },
  });

  const mutation = useMutation({
    mutationFn: (data: OnlineConvertFormData) => convertsApi.create(data),
    onSuccess: () => { toast.success('Convert logged'); onSuccess(); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to log convert'),
  });

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">First Name *</label>
          <input className="input" {...register('firstName', { required: 'Required' })} placeholder="John" />
          {errors.firstName && <p className="text-red-400 text-xs mt-1">{errors.firstName.message}</p>}
        </div>
        <div>
          <label className="label">Last Name *</label>
          <input className="input" {...register('lastName', { required: 'Required' })} placeholder="Doe" />
          {errors.lastName && <p className="text-red-400 text-xs mt-1">{errors.lastName.message}</p>}
        </div>
        <div>
          <label className="label">Phone</label>
          <input className="input" {...register('phone')} placeholder="08012345678" />
        </div>
        <div>
          <label className="label">Email</label>
          <input type="email" className="input" {...register('email')} placeholder="john@example.com" />
        </div>
        <div>
          <label className="label">Platform *</label>
          <select className="input" {...register('platform', { required: true })}>
            {['youtube', 'facebook', 'zoom', 'instagram', 'other'].map(p => (
              <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="label">Notes</label>
        <textarea className="input" rows={2} {...register('notes')} placeholder="Additional context..." />
      </div>
      <div className="flex justify-end gap-3 pt-3 border-t border-bg-border">
        <button type="button" onClick={onCancel} className="btn-ghost">Cancel</button>
        <button type="submit" disabled={mutation.isPending} className="btn-gold">
          {mutation.isPending ? 'Saving...' : 'Log Convert'}
        </button>
      </div>
    </form>
  );
}

export default function ConvertsPage() {
  const qc = useQueryClient();
  const [showAdd, setShowAdd]     = useState(false);
  const [statusFilter, setStatus] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['converts', statusFilter],
    queryFn: async () => {
      const res = await convertsApi.getAll({ followUpStatus: statusFilter || undefined, limit: 50 });
      return { converts: res.data.data as OnlineConvert[], total: res.data.pagination?.total };
    },
  });

  const converts = data?.converts ?? [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-3xl" style={{ color: 'var(--text-primary)' }}>Online Converts</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{data?.total ?? 0} total converts</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-gold flex items-center gap-2">
          <Plus size={16} /> Log Convert
        </button>
      </div>

      <select value={statusFilter} onChange={(e) => setStatus(e.target.value)} className="input w-auto">
        <option value="">All Statuses</option>
        {Object.keys(FOLLOW_UP_COLORS).map(s => (
          <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
        ))}
      </select>

      <div className="card overflow-hidden">
        {isLoading ? <PageLoader /> : converts.length === 0 ? (
          <EmptyState icon="🙌" title="No converts logged" description="Log your first online convert"
            action={<button onClick={() => setShowAdd(true)} className="btn-gold">Log Convert</button>}
          />
        ) : (
          <table className="w-full">
            <thead className="bg-bg-hover/50 border-b border-bg-border">
              <tr>
                {['Name', 'Contact', 'Platform', 'Follow-up Status', 'Date'].map(h => (
                  <th key={h} className="table-header text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {converts.map((c) => {
                const sc = FOLLOW_UP_COLORS[c.followUpStatus];
                return (
                  <tr key={c._id} className="table-row" style={{ transition: 'background 0.2s' }}>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399' }}>
                          {c.firstName[0]}{c.lastName[0]}
                        </div>
                        <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{c.firstName} {c.lastName}</p>
                      </div>
                    </td>
                    <td className="table-cell text-xs" style={{ color: 'var(--text-muted)' }}>
                      {c.phone || c.email || '—'}
                    </td>
                    <td className="table-cell">
                      <span className="text-xs capitalize px-2 py-0.5 rounded-full" style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8' }}>
                        {c.platform}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize" style={{ background: sc.bg, color: sc.text }}>
                        {c.followUpStatus}
                      </span>
                    </td>
                    <td className="table-cell text-xs" style={{ color: 'var(--text-muted)' }}>
                      {format(new Date(c.createdAt), 'dd MMM yyyy')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Log Online Convert" size="md">
        <AddConvertForm onSuccess={() => { setShowAdd(false); qc.invalidateQueries({ queryKey: ['converts'] }); }} onCancel={() => setShowAdd(false)} />
      </Modal>
    </div>
  );
}
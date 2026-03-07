import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import api from '../../lib/api';
import Modal from '../../components/ui/Modal';
import { PageLoader } from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import type { Department } from '../../types';

export default function DepartmentsPage() {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const { data: departments, isLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const res = await api.get('/departments?limit=100');
      return res.data.data as Department[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/departments/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['departments'] }); toast.success('Deleted'); setDeleting(null); },
    onError: () => toast.error('Failed to delete'),
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-3xl text-text-primary">Departments</h1>
          <p className="text-text-muted text-sm mt-0.5">{departments?.length ?? 0} departments</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-gold">
          <Plus size={15} /> Add Department
        </button>
      </div>

      {isLoading ? <PageLoader /> : departments?.length === 0 ? (
        <EmptyState icon="🏛️" title="No departments yet" action={<button onClick={() => setShowAdd(true)} className="btn-gold">Add Department</button>} />
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {departments?.map((dept) => (
            <div key={dept._id} className="card p-5 hover:border-bg-border/80 transition-colors group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                    style={{ backgroundColor: dept.color ? `${dept.color}20` : '#6366f120' }}>
                    {dept.icon || '🏛️'}
                  </div>
                  <div>
                    <h3 className="font-semibold text-text-primary">{dept.name}</h3>
                    <div className="flex items-center gap-1 text-text-muted text-xs mt-0.5">
                      <Users size={11} />
                      <span>{dept.memberCount ?? 0} members</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setEditing(dept)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-bg-hover text-text-muted hover:text-gold">
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => setDeleting(dept._id)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-900/30 text-text-muted hover:text-red-400">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              {dept.isActive ? (
                <span className="text-xs text-green-400 bg-green-900/30 px-2 py-0.5 rounded-lg">Active</span>
              ) : (
                <span className="text-xs text-gray-500 bg-gray-800/60 px-2 py-0.5 rounded-lg">Inactive</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showAdd || !!editing}
        onClose={() => { setShowAdd(false); setEditing(null); }}
        title={editing ? 'Edit Department' : 'Add Department'}
        size="sm"
      >
        <DeptForm
          dept={editing}
          onSuccess={() => { setShowAdd(false); setEditing(null); qc.invalidateQueries({ queryKey: ['departments'] }); }}
          onCancel={() => { setShowAdd(false); setEditing(null); }}
        />
      </Modal>

      {/* Delete Confirm */}
      <Modal isOpen={!!deleting} onClose={() => setDeleting(null)} title="Delete Department" size="sm">
        <p className="text-text-secondary mb-5">Delete this department? Members won't be removed, just unassigned.</p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setDeleting(null)} className="btn-ghost">Cancel</button>
          <button onClick={() => deleting && deleteMutation.mutate(deleting)} className="btn-danger">
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </Modal>
    </div>
  );
}

function DeptForm({ dept, onSuccess, onCancel }: { dept: Department | null; onSuccess: () => void; onCancel: () => void }) {
  const { register, handleSubmit } = useForm({
    defaultValues: {
      name: dept?.name || '',
      description: dept?.description || '',
      icon: dept?.icon || '🏛️',
      color: dept?.color || '#6366f1',
    },
  });

  const mutation = useMutation({
    mutationFn: (data: any) => dept
      ? api.patch(`/departments/${dept._id}`, data)
      : api.post('/departments', data),
    onSuccess: () => { toast.success(dept ? 'Updated!' : 'Department created!'); onSuccess(); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed'),
  });

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
      <div>
        <label className="label">Department Name *</label>
        <input className="input" {...register('name', { required: true })} placeholder="Choir & Praise Team" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Icon (emoji)</label>
          <input className="input text-xl text-center" {...register('icon')} placeholder="🎵" />
        </div>
        <div>
          <label className="label">Color</label>
          <input type="color" className="input h-10 p-1 cursor-pointer" {...register('color')} />
        </div>
      </div>
      <div>
        <label className="label">Description</label>
        <textarea className="input h-16 resize-none" {...register('description')} placeholder="Optional description" />
      </div>
      <div className="flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="btn-ghost">Cancel</button>
        <button type="submit" disabled={mutation.isPending} className="btn-gold">
          {mutation.isPending ? 'Saving...' : dept ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
}

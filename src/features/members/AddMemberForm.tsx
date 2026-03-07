import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import type { Department, MemberFormData } from '../../types';

interface Props {
  departments: Department[];
  onSuccess: () => void;
  onCancel: () => void;
}

export default function AddMemberForm({ departments, onSuccess, onCancel }: Props) {
  const [selectedDeptIds, setSelectedDeptIds] = useState<string[]>([]);
  const [deptDropdownOpen, setDeptDropdownOpen] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<MemberFormData>({
    defaultValues: { status: 'member', gender: 'male', maritalStatus: 'single' },
  });

  const toggleDept = (id: string) => {
    setSelectedDeptIds((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const mutation = useMutation({
    mutationFn: (data: MemberFormData) =>
      api.post('/members', { ...data, departmentIds: selectedDeptIds }),
    onSuccess: () => { toast.success('Member added successfully!'); onSuccess(); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to add member'),
  });

  const selectedDeptNames = departments
    .filter((d) => selectedDeptIds.includes(d._id))
    .map((d) => d.name);

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
      <style>{`
        @keyframes inputFocus {
          from { box-shadow: 0 0 0 0 rgba(218, 165, 32, 0.1); }
          to { box-shadow: 0 0 0 4px rgba(218, 165, 32, 0.1); }
        }
        .form-field { transition: all 0.2s ease; }
        .form-field:focus-within { transform: translateY(-1px); }
        .dept-dropdown { animation: fadeIn 0.15s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div className="grid grid-cols-2 gap-4">
        <div className="form-field">
          <label className="label">First Name *</label>
          <input className="input transition-all duration-200" {...register('firstName', { required: 'First name is required' })} placeholder="John" />
          {errors.firstName && <p className="text-red-400 text-xs mt-1">{errors.firstName.message}</p>}
        </div>
        <div className="form-field">
          <label className="label">Last Name *</label>
          <input className="input transition-all duration-200" {...register('lastName', { required: 'Last name is required' })} placeholder="Doe" />
          {errors.lastName && <p className="text-red-400 text-xs mt-1">{errors.lastName.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="form-field">
          <label className="label">Email</label>
          <input type="email" className="input transition-all duration-200" {...register('email')} placeholder="john@example.com" />
        </div>
        <div className="form-field">
          <label className="label">Phone</label>
          <input className="input transition-all duration-200" {...register('phone')} placeholder="08012345678" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="form-field">
          <label className="label">Gender</label>
          <select className="input transition-all duration-200" {...register('gender')}>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="form-field">
          <label className="label">Status</label>
          <select className="input transition-all duration-200" {...register('status')}>
            {['member','worker','leader','new_convert','first_timer','visitor'].map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label className="label">Marital Status</label>
          <select className="input transition-all duration-200" {...register('maritalStatus')}>
            {['single','married','divorced','widowed'].map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="form-field">
          <label className="label">Date of Birth</label>
          <input type="date" className="input transition-all duration-200" {...register('dateOfBirth')} />
        </div>
        <div className="form-field">
          <label className="label">Date Joined</label>
          <input type="date" className="input transition-all duration-200" {...register('dateJoined')} />
        </div>
      </div>

      {/* ── Multi-Department Picker ── */}
      <div className="form-field relative">
        <label className="label">Departments</label>
        <button
          type="button"
          onClick={() => setDeptDropdownOpen((o) => !o)}
          className="input transition-all duration-200 w-full text-left flex items-center justify-between"
        >
          <span className={selectedDeptIds.length === 0 ? 'text-gray-400' : ''}>
            {selectedDeptIds.length === 0
              ? 'Select departments...'
              : `${selectedDeptIds.length} selected`}
          </span>
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${deptDropdownOpen ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Selected tags */}
        {selectedDeptNames.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {selectedDeptNames.map((name, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                style={{ background: 'rgba(218,165,32,0.15)', color: '#DAA520', border: '1px solid rgba(218,165,32,0.3)' }}
              >
                {name}
                <button
                  type="button"
                  onClick={() => toggleDept(departments.find((d) => d.name === name)?._id || '')}
                  className="hover:opacity-70 transition-opacity"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Dropdown */}
        {deptDropdownOpen && (
          <div
            className="dept-dropdown absolute z-50 w-full mt-1 rounded-lg border overflow-hidden shadow-xl"
            style={{ background: 'var(--bg-card, #1a1a2e)', borderColor: 'var(--border, rgba(255,255,255,0.1))' }}
          >
            {departments?.length === 0 && (
              <p className="px-3 py-2 text-xs text-gray-400">No departments available</p>
            )}
            {departments?.map((d) => {
              const checked = selectedDeptIds.includes(d._id);
              return (
                <label
                  key={d._id}
                  className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-white/5 transition-colors duration-150"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleDept(d._id)}
                    className="w-4 h-4 rounded accent-yellow-500"
                  />
                  <span className="text-sm">{d.name}</span>
                  {checked && (
                    <span className="ml-auto text-xs" style={{ color: '#DAA520' }}>✓</span>
                  )}
                </label>
              );
            })}
            <div className="px-3 py-2 border-t" style={{ borderColor: 'var(--border, rgba(255,255,255,0.1))' }}>
              <button
                type="button"
                onClick={() => setDeptDropdownOpen(false)}
                className="text-xs text-gray-400 hover:text-white transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="form-field">
        <label className="label">Occupation</label>
        <input className="input transition-all duration-200" {...register('occupation')} placeholder="Software Engineer" />
      </div>

      <div className="form-field">
        <label className="label">Address</label>
        <input className="input transition-all duration-200" {...register('address')} placeholder="123 Church Street, Lagos" />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-ghost">Cancel</button>
        <button type="submit" disabled={mutation.isPending} className="btn-gold">
          {mutation.isPending ? 'Saving...' : 'Add Member'}
        </button>
      </div>
    </form>
  );
}
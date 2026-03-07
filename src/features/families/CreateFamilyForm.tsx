import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Search, X, Crown, Shield, Heart } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import type { Member } from '../../types';

interface Props {
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormData {
  familyName: string;
  address?: string;
  city?: string;
  state?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  notes?: string;
}

interface MemberPickerProps {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (id: string) => void;
  members: Member[];
  placeholder: string;
  required?: boolean;
  error?: string;
  excludeIds?: string[];
}

function MemberPicker({ label, icon, value, onChange, members, placeholder, required, error, excludeIds = [] }: MemberPickerProps) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = members.find((m) => m._id === value);

  const filtered = members.filter((m) => {
    if (excludeIds.includes(m._id) && m._id !== value) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      m.firstName.toLowerCase().includes(q) ||
      m.lastName.toLowerCase().includes(q) ||
      (m.membershipId || '').toLowerCase().includes(q) ||
      (m.phone || '').includes(q)
    );
  });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (m: Member) => {
    onChange(m._id);
    setOpen(false);
    setSearch('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearch('');
  };

  return (
    <div className="form-field" ref={ref} style={{ position: 'relative' }}>
      <label className="label flex items-center gap-1.5">
        {icon} {label} {required && <span style={{ color: '#DAA520' }}>*</span>}
      </label>

      <div
        onClick={() => setOpen((o) => !o)}
        className="input cursor-pointer flex items-center gap-2"
        style={{ userSelect: 'none' }}
      >
        {selected ? (
          <>
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: 'rgba(218,165,32,0.15)', color: '#DAA520' }}
            >
              {selected.firstName.charAt(0)}
            </div>
            <span className="flex-1 text-sm" style={{ color: 'var(--text-primary)' }}>
              {selected.firstName} {selected.lastName}
              <span className="ml-2 font-mono text-xs" style={{ color: '#DAA520' }}>
                {selected.membershipId}
              </span>
            </span>
            <button type="button" onClick={handleClear} style={{ color: 'var(--text-muted)' }}>
              <X size={14} />
            </button>
          </>
        ) : (
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{placeholder}</span>
        )}
      </div>

      {open && (
        <div
          style={{
            position: 'absolute',
            zIndex: 50,
            top: '100%',
            left: 0,
            right: 0,
            marginTop: 4,
            background: 'var(--bg-surface, #111)',
            border: '1px solid var(--bg-border, rgba(255,255,255,0.1))',
            borderRadius: 12,
            boxShadow: '0 16px 40px rgba(0,0,0,0.4)',
            maxHeight: 260,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <div
            className="flex items-center gap-2 px-3 py-2.5"
            style={{ borderBottom: '1px solid var(--bg-border, rgba(255,255,255,0.08))' }}
          >
            <Search size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <input
              autoFocus
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              placeholder="Search by name, ID or phone..."
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: 'var(--text-primary)' }}
            />
            {search && (
              <button type="button" onClick={() => setSearch('')} style={{ color: 'var(--text-muted)' }}>
                <X size={12} />
              </button>
            )}
          </div>

          <div style={{ overflowY: 'auto', flex: 1 }}>
            {filtered.length === 0 ? (
              <p className="px-3 py-4 text-xs text-center" style={{ color: 'var(--text-muted)' }}>
                No members found
              </p>
            ) : (
              filtered.slice(0, 20).map((m) => (
                <button
                  key={m._id}
                  type="button"
                  onClick={() => handleSelect(m)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-white/5"
                  style={{
                    background: m._id === value ? 'rgba(218,165,32,0.08)' : 'transparent',
                    borderLeft: m._id === value ? '2px solid #DAA520' : '2px solid transparent',
                  }}
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: 'rgba(218,165,32,0.12)', color: '#DAA520' }}
                  >
                    {m.firstName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                      {m.firstName} {m.lastName}
                    </p>
                    <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                      {m.membershipId}{m.phone ? ` · ${m.phone}` : ''}
                    </p>
                  </div>
                  <span
                    className="text-xs px-1.5 py-0.5 rounded flex-shrink-0"
                    style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}
                  >
                    {m.status}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
}

export default function CreateFamilyForm({ onSuccess, onCancel }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();
  const [headId, setHeadId] = useState('');
  const [assistantHeadId, setAssistantHeadId] = useState('');
  const [spouseId, setSpouseId] = useState('');
  const [headError, setHeadError] = useState('');

  const { data: members = [] } = useQuery({
    queryKey: ['members-dropdown'],
    queryFn: async () => {
      const res = await api.get('/members?limit=200');
      return res.data.data as Member[];
    },
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      api.post('/families', {
        ...data,
        headId,
        assistantHeadId: assistantHeadId || undefined,
        spouseId: spouseId || undefined,
      }),
    onSuccess: () => { toast.success('Family created!'); onSuccess(); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create family'),
  });

  const onSubmit = (data: FormData) => {
    if (!headId) { setHeadError('Please select a family head'); return; }
    setHeadError('');
    mutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="form-field">
        <label className="label">Family Name *</label>
        <input
          className="input"
          {...register('familyName', { required: 'Family name is required' })}
          placeholder="e.g. The Abraham Family"
        />
        {errors.familyName && <p className="text-red-400 text-xs mt-1">{errors.familyName.message}</p>}
      </div>

      <div className="space-y-3">
        <MemberPicker
          label="Family Head"
          icon={<Crown size={13} style={{ color: '#DAA520' }} />}
          value={headId}
          onChange={(id) => { setHeadId(id); if (id) setHeadError(''); }}
          members={members}
          placeholder="Search for family head..."
          required
          error={headError}
          excludeIds={[assistantHeadId, spouseId].filter(Boolean)}
        />
        <MemberPicker
          label="Assistant Head"
          icon={<Shield size={13} style={{ color: '#5c9ee0' }} />}
          value={assistantHeadId}
          onChange={setAssistantHeadId}
          members={members}
          placeholder="Search for assistant head (optional)"
          excludeIds={[headId, spouseId].filter(Boolean)}
        />
        <MemberPicker
          label="Spouse"
          icon={<Heart size={13} style={{ color: '#e05c5c' }} />}
          value={spouseId}
          onChange={setSpouseId}
          members={members}
          placeholder="Search for spouse (optional)"
          excludeIds={[headId, assistantHeadId].filter(Boolean)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="form-field">
          <label className="label">City</label>
          <input className="input" {...register('city')} placeholder="Lagos" />
        </div>
        <div className="form-field">
          <label className="label">State</label>
          <input className="input" {...register('state')} placeholder="Lagos" />
        </div>
      </div>

      <div className="form-field">
        <label className="label">Address</label>
        <input className="input" {...register('address')} placeholder="123 Church Street" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="form-field">
          <label className="label">Emergency Contact Name</label>
          <input className="input" {...register('emergencyContactName')} placeholder="John Doe" />
        </div>
        <div className="form-field">
          <label className="label">Emergency Contact Phone</label>
          <input className="input" {...register('emergencyContactPhone')} placeholder="08012345678" />
        </div>
      </div>

      <div className="form-field">
        <label className="label">Notes</label>
        <textarea className="input resize-none h-20" {...register('notes')} placeholder="Any notes about this family..." />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-ghost">Cancel</button>
        <button type="submit" disabled={mutation.isPending} className="btn-gold">
          {mutation.isPending ? 'Creating...' : 'Create Family'}
        </button>
      </div>
    </form>
  );
}
/**
 * ChurchOS — src/features/welfare/AddWelfareForm.tsx
 * Module 12 — Welfare & Care
 * Dynamic form — fields change based on selected category.
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import type { WelfareFormData, WelfareCategory } from '../../types/welfare.types';
import { WELFARE_CATEGORY_LABELS, WELFARE_CATEGORY_ICONS } from '../../types/welfare.types';
import type { Member } from '../../types';

interface Props {
  onSuccess: () => void;
  onCancel: () => void;
}

const CATEGORIES: WelfareCategory[] = [
  'sick_hospital', 'financial_assistance', 'disbursement',
  'prayer_request', 'counselling', 'bereavement', 'visit', 'general',
];

export default function AddWelfareForm({ onSuccess, onCancel }: Props) {
  const [category, setCategory] = useState<WelfareCategory>('general');
  const [memberSearch, setMemberSearch] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [memberDropOpen, setMemberDropOpen] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<WelfareFormData>({
    defaultValues: { isConfidential: false },
  });

  // Member search
  const { data: memberResults } = useQuery({
    queryKey: ['member-search-welfare', memberSearch],
    queryFn: async () => {
      if (memberSearch.length < 2) return [];
      const res = await api.get(`/members?search=${memberSearch}&limit=10`);
      return res.data.data as Member[];
    },
    enabled: memberSearch.length >= 2,
  });

  const mutation = useMutation({
    mutationFn: (data: WelfareFormData) =>
      api.post('/welfare', { ...data, memberId: selectedMember?._id, category }),
    onSuccess: () => {
      toast.success('Welfare record created!');
      reset();
      onSuccess();
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || 'Failed to create welfare record'),
  });

  const onSubmit = (data: WelfareFormData) => {
    if (!selectedMember) { toast.error('Please select a member'); return; }
    mutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col" style={{ maxHeight: '75vh' }}>
      <style>{`
        .wf-field { transition: all 0.2s ease; }
        .wf-field:focus-within { transform: translateY(-1px); }
        .cat-btn {
          display: flex; flex-direction: column; align-items: center; gap: 4px;
          padding: 10px 8px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08);
          font-size: 11px; font-weight: 600; cursor: pointer;
          transition: all 0.2s ease; background: rgba(255,255,255,0.02);
          color: var(--text-muted, #888);
        }
        .cat-btn:hover { border-color: rgba(218,165,32,0.3); color: var(--text-primary,#fff); background: rgba(218,165,32,0.05); }
        .cat-btn.active { border-color: #DAA520; background: rgba(218,165,32,0.12); color: #DAA520; }
        .member-drop { animation: fadeIn 0.15s ease; }
        @keyframes fadeIn { from { opacity:0; transform:translateY(-4px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      {/* ── Scrollable body ── */}
      <div className="overflow-y-auto flex-1 space-y-5 pr-1" style={{ minHeight: 0 }}>

      {/* ── Member Picker ── */}
      <div className="wf-field relative">
        <label className="label">Member *</label>
        {selectedMember ? (
          <div
            className="input flex items-center justify-between cursor-pointer"
            onClick={() => { setSelectedMember(null); setMemberSearch(''); }}
          >
            <span className="text-sm text-text-primary">
              {selectedMember.firstName} {selectedMember.lastName}
              <span className="ml-2 font-mono text-xs" style={{ color: '#DAA520' }}>
                {selectedMember.membershipId}
              </span>
            </span>
            <span className="text-xs text-text-muted hover:text-red-400 transition-colors">✕ Change</span>
          </div>
        ) : (
          <>
            <input
              className="input"
              placeholder="Search by name or ID..."
              value={memberSearch}
              onChange={(e) => { setMemberSearch(e.target.value); setMemberDropOpen(true); }}
              onFocus={() => setMemberDropOpen(true)}
            />
            {memberDropOpen && memberResults && memberResults.length > 0 && (
              <div
                className="member-drop absolute z-50 w-full mt-1 rounded-lg border overflow-hidden shadow-xl"
                style={{ background: 'var(--bg-card, #1a1a2e)', borderColor: 'rgba(255,255,255,0.1)' }}
              >
                {memberResults.map((m) => (
                  <button
                    key={m._id}
                    type="button"
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 transition-colors text-left"
                    onClick={() => { setSelectedMember(m); setMemberDropOpen(false); setMemberSearch(''); }}
                  >
                    <div className="w-7 h-7 rounded-full bg-gold/20 flex items-center justify-center text-xs font-bold" style={{ color: '#DAA520' }}>
                      {m.firstName[0]}{m.lastName[0]}
                    </div>
                    <div>
                      <p className="text-sm text-text-primary">{m.firstName} {m.lastName}</p>
                      <p className="text-xs text-text-muted font-mono">{m.membershipId}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Category Picker ── */}
      <div className="wf-field">
        <label className="label">Category *</label>
        <div className="grid grid-cols-4 gap-2 mt-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`cat-btn ${category === cat ? 'active' : ''}`}
            >
              <span className="text-lg">{WELFARE_CATEGORY_ICONS[cat]}</span>
              <span>{WELFARE_CATEGORY_LABELS[cat].split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Title ── */}
      <div className="wf-field">
        <label className="label">Title *</label>
        <input
          className="input"
          placeholder="Brief summary of this welfare case..."
          {...register('title', { required: 'Title is required' })}
        />
        {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>}
      </div>

      <div className="wf-field">
        <label className="label">Description</label>
        <textarea
          className="input resize-none"
          rows={3}
          placeholder="Additional details..."
          {...register('description')}
        />
      </div>

      {/* ── CONDITIONAL FIELDS BY CATEGORY ── */}

      {/* Sick / Hospital */}
      {category === 'sick_hospital' && (
        <div className="space-y-3 p-4 rounded-xl" style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)' }}>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#ef4444' }}>🏥 Hospital Details</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="wf-field">
              <label className="label">Hospital Name</label>
              <input className="input" placeholder="Lagos General Hospital" {...register('hospitalName')} />
            </div>
            <div className="wf-field">
              <label className="label">Treating Doctor</label>
              <input className="input" placeholder="Dr. Adeyemi" {...register('treatingDoctor')} />
            </div>
            <div className="wf-field">
              <label className="label">Admission Date</label>
              <input type="date" className="input" {...register('admissionDate')} />
            </div>
            <div className="wf-field">
              <label className="label">Discharge Date</label>
              <input type="date" className="input" {...register('dischargeDate')} />
            </div>
          </div>
          <div className="wf-field">
            <label className="label">Diagnosis</label>
            <input className="input" placeholder="Condition / diagnosis..." {...register('diagnosis')} />
          </div>
        </div>
      )}

      {/* Financial Assistance */}
      {category === 'financial_assistance' && (
        <div className="space-y-3 p-4 rounded-xl" style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)' }}>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#f59e0b' }}>💰 Financial Request</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="wf-field">
              <label className="label">Amount (NGN) *</label>
              <input type="number" className="input" placeholder="50000" {...register('financialRequest.amount', { valueAsNumber: true })} />
            </div>
            <div className="wf-field">
              <label className="label">Currency</label>
              <select className="input" {...register('financialRequest.currency')}>
                <option value="NGN">NGN</option>
                <option value="USD">USD</option>
                <option value="GBP">GBP</option>
              </select>
            </div>
          </div>
          <div className="wf-field">
            <label className="label">Reason for Request *</label>
            <textarea className="input resize-none" rows={3} placeholder="Explain the need..." {...register('financialRequest.reason')} />
          </div>
        </div>
      )}

      {/* Prayer Request */}
      {category === 'prayer_request' && (
        <div className="space-y-3 p-4 rounded-xl" style={{ background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.15)' }}>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#8b5cf6' }}>🙏 Prayer Request</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="wf-field col-span-2">
              <label className="label">Prayer Topic *</label>
              <input className="input" placeholder="What should we pray for?" {...register('prayerRequest.title')} />
            </div>
            <div className="wf-field col-span-2">
              <label className="label">Details</label>
              <textarea className="input resize-none" rows={3} placeholder="More context..." {...register('prayerRequest.details')} />
            </div>
            <div className="wf-field">
              <label className="label">Visibility</label>
              <select className="input" {...register('prayerRequest.visibility')}>
                <option value="private">Private</option>
                <option value="public">Public (congregation)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Counselling */}
      {category === 'counselling' && (
        <div className="space-y-3 p-4 rounded-xl" style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)' }}>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#10b981' }}>🧠 Counselling Session</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="wf-field">
              <label className="label">Session Date *</label>
              <input type="date" className="input" {...register('counsellingSession.sessionDate')} />
            </div>
            <div className="wf-field">
              <label className="label">Duration (mins)</label>
              <input type="number" className="input" placeholder="60" {...register('counsellingSession.durationMinutes', { valueAsNumber: true })} />
            </div>
            <div className="wf-field">
              <label className="label">Status</label>
              <select className="input" {...register('counsellingSession.status')}>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="follow_up">Follow Up</option>
              </select>
            </div>
            <div className="wf-field col-span-2">
              <label className="label">Session Notes</label>
              <textarea className="input resize-none" rows={3} placeholder="Counsellor notes (confidential)..." {...register('counsellingSession.notes')} />
            </div>
          </div>
        </div>
      )}

      {/* Bereavement */}
      {category === 'bereavement' && (
        <div className="space-y-3 p-4 rounded-xl" style={{ background: 'rgba(107,114,128,0.07)', border: '1px solid rgba(107,114,128,0.2)' }}>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#9ca3af' }}>🕊️ Bereavement</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="wf-field">
              <label className="label">Deceased Name *</label>
              <input className="input" placeholder="Name of deceased" {...register('bereavementRecord.deceasedName')} />
            </div>
            <div className="wf-field">
              <label className="label">Relationship</label>
              <input className="input" placeholder="e.g. Father, Spouse" {...register('bereavementRecord.relationshipToMember')} />
            </div>
            <div className="wf-field">
              <label className="label">Date of Death *</label>
              <input type="date" className="input" {...register('bereavementRecord.dateOfDeath')} />
            </div>
            <div className="wf-field">
              <label className="label">Funeral Date</label>
              <input type="date" className="input" {...register('bereavementRecord.funeralDate')} />
            </div>
            <div className="wf-field col-span-2">
              <label className="label">Funeral Location</label>
              <input className="input" placeholder="Venue / address" {...register('bereavementRecord.funeralLocation')} />
            </div>
          </div>
        </div>
      )}

      {/* Visit */}
      {category === 'visit' && (
        <div className="space-y-3 p-4 rounded-xl" style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.15)' }}>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#3b82f6' }}>🏠 Visit Schedule</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="wf-field">
              <label className="label">Visit Type *</label>
              <select className="input" {...register('visitSchedule.visitType')}>
                <option value="home">Home Visit</option>
                <option value="hospital">Hospital Visit</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="wf-field">
              <label className="label">Scheduled Date *</label>
              <input type="datetime-local" className="input" {...register('visitSchedule.scheduledDate')} />
            </div>
            <div className="wf-field col-span-2">
              <label className="label">Location / Address</label>
              <input className="input" placeholder="Full address..." {...register('visitSchedule.location')} />
            </div>
          </div>
        </div>
      )}

      {/* Disbursement */}
      {category === 'disbursement' && (
        <div className="space-y-3 p-4 rounded-xl" style={{ background: 'rgba(218,165,32,0.05)', border: '1px solid rgba(218,165,32,0.15)' }}>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#DAA520' }}>💸 Disbursement Record</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="wf-field">
              <label className="label">Amount *</label>
              <input type="number" className="input" placeholder="25000" {...register('disbursementRecord.amount', { valueAsNumber: true })} />
            </div>
            <div className="wf-field">
              <label className="label">Disbursed Date *</label>
              <input type="date" className="input" {...register('disbursementRecord.disbursedAt')} />
            </div>
            <div className="wf-field col-span-2">
              <label className="label">Purpose *</label>
              <input className="input" placeholder="What the funds were used for..." {...register('disbursementRecord.purpose')} />
            </div>
            <div className="wf-field col-span-2">
              <label className="label">Reference / Cheque No.</label>
              <input className="input" placeholder="TXN-00123" {...register('disbursementRecord.disbursementRef')} />
            </div>
          </div>
        </div>
      )}

      {/* ── Confidential Toggle ── */}
      <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <input type="checkbox" id="isConfidential" className="w-4 h-4 rounded accent-yellow-500" {...register('isConfidential')} />
        <label htmlFor="isConfidential" className="text-sm text-text-secondary cursor-pointer">
          Mark as <span style={{ color: '#DAA520' }}>Confidential</span>
          <span className="text-xs text-text-muted ml-1">(visible to Pastor & Counsellors only)</span>
        </label>
      </div>

      </div>{/* end scrollable body */}

      {/* ── Sticky footer ── */}
      <div
        className="flex justify-end gap-3 pt-3 mt-1 flex-shrink-0"
        style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
      >
        <button type="button" onClick={onCancel} className="btn-ghost">Cancel</button>
        <button type="submit" disabled={mutation.isPending} className="btn-gold">
          {mutation.isPending ? 'Saving...' : 'Create Record'}
        </button>
      </div>
    </form>
  );
}
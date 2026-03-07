/**
 * ChurchOS — src/features/welfare/WelfareDetailPage.tsx
 * Module 12 — Welfare & Care
 * Full detail view of a single welfare record with action buttons.
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  ArrowLeft, CheckCircle, XCircle, DollarSign, Users,
  MessageSquarePlus, Lock, Unlock, MapPin, Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { PageLoader } from '../../components/ui/Spinner';
import Modal from '../../components/ui/Modal';
import type { WelfareRecord } from '../../types/welfare.types';
import {
  WELFARE_CATEGORY_LABELS,
  WELFARE_CATEGORY_ICONS,
  WELFARE_STATUS_COLORS,
  FINANCIAL_STATUS_COLORS,
} from '../../types/welfare.types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(date?: string) {
  if (!date) return '—';
  try { return format(new Date(date), 'dd MMM yyyy'); } catch { return '—'; }
}

function fmtTime(date?: string) {
  if (!date) return '—';
  try { return format(new Date(date), 'dd MMM yyyy, h:mm a'); } catch { return '—'; }
}

function Row({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted, #888)' }}>
        {label}
      </span>
      <span className="text-sm font-medium" style={{ color: 'var(--text-primary, #fff)' }}>
        {value ?? '—'}
      </span>
    </div>
  );
}

function Section({ icon, title, accent = '#DAA520', children }: {
  icon: React.ReactNode; title: string; accent?: string; children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl p-5 space-y-4"
      style={{
        background: 'var(--bg-card, rgba(255,255,255,0.04))',
        border: '1px solid var(--bg-border, rgba(255,255,255,0.08))',
      }}
    >
      <div className="flex items-center gap-2 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span style={{ color: accent }}>{icon}</span>
        <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-secondary, #ccc)' }}>
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

function StatusPill({ status, colorMap }: { status: string; colorMap: Record<string, string> }) {
  const color = colorMap[status] || '#888';
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      {status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
    </span>
  );
}

// ─── Add Note Modal ───────────────────────────────────────────────────────────

function AddNoteModal({
  welfareId, onClose, onSuccess,
}: { welfareId: string; onClose: () => void; onSuccess: () => void }) {
  const [content, setContent] = useState('');
  const [isConfidential, setIsConfidential] = useState(false);

  const mutation = useMutation({
    mutationFn: () => api.post(`/welfare/${welfareId}/notes`, { content, isConfidential }),
    onSuccess: () => { toast.success('Note added'); onSuccess(); onClose(); },
    onError: () => toast.error('Failed to add note'),
  });

  return (
    <div className="space-y-4">
      <textarea
        className="input resize-none w-full"
        rows={4}
        placeholder="Write your note here..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <div className="flex items-center gap-2">
        <input type="checkbox" id="conf" className="w-4 h-4 accent-yellow-500"
          checked={isConfidential} onChange={(e) => setIsConfidential(e.target.checked)} />
        <label htmlFor="conf" className="text-sm text-text-secondary cursor-pointer">
          Confidential <span className="text-xs text-text-muted">(pastor/counsellor only)</span>
        </label>
      </div>
      <div className="flex justify-end gap-3">
        <button onClick={onClose} className="btn-ghost">Cancel</button>
        <button
          onClick={() => mutation.mutate()}
          disabled={!content.trim() || mutation.isPending}
          className="btn-gold"
        >
          {mutation.isPending ? 'Saving...' : 'Add Note'}
        </button>
      </div>
    </div>
  );
}

// ─── Main Detail Page ────────────────────────────────────────────────────────

export default function WelfareDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [teamIds, setTeamIds] = useState('');

  const { data: record, isLoading, isError } = useQuery<WelfareRecord>({
    queryKey: ['welfare-record', id],
    queryFn: async () => {
      const res = await api.get(`/welfare/${id}`);
      return res.data.data as WelfareRecord;
    },
    enabled: !!id,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['welfare-record', id] });
    qc.invalidateQueries({ queryKey: ['welfare'] });
    qc.invalidateQueries({ queryKey: ['welfare-stats'] });
  };

  // ── Action mutations ──
  const approveMutation = useMutation({
    mutationFn: () => api.patch(`/welfare/${id}/financial/approve`),
    onSuccess: () => { toast.success('Request approved!'); invalidate(); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const rejectMutation = useMutation({
    mutationFn: () => api.patch(`/welfare/${id}/financial/reject`, { rejectionReason: rejectReason }),
    onSuccess: () => { toast.success('Request rejected'); setShowRejectModal(false); invalidate(); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const disburseMutation = useMutation({
    mutationFn: () => api.patch(`/welfare/${id}/financial/disburse`),
    onSuccess: () => { toast.success('Disbursement recorded!'); invalidate(); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const completeVisitMutation = useMutation({
    mutationFn: () => api.patch(`/welfare/${id}/visit/complete`),
    onSuccess: () => { toast.success('Visit completed!'); invalidate(); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const assignPrayerMutation = useMutation({
    mutationFn: () =>
      api.patch(`/welfare/${id}/prayer/assign`, {
        teamMemberIds: teamIds.split(',').map((s) => s.trim()).filter(Boolean),
      }),
    onSuccess: () => { toast.success('Prayer team assigned!'); setShowAssignModal(false); invalidate(); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const respondPrayerMutation = useMutation({
    mutationFn: () => api.patch(`/welfare/${id}/prayer/respond`, { responseNotes: 'Prayed for' }),
    onSuccess: () => { toast.success('Prayer response recorded!'); invalidate(); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  if (isLoading) return <PageLoader />;
  if (isError || !record) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
        <p className="text-text-muted">Record not found.</p>
        <button onClick={() => navigate('/welfare')} className="btn-ghost flex items-center gap-2">
          <ArrowLeft size={16} /> Back to Welfare
        </button>
      </div>
    );
  }

  const member = typeof record.memberId === 'object' ? record.memberId : null;
  const statusColor = WELFARE_STATUS_COLORS[record.status] || '#888';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <style>{`
        @keyframes slideUp {
          from { opacity:0; transform:translateY(14px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .wfd-section { animation: slideUp 0.3s ease both; }
        .wfd-section:nth-child(1) { animation-delay: 0.05s; }
        .wfd-section:nth-child(2) { animation-delay: 0.10s; }
        .wfd-section:nth-child(3) { animation-delay: 0.15s; }
        .wfd-section:nth-child(4) { animation-delay: 0.20s; }
        .note-card {
          border-left: 3px solid rgba(218,165,32,0.35);
          padding: 10px 14px; border-radius: 0 10px 10px 0;
          background: rgba(218,165,32,0.03);
        }
        .conf-note-card {
          border-left: 3px solid rgba(239,68,68,0.4);
          padding: 10px 14px; border-radius: 0 10px 10px 0;
          background: rgba(239,68,68,0.04);
        }
        .action-pill {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 8px 16px; border-radius: 10px; font-size: 13px;
          font-weight: 600; cursor: pointer; transition: all 0.2s ease;
          border: none;
        }
        .action-pill:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>

      {/* ── Back ── */}
      <button
        onClick={() => navigate('/welfare')}
        className="flex items-center gap-2 text-sm transition-colors hover:opacity-80"
        style={{ color: 'var(--text-muted, #888)' }}
      >
        <ArrowLeft size={16} /> Back to Welfare & Care
      </button>

      {/* ── Hero ── */}
      <div
        className="wfd-section rounded-2xl p-6"
        style={{
          background: 'var(--bg-card, rgba(255,255,255,0.04))',
          border: `1px solid ${statusColor}30`,
          boxShadow: `0 0 30px ${statusColor}08`,
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ background: `${statusColor}12`, border: `1px solid ${statusColor}25` }}
          >
            {WELFARE_CATEGORY_ICONS[record.category]}
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-start gap-3">
              <div>
                <h1 className="font-display font-bold text-xl" style={{ color: 'var(--text-primary, #fff)' }}>
                  {record.title}
                </h1>
                <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {WELFARE_CATEGORY_LABELS[record.category]}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 ml-auto">
                <StatusPill status={record.status} colorMap={WELFARE_STATUS_COLORS} />
                {record.isConfidential && (
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                    style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)' }}
                  >
                    <Lock size={10} /> Confidential
                  </span>
                )}
              </div>
            </div>

            {member && (
              <div className="flex items-center gap-2 pt-1">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: 'rgba(218,165,32,0.15)', color: '#DAA520' }}
                >
                  {member.firstName[0]}{member.lastName[0]}
                </div>
                <div>
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {member.firstName} {member.lastName}
                  </span>
                  <span className="ml-2 font-mono text-xs" style={{ color: '#DAA520' }}>
                    {member.membershipId}
                  </span>
                </div>
              </div>
            )}

            {record.description && (
              <p className="text-sm" style={{ color: 'var(--text-secondary, #ccc)' }}>
                {record.description}
              </p>
            )}
          </div>
        </div>

        {/* ── Action Buttons ── */}
        <div className="flex flex-wrap gap-2 mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            onClick={() => setShowNoteModal(true)}
            className="action-pill"
            style={{ background: 'rgba(218,165,32,0.12)', color: '#DAA520' }}
          >
            <MessageSquarePlus size={14} /> Add Note
          </button>

          {/* Financial actions */}
          {record.category === 'financial_assistance' && record.financialRequest && (
            <>
              {record.financialRequest.status === 'pending' && (
                <>
                  <button
                    onClick={() => approveMutation.mutate()}
                    disabled={approveMutation.isPending}
                    className="action-pill"
                    style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}
                  >
                    <CheckCircle size={14} /> Approve
                  </button>
                  <button
                    onClick={() => setShowRejectModal(true)}
                    className="action-pill"
                    style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}
                  >
                    <XCircle size={14} /> Reject
                  </button>
                </>
              )}
              {record.financialRequest.status === 'approved' && (
                <button
                  onClick={() => disburseMutation.mutate()}
                  disabled={disburseMutation.isPending}
                  className="action-pill"
                  style={{ background: 'rgba(218,165,32,0.12)', color: '#DAA520' }}
                >
                  <DollarSign size={14} /> Record Disbursement
                </button>
              )}
            </>
          )}

          {/* Prayer actions */}
          {record.category === 'prayer_request' && record.prayerRequest && (
            <>
              {['pending'].includes(record.prayerRequest.responseStatus) && (
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="action-pill"
                  style={{ background: 'rgba(139,92,246,0.12)', color: '#8b5cf6' }}
                >
                  <Users size={14} /> Assign Team
                </button>
              )}
              {['assigned'].includes(record.prayerRequest.responseStatus) && (
                <button
                  onClick={() => respondPrayerMutation.mutate()}
                  disabled={respondPrayerMutation.isPending}
                  className="action-pill"
                  style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}
                >
                  <CheckCircle size={14} /> Mark Responded
                </button>
              )}
            </>
          )}

          {/* Visit actions */}
          {record.category === 'visit' && record.visitSchedule?.status === 'scheduled' && (
            <button
              onClick={() => completeVisitMutation.mutate()}
              disabled={completeVisitMutation.isPending}
              className="action-pill"
              style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}
            >
              <CheckCircle size={14} /> Mark Visit Complete
            </button>
          )}
        </div>
      </div>

      {/* ── Grid Sections ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Sick / Hospital */}
        {record.category === 'sick_hospital' && (
          <div className="wfd-section">
            <Section icon="🏥" title="Hospital Details" accent="#ef4444">
              <div className="grid grid-cols-2 gap-4">
                <Row label="Hospital" value={record.hospitalName} />
                <Row label="Treating Doctor" value={record.treatingDoctor} />
                <Row label="Admission Date" value={fmt(record.admissionDate)} />
                <Row label="Discharge Date" value={fmt(record.dischargeDate)} />
                <Row label="Diagnosis" value={record.diagnosis} />
              </div>
            </Section>
          </div>
        )}

        {/* Financial */}
        {record.financialRequest && (
          <div className="wfd-section">
            <Section icon={<DollarSign size={14} />} title="Financial Request" accent="#DAA520">
              <div className="grid grid-cols-2 gap-4">
                <Row label="Amount" value={
                  <span style={{ color: '#DAA520', fontWeight: 700, fontSize: 18 }}>
                    {record.financialRequest.currency} {record.financialRequest.amount.toLocaleString()}
                  </span>
                } />
                <Row label="Status" value={
                  <StatusPill status={record.financialRequest.status} colorMap={FINANCIAL_STATUS_COLORS} />
                } />
                <Row label="Reason" value={record.financialRequest.reason} />
                {record.financialRequest.approvedAt && (
                  <Row label="Approved" value={fmt(record.financialRequest.approvedAt)} />
                )}
                {record.financialRequest.disbursedAt && (
                  <Row label="Disbursed" value={fmt(record.financialRequest.disbursedAt)} />
                )}
                {record.financialRequest.disbursementRef && (
                  <Row label="Reference" value={
                    <span className="font-mono text-xs">{record.financialRequest.disbursementRef}</span>
                  } />
                )}
                {record.financialRequest.rejectionReason && (
                  <Row label="Rejection Reason" value={
                    <span style={{ color: '#ef4444' }}>{record.financialRequest.rejectionReason}</span>
                  } />
                )}
              </div>
            </Section>
          </div>
        )}

        {/* Prayer Request */}
        {record.prayerRequest && (
          <div className="wfd-section">
            <Section icon="🙏" title="Prayer Request" accent="#8b5cf6">
              <div className="grid grid-cols-2 gap-4">
                <Row label="Topic" value={record.prayerRequest.title} />
                <Row label="Visibility" value={
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: record.prayerRequest.visibility === 'public' ? '#10b981' : '#f59e0b' }}>
                    {record.prayerRequest.visibility === 'public' ? <Unlock size={11} /> : <Lock size={11} />}
                    {record.prayerRequest.visibility === 'public' ? 'Public' : 'Private'}
                  </span>
                } />
                <Row label="Response Status" value={
                  <StatusPill status={record.prayerRequest.responseStatus} colorMap={{
                    pending: '#f59e0b', assigned: '#3b82f6', responded: '#10b981', closed: '#6b7280',
                  }} />
                } />
                {record.prayerRequest.respondedAt && (
                  <Row label="Responded On" value={fmt(record.prayerRequest.respondedAt)} />
                )}
                {record.prayerRequest.details && (
                  <div className="col-span-2">
                    <Row label="Details" value={record.prayerRequest.details} />
                  </div>
                )}
                {record.prayerRequest.responseNotes && (
                  <div className="col-span-2">
                    <Row label="Response Notes" value={record.prayerRequest.responseNotes} />
                  </div>
                )}
              </div>
            </Section>
          </div>
        )}

        {/* Counselling */}
        {record.counsellingSession && (
          <div className="wfd-section">
            <Section icon="🧠" title="Counselling Session" accent="#10b981">
              <div className="grid grid-cols-2 gap-4">
                <Row label="Session Date" value={fmtTime(record.counsellingSession.sessionDate)} />
                <Row label="Duration" value={
                  record.counsellingSession.durationMinutes
                    ? `${record.counsellingSession.durationMinutes} mins`
                    : undefined
                } />
                <Row label="Status" value={
                  <StatusPill status={record.counsellingSession.status} colorMap={{
                    scheduled: '#f59e0b', completed: '#10b981', cancelled: '#ef4444', follow_up: '#3b82f6',
                  }} />
                } />
                {record.counsellingSession.nextSessionDate && (
                  <Row label="Next Session" value={fmt(record.counsellingSession.nextSessionDate)} />
                )}
                {record.counsellingSession.notes && (
                  <div className="col-span-2">
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-text-muted">Notes</span>
                    <div className="conf-note-card mt-1.5">
                      <p className="text-sm text-text-secondary">{record.counsellingSession.notes}</p>
                      {record.counsellingSession.isConfidential && (
                        <p className="text-[10px] mt-1 flex items-center gap-1" style={{ color: '#ef4444' }}>
                          <Lock size={9} /> Confidential
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Section>
          </div>
        )}

        {/* Bereavement */}
        {record.bereavementRecord && (
          <div className="wfd-section">
            <Section icon="🕊️" title="Bereavement" accent="#9ca3af">
              <div className="grid grid-cols-2 gap-4">
                <Row label="Deceased" value={record.bereavementRecord.deceasedName} />
                <Row label="Relationship" value={record.bereavementRecord.relationshipToMember} />
                <Row label="Date of Death" value={fmt(record.bereavementRecord.dateOfDeath)} />
                <Row label="Funeral Date" value={fmt(record.bereavementRecord.funeralDate)} />
                {record.bereavementRecord.funeralLocation && (
                  <div className="col-span-2">
                    <Row label="Funeral Location" value={
                      <span className="flex items-center gap-1.5">
                        <MapPin size={12} style={{ color: '#9ca3af' }} />
                        {record.bereavementRecord.funeralLocation}
                      </span>
                    } />
                  </div>
                )}
                {record.bereavementRecord.supportActions.length > 0 && (
                  <div className="col-span-2">
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-text-muted">Support Actions</span>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {record.bereavementRecord.supportActions.map((a, i) => (
                        <span key={i} className="text-xs px-2 py-1 rounded-lg bg-bg-hover text-text-secondary">
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Section>
          </div>
        )}

        {/* Visit Schedule */}
        {record.visitSchedule && (
          <div className="wfd-section">
            <Section icon="🏠" title="Visit Schedule" accent="#3b82f6">
              <div className="grid grid-cols-2 gap-4">
                <Row label="Type" value={
                  record.visitSchedule.visitType.replace(/\b\w/g, (c) => c.toUpperCase()) + ' Visit'
                } />
                <Row label="Status" value={
                  <StatusPill status={record.visitSchedule.status} colorMap={{
                    scheduled: '#f59e0b', completed: '#10b981', cancelled: '#ef4444', rescheduled: '#3b82f6',
                  }} />
                } />
                <Row label="Scheduled" value={
                  <span className="flex items-center gap-1.5">
                    <Clock size={12} style={{ color: '#3b82f6' }} />
                    {fmtTime(record.visitSchedule.scheduledDate)}
                  </span>
                } />
                {record.visitSchedule.completedDate && (
                  <Row label="Completed" value={fmtTime(record.visitSchedule.completedDate)} />
                )}
                {record.visitSchedule.location && (
                  <div className="col-span-2">
                    <Row label="Location" value={
                      <span className="flex items-center gap-1.5">
                        <MapPin size={12} style={{ color: '#3b82f6' }} />
                        {record.visitSchedule.location}
                      </span>
                    } />
                  </div>
                )}
                {record.visitSchedule.notes && (
                  <div className="col-span-2">
                    <Row label="Visit Notes" value={record.visitSchedule.notes} />
                  </div>
                )}
              </div>
            </Section>
          </div>
        )}
      </div>

      {/* ── Notes Thread ── */}
      <div className="wfd-section">
        <Section icon={<MessageSquarePlus size={14} />} title={`Notes (${record.notes.length})`}>
          {record.notes.length === 0 ? (
            <p className="text-sm text-center py-3" style={{ color: 'var(--text-muted)' }}>No notes yet.</p>
          ) : (
            <div className="space-y-3">
              {record.notes.map((note) => (
                <div key={note._id} className={note.isConfidential ? 'conf-note-card' : 'note-card'}>
                  <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{note.content}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {fmtTime(note.createdAt)}
                    </span>
                    {typeof note.createdBy === 'object' && (
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        · {note.createdBy.email}
                      </span>
                    )}
                    {note.isConfidential && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold ml-auto" style={{ color: '#ef4444' }}>
                        <Lock size={9} /> Confidential
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>

      {/* ── Meta ── */}
      <div
        className="wfd-section rounded-2xl px-5 py-3 flex flex-wrap gap-6"
        style={{
          background: 'var(--bg-card, rgba(255,255,255,0.02))',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <Row label="Created" value={fmt(record.createdAt)} />
        <Row label="Last Updated" value={fmt(record.updatedAt)} />
        {typeof record.createdBy === 'object' && (
          <Row label="Created By" value={record.createdBy.email} />
        )}
      </div>

      {/* ── Add Note Modal ── */}
      <Modal isOpen={showNoteModal} onClose={() => setShowNoteModal(false)} title="Add Note" size="sm">
        <AddNoteModal
          welfareId={id!}
          onClose={() => setShowNoteModal(false)}
          onSuccess={invalidate}
        />
      </Modal>

      {/* ── Reject Modal ── */}
      <Modal isOpen={showRejectModal} onClose={() => setShowRejectModal(false)} title="Reject Request" size="sm">
        <div className="space-y-4">
          <textarea
            className="input resize-none w-full"
            rows={3}
            placeholder="Reason for rejection..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowRejectModal(false)} className="btn-ghost">Cancel</button>
            <button
              onClick={() => rejectMutation.mutate()}
              disabled={!rejectReason.trim() || rejectMutation.isPending}
              className="btn-danger"
            >
              {rejectMutation.isPending ? 'Rejecting...' : 'Reject Request'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Assign Prayer Team Modal ── */}
      <Modal isOpen={showAssignModal} onClose={() => setShowAssignModal(false)} title="Assign Prayer Team" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-text-muted">
            Enter user IDs of prayer team members (comma separated).
          </p>
          <input
            className="input w-full"
            placeholder="userId1, userId2, ..."
            value={teamIds}
            onChange={(e) => setTeamIds(e.target.value)}
          />
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowAssignModal(false)} className="btn-ghost">Cancel</button>
            <button
              onClick={() => assignPrayerMutation.mutate()}
              disabled={!teamIds.trim() || assignPrayerMutation.isPending}
              className="btn-gold"
            >
              {assignPrayerMutation.isPending ? 'Assigning...' : 'Assign Team'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
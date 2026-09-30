import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  ArrowLeft, Receipt, User, CreditCard, Calendar,
  CheckCircle, Clock, XCircle, RefreshCw, Mail,
  Phone, Hash, Building2, FileText, Globe, ShieldCheck,
  Copy, Check,
} from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { PageLoader } from '../../components/ui/Spinner';
import Avatar from '../../components/ui/Avatar';
import type { Contribution } from '../../types/finance.types';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(date?: string) {
  if (!date) return '—';
  try { return format(new Date(date), 'dd MMM yyyy, h:mm a'); } catch { return '—'; }
}

function fmtDate(date?: string) {
  if (!date) return '—';
  try { return format(new Date(date), 'dd MMM yyyy'); } catch { return '—'; }
}

function fmtCurrency(amount: number, currency = 'NGN') {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency', currency,
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount);
}

function capitalize(str?: string) {
  if (!str) return '—';
  return str.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

const TYPE_LABELS: Record<string, string> = {
  tithe: 'Tithe', sunday_offering: 'Sunday Offering',
  midweek_offering: 'Midweek Offering', special_donation: 'Special Donation',
  building_fund: 'Building Fund', partnership: 'Partnership',
  covenant_seed: 'Covenant Seed', pledge_payment: 'Pledge Payment',
  project_fund: 'Project Fund', missions: 'Missions',
  benevolence: 'Benevolence', thanksgiving: 'Thanksgiving',
  first_fruit: 'First Fruit', other: 'Other',
};

const CHANNEL_COLORS: Record<string, string> = {
  cash: '#22c55e', bank_transfer: '#3b82f6', card: '#8b5cf6',
  mobile_money: '#f59e0b', paystack: '#06b6d4', ussd: '#ec4899',
  cheque: '#94a3b8', flutterwave: '#f97316',
};

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: React.ElementType; label: string }> = {
  successful: { color: '#22c55e', bg: 'rgba(34,197,94,0.12)',   icon: CheckCircle,  label: 'Successful'  },
  pending:    { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  icon: Clock,        label: 'Pending'     },
  failed:     { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   icon: XCircle,      label: 'Failed'      },
  reversed:   { color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', icon: RefreshCw,    label: 'Reversed'    },
};

// ── Reusable sub-components ────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium uppercase tracking-widest text-text-muted">{label}</span>
      <span className="text-sm font-medium text-text-primary">{value ?? '—'}</span>
    </div>
  );
}

function Section({
  icon, title, children,
}: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl p-5 space-y-4"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-border)' }}
    >
      <div
        className="flex items-center gap-2 pb-3"
        style={{ borderBottom: '1px solid var(--bg-border)' }}
      >
        <span style={{ color: '#DAA520' }}>{icon}</span>
        <h3 className="text-xs font-semibold tracking-widest uppercase text-text-secondary">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };
  return (
    <button
      onClick={handleCopy}
      className="ml-1.5 p-0.5 rounded transition-all hover:opacity-70"
      title="Copy"
    >
      {copied
        ? <Check size={12} style={{ color: '#22c55e' }} />
        : <Copy size={12} style={{ color: '#888' }} />}
    </button>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ContributionDetailPage() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc       = useQueryClient();

  const { data: contribution, isLoading, isError } = useQuery<Contribution>({
    queryKey: ['contribution', id],
    queryFn: async () => {
      const res = await api.get(`/finance/contributions/${id}`);
      return res.data.data as Contribution;
    },
    enabled: !!id,
  });

  // Verify / mark successful
  const verifyMutation = useMutation({
    mutationFn: () => api.patch(`/finance/contributions/${id}`, { status: 'successful' }),
    onSuccess: () => {
      toast.success('Contribution verified');
      qc.invalidateQueries({ queryKey: ['contribution', id] });
      qc.invalidateQueries({ queryKey: ['contributions'] });
    },
    onError: () => toast.error('Failed to verify'),
  });

  if (isLoading) return <PageLoader />;

  if (isError || !contribution) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
        <p className="text-text-muted">Contribution not found.</p>
        <button onClick={() => navigate('/finance/contributions')} className="btn-ghost flex items-center gap-2">
          <ArrowLeft size={16} /> Back to Contributions
        </button>
      </div>
    );
  }

  const status     = STATUS_CONFIG[contribution.status] || STATUS_CONFIG.pending;
  const StatusIcon = status.icon;

  const channelColor = CHANNEL_COLORS[contribution.paymentChannel] || '#888';

  const donorName = contribution.memberId
    ? `${contribution.memberId.firstName} ${contribution.memberId.lastName}`
    : contribution.isAnonymous
    ? 'Anonymous Donor'
    : contribution.donorName || 'Guest Donor';

  const isInternational = contribution.currency !== 'NGN';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .detail-section { animation: slideUp 0.35s ease both; }
        .detail-section:nth-child(1) { animation-delay: 0.05s; }
        .detail-section:nth-child(2) { animation-delay: 0.10s; }
        .detail-section:nth-child(3) { animation-delay: 0.15s; }
        .detail-section:nth-child(4) { animation-delay: 0.20s; }
        .detail-section:nth-child(5) { animation-delay: 0.25s; }
        .detail-section:nth-child(6) { animation-delay: 0.30s; }
        .gold-tag {
          display: inline-flex; align-items: center;
          padding: 2px 10px; border-radius: 999px;
          font-size: 11px; font-weight: 600;
          background: rgba(218,165,32,0.12);
          color: #DAA520;
          border: 1px solid rgba(218,165,32,0.25);
        }
        .receipt-bg {
          background: repeating-linear-gradient(
            -45deg,
            transparent,
            transparent 12px,
            rgba(218,165,32,0.02) 12px,
            rgba(218,165,32,0.02) 13px
          );
        }
      `}</style>

      {/* Back */}
      <button
        onClick={() => navigate('/finance/contributions')}
        className="flex items-center gap-2 text-sm hover:opacity-80 transition-opacity"
        style={{ color: 'var(--text-muted)' }}
      >
        <ArrowLeft size={16} /> Back to Contributions
      </button>

      {/* ── Hero Receipt Card ─────────────────────────────────────────────── */}
      <div
        className="detail-section rounded-2xl p-6 receipt-bg"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-border)' }}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">

          {/* Left: donor avatar */}
          <div className="flex items-center gap-4 flex-1">
            {contribution.memberId ? (
              <Avatar
                name={donorName}
                photoUrl={contribution.memberId.photoUrl}
                size="lg"
              />
            ) : (
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0"
                style={{ background: 'rgba(218,165,32,0.12)', color: '#DAA520' }}
              >
                {donorName.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display font-bold text-2xl text-text-primary">{donorName}</h1>
                {contribution.isAnonymous && (
                  <span className="gold-tag">Anonymous</span>
                )}
                {contribution.memberId && (
                  <span
                    className="font-mono text-xs px-2 py-0.5 rounded"
                    style={{ background: 'rgba(218,165,32,0.1)', color: '#DAA520' }}
                  >
                    {contribution.memberId.membershipId}
                  </span>
                )}
              </div>

              {/* Type + Channel */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="gold-tag">{TYPE_LABELS[contribution.contributionType] || contribution.contributionType}</span>
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium"
                  style={{
                    background: `${channelColor}18`,
                    color: channelColor,
                    border: `1px solid ${channelColor}30`,
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: channelColor }} />
                  {capitalize(contribution.paymentChannel)}
                </span>

                {/* Status pill */}
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium"
                  style={{ background: status.bg, color: status.color, border: `1px solid ${status.color}30` }}
                >
                  <StatusIcon size={11} />
                  {status.label}
                </span>
              </div>

              {/* Contact mini-row */}
              <div className="flex flex-wrap gap-4 pt-0.5">
                {contribution.donorEmail && (
                  <span className="flex items-center gap-1.5 text-xs text-text-muted">
                    <Mail size={11} /> {contribution.donorEmail}
                  </span>
                )}
                {contribution.donorPhone && (
                  <span className="flex items-center gap-1.5 text-xs text-text-muted">
                    <Phone size={11} /> {contribution.donorPhone}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: big amount */}
          <div className="text-right flex-shrink-0">
            <p className="text-4xl font-bold font-display" style={{ color: '#22c55e' }}>
              {fmtCurrency(contribution.amount, contribution.currency)}
            </p>
            {isInternational && contribution.amountInNGN && (
              <p className="text-sm text-text-muted mt-1">
                ≈ {fmtCurrency(contribution.amountInNGN)} NGN
                {contribution.exchangeRate && (
                  <span className="ml-1 text-xs">(rate: {contribution.exchangeRate.toLocaleString()})</span>
                )}
              </p>
            )}
            <p className="text-xs text-text-muted mt-1">{fmtDate(contribution.serviceDate)}</p>

            {/* Verify button for pending */}
            {contribution.status === 'pending' && (
              <button
                onClick={() => verifyMutation.mutate()}
                disabled={verifyMutation.isPending}
                className="mt-3 px-4 py-1.5 rounded-xl text-xs font-semibold transition-all hover:shadow-md"
                style={{
                  background: 'rgba(34,197,94,0.15)',
                  color: '#22c55e',
                  border: '1px solid rgba(34,197,94,0.3)',
                }}
              >
                {verifyMutation.isPending ? 'Verifying...' : '✓ Mark as Verified'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Grid ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Receipt & Reference */}
        <div className="detail-section">
          <Section icon={<Receipt size={15} />} title="Receipt & Reference">
            <div className="grid grid-cols-2 gap-4">
              <InfoRow
                label="Receipt No."
                value={
                  <span className="flex items-center font-mono text-gold">
                    {contribution.receiptNumber}
                    <CopyButton value={contribution.receiptNumber} />
                  </span>
                }
              />
              <InfoRow label="Service Date" value={fmtDate(contribution.serviceDate)} />
              {contribution.paymentReference && (
                <InfoRow
                  label="Payment Reference"
                  value={
                    <span className="flex items-center font-mono text-xs text-text-secondary">
                      {contribution.paymentReference}
                      <CopyButton value={contribution.paymentReference} />
                    </span>
                  }
                />
              )}
              {contribution.paystackRef && (
                <InfoRow
                  label="Paystack Ref"
                  value={
                    <span className="flex items-center font-mono text-xs" style={{ color: '#06b6d4' }}>
                      {contribution.paystackRef}
                      <CopyButton value={contribution.paystackRef} />
                    </span>
                  }
                />
              )}
              {contribution.bankName && (
                <InfoRow label="Bank" value={contribution.bankName} />
              )}
              {(contribution as any).chequeNumber && (
                <InfoRow label="Cheque No." value={(contribution as any).chequeNumber} />
              )}
            </div>
          </Section>
        </div>

        {/* Payment Details */}
        <div className="detail-section">
          <Section icon={<CreditCard size={15} />} title="Payment Details">
            <div className="grid grid-cols-2 gap-4">
              <InfoRow
                label="Amount"
                value={
                  <span className="text-emerald-400 font-bold font-display text-base">
                    {fmtCurrency(contribution.amount, contribution.currency)}
                  </span>
                }
              />
              <InfoRow label="Currency" value={
                <span className="flex items-center gap-1.5">
                  {isInternational && <Globe size={12} style={{ color: '#06b6d4' }} />}
                  {contribution.currency}
                </span>
              } />
              {isInternational && contribution.amountInNGN && (
                <>
                  <InfoRow label="Amount (NGN)" value={fmtCurrency(contribution.amountInNGN)} />
                  <InfoRow label="Exchange Rate" value={`1 ${contribution.currency} = ₦${contribution.exchangeRate?.toLocaleString()}`} />
                </>
              )}
              <InfoRow label="Payment Channel" value={
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: channelColor }} />
                  {capitalize(contribution.paymentChannel)}
                </span>
              } />
              <InfoRow label="Contribution Type" value={TYPE_LABELS[contribution.contributionType] || contribution.contributionType} />
            </div>
          </Section>
        </div>

        {/* Donor Information */}
        <div className="detail-section">
          <Section icon={<User size={15} />} title="Donor Information">
            <div className="grid grid-cols-2 gap-4">
              <InfoRow label="Name"  value={donorName} />
              <InfoRow label="Type"  value={contribution.memberId ? 'Church Member' : contribution.isAnonymous ? 'Anonymous' : 'Guest / Non-member'} />
              {contribution.memberId && (
                <InfoRow
                  label="Membership ID"
                  value={
                    <span
                      className="font-mono text-xs cursor-pointer hover:opacity-80"
                      style={{ color: '#DAA520' }}
                      onClick={() => navigate(`/members/${contribution.memberId!._id}`)}
                    >
                      {contribution.memberId.membershipId} ↗
                    </span>
                  }
                />
              )}
              <InfoRow label="Email" value={contribution.donorEmail || '—'} />
              <InfoRow label="Phone" value={contribution.donorPhone || '—'} />
              <InfoRow label="Anonymous" value={contribution.isAnonymous ? 'Yes' : 'No'} />
            </div>
          </Section>
        </div>

        {/* Verification & Audit */}
        <div className="detail-section">
          <Section icon={<ShieldCheck size={15} />} title="Verification & Audit">
            <div className="grid grid-cols-2 gap-4">
              <InfoRow label="Status" value={
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium"
                  style={{ background: status.bg, color: status.color, border: `1px solid ${status.color}30` }}
                >
                  <StatusIcon size={11} />
                  {status.label}
                </span>
              } />
              <InfoRow label="Verified By"  value={(contribution as any).verifiedBy?.email || '—'} />
              <InfoRow label="Verified At"  value={fmt((contribution as any).verifiedAt)} />
              <InfoRow label="Recorded By"  value={(contribution as any).recordedBy?.email || 'Online / Paystack'} />
              <InfoRow label="Acknowledgement Sent" value={
                contribution.acknowledgementSentAt
                  ? <span className="flex items-center gap-1 text-emerald-400"><CheckCircle size={12} /> {fmtDate(contribution.acknowledgementSentAt)}</span>
                  : <span className="text-text-muted">Not sent</span>
              } />
              <InfoRow label="Tax Receipt Sent" value={
                (contribution as any).taxReceiptSentAt
                  ? <span className="flex items-center gap-1 text-emerald-400"><CheckCircle size={12} /> {fmtDate((contribution as any).taxReceiptSentAt)}</span>
                  : <span className="text-text-muted">Not sent</span>
              } />
            </div>
          </Section>
        </div>
      </div>

      {/* ── Linked Pledge ─────────────────────────────────────────────────── */}
      {contribution.pledgeId && (
        <div className="detail-section">
          <Section icon={<Hash size={15} />} title="Linked Pledge">
            <div className="grid grid-cols-3 gap-4">
              <InfoRow label="Total Pledged"  value={fmtCurrency((contribution.pledgeId as any).totalAmount)} />
              <InfoRow label="Total Paid"     value={fmtCurrency((contribution.pledgeId as any).paidAmount)} />
              <InfoRow label="Balance Due"    value={
                <span className="text-red-400 font-semibold">
                  {fmtCurrency(
                    Math.max(0, (contribution.pledgeId as any).totalAmount - (contribution.pledgeId as any).paidAmount)
                  )}
                </span>
              } />
            </div>
            {/* Progress */}
            <div className="space-y-1.5 mt-2">
              <div className="flex items-center justify-between text-xs text-text-muted">
                <span>Pledge fulfilment</span>
                <span>
                  {Math.min(100, Math.round(
                    ((contribution.pledgeId as any).paidAmount / (contribution.pledgeId as any).totalAmount) * 100
                  ))}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-bg-hover overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(100, Math.round(
                      ((contribution.pledgeId as any).paidAmount / (contribution.pledgeId as any).totalAmount) * 100
                    ))}%`,
                    background: '#DAA520',
                  }}
                />
              </div>
            </div>
          </Section>
        </div>
      )}

      {/* ── Linked Project ─────────────────────────────────────────────────── */}
      {contribution.projectId && (
        <div className="detail-section">
          <Section icon={<Building2 size={15} />} title="Linked Project / Fund">
            <div className="grid grid-cols-3 gap-4">
              <InfoRow label="Project" value={
                <span className="font-medium text-text-primary">{(contribution.projectId as any).name}</span>
              } />
              <InfoRow label="Code" value={
                <span className="font-mono text-gold text-xs">{(contribution.projectId as any).code}</span>
              } />
              {(contribution.projectId as any).targetAmount && (
                <InfoRow label="Project Target" value={fmtCurrency((contribution.projectId as any).targetAmount)} />
              )}
            </div>
          </Section>
        </div>
      )}

      {/* ── Notes ─────────────────────────────────────────────────────────── */}
      {(contribution.notes || (contribution as any).internalNotes) && (
        <div className="detail-section">
          <Section icon={<FileText size={15} />} title="Notes">
            <div className="space-y-3">
              {contribution.notes && (
                <div>
                  <p className="text-xs text-text-muted uppercase tracking-widest mb-1">Public Note</p>
                  <p
                    className="text-sm text-text-primary px-4 py-3 rounded-xl"
                    style={{
                      borderLeft: '3px solid rgba(218,165,32,0.4)',
                      background: 'rgba(218,165,32,0.04)',
                      borderRadius: '0 8px 8px 0',
                    }}
                  >
                    {contribution.notes}
                  </p>
                </div>
              )}
              {(contribution as any).internalNotes && (
                <div>
                  <p className="text-xs text-text-muted uppercase tracking-widest mb-1">Internal Note</p>
                  <p
                    className="text-sm text-text-primary px-4 py-3 rounded-xl"
                    style={{
                      borderLeft: '3px solid rgba(239,68,68,0.4)',
                      background: 'rgba(239,68,68,0.04)',
                      borderRadius: '0 8px 8px 0',
                    }}
                  >
                    {(contribution as any).internalNotes}
                  </p>
                </div>
              )}
            </div>
          </Section>
        </div>
      )}

      {/* ── Meta ──────────────────────────────────────────────────────────── */}
      <div
        className="detail-section rounded-2xl px-5 py-3 flex flex-wrap gap-6"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-border)' }}
      >
        <InfoRow label="Created"      value={fmt(contribution.createdAt)} />
        <InfoRow label="Last Updated" value={fmt(contribution.updatedAt)} />
        {contribution.memberId && (
          <div className="ml-auto">
            <button
              onClick={() => navigate(`/members/${contribution.memberId!._id}`)}
              className="text-xs px-3 py-1.5 rounded-xl transition-all hover:shadow-md font-medium"
              style={{
                background: 'rgba(218,165,32,0.1)',
                color: '#DAA520',
                border: '1px solid rgba(218,165,32,0.2)',
              }}
            >
              View Member Profile ↗
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
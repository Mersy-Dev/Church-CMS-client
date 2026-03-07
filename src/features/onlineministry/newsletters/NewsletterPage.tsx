/**
 * ChurchOS — src/features/onlineMinistry/newsletter/NewsletterPage.tsx
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Plus, Mail, Send, Trash2, Eye } from 'lucide-react';
import { newsletterApi } from '../../../lib/onlineministry.api';
import Modal from '../../../components/ui/Modal';
import { PageLoader } from '../../../components/ui/Spinner';
import EmptyState from '../../../components/ui/EmptyState';
import type {
  Newsletter,
  NewsletterFormData,
  NewsletterStatus,
  NewsletterSubscriber,
} from '../../../types/onlineministry.types';

// ─── Constants ────────────────────────────────────────────────────────────────

const NL_STATUS_COLORS: Record<NewsletterStatus, { bg: string; text: string }> = {
  draft:     { bg: 'rgba(107,114,128,0.12)', text: '#9ca3af' },
  scheduled: { bg: 'rgba(99,102,241,0.12)',  text: '#818cf8' },
  sent:      { bg: 'rgba(16,185,129,0.12)',  text: '#34d399' },
};

// ─── Create / Edit Form ───────────────────────────────────────────────────────

function NewsletterForm({
  newsletter,
  onSuccess,
  onCancel,
}: {
  newsletter?: Newsletter;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NewsletterFormData>({
    defaultValues: {
      subject:      newsletter?.subject      ?? '',
      previewText:  newsletter?.previewText  ?? '',
      htmlBody:     newsletter?.htmlBody     ?? '',
      plainTextBody: newsletter?.plainTextBody ?? '',
      scheduledAt:  newsletter?.scheduledAt?.slice(0, 16) ?? '',
      tags:         newsletter?.tags         ?? [],
    },
  });

  const mutation = useMutation({
    mutationFn: (data: NewsletterFormData) =>
      newsletter
        ? newsletterApi.updateCampaign(newsletter._id, data)
        : newsletterApi.createCampaign(data),
    onSuccess: () => {
      toast.success(newsletter ? 'Newsletter updated' : 'Draft created');
      onSuccess();
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || 'Failed to save newsletter'),
  });

  return (
    <form
      onSubmit={handleSubmit((d) => mutation.mutate({ ...d, tags: [] }))}
      className="space-y-4"
    >
      {/* Subject */}
      <div>
        <label className="label">Subject *</label>
        <input
          className="input w-full"
          {...register('subject', { required: 'Subject is required' })}
          placeholder="This Week at Church — Don't Miss Out!"
        />
        {errors.subject && (
          <p className="text-red-400 text-xs mt-1">{errors.subject.message}</p>
        )}
      </div>

      {/* Preview Text */}
      <div>
        <label className="label">Preview Text</label>
        <input
          className="input w-full"
          {...register('previewText')}
          placeholder="A short line shown in the inbox before the email is opened..."
        />
      </div>

      {/* HTML Body */}
      <div>
        <label className="label">Email Body (HTML) *</label>
        <textarea
          className="input w-full font-mono text-xs"
          rows={10}
          {...register('htmlBody', { required: 'Email body is required' })}
          placeholder={'<p>Dear {{firstName}},</p>\n<p>Here\'s what\'s happening this week...</p>'}
        />
        {errors.htmlBody && (
          <p className="text-red-400 text-xs mt-1">{errors.htmlBody.message}</p>
        )}
      </div>

      {/* Plain text fallback */}
      <div>
        <label className="label">Plain Text Fallback</label>
        <textarea
          className="input w-full text-xs"
          rows={3}
          {...register('plainTextBody')}
          placeholder="Plain text version for email clients that don't support HTML..."
        />
      </div>

      {/* Schedule */}
      <div>
        <label className="label">Schedule Send At (leave blank to save as draft)</label>
        <input
          type="datetime-local"
          className="input w-full"
          {...register('scheduledAt')}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-bg-border">
        <button type="button" onClick={onCancel} className="btn-ghost">Cancel</button>
        <button type="submit" disabled={mutation.isPending} className="btn-gold">
          {mutation.isPending ? 'Saving...' : newsletter ? 'Update Draft' : 'Create Draft'}
        </button>
      </div>
    </form>
  );
}

// ─── Preview Modal ────────────────────────────────────────────────────────────

function PreviewModal({
  newsletter,
  onClose,
}: {
  newsletter: Newsletter;
  onClose: () => void;
}) {
  return (
    <Modal isOpen title="Email Preview" onClose={onClose} size="lg">
      <div className="space-y-3">
        <div className="rounded-xl p-3" style={{ background: 'var(--bg-hover)', border: '1px solid var(--bg-border)' }}>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Subject</p>
          <p className="font-medium text-sm mt-0.5" style={{ color: 'var(--text-primary)' }}>{newsletter.subject}</p>
          {newsletter.previewText && (
            <>
              <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Preview</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{newsletter.previewText}</p>
            </>
          )}
        </div>
        <div
          className="rounded-xl p-4 prose prose-invert max-w-none text-sm overflow-auto max-h-96"
          style={{ background: '#fff', color: '#111' }}
          dangerouslySetInnerHTML={{ __html: newsletter.htmlBody }}
        />
        <div className="flex justify-end pt-2">
          <button onClick={onClose} className="btn-ghost">Close</button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function NewsletterPage() {
  const qc = useQueryClient();

  // Tabs
  const [tab, setTab] = useState<'campaigns' | 'subscribers'>('campaigns');

  // Modals
  const [showCreate, setShowCreate]     = useState(false);
  const [editing, setEditing]           = useState<Newsletter | null>(null);
  const [previewing, setPreviewing]     = useState<Newsletter | null>(null);
  const [sendConfirm, setSendConfirm]   = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // ── Campaigns ──────────────────────────────────────────────────────────────
  const { data: campaignData, isLoading: campLoading } = useQuery({
    queryKey: ['newsletter-campaigns'],
    queryFn: async () => {
      const res = await newsletterApi.getCampaigns({ limit: 50 });
      return {
        campaigns: res.data.data as Newsletter[],
        total: res.data.pagination?.total,
      };
    },
    enabled: tab === 'campaigns',
  });

  const sendMutation = useMutation({
    mutationFn: (id: string) => newsletterApi.sendCampaign(id),
    onSuccess: () => {
      toast.success('Newsletter dispatched to all active subscribers!');
      qc.invalidateQueries({ queryKey: ['newsletter-campaigns'] });
      setSendConfirm(null);
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || 'Failed to send newsletter'),
  });

  const deleteCampaignMutation = useMutation({
    mutationFn: (id: string) => newsletterApi.deleteCampaign(id),
    onSuccess: () => {
      toast.success('Newsletter deleted');
      qc.invalidateQueries({ queryKey: ['newsletter-campaigns'] });
      setDeleteConfirm(null);
    },
    onError: () => toast.error('Failed to delete newsletter'),
  });

  // ── Subscribers ────────────────────────────────────────────────────────────
  const { data: subData, isLoading: subLoading } = useQuery({
    queryKey: ['newsletter-subscribers'],
    queryFn: async () => {
      const res = await newsletterApi.getSubscribers({ limit: 100 });
      return {
        subscribers: res.data.data as NewsletterSubscriber[],
        total: res.data.pagination?.total,
      };
    },
    enabled: tab === 'subscribers',
  });

  const campaigns    = campaignData?.campaigns ?? [];
  const subscribers  = subData?.subscribers ?? [];

  return (
    <div className="space-y-5">
      <style>{`
        .table-row { transition: background-color 0.2s ease; }
        .table-row:hover { background-color: rgba(218, 165, 32, 0.03); }
        .fade-in { animation: fadeInRow 0.3s ease-out; }
        @keyframes fadeInRow {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-3xl" style={{ color: 'var(--text-primary)' }}>
            Newsletter
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Email campaigns &amp; subscriber list
          </p>
        </div>
        {tab === 'campaigns' && (
          <button
            onClick={() => setShowCreate(true)}
            className="btn-gold flex items-center gap-2"
          >
            <Plus size={16} /> New Campaign
          </button>
        )}
      </div>

      {/* Tabs */}
      <div
        className="flex gap-1 p-1 rounded-xl w-fit"
        style={{ background: 'var(--bg-hover)' }}
      >
        {(['campaigns', 'subscribers'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200"
            style={
              tab === t
                ? {
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  }
                : { color: 'var(--text-muted)' }
            }
          >
            {t === 'campaigns'
              ? `Campaigns${campaignData?.total ? ` (${campaignData.total})` : ''}`
              : `Subscribers${subData?.total ? ` (${subData.total})` : ''}`}
          </button>
        ))}
      </div>

      {/* ── CAMPAIGNS TAB ── */}
      {tab === 'campaigns' && (
        <div className="card overflow-hidden">
          {campLoading ? (
            <PageLoader />
          ) : campaigns.length === 0 ? (
            <EmptyState
              icon="📧"
              title="No campaigns yet"
              description="Create your first email newsletter campaign"
              action={
                <button onClick={() => setShowCreate(true)} className="btn-gold">
                  New Campaign
                </button>
              }
            />
          ) : (
            <table className="w-full">
              <thead className="bg-bg-hover/50 border-b border-bg-border">
                <tr>
                  {['Subject', 'Status', 'Recipients', 'Opens', 'Sent Date', 'Actions'].map((h) => (
                    <th key={h} className="table-header text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {campaigns.map((n) => {
                  const sc = NL_STATUS_COLORS[n.status];
                  return (
                    <tr key={n._id} className="table-row fade-in">
                      {/* Subject */}
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: 'rgba(245,158,11,0.12)' }}
                          >
                            <Mail size={14} style={{ color: '#f59e0b' }} />
                          </div>
                          <div>
                            <p
                              className="font-medium text-sm"
                              style={{ color: 'var(--text-primary)' }}
                            >
                              {n.subject}
                            </p>
                            {n.previewText && (
                              <p
                                className="text-xs truncate max-w-xs"
                                style={{ color: 'var(--text-muted)' }}
                              >
                                {n.previewText}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="table-cell">
                        <span
                          className="text-xs font-semibold px-2 py-1 rounded-full capitalize"
                          style={{ background: sc.bg, color: sc.text }}
                        >
                          {n.status}
                        </span>
                      </td>

                      {/* Recipients */}
                      <td
                        className="table-cell font-mono text-sm"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {n.recipientCount.toLocaleString()}
                      </td>

                      {/* Opens */}
                      <td
                        className="table-cell font-mono text-sm"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {n.openCount > 0
                          ? `${n.openCount} (${Math.round((n.openCount / (n.recipientCount || 1)) * 100)}%)`
                          : '—'}
                      </td>

                      {/* Sent Date */}
                      <td
                        className="table-cell text-xs"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {n.sentAt
                          ? format(new Date(n.sentAt), 'dd MMM yyyy · h:mm a')
                          : n.scheduledAt
                          ? `Scheduled: ${format(new Date(n.scheduledAt), 'dd MMM yyyy')}`
                          : '—'}
                      </td>

                      {/* Actions */}
                      <td className="table-cell">
                        <div className="flex items-center gap-1">
                          {/* Preview */}
                          <button
                            onClick={() => setPreviewing(n)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-blue-500/15 hover:text-blue-400 text-text-muted transition-all"
                            title="Preview"
                          >
                            <Eye size={13} />
                          </button>

                          {/* Edit — only drafts */}
                          {n.status !== 'sent' && (
                            <button
                              onClick={() => setEditing(n)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gold/15 hover:text-gold text-text-muted transition-all"
                              title="Edit"
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            </button>
                          )}

                          {/* Send — only drafts / scheduled */}
                          {n.status !== 'sent' && (
                            <button
                              onClick={() => setSendConfirm(n._id)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-green-500/15 hover:text-green-400 text-text-muted transition-all"
                              title="Send now"
                            >
                              <Send size={13} />
                            </button>
                          )}

                          {/* Delete — only drafts / scheduled */}
                          {n.status !== 'sent' && (
                            <button
                              onClick={() => setDeleteConfirm(n._id)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-500/15 hover:text-red-400 text-text-muted transition-all"
                              title="Delete"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── SUBSCRIBERS TAB ── */}
      {tab === 'subscribers' && (
        <div className="card overflow-hidden">
          {subLoading ? (
            <PageLoader />
          ) : subscribers.length === 0 ? (
            <EmptyState
              icon="📬"
              title="No subscribers yet"
              description="People who subscribe via your online forms will appear here"
            />
          ) : (
            <table className="w-full">
              <thead className="bg-bg-hover/50 border-b border-bg-border">
                <tr>
                  {['Email', 'Name', 'Source', 'Tags', 'Status', 'Subscribed'].map((h) => (
                    <th key={h} className="table-header text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {subscribers.map((s) => (
                  <tr key={s._id} className="table-row fade-in">
                    {/* Email */}
                    <td className="table-cell font-mono text-xs" style={{ color: 'var(--text-primary)' }}>
                      {s.email}
                    </td>

                    {/* Name */}
                    <td className="table-cell text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {[s.firstName, s.lastName].filter(Boolean).join(' ') || '—'}
                    </td>

                    {/* Source */}
                    <td className="table-cell">
                      <span
                        className="text-xs capitalize px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(14,165,233,0.1)', color: '#38bdf8' }}
                      >
                        {s.source.replace('_', ' ')}
                      </span>
                    </td>

                    {/* Tags */}
                    <td className="table-cell">
                      {s.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {s.tags.map((tag, i) => (
                            <span
                              key={i}
                              className="text-xs px-1.5 py-0.5 rounded"
                              style={{ background: 'rgba(218,165,32,0.1)', color: '#DAA520' }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="table-cell">
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${
                          s.status === 'active'
                            ? 'bg-green-500/10 text-green-400'
                            : s.status === 'bounced'
                            ? 'bg-red-500/10 text-red-400'
                            : 'bg-gray-500/10 text-gray-400'
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>

                    {/* Subscribed */}
                    <td className="table-cell text-xs" style={{ color: 'var(--text-muted)' }}>
                      {format(new Date(s.subscribedAt), 'dd MMM yyyy')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── MODALS ── */}

      {/* Create */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Newsletter Campaign" size="lg">
        <NewsletterForm
          onSuccess={() => { setShowCreate(false); qc.invalidateQueries({ queryKey: ['newsletter-campaigns'] }); }}
          onCancel={() => setShowCreate(false)}
        />
      </Modal>

      {/* Edit */}
      {editing && (
        <Modal isOpen={!!editing} onClose={() => setEditing(null)} title="Edit Newsletter" size="lg">
          <NewsletterForm
            newsletter={editing}
            onSuccess={() => { setEditing(null); qc.invalidateQueries({ queryKey: ['newsletter-campaigns'] }); }}
            onCancel={() => setEditing(null)}
          />
        </Modal>
      )}

      {/* Preview */}
      {previewing && (
        <PreviewModal newsletter={previewing} onClose={() => setPreviewing(null)} />
      )}

      {/* Send Confirm */}
      <Modal isOpen={!!sendConfirm} onClose={() => setSendConfirm(null)} title="Send Newsletter" size="sm">
        <p className="text-text-secondary mb-5">
          Send this newsletter to all active subscribers right now? This cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setSendConfirm(null)} className="btn-ghost">Cancel</button>
          <button
            onClick={() => sendConfirm && sendMutation.mutate(sendConfirm)}
            className="btn-gold"
            disabled={sendMutation.isPending}
          >
            {sendMutation.isPending ? 'Sending...' : 'Send Now'}
          </button>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Newsletter" size="sm">
        <p className="text-text-secondary mb-5">
          Permanently delete this newsletter draft? This cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setDeleteConfirm(null)} className="btn-ghost">Cancel</button>
          <button
            onClick={() => deleteConfirm && deleteCampaignMutation.mutate(deleteConfirm)}
            className="btn-danger"
            disabled={deleteCampaignMutation.isPending}
          >
            {deleteCampaignMutation.isPending ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
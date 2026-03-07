/**
 * ChurchOS — src/features/welfare/WelfarePage.tsx
 * Module 12 — Welfare & Care (Pastoral)
 * Main list page with category tabs, stats cards, and record table.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Trash2, Heart, DollarSign, HandHeart, Users, Calendar, Activity } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import Modal from '../../components/ui/Modal';
import SearchInput from '../../components/ui/SearchInput';
import { PageLoader } from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import AddWelfareForm from './AddWelfareForm';
import type { WelfareRecord, WelfareCategory, WelfareStats } from '../../types/welfare.types';
import {
  WELFARE_CATEGORY_LABELS,
  WELFARE_CATEGORY_ICONS,
  WELFARE_STATUS_COLORS,
} from '../../types/welfare.types';

// ─── Tab definition ──────────────────────────────────────────────────────────

type TabKey = 'all' | WelfareCategory;

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'all',                 label: 'All Records',   icon: '📋' },
  { key: 'sick_hospital',       label: 'Sick/Hospital', icon: '🏥' },
  { key: 'financial_assistance',label: 'Financial',     icon: '💰' },
  { key: 'prayer_request',      label: 'Prayer',        icon: '🙏' },
  { key: 'counselling',         label: 'Counselling',   icon: '🧠' },
  { key: 'bereavement',         label: 'Bereavement',   icon: '🕊️' },
  { key: 'visit',               label: 'Visits',        icon: '🏠' },
  { key: 'disbursement',        label: 'Disbursements', icon: '💸' },
];

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label, value, icon, accent, sub,
}: {
  label: string; value: string | number; icon: React.ReactNode;
  accent: string; sub?: string;
}) {
  return (
    <div
      className="rounded-2xl p-4 flex items-start gap-3"
      style={{
        background: 'var(--bg-card, rgba(255,255,255,0.04))',
        border: '1px solid var(--bg-border, rgba(255,255,255,0.08))',
      }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${accent}18`, color: accent }}
      >
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold font-display" style={{ color: 'var(--text-primary, #fff)' }}>
          {value}
        </p>
        <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--text-muted, #888)' }}>{label}</p>
        {sub && <p className="text-xs mt-0.5" style={{ color: accent }}>{sub}</p>}
      </div>
    </div>
  );
}

// ─── Status Pill ─────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: string }) {
  const color = WELFARE_STATUS_COLORS[status as keyof typeof WELFARE_STATUS_COLORS] || '#888';
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

// ─── Category Badge ───────────────────────────────────────────────────────────

function CategoryBadge({ category }: { category: WelfareCategory }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--text-secondary, #ccc)' }}>
      <span>{WELFARE_CATEGORY_ICONS[category]}</span>
      <span>{WELFARE_CATEGORY_LABELS[category]}</span>
    </span>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function WelfarePage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [hoveringAction, setHoveringAction] = useState<string | null>(null);

  // ── Stats ──
  const { data: stats } = useQuery<WelfareStats>({
    queryKey: ['welfare-stats'],
    queryFn: async () => {
      const res = await api.get('/welfare/stats');
      return res.data.data as WelfareStats;
    },
  });

  // ── Records ──
  const { data, isLoading } = useQuery({
    queryKey: ['welfare', activeTab, search, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (activeTab !== 'all') params.set('category', activeTab);
      if (statusFilter) params.set('status', statusFilter);
      params.set('limit', '50');
      const res = await api.get(`/welfare?${params}`);
      return {
        records: res.data.data as WelfareRecord[],
        total: res.data.pagination?.total ?? res.data.data?.length,
      };
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/welfare/${id}`),
    onSuccess: () => {
      toast.success('Welfare record archived');
      qc.invalidateQueries({ queryKey: ['welfare'] });
      qc.invalidateQueries({ queryKey: ['welfare-stats'] });
      setDeleting(null);
    },
    onError: () => toast.error('Failed to archive record'),
  });

  const records = data?.records ?? [];

  // ── Inline search filter (client-side on returned data) ──
  const filtered = search
    ? records.filter((r) => {
        const m = typeof r.memberId === 'object' ? r.memberId : null;
        const name = m ? `${m.firstName} ${m.lastName}`.toLowerCase() : '';
        const id = m?.membershipId?.toLowerCase() || '';
        const title = r.title.toLowerCase();
        const q = search.toLowerCase();
        return name.includes(q) || id.includes(q) || title.includes(q);
      })
    : records;

  return (
    <div className="space-y-5">
      <style>{`
        .wf-tab {
          display: flex; align-items: center; gap: 6px;
          padding: 8px 14px; border-radius: 10px;
          font-size: 13px; font-weight: 500; cursor: pointer; white-space: nowrap;
          transition: all 0.2s ease; border: 1px solid transparent;
          color: var(--text-muted, #888); background: transparent;
        }
        .wf-tab:hover { color: var(--text-primary, #fff); background: rgba(255,255,255,0.04); }
        .wf-tab.active {
          color: #DAA520; background: rgba(218,165,32,0.1);
          border-color: rgba(218,165,32,0.25);
        }
        .wf-row { transition: background-color 0.2s ease; }
        .wf-row:hover { background-color: rgba(218,165,32,0.03); }
        .fade-in { animation: fadeInRow 0.3s ease-out; }
        @keyframes fadeInRow { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        .action-btn { transition: all 0.25s cubic-bezier(0.23,1,0.32,1); }
        .action-btn:hover { transform: translateY(-2px); }
        .fund-bar-bg { background: rgba(255,255,255,0.06); border-radius: 999px; height: 6px; overflow: hidden; }
        .fund-bar-fill { height: 100%; border-radius: 999px; background: linear-gradient(90deg, #DAA520, #f59e0b); transition: width 0.8s ease; }
      `}</style>

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-3xl text-text-primary">Welfare & Care</h1>
          <p className="text-text-muted text-sm mt-0.5">
            Pastoral support — {data?.total ?? 0} total record{data?.total !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="btn-gold flex items-center gap-2 hover:shadow-lg transition-shadow"
        >
          <Plus size={16} /> New Record
        </button>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          label="Open Cases"
          value={stats?.openRecords ?? '—'}
          icon={<Activity size={18} />}
          accent="#f59e0b"
          sub="Needs attention"
        />
        <StatCard
          label="This Month"
          value={stats?.newThisMonth ?? '—'}
          icon={<Heart size={18} />}
          accent="#ec4899"
        />
        <StatCard
          label="Financial Pending"
          value={stats?.pendingFinancialRequests ?? '—'}
          icon={<DollarSign size={18} />}
          accent="#DAA520"
          sub="Awaiting approval"
        />
        <StatCard
          label="Prayer Requests"
          value={stats?.unansweredPrayerRequests ?? '—'}
          icon={<HandHeart size={18} />}
          accent="#8b5cf6"
          sub="Unanswered"
        />
        <StatCard
          label="Upcoming Visits"
          value={stats?.upcomingVisits ?? '—'}
          icon={<Calendar size={18} />}
          accent="#3b82f6"
        />
        <StatCard
          label="Total Records"
          value={stats?.totalRecords ?? '—'}
          icon={<Users size={18} />}
          accent="#10b981"
        />
      </div>

      {/* ── Fund Bar (if available) ── */}
      {stats?.latestFund && (
        <div
          className="rounded-2xl p-4"
          style={{
            background: 'var(--bg-card, rgba(255,255,255,0.04))',
            border: '1px solid rgba(218,165,32,0.15)',
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary, #fff)' }}>
              💰 Welfare Fund — {stats.latestFund.period}
            </p>
            <div className="flex gap-4 text-xs">
              <span style={{ color: 'var(--text-muted)' }}>
                Budget: <strong style={{ color: '#DAA520' }}>
                  {stats.latestFund.currency} {stats.latestFund.totalBudget.toLocaleString()}
                </strong>
              </span>
              <span style={{ color: 'var(--text-muted)' }}>
                Disbursed: <strong style={{ color: '#ef4444' }}>
                  {stats.latestFund.currency} {stats.latestFund.totalDisbursed.toLocaleString()}
                </strong>
              </span>
              <span style={{ color: 'var(--text-muted)' }}>
                Balance: <strong style={{ color: '#10b981' }}>
                  {stats.latestFund.currency} {stats.latestFund.balance.toLocaleString()}
                </strong>
              </span>
            </div>
          </div>
          <div className="fund-bar-bg">
            <div
              className="fund-bar-fill"
              style={{
                width: `${Math.min(100, (stats.latestFund.totalDisbursed / stats.latestFund.totalBudget) * 100)}%`,
                background: stats.latestFund.balance < stats.latestFund.totalBudget * 0.2
                  ? 'linear-gradient(90deg, #ef4444, #f97316)'
                  : 'linear-gradient(90deg, #DAA520, #f59e0b)',
              }}
            />
          </div>
        </div>
      )}

      {/* ── Category Tabs ── */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`wf-tab ${activeTab === tab.key ? 'active' : ''}`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            {tab.key !== 'all' && stats?.byCategory?.[tab.key as WelfareCategory] ? (
              <span
                className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                style={{
                  background: activeTab === tab.key ? 'rgba(218,165,32,0.2)' : 'rgba(255,255,255,0.06)',
                  color: activeTab === tab.key ? '#DAA520' : 'var(--text-muted)',
                }}
              >
                {stats.byCategory[tab.key as WelfareCategory]}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="flex items-center gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by member, title..."
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input w-auto"
        >
          <option value="">All Status</option>
          {['open', 'in_progress', 'resolved', 'closed', 'cancelled'].map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
            </option>
          ))}
        </select>
      </div>

      {/* ── Table ── */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <PageLoader />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="🤝"
            title="No welfare records found"
            description="Start by creating a welfare record for a member"
            action={
              <button onClick={() => setShowAdd(true)} className="btn-gold">
                New Record
              </button>
            }
          />
        ) : (
          <table className="w-full">
            <thead className="bg-bg-hover/50 border-b border-bg-border">
              <tr>
                {['Member', 'Category', 'Title', 'Status', 'Assigned To', 'Date', 'Actions'].map((h) => (
                  <th key={h} className="table-header text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((record) => {
                const member = typeof record.memberId === 'object' ? record.memberId : null;
                const assignee = typeof record.assignedTo === 'object' ? record.assignedTo : null;

                return (
                  <tr key={record._id} className="wf-row fade-in">

                    {/* Member */}
                    <td className="table-cell">
                      {member ? (
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                            style={{ background: 'rgba(218,165,32,0.15)', color: '#DAA520' }}
                          >
                            {member.firstName[0]}{member.lastName[0]}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-text-primary">
                              {member.firstName} {member.lastName}
                            </p>
                            <p className="text-xs text-text-muted font-mono">{member.membershipId}</p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-text-muted">—</span>
                      )}
                    </td>

                    {/* Category */}
                    <td className="table-cell">
                      <CategoryBadge category={record.category} />
                    </td>

                    {/* Title */}
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-text-primary max-w-[180px] truncate">{record.title}</p>
                        {record.isConfidential && (
                          <span
                            className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                            style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}
                          >
                            CONF
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="table-cell">
                      <StatusPill status={record.status} />
                    </td>

                    {/* Assigned To */}
                    <td className="table-cell text-text-muted text-xs">
                      {assignee ? assignee.email : '—'}
                    </td>

                    {/* Date */}
                    <td className="table-cell text-text-muted text-xs">
                      {format(new Date(record.createdAt), 'dd MMM yyyy')}
                    </td>

                    {/* Actions */}
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <button
                          onMouseEnter={() => setHoveringAction(`view-${record._id}`)}
                          onMouseLeave={() => setHoveringAction(null)}
                          onClick={() => navigate(`/welfare/${record._id}`)}
                          className={`action-btn w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-300 ${
                            hoveringAction === `view-${record._id}`
                              ? 'bg-blue-500/20 text-blue-400 shadow-md shadow-blue-500/20'
                              : 'text-text-muted hover:text-blue-400'
                          }`}
                          title="View record"
                        >
                          <Eye size={15} strokeWidth={2.2} />
                        </button>

                        <button
                          onMouseEnter={() => setHoveringAction(`del-${record._id}`)}
                          onMouseLeave={() => setHoveringAction(null)}
                          onClick={() => setDeleting(record._id)}
                          className={`action-btn w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-300 ${
                            hoveringAction === `del-${record._id}`
                              ? 'bg-red-500/20 text-red-400 shadow-md shadow-red-500/20'
                              : 'text-text-muted hover:text-red-400'
                          }`}
                          title="Archive record"
                        >
                          <Trash2 size={15} strokeWidth={2.2} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Add Modal ── */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="New Welfare Record" size="lg">
        <AddWelfareForm
          onSuccess={() => {
            setShowAdd(false);
            qc.invalidateQueries({ queryKey: ['welfare'] });
            qc.invalidateQueries({ queryKey: ['welfare-stats'] });
          }}
          onCancel={() => setShowAdd(false)}
        />
      </Modal>

      {/* ── Delete Confirm ── */}
      <Modal isOpen={!!deleting} onClose={() => setDeleting(null)} title="Archive Welfare Record" size="sm">
        <p className="text-text-secondary mb-5">
          This record will be archived and removed from the active list. You can still access it through reports.
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setDeleting(null)} className="btn-ghost">Cancel</button>
          <button
            onClick={() => deleting && deleteMutation.mutate(deleting)}
            className="btn-danger"
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Archiving...' : 'Archive'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
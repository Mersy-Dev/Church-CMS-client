import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, CartesianGrid,
} from 'recharts';
import {
  TrendingUp, TrendingDown, DollarSign, Users, Target,
  FileText, Download, Search, Layers, CreditCard,
  ArrowUpRight, ArrowDownRight, Calendar, Globe,
} from 'lucide-react';
import { format, startOfYear, endOfMonth, startOfMonth, subMonths, endOfDay } from 'date-fns';
import api from '../../lib/api';
import { PageLoader } from '../../components/ui/Spinner';
import type { FinancialSummary, MemberGivingHistory } from '../../types/finance.types';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtShort(amount: number) {
  if (amount >= 1_000_000) return `₦${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000)     return `₦${(amount / 1_000).toFixed(0)}k`;
  return `₦${amount.toFixed(0)}`;
}

function fmtFull(amount: number, currency = 'NGN') {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency', currency,
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount);
}

function fmtDate(date?: string) {
  if (!date) return '—';
  try { return format(new Date(date), 'dd MMM yyyy'); } catch { return '—'; }
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

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const PALETTE = ['#DAA520','#3b82f6','#22c55e','#8b5cf6','#f59e0b','#ec4899','#06b6d4','#ef4444','#84cc16','#a78bfa'];

const CHANNEL_COLORS: Record<string, string> = {
  cash: '#22c55e', bank_transfer: '#3b82f6', card: '#8b5cf6',
  mobile_money: '#f59e0b', paystack: '#06b6d4', ussd: '#ec4899',
  cheque: '#94a3b8', flutterwave: '#f97316',
};

const TT = {
  contentStyle: { background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, fontSize: 12 },
  labelStyle:   { color: '#DAA520', fontWeight: 600 },
  cursor:       { fill: 'rgba(218,165,32,0.05)' },
};

// ── Sub-components ────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, icon: Icon, color, trend }: {
  label: string; value: string; sub?: string;
  icon: React.ElementType; color: string; trend?: 'up' | 'down';
}) {
  return (
    <div className="rounded-2xl p-5 relative overflow-hidden flex flex-col gap-3"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-border)' }}>
      <div className="absolute -top-5 -right-5 w-20 h-20 rounded-full opacity-[0.07] blur-md" style={{ background: color }} />
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest text-text-muted">{label}</span>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
          <Icon size={14} style={{ color }} />
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold font-display text-text-primary">{value}</p>
        {sub && (
          <p className="text-xs text-text-muted mt-0.5 flex items-center gap-1">
            {trend === 'up'   && <ArrowUpRight  size={11} className="text-emerald-400" />}
            {trend === 'down' && <ArrowDownRight size={11} className="text-red-400" />}
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

function Card({ title, icon: Icon, children, right }: {
  title: string; icon: React.ElementType;
  children: React.ReactNode; right?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-border)' }}>
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--bg-border)' }}>
        <div className="flex items-center gap-2">
          <Icon size={14} style={{ color: '#DAA520' }} />
          <h3 className="text-xs font-semibold uppercase tracking-widest text-text-secondary">{title}</h3>
        </div>
        {right}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function FinanceReportsPage() {
  const today = new Date();

  const [startDate, setStartDate] = useState(format(startOfYear(today), 'yyyy-MM-dd'));
  const [endDate,   setEndDate]   = useState(format(today, 'yyyy-MM-dd'));

  // When sending to backend, endDate must include full day (23:59:59)
  // so contributions recorded anytime today are included
  const endDateEOD = endDate ? new Date(endDate + 'T23:59:59.999Z').toISOString() : '';
  const startDateSOD = startDate ? new Date(startDate + 'T00:00:00.000Z').toISOString() : '';
  const [memberSearch,   setMemberSearch]   = useState('');
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [memberYear,     setMemberYear]     = useState(String(today.getFullYear()));
  const [showList,       setShowList]       = useState(false);

  // Main summary
  const { data: summary, isLoading } = useQuery<FinancialSummary>({
    queryKey: ['finance-summary', startDate, endDate],
    queryFn: async () =>
      (await api.get(`/finance/reports/summary?startDate=${startDateSOD}&endDate=${endDateEOD}`)).data.data,
  });

  // Previous period for delta
  const durMs    = new Date(endDate).getTime() - new Date(startDate).getTime();
  const prevEnd  = new Date(new Date(startDate).getTime() - 1);
  const prevStart= new Date(prevEnd.getTime() - durMs);
  const prevEndEOD   = prevEnd.toISOString();
  const prevStartSOD = new Date(prevStart.toISOString().split('T')[0] + 'T00:00:00.000Z').toISOString();

  const { data: prev } = useQuery<FinancialSummary>({
    queryKey: ['finance-summary-prev', prevStart.toISOString()],
    enabled: !!(startDate && endDate),
    queryFn: async () =>
      (await api.get(`/finance/reports/summary?startDate=${prevStartSOD}&endDate=${prevEndEOD}`)).data.data,
  });

  // Dashboard counters
  const { data: dash } = useQuery({
    queryKey: ['finance-dashboard'],
    queryFn: async () => (await api.get('/finance/dashboard')).data.data,
  });

  // Member autocomplete
  const { data: memberResults } = useQuery({
    queryKey: ['member-search-rpt', memberSearch],
    enabled: memberSearch.length >= 2,
    queryFn: async () => (await api.get(`/members?search=${memberSearch}&limit=8`)).data.data,
  });

  // Member history
  const { data: memberHistory, isLoading: loadingHistory } = useQuery<MemberGivingHistory>({
    queryKey: ['member-giving', selectedMember?._id, memberYear],
    enabled: !!selectedMember,
    queryFn: async () =>
      (await api.get(`/finance/reports/member/${selectedMember._id}${memberYear ? `?year=${memberYear}` : ''}`)).data.data,
  });

  // Derived
  const income   = summary?.income    ?? 0;
  const expenses = summary?.expenses  ?? 0;
  const net      = summary?.netBalance ?? 0;
  const prevInc  = prev?.income ?? 0;
  const prevExp  = prev?.expenses ?? 0;

  const incDelta  = prevInc > 0 ? (((income  - prevInc) / prevInc) * 100).toFixed(1) : null;
  const expDelta  = prevExp > 0 ? (((expenses - prevExp) / prevExp) * 100).toFixed(1) : null;

  const byMonthData   = (summary?.byMonth   ?? []).map((m) => ({ name: MONTH_NAMES[m._id.month - 1], amount: Math.round(m.totalNGN), count: m.count }));
  const byTypeData    = (summary?.byType    ?? []).map((t) => ({ name: TYPE_LABELS[t._id] || t._id, value: Math.round(t.totalNGN), count: t.count, id: t._id }));
  const byChannelData = (summary?.byChannel ?? []).map((c) => ({ name: c._id.replace(/_/g,' ').replace(/\b\w/g,(x)=>x.toUpperCase()), value: Math.round(c.totalNGN), count: c.count, color: CHANNEL_COLORS[c._id] || '#888' }));

  return (
    <div className="space-y-6">
      <style>{`
        @keyframes slideUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .rs{animation:slideUp .3s ease both}
        .rs:nth-child(1){animation-delay:.04s} .rs:nth-child(2){animation-delay:.08s}
        .rs:nth-child(3){animation-delay:.12s} .rs:nth-child(4){animation-delay:.16s}
        .rs:nth-child(5){animation-delay:.20s} .rs:nth-child(6){animation-delay:.24s}
        .rs:nth-child(7){animation-delay:.28s} .rs:nth-child(8){animation-delay:.32s}
        .mopt:hover{background:rgba(218,165,32,0.08)}
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-3xl text-text-primary">Financial Reports</h1>
          <p className="text-text-muted text-sm mt-0.5">Income, expenses, channels & member giving statements</p>
        </div>
        <button className="btn-ghost flex items-center gap-2 text-sm"><Download size={15} /> Export PDF</button>
      </div>

      {/* Period Picker */}
      <div className="rs rounded-2xl p-4 flex flex-wrap items-center gap-4"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-border)' }}>
        <div className="flex items-center gap-2">
          <Calendar size={13} style={{ color: '#DAA520' }} />
          <span className="text-xs font-semibold text-text-muted uppercase tracking-widest">Period</span>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-text-muted">From</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input w-auto text-sm" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-text-muted">To</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input w-auto text-sm" />
        </div>
        <div className="flex gap-2 ml-auto flex-wrap">
          {[
            { label: 'This Month', s: format(startOfMonth(today),'yyyy-MM-dd'), e: format(endOfMonth(today),'yyyy-MM-dd') },
            { label: 'Last Month', s: format(startOfMonth(subMonths(today,1)),'yyyy-MM-dd'), e: format(endOfMonth(subMonths(today,1)),'yyyy-MM-dd') },
            { label: 'This Year',  s: format(startOfYear(today),'yyyy-MM-dd'),  e: format(today,'yyyy-MM-dd') },
          ].map(({ label, s, e }) => {
            const active = startDate === s && endDate === e;
            return (
              <button key={label} onClick={() => { setStartDate(s); setEndDate(e); }}
                className="text-xs px-3 py-1.5 rounded-lg transition-all"
                style={{
                  background: active ? 'rgba(218,165,32,0.15)' : 'var(--bg-hover)',
                  color: active ? '#DAA520' : 'var(--text-secondary)',
                  border: `1px solid ${active ? 'rgba(218,165,32,0.3)' : 'transparent'}`,
                }}>
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {isLoading ? <PageLoader /> : (<>

        {/* KPI Cards */}
        <div className="rs grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Total Income"    icon={TrendingUp}   color="#22c55e"
            value={fmtFull(income)}
            sub={incDelta ? `${Number(incDelta)>=0?'+':''}${incDelta}% vs prev period` : `${summary?.totalCount??0} transactions`}
            trend={incDelta ? (Number(incDelta)>=0 ? 'up':'down') : undefined}
          />
          <KpiCard label="Total Expenses"  icon={TrendingDown}  color="#ef4444"
            value={fmtFull(expenses)}
            sub={expDelta ? `${Number(expDelta)>=0?'+':''}${expDelta}% vs prev period` : `${dash?.pendingExpenses??0} pending approval`}
            trend={expDelta ? (Number(expDelta)<=0 ? 'up':'down') : undefined}
          />
          <KpiCard label="Net Balance"     icon={DollarSign}    color={net>=0 ? '#DAA520':'#ef4444'}
            value={fmtFull(Math.abs(net))}
            sub={net>=0 ? 'Surplus for period' : 'Deficit for period'}
            trend={net>=0 ? 'up':'down'}
          />
          <KpiCard label="Transactions"    icon={Layers}        color="#8b5cf6"
            value={String(summary?.totalCount??0)}
            sub={`Across ${byTypeData.length} giving types`}
          />
        </div>

        {/* Live Counters */}
        <div className="rs grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label:'Active Pledges',   value: dash?.activePledges  ??0, color:'#DAA520', icon: Target      },
            { label:'Active Projects',  value: dash?.activeProjects ??0, color:'#8b5cf6', icon: Layers      },
            { label:'Pending Expenses', value: dash?.pendingExpenses??0, color:'#ef4444', icon: TrendingDown },
            { label:'Total Txns',       value: summary?.totalCount  ??0, color:'#22c55e', icon: Users       },
          ].map(({ label, value, color, icon: Icon }) => (
            <div key={label} className="rounded-xl p-4 flex items-center gap-3"
              style={{ background:'var(--bg-card)', border:'1px solid var(--bg-border)' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background:`${color}15` }}>
                <Icon size={15} style={{ color }} />
              </div>
              <div>
                <p className="text-xl font-bold font-display" style={{ color }}>{value}</p>
                <p className="text-xs text-text-muted">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Row 1 */}
        <div className="rs grid grid-cols-1 lg:grid-cols-5 gap-5">

          {/* Monthly Bar */}
          <div className="lg:col-span-3">
            <Card title="Monthly Income Trend" icon={TrendingUp}>
              {byMonthData.length === 0
                ? <p className="text-text-muted text-sm py-12 text-center">No data for period</p>
                : (
                  <ResponsiveContainer width="100%" height={230}>
                    <BarChart data={byMonthData} barSize={20} margin={{ top:4, right:4, left:0, bottom:0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis dataKey="name" tick={{ fill:'#666', fontSize:11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill:'#666', fontSize:10 }} axisLine={false} tickLine={false} tickFormatter={fmtShort} />
                      <Tooltip {...TT} formatter={(v:number, _:string, p:any) => [fmtFull(v), `${p.payload.count} txns`]} />
                      <Bar dataKey="amount" radius={[5,5,0,0]}>
                        {byMonthData.map((_, i) => (
                          <Cell key={i} fill={i===byMonthData.length-1 ? '#22c55e' : '#DAA520'} opacity={0.8 + (i/byMonthData.length)*0.2} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
            </Card>
          </div>

          {/* Pie by Type */}
          <div className="lg:col-span-2">
            <Card title="Giving by Type" icon={Layers}>
              {byTypeData.length === 0
                ? <p className="text-text-muted text-sm py-12 text-center">No data</p>
                : (
                  <ResponsiveContainer width="100%" height={230}>
                    <PieChart>
                      <Pie data={byTypeData} cx="50%" cy="43%" innerRadius={50} outerRadius={78} dataKey="value" paddingAngle={2}>
                        {byTypeData.map((_,i) => <Cell key={i} fill={PALETTE[i%PALETTE.length]} />)}
                      </Pie>
                      <Tooltip {...TT} formatter={(v:number) => [fmtFull(v),'Amount']} />
                      <Legend iconSize={9} iconType="circle" wrapperStyle={{ fontSize:10, color:'#888', paddingTop:6 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
            </Card>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="rs grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Channel breakdown */}
          <Card title="By Payment Channel" icon={CreditCard}>
            {byChannelData.length === 0
              ? <p className="text-text-muted text-sm py-8 text-center">No data</p>
              : (
                <div className="space-y-3.5">
                  {byChannelData.map((c, i) => {
                    const total = byChannelData.reduce((s,x)=>s+x.value,0);
                    const pct   = total > 0 ? ((c.value/total)*100).toFixed(1) : '0';
                    return (
                      <div key={i} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ background:c.color }} />
                            <span className="text-text-secondary font-medium">{c.name}</span>
                            <span className="text-text-muted">({c.count} txn{c.count!==1?'s':''})</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-text-primary">{fmtFull(c.value)}</span>
                            <span className="text-text-muted w-9 text-right">{pct}%</span>
                          </div>
                        </div>
                        <div className="h-1.5 rounded-full bg-bg-hover overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700"
                            style={{ width:`${pct}%`, background:c.color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
          </Card>

          {/* Top types + snapshot */}
          <Card title="Income Snapshot" icon={Globe}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label:'Total Income',    value: fmtFull(income),       color:'#22c55e' },
                  { label:'Monthly Average', value: fmtShort(byMonthData.length ? income/byMonthData.length : 0), color:'#8b5cf6' },
                  { label:'Avg per Txn',     value: summary?.totalCount ? fmtShort(income/summary.totalCount) : '—', color:'#DAA520' },
                  { label:'Top Type',        value: byTypeData[0]?.name ?? '—', color:'#06b6d4' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="rounded-xl p-3" style={{ background:'var(--bg-hover)' }}>
                    <p className="text-xs text-text-muted">{label}</p>
                    <p className="text-sm font-bold mt-0.5 truncate" style={{ color }}>{value}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-2 pt-1" style={{ borderTop:'1px solid var(--bg-border)' }}>
                <p className="text-xs text-text-muted uppercase tracking-widest pt-1">Top 4 Giving Types</p>
                {byTypeData.slice(0,4).map((t, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold"
                        style={{ background:`${PALETTE[i]}18`, color:PALETTE[i] }}>{i+1}</span>
                      <span className="text-text-secondary">{t.name}</span>
                      <span className="text-text-muted text-xs">({t.count})</span>
                    </div>
                    <span className="font-semibold text-text-primary">{fmtFull(t.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Full Type Table */}
        <div className="rs rounded-2xl overflow-hidden" style={{ background:'var(--bg-card)', border:'1px solid var(--bg-border)' }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom:'1px solid var(--bg-border)' }}>
            <div className="flex items-center gap-2">
              <FileText size={14} style={{ color:'#DAA520' }} />
              <h3 className="text-xs font-semibold uppercase tracking-widest text-text-secondary">Full Breakdown by Contribution Type</h3>
            </div>
            <span className="text-xs text-text-muted">{summary?.totalCount??0} total records</span>
          </div>
          {byTypeData.length === 0
            ? <p className="text-text-muted text-sm py-10 text-center">No contributions for selected period</p>
            : (
              <table className="w-full">
                <thead className="bg-bg-hover/50" style={{ borderBottom:'1px solid var(--bg-border)' }}>
                  <tr>{['#','Type','Count','Total (NGN)','Avg per Txn','% of Income'].map((h) => (
                    <th key={h} className="table-header text-left">{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {(summary?.byType??[]).map((t, i) => {
                    const pct = income ? ((t.totalNGN/income)*100).toFixed(1) : '0';
                    const avg = t.count ? t.totalNGN/t.count : 0;
                    return (
                      <tr key={t._id} style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                        <td className="table-cell text-text-muted text-xs">{i+1}</td>
                        <td className="table-cell">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ background:PALETTE[i%PALETTE.length] }} />
                            <span className="font-medium text-text-primary">{TYPE_LABELS[t._id]||t._id}</span>
                          </div>
                        </td>
                        <td className="table-cell text-text-muted">{t.count}</td>
                        <td className="table-cell font-semibold text-emerald-400">{fmtFull(t.totalNGN)}</td>
                        <td className="table-cell text-text-secondary">{fmtFull(avg)}</td>
                        <td className="table-cell">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 rounded-full bg-bg-hover overflow-hidden">
                              <div className="h-full rounded-full" style={{ width:`${pct}%`, background:PALETTE[i%PALETTE.length] }} />
                            </div>
                            <span className="text-xs text-text-muted">{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  <tr style={{ background:'rgba(218,165,32,0.04)', borderTop:'1px solid rgba(218,165,32,0.1)' }}>
                    <td className="table-cell" />
                    <td className="table-cell font-bold text-text-primary">TOTAL</td>
                    <td className="table-cell font-bold text-text-primary">{summary?.totalCount??0}</td>
                    <td className="table-cell font-bold text-emerald-400 text-base">{fmtFull(income)}</td>
                    <td className="table-cell text-text-secondary">{summary?.totalCount ? fmtFull(income/summary.totalCount) : '—'}</td>
                    <td className="table-cell font-bold" style={{ color:'#DAA520' }}>100%</td>
                  </tr>
                </tbody>
              </table>
            )}
        </div>
      </>)}

      {/* Member Giving Statement */}
      <div className="rs rounded-2xl" style={{ background:'var(--bg-card)', border:'1px solid var(--bg-border)' }}>
        <div className="flex items-center gap-2 px-5 py-4" style={{ borderBottom:'1px solid var(--bg-border)' }}>
          <FileText size={14} style={{ color:'#DAA520' }} />
          <h3 className="text-xs font-semibold uppercase tracking-widest text-text-secondary">Member Giving Statement</h3>
          <span className="text-xs text-text-muted ml-1">— for tax receipts & annual letters</span>
        </div>

        <div className="p-5 space-y-5">
          {/* Controls */}
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[220px] relative">
              <label className="label">Member</label>
              {selectedMember ? (
                <div className="input flex items-center justify-between cursor-pointer"
                  onClick={() => { setSelectedMember(null); setMemberSearch(''); }}>
                  <span className="text-sm text-text-primary">
                    {selectedMember.firstName} {selectedMember.lastName}
                    <span className="font-mono text-xs ml-2" style={{ color:'#DAA520' }}>({selectedMember.membershipId})</span>
                  </span>
                  <span className="text-text-muted text-xs">× Change</span>
                </div>
              ) : (
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                  <input className="input pl-9" value={memberSearch}
                    onChange={(e) => { setMemberSearch(e.target.value); setShowList(true); }}
                    placeholder="Search by name, phone, ID..." />
                  {showList && (memberResults??[]).length > 0 && (
                    <div className="absolute z-50 w-full mt-1 rounded-xl border shadow-xl overflow-hidden"
                      style={{ background:'var(--bg-card)', borderColor:'var(--bg-border)' }}>
                      {(memberResults??[]).map((m:any) => (
                        <div key={m._id} className="mopt flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors"
                          onClick={() => { setSelectedMember(m); setShowList(false); setMemberSearch(''); }}>
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                            style={{ background:'rgba(218,165,32,0.12)', color:'#DAA520' }}>
                            {m.firstName.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm text-text-primary">{m.firstName} {m.lastName}</p>
                            <p className="text-xs text-text-muted font-mono">{m.membershipId} · {m.phone}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div>
              <label className="label">Year</label>
              <select value={memberYear} onChange={(e) => setMemberYear(e.target.value)} className="input w-auto">
                {[2025,2024,2023,2022,2021].map((y) => <option key={y} value={y}>{y}</option>)}
                <option value="">All Time</option>
              </select>
            </div>
          </div>

          {!selectedMember ? (
            <div className="rounded-xl py-12 text-center" style={{ background:'var(--bg-hover)', border:'1px dashed var(--bg-border)' }}>
              <Search size={28} className="mx-auto mb-3 text-text-muted opacity-30" />
              <p className="text-text-muted text-sm">Search for a member to view their giving history</p>
            </div>
          ) : loadingHistory ? <PageLoader /> : memberHistory ? (
            <div className="space-y-4">
              {/* KPIs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-xl p-4 text-center" style={{ background:'var(--bg-hover)' }}>
                  <p className="text-2xl font-bold text-emerald-400 font-display">{fmtFull(memberHistory.grandTotal)}</p>
                  <p className="text-xs text-text-muted mt-1">Total Given</p>
                </div>
                <div className="rounded-xl p-4 text-center" style={{ background:'var(--bg-hover)' }}>
                  <p className="text-2xl font-bold font-display" style={{ color:'#DAA520' }}>{memberHistory.count}</p>
                  <p className="text-xs text-text-muted mt-1">Transactions</p>
                </div>
                {Object.entries(memberHistory.totalByType).slice(0,2).map(([type, total]) => (
                  <div key={type} className="rounded-xl p-4 text-center" style={{ background:'var(--bg-hover)' }}>
                    <p className="text-lg font-bold text-text-primary font-display">{fmtFull(total as number)}</p>
                    <p className="text-xs text-text-muted mt-1">{TYPE_LABELS[type]||type}</p>
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <button className="btn-ghost flex items-center gap-2 text-sm"><Download size={13} /> Download PDF Statement</button>
              </div>

              {/* Table */}
              <div className="rounded-xl overflow-hidden" style={{ border:'1px solid var(--bg-border)' }}>
                <table className="w-full">
                  <thead className="bg-bg-hover/50" style={{ borderBottom:'1px solid var(--bg-border)' }}>
                    <tr>{['Date','Receipt','Type','Amount','Channel','Status'].map((h) => (
                      <th key={h} className="table-header text-left">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {memberHistory.contributions.map((c) => (
                      <tr key={c._id} style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                        <td className="table-cell text-text-muted text-xs">{fmtDate(c.createdAt)}</td>
                        <td className="table-cell font-mono text-xs" style={{ color:'#DAA520' }}>{c.receiptNumber}</td>
                        <td className="table-cell text-text-secondary text-sm">{TYPE_LABELS[c.contributionType]||c.contributionType}</td>
                        <td className="table-cell text-emerald-400 font-semibold">
                          {fmtFull(c.amount, c.currency)}
                          {c.currency!=='NGN' && <span className="text-xs text-text-muted ml-1">({c.currency})</span>}
                        </td>
                        <td className="table-cell text-xs text-text-muted capitalize">{c.paymentChannel.replace(/_/g,' ')}</td>
                        <td className="table-cell">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{
                              background: c.status==='successful' ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)',
                              color:      c.status==='successful' ? '#22c55e' : '#f59e0b',
                            }}>
                            {c.status.charAt(0).toUpperCase()+c.status.slice(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background:'rgba(218,165,32,0.04)', borderTop:'1px solid rgba(218,165,32,0.12)' }}>
                      <td colSpan={3} className="table-cell font-bold text-text-primary">Grand Total</td>
                      <td className="table-cell text-emerald-400 font-bold text-base">{fmtFull(memberHistory.grandTotal)}</td>
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
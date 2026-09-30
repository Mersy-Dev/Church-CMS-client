import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Users, Cake, CalendarDays, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { useAppSelector } from '../../hooks/useRedux';
import { useTheme } from '../../context/ThemeContext';
import Avatar from '../../components/ui/Avatar';
import StatusBadge from '../../components/ui/StatusBadge';
import { PageLoader } from '../../components/ui/Spinner';
import type { Member, ChurchEvent } from '../../types';

// ── Word House brand ──────────────────────────────────────────────────────────
const NAVY    = '#1A56A0';
const CRIMSON = '#C41E3A';
const GREEN   = '#2E8B57';
const PINK    = '#ec4899';

// ── Theme-aware colour helper ─────────────────────────────────────────────────
// Returns correct text/bg values for the active theme.
// This removes ALL guesswork from CSS var resolution in components.
function useColors() {
  const { isDark } = useTheme();
  return {
    textPrimary:   isDark ? '#f0f6fc'  : '#0a0f1a',
    textSecondary: isDark ? '#c9d1d9'  : '#1a2236',
    textMuted:     isDark ? '#8b949e'  : '#3d4f6b',
    cardBg:        isDark ? 'rgba(255,255,255,0.04)' : '#ffffff',
    cardBorder:    isDark ? 'rgba(255,255,255,0.09)' : 'rgba(26,86,160,0.15)',
    cardShadow:    isDark ? '0 2px 12px rgba(0,0,0,0.3)' : '0 2px 16px rgba(26,86,160,0.1)',
    hoverBg:       isDark ? 'rgba(255,255,255,0.07)' : 'rgba(26,86,160,0.07)',
    accentNavy:    isDark ? '#4A8FD4'  : '#1A56A0',  // navyLight safe only on dark
    sectionTitle:  isDark ? '#4A8FD4'  : '#1A56A0',
  };
}

// ── StatCard ──────────────────────────────────────────────────────────────────
function StatCard({ icon, value, label, sub, accentColor }: {
  icon: React.ReactNode;
  value: number | string;
  label: string;
  sub?: string;
  accentColor: string;
}) {
  const C = useColors();
  return (
    <div
      className="card p-5"
      style={{
        borderTop: `3px solid ${accentColor}`,
        background: C.cardBg,
        border: `1px solid ${C.cardBorder}`,
        borderTopColor: accentColor,
        boxShadow: C.cardShadow,
      }}
    >
      <div className="flex items-start justify-between">
        <div>
          {/* Big stat number — explicitly set to near-black on light */}
          <p className="text-4xl font-display font-bold leading-none" style={{ color: C.textPrimary }}>
            {value}
          </p>
          <p className="text-sm mt-1.5" style={{ color: C.textSecondary }}>{label}</p>
          {sub && <p className="text-xs mt-1" style={{ color: C.textMuted }}>{sub}</p>}
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
    </div>
  );
}

// ── Section title ─────────────────────────────────────────────────────────────
function SectionTitle({ children }: { children: React.ReactNode }) {
  const C = useColors();
  return (
    <h3 className="text-[11px] font-semibold uppercase tracking-widest mb-4"
      style={{ color: C.sectionTitle }}>
      {children}
    </h3>
  );
}

// ── Panel (card wrapper) ──────────────────────────────────────────────────────
function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const C = useColors();
  return (
    <div
      className={`card p-5 ${className}`}
      style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}`, boxShadow: C.cardShadow }}
    >
      {children}
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user }   = useAppSelector((s) => s.auth);
  const navigate   = useNavigate();
  const C          = useColors();
  const { isDark } = useTheme();

  const displayName =
    user?.member?.firstName ||
    user?.role?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) ||
    'Admin';

  const { data: memberStats,   isLoading: loadingStats   } = useQuery({
    queryKey: ['member-stats'],
    queryFn: async () => (await api.get('/members/stats')).data.data,
  });
  const { data: recentMembers, isLoading: loadingMembers } = useQuery({
    queryKey: ['recent-members'],
    queryFn: async () =>
      (await api.get('/members?limit=5&sortBy=createdAt&sortOrder=desc')).data.data as Member[],
  });
  const { data: upcomingEvents } = useQuery({
    queryKey: ['upcoming-events'],
    queryFn: async () => (await api.get('/events/upcoming?limit=3')).data.data as ChurchEvent[],
  });
  const { data: birthdaysToday } = useQuery({
    queryKey: ['birthdays-today'],
    queryFn: async () => (await api.get('/members/birthdays/today')).data.data as Member[],
  });
  const { data: visitorStats } = useQuery({
    queryKey: ['visitor-stats'],
    queryFn: async () => (await api.get('/visitors/stats')).data.data,
  });

  if (loadingStats || loadingMembers) return <PageLoader />;

  const QUICK_ACTIONS = [
    { label: 'Add New Member',   icon: '👤', color: NAVY,    action: () => navigate('/members?modal=add')  },
    { label: 'Schedule Event',   icon: '📅', color: C.accentNavy, action: () => navigate('/events?modal=add')   },
    { label: 'Mark Attendance',  icon: '✅', color: GREEN,   action: () => navigate('/attendance')         },
    { label: 'Register Visitor', icon: '🤝', color: CRIMSON, action: () => navigate('/visitors?modal=add') },
  ];

  return (
    <div className="space-y-6">

      {/* ── Greeting ── */}
      <div>
        <h1 className="font-display font-bold text-3xl" style={{ color: C.textPrimary }}>
          {getGreeting()}, {displayName} 👋
        </h1>
        <p className="mt-1" style={{ color: C.textMuted }}>
          {format(new Date(), 'EEEE, d MMMM yyyy')}
        </p>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          icon={<Users size={22} style={{ color: NAVY }} />}
          value={memberStats?.total ?? 0}
          label="Total Members"
          sub={`↑ ${memberStats?.newThisMonth ?? 0} this month`}
          accentColor={NAVY}
        />
        <StatCard
          icon={<Cake size={22} style={{ color: PINK }} />}
          value={birthdaysToday?.length ?? 0}
          label="Birthdays Today 🎂"
          accentColor={PINK}
        />
        <StatCard
          icon={<CalendarDays size={22} style={{ color: C.accentNavy }} />}
          value={upcomingEvents?.length ?? 0}
          label="Upcoming Events"
          accentColor={C.accentNavy}
        />
        <StatCard
          icon={<UserCheck size={22} style={{ color: GREEN }} />}
          value={visitorStats?.total ?? 0}
          label="Total Visitors"
          accentColor={GREEN}
        />
      </div>

      {/* ── Middle row ── */}
      <div className="grid grid-cols-2 gap-4">

        {/* Today's Alerts */}
        <Panel>
          <SectionTitle>Today's Alerts</SectionTitle>
          {birthdaysToday && birthdaysToday.length > 0 ? (
            <ul className="space-y-2">
              {birthdaysToday.map((m) => (
                <li key={m._id} className="flex items-center gap-3 text-sm">
                  <span>🎂</span>
                  <span className="font-medium" style={{ color: C.textPrimary }}>
                    {m.firstName} {m.lastName}
                  </span>
                  <span className="text-xs" style={{ color: C.textMuted }}>Birthday today</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm flex items-center gap-2" style={{ color: C.textMuted }}>
              No alerts today <span>🎯</span>
            </p>
          )}
        </Panel>

        {/* Upcoming Events */}
        <Panel>
          <SectionTitle>Upcoming Events</SectionTitle>
          {upcomingEvents && upcomingEvents.length > 0 ? (
            <ul className="space-y-3">
              {upcomingEvents.map((event) => {
                const d = new Date(event.startDatetime);
                return (
                  <li key={event._id} className="flex items-start gap-3">
                    <div
                      className="text-center rounded-lg px-2.5 py-1.5 min-w-[44px]"
                      style={{
                        background: isDark ? 'rgba(26,86,160,0.15)' : 'rgba(26,86,160,0.08)',
                        border: `1px solid rgba(26,86,160,${isDark ? '0.25' : '0.18'})`,
                      }}
                    >
                      <p className="text-[10px] uppercase font-semibold" style={{ color: C.accentNavy }}>
                        {format(d, 'EEE')}
                      </p>
                      <p className="font-bold text-lg leading-none" style={{ color: C.textPrimary }}>
                        {format(d, 'd')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: C.textPrimary }}>{event.title}</p>
                      <p className="text-xs" style={{ color: C.textMuted }}>
                        {format(d, 'HH:mm')} · {event.location || 'TBD'}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm" style={{ color: C.textMuted }}>No upcoming events</p>
          )}
        </Panel>
      </div>

      {/* ── Bottom row ── */}
      <div className="grid grid-cols-2 gap-4">

        {/* Recent Members */}
        <Panel>
          <SectionTitle>Recent Members</SectionTitle>
          {recentMembers && recentMembers.length > 0 ? (
            <ul className="space-y-0.5">
              {recentMembers.map((m) => (
                <li
                  key={m._id}
                  onClick={() => navigate(`/members/${m._id}`)}
                  className="flex items-center justify-between py-2.5 px-2 rounded-xl cursor-pointer transition-colors"
                  style={{ background: 'transparent' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = C.hoverBg; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  <div className="flex items-center gap-3">
                    <Avatar name={`${m.firstName} ${m.lastName}`} photoUrl={m.photoUrl} size="sm" />
                    <div>
                      <p className="text-sm font-medium" style={{ color: C.textPrimary }}>
                        {m.firstName} {m.lastName}
                      </p>
                      <p className="text-xs" style={{ color: C.textMuted }}>
                        {m.departments?.[0]?.name ?? '—'} · {m.status?.replace(/_/g, ' ')}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={m.status} size="sm" />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm" style={{ color: C.textMuted }}>No members yet</p>
          )}
        </Panel>

        {/* Quick Actions */}
        <Panel>
          <SectionTitle>Quick Actions</SectionTitle>
          <ul className="space-y-2">
            {QUICK_ACTIONS.map((a) => (
              <li key={a.label}>
                <button
                  onClick={a.action}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium text-left"
                  style={{ background: C.hoverBg }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.background = `${a.color}15`;
                    el.style.paddingLeft = '18px';
                    el.style.borderLeft = `3px solid ${a.color}`;
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.background = C.hoverBg;
                    el.style.paddingLeft = '';
                    el.style.borderLeft = '';
                  }}
                >
                  {/* Coloured dot */}
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: a.color }} />
                  {/* Label — explicitly dark text */}
                  <span style={{ color: C.textPrimary }}>{a.icon} {a.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
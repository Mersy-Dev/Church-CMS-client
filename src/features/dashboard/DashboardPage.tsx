import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Users, Cake, CalendarDays, UserCheck, Plus, Calendar, ClipboardCheck, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { useAppSelector } from '../../hooks/useRedux';
import Avatar from '../../components/ui/Avatar';
import StatusBadge from '../../components/ui/StatusBadge';
import { PageLoader } from '../../components/ui/Spinner';
import type { Member, ChurchEvent } from '../../types';

function StatCard({ icon, value, label, sub, color }: any) {
  return (
    <div className={`card p-5 border-t-2 ${color}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-4xl font-display font-bold text-text-primary leading-none">{value}</p>
          <p className="text-text-secondary text-sm mt-1.5">{label}</p>
          {sub && <p className="text-text-muted text-xs mt-1">{sub}</p>}
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardPage() {
  const { user } = useAppSelector((s) => s.auth);
  const navigate = useNavigate();

  const displayName = user?.member?.firstName
    || user?.role?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    || 'Admin';

  const { data: memberStats, isLoading: loadingStats } = useQuery({
    queryKey: ['member-stats'],
    queryFn: async () => {
      const res = await api.get('/members/stats');
      return res.data.data;
    },
  });

  const { data: recentMembers, isLoading: loadingMembers } = useQuery({
    queryKey: ['recent-members'],
    queryFn: async () => {
      const res = await api.get('/members?limit=5&sortBy=createdAt&sortOrder=desc');
      return res.data.data as Member[];
    },
  });

  const { data: upcomingEvents } = useQuery({
    queryKey: ['upcoming-events'],
    queryFn: async () => {
      const res = await api.get('/events/upcoming?limit=3');
      return res.data.data as ChurchEvent[];
    },
  });

  const { data: birthdaysToday } = useQuery({
    queryKey: ['birthdays-today'],
    queryFn: async () => {
      const res = await api.get('/members/birthdays/today');
      return res.data.data as Member[];
    },
  });

  const { data: visitorStats } = useQuery({
    queryKey: ['visitor-stats'],
    queryFn: async () => {
      const res = await api.get('/visitors/stats');
      return res.data.data;
    },
  });

  if (loadingStats || loadingMembers) return <PageLoader />;

  const QUICK_ACTIONS = [
    { label: 'Add New Member', icon: '👤', color: 'text-blue-400', action: () => navigate('/members?modal=add') },
    { label: 'Schedule Event', icon: '📅', color: 'text-purple-400', action: () => navigate('/events?modal=add') },
    { label: 'Mark Attendance', icon: '✅', color: 'text-green-400', action: () => navigate('/attendance') },
    { label: 'Register Visitor', icon: '🤝', color: 'text-gold', action: () => navigate('/visitors?modal=add') },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display font-bold text-3xl text-text-primary">
          {getGreeting()}, {displayName} 👋
        </h1>
        <p className="text-text-muted mt-1">{format(new Date(), 'EEEE, d MMMM yyyy')}</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          icon={<Users size={20} className="text-blue-400" />}
          value={memberStats?.total ?? 0}
          label="Total Members"
          sub={`↑ ${memberStats?.newThisMonth ?? 0} this month`}
          color="border-t-blue-500"
        />
        <StatCard
          icon={<Cake size={20} className="text-pink-400" />}
          value={birthdaysToday?.length ?? 0}
          label="Birthdays Today 🎂"
          color="border-t-pink-500"
        />
        <StatCard
          icon={<CalendarDays size={20} className="text-purple-400" />}
          value={upcomingEvents?.length ?? 0}
          label="Upcoming Events"
          color="border-t-purple-500"
        />
        <StatCard
          icon={<UserCheck size={20} className="text-green-400" />}
          value={visitorStats?.total ?? 0}
          label="Total Visitors"
          color="border-t-green-500"
        />
      </div>

      {/* Middle row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Today's Alerts */}
        <div className="card p-5">
          <h3 className="text-[11px] font-semibold text-text-muted uppercase tracking-widest mb-4">
            Today's Alerts
          </h3>
          {birthdaysToday && birthdaysToday.length > 0 ? (
            <ul className="space-y-2">
              {birthdaysToday.map((m) => (
                <li key={m._id} className="flex items-center gap-3 text-sm">
                  <span>🎂</span>
                  <span className="text-text-primary font-medium">{m.firstName} {m.lastName}</span>
                  <span className="text-text-muted text-xs">Birthday today</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-text-muted text-sm flex items-center gap-2">
              No alerts today <span>🎯</span>
            </p>
          )}
        </div>

        {/* Upcoming Events */}
        <div className="card p-5">
          <h3 className="text-[11px] font-semibold text-text-muted uppercase tracking-widest mb-4">
            Upcoming Events
          </h3>
          {upcomingEvents && upcomingEvents.length > 0 ? (
            <ul className="space-y-3">
              {upcomingEvents.map((event) => {
                const d = new Date(event.startDatetime);
                return (
                  <li key={event._id} className="flex items-start gap-3">
                    <div className="text-center bg-bg-hover rounded-lg px-2.5 py-1.5 min-w-[44px]">
                      <p className="text-text-muted text-[10px] uppercase">{format(d, 'EEE')}</p>
                      <p className="text-text-primary font-bold text-lg leading-none">{format(d, 'd')}</p>
                    </div>
                    <div>
                      <p className="text-text-primary text-sm font-medium">{event.title}</p>
                      <p className="text-text-muted text-xs">
                        {format(d, 'HH:mm')} · {event.location || 'TBD'}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-text-muted text-sm">No upcoming events</p>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Recent Members */}
        <div className="card p-5">
          <h3 className="text-[11px] font-semibold text-text-muted uppercase tracking-widest mb-4">
            Recent Members
          </h3>
          {recentMembers && recentMembers.length > 0 ? (
            <ul className="space-y-0.5">
              {recentMembers.map((m) => (
                <li
                  key={m._id}
                  onClick={() => navigate(`/members/${m._id}`)}
                  className="flex items-center justify-between py-2.5 px-2 rounded-xl hover:bg-bg-hover cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <Avatar name={`${m.firstName} ${m.lastName}`} photoUrl={m.photoUrl} size="sm" />
                    <div>
                      <p className="text-text-primary text-sm font-medium group-hover:text-gold transition-colors">
                        {m.firstName} {m.lastName}
                      </p>
                      <p className="text-text-muted text-xs">
                        {m.departments?.[0]?.name ?? '—'} · {m.status?.replace(/_/g, ' ')}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={m.status} size="sm" />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-text-muted text-sm">No members yet</p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="card p-5">
          <h3 className="text-[11px] font-semibold text-text-muted uppercase tracking-widest mb-4">
            Quick Actions
          </h3>
          <ul className="space-y-2">
            {QUICK_ACTIONS.map((a) => (
              <li key={a.label}>
                <button
                  onClick={a.action}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-bg-hover rounded-xl hover:bg-bg-border transition-colors text-sm text-text-primary font-medium text-left"
                >
                  <span className="text-base">{a.icon}</span>
                  {a.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

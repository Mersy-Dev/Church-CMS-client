/**
 * ChurchOS — src/features/onlineMinistry/OnlineMinistryPage.tsx
 * Module 07 — Main landing/dashboard page for Online Ministry
 */

import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Youtube, Radio, BookOpen, Share2,
  UserCheck, Heart, HeadphonesIcon, Users, Mail,
  TrendingUp, ArrowRight, Wifi,
} from 'lucide-react';
import { onlineMinistryStatsApi, streamsApi } from '../../lib/onlineministry.api';
import { PageLoader } from '../../components/ui/Spinner';
import type { OnlineMinistryStats, LiveStream } from '../../types/onlineministry.types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(date?: string) {
  if (!date) return '—';
  try {
    return new Intl.DateTimeFormat('en-NG', {
      day: 'numeric', month: 'short', year: 'numeric',
    }).format(new Date(date));
  } catch { return '—'; }
}

function fmtTime(date?: string) {
  if (!date) return '';
  try {
    return new Intl.DateTimeFormat('en-NG', { hour: '2-digit', minute: '2-digit' }).format(new Date(date));
  } catch { return ''; }
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  onClick?: () => void;
}

function StatCard({ icon, label, value, color, onClick }: StatCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--bg-border)',
      }}
    >
      <div className="flex items-start justify-between">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
          style={{ background: `${color}18`, color }}
        >
          {icon}
        </div>
        <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity mt-1" style={{ color }} />
      </div>
      <p className="text-3xl font-bold mt-4" style={{ color: 'var(--text-primary)' }}>
        {value.toLocaleString()}
      </p>
      <p className="text-xs mt-1 font-medium" style={{ color: 'var(--text-muted)' }}>{label}</p>
    </button>
  );
}

// ─── Nav Card ─────────────────────────────────────────────────────────────────

function NavCard({
  icon, title, description, badge, route, color,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: string | number;
  route: string;
  color: string;
}) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(route)}
      className="w-full text-left rounded-2xl p-5 space-y-3 transition-all duration-300 hover:-translate-y-1 group"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-border)' }}
    >
      <div className="flex items-center justify-between">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${color}18`, color }}
        >
          {icon}
        </div>
        {badge !== undefined && (
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ background: `${color}22`, color }}
          >
            {badge}
          </span>
        )}
      </div>
      <div>
        <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{title}</p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{description}</p>
      </div>
      <div className="flex items-center gap-1 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity" style={{ color }}>
        Open <ArrowRight size={11} />
      </div>
    </button>
  );
}

// ─── Live Stream Badge ────────────────────────────────────────────────────────

function LiveBadge({ stream }: { stream: LiveStream }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(`/online-ministry/streams/${stream._id}`)}
      className="w-full text-left rounded-2xl p-4 flex items-center gap-4 transition-all duration-300 hover:scale-[1.01]"
      style={{
        background: 'rgba(239,68,68,0.08)',
        border: '1px solid rgba(239,68,68,0.25)',
      }}
    >
      <div className="relative flex-shrink-0">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-red-500/20">
          <Wifi size={18} className="text-red-400" />
        </div>
        <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 animate-pulse" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
          {stream.title}
        </p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {stream.totalOnlineViewers.toLocaleString()} viewers · {fmtTime(stream.serviceDate)}
        </p>
      </div>
      <span className="text-xs font-bold text-red-400 px-2 py-0.5 rounded-full bg-red-500/10 flex-shrink-0">
        LIVE
      </span>
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function OnlineMinistryPage() {
  const navigate = useNavigate();

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['online-ministry-stats'],
    queryFn: async () => {
      const res = await onlineMinistryStatsApi.get();
      return res.data.data as OnlineMinistryStats;
    },
    refetchInterval: 30_000, // refresh every 30s for live data
  });

  const { data: liveStreams } = useQuery({
    queryKey: ['live-streams'],
    queryFn: async () => {
      const res = await streamsApi.getLive();
      return res.data.data as LiveStream[];
    },
    refetchInterval: 15_000,
  });

  const { data: upcomingStreams } = useQuery({
    queryKey: ['upcoming-streams'],
    queryFn: async () => {
      const res = await streamsApi.getUpcoming();
      return res.data.data as LiveStream[];
    },
  });

  if (statsLoading) return <PageLoader />;

  const stats = statsData;

  return (
    <div className="space-y-6">
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .om-section { animation: slideUp 0.35s ease both; }
        .om-section:nth-child(1) { animation-delay: 0.05s; }
        .om-section:nth-child(2) { animation-delay: 0.10s; }
        .om-section:nth-child(3) { animation-delay: 0.15s; }
        .om-section:nth-child(4) { animation-delay: 0.20s; }
        .om-section:nth-child(5) { animation-delay: 0.25s; }
      `}</style>

      {/* ── Header ── */}
      <div className="om-section flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-3xl" style={{ color: 'var(--text-primary)' }}>
            Online Ministry
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Module 07 · Digital Outreach
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(liveStreams?.length ?? 0) > 0 && (
            <span className="flex items-center gap-1.5 text-xs font-bold text-red-400 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              {liveStreams!.length} Stream{liveStreams!.length > 1 ? 's' : ''} Live
            </span>
          )}
        </div>
      </div>

      {/* ── Live Now ── */}
      {(liveStreams?.length ?? 0) > 0 && (
        <div className="om-section space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
            Live Now
          </p>
          {liveStreams!.map((s) => <LiveBadge key={s._id} stream={s} />)}
        </div>
      )}

      {/* ── Stats Grid ── */}
      <div className="om-section">
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
          Overview
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            icon={<BookOpen size={18} />}
            label="Published Sermons"
            value={stats?.totalSermons ?? 0}
            color="#DAA520"
            onClick={() => navigate('/online-ministry/sermons')}
          />
          <StatCard
            icon={<Radio size={18} />}
            label="Total Streams"
            value={stats?.totalStreams ?? 0}
            color="#6366f1"
            onClick={() => navigate('/online-ministry/streams')}
          />
          <StatCard
            icon={<UserCheck size={18} />}
            label="Converts This Month"
            value={stats?.convertsThisMonth ?? 0}
            color="#10b981"
            onClick={() => navigate('/online-ministry/converts')}
          />
          <StatCard
            icon={<Mail size={18} />}
            label="Active Subscribers"
            value={stats?.activeSubscribers ?? 0}
            color="#f59e0b"
            onClick={() => navigate('/online-ministry/newsletter')}
          />
        </div>
      </div>

      {/* ── Pending Attention ── */}
      <div className="om-section">
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
          Needs Attention
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <StatCard
            icon={<Heart size={18} />}
            label="Pending Prayers"
            value={stats?.pendingPrayers ?? 0}
            color="#ec4899"
            onClick={() => navigate('/online-ministry/prayer-requests')}
          />
          <StatCard
            icon={<HeadphonesIcon size={18} />}
            label="Counselling Requests"
            value={stats?.pendingCounselling ?? 0}
            color="#8b5cf6"
            onClick={() => navigate('/online-ministry/counselling')}
          />
          <StatCard
            icon={<Users size={18} />}
            label="Visitor Follow-ups"
            value={stats?.pendingVisitorFollowUps ?? 0}
            color="#ef4444"
            onClick={() => navigate('/online-ministry/visitors')}
          />
        </div>
      </div>

      {/* ── Quick Navigation ── */}
      <div className="om-section">
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
          Modules
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <NavCard
            icon={<Radio size={17} />}
            title="Livestreams"
            description="Schedule & track streams"
            badge={upcomingStreams?.length}
            route="/online-ministry/streams"
            color="#6366f1"
          />
          <NavCard
            icon={<BookOpen size={17} />}
            title="Sermon Library"
            description="YouTube, Facebook & audio"
            route="/online-ministry/sermons"
            color="#DAA520"
          />
          <NavCard
            icon={<Share2 size={17} />}
            title="Social Posts"
            description="Multi-platform scheduler"
            route="/online-ministry/social-posts"
            color="#0ea5e9"
          />
          <NavCard
            icon={<UserCheck size={17} />}
            title="Converts"
            description="Log & follow up converts"
            badge={stats?.convertsThisMonth}
            route="/online-ministry/converts"
            color="#10b981"
          />
          <NavCard
            icon={<Heart size={17} />}
            title="Prayer Wall"
            description="Online prayer requests"
            badge={stats?.pendingPrayers}
            route="/online-ministry/prayer-requests"
            color="#ec4899"
          />
          <NavCard
            icon={<HeadphonesIcon size={17} />}
            title="Counselling"
            description="Online session tracking"
            badge={stats?.pendingCounselling}
            route="/online-ministry/counselling"
            color="#8b5cf6"
          />
          <NavCard
            icon={<Users size={17} />}
            title="Online Visitors"
            description="Capture & follow-up pipeline"
            badge={stats?.pendingVisitorFollowUps}
            route="/online-ministry/visitors"
            color="#ef4444"
          />
          <NavCard
            icon={<Mail size={17} />}
            title="Newsletter"
            description="Campaigns & subscribers"
            route="/online-ministry/newsletter"
            color="#f59e0b"
          />
        </div>
      </div>

      {/* ── Upcoming Streams ── */}
      {(upcomingStreams?.length ?? 0) > 0 && (
        <div className="om-section">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
              Upcoming Streams
            </p>
            <button
              onClick={() => navigate('/online-ministry/streams')}
              className="text-xs font-medium flex items-center gap-1 hover:opacity-80"
              style={{ color: '#DAA520' }}
            >
              View all <ArrowRight size={11} />
            </button>
          </div>
          <div className="space-y-2">
            {upcomingStreams!.slice(0, 3).map((s) => (
              <button
                key={s._id}
                onClick={() => navigate(`/online-ministry/streams/${s._id}`)}
                className="w-full text-left rounded-xl p-4 flex items-center gap-4 transition-all duration-200 hover:scale-[1.005]"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-border)' }}
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-indigo-500/15">
                  <Youtube size={16} className="text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>{s.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{fmt(s.serviceDate)} · {fmtTime(s.serviceDate)}</p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8' }}>
                  Scheduled
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
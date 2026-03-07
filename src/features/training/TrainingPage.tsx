/**
 * ChurchOS — src/features/training/TrainingPage.tsx
 * Module 04 — Training & Discipleship — Main Hub
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  GraduationCap, Users, BookOpen, Heart,
  TrendingUp, Award,
} from 'lucide-react';
import api from '../../lib/api';
import type { TrainingStats } from '../../types/training.types';
import ProgramsTab from './ProgramsTab';
import CohortsTab from './CohortsTab';
import MentorshipsTab from './MentorshipsTab';

type Tab = 'programs' | 'cohorts' | 'mentorships';

function StatCard({ label, value, color, icon }: { label: string; value: number; color: string; icon: React.ReactNode }) {
  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: 'var(--bg-card, rgba(255,255,255,0.04))',
        border: '1px solid var(--bg-border, rgba(255,255,255,0.08))',
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-text-muted">{label}</p>
        <span style={{ color, opacity: 0.7 }}>{icon}</span>
      </div>
      <p className="text-2xl font-bold" style={{ color }}>{value ?? 0}</p>
    </div>
  );
}

function TabButton({ label, icon, active, onClick }: { label: string; icon: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-150"
      style={
        active
          ? { background: 'rgba(218,165,32,0.12)', color: '#DAA520', border: '1px solid rgba(218,165,32,0.25)' }
          : { color: 'var(--text-muted)', border: '1px solid transparent' }
      }
    >
      {icon}
      {label}
    </button>
  );
}

export default function TrainingPage() {
  const [tab, setTab] = useState<Tab>('programs');

  const { data: stats } = useQuery<TrainingStats>({
    queryKey: ['training-stats'],
    queryFn: async () => {
      const res = await api.get('/training/stats');
      return res.data.data as TrainingStats;
    },
  });

  return (
    <div className="space-y-6">
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.3s ease both; }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-3xl text-text-primary">
            Training & Discipleship
          </h1>
          <p className="text-text-muted text-sm mt-0.5">
            Programs, cohorts, attendance and mentorships
          </p>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 fade-up">
          <StatCard label="Active Programs"     value={stats.totalPrograms}       color="#DAA520"  icon={<BookOpen size={15}      />} />
          <StatCard label="Active Cohorts"      value={stats.activeCohorts}       color="#5c9ee0"  icon={<Users size={15}         />} />
          <StatCard label="Enrolled"            value={stats.currentlyEnrolled}   color="#5ce08a"  icon={<TrendingUp size={15}    />} />
          <StatCard label="Graduated"           value={stats.totalGraduated}      color="#c05ce0"  icon={<Award size={15}         />} />
          <StatCard label="Mentorships"         value={stats.activeMentorships}   color="#e08a5c"  icon={<Heart size={15}         />} />
          <StatCard label="Integration Active"  value={stats.integrationClass?.active ?? 0} color="#e05c5c" icon={<GraduationCap size={15} />} />
        </div>
      )}

      {/* Integration Class sub-bar */}
      {stats?.integrationClass && (
        <div
          className="rounded-xl p-4 fade-up"
          style={{
            background: 'var(--bg-card, rgba(255,255,255,0.04))',
            border: '1px solid var(--bg-border, rgba(255,255,255,0.08))',
          }}
        >
          <p className="text-xs font-semibold text-text-muted mb-3 uppercase tracking-wide">
            Integration Class Breakdown
          </p>
          <div className="flex flex-wrap gap-4">
            {[
              { label: 'Enrolled',  value: stats.integrationClass.enrolled,  color: '#5c9ee0' },
              { label: 'Active',    value: stats.integrationClass.active,    color: '#5ce08a' },
              { label: 'Graduated', value: stats.integrationClass.graduated, color: '#DAA520' },
              { label: 'Dropped',   value: stats.integrationClass.dropped,   color: '#e05c5c' },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                <span className="text-sm font-semibold" style={{ color: s.color }}>{s.value}</span>
                <span className="text-xs text-text-muted">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        <TabButton label="Programs"    icon={<BookOpen size={14} />}      active={tab === 'programs'}    onClick={() => setTab('programs')}    />
        <TabButton label="Cohorts"     icon={<Users size={14} />}         active={tab === 'cohorts'}     onClick={() => setTab('cohorts')}     />
        <TabButton label="Mentorships" icon={<Heart size={14} />}         active={tab === 'mentorships'} onClick={() => setTab('mentorships')} />
      </div>

      {/* Tab Content */}
      <div className="fade-up" key={tab}>
        {tab === 'programs'    && <ProgramsTab    />}
        {tab === 'cohorts'     && <CohortsTab     />}
        {tab === 'mentorships' && <MentorshipsTab />}
      </div>
    </div>
  );
}
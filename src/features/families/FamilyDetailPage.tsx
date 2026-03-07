import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  ArrowLeft, Crown, Shield, Users, Activity,
  HandHeart, Megaphone, Plus, Trash2, CheckCircle,
  Circle, MapPin, Calendar, Pin, Search, X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import Avatar from '../../components/ui/Avatar';
import StatusBadge from '../../components/ui/StatusBadge';
import Modal from '../../components/ui/Modal';
import { PageLoader } from '../../components/ui/Spinner';
import type { Member } from '../../types';

// ── Types ─────────────────────────────────────────────────────────────────────
interface FamilyMember {
  _id: string; firstName: string; lastName: string;
  membershipId: string; photoUrl?: string; status: string;
}
interface FamilyActivity {
  _id: string; title: string; type: string; description?: string;
  date: string; location?: string; attendeeCount: number; notes?: string;
}
interface PrayerRequest {
  _id: string; request: string; isAnswered: boolean;
  answeredNote?: string; isPrivate: boolean; createdAt: string;
  requestedBy?: { firstName: string; lastName: string; photoUrl?: string };
}
interface Announcement {
  _id: string; title: string; body: string; isPinned: boolean;
  expiresAt?: string; createdAt: string;
  postedBy?: { firstName: string; lastName: string; photoUrl?: string };
}
interface Family {
  _id: string; familyName: string; address?: string; city?: string;
  state?: string; notes?: string;
  headId?: { _id: string; firstName: string; lastName: string; photoUrl?: string; membershipId: string; phone?: string; email?: string };
  assistantHeadId?: { _id: string; firstName: string; lastName: string; photoUrl?: string };
  spouseId?: { _id: string; firstName: string; lastName: string; photoUrl?: string };
  members: FamilyMember[];
  activities: FamilyActivity[];
  prayerRequests: PrayerRequest[];
  announcements: Announcement[];
}

const ACTIVITY_TYPES: Record<string, { label: string; color: string }> = {
  outreach:       { label: 'Outreach',       color: '#5c9ee0' },
  get_together:   { label: 'Get Together',   color: '#DAA520' },
  prayer_meeting: { label: 'Prayer Meeting', color: '#c05ce0' },
  bible_study:    { label: 'Bible Study',    color: '#5ce08a' },
  picnic:         { label: 'Picnic',         color: '#e08a5c' },
  fundraiser:     { label: 'Fundraiser',     color: '#e05c5c' },
  other:          { label: 'Other',          color: '#888' },
};

function fmt(date?: string) {
  if (!date) return '—';
  try { return format(new Date(date), 'dd MMM yyyy'); } catch { return '—'; }
}

function Tab({ label, icon, active, count, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-150"
      style={active
        ? { background: 'rgba(218,165,32,0.12)', color: '#DAA520', border: '1px solid rgba(218,165,32,0.25)' }
        : { color: 'var(--text-muted)', border: '1px solid transparent' }
      }
    >
      {icon}
      {label}
      {count > 0 && (
        <span
          className="text-xs px-1.5 py-0.5 rounded-full font-bold"
          style={active
            ? { background: 'rgba(218,165,32,0.2)', color: '#DAA520' }
            : { background: 'rgba(255,255,255,0.08)', color: 'var(--text-muted)' }
          }
        >
          {count}
        </span>
      )}
    </button>
  );
}

// ── Member Search Picker (inline, no dropdown — full list with search bar) ────
function MemberSearchPicker({
  members,
  existingMemberIds,
  onSelect,
}: {
  members: Member[];
  existingMemberIds: string[];
  onSelect: (member: Member) => void;
}) {
  const [search, setSearch] = useState('');

  const filtered = members.filter((m) => {
    // Hide already-in-family members
    if (existingMemberIds.includes(m._id)) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      m.firstName.toLowerCase().includes(q) ||
      m.lastName.toLowerCase().includes(q) ||
      (m.membershipId || '').toLowerCase().includes(q) ||
      (m.phone || '').includes(q)
    );
  });

  return (
    <div className="space-y-3">
      {/* Search input */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
        style={{ background: 'var(--bg-hover, rgba(255,255,255,0.05))', border: '1px solid var(--bg-border)' }}
      >
        <Search size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        <input
          autoFocus
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, ID or phone..."
          className="flex-1 bg-transparent text-sm outline-none"
          style={{ color: 'var(--text-primary)' }}
        />
        {search && (
          <button type="button" onClick={() => setSearch('')} style={{ color: 'var(--text-muted)' }}>
            <X size={12} />
          </button>
        )}
      </div>

      {/* Results list */}
      <div
        className="rounded-xl overflow-hidden overflow-y-auto"
        style={{
          maxHeight: 280,
          border: '1px solid var(--bg-border)',
          background: 'var(--bg-card)',
        }}
      >
        {filtered.length === 0 ? (
          <p className="px-4 py-6 text-sm text-center" style={{ color: 'var(--text-muted)' }}>
            {search ? 'No members match your search' : 'All members are already in this family'}
          </p>
        ) : (
          filtered.slice(0, 30).map((m) => (
            <button
              key={m._id}
              type="button"
              onClick={() => onSelect(m)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/5"
              style={{ borderBottom: '1px solid var(--bg-border, rgba(255,255,255,0.04))' }}
            >
              <Avatar
                name={`${m.firstName} ${m.lastName}`}
                photoUrl={m.photoUrl}
                size="sm"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                  {m.firstName} {m.lastName}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {m.membershipId}{m.phone ? ` · ${m.phone}` : ''}
                </p>
              </div>
              <StatusBadge status={m.status} size="sm" />
            </button>
          ))
        )}
      </div>

      {filtered.length > 30 && (
        <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
          Showing 30 of {filtered.length} — refine your search
        </p>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function FamilyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState<'members' | 'activities' | 'prayer' | 'announcements'>('members');

  const [showActivityForm, setShowActivityForm] = useState(false);
  const [showPrayerForm, setShowPrayerForm] = useState(false);
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);

  const [activityForm, setActivityForm] = useState({ title: '', type: 'get_together', description: '', date: '', location: '', notes: '' });
  const [prayerForm, setPrayerForm] = useState({ request: '', isPrivate: false });
  const [announcementForm, setAnnouncementForm] = useState({ title: '', body: '', isPinned: false, expiresAt: '' });

  const { data: family, isLoading } = useQuery<Family>({
    queryKey: ['family', id],
    queryFn: async () => {
      const res = await api.get(`/families/${id}`);
      return res.data.data as Family;
    },
    enabled: !!id,
  });

  // All members for the picker (only fetched when add modal is open)
  const { data: allMembers = [] } = useQuery<Member[]>({
    queryKey: ['members-dropdown'],
    queryFn: async () => {
      const res = await api.get('/members?limit=200');
      return res.data.data as Member[];
    },
    enabled: showAddMember,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['family', id] });

  const addActivity = useMutation({
    mutationFn: (data: any) => api.post(`/families/${id}/activities`, data),
    onSuccess: () => { toast.success('Activity logged!'); setShowActivityForm(false); setActivityForm({ title: '', type: 'get_together', description: '', date: '', location: '', notes: '' }); invalidate(); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const removeActivity = useMutation({
    mutationFn: (actId: string) => api.delete(`/families/${id}/activities/${actId}`),
    onSuccess: () => { toast.success('Activity removed'); invalidate(); },
  });

  const addPrayer = useMutation({
    mutationFn: (data: any) => api.post(`/families/${id}/prayer-requests`, data),
    onSuccess: () => { toast.success('Prayer request added!'); setShowPrayerForm(false); setPrayerForm({ request: '', isPrivate: false }); invalidate(); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const markPrayerAnswered = useMutation({
    mutationFn: ({ reqId, isAnswered }: { reqId: string; isAnswered: boolean }) =>
      api.patch(`/families/${id}/prayer-requests/${reqId}`, { isAnswered }),
    onSuccess: () => { toast.success('Updated!'); invalidate(); },
  });

  const addAnnouncement = useMutation({
    mutationFn: (data: any) => api.post(`/families/${id}/announcements`, data),
    onSuccess: () => { toast.success('Announcement posted!'); setShowAnnouncementForm(false); setAnnouncementForm({ title: '', body: '', isPinned: false, expiresAt: '' }); invalidate(); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const removeAnnouncement = useMutation({
    mutationFn: (annId: string) => api.delete(`/families/${id}/announcements/${annId}`),
    onSuccess: () => { toast.success('Announcement removed'); invalidate(); },
  });

  const addMember = useMutation({
    mutationFn: (memberId: string) => api.post(`/families/${id}/members/${memberId}`),
    onSuccess: (_, memberId) => {
      const m = allMembers.find((x) => x._id === memberId);
      toast.success(`${m ? m.firstName + ' ' + m.lastName : 'Member'} added to family!`);
      setShowAddMember(false);
      invalidate();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const removeMember = useMutation({
    mutationFn: (memberId: string) => api.delete(`/families/${id}/members/${memberId}`),
    onSuccess: () => { toast.success('Member removed'); invalidate(); },
  });

  if (isLoading) return <PageLoader />;
  if (!family) return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
      <p className="text-text-muted">Family not found.</p>
      <button onClick={() => navigate('/families')} className="btn-ghost flex items-center gap-2">
        <ArrowLeft size={16} /> Back to Families
      </button>
    </div>
  );

  const existingMemberIds = family.members?.map((m) => m._id) ?? [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .slide-up { animation: slideUp 0.3s ease both; }
        .prayer-card { transition: all 0.2s ease; }
        .prayer-card:hover { background: rgba(255,255,255,0.04); }
      `}</style>

      <button
        onClick={() => navigate('/families')}
        className="flex items-center gap-2 text-sm transition-opacity hover:opacity-70"
        style={{ color: 'var(--text-muted)' }}
      >
        <ArrowLeft size={16} /> Back to Families
      </button>

      {/* Hero */}
      <div className="slide-up rounded-2xl p-6" style={{ background: 'var(--bg-card, rgba(255,255,255,0.04))', border: '1px solid var(--bg-border, rgba(255,255,255,0.08))' }}>
        <div className="flex flex-col sm:flex-row gap-5">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold flex-shrink-0"
            style={{ background: 'rgba(218,165,32,0.12)', color: '#DAA520', border: '1px solid rgba(218,165,32,0.2)' }}>
            {family.familyName.charAt(0)}
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <h1 className="font-display font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>{family.familyName}</h1>
              {(family.city || family.address) && (
                <p className="flex items-center gap-1.5 text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                  <MapPin size={13} /> {[family.address, family.city, family.state].filter(Boolean).join(', ')}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-4">
              {family.headId && (
                <div className="flex items-center gap-2">
                  <Crown size={13} style={{ color: '#DAA520' }} />
                  <Avatar name={`${family.headId.firstName} ${family.headId.lastName}`} photoUrl={family.headId.photoUrl} size="xs" />
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{family.headId.firstName} {family.headId.lastName}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(218,165,32,0.1)', color: '#DAA520' }}>Head</span>
                </div>
              )}
              {family.assistantHeadId && (
                <div className="flex items-center gap-2">
                  <Shield size={13} style={{ color: '#5c9ee0' }} />
                  <Avatar name={`${family.assistantHeadId.firstName} ${family.assistantHeadId.lastName}`} photoUrl={family.assistantHeadId.photoUrl} size="xs" />
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{family.assistantHeadId.firstName} {family.assistantHeadId.lastName}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(92,158,224,0.1)', color: '#5c9ee0' }}>Assistant</span>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              {[
                { label: `${family.members?.length ?? 0} Members`, color: '#DAA520' },
                { label: `${family.activities?.length ?? 0} Activities`, color: '#5c9ee0' },
                { label: `${family.prayerRequests?.filter(p => !p.isAnswered).length ?? 0} Open Prayers`, color: '#c05ce0' },
                { label: `${family.announcements?.length ?? 0} Announcements`, color: '#5ce08a' },
              ].map((s, i) => (
                <span key={i} className="text-xs px-2.5 py-1 rounded-full font-medium"
                  style={{ background: `${s.color}14`, color: s.color, border: `1px solid ${s.color}28` }}>
                  {s.label}
                </span>
              ))}
            </div>
          </div>
        </div>
        {family.notes && (
          <div className="mt-4 p-3 rounded-xl text-sm"
            style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--text-secondary)', border: '1px solid var(--bg-border)' }}>
            {family.notes}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        <Tab label="Members" icon={<Users size={14} />} active={tab === 'members'} count={family.members?.length ?? 0} onClick={() => setTab('members')} />
        <Tab label="Activities" icon={<Activity size={14} />} active={tab === 'activities'} count={family.activities?.length ?? 0} onClick={() => setTab('activities')} />
        <Tab label="Prayer Requests" icon={<HandHeart size={14} />} active={tab === 'prayer'} count={family.prayerRequests?.filter(p => !p.isAnswered).length ?? 0} onClick={() => setTab('prayer')} />
        <Tab label="Announcements" icon={<Megaphone size={14} />} active={tab === 'announcements'} count={family.announcements?.length ?? 0} onClick={() => setTab('announcements')} />
      </div>

      {/* MEMBERS */}
      {tab === 'members' && (
        <div className="slide-up space-y-3">
          <div className="flex justify-end">
            <button onClick={() => setShowAddMember(true)} className="btn-gold flex items-center gap-2 text-sm">
              <Plus size={14} /> Add Member
            </button>
          </div>
          {(family.members?.length ?? 0) === 0 ? (
            <p className="text-center py-8 text-text-muted">No members yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {family.members?.map((m) => (
                <div key={m._id} className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-border)' }}>
                  <Avatar name={`${m.firstName} ${m.lastName}`} photoUrl={m.photoUrl} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>{m.firstName} {m.lastName}</p>
                    <p className="text-xs font-mono" style={{ color: '#DAA520' }}>{m.membershipId}</p>
                  </div>
                  <StatusBadge status={m.status} size="sm" />
                  <button onClick={() => removeMember.mutate(m._id)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-text-muted hover:text-red-400 transition-colors flex-shrink-0">
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ACTIVITIES */}
      {tab === 'activities' && (
        <div className="slide-up space-y-3">
          <div className="flex justify-end">
            <button onClick={() => setShowActivityForm(true)} className="btn-gold flex items-center gap-2 text-sm">
              <Plus size={14} /> Log Activity
            </button>
          </div>
          {(family.activities?.length ?? 0) === 0 ? (
            <p className="text-center py-8 text-text-muted">No activities logged yet.</p>
          ) : (
            <div className="space-y-3">
              {[...family.activities].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((act) => {
                const typeInfo = ACTIVITY_TYPES[act.type] || ACTIVITY_TYPES.other;
                return (
                  <div key={act._id} className="p-4 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-border)' }}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ background: `${typeInfo.color}14`, color: typeInfo.color, border: `1px solid ${typeInfo.color}28` }}>
                            {typeInfo.label}
                          </span>
                          <h4 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{act.title}</h4>
                        </div>
                        {act.description && <p className="text-xs mt-1.5" style={{ color: 'var(--text-secondary)' }}>{act.description}</p>}
                        <div className="flex flex-wrap gap-3 mt-2">
                          <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}><Calendar size={11} /> {fmt(act.date)}</span>
                          {act.location && <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}><MapPin size={11} /> {act.location}</span>}
                          {act.attendeeCount > 0 && <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}><Users size={11} /> {act.attendeeCount} attended</span>}
                        </div>
                        {act.notes && <p className="text-xs mt-2 italic" style={{ color: 'var(--text-muted)' }}>{act.notes}</p>}
                      </div>
                      <button onClick={() => removeActivity.mutate(act._id)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-text-muted hover:text-red-400 transition-colors flex-shrink-0">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* PRAYER REQUESTS */}
      {tab === 'prayer' && (
        <div className="slide-up space-y-3">
          <div className="flex justify-end">
            <button onClick={() => setShowPrayerForm(true)} className="btn-gold flex items-center gap-2 text-sm">
              <Plus size={14} /> Add Prayer Request
            </button>
          </div>
          {(family.prayerRequests?.length ?? 0) === 0 ? (
            <p className="text-center py-8 text-text-muted">No prayer requests yet.</p>
          ) : (
            <div className="space-y-2">
              {family.prayerRequests.map((pr) => (
                <div key={pr._id} className="prayer-card p-4 rounded-xl flex items-start gap-3"
                  style={{ background: pr.isAnswered ? 'rgba(34,197,94,0.04)' : 'var(--bg-card)', border: pr.isAnswered ? '1px solid rgba(34,197,94,0.15)' : '1px solid var(--bg-border)' }}>
                  <button onClick={() => markPrayerAnswered.mutate({ reqId: pr._id, isAnswered: !pr.isAnswered })}
                    className="mt-0.5 flex-shrink-0 transition-colors" style={{ color: pr.isAnswered ? '#22c55e' : 'var(--text-muted)' }}>
                    {pr.isAnswered ? <CheckCircle size={16} /> : <Circle size={16} />}
                  </button>
                  <div className="flex-1">
                    <p className="text-sm" style={{ color: pr.isAnswered ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: pr.isAnswered ? 'line-through' : 'none' }}>
                      {pr.request}
                    </p>
                    {pr.answeredNote && <p className="text-xs mt-1 italic" style={{ color: '#22c55e' }}>✓ {pr.answeredNote}</p>}
                    <div className="flex items-center gap-2 mt-1.5">
                      {pr.requestedBy && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{pr.requestedBy.firstName} {pr.requestedBy.lastName}</span>}
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{fmt(pr.createdAt)}</span>
                      {pr.isPrivate && <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)' }}>Private</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ANNOUNCEMENTS */}
      {tab === 'announcements' && (
        <div className="slide-up space-y-3">
          <div className="flex justify-end">
            <button onClick={() => setShowAnnouncementForm(true)} className="btn-gold flex items-center gap-2 text-sm">
              <Plus size={14} /> Post Announcement
            </button>
          </div>
          {(family.announcements?.length ?? 0) === 0 ? (
            <p className="text-center py-8 text-text-muted">No announcements yet.</p>
          ) : (
            <div className="space-y-3">
              {[...family.announcements].sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0)).map((ann) => {
                const expired = ann.expiresAt && new Date(ann.expiresAt) < new Date();
                return (
                  <div key={ann._id} className="p-4 rounded-xl"
                    style={{ background: expired ? 'rgba(255,255,255,0.02)' : 'var(--bg-card)', border: ann.isPinned ? '1px solid rgba(218,165,32,0.3)' : '1px solid var(--bg-border)', opacity: expired ? 0.6 : 1 }}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          {ann.isPinned && <Pin size={12} style={{ color: '#DAA520' }} />}
                          <h4 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{ann.title}</h4>
                          {expired && <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>Expired</span>}
                        </div>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{ann.body}</p>
                        <div className="flex gap-3 mt-2">
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            Posted {fmt(ann.createdAt)}{ann.postedBy && ` by ${ann.postedBy.firstName} ${ann.postedBy.lastName}`}
                          </span>
                          {ann.expiresAt && !expired && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Expires {fmt(ann.expiresAt)}</span>}
                        </div>
                      </div>
                      <button onClick={() => removeAnnouncement.mutate(ann._id)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-text-muted hover:text-red-400 transition-colors flex-shrink-0">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Modals ── */}

      {/* Log Activity */}
      <Modal isOpen={showActivityForm} onClose={() => setShowActivityForm(false)} title="Log Activity" size="md">
        <div className="space-y-4">
          <div className="form-field">
            <label className="label">Title *</label>
            <input className="input" value={activityForm.title} onChange={e => setActivityForm(p => ({ ...p, title: e.target.value }))} placeholder="Family Outreach at Surulere" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-field">
              <label className="label">Type</label>
              <select className="input" value={activityForm.type} onChange={e => setActivityForm(p => ({ ...p, type: e.target.value }))}>
                {Object.entries(ACTIVITY_TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label className="label">Date *</label>
              <input type="date" className="input" value={activityForm.date} onChange={e => setActivityForm(p => ({ ...p, date: e.target.value }))} />
            </div>
          </div>
          <div className="form-field">
            <label className="label">Location</label>
            <input className="input" value={activityForm.location} onChange={e => setActivityForm(p => ({ ...p, location: e.target.value }))} placeholder="Lagos Island" />
          </div>
          <div className="form-field">
            <label className="label">Description</label>
            <textarea className="input resize-none h-16" value={activityForm.description} onChange={e => setActivityForm(p => ({ ...p, description: e.target.value }))} placeholder="Brief description..." />
          </div>
          <div className="form-field">
            <label className="label">Notes</label>
            <textarea className="input resize-none h-16" value={activityForm.notes} onChange={e => setActivityForm(p => ({ ...p, notes: e.target.value }))} placeholder="Any extra notes..." />
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowActivityForm(false)} className="btn-ghost">Cancel</button>
            <button onClick={() => addActivity.mutate(activityForm)} disabled={!activityForm.title || !activityForm.date || addActivity.isPending} className="btn-gold">
              {addActivity.isPending ? 'Saving...' : 'Log Activity'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Prayer Request */}
      <Modal isOpen={showPrayerForm} onClose={() => setShowPrayerForm(false)} title="Add Prayer Request" size="sm">
        <div className="space-y-4">
          <div className="form-field">
            <label className="label">Prayer Request *</label>
            <textarea className="input resize-none h-24" value={prayerForm.request} onChange={e => setPrayerForm(p => ({ ...p, request: e.target.value }))} placeholder="Share the prayer request..." />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={prayerForm.isPrivate} onChange={e => setPrayerForm(p => ({ ...p, isPrivate: e.target.checked }))} className="accent-yellow-500" />
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Private (only leaders can see)</span>
          </label>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowPrayerForm(false)} className="btn-ghost">Cancel</button>
            <button onClick={() => addPrayer.mutate(prayerForm)} disabled={!prayerForm.request || addPrayer.isPending} className="btn-gold">
              {addPrayer.isPending ? 'Saving...' : 'Add Request'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Post Announcement */}
      <Modal isOpen={showAnnouncementForm} onClose={() => setShowAnnouncementForm(false)} title="Post Announcement" size="md">
        <div className="space-y-4">
          <div className="form-field">
            <label className="label">Title *</label>
            <input className="input" value={announcementForm.title} onChange={e => setAnnouncementForm(p => ({ ...p, title: e.target.value }))} placeholder="Monthly Get-Together" />
          </div>
          <div className="form-field">
            <label className="label">Message *</label>
            <textarea className="input resize-none h-24" value={announcementForm.body} onChange={e => setAnnouncementForm(p => ({ ...p, body: e.target.value }))} placeholder="Write the announcement..." />
          </div>
          <div className="grid grid-cols-2 gap-4 items-center">
            <div className="form-field">
              <label className="label">Expires On (optional)</label>
              <input type="date" className="input" value={announcementForm.expiresAt} onChange={e => setAnnouncementForm(p => ({ ...p, expiresAt: e.target.value }))} />
            </div>
            <label className="flex items-center gap-2 cursor-pointer mt-4">
              <input type="checkbox" checked={announcementForm.isPinned} onChange={e => setAnnouncementForm(p => ({ ...p, isPinned: e.target.checked }))} className="accent-yellow-500" />
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Pin this announcement</span>
            </label>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowAnnouncementForm(false)} className="btn-ghost">Cancel</button>
            <button onClick={() => addAnnouncement.mutate(announcementForm)} disabled={!announcementForm.title || !announcementForm.body || addAnnouncement.isPending} className="btn-gold">
              {addAnnouncement.isPending ? 'Posting...' : 'Post Announcement'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Add Member Modal — searchable ── */}
      <Modal isOpen={showAddMember} onClose={() => setShowAddMember(false)} title="Add Member to Family" size="md">
        <div className="space-y-3">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Search by name, membership ID or phone number and click to add.
          </p>
          <MemberSearchPicker
            members={allMembers}
            existingMemberIds={existingMemberIds}
            onSelect={(m) => addMember.mutate(m._id)}
          />
          {addMember.isPending && (
            <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>Adding member...</p>
          )}
        </div>
      </Modal>
    </div>
  );
}
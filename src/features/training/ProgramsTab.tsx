/**
 * ChurchOS — src/features/training/ProgramsTab.tsx
 * Color scheme: Logo Navy #1A56A0 + Gold #D4A93B + Sky #1E90FF
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, BookOpen, Pencil, Trash2, ChevronDown, ChevronUp,
  CheckCircle, XCircle, GraduationCap,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import Modal from '../../components/ui/Modal';
import { PageLoader } from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import type { TrainingProgram, ProgramType, CurriculumItem } from '../../types/training.types';

// ── Color Palette (Church Logo) ──────────────────────────────────────────────
const COLORS = {
  navy: '#1A56A0',      // Primary: Book spine blue
  skyBlue: '#1E90FF',   // Secondary: Lighter blue accent
  gold: '#D4A93B',      // Accent: Logo gold
  darkNavy: '#0A1628',  // Dark background tone
  lightNavy: '#2563EB', // Light navy for variations
};

// ── Constants ─────────────────────────────────────────────────────────────────
const PROGRAM_TYPES: Record<ProgramType, { label: string; color: string }> = {
  integration_class:  { label: 'Integration Class',  color: COLORS.gold },
  discipleship_track: { label: 'Discipleship Track', color: COLORS.navy },
  bible_study:        { label: 'Bible Study',         color: COLORS.skyBlue },
  leadership:         { label: 'Leadership',          color: COLORS.lightNavy },
  marriage_prep:      { label: 'Marriage Prep',       color: '#8B5CF6' }, // Purple accent
  other:              { label: 'Other',               color: '#6B7280' },
};

// ── Form State ────────────────────────────────────────────────────────────────
interface ProgramForm {
  name: string;
  type: ProgramType;
  description: string;
  durationWeeks: string;
  sessionsPerWeek: string;
  promoteOnCompletion: boolean;
  promoteToStatus: string;
  curriculum: CurriculumItem[];
}

const EMPTY_FORM: ProgramForm = {
  name: '', type: 'integration_class', description: '',
  durationWeeks: '', sessionsPerWeek: '1',
  promoteOnCompletion: false, promoteToStatus: '',
  curriculum: [],
};

// ── Program Card ──────────────────────────────────────────────────────────────
function ProgramCard({
  program, onEdit, onDelete, onClick,
}: { program: TrainingProgram; onEdit: () => void; onDelete: () => void; onClick: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const typeInfo = PROGRAM_TYPES[program.type] || PROGRAM_TYPES.other;

  return (
    <div
      className="rounded-2xl overflow-hidden cursor-pointer group"
      style={{
        background: 'linear-gradient(135deg, rgba(26, 86, 160, 0.06) 0%, rgba(30, 144, 255, 0.03) 100%)',
        border: `1.5px solid ${COLORS.navy}20`,
        transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = `${COLORS.navy}50`;
        (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 24px ${COLORS.navy}20`;
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = `${COLORS.navy}20`;
        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
      }}
    >
      <div className="h-1.5 w-full" style={{ background: typeInfo.color }} />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span
                className="text-xs px-3 py-1 rounded-full font-semibold"
                style={{ 
                  background: `${typeInfo.color}12`, 
                  color: typeInfo.color, 
                  border: `1px solid ${typeInfo.color}40` 
                }}
              >
                {typeInfo.label}
              </span>
              {!program.isActive && (
                <span 
                  className="text-xs px-3 py-1 rounded-full font-medium" 
                  style={{ background: `${COLORS.navy}08`, color: `${COLORS.navy}80` }}
                >
                  Inactive
                </span>
              )}
            </div>
            <h3 
              className="font-display font-bold text-base leading-tight" 
              style={{ color: COLORS.darkNavy }}
            >
              {program.name}
            </h3>
            {program.description && (
              <p 
                className="text-xs mt-2 line-clamp-2" 
                style={{ color: `${COLORS.navy}75` }}
              >
                {program.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="w-8 h-8 flex items-center justify-center rounded-lg transition-all"
              style={{ 
                background: `${COLORS.navy}08`,
                color: COLORS.navy,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = `${COLORS.navy}15`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = `${COLORS.navy}08`;
              }}
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="w-8 h-8 flex items-center justify-center rounded-lg transition-all"
              style={{ 
                background: '#EF444420',
                color: '#EF4444',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = '#EF444430';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = '#EF444420';
              }}
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* Meta pills */}
        <div className="flex flex-wrap gap-2 mt-3">
          {program.durationWeeks && (
            <span 
              className="text-xs px-2.5 py-1 rounded-lg font-medium"
              style={{ background: `${COLORS.navy}08`, color: COLORS.navy }}
            >
              {program.durationWeeks} weeks
            </span>
          )}
          {program.totalSessions && (
            <span 
              className="text-xs px-2.5 py-1 rounded-lg font-medium"
              style={{ background: `${COLORS.navy}08`, color: COLORS.navy }}
            >
              {program.totalSessions} sessions
            </span>
          )}
          {program.cohortCount !== undefined && (
            <span 
              className="text-xs px-2.5 py-1 rounded-lg font-medium"
              style={{ background: `${COLORS.skyBlue}12`, color: COLORS.skyBlue }}
            >
              {program.cohortCount} cohort{program.cohortCount !== 1 ? 's' : ''}
            </span>
          )}
          {program.promoteOnCompletion && (
            <span 
              className="text-xs px-2.5 py-1 rounded-lg flex items-center gap-1 font-medium"
              style={{ background: `${COLORS.gold}15`, color: COLORS.gold }}
            >
              <GraduationCap size={10} /> Promotes to {program.promoteToStatus || 'member'}
            </span>
          )}
        </div>

        {/* Curriculum toggle */}
        {program.curriculum?.length > 0 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
              className="flex items-center gap-1.5 text-xs mt-3 transition-opacity hover:opacity-70 font-semibold"
              style={{ color: typeInfo.color }}
            >
              {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              {expanded ? 'Hide' : 'View'} Curriculum ({program.curriculum.length} weeks)
            </button>
            {expanded && (
              <div className="mt-3 space-y-2">
                {program.curriculum.map((c) => (
                  <div
                    key={c.week}
                    className="flex items-start gap-3 p-3 rounded-lg"
                    style={{ background: `${COLORS.navy}06`, border: `1px solid ${COLORS.navy}15` }}
                  >
                    <span
                      className="text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full flex-shrink-0"
                      style={{ background: typeInfo.color, color: '#FFF' }}
                    >
                      {c.week}
                    </span>
                    <div className="flex-1">
                      <p className="text-xs font-semibold" style={{ color: COLORS.darkNavy }}>{c.topic}</p>
                      {c.description && (
                        <p className="text-xs mt-1" style={{ color: `${COLORS.navy}70` }}>
                          {c.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Program Form Modal ────────────────────────────────────────────────────────
function ProgramFormModal({
  isOpen, onClose, initial, onSuccess,
}: { isOpen: boolean; onClose: () => void; initial?: TrainingProgram; onSuccess: () => void }) {
  const isEdit = !!initial;
  const [form, setForm] = useState<ProgramForm>(
    initial
      ? {
          name: initial.name, type: initial.type, description: initial.description || '',
          durationWeeks: initial.durationWeeks?.toString() || '',
          sessionsPerWeek: initial.sessionsPerWeek?.toString() || '1',
          promoteOnCompletion: initial.promoteOnCompletion,
          promoteToStatus: initial.promoteToStatus || '',
          curriculum: initial.curriculum || [],
        }
      : { ...EMPTY_FORM },
  );
  const [curriculumInput, setCurriculumInput] = useState({ week: '', topic: '', description: '' });

  const set = (k: keyof ProgramForm, v: any) => setForm((p) => ({ ...p, [k]: v }));

  const addWeek = () => {
    if (!curriculumInput.week || !curriculumInput.topic) return;
    set('curriculum', [
      ...form.curriculum,
      { week: Number(curriculumInput.week), topic: curriculumInput.topic, description: curriculumInput.description },
    ].sort((a, b) => a.week - b.week));
    setCurriculumInput({ week: '', topic: '', description: '' });
  };

  const removeWeek = (idx: number) => set('curriculum', form.curriculum.filter((_, i) => i !== idx));

  const mutation = useMutation({
    mutationFn: (data: any) =>
      isEdit ? api.patch(`/training/programs/${initial!._id}`, data) : api.post('/training/programs', data),
    onSuccess: () => {
      toast.success(isEdit ? 'Program updated' : 'Program created');
      onSuccess();
      onClose();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const submit = () => {
    if (!form.name) { toast.error('Program name is required'); return; }
    mutation.mutate({
      ...form,
      durationWeeks: form.durationWeeks ? Number(form.durationWeeks) : undefined,
      sessionsPerWeek: Number(form.sessionsPerWeek),
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Program' : 'Create Program'} size="lg">
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
        <div className="grid grid-cols-2 gap-4">
          <div className="form-field col-span-2">
            <label className="label" style={{ color: COLORS.navy }}>Program Name *</label>
            <input 
              className="input" 
              style={{ borderColor: `${COLORS.navy}25`, color: COLORS.darkNavy }}
              value={form.name} 
              onChange={(e) => set('name', e.target.value)} 
              placeholder="e.g. New Believers Class" 
            />
          </div>
          <div className="form-field">
            <label className="label" style={{ color: COLORS.navy }}>Type</label>
            <select 
              className="input" 
              style={{ borderColor: `${COLORS.navy}25`, color: COLORS.darkNavy }}
              value={form.type} 
              onChange={(e) => set('type', e.target.value as ProgramType)}
            >
              {Object.entries(PROGRAM_TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label className="label" style={{ color: COLORS.navy }}>Sessions / Week</label>
            <input 
              type="number" 
              min={1} 
              className="input" 
              style={{ borderColor: `${COLORS.navy}25`, color: COLORS.darkNavy }}
              value={form.sessionsPerWeek} 
              onChange={(e) => set('sessionsPerWeek', e.target.value)} 
            />
          </div>
          <div className="form-field">
            <label className="label" style={{ color: COLORS.navy }}>Duration (weeks)</label>
            <input 
              type="number" 
              min={1} 
              className="input" 
              style={{ borderColor: `${COLORS.navy}25`, color: COLORS.darkNavy }}
              value={form.durationWeeks} 
              onChange={(e) => set('durationWeeks', e.target.value)} 
              placeholder="e.g. 6" 
            />
          </div>
        </div>

        <div className="form-field">
          <label className="label" style={{ color: COLORS.navy }}>Description</label>
          <textarea 
            className="input resize-none h-16" 
            style={{ borderColor: `${COLORS.navy}25`, color: COLORS.darkNavy }}
            value={form.description} 
            onChange={(e) => set('description', e.target.value)} 
            placeholder="What is this program about?" 
          />
        </div>

        {/* Promotion */}
        <div 
          className="p-4 rounded-xl space-y-3" 
          style={{ background: `${COLORS.navy}08`, border: `1px solid ${COLORS.navy}20` }}
        >
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              style={{ accentColor: COLORS.gold }}
              checked={form.promoteOnCompletion} 
              onChange={(e) => set('promoteOnCompletion', e.target.checked)} 
            />
            <span className="text-sm font-medium" style={{ color: COLORS.navy }}>
              Auto-promote member on graduation
            </span>
          </label>
          {form.promoteOnCompletion && (
            <div className="form-field">
              <label className="label" style={{ color: COLORS.navy }}>Promote to Status</label>
              <input 
                className="input" 
                style={{ borderColor: `${COLORS.navy}25`, color: COLORS.darkNavy }}
                value={form.promoteToStatus} 
                onChange={(e) => set('promoteToStatus', e.target.value)} 
                placeholder="e.g. active" 
              />
            </div>
          )}
        </div>

        {/* Curriculum */}
        <div>
          <p className="label mb-3 font-semibold" style={{ color: COLORS.navy }}>Curriculum</p>
          <div className="space-y-2 mb-3">
            {form.curriculum.map((c, i) => (
              <div 
                key={i} 
                className="flex items-center gap-2 p-3 rounded-lg" 
                style={{ background: `${COLORS.navy}06`, border: `1px solid ${COLORS.navy}15` }}
              >
                <span 
                  className="text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full flex-shrink-0" 
                  style={{ background: COLORS.navy, color: '#FFF' }}
                >
                  {c.week}
                </span>
                <span className="flex-1 text-xs font-medium" style={{ color: COLORS.darkNavy }}>{c.topic}</span>
                <button 
                  onClick={() => removeWeek(i)} 
                  className="text-red-500 hover:text-red-600 transition-colors"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-12 gap-2">
            <input
              type="number" 
              min={1} 
              placeholder="Wk"
              className="input col-span-2 text-center" 
              style={{ borderColor: `${COLORS.navy}25`, color: COLORS.darkNavy }}
              value={curriculumInput.week}
              onChange={(e) => setCurriculumInput((p) => ({ ...p, week: e.target.value }))}
            />
            <input
              placeholder="Topic"
              className="input col-span-6" 
              style={{ borderColor: `${COLORS.navy}25`, color: COLORS.darkNavy }}
              value={curriculumInput.topic}
              onChange={(e) => setCurriculumInput((p) => ({ ...p, topic: e.target.value }))}
            />
            <input
              placeholder="Notes (optional)"
              className="input col-span-3" 
              style={{ borderColor: `${COLORS.navy}25`, color: COLORS.darkNavy }}
              value={curriculumInput.description}
              onChange={(e) => setCurriculumInput((p) => ({ ...p, description: e.target.value }))}
            />
            <button 
              onClick={addWeek} 
              className="col-span-1 flex items-center justify-center rounded-xl p-0 transition-all font-semibold text-white"
              style={{ background: COLORS.navy }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = COLORS.darkNavy;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = COLORS.navy;
              }}
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: `${COLORS.navy}15` }}>
        <button 
          onClick={onClose} 
          className="px-4 py-2 rounded-lg font-medium transition-all"
          style={{ background: `${COLORS.navy}08`, color: COLORS.navy }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = `${COLORS.navy}12`;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = `${COLORS.navy}08`;
          }}
        >
          Cancel
        </button>
        <button 
          onClick={submit} 
          disabled={mutation.isPending} 
          className="px-4 py-2 rounded-lg font-semibold transition-all text-white disabled:opacity-50"
          style={{ background: COLORS.gold }}
          onMouseEnter={(e) => {
            if (!mutation.isPending) {
              (e.currentTarget as HTMLElement).style.background = '#C39B2F';
            }
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = COLORS.gold;
          }}
        >
          {mutation.isPending ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Program'}
        </button>
      </div>
    </Modal>
  );
}

// ── Main Tab ──────────────────────────────────────────────────────────────────
export default function ProgramsTab() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<TrainingProgram | undefined>();
  const [deleting, setDeleting] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<ProgramType | 'all'>('all');

  const { data, isLoading } = useQuery<TrainingProgram[]>({
    queryKey: ['training-programs'],
    queryFn: async () => {
      const res = await api.get('/training/programs');
      return res.data.data as TrainingProgram[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/training/programs/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['training-programs'] });
      qc.invalidateQueries({ queryKey: ['training-stats'] });
      toast.success('Program deleted');
      setDeleting(null);
    },
    onError: () => toast.error('Failed to delete program'),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['training-programs'] });
    qc.invalidateQueries({ queryKey: ['training-stats'] });
  };

  const programs = (data ?? []).filter((p) => typeFilter === 'all' || p.type === typeFilter);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setTypeFilter('all')}
            className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all"
            style={typeFilter === 'all'
              ? { background: `${COLORS.navy}20`, color: COLORS.navy, border: `1px solid ${COLORS.navy}40` }
              : { background: `${COLORS.navy}08`, color: COLORS.navy, border: `1px solid ${COLORS.navy}20` }}
            onMouseEnter={(e) => {
              if (typeFilter !== 'all') {
                (e.currentTarget as HTMLElement).style.background = `${COLORS.navy}12`;
              }
            }}
            onMouseLeave={(e) => {
              if (typeFilter !== 'all') {
                (e.currentTarget as HTMLElement).style.background = `${COLORS.navy}08`;
              }
            }}
          >
            All
          </button>
          {Object.entries(PROGRAM_TYPES).map(([k, v]) => (
            <button
              key={k}
              onClick={() => setTypeFilter(k as ProgramType)}
              className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all"
              style={typeFilter === k
                ? { background: `${v.color}20`, color: v.color, border: `1px solid ${v.color}40` }
                : { background: `${v.color}08`, color: v.color, border: `1px solid ${v.color}20` }}
              onMouseEnter={(e) => {
                if (typeFilter !== k) {
                  (e.currentTarget as HTMLElement).style.background = `${v.color}12`;
                }
              }}
              onMouseLeave={(e) => {
                if (typeFilter !== k) {
                  (e.currentTarget as HTMLElement).style.background = `${v.color}08`;
                }
              }}
            >
              {v.label}
            </button>
          ))}
        </div>
        <button 
          onClick={() => { setEditing(undefined); setShowForm(true); }} 
          className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg font-semibold text-white transition-all"
          style={{ background: COLORS.gold }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = '#C39B2F';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = COLORS.gold;
          }}
        >
          <Plus size={14} /> New Program
        </button>
      </div>

      {/* List */}
      {isLoading ? (
        <PageLoader />
      ) : programs.length === 0 ? (
        <EmptyState
          icon="📚"
          title="No programs found"
          description={typeFilter === 'all' ? 'Create your first training program' : 'No programs for this type'}
          action={
            <button 
              onClick={() => setShowForm(true)} 
              className="px-4 py-2 rounded-lg font-semibold text-white transition-all"
              style={{ background: COLORS.gold }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = '#C39B2F';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = COLORS.gold;
              }}
            >
              Create Program
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {programs.map((p) => (
            <ProgramCard
              key={p._id}
              program={p}
              onClick={() => navigate(`/training/programs/${p._id}`)}
              onEdit={() => { setEditing(p); setShowForm(true); }}
              onDelete={() => setDeleting(p._id)}
            />
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <ProgramFormModal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditing(undefined); }}
        initial={editing}
        onSuccess={invalidate}
      />

      {/* Delete Confirm */}
      <Modal isOpen={!!deleting} onClose={() => setDeleting(null)} title="Delete Program" size="sm">
        <p className="text-text-secondary mb-5" style={{ color: COLORS.navy }}>
          This will soft-delete the program. Existing cohorts will be unaffected.
        </p>
        <div className="flex justify-end gap-3">
          <button 
            onClick={() => setDeleting(null)} 
            className="px-4 py-2 rounded-lg font-medium transition-all"
            style={{ background: `${COLORS.navy}08`, color: COLORS.navy }}
          >
            Cancel
          </button>
          <button
            onClick={() => deleting && deleteMutation.mutate(deleting)}
            disabled={deleteMutation.isPending}
            className="px-4 py-2 rounded-lg font-semibold text-white transition-all disabled:opacity-50"
            style={{ background: '#EF4444' }}
            onMouseEnter={(e) => {
              if (!deleteMutation.isPending) {
                (e.currentTarget as HTMLElement).style.background = '#DC2626';
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = '#EF4444';
            }}
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
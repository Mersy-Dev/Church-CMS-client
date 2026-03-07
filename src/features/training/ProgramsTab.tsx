/**
 * ChurchOS — src/features/training/ProgramsTab.tsx
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

// ── Constants ─────────────────────────────────────────────────────────────────
const PROGRAM_TYPES: Record<ProgramType, { label: string; color: string }> = {
  integration_class:  { label: 'Integration Class',  color: '#DAA520' },
  discipleship_track: { label: 'Discipleship Track', color: '#5c9ee0' },
  bible_study:        { label: 'Bible Study',         color: '#5ce08a' },
  leadership:         { label: 'Leadership',          color: '#c05ce0' },
  marriage_prep:      { label: 'Marriage Prep',       color: '#e08a5c' },
  other:              { label: 'Other',               color: '#888' },
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
      className="rounded-2xl overflow-hidden cursor-pointer"
      style={{
        background: 'var(--bg-card, rgba(255,255,255,0.04))',
        border: '1px solid var(--bg-border, rgba(255,255,255,0.08))',
        transition: 'box-shadow 0.2s, border-color 0.2s, transform 0.2s',
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(218,165,32,0.3)';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--bg-border, rgba(255,255,255,0.08))';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
      }}
    >
      <div className="h-1 w-full" style={{ background: typeInfo.color }} />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: `${typeInfo.color}18`, color: typeInfo.color, border: `1px solid ${typeInfo.color}28` }}
              >
                {typeInfo.label}
              </span>
              {!program.isActive && (
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
                  Inactive
                </span>
              )}
            </div>
            <h3 className="font-display font-bold text-base" style={{ color: 'var(--text-primary)' }}>{program.name}</h3>
            {program.description && (
              <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-muted)' }}>{program.description}</p>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-text-muted hover:text-text-primary transition-colors"
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-text-muted hover:text-red-400 transition-colors"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* Meta pills */}
        <div className="flex flex-wrap gap-2 mt-3">
          {program.durationWeeks && (
            <span className="text-xs px-2 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>
              {program.durationWeeks} weeks
            </span>
          )}
          {program.totalSessions && (
            <span className="text-xs px-2 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>
              {program.totalSessions} sessions
            </span>
          )}
          {program.cohortCount !== undefined && (
            <span className="text-xs px-2 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>
              {program.cohortCount} cohort{program.cohortCount !== 1 ? 's' : ''}
            </span>
          )}
          {program.promoteOnCompletion && (
            <span className="text-xs px-2 py-1 rounded-lg flex items-center gap-1" style={{ background: 'rgba(92,224,138,0.08)', color: '#5ce08a' }}>
              <GraduationCap size={10} /> Promotes to {program.promoteToStatus || 'member'}
            </span>
          )}
        </div>

        {/* Curriculum toggle */}
        {program.curriculum?.length > 0 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
              className="flex items-center gap-1.5 text-xs mt-3 transition-opacity hover:opacity-70"
              style={{ color: typeInfo.color }}
            >
              {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              {expanded ? 'Hide' : 'View'} Curriculum ({program.curriculum.length} weeks)
            </button>
            {expanded && (
              <div className="mt-3 space-y-1.5">
                {program.curriculum.map((c) => (
                  <div
                    key={c.week}
                    className="flex items-start gap-3 p-2.5 rounded-lg"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--bg-border)' }}
                  >
                    <span
                      className="text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full flex-shrink-0"
                      style={{ background: `${typeInfo.color}18`, color: typeInfo.color }}
                    >
                      {c.week}
                    </span>
                    <div>
                      <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{c.topic}</p>
                      {c.description && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{c.description}</p>}
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
            <label className="label">Program Name *</label>
            <input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. New Believers Class" />
          </div>
          <div className="form-field">
            <label className="label">Type</label>
            <select className="input" value={form.type} onChange={(e) => set('type', e.target.value as ProgramType)}>
              {Object.entries(PROGRAM_TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label className="label">Sessions / Week</label>
            <input type="number" min={1} className="input" value={form.sessionsPerWeek} onChange={(e) => set('sessionsPerWeek', e.target.value)} />
          </div>
          <div className="form-field">
            <label className="label">Duration (weeks)</label>
            <input type="number" min={1} className="input" value={form.durationWeeks} onChange={(e) => set('durationWeeks', e.target.value)} placeholder="e.g. 6" />
          </div>
        </div>

        <div className="form-field">
          <label className="label">Description</label>
          <textarea className="input resize-none h-16" value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="What is this program about?" />
        </div>

        {/* Promotion */}
        <div className="p-3 rounded-xl space-y-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--bg-border)' }}>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="accent-yellow-500" checked={form.promoteOnCompletion} onChange={(e) => set('promoteOnCompletion', e.target.checked)} />
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Auto-promote member on graduation</span>
          </label>
          {form.promoteOnCompletion && (
            <div className="form-field">
              <label className="label">Promote to Status</label>
              <input className="input" value={form.promoteToStatus} onChange={(e) => set('promoteToStatus', e.target.value)} placeholder="e.g. active" />
            </div>
          )}
        </div>

        {/* Curriculum */}
        <div>
          <p className="label mb-2">Curriculum</p>
          <div className="space-y-1.5 mb-3">
            {form.curriculum.map((c, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--bg-border)' }}>
                <span className="text-xs font-bold w-5 text-center" style={{ color: '#DAA520' }}>W{c.week}</span>
                <span className="flex-1 text-xs" style={{ color: 'var(--text-primary)' }}>{c.topic}</span>
                <button onClick={() => removeWeek(i)} className="text-text-muted hover:text-red-400"><Trash2 size={12} /></button>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-12 gap-2">
            <input
              type="number" min={1} placeholder="Wk"
              className="input col-span-2 text-center"
              value={curriculumInput.week}
              onChange={(e) => setCurriculumInput((p) => ({ ...p, week: e.target.value }))}
            />
            <input
              placeholder="Topic"
              className="input col-span-6"
              value={curriculumInput.topic}
              onChange={(e) => setCurriculumInput((p) => ({ ...p, topic: e.target.value }))}
            />
            <input
              placeholder="Notes (optional)"
              className="input col-span-3"
              value={curriculumInput.description}
              onChange={(e) => setCurriculumInput((p) => ({ ...p, description: e.target.value }))}
            />
            <button onClick={addWeek} className="col-span-1 flex items-center justify-center rounded-xl btn-gold p-0">
              <Plus size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-bg-border mt-4">
        <button onClick={onClose} className="btn-ghost">Cancel</button>
        <button onClick={submit} disabled={mutation.isPending} className="btn-gold">
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
            className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
            style={typeFilter === 'all'
              ? { background: 'rgba(218,165,32,0.12)', color: '#DAA520', border: '1px solid rgba(218,165,32,0.25)' }
              : { background: 'rgba(255,255,255,0.04)', color: 'var(--text-muted)', border: '1px solid var(--bg-border)' }}
          >
            All
          </button>
          {Object.entries(PROGRAM_TYPES).map(([k, v]) => (
            <button
              key={k}
              onClick={() => setTypeFilter(k as ProgramType)}
              className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
              style={typeFilter === k
                ? { background: `${v.color}18`, color: v.color, border: `1px solid ${v.color}30` }
                : { background: 'rgba(255,255,255,0.04)', color: 'var(--text-muted)', border: '1px solid var(--bg-border)' }}
            >
              {v.label}
            </button>
          ))}
        </div>
        <button onClick={() => { setEditing(undefined); setShowForm(true); }} className="btn-gold flex items-center gap-2 text-sm">
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
          action={<button onClick={() => setShowForm(true)} className="btn-gold">Create Program</button>}
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
        <p className="text-text-secondary mb-5">
          This will soft-delete the program. Existing cohorts will be unaffected.
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setDeleting(null)} className="btn-ghost">Cancel</button>
          <button
            onClick={() => deleting && deleteMutation.mutate(deleting)}
            disabled={deleteMutation.isPending}
            className="btn-danger"
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
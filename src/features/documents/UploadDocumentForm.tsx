/**
 * ChurchOS — src/features/documents/UploadDocumentForm.tsx
 * Module 13 — Document & Records
 * Upload form with drag-drop, category selection, dynamic metadata fields.
 */

import { useState, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Upload, X, File } from 'lucide-react';
import api from '../../lib/api';
import type { UploadDocumentForm as FormData, DocumentCategory, Folder } from '../../types/document.types';
import {
  DOCUMENT_CATEGORY_LABELS, DOCUMENT_CATEGORY_ICONS, DOCUMENT_CATEGORY_COLORS,
  ACCESS_LEVEL_LABELS, formatFileSize,
} from '../../types/document.types';

interface Props {
  folders: Folder[];
  defaultFolderId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const CATEGORIES: DocumentCategory[] = [
  'sermon','constitution','member_document','board_minutes',
  'dept_minutes','event_media','financial','legal','general',
];

export default function UploadDocumentForm({ folders, defaultFolderId, onSuccess, onCancel }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [category, setCategory] = useState<DocumentCategory>('general');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      folderId:    defaultFolderId || '',
      accessLevel: 'staff_only',
    },
  });

  // ── Drag & drop handlers ──
  const onDragOver  = useCallback((e: React.DragEvent) => { e.preventDefault(); setDragging(true); }, []);
  const onDragLeave = useCallback(() => setDragging(false), []);
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  }, []);

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      const fd = new FormData();
      fd.append('file', file!);
      fd.append('category', category);
      Object.entries(data).forEach(([key, val]) => {
        if (val !== undefined && val !== '') fd.append(key, String(val));
      });
      return api.post('/documents/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => { toast.success('Document uploaded!'); onSuccess(); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Upload failed'),
  });

  const onSubmit = (data: FormData) => {
    if (!file) { toast.error('Please select a file'); return; }
    mutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col" style={{ maxHeight: '78vh' }}>
      <style>{`
        .uf-field { transition: all 0.2s ease; }
        .uf-field:focus-within { transform: translateY(-1px); }
        .cat-btn {
          display:flex; flex-direction:column; align-items:center; gap:3px;
          padding:8px 6px; border-radius:10px; border:1px solid rgba(255,255,255,0.08);
          font-size:10px; font-weight:600; cursor:pointer; transition:all 0.2s ease;
          background:rgba(255,255,255,0.02); color:var(--text-muted,#888); min-width:0;
        }
        .cat-btn:hover { border-color:rgba(218,165,32,0.3); color:var(--text-primary,#fff); }
        .cat-btn.active { border-color:var(--cat-color,#DAA520); background:rgba(218,165,32,0.1); color:var(--cat-color,#DAA520); }
        .drop-zone { transition: all 0.2s ease; }
        .drop-zone.dragging { border-color: #DAA520 !important; background: rgba(218,165,32,0.06) !important; }
      `}</style>

      {/* Scrollable body */}
      <div className="overflow-y-auto flex-1 space-y-4 pr-1" style={{ minHeight: 0 }}>

        {/* ── Drop Zone ── */}
        <div
          className={`drop-zone rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer ${dragging ? 'dragging' : ''}`}
          style={{ borderColor: file ? 'rgba(218,165,32,0.4)' : 'rgba(255,255,255,0.12)' }}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          {file ? (
            <div className="flex items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(218,165,32,0.12)' }}>
                <File size={18} style={{ color: '#DAA520' }} />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold" style={{ color: '#DAA520' }}>{file.name}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatFileSize(file.size)}</p>
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setFile(null); }}
                className="ml-2 w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-500/20 transition-colors"
                style={{ color: 'var(--text-muted)' }}>
                <X size={13} />
              </button>
            </div>
          ) : (
            <div>
              <Upload size={24} className="mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                Drop file here or <span style={{ color: '#DAA520' }}>browse</span>
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                PDF, DOCX, XLSX, Images, Audio, Video — up to 100 MB
              </p>
            </div>
          )}
        </div>

        {/* ── Category ── */}
        <div className="uf-field">
          <label className="label">Category *</label>
          <div className="grid grid-cols-5 gap-1.5 mt-1">
            {CATEGORIES.map((cat) => {
              const color = DOCUMENT_CATEGORY_COLORS[cat];
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`cat-btn ${category === cat ? 'active' : ''}`}
                  style={{ '--cat-color': color } as React.CSSProperties}
                >
                  <span className="text-base">{DOCUMENT_CATEGORY_ICONS[cat]}</span>
                  <span className="leading-tight text-center" style={{ fontSize: 9 }}>
                    {DOCUMENT_CATEGORY_LABELS[cat].split(' ')[0]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Title ── */}
        <div className="uf-field">
          <label className="label">Title *</label>
          <input className="input" placeholder="Document title..."
            {...register('title', { required: 'Title is required' })} />
          {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>}
        </div>

        <div className="uf-field">
          <label className="label">Description</label>
          <textarea className="input resize-none" rows={2} placeholder="Brief description..."
            {...register('description')} />
        </div>

        {/* ── Folder + Access ── */}
        <div className="grid grid-cols-2 gap-3">
          <div className="uf-field">
            <label className="label">Folder</label>
            <select className="input" {...register('folderId')}>
              <option value="">Root (no folder)</option>
              {folders.map((f) => (
                <option key={f._id} value={f._id}>{f.icon} {f.name}</option>
              ))}
            </select>
          </div>
          <div className="uf-field">
            <label className="label">Access Level</label>
            <select className="input" {...register('accessLevel')}>
              {Object.entries(ACCESS_LEVEL_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Tags ── */}
        <div className="uf-field">
          <label className="label">Tags <span className="text-text-muted font-normal">(comma separated)</span></label>
          <input className="input" placeholder="finance, 2024, annual..." {...register('tags')} />
        </div>

        {/* ── CONDITIONAL FIELDS ── */}

        {/* Sermon */}
        {category === 'sermon' && (
          <div className="space-y-3 p-4 rounded-xl" style={{ background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.15)' }}>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#8b5cf6' }}>🎙️ Sermon Details</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="uf-field">
                <label className="label">Sermon Date</label>
                <input type="date" className="input" {...register('sermonDate')} />
              </div>
              <div className="uf-field">
                <label className="label">Speaker</label>
                <input className="input" placeholder="Pastor John..." {...register('sermonSpeaker')} />
              </div>
              <div className="uf-field">
                <label className="label">Series</label>
                <input className="input" placeholder="Series name..." {...register('sermonSeries')} />
              </div>
              <div className="uf-field">
                <label className="label">Scripture</label>
                <input className="input" placeholder="John 3:16" {...register('sermonScripture')} />
              </div>
            </div>
          </div>
        )}

        {/* Member Document */}
        {category === 'member_document' && (
          <div className="space-y-3 p-4 rounded-xl" style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.15)' }}>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#3b82f6' }}>🪪 Member Document</p>
            <div className="uf-field">
              <label className="label">Member ID</label>
              <input className="input" placeholder="Member's _id from database..." {...register('memberId')} />
            </div>
          </div>
        )}

        {/* Board / Dept Minutes */}
        {(category === 'board_minutes' || category === 'dept_minutes') && (
          <div className="space-y-3 p-4 rounded-xl" style={{ background: 'rgba(6,182,212,0.05)', border: '1px solid rgba(6,182,212,0.15)' }}>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#06b6d4' }}>🗂️ Meeting Details</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="uf-field">
                <label className="label">Meeting Date</label>
                <input type="date" className="input" {...register('meetingDate')} />
              </div>
              {category === 'dept_minutes' && (
                <div className="uf-field">
                  <label className="label">Department ID</label>
                  <input className="input" placeholder="Department _id..." {...register('departmentId')} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Event Media */}
        {category === 'event_media' && (
          <div className="space-y-3 p-4 rounded-xl" style={{ background: 'rgba(236,72,153,0.05)', border: '1px solid rgba(236,72,153,0.15)' }}>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#ec4899' }}>🖼️ Event Media</p>
            <div className="uf-field">
              <label className="label">Event ID</label>
              <input className="input" placeholder="Event _id from database..." {...register('eventId')} />
            </div>
          </div>
        )}

        {/* Change Note */}
        <div className="uf-field">
          <label className="label">Upload Note <span className="text-text-muted font-normal">(optional)</span></label>
          <input className="input" placeholder="e.g. Initial upload, Final approved version..." {...register('changeNote')} />
        </div>

      </div>{/* end scrollable body */}

      {/* Sticky footer */}
      <div className="flex justify-end gap-3 pt-3 mt-1 flex-shrink-0"
        style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <button type="button" onClick={onCancel} className="btn-ghost">Cancel</button>
        <button type="submit" disabled={mutation.isPending || !file} className="btn-gold flex items-center gap-2">
          {mutation.isPending ? 'Uploading...' : <><Upload size={14} /> Upload Document</>}
        </button>
      </div>
    </form>
  );
}
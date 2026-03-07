/**
 * ChurchOS — src/features/documents/DocumentDetailPage.tsx
 * Module 13 — Document & Records
 * Full detail: preview, metadata, version history, upload new version.
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  ArrowLeft, Download, History, Upload, Lock,
  Tag, FolderOpen, Clock, User, Globe, Eye,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { PageLoader } from '../../components/ui/Spinner';
import Modal from '../../components/ui/Modal';
import type { DocumentRecord } from '../../types/document.types';
import {
  DOCUMENT_CATEGORY_LABELS, DOCUMENT_CATEGORY_ICONS, DOCUMENT_CATEGORY_COLORS,
  FILE_TYPE_ICONS, FILE_TYPE_COLORS, formatFileSize, isImage, isMedia,
  isPreviewable, ACCESS_LEVEL_LABELS,
} from '../../types/document.types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(d?: string) {
  if (!d) return '—';
  try { return format(new Date(d), 'dd MMM yyyy'); } catch { return '—'; }
}
function fmtFull(d?: string) {
  if (!d) return '—';
  try { return format(new Date(d), 'dd MMM yyyy, h:mm a'); } catch { return '—'; }
}

function Row({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted,#888)' }}>{label}</span>
      <span className="text-sm font-medium" style={{ color: 'var(--text-primary,#fff)' }}>{value ?? '—'}</span>
    </div>
  );
}

function Section({ title, icon, accent = '#DAA520', children }: {
  title: string; icon: React.ReactNode; accent?: string; children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl p-5 space-y-4"
      style={{ background: 'var(--bg-card,rgba(255,255,255,0.04))', border: '1px solid var(--bg-border,rgba(255,255,255,0.08))' }}>
      <div className="flex items-center gap-2 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span style={{ color: accent }}>{icon}</span>
        <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-secondary,#ccc)' }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

// ─── File Preview ─────────────────────────────────────────────────────────────

function FilePreview({ doc }: { doc: DocumentRecord }) {
  const color = FILE_TYPE_COLORS[doc.fileType] || '#6b7280';

  if (isImage(doc.fileType)) {
    return (
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
        <img src={doc.fileUrl} alt={doc.title} className="w-full max-h-[500px] object-contain"
          style={{ background: 'rgba(0,0,0,0.3)' }} />
      </div>
    );
  }

  if (doc.fileType === 'pdf') {
    return (
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)', height: 500 }}>
        <iframe src={`${doc.fileUrl}#toolbar=0`} className="w-full h-full" title={doc.title} />
      </div>
    );
  }

  if (doc.fileType === 'mp4' || doc.fileType === 'mov') {
    return (
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
        <video controls className="w-full max-h-[400px]" style={{ background: '#000' }}>
          <source src={doc.fileUrl} />
        </video>
      </div>
    );
  }

  if (doc.fileType === 'mp3') {
    return (
      <div className="rounded-2xl p-8 flex flex-col items-center gap-4"
        style={{ background: `${color}08`, border: `1px solid ${color}20` }}>
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl"
          style={{ background: `${color}15` }}>
          🎵
        </div>
        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{doc.title}</p>
        <audio controls className="w-full max-w-sm">
          <source src={doc.fileUrl} />
        </audio>
      </div>
    );
  }

  // Non-previewable — show download card
  return (
    <div className="rounded-2xl p-10 flex flex-col items-center gap-4"
      style={{ background: `${color}06`, border: `1px dashed ${color}30` }}>
      <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl"
        style={{ background: `${color}12` }}>
        {FILE_TYPE_ICONS[doc.fileType] || '📎'}
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{doc.fileName}</p>
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
          {doc.fileType.toUpperCase()} · {formatFileSize(doc.fileSizeBytes)}
        </p>
      </div>
      <a href={doc.fileUrl} download={doc.fileName} target="_blank" rel="noreferrer"
        className="btn-gold flex items-center gap-2 text-sm">
        <Download size={14} /> Download File
      </a>
    </div>
  );
}

// ─── Upload New Version Modal ─────────────────────────────────────────────────

function UploadVersionModal({ docId, onClose, onSuccess }: {
  docId: string; onClose: () => void; onSuccess: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [changeNote, setChangeNote] = useState('');

  const mutation = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      fd.append('file', file!);
      fd.append('changeNote', changeNote);
      return api.post(`/documents/${docId}/version`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => { toast.success('New version uploaded!'); onSuccess(); onClose(); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Upload failed'),
  });

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed rounded-xl p-6 text-center transition-colors"
        style={{ borderColor: file ? 'rgba(218,165,32,0.4)' : 'rgba(255,255,255,0.1)' }}>
        <input type="file" id="vfile" className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] || null)} />
        <label htmlFor="vfile" className="cursor-pointer block">
          {file ? (
            <div>
              <p className="text-sm font-semibold" style={{ color: '#DAA520' }}>{file.name}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{(file.size / 1024).toFixed(1)} KB</p>
            </div>
          ) : (
            <div>
              <Upload size={24} className="mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Click to select new version</p>
            </div>
          )}
        </label>
      </div>
      <div>
        <label className="label">Change Note</label>
        <input className="input w-full" placeholder="What changed in this version?" value={changeNote}
          onChange={(e) => setChangeNote(e.target.value)} />
      </div>
      <div className="flex justify-end gap-3">
        <button onClick={onClose} className="btn-ghost">Cancel</button>
        <button onClick={() => mutation.mutate()} disabled={!file || mutation.isPending} className="btn-gold">
          {mutation.isPending ? 'Uploading...' : 'Upload Version'}
        </button>
      </div>
    </div>
  );
}

// ─── Main Detail Page ─────────────────────────────────────────────────────────

export default function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showVersionModal, setShowVersionModal] = useState(false);

  const { data: doc, isLoading, isError } = useQuery<DocumentRecord>({
    queryKey: ['document', id],
    queryFn: async () => (await api.get(`/documents/${id}`)).data.data,
    enabled: !!id,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['document', id] });
    qc.invalidateQueries({ queryKey: ['documents'] });
  };

  if (isLoading) return <PageLoader />;
  if (isError || !doc) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
        <p className="text-text-muted">Document not found.</p>
        <button onClick={() => navigate('/documents')} className="btn-ghost flex items-center gap-2">
          <ArrowLeft size={16} /> Back to Documents
        </button>
      </div>
    );
  }

  const catColor = DOCUMENT_CATEGORY_COLORS[doc.category] || '#DAA520';
  const fileColor = FILE_TYPE_COLORS[doc.fileType] || '#6b7280';
  const folder = typeof doc.folderId === 'object' && doc.folderId ? doc.folderId : null;
  const uploader = typeof doc.uploadedBy === 'object' ? doc.uploadedBy.email : '—';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <style>{`
        @keyframes slideUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        .dfd-s { animation: slideUp 0.3s ease both; }
        .dfd-s:nth-child(1){animation-delay:0.05s}
        .dfd-s:nth-child(2){animation-delay:0.1s}
        .dfd-s:nth-child(3){animation-delay:0.15s}
        .dfd-s:nth-child(4){animation-delay:0.2s}
        .ver-row { padding: 10px 14px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.06); background: rgba(255,255,255,0.02); transition: border-color 0.2s; }
        .ver-row:hover { border-color: rgba(218,165,32,0.2); }
        .ver-row.current { border-color: rgba(218,165,32,0.3); background: rgba(218,165,32,0.04); }
      `}</style>

      {/* Back */}
      <button onClick={() => navigate('/documents')}
        className="flex items-center gap-2 text-sm transition-colors hover:opacity-80"
        style={{ color: 'var(--text-muted,#888)' }}>
        <ArrowLeft size={16} /> Back to Documents
      </button>

      {/* Hero */}
      <div className="dfd-s rounded-2xl p-6"
        style={{
          background: 'var(--bg-card,rgba(255,255,255,0.04))',
          border: `1px solid ${catColor}25`,
          boxShadow: `0 0 40px ${catColor}08`,
        }}>
        <div className="flex flex-col sm:flex-row gap-4">
          {/* File type icon */}
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
            style={{ background: `${fileColor}12`, border: `1px solid ${fileColor}25` }}>
            {FILE_TYPE_ICONS[doc.fileType] || '📎'}
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-start gap-3">
              <div className="flex-1">
                <h1 className="font-display font-bold text-xl" style={{ color: 'var(--text-primary,#fff)' }}>
                  {doc.title}
                </h1>
                <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{doc.fileName}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {/* Category */}
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                  style={{ background: `${catColor}15`, color: catColor, border: `1px solid ${catColor}25` }}>
                  {DOCUMENT_CATEGORY_ICONS[doc.category]} {DOCUMENT_CATEGORY_LABELS[doc.category]}
                </span>
                {/* File type */}
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase"
                  style={{ background: `${fileColor}15`, color: fileColor, border: `1px solid ${fileColor}25` }}>
                  {doc.fileType}
                </span>
                {/* Version */}
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                  style={{ background: 'rgba(218,165,32,0.1)', color: '#DAA520', border: '1px solid rgba(218,165,32,0.25)' }}>
                  v{doc.currentVersion}
                </span>
              </div>
            </div>

            {doc.description && (
              <p className="text-sm" style={{ color: 'var(--text-secondary,#ccc)' }}>{doc.description}</p>
            )}

            {/* Tags */}
            {doc.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {doc.tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>
                    <Tag size={9} /> {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action bar */}
        <div className="flex flex-wrap gap-2 mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <a href={doc.fileUrl} download={doc.fileName} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{ background: 'rgba(218,165,32,0.12)', color: '#DAA520' }}>
            <Download size={14} /> Download
          </a>
          <button onClick={() => setShowVersionModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
            <Upload size={14} /> New Version
          </button>
          {isPreviewable(doc.fileType) && (
            <a href={doc.fileUrl} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
              <Eye size={14} /> Open in New Tab
            </a>
          )}
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Preview (2/3 width) */}
        <div className="dfd-s lg:col-span-2 space-y-4">
          <FilePreview doc={doc} />
        </div>

        {/* Metadata sidebar (1/3 width) */}
        <div className="dfd-s space-y-4">

          {/* File Info */}
          <Section title="File Details" icon={<FileRow size={14} />}>
            <div className="space-y-3">
              <Row label="File Type" value={
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase"
                  style={{ color: fileColor }}>
                  {FILE_TYPE_ICONS[doc.fileType]} {doc.fileType}
                </span>
              } />
              <Row label="Size" value={formatFileSize(doc.fileSizeBytes)} />
              <Row label="Version" value={`v${doc.currentVersion}`} />
              <Row label="Uploaded" value={fmtFull(doc.createdAt)} />
              <Row label="Uploaded By" value={
                <span className="flex items-center gap-1.5 text-xs">
                  <User size={11} style={{ color: '#DAA520' }} /> {uploader}
                </span>
              } />
            </div>
          </Section>

          {/* Organisation */}
          <Section title="Organisation" icon={<FolderOpen size={14} />} accent="#3b82f6">
            <div className="space-y-3">
              {folder && (
                <Row label="Folder" value={
                  <span className="flex items-center gap-1.5">
                    <span>{folder.icon}</span>
                    <span style={{ color: folder.color || '#DAA520' }}>{folder.name}</span>
                  </span>
                } />
              )}
              <Row label="Access" value={
                <span className="flex items-center gap-1.5 text-xs"
                  style={{ color: doc.access.level === 'public' ? '#10b981' : '#f59e0b' }}>
                  {doc.access.level === 'public' ? <Globe size={11} /> : <Lock size={11} />}
                  {ACCESS_LEVEL_LABELS[doc.access.level]}
                </span>
              } />
            </div>
          </Section>

          {/* Category-specific metadata */}
          {doc.category === 'sermon' && (
            <Section title="Sermon Details" icon="🎙️" accent="#8b5cf6">
              <div className="space-y-3">
                <Row label="Date" value={fmt(doc.sermonDate)} />
                <Row label="Speaker" value={doc.sermonSpeaker} />
                <Row label="Series" value={doc.sermonSeries} />
                <Row label="Scripture" value={doc.sermonScripture} />
              </div>
            </Section>
          )}

          {doc.category === 'member_document' && typeof doc.memberId === 'object' && doc.memberId && (
            <Section title="Member" icon="🪪" accent="#3b82f6">
              <Row label="Member" value={
                <span>
                  {doc.memberId.firstName} {doc.memberId.lastName}
                  <span className="ml-2 font-mono text-xs" style={{ color: '#DAA520' }}>
                    {doc.memberId.membershipId}
                  </span>
                </span>
              } />
            </Section>
          )}

          {(doc.category === 'board_minutes' || doc.category === 'dept_minutes') && (
            <Section title="Meeting Details" icon="🗂️" accent="#06b6d4">
              <div className="space-y-3">
                <Row label="Meeting Date" value={fmt(doc.meetingDate)} />
                {typeof doc.departmentId === 'object' && doc.departmentId && (
                  <Row label="Department" value={doc.departmentId.name} />
                )}
              </div>
            </Section>
          )}
        </div>
      </div>

      {/* Version History */}
      <div className="dfd-s">
        <Section title={`Version History (${doc.versionHistory.length})`} icon={<History size={14} />} accent="#f59e0b">
          {doc.versionHistory.length === 0 ? (
            <p className="text-sm text-center py-3" style={{ color: 'var(--text-muted)' }}>No version history.</p>
          ) : (
            <div className="space-y-2">
              {[...doc.versionHistory].sort((a, b) => b.version - a.version).map((v) => {
                const isCurrent = v.version === doc.currentVersion;
                const upBy = typeof v.uploadedBy === 'object' ? v.uploadedBy.email : '—';
                return (
                  <div key={v._id} className={`ver-row flex items-start gap-3 ${isCurrent ? 'current' : ''}`}>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{
                        background: isCurrent ? 'rgba(218,165,32,0.15)' : 'rgba(255,255,255,0.05)',
                        color: isCurrent ? '#DAA520' : 'var(--text-muted)',
                      }}>
                      v{v.version}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          {v.changeNote || `Version ${v.version}`}
                        </p>
                        {isCurrent && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{ background: 'rgba(218,165,32,0.15)', color: '#DAA520' }}>
                            CURRENT
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                          <Clock size={10} /> {fmtFull(v.uploadedAt)}
                        </span>
                        <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                          <User size={10} /> {upBy}
                        </span>
                        {v.fileSizeBytes && (
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {formatFileSize(v.fileSizeBytes)}
                          </span>
                        )}
                      </div>
                    </div>
                    <a href={v.fileUrl} download target="_blank" rel="noreferrer"
                      className="text-xs flex items-center gap-1 transition-opacity hover:opacity-80 flex-shrink-0"
                      style={{ color: '#DAA520' }}
                      onClick={(e) => e.stopPropagation()}>
                      <Download size={12} />
                    </a>
                  </div>
                );
              })}
            </div>
          )}
        </Section>
      </div>

      {/* Upload Version Modal */}
      <Modal isOpen={showVersionModal} onClose={() => setShowVersionModal(false)} title="Upload New Version" size="sm">
        <UploadVersionModal docId={id!} onClose={() => setShowVersionModal(false)} onSuccess={invalidate} />
      </Modal>
    </div>
  );
}

// Dummy component to satisfy the import in Section
function FileRow({ size }: { size: number }) {
  return <FileText size={size} />;
}
import { FileText } from 'lucide-react';
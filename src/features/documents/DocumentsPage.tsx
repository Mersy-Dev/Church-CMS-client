/**
 * ChurchOS — src/features/documents/DocumentsPage.tsx
 * Module 13 — Document & Records
 * Main page: sidebar folder tree + content area with category tabs, grid/list toggle, search.
 */

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, Grid3X3, List, FolderPlus, Upload,
  ChevronRight, ChevronDown, Folder as FolderIcon,
  Eye, Trash2, MoreVertical, HardDrive, FileText, TrendingUp,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import Modal from '../../components/ui/Modal';
import { PageLoader } from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import UploadDocumentForm from './UploadDocumentForm';
import CreateFolderForm from './CreateFolderForm';
import type {
  DocumentRecord, Folder, FolderContents, DocumentStats, DocumentCategory,
} from '../../types/document.types';
import {
  DOCUMENT_CATEGORY_LABELS, DOCUMENT_CATEGORY_ICONS, DOCUMENT_CATEGORY_COLORS,
  FILE_TYPE_ICONS, FILE_TYPE_COLORS, formatFileSize, isImage, ACCESS_LEVEL_LABELS,
} from '../../types/document.types';

// ─── Build folder tree from flat list ────────────────────────────────────────

function buildTree(folders: Folder[]): Folder[] {
  const map: Record<string, Folder> = {};
  const roots: Folder[] = [];
  folders.forEach((f) => { map[f._id] = { ...f, children: [] }; });
  folders.forEach((f) => {
    if (f.parentId && map[f.parentId]) {
      map[f.parentId].children!.push(map[f._id]);
    } else {
      roots.push(map[f._id]);
    }
  });
  return roots;
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon, accent, sub }: {
  label: string; value: string | number; icon: React.ReactNode; accent: string; sub?: string;
}) {
  return (
    <div className="rounded-2xl p-4 flex items-start gap-3"
      style={{ background: 'var(--bg-card,rgba(255,255,255,0.04))', border: '1px solid var(--bg-border,rgba(255,255,255,0.08))' }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${accent}18`, color: accent }}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold font-display" style={{ color: 'var(--text-primary,#fff)' }}>{value}</p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted,#888)' }}>{label}</p>
        {sub && <p className="text-xs mt-0.5" style={{ color: accent }}>{sub}</p>}
      </div>
    </div>
  );
}

// ─── Folder Tree Node ─────────────────────────────────────────────────────────

function FolderNode({
  folder, depth, activeId, onSelect,
}: {
  folder: Folder; depth: number; activeId: string | null; onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const hasChildren = (folder.children?.length ?? 0) > 0;
  const isActive = activeId === folder._id;

  return (
    <div>
      <button
        onClick={() => { onSelect(folder._id); if (hasChildren) setOpen((o) => !o); }}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all duration-150 group"
        style={{
          paddingLeft: `${12 + depth * 14}px`,
          background: isActive ? 'rgba(218,165,32,0.1)' : 'transparent',
          color: isActive ? '#DAA520' : 'var(--text-secondary,#ccc)',
          borderLeft: isActive ? '2px solid #DAA520' : '2px solid transparent',
        }}
      >
        {hasChildren ? (
          open
            ? <ChevronDown size={12} className="flex-shrink-0 opacity-60" />
            : <ChevronRight size={12} className="flex-shrink-0 opacity-60" />
        ) : (
          <span className="w-3 flex-shrink-0" />
        )}
        <span className="text-base flex-shrink-0">{folder.icon}</span>
        <span className="truncate font-medium text-xs">{folder.name}</span>
      </button>
      {open && hasChildren && (
        <div>
          {folder.children!.map((child) => (
            <FolderNode key={child._id} folder={child} depth={depth + 1} activeId={activeId} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── File Card (Grid view) ────────────────────────────────────────────────────

function FileCard({
  doc, onView, onDelete,
}: {
  doc: DocumentRecord; onView: () => void; onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const color = FILE_TYPE_COLORS[doc.fileType] || '#6b7280';
  const catColor = DOCUMENT_CATEGORY_COLORS[doc.category] || '#DAA520';

  return (
    <div
      className="doc-card rounded-2xl overflow-hidden cursor-pointer group relative"
      style={{
        background: 'var(--bg-card,rgba(255,255,255,0.04))',
        border: '1px solid var(--bg-border,rgba(255,255,255,0.08))',
        transition: 'all 0.2s ease',
      }}
      onClick={onView}
    >
      {/* Thumb / preview */}
      <div className="h-28 flex items-center justify-center relative overflow-hidden"
        style={{ background: `${color}10` }}>
        {isImage(doc.fileType) && doc.thumbnailUrl ? (
          <img src={doc.thumbnailUrl} alt={doc.title}
            className="w-full h-full object-cover" />
        ) : (
          <span className="text-4xl">{FILE_TYPE_ICONS[doc.fileType] || '📎'}</span>
        )}
        {/* Category tag */}
        <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{ background: `${catColor}20`, color: catColor, border: `1px solid ${catColor}30` }}>
          {DOCUMENT_CATEGORY_ICONS[doc.category]} {DOCUMENT_CATEGORY_LABELS[doc.category].split(' ')[0]}
        </span>
        {/* Version badge */}
        {doc.currentVersion > 1 && (
          <span className="absolute top-2 right-2 text-[10px] font-bold px-1.5 py-0.5 rounded"
            style={{ background: 'rgba(0,0,0,0.5)', color: '#DAA520' }}>
            v{doc.currentVersion}
          </span>
        )}
      </div>

      {/* Meta */}
      <div className="p-3 space-y-1.5">
        <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary,#fff)' }}>
          {doc.title}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase px-1.5 py-0.5 rounded"
            style={{ background: `${color}15`, color }}>
            {doc.fileType.toUpperCase()}
          </span>
          <span className="text-xs" style={{ color: 'var(--text-muted,#888)' }}>
            {formatFileSize(doc.fileSizeBytes)}
          </span>
        </div>
        <p className="text-[11px]" style={{ color: 'var(--text-muted,#888)' }}>
          {format(new Date(doc.createdAt), 'dd MMM yyyy')}
        </p>
      </div>

      {/* Hover actions */}
      <div
        className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onView}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
          style={{ background: 'rgba(59,130,246,0.2)', color: '#3b82f6' }}>
          <Eye size={15} />
        </button>
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
          style={{ background: 'rgba(239,68,68,0.2)', color: '#ef4444' }}>
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}

// ─── File Row (List view) ─────────────────────────────────────────────────────

function FileRow({
  doc, onView, onDelete, hover, setHover,
}: {
  doc: DocumentRecord; onView: () => void; onDelete: () => void;
  hover: string | null; setHover: (id: string | null) => void;
}) {
  const color = FILE_TYPE_COLORS[doc.fileType] || '#6b7280';
  const catColor = DOCUMENT_CATEGORY_COLORS[doc.category] || '#DAA520';
  const uploader = typeof doc.uploadedBy === 'object' ? doc.uploadedBy.email : '—';

  return (
    <tr className="table-row cursor-pointer" onClick={onView}
      style={{ transition: 'background 0.15s' }}>
      <td className="table-cell">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
            style={{ background: `${color}15` }}>
            {isImage(doc.fileType) && doc.thumbnailUrl
              ? <img src={doc.thumbnailUrl} alt="" className="w-9 h-9 rounded-xl object-cover" />
              : FILE_TYPE_ICONS[doc.fileType] || '📎'}
          </div>
          <div>
            <p className="text-sm font-semibold truncate max-w-[200px]" style={{ color: 'var(--text-primary,#fff)' }}>
              {doc.title}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted,#888)' }}>{doc.fileName}</p>
          </div>
        </div>
      </td>
      <td className="table-cell">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium"
          style={{ color: catColor }}>
          {DOCUMENT_CATEGORY_ICONS[doc.category]} {DOCUMENT_CATEGORY_LABELS[doc.category]}
        </span>
      </td>
      <td className="table-cell">
        <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded"
          style={{ background: `${color}15`, color }}>
          {doc.fileType.toUpperCase()}
        </span>
      </td>
      <td className="table-cell text-xs" style={{ color: 'var(--text-muted)' }}>
        {formatFileSize(doc.fileSizeBytes)}
      </td>
      <td className="table-cell text-xs" style={{ color: 'var(--text-muted)' }}>
        {format(new Date(doc.createdAt), 'dd MMM yyyy')}
      </td>
      <td className="table-cell text-xs" style={{ color: 'var(--text-muted)' }}>
        {uploader}
      </td>
      <td className="table-cell">
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onMouseEnter={() => setHover(`v-${doc._id}`)}
            onMouseLeave={() => setHover(null)}
            onClick={onView}
            className="w-7 h-7 flex items-center justify-center rounded-lg transition-all"
            style={{
              background: hover === `v-${doc._id}` ? 'rgba(59,130,246,0.2)' : 'transparent',
              color: hover === `v-${doc._id}` ? '#3b82f6' : 'var(--text-muted)',
            }}>
            <Eye size={13} />
          </button>
          <button
            onMouseEnter={() => setHover(`d-${doc._id}`)}
            onMouseLeave={() => setHover(null)}
            onClick={onDelete}
            className="w-7 h-7 flex items-center justify-center rounded-lg transition-all"
            style={{
              background: hover === `d-${doc._id}` ? 'rgba(239,68,68,0.2)' : 'transparent',
              color: hover === `d-${doc._id}` ? '#ef4444' : 'var(--text-muted)',
            }}>
            <Trash2 size={13} />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const ALL_CATEGORIES: DocumentCategory[] = [
  'sermon','constitution','member_document','board_minutes',
  'dept_minutes','event_media','financial','legal','general',
];

export default function DocumentsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<DocumentCategory | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [hoverAction, setHoverAction] = useState<string | null>(null);

  // ── Stats ──
  const { data: stats } = useQuery<DocumentStats>({
    queryKey: ['doc-stats'],
    queryFn: async () => (await api.get('/documents/stats')).data.data,
  });

  // ── Folders (flat) ──
  const { data: foldersFlat } = useQuery<Folder[]>({
    queryKey: ['folders'],
    queryFn: async () => (await api.get('/documents/folders')).data.data,
  });

  // ── Documents ──
  const { data: docData, isLoading } = useQuery({
    queryKey: ['documents', activeFolderId, activeCategory, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (activeFolderId) params.set('folderId', activeFolderId);
      else params.set('folderId', 'root');
      if (activeCategory !== 'all') params.set('category', activeCategory);
      if (search) params.set('search', search);
      params.set('limit', '60');
      const res = await api.get(`/documents?${params}`);
      return { docs: res.data.data as DocumentRecord[], total: res.data.pagination?.total ?? 0 };
    },
  });

  // ── Search (cross-folder) ──
  const { data: searchData } = useQuery({
    queryKey: ['doc-search', search],
    queryFn: async () => {
      if (search.length < 2) return null;
      return (await api.get(`/documents/search?q=${search}`)).data.data;
    },
    enabled: search.length >= 2,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/documents/${id}`),
    onSuccess: () => {
      toast.success('Document archived');
      qc.invalidateQueries({ queryKey: ['documents'] });
      qc.invalidateQueries({ queryKey: ['doc-stats'] });
      setDeletingId(null);
    },
    onError: () => toast.error('Failed to archive document'),
  });

  const folderTree = foldersFlat ? buildTree(foldersFlat) : [];
  const docs = docData?.docs ?? [];

  // If searching, show search results across everything
  const displayDocs = search.length >= 2 && searchData
    ? searchData.documents
    : docs;

  return (
    <div className="flex gap-0 h-full" style={{ minHeight: '80vh' }}>
      <style>{`
        .doc-card:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(0,0,0,0.2); border-color: rgba(218,165,32,0.2) !important; }
        .cat-tab { display:flex; align-items:center; gap:6px; padding:7px 12px; border-radius:10px; font-size:12px; font-weight:600; cursor:pointer; white-space:nowrap; transition:all 0.2s; border:1px solid transparent; color:var(--text-muted,#888); background:transparent; }
        .cat-tab:hover { color:var(--text-primary,#fff); background:rgba(255,255,255,0.04); }
        .cat-tab.active { color:#DAA520; background:rgba(218,165,32,0.1); border-color:rgba(218,165,32,0.25); }
        .fade-in { animation: fadeInRow 0.3s ease-out; }
        @keyframes fadeInRow { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        .slide-up { animation: slideUp 0.35s ease both; }
        @keyframes slideUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .table-row:hover { background: rgba(218,165,32,0.03); }
      `}</style>

      {/* ── Sidebar Folder Tree ── */}
      <aside className="w-56 flex-shrink-0 border-r flex flex-col"
        style={{ borderColor: 'var(--bg-border,rgba(255,255,255,0.08))', background: 'var(--bg-surface,rgba(255,255,255,0.02))' }}>

        <div className="p-3 border-b" style={{ borderColor: 'var(--bg-border,rgba(255,255,255,0.08))' }}>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
            Folders
          </p>
          <button
            onClick={() => setShowCreateFolder(true)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
            style={{ background: 'rgba(218,165,32,0.08)', color: '#DAA520', border: '1px solid rgba(218,165,32,0.2)' }}>
            <FolderPlus size={13} /> New Folder
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {/* Root */}
          <button
            onClick={() => setActiveFolderId(null)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all"
            style={{
              background: activeFolderId === null ? 'rgba(218,165,32,0.1)' : 'transparent',
              color: activeFolderId === null ? '#DAA520' : 'var(--text-secondary,#ccc)',
              borderLeft: activeFolderId === null ? '2px solid #DAA520' : '2px solid transparent',
            }}>
            <FolderIcon size={13} className="flex-shrink-0" />
            <span>All Documents</span>
          </button>

          {folderTree.map((folder) => (
            <FolderNode
              key={folder._id}
              folder={folder}
              depth={0}
              activeId={activeFolderId}
              onSelect={setActiveFolderId}
            />
          ))}
        </nav>

        {/* Storage usage */}
        {stats && (
          <div className="p-3 border-t" style={{ borderColor: 'var(--bg-border,rgba(255,255,255,0.08))' }}>
            <div className="flex items-center gap-2 mb-1.5">
              <HardDrive size={11} style={{ color: '#DAA520' }} />
              <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Storage</span>
            </div>
            <p className="text-sm font-bold" style={{ color: '#DAA520' }}>{stats.storageMB} MB</p>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              {stats.totalDocuments} files · {stats.totalFolders} folders
            </p>
          </div>
        )}
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 flex flex-col overflow-hidden p-5 space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between slide-up">
          <div>
            <h1 className="font-display font-bold text-2xl text-text-primary">Documents & Records</h1>
            <p className="text-text-muted text-sm mt-0.5">
              {docData?.total ?? 0} document{docData?.total !== 1 ? 's' : ''}
              {activeFolderId && foldersFlat
                ? ` in ${foldersFlat.find((f) => f._id === activeFolderId)?.name}`
                : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowUpload(true)}
              className="btn-gold flex items-center gap-2">
              <Upload size={15} /> Upload
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 slide-up">
          <StatCard label="Total Documents" value={stats?.totalDocuments ?? '—'} icon={<FileText size={18} />} accent="#DAA520" />
          <StatCard label="This Month" value={stats?.newThisMonth ?? '—'} icon={<TrendingUp size={18} />} accent="#10b981" sub="New uploads" />
          <StatCard label="Storage Used" value={stats ? `${stats.storageMB} MB` : '—'} icon={<HardDrive size={18} />} accent="#3b82f6" />
          <StatCard label="Folders" value={stats?.totalFolders ?? '—'} icon={<FolderIcon size={18} />} accent="#f59e0b" />
        </div>

        {/* Search + view toggle */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input
              className="input pl-9 w-full"
              placeholder="Search documents, folders..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
            />
          </div>
          <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: 'var(--bg-card,rgba(255,255,255,0.04))' }}>
            <button onClick={() => setViewMode('grid')}
              className="w-8 h-8 flex items-center justify-center rounded-lg transition-all"
              style={{
                background: viewMode === 'grid' ? 'rgba(218,165,32,0.15)' : 'transparent',
                color: viewMode === 'grid' ? '#DAA520' : 'var(--text-muted)',
              }}>
              <Grid3X3 size={15} />
            </button>
            <button onClick={() => setViewMode('list')}
              className="w-8 h-8 flex items-center justify-center rounded-lg transition-all"
              style={{
                background: viewMode === 'list' ? 'rgba(218,165,32,0.15)' : 'transparent',
                color: viewMode === 'list' ? '#DAA520' : 'var(--text-muted)',
              }}>
              <List size={15} />
            </button>
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveCategory('all')}
            className={`cat-tab ${activeCategory === 'all' ? 'active' : ''}`}>
            📋 All
            {stats?.totalDocuments ? (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full ml-1"
                style={{ background: activeCategory === 'all' ? 'rgba(218,165,32,0.2)' : 'rgba(255,255,255,0.06)', color: activeCategory === 'all' ? '#DAA520' : 'var(--text-muted)' }}>
                {stats.totalDocuments}
              </span>
            ) : null}
          </button>
          {ALL_CATEGORIES.map((cat) => {
            const count = stats?.byCategory?.[cat];
            const color = DOCUMENT_CATEGORY_COLORS[cat];
            return (
              <button key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`cat-tab ${activeCategory === cat ? 'active' : ''}`}>
                {DOCUMENT_CATEGORY_ICONS[cat]} {DOCUMENT_CATEGORY_LABELS[cat].split(' ')[0]}
                {count ? (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full ml-1"
                    style={{
                      background: activeCategory === cat ? `${color}25` : 'rgba(255,255,255,0.06)',
                      color: activeCategory === cat ? color : 'var(--text-muted)',
                    }}>
                    {count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <PageLoader />
          ) : displayDocs.length === 0 ? (
            <EmptyState
              icon="📁"
              title="No documents found"
              description="Upload your first document to get started"
              action={
                <button onClick={() => setShowUpload(true)} className="btn-gold flex items-center gap-2">
                  <Upload size={15} /> Upload Document
                </button>
              }
            />
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {displayDocs.map((doc) => (
                <div key={doc._id} className="fade-in">
                  <FileCard
                    doc={doc}
                    onView={() => navigate(`/documents/${doc._id}`)}
                    onDelete={() => setDeletingId(doc._id)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="card overflow-hidden">
              <table className="w-full">
                <thead className="border-b" style={{ borderColor: 'var(--bg-border,rgba(255,255,255,0.08))' }}>
                  <tr>
                    {['Document','Category','Type','Size','Date','Uploaded By','Actions'].map((h) => (
                      <th key={h} className="table-header text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayDocs.map((doc) => (
                    <FileRow
                      key={doc._id}
                      doc={doc}
                      onView={() => navigate(`/documents/${doc._id}`)}
                      onDelete={() => setDeletingId(doc._id)}
                      hover={hoverAction}
                      setHover={setHoverAction}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* ── Upload Modal ── */}
      <Modal isOpen={showUpload} onClose={() => setShowUpload(false)} title="Upload Document" size="lg">
        <UploadDocumentForm
          folders={foldersFlat ?? []}
          defaultFolderId={activeFolderId || undefined}
          onSuccess={() => {
            setShowUpload(false);
            qc.invalidateQueries({ queryKey: ['documents'] });
            qc.invalidateQueries({ queryKey: ['doc-stats'] });
          }}
          onCancel={() => setShowUpload(false)}
        />
      </Modal>

      {/* ── Create Folder Modal ── */}
      <Modal isOpen={showCreateFolder} onClose={() => setShowCreateFolder(false)} title="Create Folder" size="sm">
        <CreateFolderForm
          folders={foldersFlat ?? []}
          onSuccess={() => {
            setShowCreateFolder(false);
            qc.invalidateQueries({ queryKey: ['folders'] });
          }}
          onCancel={() => setShowCreateFolder(false)}
        />
      </Modal>

      {/* ── Delete Confirm ── */}
      <Modal isOpen={!!deletingId} onClose={() => setDeletingId(null)} title="Archive Document" size="sm">
        <p className="text-text-secondary mb-5">
          This document will be archived. It can be restored by an administrator.
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setDeletingId(null)} className="btn-ghost">Cancel</button>
          <button
            onClick={() => deletingId && deleteMutation.mutate(deletingId)}
            className="btn-danger"
            disabled={deleteMutation.isPending}>
            {deleteMutation.isPending ? 'Archiving...' : 'Archive'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
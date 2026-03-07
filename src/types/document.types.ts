/**
 * ChurchOS — src/types/document.types.ts
 * Module 13 — Document & Records
 */

// ─────────────────────────────────────────────────────────────────────────────
// Enums
// ─────────────────────────────────────────────────────────────────────────────

export type DocumentCategory =
  | 'sermon'
  | 'constitution'
  | 'member_document'
  | 'board_minutes'
  | 'dept_minutes'
  | 'event_media'
  | 'financial'
  | 'legal'
  | 'general';

export type DocumentStatus = 'active' | 'archived' | 'draft';

export type AccessLevel =
  | 'public'
  | 'members_only'
  | 'staff_only'
  | 'admin_only'
  | 'pastor_only';

export type FileType =
  | 'pdf' | 'doc' | 'docx' | 'xls' | 'xlsx'
  | 'ppt' | 'pptx' | 'jpg' | 'jpeg' | 'png'
  | 'gif' | 'mp3' | 'mp4' | 'mov' | 'txt'
  | 'zip' | 'other';

// ─────────────────────────────────────────────────────────────────────────────
// Sub-types
// ─────────────────────────────────────────────────────────────────────────────

export interface VersionEntry {
  _id: string;
  version: number;
  fileUrl: string;
  publicId: string;
  uploadedBy: { _id: string; email: string } | string;
  uploadedAt: string;
  changeNote?: string;
  fileSizeBytes?: number;
}

export interface DocumentAccess {
  level: AccessLevel;
  allowedRoles: string[];
  allowedUserIds: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Folder
// ─────────────────────────────────────────────────────────────────────────────

export interface Folder {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string | null;
  category?: DocumentCategory;
  color: string;
  icon: string;
  access: DocumentAccess;
  createdBy: { _id: string; email: string } | string;
  createdAt: string;
  updatedAt: string;
  // UI helpers
  children?: Folder[];
  documentCount?: number;
}

export interface FolderContents {
  folder: Folder | null;
  subFolders: Folder[];
  documents: DocumentRecord[];
  counts: { subFolders: number; documents: number };
}

// ─────────────────────────────────────────────────────────────────────────────
// Document Record
// ─────────────────────────────────────────────────────────────────────────────

export interface DocumentRecord {
  _id: string;
  title: string;
  description?: string;
  category: DocumentCategory;
  status: DocumentStatus;

  fileUrl: string;
  publicId: string;
  fileName: string;
  fileType: FileType;
  fileSizeBytes?: number;
  mimeType?: string;
  thumbnailUrl?: string;

  folderId?: { _id: string; name: string; slug: string; color: string; icon: string } | string | null;
  tags: string[];
  access: DocumentAccess;

  currentVersion: number;
  versionHistory: VersionEntry[];

  // Sermon
  sermonDate?: string;
  sermonSpeaker?: string;
  sermonSeries?: string;
  sermonScripture?: string;

  // Member doc
  memberId?: { _id: string; firstName: string; lastName: string; membershipId: string; photoUrl?: string } | string;

  // Event media
  eventId?: { _id: string; title: string; startDate: string } | string;

  // Meeting
  departmentId?: { _id: string; name: string } | string;
  meetingDate?: string;

  uploadedBy: { _id: string; email: string } | string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Stats
// ─────────────────────────────────────────────────────────────────────────────

export interface DocumentStats {
  totalDocuments: number;
  totalFolders: number;
  newThisMonth: number;
  storageMB: number;
  storageBytes: number;
  byCategory: Partial<Record<DocumentCategory, number>>;
  byFileType: Partial<Record<FileType, number>>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Search result
// ─────────────────────────────────────────────────────────────────────────────

export interface SearchResult {
  query: string;
  documents: DocumentRecord[];
  folders: Folder[];
  total: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Form types
// ─────────────────────────────────────────────────────────────────────────────

export interface UploadDocumentForm {
  title: string;
  description?: string;
  category: DocumentCategory;
  folderId?: string;
  tags?: string;
  accessLevel?: AccessLevel;
  // Sermon
  sermonDate?: string;
  sermonSpeaker?: string;
  sermonSeries?: string;
  sermonScripture?: string;
  // Member
  memberId?: string;
  // Event
  eventId?: string;
  // Meeting
  departmentId?: string;
  meetingDate?: string;
  changeNote?: string;
}

export interface CreateFolderForm {
  name: string;
  description?: string;
  parentId?: string;
  category?: DocumentCategory;
  color?: string;
  icon?: string;
  accessLevel?: AccessLevel;
}

// ─────────────────────────────────────────────────────────────────────────────
// UI helpers
// ─────────────────────────────────────────────────────────────────────────────

export const DOCUMENT_CATEGORY_LABELS: Record<DocumentCategory, string> = {
  sermon:          'Sermon Archive',
  constitution:    'Constitution & Policies',
  member_document: 'Member Documents',
  board_minutes:   'Board Minutes',
  dept_minutes:    'Dept. Minutes',
  event_media:     'Event Media',
  financial:       'Financial Docs',
  legal:           'Contracts & Legal',
  general:         'General',
};

export const DOCUMENT_CATEGORY_ICONS: Record<DocumentCategory, string> = {
  sermon:          '🎙️',
  constitution:    '📜',
  member_document: '🪪',
  board_minutes:   '🏛️',
  dept_minutes:    '🗂️',
  event_media:     '🖼️',
  financial:       '💰',
  legal:           '⚖️',
  general:         '📋',
};

export const DOCUMENT_CATEGORY_COLORS: Record<DocumentCategory, string> = {
  sermon:          '#8b5cf6',
  constitution:    '#DAA520',
  member_document: '#3b82f6',
  board_minutes:   '#f59e0b',
  dept_minutes:    '#06b6d4',
  event_media:     '#ec4899',
  financial:       '#10b981',
  legal:           '#ef4444',
  general:         '#6b7280',
};

export const FILE_TYPE_ICONS: Record<string, string> = {
  pdf:   '📄',
  doc:   '📝',
  docx:  '📝',
  xls:   '📊',
  xlsx:  '📊',
  ppt:   '📊',
  pptx:  '📊',
  jpg:   '🖼️',
  jpeg:  '🖼️',
  png:   '🖼️',
  gif:   '🖼️',
  mp3:   '🎵',
  mp4:   '🎬',
  mov:   '🎬',
  txt:   '📃',
  zip:   '🗜️',
  other: '📎',
};

export const FILE_TYPE_COLORS: Record<string, string> = {
  pdf:  '#ef4444',
  doc:  '#3b82f6', docx: '#3b82f6',
  xls:  '#10b981', xlsx: '#10b981',
  ppt:  '#f59e0b', pptx: '#f59e0b',
  jpg:  '#ec4899', jpeg: '#ec4899', png: '#ec4899', gif: '#ec4899',
  mp3:  '#8b5cf6',
  mp4:  '#06b6d4', mov: '#06b6d4',
  txt:  '#6b7280',
  zip:  '#DAA520',
  other:'#6b7280',
};

export const ACCESS_LEVEL_LABELS: Record<AccessLevel, string> = {
  public:       'Everyone',
  members_only: 'Members Only',
  staff_only:   'Staff Only',
  admin_only:   'Admins Only',
  pastor_only:  'Pastor Only',
};

/** Format bytes to human-readable string */
export const formatFileSize = (bytes?: number): string => {
  if (!bytes) return '—';
  if (bytes < 1024)           return `${bytes} B`;
  if (bytes < 1024 * 1024)    return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3)      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
};

/** Check if file type is previewable in-browser */
export const isPreviewable = (fileType: string): boolean =>
  ['jpg','jpeg','png','gif','pdf','mp3','mp4','mov','txt'].includes(fileType);

/** Check if file is an image */
export const isImage = (fileType: string): boolean =>
  ['jpg','jpeg','png','gif'].includes(fileType);

/** Check if file is media (audio/video) */
export const isMedia = (fileType: string): boolean =>
  ['mp3','mp4','mov'].includes(fileType);
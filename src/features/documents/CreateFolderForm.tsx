/**
 * ChurchOS — src/features/documents/CreateFolderForm.tsx
 * Module 13 — Document & Records
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import type { CreateFolderForm as FormData, Folder, DocumentCategory } from '../../types/document.types';
import { DOCUMENT_CATEGORY_LABELS, DOCUMENT_CATEGORY_ICONS, ACCESS_LEVEL_LABELS } from '../../types/document.types';

interface Props {
  folders: Folder[];
  onSuccess: () => void;
  onCancel: () => void;
}

const FOLDER_ICONS = ['📁','🗂️','📂','🎙️','📜','🪪','🏛️','💰','⚖️','🖼️','🎬','📊','📝','🔒'];
const FOLDER_COLORS = ['#DAA520','#3b82f6','#10b981','#8b5cf6','#ef4444','#f59e0b','#06b6d4','#ec4899','#6b7280'];

export default function CreateFolderForm({ folders, onSuccess, onCancel }: Props) {
  const [selectedIcon, setSelectedIcon] = useState('📁');
  const [selectedColor, setSelectedColor] = useState('#DAA520');

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    defaultValues: { accessLevel: 'staff_only' },
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      api.post('/documents/folders', {
        ...data,
        icon:  selectedIcon,
        color: selectedColor,
        access: { level: data.accessLevel || 'staff_only', allowedRoles: [], allowedUserIds: [] },
      }),
    onSuccess: () => { toast.success('Folder created!'); onSuccess(); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to create folder'),
  });

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
      <style>{`
        .cf-field { transition: all 0.2s ease; }
        .cf-field:focus-within { transform: translateY(-1px); }
        .icon-btn { width:36px; height:36px; border-radius:10px; font-size:18px; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all 0.15s; border:2px solid transparent; }
        .icon-btn:hover { background: rgba(255,255,255,0.06); }
        .icon-btn.active { border-color: #DAA520; background: rgba(218,165,32,0.12); }
        .color-dot { width:24px; height:24px; border-radius:50%; cursor:pointer; transition:all 0.15s; border:2px solid transparent; }
        .color-dot:hover { transform: scale(1.15); }
        .color-dot.active { border-color: white; transform: scale(1.15); }
      `}</style>

      {/* Name */}
      <div className="cf-field">
        <label className="label">Folder Name *</label>
        <input className="input" placeholder="e.g. 2024 Financial Records..."
          {...register('name', { required: 'Folder name is required' })} />
        {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
      </div>

      <div className="cf-field">
        <label className="label">Description</label>
        <input className="input" placeholder="What's in this folder..." {...register('description')} />
      </div>

      {/* Icon picker */}
      <div className="cf-field">
        <label className="label">Icon</label>
        <div className="flex flex-wrap gap-1.5 mt-1">
          {FOLDER_ICONS.map((icon) => (
            <button
              key={icon}
              type="button"
              onClick={() => setSelectedIcon(icon)}
              className={`icon-btn ${selectedIcon === icon ? 'active' : ''}`}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>

      {/* Color picker */}
      <div className="cf-field">
        <label className="label">Color</label>
        <div className="flex flex-wrap gap-2 mt-1">
          {FOLDER_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setSelectedColor(color)}
              className={`color-dot ${selectedColor === color ? 'active' : ''}`}
              style={{ background: color }}
            />
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="flex items-center gap-3 p-3 rounded-xl"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
          style={{ background: `${selectedColor}15`, border: `1px solid ${selectedColor}25` }}>
          {selectedIcon}
        </div>
        <div>
          <p className="text-xs text-text-muted mb-0.5">Preview</p>
          <p className="text-sm font-semibold" style={{ color: selectedColor }}>New Folder</p>
        </div>
      </div>

      {/* Parent folder */}
      <div className="cf-field">
        <label className="label">Parent Folder <span className="text-text-muted font-normal">(optional)</span></label>
        <select className="input" {...register('parentId')}>
          <option value="">Root (top level)</option>
          {folders.map((f) => (
            <option key={f._id} value={f._id}>{f.icon} {f.name}</option>
          ))}
        </select>
      </div>

      {/* Category */}
      <div className="cf-field">
        <label className="label">Category <span className="text-text-muted font-normal">(optional)</span></label>
        <select className="input" {...register('category')}>
          <option value="">No category</option>
          {(Object.keys(DOCUMENT_CATEGORY_LABELS) as DocumentCategory[]).map((cat) => (
            <option key={cat} value={cat}>
              {DOCUMENT_CATEGORY_ICONS[cat]} {DOCUMENT_CATEGORY_LABELS[cat]}
            </option>
          ))}
        </select>
      </div>

      {/* Access */}
      <div className="cf-field">
        <label className="label">Access Level</label>
        <select className="input" {...register('accessLevel')}>
          {Object.entries(ACCESS_LEVEL_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
      </div>

      <div className="flex justify-end gap-3 pt-1">
        <button type="button" onClick={onCancel} className="btn-ghost">Cancel</button>
        <button type="submit" disabled={mutation.isPending} className="btn-gold">
          {mutation.isPending ? 'Creating...' : 'Create Folder'}
        </button>
      </div>
    </form>
  );
}
/**
 * ChurchOS — src/features/onlineMinistry/sermons/SermonForm.tsx
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { sermonsApi } from '../../../lib/onlineministry.api';
import type { Sermon, SermonFormData, SermonMedia } from '../../../types/onlineministry.types';

interface Props {
  sermon?: Sermon;
  onSuccess: () => void;
  onCancel: () => void;
}

type MediaEntry = Omit<SermonMedia, '_id'>;

export default function SermonForm({ sermon, onSuccess, onCancel }: Props) {
  const [scriptureTags, setScriptureTags] = useState<string[]>(sermon?.scriptureTags ?? []);
  const [scriptureInput, setScriptureInput] = useState('');
  const [tags, setTags] = useState<string[]>(sermon?.tags ?? []);
  const [tagInput, setTagInput] = useState('');
  const [mediaList, setMediaList] = useState<MediaEntry[]>(
    sermon?.media?.map(({ _id, ...rest }) => rest) ?? []
  );

  const { register, handleSubmit, formState: { errors } } = useForm<Omit<SermonFormData, 'scriptureTags' | 'tags' | 'media'>>({
    defaultValues: {
      title: sermon?.title ?? '',
      speaker: sermon?.speaker ?? '',
      series: sermon?.series ?? '',
      description: sermon?.description ?? '',
      preachedDate: sermon?.preachedDate?.slice(0, 10) ?? '',
      thumbnailUrl: sermon?.thumbnailUrl ?? '',
      isPublished: sermon?.isPublished ?? false,
    },
  });

  const addScripture = () => {
    const v = scriptureInput.trim();
    if (v && !scriptureTags.includes(v)) { setScriptureTags(p => [...p, v]); setScriptureInput(''); }
  };

  const addTag = () => {
    const v = tagInput.trim();
    if (v && !tags.includes(v)) { setTags(p => [...p, v]); setTagInput(''); }
  };

  const addMedia = () => {
    setMediaList(p => [...p, { platform: 'youtube', url: '', type: 'video' }]);
  };

  const updateMedia = (i: number, field: keyof MediaEntry, value: string) => {
    setMediaList(p => p.map((m, idx) => idx === i ? { ...m, [field]: value } : m));
  };

  const removeMedia = (i: number) => {
    setMediaList(p => p.filter((_, idx) => idx !== i));
  };

  const mutation = useMutation({
    mutationFn: (data: any) =>
      sermon ? sermonsApi.update(sermon._id, data) : sermonsApi.create(data),
    onSuccess: () => { toast.success(sermon ? 'Sermon updated' : 'Sermon added'); onSuccess(); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to save sermon'),
  });

  const onSubmit = (data: any) => {
    mutation.mutate({ ...data, scriptureTags, tags, media: mediaList });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="label">Title *</label>
          <input className="input" {...register('title', { required: 'Required' })} placeholder="The Power of Faith" />
          {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>}
        </div>
        <div>
          <label className="label">Speaker *</label>
          <input className="input" {...register('speaker', { required: 'Required' })} placeholder="Pastor John Doe" />
          {errors.speaker && <p className="text-red-400 text-xs mt-1">{errors.speaker.message}</p>}
        </div>
        <div>
          <label className="label">Series</label>
          <input className="input" {...register('series')} placeholder="Faith Series" />
        </div>
        <div>
          <label className="label">Preached Date *</label>
          <input type="date" className="input" {...register('preachedDate', { required: 'Required' })} />
          {errors.preachedDate && <p className="text-red-400 text-xs mt-1">{errors.preachedDate.message}</p>}
        </div>
        <div>
          <label className="label">Thumbnail URL</label>
          <input className="input" {...register('thumbnailUrl')} placeholder="https://..." />
        </div>
        <div className="col-span-2">
          <label className="label">Description</label>
          <textarea className="input" rows={2} {...register('description')} placeholder="Brief overview..." />
        </div>
      </div>

      {/* Scripture Tags */}
      <div>
        <label className="label">Scripture Tags</label>
        <div className="flex gap-2">
          <input
            value={scriptureInput}
            onChange={(e) => setScriptureInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addScripture(); } }}
            className="input flex-1"
            placeholder="John 3:16 — press Enter"
          />
          <button type="button" onClick={addScripture} className="btn-ghost px-3">Add</button>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {scriptureTags.map((t, i) => (
            <span key={i} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(218,165,32,0.12)', color: '#DAA520', border: '1px solid rgba(218,165,32,0.25)' }}>
              {t}
              <button type="button" onClick={() => setScriptureTags(p => p.filter((_, j) => j !== i))}><X size={10} /></button>
            </span>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="label">Tags</label>
        <div className="flex gap-2">
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
            className="input flex-1"
            placeholder="salvation, healing — press Enter"
          />
          <button type="button" onClick={addTag} className="btn-ghost px-3">Add</button>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {tags.map((t, i) => (
            <span key={i} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(107,114,128,0.12)', color: '#9ca3af' }}>
              {t}
              <button type="button" onClick={() => setTags(p => p.filter((_, j) => j !== i))}><X size={10} /></button>
            </span>
          ))}
        </div>
      </div>

      {/* Media Links */}
      <div>
        <div className="flex items-center justify-between">
          <label className="label">Media Links</label>
          <button type="button" onClick={addMedia} className="text-xs flex items-center gap-1 hover:opacity-80" style={{ color: '#DAA520' }}>
            <Plus size={12} /> Add Link
          </button>
        </div>
        <div className="space-y-2 mt-2">
          {mediaList.map((m, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-center p-3 rounded-xl" style={{ background: 'var(--bg-hover)', border: '1px solid var(--bg-border)' }}>
              <select
                value={m.platform}
                onChange={(e) => updateMedia(i, 'platform', e.target.value)}
                className="input col-span-3 text-xs"
              >
                {['youtube', 'facebook', 'instagram', 'other', 'direct'].map(p => (
                  <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                ))}
              </select>
              <input
                value={m.url}
                onChange={(e) => updateMedia(i, 'url', e.target.value)}
                className="input col-span-6 text-xs"
                placeholder="https://..."
              />
              <select
                value={m.type}
                onChange={(e) => updateMedia(i, 'type', e.target.value)}
                className="input col-span-2 text-xs"
              >
                <option value="video">Video</option>
                <option value="audio">Audio</option>
              </select>
              <button type="button" onClick={() => removeMedia(i)} className="col-span-1 flex justify-center text-red-400 hover:opacity-70">
                <X size={14} />
              </button>
            </div>
          ))}
          {mediaList.length === 0 && (
            <p className="text-xs text-center py-3" style={{ color: 'var(--text-muted)' }}>No media links yet. Add YouTube, Facebook or audio links.</p>
          )}
        </div>
      </div>

      {/* Published */}
      <label className="flex items-center gap-3 cursor-pointer">
        <input type="checkbox" {...register('isPublished')} className="w-4 h-4 accent-yellow-500 rounded" />
        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Publish sermon (visible on public library)</span>
      </label>

      <div className="flex justify-end gap-3 pt-4 border-t border-bg-border">
        <button type="button" onClick={onCancel} className="btn-ghost">Cancel</button>
        <button type="submit" disabled={mutation.isPending} className="btn-gold">
          {mutation.isPending ? 'Saving...' : sermon ? 'Update Sermon' : 'Add Sermon'}
        </button>
      </div>
    </form>
  );
}
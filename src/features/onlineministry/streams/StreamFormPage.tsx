/**
 * ChurchOS — src/features/onlineMinistry/streams/StreamForm.tsx
 */

import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { streamsApi } from '../../../lib/onlineministry.api';
import type { LiveStream, LiveStreamFormData } from '../../../types/onlineministry.types';

interface Props {
  stream?: LiveStream;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function StreamForm({ stream, onSuccess, onCancel }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<LiveStreamFormData>({
    defaultValues: stream ? {
      title: stream.title,
      description: stream.description,
      serviceDate: stream.serviceDate?.slice(0, 16),
      youtubeUrl: stream.youtubeUrl,
      facebookUrl: stream.facebookUrl,
      zoomUrl: stream.zoomUrl,
      zoomMeetingId: stream.zoomMeetingId,
      zoomPasscode: stream.zoomPasscode,
      givingLink: stream.givingLink,
    } : {},
  });

  const mutation = useMutation({
    mutationFn: (data: LiveStreamFormData) =>
      stream ? streamsApi.update(stream._id, data) : streamsApi.create(data),
    onSuccess: () => {
      toast.success(stream ? 'Stream updated' : 'Stream scheduled');
      onSuccess();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to save stream'),
  });

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="label">Title *</label>
          <input className="input" {...register('title', { required: 'Title is required' })} placeholder="Sunday Service — Live" />
          {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>}
        </div>

        <div>
          <label className="label">Service Date & Time *</label>
          <input type="datetime-local" className="input" {...register('serviceDate', { required: 'Date is required' })} />
          {errors.serviceDate && <p className="text-red-400 text-xs mt-1">{errors.serviceDate.message}</p>}
        </div>

        <div>
          <label className="label">Giving Link</label>
          <input className="input" {...register('givingLink')} placeholder="https://give.church.org" />
        </div>

        <div className="col-span-2">
          <label className="label">Description</label>
          <textarea className="input" rows={2} {...register('description')} placeholder="Brief description..." />
        </div>
      </div>

      <p className="text-xs font-semibold uppercase tracking-widest pt-2" style={{ color: 'var(--text-muted)' }}>Platform Links</p>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">YouTube URL</label>
          <input className="input" {...register('youtubeUrl')} placeholder="https://youtube.com/live/..." />
        </div>
        <div>
          <label className="label">Facebook URL</label>
          <input className="input" {...register('facebookUrl')} placeholder="https://facebook.com/..." />
        </div>
        <div>
          <label className="label">Zoom Link</label>
          <input className="input" {...register('zoomUrl')} placeholder="https://zoom.us/j/..." />
        </div>
        <div>
          <label className="label">Zoom Meeting ID</label>
          <input className="input" {...register('zoomMeetingId')} placeholder="123 456 7890" />
        </div>
        <div>
          <label className="label">Zoom Passcode</label>
          <input className="input" {...register('zoomPasscode')} placeholder="Optional" />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-bg-border">
        <button type="button" onClick={onCancel} className="btn-ghost">Cancel</button>
        <button type="submit" disabled={mutation.isPending} className="btn-gold">
          {mutation.isPending ? 'Saving...' : stream ? 'Update Stream' : 'Schedule Stream'}
        </button>
      </div>
    </form>
  );
}
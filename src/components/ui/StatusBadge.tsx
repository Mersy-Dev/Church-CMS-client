import type { MemberStatus, FollowUpStatus, EventStatus } from '../../types';

type BadgeVariant = MemberStatus | FollowUpStatus | EventStatus | string;

const STYLES: Record<string, string> = {
  // Member status
  member:         'bg-blue-900/40 text-blue-300 border border-blue-800/50',
  worker:         'bg-purple-900/40 text-purple-300 border border-purple-800/50',
  leader:         'bg-orange-900/40 text-orange-300 border border-orange-800/50',
  new_convert:    'bg-green-900/40 text-green-300 border border-green-800/50',
  first_timer:    'bg-yellow-900/40 text-yellow-300 border border-yellow-800/50',
  visitor:        'bg-gray-800/60 text-gray-300 border border-gray-700/50',
  archived:       'bg-gray-900/60 text-gray-500 border border-gray-800/50',
  transferred_out:'bg-red-900/30 text-red-400 border border-red-800/40',
  deceased:       'bg-gray-900/60 text-gray-600 border border-gray-800/50',
  // Follow-up status
  pending:        'bg-yellow-900/40 text-yellow-300 border border-yellow-800/50',
  in_progress:    'bg-blue-900/40 text-blue-300 border border-blue-800/50',
  contacted:      'bg-cyan-900/40 text-cyan-300 border border-cyan-800/50',
  converted:      'bg-green-900/40 text-green-400 border border-green-800/50',
  unreachable:    'bg-red-900/40 text-red-400 border border-red-800/50',
  closed:         'bg-gray-800/60 text-gray-400 border border-gray-700/50',
  not_interested: 'bg-gray-800/60 text-gray-500 border border-gray-700/50',
  // Event status
  published:      'bg-green-900/40 text-green-300 border border-green-800/50',
  draft:          'bg-gray-800/60 text-gray-400 border border-gray-700/50',
  cancelled:      'bg-red-900/40 text-red-400 border border-red-800/50',
  completed:      'bg-blue-900/40 text-blue-300 border border-blue-800/50',
};

const LABELS: Record<string, string> = {
  new_convert: 'New Convert',
  first_timer: 'First Timer',
  transferred_out: 'Transferred',
  in_progress: 'In Progress',
  not_interested: 'Not Interested',
};

interface Props {
  status: BadgeVariant;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'md' }: Props) {
  const style = STYLES[status] || 'bg-gray-800 text-gray-400 border border-gray-700';
  const label = LABELS[status] || status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const padding = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-xs';

  return (
    <span className={`inline-flex items-center rounded-lg font-medium ${padding} ${style}`}>
      {label}
    </span>
  );
}

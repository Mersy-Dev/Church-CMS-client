const COLORS = [
  'bg-blue-700', 'bg-purple-700', 'bg-green-700',
  'bg-orange-700', 'bg-red-700', 'bg-teal-700', 'bg-pink-700',
];

function colorFromName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

interface Props {
  name: string;
  photoUrl?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

const SIZES = {
  xs: 'w-5 h-5 text-xs',
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-12 h-12 text-base',
};


export default function Avatar({ name, photoUrl, size = 'md' }: Props) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('');

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name}
        className={`${SIZES[size]} rounded-full object-cover ring-1 ring-bg-border flex-shrink-0`}
      />
    );
  }

  return (
    <div className={`${SIZES[size]} ${colorFromName(name)} rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0`}>
      {initials}
    </div>
  );
}

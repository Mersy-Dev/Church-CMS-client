interface Props { size?: 'sm' | 'md' | 'lg'; }

const SIZES = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' };

export default function Spinner({ size = 'md' }: Props) {
  return (
    <div className={`${SIZES[size]} border-2 border-bg-border border-t-gold rounded-full animate-spin`} />
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <Spinner size="lg" />
        <p className="text-text-muted text-sm">Loading...</p>
      </div>
    </div>
  );
}

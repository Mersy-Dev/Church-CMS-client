import { useEffect } from 'react';
import { X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const SIZES = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export default function Modal({ isOpen, onClose, title, children, size = 'md' }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    /*
     * Overlay uses inline style — NOT className="modal-overlay".
     * theme.css [class*="modal"] forces bg-white in light mode, which
     * would paint the backdrop white. Inline style can't be overridden by it.
     */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in"
      style={{ backgroundColor: 'rgba(0,0,0,0.65)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={`modal-content ${SIZES[size]}`}>

        {/* Header — sits on bg-hover so it's visually distinct from the body */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b border-bg-border rounded-t-2xl"
          style={{ background: 'var(--bg-hover)' }}
        >
          <h2
            className="text-base tracking-tight"
            style={{ fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-bg-border flex items-center justify-center hover:bg-bg-border/80 transition-colors"
          >
            <X size={13} className="text-text-secondary" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">{children}</div>

      </div>
    </div>
  );
} 
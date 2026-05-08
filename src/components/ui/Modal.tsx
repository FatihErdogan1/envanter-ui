import { ReactNode } from 'react';

interface Props {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

export default function Modal({ title, onClose, children, footer }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-bg-surface border border-accent min-w-[400px] max-w-[640px] w-full mx-4">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="font-pixel text-accent text-xs">{title}</span>
          <button
            onClick={onClose}
            className="text-muted hover:text-red font-pixel text-xs transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="p-4">{children}</div>
        {footer && (
          <div className="flex gap-2 justify-end px-4 py-3 border-t border-border">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

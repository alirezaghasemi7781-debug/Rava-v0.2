import React from 'react';
import { ModalShell } from './ModalShell';
import { IconButton } from './IconButton';
import { X } from 'lucide-react';

interface FullPageOverlayProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

export const FullPageOverlay: React.FC<FullPageOverlayProps> = ({
  open,
  onClose,
  children,
  title = 'بستن',
}) => (
  <ModalShell open={open} onClose={onClose} contentClassName="h-[min(92vh,900px)] max-w-lg overflow-hidden">
    <div className="flex h-full flex-col overflow-hidden rounded-rava-modal border border-white/8 bg-rava-elevated shadow-modal">
      <div className="flex shrink-0 items-center justify-between border-b border-white/5 px-4 py-3 pt-safe">
        <span className="text-rava-xs font-black text-white/40">{title}</span>
        <IconButton icon={X} label="بستن" onClick={onClose} size="sm" variant="ghost" />
      </div>
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-safe">{children}</div>
    </div>
  </ModalShell>
);

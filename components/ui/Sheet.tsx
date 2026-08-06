import React from 'react';
import { ModalShell } from './ModalShell';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export const Sheet: React.FC<SheetProps> = ({ open, onClose, children, className = '' }) => (
  <ModalShell
    open={open}
    onClose={onClose}
    align="end"
    contentClassName={`max-w-lg mx-auto ${className}`}
  >
    <div className="rava-sheet w-full px-5 pt-5 pb-safe">
      {children}
    </div>
  </ModalShell>
);

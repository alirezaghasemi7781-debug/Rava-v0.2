import React from 'react';
import { motion as _motion, AnimatePresence } from 'framer-motion';

const motion = _motion as any;

interface ModalShellProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  zClassName?: string;
  align?: 'center' | 'end';
  contentClassName?: string;
  closeOnBackdrop?: boolean;
}

export const ModalShell: React.FC<ModalShellProps> = ({
  open,
  onClose,
  children,
  zClassName = 'z-modal',
  align = 'center',
  contentClassName = '',
  closeOnBackdrop = true,
}) => (
  <AnimatePresence>
    {open && (
      <div className={`fixed inset-0 ${zClassName} flex justify-center ${align === 'end' ? 'items-end' : 'items-center'} px-4 pt-safe pb-safe`}>
        <motion.button
          type="button"
          aria-label="بستن"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="rava-modal-backdrop absolute inset-0"
          onClick={closeOnBackdrop ? onClose : undefined}
        />
        <motion.div
          initial={{ opacity: 0, y: align === 'end' ? 48 : 16, scale: align === 'end' ? 1 : 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: align === 'end' ? 48 : 16, scale: align === 'end' ? 1 : 0.98 }}
          transition={{ type: 'spring', damping: 30, stiffness: 280 }}
          className={`relative w-full ${contentClassName}`}
        >
          {children}
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

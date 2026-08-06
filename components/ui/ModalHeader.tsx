import React from 'react';
import { X } from 'lucide-react';
import { IconButton } from './IconButton';

interface ModalHeaderProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onClose?: () => void;
  className?: string;
}

export const ModalHeader: React.FC<ModalHeaderProps> = ({
  icon,
  title,
  subtitle,
  onClose,
  className = '',
}) => (
  <div className={`mb-6 flex items-start justify-between gap-4 ${className}`}>
    {onClose ? (
      <IconButton icon={X} label="بستن" onClick={onClose} size="sm" variant="ghost" />
    ) : (
      <div className="w-11" />
    )}
    <div className="flex-1 text-right">
      <div className="mb-3 ms-auto flex h-14 w-14 items-center justify-center rounded-rava-xl border border-white/10 bg-white/5 shadow-glass">
        {icon}
      </div>
      <h3 className="rava-page-title text-2xl">{title}</h3>
      {subtitle ? <p className="rava-page-subtitle mt-1">{subtitle}</p> : null}
    </div>
  </div>
);

import React from 'react';
import { ChevronRight } from 'lucide-react';
import { IconButton } from './IconButton';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  backLabel?: string;
  action?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  onBack,
  backLabel = 'بازگشت',
  action,
  className = '',
}) => (
  <div className={`mb-6 flex items-end justify-between ${className}`}>
    <div className="flex items-center gap-2">
      {action}
      {onBack ? (
        <IconButton icon={ChevronRight} label={backLabel} onClick={onBack} size="sm" />
      ) : null}
    </div>
    <div className="text-right">
      <h2 className="rava-page-title">{title}</h2>
      {subtitle ? <p className="rava-page-subtitle mt-0.5">{subtitle}</p> : null}
    </div>
  </div>
);

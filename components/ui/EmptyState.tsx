import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  className?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon: Icon = Inbox,
  className = '',
  action,
}) => (
  <div
    className={`flex flex-col items-center justify-center py-10 px-4 text-center opacity-60 ${className}`}
    role="status"
  >
    <Icon size={40} className="text-white/25 mb-4" strokeWidth={1.5} />
    <p className="text-white font-black text-sm">{title}</p>
    {description && (
      <p className="text-white/40 text-xs mt-2 leading-relaxed max-w-[240px]">{description}</p>
    )}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

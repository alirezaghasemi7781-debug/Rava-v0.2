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
  <div className={`flex flex-col items-center justify-center px-4 py-10 text-center opacity-70 ${className}`} role="status">
    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-rava-xl border border-white/8 bg-white/5 text-white/25">
      <Icon size={22} strokeWidth={1.75} />
    </div>
    <p className="text-rava-base font-black text-white">{title}</p>
    {description ? <p className="mt-2 max-w-[260px] text-rava-sm leading-relaxed text-white/40">{description}</p> : null}
    {action ? <div className="mt-5">{action}</div> : null}
  </div>
);

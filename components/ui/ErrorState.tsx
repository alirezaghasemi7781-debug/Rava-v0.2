import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'خطا در بارگذاری',
  message = 'ارتباط برقرار نشد. دوباره امتحان کن.',
  onRetry,
  retryLabel = 'تلاش مجدد',
  className = '',
}) => (
  <div className={`flex flex-col items-center justify-center px-4 py-10 text-center ${className}`} role="alert">
    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-rava-xl border border-rava-danger/20 bg-rava-danger/10 text-rava-danger">
      <AlertCircle size={22} />
    </div>
    <p className="text-rava-base font-black text-white">{title}</p>
    <p className="mt-2 max-w-[260px] text-rava-sm leading-relaxed text-white/40">{message}</p>
    {onRetry ? (
      <Button className="mt-5" size="sm" onClick={onRetry} leadingIcon={<RefreshCw size={14} />}>
        {retryLabel}
      </Button>
    ) : null}
  </div>
);

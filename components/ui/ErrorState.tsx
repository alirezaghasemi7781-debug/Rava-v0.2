import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

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
  <div
    className={`flex flex-col items-center justify-center py-10 px-4 text-center ${className}`}
    role="alert"
  >
    <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
      <AlertCircle size={22} className="text-red-400" />
    </div>
    <p className="text-white font-black text-sm">{title}</p>
    <p className="text-white/40 text-xs mt-2 leading-relaxed max-w-[260px]">{message}</p>
    {onRetry && (
      <button
        type="button"
        onClick={onRetry}
        className="mt-5 min-h-[44px] px-5 rounded-2xl bg-yellow-500 text-black text-xs font-black flex items-center gap-2 active:scale-[0.97] transition-transform"
      >
        <RefreshCw size={14} />
        {retryLabel}
      </button>
    )}
  </div>
);

import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  error?: string | null;
  ltr?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ icon, error, ltr = false, className = '', ...rest }, ref) => {
    return (
      <div className="space-y-2">
        <div className="group relative">
          <input
            ref={ref}
            className={[
              'rava-input',
              ltr ? 'ltr-island text-left pe-11' : 'text-right ps-11',
              error ? 'border-rava-danger/40 focus:border-rava-danger/60' : '',
              className,
            ].filter(Boolean).join(' ')}
            {...rest}
          />
          {icon && (
            <div className="pointer-events-none absolute inset-y-0 end-4 flex items-center text-white/20 transition-colors group-focus-within:text-rava-gold">
              {icon}
            </div>
          )}
        </div>
        {error ? <p className="text-right text-rava-xs font-bold text-rava-danger">{error}</p> : null}
      </div>
    );
  }
);

Input.displayName = 'Input';

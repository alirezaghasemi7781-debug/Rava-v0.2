import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
}

const sizeClass = {
  sm: 'min-h-tap px-4 text-rava-xs',
  md: 'min-h-btn-md px-5 text-rava-base',
  lg: 'min-h-btn-lg px-6 text-rava-lg',
};

const variantClass = {
  primary: 'rava-btn-primary',
  secondary: 'rava-btn-secondary',
  ghost: 'rava-btn-ghost border border-white/10 hover:bg-white/5',
  danger: 'rava-btn-danger',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  leadingIcon,
  trailingIcon,
  className = '',
  children,
  disabled,
  ...rest
}) => (
  <button
    type="button"
    disabled={disabled || loading}
    className={[
      'rava-btn',
      sizeClass[size],
      variantClass[variant],
      fullWidth ? 'w-full' : '',
      className,
    ].filter(Boolean).join(' ')}
    {...rest}
  >
    {loading ? <Loader2 size={18} className="animate-spin" /> : leadingIcon}
    {children}
    {!loading && trailingIcon}
  </button>
);

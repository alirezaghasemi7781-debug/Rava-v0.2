import React from 'react';
import { LucideIcon } from 'lucide-react';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  label: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'glass' | 'solid' | 'ghost' | 'gold';
  iconSize?: number;
}

const sizeClass = {
  sm: 'h-11 w-11 min-h-tap min-w-tap',
  md: 'h-12 w-12 min-h-tap min-w-tap',
  lg: 'h-14 w-14 min-h-[56px] min-w-[56px]',
};

const variantClass = {
  glass: 'glass border-white/5 text-white/80 hover:text-white',
  solid: 'bg-white/10 text-white hover:bg-white/15',
  ghost: 'bg-transparent text-white/50 hover:bg-white/5 hover:text-white',
  gold: 'bg-rava-gold text-black shadow-gold',
};

export const IconButton: React.FC<IconButtonProps> = ({
  icon: Icon,
  label,
  size = 'md',
  variant = 'glass',
  iconSize = 20,
  className = '',
  disabled,
  ...rest
}) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    disabled={disabled}
    className={[
      sizeClass[size],
      variantClass[variant],
      'flex items-center justify-center rounded-full transition-all active:scale-[0.97] disabled:pointer-events-none disabled:opacity-[var(--state-disabled-opacity,0.4)]',
      className,
    ].join(' ')}
    {...rest}
  >
    <Icon size={iconSize} />
  </button>
);

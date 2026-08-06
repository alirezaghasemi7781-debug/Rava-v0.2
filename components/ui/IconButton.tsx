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
  sm: 'w-11 h-11 min-w-[44px] min-h-[44px]',
  md: 'w-12 h-12 min-w-[44px] min-h-[44px]',
  lg: 'w-14 h-14 min-w-[56px] min-h-[56px]',
};

const variantClass = {
  glass: 'glass text-white/80 hover:text-white border-white/5',
  solid: 'bg-white/10 text-white hover:bg-white/15',
  ghost: 'bg-transparent text-white/50 hover:text-white hover:bg-white/5',
  gold: 'bg-yellow-500 text-black shadow-lg',
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
    className={`
      ${sizeClass[size]} ${variantClass[variant]}
      rounded-full flex items-center justify-center
      active:scale-[0.97] transition-all
      disabled:opacity-[var(--state-disabled-opacity,0.4)] disabled:pointer-events-none
      ${className}
    `}
    {...rest}
  >
    <Icon size={iconSize} />
  </button>
);

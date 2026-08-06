import React from 'react';

interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  leading?: React.ReactNode;
}

export const Chip: React.FC<ChipProps> = ({ active = false, leading, className = '', children, ...rest }) => (
  <button
    type="button"
    className={[
      'rava-chip shrink-0',
      active ? 'rava-chip-active' : 'hover:border-rava-gold/25',
      className,
    ].filter(Boolean).join(' ')}
    {...rest}
  >
    {leading}
    {children}
  </button>
);

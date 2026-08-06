import React from 'react';

interface SkeletonProps {
  className?: string;
  /** Number of stacked bars (ignored when children provided) */
  lines?: number;
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const radiusMap = {
  sm: 'rounded-lg',
  md: 'rounded-xl',
  lg: 'rounded-2xl',
  xl: 'rounded-[1.8rem]',
  full: 'rounded-full',
};

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  lines = 1,
  rounded = 'md',
}) => {
  if (lines <= 1) {
    return (
      <div
        className={`animate-pulse bg-white/[0.06] ${radiusMap[rounded]} ${className}`}
        aria-hidden
      />
    );
  }

  return (
    <div className={`space-y-3 ${className}`} aria-hidden>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`animate-pulse bg-white/[0.06] h-3 ${radiusMap[rounded]} ${
            i === lines - 1 ? 'w-2/3' : 'w-full'
          }`}
        />
      ))}
    </div>
  );
};

/** Horizontal place-card shimmer for Explore sections */
export const SkeletonPlaceRow: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <div className="flex gap-3 overflow-hidden">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="shrink-0 w-36 space-y-2">
        <Skeleton className="h-28 w-36" rounded="xl" />
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-2 w-20" />
      </div>
    ))}
  </div>
);

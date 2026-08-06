import React from 'react';

interface SkeletonProps {
  className?: string;
  lines?: number;
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const radiusMap = {
  sm: 'rounded-rava-sm',
  md: 'rounded-rava-md',
  lg: 'rounded-rava-lg',
  xl: 'rounded-rava-xl',
  full: 'rounded-full',
};

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', lines = 1, rounded = 'md' }) => {
  if (lines <= 1) {
    return <div className={`animate-pulse bg-white/[0.06] ${radiusMap[rounded]} ${className}`} aria-hidden />;
  }

  return (
    <div className={`space-y-3 ${className}`} aria-hidden>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`h-3 animate-pulse bg-white/[0.06] ${radiusMap[rounded]} ${i === lines - 1 ? 'w-2/3' : 'w-full'}`}
        />
      ))}
    </div>
  );
};

export const SkeletonPlaceRow: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <div className="flex gap-3 overflow-hidden">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="w-[7.5rem] shrink-0 space-y-2">
        <Skeleton className="h-[5.25rem] w-full" rounded="xl" />
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-2 w-16" />
      </div>
    ))}
  </div>
);

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { POI } from '../../types';
import { PlaceChip } from './PlaceChip';
import { SkeletonPlaceRow, EmptyState, ErrorState } from '../ui';

interface ExploreSectionProps {
  title: string;
  icon?: LucideIcon;
  places: POI[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
}

export const ExploreSection: React.FC<ExploreSectionProps> = ({
  title,
  icon: Icon,
  places,
  loading,
  error,
  onRetry,
  emptyTitle = 'چیزی پیدا نشد',
  emptyDescription = 'وقتی دیتا بیاد اینجا می‌بینی.',
}) => (
  <section className="space-y-4">
    <div className="flex items-center justify-end gap-2">
      <h3 className="text-white font-black text-base">{title}</h3>
      {Icon && <Icon size={16} className="text-yellow-500" />}
    </div>

    {loading ? (
      <SkeletonPlaceRow count={3} />
    ) : error ? (
      <ErrorState
        title="بارگذاری ناموفق"
        message={error}
        onRetry={onRetry}
        className="py-6"
      />
    ) : places.length === 0 ? (
      <EmptyState title={emptyTitle} description={emptyDescription} className="py-6 opacity-40" />
    ) : (
      <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar -mx-1 px-1">
        {places.map((p) => (
          <PlaceChip key={p.id} place={p} />
        ))}
      </div>
    )}
  </section>
);

import React from 'react';
import { motion as _motion } from 'framer-motion';
import { MapPin, Heart, MessageCircle } from 'lucide-react';
import { POI } from '../../types';
import { useMapStore } from '../../store/useMapStore';
import { useUIStore } from '../../store/useUIStore';
import { AudioGraph } from '../../services/audioGraph';
import { getOptimizedImageUrl } from '../../utils/helpers';

const motion = _motion as any;

interface VibeCardProps {
  place: POI;
  index: number;
}

const FallbackIcon = ({ category }: { category: string }) => {
  const c = category?.toLowerCase() || '';
  let icon = '📍';

  if (c.includes('restaurant') || c.includes('food')) icon = '🍱';
  else if (c.includes('cafe') || c.includes('coffee')) icon = '☕';
  else if (c.includes('shopping') || c.includes('store') || c.includes('mall')) icon = '🛍️';
  else if (c.includes('park') || c.includes('nature')) icon = '🌳';
  else if (c.includes('museum') || c.includes('historical') || c.includes('mosque')) icon = '🕌';

  return (
    <div className="flex h-full w-full items-center justify-center rounded-rava-modal bg-gradient-to-br from-neutral-800 to-black">
      <span className="text-6xl drop-shadow-2xl grayscale-[0.3]">{icon}</span>
    </div>
  );
};

export const VibeCard: React.FC<VibeCardProps> = ({ place, index }) => {
  const { setActivePOI, setFullDetailPOI } = useMapStore();
  const { setActiveTab } = useUIStore();

  const handleOpenDetails = () => {
    AudioGraph.getInstance().playTickSound();
    AudioGraph.haptic(10);
    setActivePOI(place);
    setFullDetailPOI(place);
  };

  const handleShowOnMap = (e: React.MouseEvent) => {
    e.stopPropagation();
    AudioGraph.getInstance().playTickSound();
    setActivePOI(place);
    setActiveTab('home');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.5, ease: [0.33, 1, 0.68, 1] }}
      onClick={handleOpenDetails}
      className="group relative mb-8 h-[min(500px,70vh)] cursor-pointer overflow-hidden rounded-rava-modal border border-white/5 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6)] transition-transform active:scale-[0.98]"
    >
      <div className="absolute inset-0">
        {place.image ? (
          <motion.img
            layoutId={`img-${place.id}`}
            src={getOptimizedImageUrl(place.image, 800)}
            className="h-full w-full object-cover transition-transform duration-[2000ms] group-hover:scale-105"
            alt={place.name}
            loading="lazy"
          />
        ) : (
          <FallbackIcon category={place.category} />
        )}
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-90" />

      <div className="absolute end-8 top-8">
        <span className="glass rounded-full border-white/10 px-6 py-2.5 text-rava-xs font-black uppercase tracking-[0.15em] text-white shadow-lg backdrop-blur-md">
          {place.category?.replace('_', ' ') || 'مکان خاص'}
        </span>
      </div>

      <div className="absolute inset-x-8 bottom-10 text-right">
        <motion.h4 layoutId={`title-${place.id}`} className="mb-4 text-3xl font-black leading-tight text-white drop-shadow-[0_5px_15px_rgba(0,0,0,0.8)]">
          {place.name}
        </motion.h4>

        <p className="mb-6 line-clamp-2 ps-4 text-rava-sm font-medium leading-relaxed text-white/70">{place.description}</p>

        <div className="flex items-center justify-between border-t border-white/10 pt-5">
          <div className="flex gap-6">
            <div className="flex items-center gap-1.5 text-rava-xs font-bold text-white/40">
              <Heart size={16} /> ۳۴۰
            </div>
            <div className="flex items-center gap-1.5 text-rava-xs font-bold text-white/40">
              <MessageCircle size={16} /> ۱۲
            </div>
          </div>

          <button
            type="button"
            onClick={handleShowOnMap}
            className="flex items-center gap-2 rounded-rava-lg bg-white/10 px-5 py-2.5 text-rava-xs font-black uppercase tracking-wider text-white backdrop-blur-md transition-colors hover:bg-white/20"
          >
            <MapPin size={14} /> مشاهده در نقشه
          </button>
        </div>
      </div>
    </motion.div>
  );
};

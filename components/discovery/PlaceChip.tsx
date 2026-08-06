import React from 'react';
import { MapPin } from 'lucide-react';
import { POI } from '../../types';
import { useMapStore } from '../../store/useMapStore';
import { useUIStore } from '../../store/useUIStore';
import { AudioGraph } from '../../services/audioGraph';
import { getOptimizedImageUrl } from '../../utils/helpers';

interface PlaceChipProps {
  place: Pick<POI, 'id' | 'name' | 'category' | 'image' | 'lat' | 'lng' | 'rating' | 'priceLevel'>;
}

export const PlaceChip: React.FC<PlaceChipProps> = ({ place }) => {
  const { setActivePOI, setFullDetailPOI } = useMapStore();
  const { setActiveTab } = useUIStore();

  const open = () => {
    AudioGraph.getInstance().playTickSound();
    const poi = place as POI;
    setActivePOI(poi);
    setFullDetailPOI(poi);
    setActiveTab('home');
  };

  return (
    <button
      type="button"
      onClick={open}
      className="shrink-0 w-36 text-right active:scale-[0.97] transition-transform"
    >
      <div className="h-28 w-36 rounded-[1.25rem] overflow-hidden border border-white/5 bg-white/[0.03] mb-2 relative">
        {place.image ? (
          <img
            src={getOptimizedImageUrl(place.image, 320)}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-800 to-black">
            <MapPin size={22} className="text-white/20" />
          </div>
        )}
        {place.rating != null && place.rating > 0 && (
          <span className="absolute bottom-1 start-1 text-[9px] font-black bg-black/70 text-yellow-500 px-1.5 py-0.5 rounded-lg ltr-island">
            ★ {place.rating.toFixed(1)}
          </span>
        )}
      </div>
      <p className="text-white text-[11px] font-black truncate leading-tight">{place.name}</p>
      <p className="text-white/30 text-[9px] font-bold mt-0.5 truncate">{place.category}</p>
    </button>
  );
};

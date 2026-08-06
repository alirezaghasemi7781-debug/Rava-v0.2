import React from 'react';
import { X, MapPin, Check } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { useUserStore } from '../../store/useUserStore';
import { AudioGraph } from '../../services/audioGraph';
import type { CityMode } from '../../types';
import { Sheet, IconButton } from '../ui';

const CITIES: { id: CityMode; name: string; desc: string; img: string }[] = [
  {
    id: 'Istanbul',
    name: 'استانبول',
    desc: 'شهر رنگ‌ها و طعم‌های شرقی',
    img: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&q=75&w=600',
  },
  {
    id: 'Dubai',
    name: 'دبی',
    desc: 'تجربه دنیای مدرن و لوکس',
    img: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&q=75&w=600',
  },
];

export const CityPickerModal: React.FC = () => {
  const { showCityPicker, setShowCityPicker } = useUIStore();
  const { cityMode, setCityMode } = useUserStore();

  const selectCity = (city: CityMode) => {
    AudioGraph.getInstance().playTickSound();
    setCityMode(city);
    setShowCityPicker(false);
  };

  return (
    <Sheet open={showCityPicker} onClose={() => setShowCityPicker(false)}>
      <div className="mb-5 flex items-center justify-between">
        <IconButton icon={X} label="بستن" onClick={() => setShowCityPicker(false)} size="sm" variant="ghost" />
        <div className="text-right">
          <h2 className="rava-page-title">انتخاب شهر</h2>
          <p className="rava-page-subtitle mt-0.5">مقصد فعلی سفرت رو عوض کن</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 pb-4">
        {CITIES.map((city) => {
          const selected = cityMode === city.id;
          return (
            <button
              key={city.id}
              type="button"
              onClick={() => selectCity(city.id)}
              className={`relative overflow-hidden rounded-rava-xl text-right outline-none transition-all active:scale-[0.98] ${
                selected
                  ? 'ring-2 ring-rava-gold/80 shadow-[0_0_20px_rgba(234,179,8,0.15)]'
                  : 'ring-1 ring-white/10 opacity-90 hover:opacity-100'
              }`}
            >
              <div className="relative aspect-[4/3]">
                <img src={city.img} alt="" className="absolute inset-0 h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-3">
                  <div className="mb-0.5 flex items-center justify-end gap-1.5 text-rava-gold">
                    <span className="text-rava-sm font-black text-white">{city.name}</span>
                    <MapPin size={14} />
                  </div>
                  <p className="text-rava-xs font-bold leading-snug text-white/55">{city.desc}</p>
                </div>
                {selected && (
                  <div className="absolute start-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-rava-gold text-black">
                    <Check size={14} strokeWidth={3} />
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </Sheet>
  );
};

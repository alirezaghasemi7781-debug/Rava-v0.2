import React from 'react';
import { motion as _motion } from 'framer-motion';
import { X, Heart, MapPin, Trash2 } from 'lucide-react';
import { GlassCard } from '../../../components/core/GlassCard';
import { useUserStore } from '../../../store/useUserStore';
import { useUIStore } from '../../../store/useUIStore';
import { selectPOI } from '../../../services/poiSelectionService';
import { AudioGraph } from '../../../services/audioGraph';

const motion = _motion as any;

interface FavoritesModalProps {
  onClose: () => void;
}

export const FavoritesModal: React.FC<FavoritesModalProps> = ({ onClose }) => {
  const { favorites, toggleFavorite } = useUserStore();
  const { setActiveTab } = useUIStore();

  const handleLocate = async (fav: (typeof favorites)[0]) => {
    AudioGraph.getInstance().playTickSound();
    const lat = fav.snapshot.lat;
    const lng = fav.snapshot.lng;
    await selectPOI(
      {
        id: fav.placeId,
        name: fav.snapshot.name,
        category: fav.snapshot.category,
        image: fav.snapshot.image,
        address: fav.snapshot.address,
        lat: typeof lat === 'number' ? lat : 0,
        lng: typeof lng === 'number' ? lng : 0,
      },
      {
        source: 'favorite',
        fetchEssentials: !(typeof lat === 'number' && typeof lng === 'number' && lat !== 0 && lng !== 0),
      },
    );
    setActiveTab('home');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[6000] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg h-[80vh] flex flex-col">
        <GlassCard className="border-white/5 p-8 rounded-[4rem] flex-1 flex flex-col relative overflow-hidden">
          <button onClick={onClose} className="absolute top-8 left-8 text-white/20 active:scale-90 transition-transform z-20">
            <X size={24} />
          </button>

          <div className="flex flex-col items-center gap-2 mb-10 shrink-0">
            <div className="w-16 h-16 bg-red-500/10 rounded-3xl flex items-center justify-center text-red-500 border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.1)]">
              <Heart size={32} fill="currentColor" />
            </div>
            <h3 className="text-2xl font-black text-white">خزانه علاقه‌مندی‌ها</h3>
            <p className="text-white/30 text-[10px] font-bold uppercase tracking-[0.3em]">Your Bookmarked Legacy</p>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar pr-1">
            {favorites.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-20 gap-4">
                <Heart size={64} strokeWidth={1} />
                <p className="text-xs font-black uppercase tracking-widest text-center px-10">هنوز جایی رو قلبی نکردی رفیق!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {favorites.map((fav) => (
                  <div key={fav.id} className="glass p-4 rounded-[2.5rem] border-white/5 flex items-center gap-4 group">
                    <div className="w-20 h-20 rounded-3xl bg-neutral-800 overflow-hidden shrink-0 border border-white/5">
                      {fav.snapshot.image ? (
                        <img src={fav.snapshot.image} className="w-full h-full object-cover" alt={fav.snapshot.name} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">📍</div>
                      )}
                    </div>
                    
                    <div className="flex-1 text-right">
                       <h4 className="text-white font-black text-sm truncate">{fav.snapshot.name}</h4>
                       <span className="text-white/20 text-[8px] font-bold uppercase block mt-1">{fav.snapshot.category.replace('_', ' ')}</span>
                       
                       <div className="flex gap-2 mt-3">
                         <button 
                           onClick={() => handleLocate(fav)}
                           className="bg-yellow-500 text-black px-4 py-1.5 rounded-xl text-[9px] font-black flex items-center gap-1.5 active:scale-95 transition-all"
                         >
                           <MapPin size={10} /> مشاهده روی نقشه
                         </button>
                         <button 
                           onClick={() => toggleFavorite({ id: fav.placeId } as any)}
                           className="bg-white/5 text-red-500/60 p-1.5 rounded-xl hover:bg-red-500/10 hover:text-red-500 transition-all"
                         >
                           <Trash2 size={14} />
                         </button>
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-white/5 text-center shrink-0">
             <p className="text-[9px] text-white/30 font-medium leading-relaxed">
               این مکان‌ها در حافظه بلندمدت راوا ثبت شده‌اند و در پیشنهادهای بعدی اولویت دارند.
             </p>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
};

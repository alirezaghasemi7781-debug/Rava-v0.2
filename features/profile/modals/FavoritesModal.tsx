import React from 'react';
import { X, Heart, MapPin, Trash2 } from 'lucide-react';
import { useUserStore } from '../../../store/useUserStore';
import { useUIStore } from '../../../store/useUIStore';
import { selectPOI } from '../../../services/poiSelectionService';
import { AudioGraph } from '../../../services/audioGraph';
import { ModalShell, ModalCard, IconButton, EmptyState, Button } from '../../../components/ui';

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
      }
    );
    setActiveTab('home');
    onClose();
  };

  return (
    <ModalShell open={true} onClose={onClose} contentClassName="max-w-lg">
      <ModalCard className="flex max-h-[80vh] flex-col">
        <div className="mb-6 flex items-start justify-between">
          <IconButton icon={X} label="بستن" onClick={onClose} size="sm" variant="ghost" />
          <div className="text-right">
            <div className="mb-3 ms-auto flex h-14 w-14 items-center justify-center rounded-rava-xl border border-red-500/20 bg-red-500/10 text-red-500 shadow-glass">
              <Heart size={28} fill="currentColor" />
            </div>
            <h3 className="rava-page-title text-2xl">خزانه علاقه‌مندی‌ها</h3>
            <p className="rava-page-subtitle mt-1 ltr-island">Your Bookmarked Legacy</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pe-1 no-scrollbar">
          {favorites.length === 0 ? (
            <EmptyState title="هنوز جایی رو قلبی نکردی رفیق!" description="هر جایی را ذخیره کنی، اینجا برای بازگشت سریع نگه می‌داریم." icon={Heart} className="h-full" />
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {favorites.map((fav) => (
                <div key={fav.id} className="glass flex items-center gap-4 rounded-rava-modal border-white/5 p-4">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-rava-xl border border-white/5 bg-neutral-800">
                    {fav.snapshot.image ? (
                      <img src={fav.snapshot.image} className="h-full w-full object-cover" alt={fav.snapshot.name} />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-2xl">📍</div>
                    )}
                  </div>
                  <div className="flex-1 text-right">
                    <h4 className="truncate text-rava-base font-black text-white">{fav.snapshot.name}</h4>
                    <span className="mt-1 block text-rava-xs font-bold text-white/25">{fav.snapshot.category.replace('_', ' ')}</span>
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" onClick={() => handleLocate(fav)} leadingIcon={<MapPin size={12} />}>
                        مشاهده روی نقشه
                      </Button>
                      <IconButton icon={Trash2} label="حذف از علاقه‌مندی‌ها" size="sm" variant="ghost" onClick={() => toggleFavorite({ id: fav.placeId } as any)} className="text-rava-danger hover:bg-rava-danger/10 hover:text-rava-danger" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 border-t border-white/5 pt-4 text-center">
          <p className="text-rava-xs leading-relaxed text-white/35">این مکان‌ها در حافظه بلندمدت راوا ثبت شده‌اند و در پیشنهادهای بعدی اولویت دارند.</p>
        </div>
      </ModalCard>
    </ModalShell>
  );
};

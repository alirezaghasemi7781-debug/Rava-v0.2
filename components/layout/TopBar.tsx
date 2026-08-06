import React from 'react';
import { Globe, User } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { OfflineIndicator } from './OfflineIndicator';
import { IconButton } from '../ui';

export const TopBar: React.FC = () => {
  const { setShowCityPicker } = useUIStore();
  const setActiveTab = useUIStore((s) => s.setActiveTab);

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-[1000] flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent px-page pb-2 pt-safe">
      <div className="pointer-events-auto flex items-center gap-2 pt-2">
        <div className="glass flex min-h-tap items-center gap-2.5 rounded-full px-3 py-1.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-rava-gold text-rava-xs font-black text-black">
            ر
          </div>
          <span className="text-rava-sm font-bold text-white">راوا</span>
        </div>
        <OfflineIndicator />
      </div>

      <div className="pointer-events-auto flex gap-1.5 pt-2">
        <IconButton icon={Globe} label="تغییر شهر" size="sm" onClick={() => setShowCityPicker(true)} />
        <IconButton icon={User} label="پروفایل" size="sm" onClick={() => setActiveTab('profile')} />
      </div>
    </header>
  );
};

import React from 'react';
import { useUserStore } from '../../store/useUserStore';
import { Globe, User } from 'lucide-react';
import { OfflineIndicator } from './OfflineIndicator';
import { IconButton } from '../ui';

export const TopBar: React.FC = () => {
  const { setCityMode } = useUserStore();

  return (
    <header className="fixed top-0 inset-x-0 z-[1000] pt-safe px-4 pb-2 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
      <div className="flex items-center gap-3 pt-3">
        <div className="flex items-center gap-3 glass px-4 py-2 rounded-full min-h-[44px]">
          <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center text-black font-black text-xs">
            ر
          </div>
          <span className="text-white font-bold text-sm">راوا</span>
        </div>
        <OfflineIndicator />
      </div>

      <div className="flex gap-2 pt-3">
        <IconButton
          icon={Globe}
          label="تغییر شهر"
          size="sm"
          onClick={() => setCityMode(null)}
        />
        <IconButton icon={User} label="پروفایل" size="sm" />
      </div>
    </header>
  );
};

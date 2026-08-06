import React from 'react';
import { Camera } from 'lucide-react';
import { useMissionStore } from '../../store/useMissionStore';
import { useUIStore } from '../../store/useUIStore';

interface POIMissionActionProps {
  poiId: string;
  poiName: string;
  onInitiated: () => void;
}

export const POIMissionAction: React.FC<POIMissionActionProps> = ({ poiId, poiName, onInitiated }) => {
  const { startMission, activeMissions } = useMissionStore();
  const { setShowVision } = useUIStore();

  const isMissionActive = activeMissions.some((m) => m.poiId === poiId);

  const handleStart = () => {
    if (isMissionActive) return;
    startMission(poiId, poiName, 100, 250);
    setShowVision(true);
    onInitiated();
  };

  return (
    <button
      type="button"
      onClick={handleStart}
      disabled={isMissionActive}
      className="glass group flex flex-1 flex-col items-center gap-2 rounded-rava-xl border-rava-gold/20 p-5 transition-all active:scale-95 disabled:opacity-50"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-rava-lg bg-rava-gold text-black shadow-lg transition-transform group-hover:rotate-12">
        <Camera size={24} />
      </div>
      <span className="text-rava-xs font-black text-white">مأموریت عکاسی</span>
      <span className="text-rava-xs font-bold uppercase text-rava-gold">
        {isMissionActive ? 'در حال اجرا' : '+۱۰۰ سکه'}
      </span>
    </button>
  );
};

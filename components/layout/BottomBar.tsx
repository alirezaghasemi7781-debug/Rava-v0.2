import React from 'react';
import { motion as _motion } from 'framer-motion';
import { Map, Compass, Route, Wrench, User } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { AppTab } from '../../types';
import { AudioGraph } from '../../services/audioGraph';

const motion = _motion as any;

export const BottomBar: React.FC = () => {
  const { activeTab, setActiveTab } = useUIStore();

  const handleTabChange = (tabId: AppTab) => {
    if (activeTab === tabId) return;
    AudioGraph.getInstance().playTickSound();
    AudioGraph.haptic(5);
    setActiveTab(tabId);
  };

  const tabs: { id: AppTab; icon: any; label: string }[] = [
    { id: 'profile', icon: User, label: 'پروفایل' },
    { id: 'tools', icon: Wrench, label: 'ابزارها' },
    { id: 'trip', icon: Route, label: 'سفر من' },
    { id: 'explore', icon: Compass, label: 'کشف' },
    { id: 'home', icon: Map, label: 'نقشه' },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-[2000] px-4 pb-safe pointer-events-none">
      <div className="pb-3">
        <div className="glass h-16 min-h-[56px] rounded-3xl flex items-center justify-around px-1 pointer-events-auto shadow-2xl bg-black/40">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                aria-label={tab.label}
                aria-current={isActive ? 'page' : undefined}
                className="relative flex flex-col items-center justify-center flex-1 h-full min-h-[44px] min-w-[44px] group"
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-1 bg-yellow-500/5 rounded-2xl border border-yellow-500/10"
                    transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
                  />
                )}
                <Icon
                  size={20}
                  className={`transition-all duration-300 ${isActive ? 'text-yellow-500 scale-110' : 'text-white/20'}`}
                />
                <span
                  className={`text-[8px] mt-1 font-black tracking-tighter ${isActive ? 'text-yellow-500' : 'text-white/10'}`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

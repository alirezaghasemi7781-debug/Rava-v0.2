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
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-[2000] px-page pb-safe">
      <div className="pb-2">
        <div className="glass flex h-[52px] items-center justify-around rounded-rava-2xl border-white/5 bg-black/50 px-0.5 shadow-glass pointer-events-auto">
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
                className="group relative flex h-full min-h-tap min-w-tap flex-1 flex-col items-center justify-center gap-0.5"
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-x-1 inset-y-1.5 rounded-rava-md border border-rava-gold/15 bg-rava-gold/8"
                    transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
                  />
                )}
                <Icon
                  size={18}
                  className={`relative z-[1] transition-all duration-300 ${isActive ? 'text-rava-gold' : 'text-white/25 group-hover:text-white/45'}`}
                />
                <span className={`relative z-[1] text-rava-xs font-bold tracking-tight ${isActive ? 'text-rava-gold' : 'text-white/20'}`}>
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

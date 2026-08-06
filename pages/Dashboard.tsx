
import React, { useMemo, useEffect } from 'react';
import { MainMap } from '../components/map/MainMap';
import { TopBar } from '../components/layout/TopBar';
import { BottomBar } from '../components/layout/BottomBar';
import { MagicButton } from '../components/voice/MagicButton';
import { VisionOverlay } from '../components/camera/VisionOverlay';
import { POIController } from '../components/poi/POIController';
import { useUIStore } from '../store/useUIStore';
import { motion as _motion, AnimatePresence } from 'framer-motion';
import { Camera } from 'lucide-react';
import { AppTab } from '../types';

// Pages
import { Explore } from './Explore';
import { MyTrip } from './MyTrip';
import { Tools } from './Tools';
import { Profile } from './Profile';

const motion = _motion as any;

interface DashboardProps {
  defaultTab?: AppTab;
}

export const Dashboard: React.FC<DashboardProps> = ({ defaultTab }) => {
  const activeTab = useUIStore(s => s.activeTab);
  const setActiveTab = useUIStore(s => s.setActiveTab);
  const setShowVision = useUIStore(s => s.setShowVision);

  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab, setActiveTab]);

  const overlayContent = useMemo(() => {
    switch(activeTab) {
      case 'explore': return <Explore />;
      case 'trip': return <MyTrip />;
      case 'tools': return <Tools />;
      case 'profile': return <Profile />;
      default: return null;
    }
  }, [activeTab]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black text-right">
      <TopBar />
      
      <div className={`absolute inset-0 z-0 transition-opacity duration-700 ${activeTab === 'home' ? 'opacity-100' : 'opacity-20 pointer-events-none'}`}>
        <MainMap />
      </div>

      <main className="relative z-10 w-full h-full pointer-events-none text-right">
        <AnimatePresence mode="wait">
          {activeTab !== 'home' && (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              transition={{ type: "spring", damping: 30, stiffness: 250 }}
              className="w-full h-full pt-16 pb-32 pointer-events-auto bg-black/70 backdrop-blur-xl"
            >
              {overlayContent}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {activeTab === 'home' && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="contents"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="fixed bottom-36 right-6 z-[1501] pointer-events-none"
            >
              <button 
                onClick={() => setShowVision(true)}
                className="w-16 h-16 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[1.8rem] flex items-center justify-center text-white shadow-2xl active:scale-90 transition-transform pointer-events-auto group"
              >
                <Camera size={28} className="group-hover:text-yellow-500 transition-colors" />
              </button>
            </motion.div>

            <MagicButton />
          </motion.div>
        )}
      </AnimatePresence>

      <BottomBar />
      <POIController />
      <VisionOverlay />
    </div>
  );
};

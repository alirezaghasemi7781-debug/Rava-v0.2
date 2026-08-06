import React, { useEffect, useMemo, useCallback } from 'react';
import { motion as _motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Camera,
  ChevronRight,
  MapPin,
  Sparkles,
  Gem,
  Wallet,
  Flame,
  Clock,
  Heart,
} from 'lucide-react';
import { GlassCard } from '../components/core/GlassCard';
import { DailyCurator } from '../components/discovery/DailyCurator';
import { StaticTripPicker } from '../components/trip/StaticTripPicker';
import { ExploreSection } from '../components/discovery/ExploreSection';
import { IconButton } from '../components/ui';
import { useMissionStore } from '../store/useMissionStore';
import { useUIStore } from '../store/useUIStore';
import { useDiscoveryStore } from '../store/useDiscoveryStore';
import { useMapStore } from '../store/useMapStore';
import { useUserStore } from '../store/useUserStore';
import { useAuthStore } from '../store/useAuthStore';
import { GeoPoint } from '../utils/geoPoint';
import { deriveExploreSections } from '../utils/exploreSections';

const motion = _motion as any;

const MOODS = [
  { id: 'luxury', label: 'پولدار طور', icon: '🤑' },
  { id: 'budget', label: 'مفت گردی', icon: '🎒' },
  { id: 'instagrammable', label: 'خوراک استوری', icon: '📸' },
  { id: 'hidden_gem', label: 'مخفیگاه', icon: '🕵️' },
];

export const Explore: React.FC = () => {
  const { activeMissions } = useMissionStore();
  const { setShowVision, setActiveTab } = useUIStore();
  const {
    discoveredPlaces,
    isSearching,
    feedError,
    activeMood,
    setActiveMood,
    refreshFeed,
  } = useDiscoveryStore();
  const userLocation = useMapStore((s) => s.userLocation);
  const favorites = useUserStore((s) => s.favorites);
  const semanticProfile = useAuthStore((s) => s.semanticProfile);

  const retry = useCallback(() => {
    const geo = GeoPoint.fromArray(userLocation);
    if (geo) refreshFeed(geo.lat, geo.lng);
  }, [userLocation, refreshFeed]);

  useEffect(() => {
    const geo = GeoPoint.fromArray(userLocation);
    if (geo && discoveredPlaces.length === 0 && !feedError) {
      refreshFeed(geo.lat, geo.lng);
    }
  }, [userLocation, refreshFeed, discoveredPlaces.length, feedError]);

  const handleMoodClick = (moodId: string) => {
    const newMood = activeMood === moodId ? null : moodId;
    setActiveMood(newMood);
    const geo = GeoPoint.fromArray(userLocation);
    if (geo) {
      refreshFeed(geo.lat, geo.lng);
    }
  };

  const sections = useMemo(
    () => deriveExploreSections(discoveredPlaces, favorites, semanticProfile),
    [discoveredPlaces, favorites, semanticProfile]
  );

  const sectionError = feedError;
  const loading = isSearching;

  return (
    <div className="h-full overflow-y-auto page-pad pt-6 no-scrollbar">
      <div className="flex justify-between items-center mb-8">
        <IconButton
          icon={ChevronRight}
          label="بازگشت به نقشه"
          onClick={() => setActiveTab('home')}
          size="sm"
        />
        <div className="text-right">
          <h2 className="text-2xl font-black text-white">کشف شهر</h2>
          <p className="text-white/30 text-[10px] font-bold tracking-tighter">
            کشف هوشمند با راوا
          </p>
        </div>
      </div>

      <div className="flex gap-3 mb-8 overflow-x-auto pb-2 no-scrollbar">
        {MOODS.map((mood) => (
          <button
            key={mood.id}
            type="button"
            onClick={() => handleMoodClick(mood.id)}
            className={`glass min-h-[44px] px-5 py-3 rounded-full text-xs font-black whitespace-nowrap border-white/5 transition-all flex items-center gap-2 ${
              activeMood === mood.id
                ? 'bg-yellow-500 text-black border-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.2)]'
                : 'text-white/60 hover:border-yellow-500/30'
            }`}
          >
            <span>{mood.icon}</span>
            {mood.label}
          </button>
        ))}
      </div>

      <div className="space-y-10">
        <DailyCurator />
        <StaticTripPicker />

        <AnimatePresence>
          {activeMissions.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              <h4 className="text-yellow-500 font-black text-sm mb-4 flex items-center gap-2 justify-end">
                مأموریت‌های فعال شما
                <Trophy size={16} />
              </h4>
              <div className="space-y-3">
                {activeMissions.map((mission) => (
                  <GlassCard
                    key={mission.id}
                    className="bg-yellow-500/10 border-yellow-500/30 py-4 flex justify-between items-center"
                  >
                    <button
                      type="button"
                      onClick={() => setShowVision(true)}
                      className="bg-yellow-500 min-w-[44px] min-h-[44px] p-3 rounded-xl text-black shadow-lg flex items-center justify-center"
                      aria-label="باز کردن دوربین مأموریت"
                    >
                      <Camera size={18} />
                    </button>
                    <div className="text-right">
                      <h5 className="text-white font-black text-sm">{mission.title}</h5>
                      <p className="text-white/40 text-[9px] mt-1">{mission.description}</p>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <ExploreSection
          title="نزدیک تو"
          icon={MapPin}
          places={sections.nearby}
          loading={loading}
          error={sectionError}
          onRetry={retry}
          emptyTitle="هنوز جایی نزدیک پیدا نشد"
          emptyDescription="لوکیشن رو روشن کن یا بعداً دوباره رفرش کن."
        />

        <ExploreSection
          title="بر اساس علاقه‌هات"
          icon={Sparkles}
          places={sections.interestBased}
          loading={loading}
          error={sectionError}
          onRetry={retry}
          emptyTitle="هنوز سلیقه‌ای ثبت نشده"
          emptyDescription="از پروفایل علایق رو کامل کن تا پیشنهاد شخصی بگیری."
        />

        <ExploreSection
          title="گنج‌های پنهان"
          icon={Gem}
          places={sections.hiddenGems}
          loading={loading}
          error={sectionError}
          onRetry={retry}
          emptyTitle="مخفیگاهی در فیید نیست"
          emptyDescription="با مود «مخفیگاه» جستجو کن یا بعداً سر بزن."
        />

        <ExploreSection
          title="به‌صرفه"
          icon={Wallet}
          places={sections.budgetFriendly}
          loading={loading}
          error={sectionError}
          onRetry={retry}
          emptyTitle="گزینه ارزان فعلاً نیست"
          emptyDescription="مود مفت‌گردی رو بزن یا فیید رو تازه کن."
        />

        <ExploreSection
          title="محبوب"
          icon={Flame}
          places={sections.popular}
          loading={loading}
          error={sectionError}
          onRetry={retry}
          emptyTitle="امتیاز محبوبی نداریم"
          emptyDescription="وقتی ریتینگ بیاد اینجا می‌درخشه."
        />

        <ExploreSection
          title="مناسب الان"
          icon={Clock}
          places={sections.forNow}
          loading={loading}
          error={sectionError}
          onRetry={retry}
          emptyTitle="برای این ساعت پیشنهادی نیست"
          emptyDescription="کمی بعد دوباره چک کن."
        />

        <ExploreSection
          title="ذخیره‌شده‌ها"
          icon={Heart}
          places={sections.saved}
          loading={false}
          error={null}
          emptyTitle="هنوز جایی ذخیره نکردی"
          emptyDescription="از برگه مکان، قلب رو بزن تا اینجا بیاد."
        />
      </div>
    </div>
  );
};

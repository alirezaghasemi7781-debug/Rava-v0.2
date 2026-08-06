import React, { useEffect, useMemo, useCallback } from 'react';
import { motion as _motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Camera,
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
import { IconButton, Chip, PageHeader } from '../components/ui';
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
  const { discoveredPlaces, isSearching, feedError, activeMood, setActiveMood, refreshFeed } = useDiscoveryStore();
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
    if (geo) refreshFeed(geo.lat, geo.lng);
  };

  const sections = useMemo(() => deriveExploreSections(discoveredPlaces, favorites, semanticProfile), [discoveredPlaces, favorites, semanticProfile]);
  const sectionError = feedError;
  const loading = isSearching;

  return (
    <div className="page-pad h-full overflow-y-auto pt-6 no-scrollbar">
      <PageHeader
        title="کشف شهر"
        subtitle="کشف هوشمند با راوا"
        onBack={() => setActiveTab('home')}
        backLabel="بازگشت به نقشه"
      />

      <div className="mb-6 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {MOODS.map((mood) => (
          <Chip key={mood.id} active={activeMood === mood.id} onClick={() => handleMoodClick(mood.id)} leading={<span className="text-sm">{mood.icon}</span>}>
            {mood.label}
          </Chip>
        ))}
      </div>

      <div className="space-y-10">
        <DailyCurator />
        <StaticTripPicker />

        <AnimatePresence>
          {activeMissions.length > 0 && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
              <h4 className="mb-4 flex items-center justify-end gap-2 text-rava-sm font-black text-rava-gold">
                ماموریت‌های فعال شما
                <Trophy size={16} />
              </h4>
              <div className="space-y-3">
                {activeMissions.map((mission) => (
                  <GlassCard key={mission.id} className="flex items-center justify-between border-rava-gold/30 bg-rava-gold/10 py-4">
                    <IconButton icon={Camera} label="باز کردن دوربین ماموریت" onClick={() => setShowVision(true)} size="sm" variant="gold" />
                    <div className="text-right">
                      <h5 className="text-rava-base font-black text-white">{mission.title}</h5>
                      <p className="mt-1 text-rava-xs text-white/40">{mission.description}</p>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <ExploreSection title="نزدیک تو" icon={MapPin} places={sections.nearby} loading={loading} error={sectionError} onRetry={retry} emptyTitle="هنوز جایی نزدیک پیدا نشد" emptyDescription="لوکیشن رو روشن کن یا بعداً دوباره رفرش کن." />
        <ExploreSection title="بر اساس علاقه‌هات" icon={Sparkles} places={sections.interestBased} loading={loading} error={sectionError} onRetry={retry} emptyTitle="هنوز سلیقه‌ای ثبت نشده" emptyDescription="از پروفایل علایق رو کامل کن تا پیشنهاد شخصی بگیری." />
        <ExploreSection title="گنج‌های پنهان" icon={Gem} places={sections.hiddenGems} loading={loading} error={sectionError} onRetry={retry} emptyTitle="مخفیگاهی در فیید نیست" emptyDescription="با مود «مخفیگاه» جستجو کن یا بعداً سر بزن." />
        <ExploreSection title="به‌صرفه" icon={Wallet} places={sections.budgetFriendly} loading={loading} error={sectionError} onRetry={retry} emptyTitle="گزینه ارزان فعلاً نیست" emptyDescription="مود مفت‌گردی رو بزن یا فیید رو تازه کن." />
        <ExploreSection title="محبوب" icon={Flame} places={sections.popular} loading={loading} error={sectionError} onRetry={retry} emptyTitle="امتیاز محبوبی نداریم" emptyDescription="وقتی ریتینگ بیاد اینجا می‌درخشه." />
        <ExploreSection title="مناسب الان" icon={Clock} places={sections.forNow} loading={loading} error={sectionError} onRetry={retry} emptyTitle="برای این ساعت پیشنهادی نیست" emptyDescription="کمی بعد دوباره چک کن." />
        <ExploreSection title="ذخیره‌شده‌ها" icon={Heart} places={sections.saved} loading={false} error={null} emptyTitle="هنوز جایی ذخیره نکردی" emptyDescription="از برگه مکان، قلب رو بزن تا اینجا بیاد." />
      </div>
    </div>
  );
};

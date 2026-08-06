import React, { useEffect, useMemo, useState } from 'react';
import { motion as _motion } from 'framer-motion';
import {
  Award, Star, MapPin, Milestone, Zap, Globe, Heart, Plane, Calendar,
} from 'lucide-react';
import { useUserStore } from '../../store/useUserStore';
import { useAuthStore } from '../../store/useAuthStore';
import { supabase } from '../../services/supabaseClient';
import { AchievementDef, DailyRecap } from '../../types';
import { displayJalaliDate, toPersianDigits } from '../../utils/jalali';

const motion = _motion as any;

const RankBadge = ({ xp }: { xp: number }) => {
  if (xp > 1000) {
    return (
      <div className="bg-gradient-to-r from-amber-600 to-yellow-500 text-black px-4 py-1.5 rounded-full text-[9px] font-black shadow-lg tracking-tighter">
        کاوشگر افسانه‌ای
      </div>
    );
  }
  if (xp > 500) {
    return (
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-1.5 rounded-full text-[9px] font-black shadow-lg tracking-tighter">
        جهانگرد
      </div>
    );
  }
  return (
    <div className="bg-neutral-800 text-white/60 px-4 py-1.5 rounded-full text-[9px] font-black tracking-tighter">
      مسافر تازه‌کار
    </div>
  );
};

const FALLBACK_ACHIEVEMENTS: Omit<AchievementDef, 'unlocked'>[] = [
  { id: 'first_steps', code: 'first_steps', title: 'Junior Nomad', title_fa: 'مسافر تازه‌کار', xp_threshold: 0 },
  { id: 'city_walker', code: 'city_walker', title: 'City Walker', title_fa: 'گردشگر شهری', xp_threshold: 50 },
  { id: 'world_traveler', code: 'world_traveler', title: 'World Traveler', title_fa: 'جهانگرد', xp_threshold: 500 },
  { id: 'legendary', code: 'legendary', title: 'Legendary Explorer', title_fa: 'کاوشگر افسانه‌ای', xp_threshold: 1000 },
];

export const PassportPage: React.FC = () => {
  const { wallet, tripEvents, favorites } = useUserStore();
  const { user, semanticProfile } = useAuthStore();
  const [recaps, setRecaps] = useState<DailyRecap[]>([]);
  const [achievements, setAchievements] = useState<AchievementDef[]>([]);

  const citiesVisited = useMemo(() => {
    const set = new Set<string>();
    wallet.stamps.forEach((s) => {
      if (s.city) set.add(s.city);
    });
    return Array.from(set);
  }, [wallet.stamps]);

  const level = Math.floor(wallet.xp / 1000) + 1;

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const [{ data: recapRows }, { data: achievementRows }] = await Promise.all([
        supabase
          .from('daily_recaps')
          .select('id, recap_date, city, summary, xp_earned, places_visited')
          .order('recap_date', { ascending: false })
          .limit(14),
        supabase
          .from('achievements')
          .select('id, code, title, title_fa, description, xp_threshold')
          .order('xp_threshold', { ascending: true }),
      ]);

      if (cancelled) return;

      setRecaps((recapRows as DailyRecap[]) || []);

      const defs = (achievementRows && achievementRows.length > 0
        ? achievementRows
        : FALLBACK_ACHIEVEMENTS) as Omit<AchievementDef, 'unlocked'>[];

      setAchievements(
        defs.map((a) => ({
          ...a,
          unlocked: wallet.xp >= (a.xp_threshold ?? 0),
        }))
      );
    };

    load().catch(() => {
      if (!cancelled) {
        setAchievements(
          FALLBACK_ACHIEVEMENTS.map((a) => ({
            ...a,
            unlocked: wallet.xp >= a.xp_threshold,
          }))
        );
      }
    });

    return () => {
      cancelled = true;
    };
  }, [wallet.xp]);

  const displayName =
    user?.user_metadata?.username ||
    user?.email?.split('@')[0] ||
    'مسافر راوا';

  return (
    <div className="p-8 sm:p-10 bg-gradient-to-br from-[#111] to-black rounded-[3rem] text-white shadow-2xl relative overflow-hidden border border-white/5 ring-4 ring-white/[0.02] space-y-10">
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '40px 40px',
        }}
      />
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-yellow-500/5 blur-[100px] rounded-full" />

      <div className="flex justify-between items-start relative z-10">
        <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center text-yellow-500 border border-white/10 shadow-2xl rotate-6 overflow-hidden">
          {user?.user_metadata?.avatar_url ? (
            <img
              src={user.user_metadata.avatar_url}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <Globe size={32} />
          )}
        </div>
        <div className="text-right">
          <h2 className="text-2xl font-black tracking-widest text-white">
            پاسپورت راوا
          </h2>
          <p className="text-[10px] font-black text-yellow-500/80 tracking-[0.2em] mt-1">
            شهروند جهانی راوا
          </p>
          <p className="text-white/40 text-xs font-bold mt-2">{displayName}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 relative z-10">
        <div className="space-y-6">
          <div className="space-y-1">
            <span className="text-[8px] font-black text-white/20 block tracking-widest">
              سوخت در دسترس
            </span>
            <span className="text-lg font-black flex items-center gap-2 text-yellow-500">
              <Zap size={14} fill="currentColor" />
              {toPersianDigits(Math.floor(wallet.balance * 60))} دقیقه
            </span>
          </div>
          <div className="space-y-1">
            <span className="text-[8px] font-black text-white/20 block tracking-widest">
              رتبه فعلی
            </span>
            <RankBadge xp={wallet.xp} />
          </div>
        </div>
        <div className="space-y-6 text-right">
          <div className="space-y-1">
            <span className="text-[8px] font-black text-white/20 block tracking-widest">
              سطح / امتیاز
            </span>
            <span className="text-lg font-black text-yellow-500">
              سطح {toPersianDigits(level)} · {toPersianDigits(wallet.xp)} امتیاز
            </span>
          </div>
          <div className="space-y-1">
            <span className="text-[8px] font-black text-white/20 block tracking-widest">
              سبک سفر
            </span>
            <span className="text-xs font-black text-white/70">
              {semanticProfile.travel_style || '—'} /{' '}
              {semanticProfile.crew_type || '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 relative z-10">
        {[
          { icon: Globe, label: 'شهرها', value: citiesVisited.length || '—' },
          { icon: Plane, label: 'سفرها', value: tripEvents.length },
          { icon: MapPin, label: 'مهرها', value: wallet.stamps.length },
          { icon: Heart, label: 'علاقه', value: favorites.length },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white/[0.03] border border-white/5 rounded-2xl p-3 text-center space-y-1"
          >
            <stat.icon size={14} className="mx-auto text-yellow-500/60" />
            <span className="text-white font-black text-sm block">{stat.value}</span>
            <span className="text-white/20 text-[7px] font-black uppercase tracking-widest">
              {stat.label}
            </span>
          </div>
        ))}
      </div>

      {citiesVisited.length > 0 && (
        <div className="relative z-10 space-y-3 text-right">
          <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">
            شهرهای بازدید شده
          </span>
          <div className="flex flex-wrap gap-2 justify-end">
            {citiesVisited.map((city) => (
              <span
                key={city}
                className="px-3 py-1.5 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-[10px] font-black"
              >
                {city}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Stamps */}
      <div className="relative z-10 space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-black text-white/10 tracking-[0.5em]">
            بایگانی مهرها
          </span>
          <div className="h-[1px] bg-white/5 flex-1 mx-6" />
        </div>
        <div className="grid grid-cols-2 gap-4 max-h-[280px] overflow-y-auto no-scrollbar pb-2">
          {wallet.stamps.length === 0 ? (
            <div className="col-span-2 py-14 border-2 border-dashed border-white/5 rounded-[2.5rem] flex flex-col items-center gap-4 opacity-30">
              <Milestone size={36} />
              <p className="text-[10px] font-black uppercase tracking-widest">
                هنوز مهری ثبت نشده
              </p>
            </div>
          ) : (
            wallet.stamps.map((stamp, idx) => (
              <motion.div
                key={stamp.id || stamp.placeId}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: idx * 0.05 }}
                className="h-28 bg-white/[0.02] border border-white/[0.05] rounded-[2rem] flex flex-col items-center justify-center p-3"
              >
                <MapPin size={20} className="text-white/20 mb-2" />
                <span className="text-[9px] font-black text-center text-white/90 leading-tight truncate w-full px-2">
                  {stamp.placeName}
                </span>
                <span className="text-[7px] text-white/20 font-bold mt-1">
                  {stamp.city ? `${stamp.city} · ` : ''}
                  {displayJalaliDate(stamp.date)}
                </span>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Daily recaps */}
      <div className="relative z-10 space-y-4">
        <div className="flex items-center justify-end gap-2 text-white/20 text-[10px] font-black uppercase tracking-[0.4em]">
          <span>خلاصه روزانه</span>
          <Calendar size={12} />
        </div>
        {recaps.length === 0 ? (
          <div className="py-10 border border-dashed border-white/5 rounded-[2rem] text-center opacity-30">
            <p className="text-[10px] font-black uppercase tracking-widest">
              هنوز خلاصه‌ای ثبت نشده
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-48 overflow-y-auto no-scrollbar">
            {recaps.map((r) => (
              <div
                key={r.id}
                className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 text-right space-y-1"
              >
                <div className="flex justify-between items-center text-[9px] font-black text-white/30">
                  <span>+{toPersianDigits(r.xp_earned)} امتیاز</span>
                  <span>{displayJalaliDate(r.recap_date)}</span>
                </div>
                <p className="text-white/70 text-xs font-bold leading-relaxed">
                  {r.summary || 'بدون متن خلاصه'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Achievements */}
      <div className="relative z-10 space-y-4">
        <div className="flex items-center justify-end gap-2 text-white/20 text-[10px] font-black uppercase tracking-[0.4em]">
          <span>دستاوردها</span>
          <Award size={12} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {achievements.map((a) => (
            <div
              key={a.id || a.code}
              className={`rounded-2xl p-4 border text-right space-y-1 ${
                a.unlocked
                  ? 'bg-yellow-500/10 border-yellow-500/30'
                  : 'bg-white/[0.02] border-white/5 opacity-40'
              }`}
            >
              <div className="flex items-center justify-between">
                <Star
                  size={14}
                  className={a.unlocked ? 'text-yellow-500' : 'text-white/20'}
                  fill={a.unlocked ? 'currentColor' : 'none'}
                />
                <span className="text-[10px] font-black text-white">
                  {a.title_fa || a.title}
                </span>
              </div>
              <p className="text-[8px] text-white/30 font-bold">
                {toPersianDigits(a.xp_threshold)} امتیاز
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

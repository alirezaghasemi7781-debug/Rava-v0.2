import React, { useState } from 'react';
import { MapPin, Compass, Users, Heart, Check, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useUserStore } from '../../store/useUserStore';
import { CityMode } from '../../types';
import { AudioGraph } from '../../services/audioGraph';
import { supabase } from '../../services/supabaseClient';

const CITIES: { id: NonNullable<CityMode>; label: string }[] = [
  { id: 'Istanbul', label: 'استانبول' },
  { id: 'Dubai', label: 'دبی' },
  { id: 'Tehran', label: 'تهران' },
];

const STYLES = [
  { id: 'luxury', label: 'لوکس' },
  { id: 'budget', label: 'مفت‌گردی' },
  { id: 'hidden_gem', label: 'ناشناخته‌ها' },
  { id: 'instagrammable', label: 'استوری‌خور' },
];

const CREWS = [
  { id: 'solo', label: 'تنهایی' },
  { id: 'couple', label: 'دونفره' },
  { id: 'family', label: 'خانواده' },
  { id: 'friends', label: 'رفقا' },
];

const INTEREST_OPTIONS = ['history', 'food', 'nightlife', 'shopping', 'nature', 'art'];

const INTEREST_LABELS: Record<string, string> = {
  history: 'تاریخ',
  food: 'غذا',
  nightlife: 'شب‌گردی',
  shopping: 'خرید',
  nature: 'طبیعت',
  art: 'هنر',
};

export const TravelPersona: React.FC = () => {
  const { user, semanticProfile, updatePreference } = useAuthStore();
  const { cityMode, setCityMode, tripEvents, wallet } = useUserStore();
  const [saving, setSaving] = useState<string | null>(null);

  const interests = semanticProfile.interests || semanticProfile.food_preferences || [];

  const saveCity = async (city: NonNullable<CityMode>) => {
    if (!user) return;
    const prev = cityMode;
    setCityMode(city);
    setSaving('city');
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ current_city: city })
        .eq('id', user.id);
      if (error) throw error;
      AudioGraph.getInstance().playTickSound();
    } catch {
      setCityMode(prev);
      alert('ذخیره شهر ناموفق بود');
    } finally {
      setSaving(null);
    }
  };

  const saveStyle = async (style: string) => {
    setSaving('style');
    try {
      await updatePreference('travel_style', style);
      AudioGraph.getInstance().playTickSound();
    } finally {
      setSaving(null);
    }
  };

  const saveCrew = async (crew: string) => {
    setSaving('crew');
    try {
      await updatePreference('crew_type', crew);
      AudioGraph.getInstance().playTickSound();
    } finally {
      setSaving(null);
    }
  };

  const toggleInterest = async (tag: string) => {
    const next = interests.includes(tag)
      ? interests.filter((t) => t !== tag)
      : [...interests, tag];
    setSaving('interests');
    try {
      await updatePreference('interests', next);
      AudioGraph.haptic(10);
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2 text-white/30 font-black text-[9px] uppercase tracking-[0.3em]">
          <Compass size={12} className="text-yellow-500" /> پرسونای سفر
        </div>
        {saving && <Loader2 size={12} className="animate-spin text-yellow-500/60" />}
        <div className="h-px flex-1 bg-gradient-to-r from-white/5 to-transparent mr-6" />
      </div>

      <div className="glass rounded-[2.5rem] p-6 border-white/5 space-y-8">
        {/* Stats strip from real data */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center space-y-1">
            <span className="text-white font-black text-lg block">{tripEvents.length}</span>
            <span className="text-white/20 text-[8px] font-black uppercase tracking-widest">سفرها</span>
          </div>
          <div className="text-center space-y-1 border-x border-white/5">
            <span className="text-white font-black text-lg block">{wallet.stamps.length}</span>
            <span className="text-white/20 text-[8px] font-black uppercase tracking-widest">مهرها</span>
          </div>
          <div className="text-center space-y-1">
            <span className="text-white font-black text-lg block">
              {Math.floor(wallet.xp / 1000) + 1}
            </span>
            <span className="text-white/20 text-[8px] font-black uppercase tracking-widest">سطح</span>
          </div>
        </div>

        {/* City */}
        <div className="space-y-3 text-right">
          <div className="flex items-center justify-end gap-2 text-white/40 text-[10px] font-black uppercase tracking-widest">
            <span>شهر فعال</span>
            <MapPin size={12} className="text-yellow-500" />
          </div>
          <div className="flex flex-wrap gap-2 justify-end">
            {CITIES.map((c) => (
              <button
                key={c.id}
                onClick={() => saveCity(c.id)}
                className={`px-4 py-2 rounded-2xl text-[11px] font-black border transition-all ${
                  cityMode === c.id
                    ? 'bg-yellow-500/15 border-yellow-500/40 text-yellow-500'
                    : 'bg-white/[0.02] border-white/5 text-white/40'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Travel style */}
        <div className="space-y-3 text-right">
          <div className="flex items-center justify-end gap-2 text-white/40 text-[10px] font-black uppercase tracking-widest">
            <span>استایل سفر</span>
            <Compass size={12} className="text-indigo-400" />
          </div>
          <div className="flex flex-wrap gap-2 justify-end">
            {STYLES.map((s) => (
              <button
                key={s.id}
                onClick={() => saveStyle(s.id)}
                className={`px-4 py-2 rounded-2xl text-[11px] font-black border transition-all ${
                  semanticProfile.travel_style === s.id
                    ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300'
                    : 'bg-white/[0.02] border-white/5 text-white/40'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Companion */}
        <div className="space-y-3 text-right">
          <div className="flex items-center justify-end gap-2 text-white/40 text-[10px] font-black uppercase tracking-widest">
            <span>همسفر</span>
            <Users size={12} className="text-blue-400" />
          </div>
          <div className="flex flex-wrap gap-2 justify-end">
            {CREWS.map((c) => (
              <button
                key={c.id}
                onClick={() => saveCrew(c.id)}
                className={`px-4 py-2 rounded-2xl text-[11px] font-black border transition-all ${
                  semanticProfile.crew_type === c.id
                    ? 'bg-blue-500/15 border-blue-500/40 text-blue-300'
                    : 'bg-white/[0.02] border-white/5 text-white/40'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Interests */}
        <div className="space-y-3 text-right">
          <div className="flex items-center justify-end gap-2 text-white/40 text-[10px] font-black uppercase tracking-widest">
            <span>علایق</span>
            <Heart size={12} className="text-red-400" />
          </div>
          <div className="flex flex-wrap gap-2 justify-end">
            {INTEREST_OPTIONS.map((tag) => {
              const active = interests.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => toggleInterest(tag)}
                  className={`px-4 py-2 rounded-2xl text-[11px] font-black border transition-all flex items-center gap-1.5 ${
                    active
                      ? 'bg-red-500/15 border-red-500/40 text-red-300'
                      : 'bg-white/[0.02] border-white/5 text-white/40'
                  }`}
                >
                  {active && <Check size={10} />}
                  {INTEREST_LABELS[tag]}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

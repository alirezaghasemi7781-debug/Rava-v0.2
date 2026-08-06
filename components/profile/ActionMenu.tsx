import {
  ChevronLeft, CreditCard, History, ScrollText,
  Headphones, LogOut, Heart, Brain, UserPlus, Mic2, BookOpen
} from 'lucide-react';
import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/useAuthStore';
import { AudioGraph } from '../../services/audioGraph';
import { SemanticBrainModal } from '../../features/profile/modals/SemanticBrainModal';
import { FuelLedgerModal } from '../../features/profile/modals/FuelLedgerModal';
import { TopUpModal } from '../../features/profile/modals/TopUpModal';
import { FavoritesModal } from '../../features/profile/modals/FavoritesModal';
import { TripArchiveModal } from '../../features/profile/modals/TripArchiveModal';
import { ReferralModal } from '../../features/profile/modals/ReferralModal';
import { VoiceLabModal } from '../../features/profile/modals/VoiceLabModal';
import { PassportPage } from '../social/PassportPage';

const MenuItem = ({ icon: Icon, label, desc, color, onClick, isLast = false }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-between py-5 px-2 group active:scale-[0.98] transition-all ${!isLast ? 'border-b border-white/[0.03]' : ''}`}
  >
    <div className="flex items-center gap-4">
      <div className={`w-11 h-11 rounded-2xl glass border-white/5 flex items-center justify-center ${color} shadow-lg transition-transform group-hover:-rotate-6`}>
        <Icon size={20} />
      </div>
      <div className="text-right">
        <h4 className="text-white font-black text-sm tracking-tight">{label}</h4>
        <p className="text-white/20 text-[9px] font-bold mt-0.5">{desc}</p>
      </div>
    </div>
    <ChevronLeft size={16} className="text-white/10 group-hover:text-white/40 transition-colors" />
  </button>
);

export const ActionMenu: React.FC = () => {
  const { signOut } = useAuthStore();
  const [activeModal, setActiveModal] = useState<
    'brain' | 'ledger' | 'topup' | 'favs' | 'archive' | 'referral' | 'voice' | 'passport' | null
  >(null);

  const handleLogout = () => {
    AudioGraph.getInstance().playTickSound();
    if (window.confirm('رفیق، مطمئنی می‌خوای از حساب خارج شی؟')) {
      signOut();
    }
  };

  const sections = [
    {
      title: 'هویت و پاسپورت',
      items: [
        {
          icon: BookOpen,
          label: 'پاسپورت راوا',
          desc: 'مهرها، شهرها و دستاوردها',
          color: 'text-yellow-500',
          onClick: () => setActiveModal('passport'),
        },
        {
          icon: Mic2,
          label: 'لابراتوار صدا',
          desc: 'صدا و سرعت صحبت AI',
          color: 'text-pink-400',
          onClick: () => setActiveModal('voice'),
        },
      ],
    },
    {
      title: 'تنظیمات عصبی AI',
      items: [
        {
          icon: Brain,
          label: 'مغز راوا',
          desc: 'کانتکست و خودشناسی AI',
          color: 'text-indigo-400',
          onClick: () => setActiveModal('brain'),
        },
        {
          icon: UserPlus,
          label: 'دعوت رفقا',
          desc: 'شارژ هدیه برای هر دو نفر',
          color: 'text-yellow-500',
          onClick: () => setActiveModal('referral'),
        },
      ],
    },
    {
      title: 'مدیریت حساب',
      items: [
        {
          icon: CreditCard,
          label: 'شارژ سوخت',
          desc: 'خرید دقایق مکالمه AI',
          color: 'text-green-500',
          onClick: () => setActiveModal('topup'),
        },
        {
          icon: ScrollText,
          label: 'دفتر کل سوخت',
          desc: 'تاریخچه مصرف و پاداش‌ها',
          color: 'text-yellow-500',
          onClick: () => setActiveModal('ledger'),
        },
        {
          icon: History,
          label: 'میراث سفرها',
          desc: 'تاریخچه فعالیت‌ها و مدارک',
          color: 'text-blue-400',
          onClick: () => setActiveModal('archive'),
        },
        {
          icon: Heart,
          label: 'علاقه‌مندی‌ها',
          desc: 'مکان‌های نشان شده شما',
          color: 'text-red-400',
          onClick: () => setActiveModal('favs'),
        },
      ],
    },
    {
      title: 'پشتیبانی',
      items: [
        {
          icon: Headphones,
          label: 'پشتیبانی الیت',
          desc: 'کمک فوری ۲۴ ساعته',
          color: 'text-purple-400',
        },
      ],
    },
  ];

  return (
    <>
      <div className="space-y-12 pb-10">
        {sections.map((section, idx) => (
          <div key={idx} className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-white/20 font-black text-[9px] uppercase tracking-[0.4em]">
                {section.title}
              </h3>
              <div className="h-px flex-1 bg-white/5 mr-6" />
            </div>

            <div className="glass rounded-[2.5rem] px-4 border-white/5 bg-white/[0.01]">
              {section.items.map((item, i) => (
                <MenuItem
                  key={i}
                  {...item}
                  isLast={i === section.items.length - 1}
                />
              ))}
            </div>
          </div>
        ))}

        <button
          onClick={handleLogout}
          className="w-full py-6 rounded-[2.2rem] bg-red-500/5 border border-red-500/10 flex items-center justify-center gap-3 active:scale-95 transition-all group"
        >
          <LogOut size={18} className="text-red-500/60 group-hover:text-red-500" />
          <span className="text-red-500 font-black text-xs uppercase tracking-widest mt-0.5">
            خروج از حساب کاربری
          </span>
        </button>
      </div>

      <AnimatePresence>
        {activeModal === 'brain' && (
          <SemanticBrainModal onClose={() => setActiveModal(null)} />
        )}
        {activeModal === 'ledger' && (
          <FuelLedgerModal onClose={() => setActiveModal(null)} />
        )}
        {activeModal === 'topup' && (
          <TopUpModal onClose={() => setActiveModal(null)} />
        )}
        {activeModal === 'favs' && (
          <FavoritesModal onClose={() => setActiveModal(null)} />
        )}
        {activeModal === 'archive' && (
          <TripArchiveModal onClose={() => setActiveModal(null)} />
        )}
        {activeModal === 'referral' && (
          <ReferralModal onClose={() => setActiveModal(null)} />
        )}
        {activeModal === 'voice' && (
          <VoiceLabModal onClose={() => setActiveModal(null)} />
        )}
        {activeModal === 'passport' && (
          <div className="fixed inset-0 z-[6000] bg-black/95 backdrop-blur-3xl overflow-y-auto no-scrollbar p-4 pb-24">
            <button
              onClick={() => setActiveModal(null)}
              className="sticky top-4 z-10 mb-4 px-4 py-2 rounded-2xl glass text-white/60 text-[10px] font-black uppercase tracking-widest"
            >
              بستن
            </button>
            <PassportPage />
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

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
import { FullPageOverlay, Button } from '../ui';

const MenuItem = ({ icon: Icon, label, desc, color, onClick, isLast = false }: any) => (
  <button
    type="button"
    onClick={onClick}
    className={`group flex w-full items-center justify-between px-2 py-5 transition-all active:scale-[0.98] ${!isLast ? 'border-b border-white/[0.03]' : ''}`}
  >
    <div className="flex items-center gap-4">
      <div className={`glass flex h-11 w-11 items-center justify-center rounded-rava-lg border-white/5 shadow-lg transition-transform group-hover:-rotate-6 ${color}`}>
        <Icon size={20} />
      </div>
      <div className="text-right">
        <h4 className="text-rava-sm font-black tracking-tight text-white">{label}</h4>
        <p className="mt-0.5 text-rava-xs font-bold text-white/20">{desc}</p>
      </div>
    </div>
    <ChevronLeft size={16} className="text-white/10 transition-colors group-hover:text-white/40" />
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
          color: 'text-rava-gold',
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
          color: 'text-rava-gold',
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
          color: 'text-rava-gold',
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
              <h3 className="text-rava-xs font-black uppercase tracking-[0.4em] text-white/20">{section.title}</h3>
              <div className="me-6 h-px flex-1 bg-white/5" />
            </div>

            <div className="glass rounded-rava-xl border-white/5 bg-white/[0.01] px-4">
              {section.items.map((item, i) => (
                <MenuItem key={i} {...item} isLast={i === section.items.length - 1} />
              ))}
            </div>
          </div>
        ))}

        <Button
          fullWidth
          variant="danger"
          size="lg"
          onClick={handleLogout}
          leadingIcon={<LogOut size={18} />}
          className="border-red-500/10 bg-red-500/5 text-red-500 hover:bg-red-500/10"
        >
          خروج از حساب کاربری
        </Button>
      </div>

      <AnimatePresence>
        {activeModal === 'brain' && <SemanticBrainModal onClose={() => setActiveModal(null)} />}
        {activeModal === 'ledger' && <FuelLedgerModal onClose={() => setActiveModal(null)} />}
        {activeModal === 'topup' && <TopUpModal onClose={() => setActiveModal(null)} />}
        {activeModal === 'favs' && <FavoritesModal onClose={() => setActiveModal(null)} />}
        {activeModal === 'archive' && <TripArchiveModal onClose={() => setActiveModal(null)} />}
        {activeModal === 'referral' && <ReferralModal onClose={() => setActiveModal(null)} />}
        {activeModal === 'voice' && <VoiceLabModal onClose={() => setActiveModal(null)} />}
        {activeModal === 'passport' && (
          <FullPageOverlay open={true} onClose={() => setActiveModal(null)} title="پاسپورت راوا">
            <PassportPage />
          </FullPageOverlay>
        )}
      </AnimatePresence>
    </>
  );
};

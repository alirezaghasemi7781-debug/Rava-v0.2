import React, { useEffect } from 'react';
import { motion as _motion } from 'framer-motion';
import { X, ArrowUpRight, ArrowDownLeft, Clock, History } from 'lucide-react';
import { GlassCard } from '../../../components/core/GlassCard';
import { useUserStore } from '../../../store/useUserStore';

const motion = _motion as any;

interface FuelLedgerModalProps {
  onClose: () => void;
}

/** Ledger amounts are hours; UI shows minutes (×60). */
export const FuelLedgerModal: React.FC<FuelLedgerModalProps> = ({ onClose }) => {
  const { fuelTransactions, fetchFuelHistory, wallet } = useUserStore();

  useEffect(() => {
    fetchFuelHistory().catch(() => undefined);
  }, [fetchFuelHistory]);

  const getIcon = (amount: number) => {
    return amount > 0 ? (
      <ArrowUpRight className="text-green-500" />
    ) : (
      <ArrowDownLeft className="text-red-400" />
    );
  };

  const getLabel = (type: string, reason?: string) => {
    switch (type) {
      case 'usage':
        return reason || 'مصرف هوش مصنوعی';
      case 'stamp':
        return 'پاداش مهر پاسپورت';
      case 'topup':
        return 'شارژ پکیج';
      case 'price_report':
        return 'پاداش گزارش قیمت';
      case 'referral_bonus':
        return 'پاداش دعوت رفیق';
      case 'daily_itinerary':
        return 'تکمیل برنامه روزانه';
      case 'profile_complete':
        return 'تکمیل پروفایل';
      case 'achievement':
        return 'پاداش دستاورد';
      case 'streak':
        return 'پاداش رگبار روزانه';
      default:
        return 'تراکنش سیستمی';
    }
  };

  const fuelMins = Math.floor((wallet.balance ?? 0) * 60);

  return (
    <div className="fixed inset-0 z-[6000] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <GlassCard className="border-white/5 p-8 rounded-[4rem] relative overflow-hidden">
          <button
            onClick={onClose}
            className="absolute top-8 left-8 text-white/20 active:scale-90 transition-transform"
          >
            <X size={24} />
          </button>

          <div className="flex flex-col items-center gap-2 mb-6">
            <div className="w-16 h-16 bg-yellow-500/10 rounded-3xl flex items-center justify-center text-yellow-500 border border-yellow-500/20">
              <History size={32} />
            </div>
            <h3 className="text-2xl font-black text-white">دفتر کل سوخت</h3>
            <p className="text-white/30 text-[10px] font-bold">موجودی: {fuelMins.toLocaleString('fa-IR')} دقیقه AI</p>
          </div>

          <div className="space-y-4 max-h-[45vh] overflow-y-auto no-scrollbar pr-1">
            {fuelTransactions.length === 0 ? (
              <div className="py-20 text-center opacity-20">
                <Clock size={48} className="mx-auto mb-4" />
                <p className="text-xs font-black">تراکنشی ثبت نشده</p>
              </div>
            ) : (
              fuelTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="glass p-5 rounded-3xl border-white/5 flex items-center justify-between group hover:border-white/10 transition-all"
                >
                  <div className="text-right">
                    <h4
                      className={`text-sm font-black ${tx.amount > 0 ? 'text-white' : 'text-white/80'}`}
                    >
                      {getLabel(tx.type, tx.reason || tx.reference_id)}
                    </h4>
                    <p className="text-[9px] text-white/20 font-bold mt-1">
                      {new Date(tx.created_at).toLocaleString('fa-IR', {
                        hour: '2-digit',
                        minute: '2-digit',
                        day: '2-digit',
                        month: 'long',
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-left">
                      <span
                        className={`text-lg font-black block ${tx.amount > 0 ? 'text-green-500' : 'text-red-400'}`}
                      >
                        {tx.amount > 0 ? '+' : ''}
                        {Math.round(tx.amount * 60)}
                      </span>
                      <span className="text-[8px] text-white/20 font-black">دقیقه</span>
                    </div>
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/[0.03] border border-white/5">
                      {getIcon(tx.amount)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-10 p-6 bg-white/[0.02] border border-white/5 rounded-3xl">
            <p className="text-[10px] text-white/40 leading-relaxed text-right font-medium">
              سوخت راوا بر اساس ساعت استفاده از AI محاسبه می‌شود و اینجا به دقیقه نمایش داده می‌شود.
              هر تغییر موجودی فقط از طریق دفتر کل ثبت می‌شود.
            </p>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
};

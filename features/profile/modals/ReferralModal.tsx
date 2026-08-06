import React, { useState } from 'react';
import { Gift, Share2, Copy, Check, Sparkles, UserPlus } from 'lucide-react';
import { useUserStore } from '../../../store/useUserStore';
import { AudioGraph } from '../../../services/audioGraph';
import { ModalShell, ModalCard, ModalHeader, Button, Input } from '../../../components/ui';

interface ReferralModalProps {
  onClose: () => void;
}

export const ReferralModal: React.FC<ReferralModalProps> = ({ onClose }) => {
  const { wallet, claimReferral } = useUserStore();
  const [code, setCode] = useState('');
  const [claiming, setClaiming] = useState(false);
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleCopy = () => {
    if (!wallet.referralCode) return;
    navigator.clipboard.writeText(wallet.referralCode);
    setCopied(true);
    AudioGraph.getInstance().playTickSound();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!navigator.share) return;
    try {
      await navigator.share({
        title: 'دعوت‌نامه اختصاصی راوا',
        text: `رفیق، با این کد دعوت وارد اپلیکیشن راوا شو تا هر دومون ۳۰ دقیقه شارژ هوش مصنوعی هدیه بگیریم! کد من: ${wallet.referralCode}`,
        url: window.location.origin,
      });
    } catch {
      // noop
    }
  };

  const handleClaim = async () => {
    if (!code.trim()) return;
    setClaiming(true);
    setFeedback(null);
    try {
      await claimReferral(code.trim());
      setFeedback({ type: 'success', message: 'ایول! ۳۰ دقیقه شارژ هدیه به حسابت واریز شد.' });
      setTimeout(onClose, 1500);
    } catch (e: any) {
      setFeedback({ type: 'error', message: e.message || 'کد نامعتبر است.' });
    } finally {
      setClaiming(false);
    }
  };

  return (
    <ModalShell open={true} onClose={onClose} contentClassName="max-w-sm">
      <ModalCard className="overflow-hidden border-rava-gold/20 bg-gradient-to-br from-rava-gold/5 to-transparent">
        <div className="pointer-events-none absolute end-[-20px] top-[-20px] rotate-12 opacity-10">
          <Gift size={140} className="text-rava-gold" />
        </div>

        <ModalHeader
          icon={<UserPlus size={28} className="text-black" />}
          title="دعوت از رفقا"
          subtitle="برنامه دعوت ویژه"
          onClose={onClose}
          className="relative z-10 [&>div:last-child>div:first-child]:bg-rava-gold [&>div:last-child>div:first-child]:border-rava-gold/30"
        />

        <div className="relative z-10 space-y-6">
          <section className="space-y-3">
            <h4 className="text-center text-rava-xs font-black tracking-widest text-white/40">کد دعوت اختصاصی شما</h4>
            <div className="glass flex flex-col items-center gap-4 rounded-rava-modal border-rava-gold/20 bg-white/[0.02] p-5">
              <span className="font-mono text-3xl font-black tracking-[0.25em] text-white ltr-island" dir="ltr">
                {wallet.referralCode || '------'}
              </span>
              <div className="flex w-full gap-2">
                <Button variant="ghost" size="sm" className="flex-1 bg-white/5" onClick={handleCopy} leadingIcon={copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}>
                  {copied ? 'کپی شد' : 'کپی کد'}
                </Button>
                <Button size="sm" className="flex-1" onClick={handleShare} leadingIcon={<Share2 size={14} />}>
                  اشتراک
                </Button>
              </div>
            </div>
          </section>

          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-white/5" />
            <span className="text-rava-xs font-black text-white/15">یا</span>
            <div className="h-px flex-1 bg-white/5" />
          </div>

          {!wallet.isReferred ? (
            <section className="space-y-3">
              <h4 className="text-center text-rava-xs font-black tracking-widest text-white/40">کد معرف داری؟</h4>
              <Input
                ltr
                placeholder="کد دعوت رو اینجا بزن..."
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="text-center font-mono font-black uppercase"
              />
              {feedback ? (
                <p className={`text-center text-rava-xs font-bold ${feedback.type === 'success' ? 'text-green-400' : 'text-rava-danger'}`}>
                  {feedback.message}
                </p>
              ) : null}
              <Button fullWidth onClick={handleClaim} disabled={claiming || !code} loading={claiming} leadingIcon={!claiming ? <Sparkles size={16} /> : undefined}>
                ثبت کد و دریافت جایزه
              </Button>
            </section>
          ) : (
            <div className="rounded-rava-lg border border-green-500/20 bg-green-500/10 p-4 text-center">
              <p className="text-rava-xs font-black text-green-400">شما قبلاً پاداش دعوت را دریافت کرده‌اید ✨</p>
            </div>
          )}
        </div>
      </ModalCard>
    </ModalShell>
  );
};

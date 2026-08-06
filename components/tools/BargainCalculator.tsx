
import React, { useState, useMemo } from 'react';
import { motion as _motion, AnimatePresence } from 'framer-motion';
import { DollarSign, Tag, AlertCircle, CheckCircle2, Loader2, Sparkles, TrendingDown } from 'lucide-react';
import { GlassCard } from '../core/GlassCard';
import { useUserStore } from '../../store/useUserStore';
import { useSurvivalStore } from '../../store/useSurvivalStore';
import { GoogleGenAI, Type } from '@google/genai';
import { extractJSON } from '../../utils/jsonParser';
import { formatAsToman } from '../../utils/helpers';
import { AudioGraph } from '../../services/audioGraph';
import { APP_CONFIG } from '../../config';

const motion = _motion as any;

interface Verdict {
  status: 'good' | 'bad' | 'neutral';
  fair_price: number;
  message: string;
}

export const BargainCalculator: React.FC = () => {
  const { cityMode, semanticProfile } = useUserStore();
  const { rates } = useSurvivalStore();
  const [price, setPrice] = useState('');
  const [item, setItem] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [verdict, setVerdict] = useState<Verdict | null>(null);

  const currencyLabel = cityMode === 'Istanbul' ? 'لیر' : 'درهم';
  const currentRate = cityMode === 'Istanbul' ? rates.TRY : rates.AED;

  const calculateFairness = async () => {
    if (!price || !item) return;
    setIsThinking(true);
    setVerdict(null);
    AudioGraph.getInstance().playTickSound();

    const ai = new GoogleGenAI({ apiKey: APP_CONFIG.GOOGLE.GEMINI_API_KEY });
    
    // کانتکست Vibe کاربر: اگر کاربر لاکچری باشد، سخت‌گیری کمتر است
    const userVibe = semanticProfile.travel_style || 'normal';

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `به عنوان "راوا" (دستیار توریست ایرانی)، این قیمت رو کارشناسی کن:
        آیتم: ${item}
        قیمت اعلامی فروشنده: ${price} ${currencyLabel}
        شهر: ${cityMode}
        سبک سفر کاربر: ${userVibe}
        
        بگو آیا می‌ارزه؟ قیمت منصفانه (fair_price) چنده؟ 
        لحن: صمیمی و محافظ جیب مسافر.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              status: { type: Type.STRING, enum: ['good', 'bad', 'neutral'] },
              fair_price: { type: Type.NUMBER },
              message: { type: Type.STRING }
            },
            required: ['status', 'fair_price', 'message']
          }
        }
      });

      const data = extractJSON<Verdict>(response.text || "{}");
      setVerdict(data);
      if (data.status === 'bad') AudioGraph.haptic([100, 50, 100]);
      else AudioGraph.getInstance().playCoinSound();
      
    } catch (e) {
      setVerdict({ 
        status: 'neutral', 
        fair_price: parseFloat(price), 
        message: 'رفیق فعلاً ارتباطم با بازار قطع شده، ولی کلاً حواست باشه توریستی حساب نکنن باهات!' 
      });
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="space-y-6">
      <GlassCard className="relative overflow-hidden border-yellow-500/20">
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-yellow-500/5 blur-3xl rounded-full" />
        <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3">
          <div className="p-2 bg-yellow-500/20 rounded-lg text-yellow-500"><DollarSign size={20} /></div>
          ماشین‌حساب چانه‌زنی
        </h3>

        <div className="space-y-4">
          <div className="relative group">
            <input
              type="text" placeholder="چی می‌خوای بخری؟ (مثلاً: تیشرت)"
              value={item} onChange={(e) => setItem(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-[1.5rem] py-5 px-6 text-white text-right outline-none focus:border-yellow-500/50 transition-all placeholder:text-white/20 font-bold"
            />
            <Tag size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-yellow-500 transition-colors" />
          </div>

          <div className="relative group">
            <input
              type="number" placeholder={`قیمت به ${currencyLabel}`}
              value={price} onChange={(e) => setPrice(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-[1.5rem] py-5 px-6 text-white text-right outline-none focus:border-yellow-500/50 transition-all font-mono text-xl font-black"
            />
            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 font-black text-[10px] uppercase group-focus-within:text-yellow-500">{currencyLabel}</span>
          </div>

          <div className="p-5 bg-gradient-to-l from-yellow-500/10 to-transparent rounded-[1.5rem] border border-yellow-500/20 flex justify-between items-center px-8">
            <span className="text-yellow-500 font-black text-2xl">
              {price ? formatAsToman(parseFloat(price), currentRate) : '۰ تومان'}
            </span>
            <p className="text-white/40 text-[10px] font-black uppercase tracking-tighter">Toman Equivalent</p>
          </div>

          <button 
            onClick={calculateFairness} disabled={isThinking || !price || !item}
            className="w-full bg-yellow-500 py-5 rounded-[1.5rem] text-black font-black text-lg shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {isThinking ? <Loader2 className="animate-spin" /> : <><Sparkles size={20} /> می‌ارزه؟</>}
          </button>
        </div>
      </GlassCard>

      <AnimatePresence>
        {verdict && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className={`p-6 rounded-[2.5rem] border flex flex-col gap-4 text-right shadow-2xl ${
              verdict.status === 'good' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 
              verdict.status === 'bad' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
              'bg-blue-500/10 border-blue-500/30 text-blue-400'
            }`}
          >
            <div className="flex items-center justify-between flex-row-reverse">
              <div className="flex items-center gap-2">
                {verdict.status === 'good' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                <span className="font-black">نظر راوا</span>
              </div>
              <div className="flex items-center gap-2 bg-black/20 px-3 py-1 rounded-full text-[10px] font-black uppercase">
                 <TrendingDown size={14} /> Fair: {verdict.fair_price} {currencyLabel}
              </div>
            </div>
            <p className="font-bold leading-relaxed text-sm pr-1">{verdict.message}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

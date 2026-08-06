import { supabase } from '../../services/supabaseClient';
import { edgeService } from '../../services/ai/edgeService';
import React, { useState } from 'react';
import { motion as _motion, AnimatePresence } from 'framer-motion';
import { ScanLine, Upload, FileText, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useUserStore } from '../../store/useUserStore';

const motion = _motion as any;

interface TicketScannerProps {
  onClose: () => void;
}

export const TicketScanner: React.FC<TicketScannerProps> = ({ onClose }) => {
  const syncWithCloud = useUserStore(s => s.syncWithCloud);
  const [step, setStep] = useState<'upload' | 'scanning' | 'success' | 'error'>('upload');
  const [errorMsg, setErrorMsg] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setStep('scanning');
      let uploadedPath = '';

      try {
        const fileName = `${Date.now()}-${file.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('tickets')
          .upload(fileName, file);

        if (uploadError) throw uploadError;
        uploadedPath = fileName;

        // فراخوانی مغز پردازشگر
        await edgeService.processTicket(fileName);
        
        await syncWithCloud();
        setStep('success');
      } catch (err: any) {
        // پولیش نهایی: اگر فایل آپلود شده اما در مرحله پردازش شکست خورده، فایل یتیم را پاک کن
        if (uploadedPath) {
          await supabase.storage.from('tickets').remove([uploadedPath]);
        }
        setErrorMsg(err.message || 'خطا در پردازش تصویر');
        setStep('error');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[7000] bg-black/95 backdrop-blur-3xl flex flex-col items-center justify-center p-8">
      <button onClick={onClose} className="absolute top-10 right-10 w-12 h-12 glass rounded-2xl flex items-center justify-center text-white border-white/10 active:scale-90 transition-transform">
        <X size={24} />
      </button>

      <AnimatePresence mode="wait">
        {step === 'upload' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="w-full max-w-sm text-right">
            <div className="mb-10">
               <div className="w-20 h-20 bg-yellow-500 rounded-[2rem] flex items-center justify-center text-black mb-6 shadow-[0_20px_40px_rgba(234,179,8,0.3)]">
                  <ScanLine size={40} />
               </div>
               <h2 className="text-4xl font-black text-white mb-4">اسکن جادویی</h2>
               <p className="text-white/40 text-lg leading-relaxed">عکس بلیط یا واچر هتل رو بفرست تا هوش مصنوعی راوا برات آنالیز و ثبتش کنه.</p>
            </div>
            <label className="block w-full py-10 rounded-[3rem] border-2 border-dashed border-white/10 bg-white/[0.02] flex flex-col items-center justify-center gap-6 cursor-pointer hover:border-yellow-500/40 transition-all group">
              <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
              <Upload size={32} className="text-yellow-500" />
              <span className="text-white font-black">انتخاب تصویر مدارک</span>
            </label>
          </motion.div>
        )}

        {step === 'scanning' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-8">
            <div className="relative w-72 h-96 rounded-[3.5rem] bg-white/5 border border-white/10 overflow-hidden shadow-2xl">
               <motion.div animate={{ top: ['-10%', '110%', '-10%'] }} transition={{ duration: 2.5, repeat: Infinity }} className="absolute left-0 right-0 h-1.5 bg-yellow-500 shadow-[0_0_30px_rgba(234,179,8,1)] z-20" />
               <div className="absolute inset-0 flex items-center justify-center"><FileText size={80} className="text-white/10" /></div>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-black text-white animate-pulse">در حال استخراج هوشمند...</h3>
              <p className="text-white/30 text-xs font-bold uppercase tracking-widest">Powered by Gemini 2.0 Flash</p>
            </div>
          </motion.div>
        )}

        {step === 'success' && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm glass border-white/10 p-10 rounded-[3.5rem] shadow-2xl text-center space-y-8">
            <div className="w-20 h-20 bg-green-500 rounded-full mx-auto flex items-center justify-center text-black shadow-[0_0_40px_rgba(34,197,94,0.3)]">
               <CheckCircle2 size={40} />
            </div>
            <div className="space-y-2">
              <h4 className="text-2xl font-black text-white">ردیف شد!</h4>
              <p className="text-white/40 text-sm leading-relaxed">اطلاعات بلیط با موفقیت استخراج و به تایم‌لاین سفرت اضافه شد رفیق.</p>
            </div>
            <button onClick={onClose} className="w-full bg-white/10 py-5 rounded-3xl text-white font-black active:scale-95 transition-all">ایول، بزن بریم</button>
          </motion.div>
        )}

        {step === 'error' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-6">
            <div className="w-20 h-20 bg-red-500/20 rounded-full mx-auto flex items-center justify-center text-red-500">
               <AlertCircle size={40} />
            </div>
            <p className="text-white font-bold">{errorMsg}</p>
            <button onClick={() => setStep('upload')} className="glass px-8 py-3 rounded-2xl text-white font-black">تلاش دوباره</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

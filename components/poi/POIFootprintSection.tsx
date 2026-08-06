import React from 'react';
import { motion as _motion } from 'framer-motion';
import { Send, Loader2, Footprints as StepsIcon } from 'lucide-react';
import { Footprint } from '../../types';

const motion = _motion as any;

interface POIFootprintSectionProps {
  footprints: Footprint[];
  comment: string;
  isSubmitting: boolean;
  onCommentChange: (val: string) => void;
  onSubmit: () => void;
}

export const POIFootprintSection: React.FC<POIFootprintSectionProps> = ({
  footprints,
  comment,
  isSubmitting,
  onCommentChange,
  onSubmit,
}) => {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between px-2">
        <div className="flex -space-x-3 rtl:space-x-reverse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 w-8 rounded-full border-2 border-rava-bg bg-neutral-800" />
          ))}
        </div>
        <h4 className="flex items-center gap-3 text-rava-lg font-black text-white">
          ردپای مسافران <StepsIcon size={24} className="text-rava-gold" />
        </h4>
      </div>

      <div className="space-y-5">
        {footprints.length === 0 ? (
          <p className="py-6 text-center text-rava-sm font-bold text-white/20">هنوز کسی اینجا ردپایی نذاشته. اولین نفر باش!</p>
        ) : (
          footprints.map((f) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={f.id}
              className="flex flex-row-reverse items-start gap-4"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-rava-lg border border-white/10 bg-white/5 text-rava-sm font-black text-white shadow-lg">
                {f.user[0]}
              </div>
              <div className="flex-1 rounded-rava-xl rounded-te-none border border-white/5 bg-white/[0.03] p-5 text-right shadow-sm">
                <div className="mb-2 flex flex-row-reverse items-center justify-between">
                  <span className="text-rava-xs font-black text-rava-gold">{f.user}</span>
                  <span className="text-rava-xs font-bold text-white/20">{f.date}</span>
                </div>
                <p className="text-rava-sm font-medium leading-relaxed text-white/80">{f.text}</p>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <div className="relative mt-4">
        <input
          type="text"
          placeholder="تجربه‌ت رو اینجا ثبت کن..."
          value={comment}
          onChange={(e) => onCommentChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
          className="rava-input w-full pe-16 text-right"
        />
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting || !comment.trim()}
          className="absolute start-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-rava-lg bg-rava-gold text-black shadow-xl transition-all active:scale-90 disabled:opacity-30"
        >
          {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <Send size={22} />}
        </button>
      </div>
    </div>
  );
};

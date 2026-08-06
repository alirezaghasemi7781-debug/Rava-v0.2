import React from 'react';
import { Brain, Sparkles, Trash2, Info } from 'lucide-react';
import { useAuthStore } from '../../../store/useAuthStore';
import { ModalShell, ModalCard, ModalHeader, Button } from '../../../components/ui';

interface SemanticBrainModalProps {
  onClose: () => void;
}

export const SemanticBrainModal: React.FC<SemanticBrainModalProps> = ({ onClose }) => {
  const { semanticProfile, removeSemanticTag } = useAuthStore();

  const sections = [
    { key: 'food_preferences', label: 'ذائقه غذایی', color: 'bg-orange-500/10 text-orange-400' },
    { key: 'dislikes', label: 'خط قرمزها و تنفرات', color: 'bg-red-500/10 text-red-400' },
  ];

  return (
    <ModalShell open={true} onClose={onClose} contentClassName="max-w-md">
      <ModalCard className="relative overflow-hidden">
        <div className="pointer-events-none absolute end-[-20px] top-[-20px] opacity-5">
          <Brain size={150} className="text-indigo-500" />
        </div>

        <ModalHeader
          icon={<Sparkles size={28} className="text-white" />}
          title="مغزِ راوا"
          subtitle="AI Semantic Context Viewer"
          onClose={onClose}
          className="relative z-10 [&>div:last-child>div:first-child]:border-indigo-500/20 [&>div:last-child>div:first-child]:bg-indigo-600"
        />

        <div className="relative z-10 space-y-8 text-right">
          <div className="flex items-start gap-4 rounded-rava-xl border border-indigo-500/10 bg-indigo-500/5 p-5">
            <Info size={20} className="shrink-0 text-indigo-400" />
            <p className="text-rava-xs font-bold leading-relaxed text-white/50">
              رفیق، اینجا تگ‌هایی که راوا در طول مکالمات در مورد شخصیت تو یاد گرفته رو می‌بینی. اگه راوا در موردت اشتباه فکر می‌کنه، تگ غلط رو پاک کن تا رفتارش فوراً اصلاح بشه.
            </p>
          </div>

          {sections.map((section) => {
            const tags = (semanticProfile as any)[section.key] || [];
            return (
              <div key={section.key} className="space-y-4">
                <h4 className="me-2 text-rava-xs font-black text-white/40">{section.label}</h4>
                <div className="flex flex-wrap justify-end gap-2">
                  {tags.length === 0 ? (
                    <span className="text-rava-xs font-bold italic text-white/10">هنوز چیزی یاد نگرفته...</span>
                  ) : (
                    tags.map((tag: string) => (
                      <div key={tag} className={`flex items-center gap-2 rounded-rava-lg border border-white/5 px-4 py-2 ${section.color}`}>
                        <button type="button" onClick={() => removeSemanticTag(section.key as any, tag)} className="transition-colors hover:text-white">
                          <Trash2 size={12} />
                        </button>
                        <span className="text-rava-xs font-black">{tag}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <Button fullWidth variant="secondary" size="lg" className="relative z-10 mt-10" onClick={onClose}>
          بسیار خب
        </Button>
      </ModalCard>
    </ModalShell>
  );
};

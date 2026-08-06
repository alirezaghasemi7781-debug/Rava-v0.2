import React, { useMemo } from 'react';
import { History, MapPin, Calendar, Milestone } from 'lucide-react';
import { useUserStore } from '../../../store/useUserStore';
import { ModalShell, ModalCard, ModalHeader, EmptyState } from '../../../components/ui';

interface TripArchiveModalProps {
  onClose: () => void;
}

export const TripArchiveModal: React.FC<TripArchiveModalProps> = ({ onClose }) => {
  const { tripEvents } = useUserStore();

  const pastEvents = useMemo(() => {
    const now = new Date();
    return tripEvents.filter((e) => new Date(e.date) < now).sort((a, b) => b.date.localeCompare(a.date));
  }, [tripEvents]);

  return (
    <ModalShell open={true} onClose={onClose} contentClassName="max-w-lg">
      <ModalCard className="flex max-h-[85vh] flex-col">
        <ModalHeader
          icon={<History size={28} className="text-blue-400" />}
          title="میراث سفرها"
          subtitle="Historical Journey Logs"
          onClose={onClose}
          className="shrink-0 [&>div:last-child>div:first-child]:border-blue-500/20 [&>div:last-child>div:first-child]:bg-blue-500/10"
        />

        <div className="flex-1 overflow-y-auto border-e border-white/5 pe-4 no-scrollbar">
          {pastEvents.length === 0 ? (
            <EmptyState title="هنوز میراثی ثبت نشده رفیق!" icon={Milestone} className="py-16 opacity-60" />
          ) : (
            <div className="space-y-12 pb-10">
              {pastEvents.map((event) => (
                <div key={event.id} className="relative">
                  <div className="absolute -end-[41px] top-1 z-10 h-4 w-4 rounded-full border-4 border-rava-bg bg-blue-500/20" />

                  <div className="text-right">
                    <div className="mb-2 flex items-center justify-end gap-2 text-blue-400">
                      <span className="text-rava-xs font-black tracking-widest">
                        {new Date(event.date).toLocaleDateString('fa-IR', { month: 'long', year: 'numeric' })}
                      </span>
                      <Calendar size={12} />
                    </div>
                    <h4 className="mb-2 text-rava-lg font-black text-white">{event.title}</h4>
                    <p className="text-rava-xs font-medium leading-relaxed text-white/40">
                      {event.details.address || 'ماجراجویی در سطح شهر'}
                    </p>

                    <div className="mt-4 flex justify-end">
                      <div className="glass flex items-center gap-2 rounded-rava-lg border-white/5 px-4 py-2 text-rava-xs font-black text-white/60">
                        <MapPin size={12} /> مشاهده جزئیات آرشیوی
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 shrink-0 rounded-rava-xl border border-blue-500/10 bg-blue-500/5 p-6">
          <p className="text-right text-rava-xs font-bold italic leading-relaxed text-white/40">
            "سفر تنها چیزی است که با هزینه کردن آن، ثروتمندتر می‌شوید."
          </p>
        </div>
      </ModalCard>
    </ModalShell>
  );
};

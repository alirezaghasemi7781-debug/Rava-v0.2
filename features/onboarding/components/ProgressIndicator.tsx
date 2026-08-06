import React from 'react';

interface ProgressIndicatorProps {
  currentStep: number;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ currentStep }) => (
  <div className="mb-12 flex flex-row-reverse items-center justify-between gap-4">
    {[1, 2, 3].map((i) => (
      <React.Fragment key={i}>
        <div className="flex flex-1 flex-row-reverse items-center gap-3">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-rava-md border-2 text-rava-xs font-black transition-all duration-700 ${
              currentStep >= i
                ? 'rotate-0 border-rava-gold bg-rava-gold text-black shadow-[0_0_20px_rgba(234,179,8,0.4)]'
                : 'rotate-12 border-white/10 text-white/20'
            }`}
          >
            {i}
          </div>
          {i < 3 && (
            <div className="relative h-0.5 flex-1 overflow-hidden rounded-full bg-white/5">
              <div
                className={`absolute inset-0 origin-right bg-rava-gold transition-transform duration-1000 ${
                  currentStep > i ? 'scale-x-100' : 'scale-x-0'
                }`}
              />
            </div>
          )}
        </div>
      </React.Fragment>
    ))}
  </div>
);

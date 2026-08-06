import React from 'react';
import { GlassCard } from '../core/GlassCard';

interface ModalCardProps {
  children: React.ReactNode;
  className?: string;
}

export const ModalCard: React.FC<ModalCardProps> = ({ children, className = '' }) => (
  <GlassCard
    animated={false}
    className={`relative mx-auto max-h-[min(85vh,720px)] w-full max-w-md overflow-hidden rounded-rava-modal border-white/8 bg-rava-elevated p-6 shadow-modal ${className}`}
  >
    {children}
  </GlassCard>
);

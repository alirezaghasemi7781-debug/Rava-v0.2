import React from 'react';
import { motion as _motion } from 'framer-motion';

const motion = _motion as any;

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  layoutId?: string;
  animated?: boolean;
}

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ children, className = '', onClick, layoutId, animated = true }, ref) => {
    return (
      <motion.div
        ref={ref}
        layoutId={layoutId}
        initial={animated ? { opacity: 0, y: 20 } : false}
        animate={animated ? { opacity: 1, y: 0 } : false}
        exit={animated ? { opacity: 0, y: 20 } : false}
        onClick={onClick}
        className={`glass luxury-shadow relative rounded-rava-xl border border-white/[0.08] p-5 shadow-glass backdrop-blur-xl ${className}`}
      >
        {children}
      </motion.div>
    );
  }
);

GlassCard.displayName = 'GlassCard';

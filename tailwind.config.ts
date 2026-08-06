import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './App.tsx', './index.tsx', './components/**/*.{ts,tsx}', './features/**/*.{ts,tsx}', './hooks/**/*.{ts,tsx}', './pages/**/*.{ts,tsx}', './services/**/*.{ts,tsx}', './store/**/*.{ts,tsx}', './styles/**/*.{ts,tsx,css}', './types/**/*.{ts,tsx}', './utils/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        rava: {
          bg: 'var(--rava-bg)',
          elevated: 'var(--rava-bg-elevated)',
          fg: 'var(--rava-fg)',
          muted: 'var(--rava-fg-muted)',
          faint: 'var(--rava-fg-faint)',
          gold: 'var(--rava-gold)',
          goldSoft: 'var(--rava-gold-soft)',
          goldGlow: 'var(--rava-gold-glow)',
          border: 'var(--rava-border)',
          borderStrong: 'var(--rava-border-strong)',
          danger: 'var(--rava-danger)',
          success: 'var(--rava-success)',
          glass: 'var(--rava-glass-bg)',
        },
      },
      spacing: {
        'rava-1': 'var(--space-1)',
        'rava-2': 'var(--space-2)',
        'rava-3': 'var(--space-3)',
        'rava-4': 'var(--space-4)',
        'rava-5': 'var(--space-5)',
        'rava-6': 'var(--space-6)',
        'rava-8': 'var(--space-8)',
        'rava-10': 'var(--space-10)',
        'rava-12': 'var(--space-12)',
        page: 'var(--page-padding-x)',
        chrome: 'var(--page-padding-bottom-chrome)',
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
      },
      fontSize: {
        'rava-xs': 'var(--text-xs)',
        'rava-sm': 'var(--text-sm)',
        'rava-base': 'var(--text-base)',
        'rava-md': 'var(--text-md)',
        'rava-lg': 'var(--text-lg)',
        'rava-xl': 'var(--text-xl)',
        'rava-2xl': 'var(--text-2xl)',
        'rava-3xl': 'var(--text-3xl)',
      },
      borderRadius: {
        'rava-sm': 'var(--radius-sm)',
        'rava-md': 'var(--radius-md)',
        'rava-lg': 'var(--radius-lg)',
        'rava-xl': 'var(--radius-xl)',
        'rava-2xl': 'var(--radius-2xl)',
        'rava-modal': 'var(--radius-modal)',
        'rava-sheet': 'var(--radius-sheet)',
      },
      minHeight: {
        tap: 'var(--tap-min)',
        input: 'var(--input-height)',
        'btn-sm': 'var(--btn-height-sm)',
        'btn-md': 'var(--btn-height-md)',
        'btn-lg': 'var(--btn-height-lg)',
      },
      minWidth: {
        tap: 'var(--tap-min)',
      },
      zIndex: {
        sheet: 'var(--z-sheet)',
        modal: 'var(--z-modal)',
        overlay: 'var(--z-overlay)',
        toast: 'var(--z-toast)',
      },
      boxShadow: {
        glass: '0 16px 40px rgba(0, 0, 0, 0.45)',
        gold: '0 8px 24px rgba(234, 179, 8, 0.25)',
        modal: '0 24px 60px rgba(0, 0, 0, 0.55)',
      },
      backdropBlur: {
        rava: 'var(--rava-glass-blur)',
      },
    },
  },
};

export default config;

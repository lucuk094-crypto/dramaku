import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        bg: 'rgb(var(--bg) / <alpha-value>)',
        card: 'rgb(var(--panel) / <alpha-value>)',
        fg: 'rgb(var(--fg) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        soft: 'rgb(var(--soft) / <alpha-value>)',
        border: 'rgb(var(--border) / <alpha-value>)',
        tick: 'rgb(var(--tick) / <alpha-value>)',
        accent: 'rgb(var(--accent) / <alpha-value>)',
        'accent-soft': 'rgb(var(--accent) / <alpha-value>)',
        'accent-bg': 'rgb(var(--accent-bg) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'Geist Mono', 'ui-monospace', 'SF Mono', 'Menlo', 'monospace'],
      },
      fontSize: {
        xs: ['12px', { lineHeight: '1.5' }],
        sm: ['13.5px', { lineHeight: '1.5' }],
        base: ['15px', { lineHeight: '1.55' }],
        lg: ['18px', { lineHeight: '1.45' }],
        xl: ['21.6px', { lineHeight: '1.35' }],
        '2xl': ['26px', { lineHeight: '1.2' }],
        '3xl': ['clamp(26px, 3vw, 37px)', { lineHeight: '1.08' }],
        '4xl': ['clamp(30px, 4vw, 45px)', { lineHeight: '1.06' }],
        '6xl': ['clamp(38px, 6.4vw, 80px)', { lineHeight: '0.98' }],
      },
      letterSpacing: {
        tightest: '-0.035em',
        tighter: '-0.028em',
        tight: '-0.02em',
        mono: '0.04em',
      },
      borderRadius: {
        DEFAULT: '4px',
        sm: '3px',
        md: '6px',
        lg: '8px',
        xl: '10px',
        '2xl': '12px',
        '3xl': '16px',
      },
      boxShadow: {
        soft: '0 1px 2px rgb(0 0 0 / 0.06)',
        glow: '0 1px 0 rgb(var(--accent) / 0.2)',
        panel: '0 12px 32px rgb(0 0 0 / 0.08)',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.23, 1, 0.32, 1)',
      },
      keyframes: {
        spinSlow: {
          to: { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        spinSlow: 'spinSlow 0.9s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;

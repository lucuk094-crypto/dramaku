/** Ikon SVG inline (stroke 24x24, gaya minimalis). */

type P = { className?: string };

const base = (className?: string) => ({
  className: className || 'h-5 w-5',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
});

export const IconHome = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V21h14V9.5" />
  </svg>
);

export const IconSearch = ({ className }: P) => (
  <svg {...base(className)}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);

export const IconTrophy = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4Z" />
    <path d="M7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3" />
  </svg>
);

export const IconHeart = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M12 21s-7.5-4.6-10-9.2C.6 8.6 2.3 5 5.8 5c2 0 3.4 1.1 4.2 2.3h4c.8-1.2 2.2-2.3 4.2-2.3 3.5 0 5.2 3.6 3.8 6.8C19.5 16.4 12 21 12 21Z" />
  </svg>
);

export const IconHeartFilled = ({ className }: P) => (
  <svg {...base(className)} fill="currentColor" stroke="none">
    <path d="M12 21s-7.5-4.6-10-9.2C.6 8.6 2.3 5 5.8 5c2 0 3.4 1.1 4.2 2.3h4c.8-1.2 2.2-2.3 4.2-2.3 3.5 0 5.2 3.6 3.8 6.8C19.5 16.4 12 21 12 21Z" />
  </svg>
);

export const IconClock = ({ className }: P) => (
  <svg {...base(className)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

export const IconPlay = ({ className }: P) => (
  <svg {...base(className)} fill="currentColor" stroke="none">
    <path d="M8 5.5v13a1 1 0 0 0 1.5.9l10.5-6.5a1 1 0 0 0 0-1.7L9.5 4.6A1 1 0 0 0 8 5.5Z" />
  </svg>
);

export const IconPause = ({ className }: P) => (
  <svg {...base(className)} fill="currentColor" stroke="none">
    <rect x="6" y="5" width="4" height="14" rx="1.2" />
    <rect x="14" y="5" width="4" height="14" rx="1.2" />
  </svg>
);

export const IconChevronLeft = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="m14.5 5-7 7 7 7" />
  </svg>
);

export const IconChevronRight = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="m9.5 5 7 7-7 7" />
  </svg>
);

export const IconChevronDown = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="m5 9.5 7 7 7-7" />
  </svg>
);

export const IconSun = ({ className }: P) => (
  <svg {...base(className)}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2.5M12 19.5V22M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M2 12h2.5M19.5 12H22M4.6 19.4l1.8-1.8M17.6 6.4l1.8-1.8" />
  </svg>
);

export const IconMoon = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5Z" />
  </svg>
);

export const IconVolume = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M4 9v6h4l5 4V5L8 9H4Z" />
    <path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11" />
  </svg>
);

export const IconMute = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M4 9v6h4l5 4V5L8 9H4Z" />
    <path d="m17 9.5 4 5M21 9.5l-4 5" />
  </svg>
);

export const IconFullscreen = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
  </svg>
);

export const IconSkipNext = ({ className }: P) => (
  <svg {...base(className)} fill="currentColor" stroke="none">
    <path d="M5 5.5v13a1 1 0 0 0 1.5.9L15 14v4.5a1 1 0 0 0 2 0v-13a1 1 0 0 0-2 0V10L6.5 4.6A1 1 0 0 0 5 5.5Z" />
    <rect x="18" y="5" width="2.4" height="14" rx="1" />
  </svg>
);

export const IconSkipPrev = ({ className }: P) => (
  <svg {...base(className)} fill="currentColor" stroke="none">
    <path d="M19 5.5v13a1 1 0 0 1-1.5.9L9 14v4.5a1 1 0 0 1-2 0v-13a1 1 0 0 1 2 0V10l8.5-5.4A1 1 0 0 1 19 5.5Z" />
    <rect x="3.6" y="5" width="2.4" height="14" rx="1" />
  </svg>
);

export const IconStar = ({ className }: P) => (
  <svg {...base(className)} fill="currentColor" stroke="none">
    <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9 2.9-6Z" />
  </svg>
);

export const IconX = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="m6 6 12 12M18 6 6 18" />
  </svg>
);

export const IconExternal = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M14 4h6v6M20 4l-9 9" />
    <path d="M19 14v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
  </svg>
);

export const IconGrid = ({ className }: P) => (
  <svg {...base(className)}>
    <rect x="4" y="4" width="7" height="7" rx="1.5" />
    <rect x="13" y="4" width="7" height="7" rx="1.5" />
    <rect x="4" y="13" width="7" height="7" rx="1.5" />
    <rect x="13" y="13" width="7" height="7" rx="1.5" />
  </svg>
);

export const IconLoader = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M12 3a9 9 0 1 0 9 9" />
  </svg>
);

export const IconList = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M8 6h12M8 12h12M8 18h12" />
    <circle cx="4.5" cy="6" r="1" fill="currentColor" stroke="none" />
    <circle cx="4.5" cy="12" r="1" fill="currentColor" stroke="none" />
    <circle cx="4.5" cy="18" r="1" fill="currentColor" stroke="none" />
  </svg>
);

export const IconBookmark = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M6 3.5h12a1 1 0 0 1 1 1V21l-7-4.2L5 21V4.5a1 1 0 0 1 1-1Z" />
  </svg>
);

export const IconSpark = ({ className }: P) => (
  <svg {...base(className)}>
    <circle cx="12" cy="12" r="9" />
    <path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" />
  </svg>
);

export const IconQuote = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M6 8.5V11a3.5 3.5 0 0 1-2 3.2" />
    <path d="M6 8.5h2.6V11c0 2-1 3.3-2.4 4" />
    <path d="M15 8.5V11a3.5 3.5 0 0 1-2 3.2" />
    <path d="M15 8.5h2.6V11c0 2-1 3.3-2.4 4" />
  </svg>
);

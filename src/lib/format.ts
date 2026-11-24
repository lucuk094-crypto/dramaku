/** Util format tampilan. */

export function fmtTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = h > 0 ? String(m).padStart(2, '0') : String(m);
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function fmtNumber(n: number | null | undefined): string {
  if (n === null || n === undefined) return '-';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}jt`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}rb`;
  return String(n);
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

/** Gradien deterministik untuk tile genre berdasarkan slug. */
export function gradientFor(seed: string): string {
  const gradients = [
    'from-violet-500/80 to-fuchsia-500/80',
    'from-sky-500/80 to-indigo-500/80',
    'from-emerald-500/80 to-teal-500/80',
    'from-rose-500/80 to-orange-500/80',
    'from-amber-500/80 to-red-500/80',
    'from-cyan-500/80 to-blue-500/80',
    'from-purple-500/80 to-pink-500/80',
    'from-lime-500/80 to-emerald-500/80',
  ];
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) % 997;
  return gradients[hash % gradients.length];
}

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}

/** Skeleton shimmer — panel instrumen saat memuat. */

export function Skeleton({ className }: { className?: string }) {
  return <div className={`shimmer rounded ${className || ''}`} />;
}

export function CardSkeleton() {
  return (
    <div className="w-[150px] shrink-0 sm:w-[170px]">
      <Skeleton className="aspect-[2/3] w-full rounded" />
      <Skeleton className="mt-3 h-3.5 w-4/5 rounded-sm" />
      <Skeleton className="mt-2 h-3 w-1/2 rounded-sm" />
    </div>
  );
}

export function RowSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="flex gap-4 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div className="panel relative aspect-[16/10] w-full overflow-hidden md:aspect-[21/9]">
      <Skeleton className="absolute inset-0 rounded" />
    </div>
  );
}

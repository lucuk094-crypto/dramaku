import { HeroSkeleton, RowSkeleton } from '@/components/Skeleton';

export default function Loading() {
  return (
    <div className="container-x space-y-12 pb-12 pt-5 md:pt-8">
      <HeroSkeleton />
      <div>
        <div className="shimmer mb-4 h-6 w-48 rounded-full bg-card" />
        <RowSkeleton />
      </div>
      <div>
        <div className="shimmer mb-4 h-6 w-40 rounded-full bg-card" />
        <RowSkeleton />
      </div>
    </div>
  );
}

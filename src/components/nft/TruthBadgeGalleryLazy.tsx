import { lazy, Suspense } from 'react';
import { MobileLoadingSkeleton } from '@/components/MobileLoadingSkeleton';

const TruthBadgeGallery = lazy(() => import('./TruthBadgeGallery').then(m => ({ default: m.TruthBadgeGallery })));

export function TruthBadgeGalleryLazy() {
  return (
    <Suspense fallback={<MobileLoadingSkeleton variant="grid" count={6} />}>
      <TruthBadgeGallery />
    </Suspense>
  );
}

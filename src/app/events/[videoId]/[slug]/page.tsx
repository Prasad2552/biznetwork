import { Suspense } from 'react';
import Home from '@/app/page';

interface Params {
  videoId: string;
  slug: string;
}

export default function VideoPage({ params }: { params: Promise<Params> }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Home params={params} />
    </Suspense>
  );
}

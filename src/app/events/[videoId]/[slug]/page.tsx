import { Suspense } from 'react';
import ClientVideoPage from './ClientVideoPage';

interface Params {
  videoId: string;
  slug: string;
}

export default async function VideoPage({ params }: { params: Promise<Params> }) {
  const resolvedParams = await params;
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ClientVideoPage params={resolvedParams} />
    </Suspense>
  );
}
"use client";

import { useSearchParams } from "next/navigation";

interface Params {
  videoId: string;
  slug: string;
}

export default function ClientVideoPage({ params }: { params: Params }) {
  const searchParams = useSearchParams();
  const someParam = searchParams?.get("someKey");

  return (
    <div>
      <h1>Video Page: {params.videoId} - {params.slug}</h1>
      <p>Search Parameter: {someParam}</p>
    </div>
  );
}
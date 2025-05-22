"use client";

import Home from "@/app/page";

interface Params {
  videoId?: string;
  slug?: string;
}

interface VideoPageProps {
  params: Promise<Params>;
}

export default async function VideoPlayerPage({ params }: VideoPageProps) {
  const resolvedParams = await params; // Resolve the Promise
  const paramsPromise = Promise.resolve(resolvedParams); // Pass as Promise to Home

  return <Home params={paramsPromise} />;
}
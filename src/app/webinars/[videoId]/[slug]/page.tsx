"use client"

import Home from "@/app/page"

interface Params {
  videoId: string
  slug: string
}

interface VideoPageProps {
  params: Params
  searchParams?: { [key: string]: string | string[] | undefined }
}

export default function VideosPage({ params, searchParams }: VideoPageProps) {
  // Wrap params in a Promise
  const paramsPromise = Promise.resolve(params)

  return <Home params={paramsPromise} searchParams={searchParams} />
}


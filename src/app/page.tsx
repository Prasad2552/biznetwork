// src/app/page.tsx
"use client";
import React, { Suspense } from "react";
import dynamic from "next/dynamic";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";



// Lazy-loaded components
const VideoList = React.lazy(() => import("@/components/VideoList"));
const PDFGrid = React.lazy(() => import("@/components/pdf-grid"));
const CommentSection = React.lazy(() => import("@/components/CommentSection"));
const UpNextList = React.lazy(() => import("@/components/UpNextList"));

// Types
interface Params {
  videoId?: string;
  slug?: string;
}

interface VideoPageProps {
  params: Promise<Params>;
}

// Client Component to handle useSearchParams
function HomeContent({ params }: VideoPageProps) {
  const Home = React.lazy(() => import("@/components/Home")); // Move Home to a separate component
  return (
    <Suspense fallback={<div>Loading content...</div>}>
      <Home params={params} />
    </Suspense>
  );
}

// Main page component (Server Component by default)
export default async function Page({ params }: VideoPageProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <Suspense fallback={<div>Loading sidebar...</div>}>
        <HomeContent params={params} />
      </Suspense>
      <ToastContainer position="top-right" />
    </div>
  );
}
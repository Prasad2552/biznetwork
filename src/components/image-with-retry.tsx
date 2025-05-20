'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { getPresignedUrl } from '@/actions/getPresignedUrl';

interface ImageWithRetryProps {
  imageUrl: string | null; // Allow null imageUrl
  alt: string;
  bucketName: string;
  width?: number;
  height?: number;
  objectFit?: "contain" | "cover" | "fill";
}

export function ImageWithRetry({ imageUrl, alt, bucketName, width, height, objectFit }: ImageWithRetryProps) {
  const [presignedUrl, setPresignedUrl] = useState<string | undefined>(undefined);
  const [loadingAttempts, setLoadingAttempts] = useState(0);
  const maxRetries = 3;
  const retryDelay = 1000;

  useEffect(() => {
    const loadPresignedUrl = async () => {
      if (!imageUrl) {
        return;
      }

      try {
        // Extract the object key from the URL
        const urlObject = new URL(imageUrl);
        const pathname = urlObject.pathname;
        const imageKey = pathname.startsWith('/') ? pathname.slice(1) : pathname; //remove initial slash

        const presigned = await getPresignedUrl(bucketName, imageKey);
        if (presigned) {
          setPresignedUrl(presigned);
        }
      } catch (error) {
        console.error(`Error fetching presigned URL for ${imageUrl}:`, error);
        handleError();
      }
    };

    loadPresignedUrl();

  }, [imageUrl, bucketName, loadingAttempts]);

  const handleError = () => {
    if (loadingAttempts < maxRetries) {
      setTimeout(() => {
        setLoadingAttempts(prev => prev + 1);
      }, retryDelay);
    } else {
      console.error(`Max retry attempts reached for ${imageUrl}. Failed to load`);
    }
  };

  if (!imageUrl) return null;

  return (
    <div style={{ position: 'relative', width, height, display: "block" }}>
      {presignedUrl ? (
        <Image
          src={presignedUrl}
          alt={alt}
          fill
          style={{ objectFit }}
          quality={50}
          onError={handleError}
        />
      ) : (
        <p className="text-muted-foreground">Error loading image...</p>
      )}
    </div>
  );
}
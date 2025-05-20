//src\hooks\usePDFDocuments.ts

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';

interface PDFDocument {
    id: string;
    title: string;
    previewUrl: string;
    imageUrl?: string;
    type: string;
    author: string;
    dateUploaded: string;
    channelLogo?: string;
    channelName?: string;
    channelId: string;
    slug: string;
    content?: string;
    createdAt:string;
    featureImageUrl:string;
}

interface UsePDFDocumentsReturn {
    pdfDocuments: PDFDocument[];
    popularWebinars: PDFDocument[];
    popularInfographics: PDFDocument[];
    popularEvents: PDFDocument[];
    isLoading: boolean;
    error: string | null;
}

export const usePDFDocuments = (): UsePDFDocumentsReturn => {
    const [pdfDocuments, setPdfDocuments] = useState<PDFDocument[]>([]);
    const [popularWebinars, setPopularWebinars] = useState<PDFDocument[]>([]);
    const [popularInfographics, setPopularInfographics] = useState<PDFDocument[]>([]);
    const [popularEvents, setPopularEvents] = useState<PDFDocument[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const channelCache = useRef<Record<string, { logo: string, name: string }>>({});

    const fetchChannelData = useCallback(async (channelId: string) => {
          if (channelCache.current[channelId]) {
            return channelCache.current[channelId];
         }

        try {
            const channelResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/channels/${channelId}`);
             if (!channelResponse.ok) {
                 console.warn(`Failed to fetch channel data for channelId: ${channelId}`);
               return { logo: '/placeholder.svg', name: "Unknown Channel" };
             }
             const channelData = await channelResponse.json();
              channelCache.current[channelId] = { logo: channelData.logo, name: channelData.name };
             return channelCache.current[channelId];
        } catch (error) {
            console.error(`Error fetching channel data for channelId: ${channelId}`, error);
            return { logo: '/placeholder.svg', name: "Unknown Channel" };
        }
    }, []);

    useEffect(() => {
      const fetchPDFDocuments = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pdf-documents`);
                if (response.ok) {
                    const data = await response.json();

                   const pdfsWithChannel = await Promise.all(data.map(async (pdf: PDFDocument) => {
                      const {logo, name} = await fetchChannelData(pdf.channelId);
                           return {
                                ...pdf,
                                 channelLogo: logo,
                                channelName: name,
                                featureImageUrl: pdf.featureImageUrl,
                                    previewUrl: pdf.previewUrl,
                                     content: pdf.content
                                };
                    }));

                    setPdfDocuments(pdfsWithChannel);
                    setPopularWebinars(
                        pdfsWithChannel.filter((doc) => doc.type.toLowerCase().replace(/[-\s]/g, '') === 'webinars').slice(0, 2)
                    );
                    setPopularInfographics(
                        pdfsWithChannel.filter((doc) => doc.type.toLowerCase().replace(/[-\s]/g, '') === 'infographic').slice(0, 2)
                    );
                    setPopularEvents(
                        pdfsWithChannel.filter((doc) => doc.type.toLowerCase().replace(/[-\s]/g, '') === 'events').slice(0, 2)
                    );

                } else {
                     console.error('Failed to fetch PDF documents');
                    setError('Failed to load PDF documents');
                    toast.error('Failed to fetch PDF documents. Please try again.', { position: 'top-right' });
                }
            } catch (error) {
                 console.error('Error fetching PDF documents:', error);
                setError('Failed to load PDF documents');
                 toast.error('An error occurred while fetching PDF documents. Please try again.', { position: 'top-right' });
            } finally {
                setIsLoading(false);
            }
        };

        fetchPDFDocuments();
    }, [fetchChannelData]);

    return { pdfDocuments, popularWebinars, popularInfographics, popularEvents, isLoading, error };
};
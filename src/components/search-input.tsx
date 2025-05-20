// src/components/search-input.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { Search, Mic } from "lucide-react";
import { useRouter } from 'next/navigation';
import { Separator } from "@/components/ui/separator";

interface SearchResult {
    _id: string;
    title: string;
    type: 'video' | 'blog' | 'pdf' | 'webinar' | 'podcast' | 'testimonial' | 'demo' | 'event';
    slug?: string;
}

declare global {
    interface Window {
        webkitSpeechRecognition: any;
    }
}

export function SearchInput() {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isFocused, setIsFocused] = useState(false);
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);
    const [isListening, setIsListening] = useState(false);

    const fetchSuggestions = useCallback(async (term: string) => {
        if (!term) {
            setSearchResults([]);
            return;
        }
        try {
            const response = await fetch(`/api/search?q=${term}`);
            if (!response.ok) {
                throw new Error('Failed to fetch search suggestions');
            }
            const data = await response.json();
            setSearchResults(data.results || []);
        } catch (error) {
            console.error('Error fetching search suggestions:', error);
            setSearchResults([]);
        }
    }, []);

    useEffect(() => {
        if (searchTerm) {
            const timerId = setTimeout(() => {
                fetchSuggestions(searchTerm);
            }, 300);

            return () => clearTimeout(timerId);
        } else {
            setSearchResults([]);
        }
    }, [searchTerm, fetchSuggestions]);

    const handleSearchTermChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target === inputRef.current) {
            e.stopPropagation();
            setSearchTerm(e.target.value);
        }
    };

    const handleResultClick = useCallback((result: SearchResult) => {
        return (e: React.MouseEvent<HTMLLIElement>) => {
            e.preventDefault();
            setSearchTerm('');
            setSearchResults([]);
            setIsFocused(false);

            let url = '';
            switch (result.type) {
                case 'video':
                    url = `/videos/${result._id}`;
                    break;
                case 'webinar':
                    url = `/webinars/${result._id}/${result.slug}`;
                    break;
                case 'podcast':
                    url = `/podcasts/${result._id}/${result.slug}`;
                    break;
                case 'testimonial':
                    url = `/testimonials/${result._id}/${result.slug}`;
                    break;
                case 'demo':
                    url = `/demos/${result._id}/${result.slug}`;
                    break;
                case 'event':
                    url = `/events/${result._id}/${result.slug}`;
                    break;
                case 'blog':
                    url = `/blog/posts/${result.slug}`;
                    break;
                case 'pdf':
                    url = `/pdf-documents/${result._id}`;
                    break;
                default:
                    console.warn("Unknown result type:", result);
                    return;
            }

            router.push(url, { scroll: false });
        };
    }, [router]);

    const handleMicClick = () => {
        if (!('webkitSpeechRecognition' in window)) {
            console.error('Speech recognition is not supported in this browser.');
            return;
        }

        const SpeechRecognition = window.webkitSpeechRecognition;
        const recognitionInstance = new SpeechRecognition();
        recognitionInstance.continuous = false;
        recognitionInstance.interimResults = false;
        recognitionInstance.lang = 'en-US';

        recognitionInstance.onstart = () => {
            setIsListening(true);
        };

        recognitionInstance.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setSearchTerm(transcript);
            setIsListening(false);
        };

        recognitionInstance.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            setIsListening(false);
        };

        recognitionInstance.onend = () => {
            setIsListening(false);
        };

        recognitionInstance.start();
    };

    return (
        <div className="relative flex-grow">
            <Input
                ref={inputRef}
                type="text"
                placeholder="Search"
                className="w-full rounded-full pl-10 pr-4 shadow-sm"
                value={searchTerm}
                onChange={handleSearchTermChange}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setTimeout(() => setIsFocused(false), 250)}
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Mic
                className={`absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 cursor-pointer ${isListening ? 'text-blue-500' : ''}`}
                size={18}
                onClick={handleMicClick}
            />

            {isFocused && searchResults.length > 0 && (
                <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-md shadow-md z-10">
                    <ul>
                        {searchResults.map((result, index) => (
                            <React.Fragment key={result._id}>
                                <li
                                    className="md:px-4 md:py-3 py-2 px-2 w-full hover:bg-gray-100 cursor-pointer md:text-sm text-[8px] font-medium text-gray-800"
                                    onClick={handleResultClick(result)}
                                >
                                    {result.title} ({result.type})
                                </li>
                                {index < searchResults.length - 1 && (
                                    <Separator className="bg-gray-200" />
                                )}
                            </React.Fragment>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
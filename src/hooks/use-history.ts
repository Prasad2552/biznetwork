// src/hooks/use-history.ts

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

import type { Video } from "@/types/common";

export const useHistory = () => {
  const { data: session } = useSession();
  const [watchedContent, setWatchedContent] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
        if(!session?.user?.id) {
            setIsLoading(false);
            return;
        }
      setIsLoading(true);
        setError(null);
      try {
        const response = await fetch(`/api/users/${session.user.id}/history`);
        if (!response.ok) {
          const message = await response.json();
            setError(message.error || 'Failed to fetch history');
          throw new Error(`Failed to fetch history: ${response.status}`);

        }
        const data = await response.json();
       setWatchedContent(data);
      } catch (error: any) {
          setError(error.message || 'Failed to fetch history');
          console.error("Error fetching history:", error);
        } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [session?.user?.id]);

  return { watchedContent, isLoading, error };
};
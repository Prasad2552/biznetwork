import { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';

export function useSubscription(channelId: string) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();

  // Check subscription status
  const checkSubscription = useCallback(async () => {
    try {
      const response = await fetch(`/api/channels/${channelId}/subscribe`);
      const data = await response.json();
      setIsSubscribed(data.isSubscribed);
      setSubscriberCount(data.subscriberCount);
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  }, [channelId]);

  // Toggle subscription
  const toggleSubscription = async () => {
    if (!session) {
      toast.info('Please sign in to subscribe', {
        position: 'top-right'
      });
      router.push('/signin');
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`/api/channels/${channelId}/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to update subscription');
      }

      const data = await response.json();
      setIsSubscribed(data.isSubscribed);
      setSubscriberCount(data.subscriberCount);
      
      toast.success(data.isSubscribed ? 'Successfully subscribed!' : 'Successfully unsubscribed', {
        position: 'top-right'
      });
    } catch (error) {
      console.error('Error toggling subscription:', error);
      toast.error('Failed to update subscription', {
        position: 'top-right'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isSubscribed,
    isLoading,
    subscriberCount,
    toggleSubscription,
    checkSubscription
  };
}


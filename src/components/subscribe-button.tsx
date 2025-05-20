// src/components/subscribe-button.tsx
"use client"; // Mark as a client component

import React, { useEffect } from "react"
import { useSession } from "next-auth/react"
import { useChannelFollow } from "@/hooks/useChannelFollow";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/contexts/auth-context";

interface SubscribeButtonProps {
    channelId: string;
    className?: string;
    onSubscriberCountChange?: (count: number) => void;
}


const SubscribeButton: React.FC<SubscribeButtonProps> = ({
    channelId,
    className,
    onSubscriberCountChange,
}) => {
    const { data: session } = useSession();
    const { isFollowing, toggleFollow, isLoading, followerCount } = useChannelFollow(channelId);
    const { openSignInModal } = useAuthContext()

    useEffect(() => {
        if (followerCount !== undefined) {
            onSubscriberCountChange?.(followerCount);
        }
    }, [followerCount, onSubscriberCountChange]);


    const handleSubscribe = async () => {
        if (!session?.user) {
            openSignInModal();
            return;
        }
        await toggleFollow();
    };

    const buttonText = isLoading
        ? "Loading..."
        : isFollowing
        ? "Unfollow"
        : `Follow`;

    return (
        <Button
            onClick={handleSubscribe}
            className={className}
            disabled={isLoading}
        >
            {buttonText}
        </Button>
    );
};

export default SubscribeButton;
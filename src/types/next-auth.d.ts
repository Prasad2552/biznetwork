import 'next-auth';

declare module 'next-auth' {
    interface Session {
        user: {
            id: string;
            name?: string | null;
            email?: string | null;
            image?: string | null;
            provider?: string;
            firstName?: string;
            lastName?: string;
            role?: string;
            savedPosts: string[];
        };
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string;
        provider?: string;
        firstName?: string;
        lastName?: string;
        role?: string;
        savedPosts: string[];
        googleAccessToken?: string;
    }
}
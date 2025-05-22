// src/lib/authOptions.ts
import { NextAuthOptions, DefaultUser } from "next-auth"; // Consolidate imports
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import connectDB from '@/lib/mongodb';
import User, { IUserDocument } from '@/lib/models/User';
import OTP, { IOTPDocument } from '@/lib/models/OTP';
import { ObjectId } from "mongodb";

// Extend NextAuth types to include additional fields
// This is a good place for these module augmentations
declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            email: string;
            name?: string | null;
            image?: string | null;
            provider?: string;
            firstName?: string;
            lastName?: string;
            role?: string;
            savedPosts: string[];
        };
    }
    interface User extends DefaultUser {
        id: string;
        provider?: string;
        firstName?: string;
        lastName?: string;
        role?: string;
        savedPosts: string[];
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
        googleAccessToken?: string; // If you intend to store this
    }
}

// Define lean types (these are specific to your Mongoose models)
type LeanUser = Omit<IUserDocument, 'password' | 'createdAt' | 'updatedAt' | '__v'> & { _id: ObjectId, savedPosts: ObjectId[] };
type LeanOTP = Omit<IOTPDocument, 'createdAt' | '__v'> & { _id: ObjectId };

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
                otp: { label: "OTP", type: "text" }, // Removed required: false, NextAuth handles optionality
            },
            async authorize(credentials) { // Removed 'req' as it's not typically used here and can be inferred
                console.log("Credentials Provider authorize function called", credentials);
                if (!credentials?.email || !credentials?.password) {
                    console.error("Email and password are required");
                    throw new Error("Email and password are required");
                }

                try {
                    await connectDB();
                    const userWithPassword = await User.findOne({ email: credentials.email })
                        .select('+password')
                        .lean() as LeanUser & { password?: string } | null; // Made password optional on fetch

                    console.log("User Fetched:", userWithPassword);

                    if (!userWithPassword || !userWithPassword.password) {
                        console.error("No user found with this email or password not set");
                        throw new Error("Invalid credentials"); // Generic error for security
                    }

                    const isPasswordCorrect = await bcrypt.compare(
                        credentials.password,
                        userWithPassword.password
                    );

                    if (!isPasswordCorrect) {
                        console.error("Invalid credentials");
                        throw new Error("Invalid credentials");
                    }

                    const { password, ...user } = userWithPassword; // password is definitely present now

                    if (user.role === 'admin') {
                        if (!credentials.otp) {
                            console.error('OTP is required for admin login');
                            throw new Error('OTP is required for admin login');
                        }

                        const otpDoc = await OTP.findOne({
                            email: credentials.email,
                            otp: credentials.otp,
                            purpose: 'login',
                        }).lean() as LeanOTP | null;

                        console.log('OTP Verification:', otpDoc);

                        if (!otpDoc) {
                            console.error("Invalid OTP");
                            throw new Error("Invalid OTP");
                        }

                        await OTP.deleteOne({ _id: otpDoc._id });
                    }

                    console.log('Authentication successful for:', user.email);

                    return { // Return object must match NextAuth User type
                        id: user._id.toString(),
                        email: user.email,
                        name: user.name || `${user.firstName} ${user.lastName}`,
                        image: user.image,
                        provider: 'credentials', // Explicitly set provider
                        firstName: user.firstName,
                        lastName: user.lastName,
                        role: user.role || 'user',
                        savedPosts: user.savedPosts ? user.savedPosts.map(id => id.toString()) : [],
                    };
                } catch (error: any) {
                    console.error("Error in authorization:", error);
                    // Don't re-throw error.message as it might expose sensitive info.
                    // NextAuth expects null or the user object. Throwing an error is also fine.
                    throw new Error(error.message || "Authentication failed");
                }
            },
        }),
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
    ],
    callbacks: {
        async signIn({ user, account, profile }) {
            if (account?.provider === "google") {
                try {
                    await connectDB();
                    const email = user.email;

                    if (!email) {
                        console.error("No email provided by Google");
                        return false; // Deny sign-in
                    }

                    let dbUser = await User.findOne({ email }).lean() as LeanUser | null;

                    if (!dbUser) {
                        const [firstName, ...lastNameParts] = user.name?.split(' ') || ["", ""];
                        const lastName = lastNameParts.join(' ');

                        const newUserDoc = new User({
                            email,
                            name: user.name,
                            firstName,
                            lastName,
                            image: user.image,
                            provider: "google",
                            role: 'user',
                            savedPosts: [],
                        });

                        const savedUser = await newUserDoc.save();
                        dbUser = savedUser.toObject() as LeanUser; // Convert to plain object for consistency
                        console.log("New Google user created:", dbUser._id);
                    }

                    // Ensure the user object passed to JWT/session callbacks has all necessary fields
                    // These will be available on the `user` parameter in the `jwt` callback
                    // if the `signIn` callback returns `true` and the user object is modified here.
                    // However, the `user` object in `signIn` is primarily for the provider's user data.
                    // It's better to enrich the token in the `jwt` callback based on the `user.id`.
                    if (dbUser) {
                        // We don't need to modify the `user` object here directly for session data.
                        // The `jwt` callback will receive the `user` object from the provider or authorize.
                        // We just need to ensure the sign-in is allowed.
                    }
                    return true; // Allow sign-in
                } catch (error) {
                    console.error("Error in Google sign in:", error);
                    return false; // Deny sign-in on error
                }
            }
            return true; // Allow sign-in for other providers or if no specific logic
        },
        async jwt({ token, user, account, trigger, session: updateSession }) {
            // `user` is available on initial sign-in or when account is linked
            if (user) {
                token.id = user.id; // user.id comes from authorize or Google profile
                token.provider = user.provider || account?.provider;

                // If it's a credentials login, user object from authorize already has these
                // If it's Google, we might need to fetch from DB if not on initial Google user object
                if (user.provider === 'credentials') {
                    token.firstName = user.firstName;
                    token.lastName = user.lastName;
                    token.role = user.role;
                    token.savedPosts = user.savedPosts;
                } else if (account?.provider === "google" && token.id) {
                    // For Google, user object might be simpler initially. Fetch details if needed.
                    await connectDB();
                    const dbUser = await User.findById(token.id).lean() as LeanUser | null;
                    if (dbUser) {
                        token.email = dbUser.email; // Ensure email is from DB
                        token.name = dbUser.name || `${dbUser.firstName} ${dbUser.lastName}`;
                        token.firstName = dbUser.firstName;
                        token.lastName = dbUser.lastName;
                        token.role = dbUser.role || 'user';
                        token.savedPosts = dbUser.savedPosts ? dbUser.savedPosts.map(id => id.toString()) : [];
                        token.image = dbUser.image || token.picture; // token.picture comes from Google
                    }
                }
            }
            // If session is updated (e.g. via useSession().update())
            if (trigger === "update" && updateSession) {
                // You can update specific token fields here if needed
                // For example: token.role = updateSession.user.role
                // Be careful what you allow to be updated
            }
            return token;
        },
        async session({ session, token }) {
            // token contains the data from the jwt callback
            if (session.user) {
                session.user.id = token.id as string;
                session.user.provider = token.provider as string;
                session.user.firstName = token.firstName as string | undefined;
                session.user.lastName = token.lastName as string | undefined;
                session.user.role = token.role as string | undefined;
                session.user.savedPosts = token.savedPosts as string[];
                // Ensure email and name are also consistently from token if they could change
                session.user.email = token.email as string;
                session.user.name = token.name as string | null | undefined;
                session.user.image = token.image as string | null | undefined; // token.image or token.picture
            }
            return session;
        },
    },
    pages: {
        signIn: '/signin', // Your custom sign-in page
    },
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    secret: process.env.NEXTAUTH_SECRET,
    // debug: process.env.NODE_ENV === 'development', // Optional: for more logs in dev
};
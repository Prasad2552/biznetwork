import NextAuth, { DefaultUser, NextAuthOptions, Session } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import connectDB from '@/lib/mongodb';
import User, { IUserDocument, ExtendedUser } from '@/lib/models/User';
import OTP, { IOTPDocument } from '@/lib/models/OTP';
import { ObjectId } from "mongodb";

// Extend NextAuth types to include role and other user details
declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            email: string;
            name?: string;
            image?: string;
            provider?: string;
            firstName?: string;
            lastName?: string;
            role?: string; // Add role
            savedPosts: string[]; //Add Saved Posts
        };
    }
    interface User extends DefaultUser {
        id: string;
        provider?: string;
        firstName?: string;
        lastName?: string;
        role?: string; // Add role
        savedPosts: string[];  //Add Saved Posts
    }
}
declare module "next-auth/jwt" {
    interface JWT {
        id: string;
        provider?: string;
        firstName?: string;
        lastName?: string;
        role?: string; // Add role
        savedPosts: string[]; //Add Saved Posts
    }
}

// Define a type specifically for the result of lean()
type LeanUser = Omit<IUserDocument, 'password' | 'createdAt' | 'updatedAt' | '__v'> & { _id: ObjectId, savedPosts: ObjectId[] };
type LeanOTP = Omit<IOTPDocument,  'createdAt' | '__v'> & { _id: ObjectId };


export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
                otp: { label: "OTP", type: "text", required: false }, // Make OTP optional initially
            },
            async authorize(credentials, req) {
                console.log("Credentials Provider authorize function called", credentials);
                if (!credentials?.email || !credentials?.password) {
                    console.error("Email and password are required");
                    throw new Error("Email and password are required");
                }

                try {
                    await connectDB();
                    const user = await User.findOne({ email: credentials.email }).lean() as LeanUser | null;

                    console.log("User Fetched:", user);

                    if (!user) {
                        console.error("No user found with this email");
                        throw new Error("No user found with this email");
                    }

                    const isPasswordCorrect = await bcrypt.compare(
                        credentials.password,
                        (user as IUserDocument).password || ""
                    );

                    if (!isPasswordCorrect) {
                        console.error("Invalid credentials");
                        throw new Error("Invalid credentials");
                    }


                    // Verify OTP if provided (admin login)
                    if(user.role === 'admin'){
                        if(!credentials.otp){
                            console.error('OTP is required for admin login')
                            throw new Error('OTP is required for admin login')
                        }

                        const otpDoc = await OTP.findOne({
                            email: credentials.email,
                            otp: credentials.otp,
                            purpose: 'login',
                       }).lean() as LeanOTP | null;

                        console.log('OTP Verification:', otpDoc);

                        if(!otpDoc){
                            console.error("Invalid OTP");
                            throw new Error("Invalid OTP")
                        }

                       // Delete used OTP
                        await OTP.deleteOne({ _id: otpDoc._id })
                    }


                    console.log('Authentication successful');

                    // Map LeanUser to NextAuth's User type
                    const mappedUser: any = { // Use 'any' temporarily to avoid initial type errors
                        id: user._id.toString(),
                        email: user.email,
                        name: user.name || `${user.firstName} ${user.lastName}`,
                        image: user.image,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        provider: 'credentials',
                        role: user.role || 'user',
                        savedPosts: user.savedPosts ? user.savedPosts.map(id => id.toString()) : [], // Convert ObjectIds to strings
                    };

                  return mappedUser as any; // Assert the type to 'any'

                } catch (error:any) {
                    console.error("Error in authorization:", error);
                    throw new Error(error.message || "An error occurred during authorization.");
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
                        return false;
                    }

                    let existingUser = await User.findOne({ email }).lean() as LeanUser | null;

                    if (!existingUser) {
                        const [firstName, ...lastNameParts] = user.name?.split(' ') || [];
                        const lastName = lastNameParts.join(' ');

                        const newUser = new User({
                            email,
                            name: user.name,
                            firstName,
                            lastName,
                            image: user.image,
                            provider: "google",
                            role: 'user',
                            savedPosts: [],  // Initialize savedPosts
                        });

                        const savedUser = await newUser.save();
                        existingUser = savedUser.toObject() as LeanUser;
                        console.log("New Google user created:", existingUser);
                    }
                  if (existingUser) {
                    // Update user object with role and savedPosts
                    user.id = existingUser._id.toString();
                    (user as any).provider = "google";
                    (user as any).firstName = existingUser.firstName;
                    (user as any).lastName = existingUser.lastName;
                    (user as any).role = existingUser.role || 'user';
                    (user as any).savedPosts = existingUser.savedPosts ? existingUser.savedPosts.map(id => id.toString()) : [];
                  }


                } catch (error) {
                    console.error("Error in Google sign in:", error);
                    return false;
                }
            }
            return true;
        },
        async jwt({ token, user, account }) {
            if (user) {
                token.id = user.id;
                token.provider = (user as any).provider || account?.provider;
                token.firstName = (user as any).firstName;
                token.lastName = (user as any).lastName;
                token.role = (user as any).role; // Include role in JWT
                token.savedPosts = (user as any).savedPosts;  //Include Saved Posts
            }
            return token;
        },
        async session({ session, token }) {
            if(session?.user && token){
                (session.user as any).id = token.id;
                (session.user as any).provider = token.provider;
                (session.user as any).firstName = token.firstName;
                (session.user as any).lastName = token.lastName;
                (session.user as any).role = token.role;
                 (session.user as any).savedPosts = token.savedPosts;
            }
            return session;
        },
    },
    pages: {
        signIn: '/signin',
    },
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
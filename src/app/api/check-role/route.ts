import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function POST(request: Request) {
    try {
        await connectDB();
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json(
                { message: 'Email is required' },
                { status: 400 }
            );
        }

        const user = await User.findOne({ email }).select('role');
        if (!user) {
            return NextResponse.json(
                { message: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { isAdmin: user.role === 'admin' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Check role error:', error);
        return NextResponse.json(
            { message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}` },
            { status: 500 }
        );
    }
}
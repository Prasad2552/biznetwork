import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function POST(request: Request) {
    try {
        await connectDB();

        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { message: 'Email and password are required' },
                { status: 400 }
            );
        }

        const user = await User.findOne({ email });

        if (!user || !user.password) {
            return NextResponse.json(
                { message: 'Invalid email or password' },
                { status: 401 }
            );
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return NextResponse.json(
                { message: 'Invalid email or password' },
                { status: 401 }
            );
        }

        if (!process.env.JWT_SECRET) {
            console.error('JWT_SECRET environment variable is not defined.');
            return NextResponse.json(
                { message: 'Internal server error: JWT_SECRET not defined' },
                { status: 500 }
            );
        }

        const token = jwt.sign(
          { userId: user._id.toString(), email: user.email, role: user.role },
          process.env.JWT_SECRET,
          { expiresIn: '1h' }
        );

        const userResponse = {
          id: user._id.toString(),
          email: user.email,
          name: user.name || `${user.firstName} ${user.lastName}`,
        };
        
         return NextResponse.json(
          { message: 'Sign in successful', user: userResponse, token },
          { status: 200 }
        );

    } catch (error) {
        console.error('Signin error:', error);
        
        return NextResponse.json(
            { message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}` },
            { status: 500 }
        );
    }
}
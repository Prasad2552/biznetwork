import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { hash } from 'bcryptjs'
import OTP from '@/lib/models/OTP'
import mongoose from 'mongoose'

export async function POST(req: Request) {
    try {
        const { email, otp, newPassword } = await req.json()
        const dbConnection = await connectDB() as mongoose.Mongoose;

        if (!dbConnection || !dbConnection.connection || !dbConnection.connection.db) {
          console.error("Failed to connect to database");
          return NextResponse.json({ error: 'Failed to connect to database' }, { status: 500 });
        }
        const db = dbConnection.connection.db
        // Verify OTP
        const otpDoc = await OTP.findOne({
            email,
            otp,
            purpose: 'reset-password'
        })

        if (!otpDoc) {
            return NextResponse.json(
                { error: 'Invalid or expired OTP' },
                { status: 400 }
            )
        }

        // Hash new password
        const hashedPassword = await hash(newPassword, 12)

        // Update password
        const result = await db.collection('users').updateOne(
            { email, role: 'admin' },
            { $set: { password: hashedPassword } }
        )

        if (result.matchedCount === 0) {
            return NextResponse.json(
                { error: 'Admin not found' },
                { status: 404 }
            )
        }

        // Delete used OTP
        await OTP.deleteOne({ _id: otpDoc._id })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error resetting password:', error)
        return NextResponse.json(
            { error: 'Failed to reset password' },
            { status: 500 }
        )
    }
}
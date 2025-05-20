import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { generateOTP, sendEmail } from '@/lib/email'
import OTP from '@/lib/models/OTP'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { rateLimit } from '@/lib/rate-limit'
import mongoose from 'mongoose'

const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500
})

export async function POST(req: Request) {
  try {
    // Rate limiting
    await limiter.check(5, 'SEND_OTP')

    const { email, purpose } = await req.json()
    const dbConnection = await connectDB() as mongoose.Mongoose; // Get the mongoose connection object


    if (!dbConnection || !dbConnection.connection || !dbConnection.connection.db) {
      console.error("Failed to connect to database");
      return NextResponse.json({ error: 'Failed to connect to database' }, { status: 500 });
    }
    const db = dbConnection.connection.db // getting db object
    
     // For sensitive operations, verify current session
    if (purpose !== 'login' && purpose !== 'reset-password') {
      const session = await getServerSession(authOptions)
      if (session?.user?.role !== 'admin') {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
    }


    // Verify email exists and is an admin
    const user = await db.collection('users').findOne({
      email,
      role: 'admin'
    })

    if (!user) {
      return NextResponse.json(
        { error: 'No admin found with this email' },
        { status: 404 }
      )
    }

    // Generate and save OTP
    const otp = generateOTP()
    await OTP.create({
      email,
      otp,
      purpose
    })

    // Send OTP email
    await sendEmail({
      to: email,
      subject: 'Your Admin Authentication OTP',
      html: `
        <h1>Admin Authentication OTP</h1>
        <p>Your OTP is: <strong>${otp}</strong></p>
        <p>This OTP will expire in 10 minutes.</p>
      `
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error sending OTP:', error)
    return NextResponse.json(
      { error: 'Failed to send OTP' },
      { status: 500 }
    )
  }
}
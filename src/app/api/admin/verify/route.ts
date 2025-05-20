import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Admin from '@/lib/models/Admin';
import VerificationCode from '@/lib/models/VerificationCode';
import jwt from 'jsonwebtoken';

export async function POST(request: Request) {
  await dbConnect();
  try {
    const { adminId, verificationCode } = await request.json();

    const verificationRecord = await VerificationCode.findOne({
      adminId,
      code: verificationCode,
      expiresAt: { $gt: new Date() }
    });

    if (!verificationRecord) {
      return NextResponse.json({ error: "Invalid or expired verification code" }, { status: 400 });
    }

    const admin = await Admin.findById(adminId);
    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    // Delete the used verification code
    await VerificationCode.deleteOne({ _id: verificationRecord._id });

    const token = jwt.sign(
      { adminId: admin._id, email: admin.email },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );

    const response = NextResponse.json({ message: "Admin verified successfully" }, { status: 200 });
    response.cookies.set('adminToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'strict',
      maxAge: 3600,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error("Admin verification error:", error);
    return NextResponse.json({ error: "Failed to verify" }, { status: 500 });
  }
}


import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Admin from '@/lib/models/Admin';
import VerificationCode from '@/lib/models/VerificationCode';
import bcryptjs from 'bcryptjs';
import { sendVerificationEmail } from '@/lib/email';

export async function POST(request: Request) {
  console.log("API Route Triggered")
  await dbConnect();
  try {
    const { email, password } = await request.json();

    console.log('Received login request for email:', email);

    const admin = await Admin.findOne({ email });
    console.log('Admin found:', admin);
    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    const isPasswordValid = await bcryptjs.compare(password, admin.password);
    console.log('Password valid:', isPasswordValid);
    if (!isPasswordValid) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    // Generate a verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('Verification code generated:', verificationCode);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    await VerificationCode.create({
      adminId: admin._id,
      code: verificationCode,
      expiresAt
    });
    const verficationCodeFromDb = await VerificationCode.findOne({code: verificationCode}).lean()
    console.log("Verification code from db", verficationCodeFromDb);
    // Send verification email
    await sendVerificationEmail(admin.email, verificationCode);

    return NextResponse.json({ message: "Verification code sent", adminId: admin._id }, { status: 200 });
  } catch (error: unknown) {
    console.error("Admin login error:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: "Failed to login", details: error.message }, { status: 500 });
    } else {
      return NextResponse.json({ error: "An unknown error occurred" }, { status: 500 });
    }
  }
}


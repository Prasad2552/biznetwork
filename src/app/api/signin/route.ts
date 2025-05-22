import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/User";
import OTP from "@/lib/models/OTP";

export async function POST(request: Request) {
  try {
    await connectDB();

    const { email, password, otp } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user || !user.password) {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Handle OTP for admins
    if (user.role === "admin") {
      if (!otp) {
        return NextResponse.json(
          { message: "OTP is required for admin login" },
          { status: 400 }
        );
      }
      const otpDoc = await OTP.findOne({
        email,
        otp,
        purpose: "login",
      });
      if (!otpDoc) {
        return NextResponse.json(
          { message: "Invalid OTP" },
          { status: 401 }
        );
      }
      await OTP.deleteOne({ _id: otpDoc._id });
    } else if (otp) {
      return NextResponse.json(
        { message: "OTP is not allowed for non-admin users" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        message: "Sign in successful",
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name || `${user.firstName} ${user.lastName}`,
          role: user.role || "user",
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Signin error:", error);
    if (error instanceof Error && error.name === "MongoServerError") {
      return NextResponse.json(
        { message: "Database error occurred" },
        { status: 500 }
      );
    }
    return NextResponse.json(
      {
        message: `An unexpected error occurred: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      },
      { status: 500 }
    );
  }
}
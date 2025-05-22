// biznetwork\src\app\api\admin\change-email\route.ts
import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import OTP from '@/lib/models/OTP'
import { getServerSession } from 'next-auth'
import { authOptions } from "@/lib/authOptions";
import mongoose from 'mongoose'

export async function POST(req: Request) {
    try {
        const { currentEmail, newEmail, otp } = await req.json();
       
        if(!currentEmail || !newEmail || !otp) {
           return NextResponse.json({error: "Current email, new email and OTP are required"}, {status: 400});
        }

       const dbConnection = await connectDB() as mongoose.Mongoose;
      if (!dbConnection || !dbConnection.connection || !dbConnection.connection.db) {
          console.error("Failed to connect to database");
          return NextResponse.json({ error: 'Failed to connect to database' }, { status: 500 });
      }
       const db = dbConnection.connection.db // getting db object

        const session = await getServerSession(authOptions)
        if(session?.user?.role !== 'admin'){
            return NextResponse.json({error: "Unauthorized"}, {status: 401})
        }

         const otpDoc = await OTP.findOne({
             email: currentEmail,
            otp,
             purpose: 'change-email'
         })

         if(!otpDoc) {
           return NextResponse.json({error: 'Invalid OTP'}, {status: 400})
         }

         const admin = await db.collection('users').findOne({
            email: currentEmail,
             role: 'admin'
         });

          if(!admin){
            return NextResponse.json({error: "No admin found with this email"}, {status: 404})
         }


         await db.collection('users').updateOne(
                { _id: admin._id },
                { $set: { email: newEmail } }
            );
        await OTP.deleteOne({_id: otpDoc._id});

        return NextResponse.json({success: true}, {status: 200})

    } catch (error) {
       console.error("Error while changing email:", error);
       return NextResponse.json({error: "An error occurred while changing email"}, {status: 500})
    }
}
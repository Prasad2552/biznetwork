import { Schema, model, models, Document } from 'mongoose'

export interface IOTPDocument extends Document{
  email: string;
  otp: string;
  purpose: 'login' | 'reset-password' | 'change-email';
  createdAt: Date;
}

const otpSchema = new Schema({
  email: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  purpose: {
    type: String,
    enum: ['login', 'reset-password', 'change-email'],
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600, // OTP expires after 10 minutes
  },
})

const OTP = models.OTP || model<IOTPDocument>('OTP', otpSchema)
export default OTP
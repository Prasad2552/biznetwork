import mongoose from 'mongoose';

const VerificationCodeSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true,
  },
  code: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
}, {
  timestamps: true,
});

const VerificationCode = mongoose.models.VerificationCode || mongoose.model('VerificationCode', VerificationCodeSchema);

export default VerificationCode;


import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  channelId: {
    type: String,
    required: true,
  },
  subscribedAt: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: true
});

// Compound index to ensure unique subscriptions
subscriptionSchema.index({ userId: 1, channelId: 1 }, { unique: true });

export const Subscription = mongoose.models.Subscription || mongoose.model('Subscription', subscriptionSchema);


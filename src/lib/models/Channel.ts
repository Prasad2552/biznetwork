//src\lib\models\Channel.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IChannel extends Document {
  _id: mongoose.Types.ObjectId;  // Explicitly define _id type
  name: string;
  description: string;
  subscribers: number;
  engagements: number;
  logo: string;
  banner: string; // New banner property
  videoCount: number;
  blogCount: number;
  webinarCount: number;
  podcastCount: number;
  caseStudyCount: number;
  techNewsCount: number; //THIS LINE
  infographicCount: number;
  whitePaperCount: number;
  testimonialCount: number;
  ebookCount: number;
  demoCount: number;
  eventCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const channelSchema = new Schema<IChannel>({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    logoUrl: String,
  },

  description: {
    type: String,
    required: true,
    trim: true
  },
  subscribers: {
    type: Number,
    default: 0
  },
  engagements: {
    type: Number,
    default: 0
  },
  logo: {
    type: String,
    default: "",
  },
  techNewsCount: { // ADD THIS SECTION -THIS LINE
    type: Number,
    default: 0,
  },
  banner: { // New banner field
    type: String,
    default: "",
  },
  videoCount: {
    type: Number,
    default: 0
  },
  blogCount: {
    type: Number,
    default: 0
  },
  webinarCount: {
    type: Number,
    default: 0
  },
  podcastCount: {
    type: Number,
    default: 0
  },
  caseStudyCount: {
    type: Number,
    default: 0
  },
  infographicCount: {
    type: Number,
    default: 0
  },
  whitePaperCount: {
    type: Number,
    default: 0
  },
  testimonialCount: {
    type: Number,
    default: 0
  },
  ebookCount: {
    type: Number,
    default: 0
  },
  demoCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Channel.index({ name: 'text', description: 'text' });  not applicable

const Channel = mongoose.models.Channel || mongoose.model<IChannel>('Channel', channelSchema);

export default Channel;
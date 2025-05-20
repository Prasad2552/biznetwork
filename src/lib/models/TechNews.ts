// src/lib/models/TechNews.ts
import mongoose, { Schema, Types } from 'mongoose';

export interface ITechNews extends Document {
  title: string;
      content: string;
      excerpt?: string;
      channelId: string;
      featuredImage: string | null;
      createdAt: Date;
      updatedAt: Date;
      slug: string;
      likes: number;
      dislikes: number;
      likeBy: Types.ObjectId[];
      dislikeBy: Types.ObjectId[];
      tags?: string[];
      author?: string;
      channelLogo?: string;
      views?: number;
      orientation?: 'horizontal' | 'vertical';
      
}

const TechNewsSchema: Schema = new Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    excerpt: { type: String },
    channelId: { type: String, required: true },
    featuredImage: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    slug: { type: String, required: true, unique: true, index: true },
    likes: { type: Number, default: 0 },
    dislikes: { type: Number, default: 0 },
    likeBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    dislikeBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    tags: { type: [String], default: [] },
    author: { type: String },
    channelLogo: { type: String },
    views: { type: Number, default: 0 },
    orientation: {  // Add this line
        type: String,
        enum: ['horizontal', 'vertical'],
        default: null  // Important: Allow null to enable default behavior
    }
});
TechNewsSchema.index({ title: 'text', content: 'text', excerpt: 'text' });

export default mongoose.models.TechNews || mongoose.model<ITechNews>('TechNews', TechNewsSchema);
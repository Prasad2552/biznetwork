//src\lib\models\Podcast.ts
import mongoose, { Schema, model, models, Types } from 'mongoose';
import { BaseContent } from '@/types/content'; // Import BaseContent

export interface IPodcast extends BaseContent { //Extends BaseContent
    likes: number;
    dislikes: number;
    views: number;
  duration: number;
  uploadDate: Date;
     likedBy: Types.ObjectId[]; // Array of user IDs who liked the video
    dislikedBy: Types.ObjectId[]; // Array of user IDs who disliked the video
    comments: Array<{
      userId: Types.ObjectId;
      content: string;
      createdAt: Date;
  }>;
}


const podcastSchema = new Schema<IPodcast>(
  {
    channelId: {
      type: mongoose.Schema.Types.ObjectId, // Use mongoose.Schema.Types.ObjectId here
      ref: 'Channel',
      required: true
    },
    title: {
      type: String,
      required: true
    },
    description: { type: String },
     filePath: { type: String, required: true },
     featureImageUrl: { type: String },
       type: {
          type: String,
            default: 'podcasts'
        },
    duration: {
      type: Number,
        default: 0
    },
    uploadDate: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'published'
    },
      likes: {
          type: Number,
          default: 0
      },
      dislikes: {
          type: Number,
          default: 0
      },
      views: {
          type: Number,
          default: 0,
          min: 0,
          validate: {
              validator: Number.isInteger,
              message: '{VALUE} is not an integer value for views'
          }
      },
       likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Use mongoose.Schema.Types.ObjectId here
        dislikedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Use mongoose.Schema.Types.ObjectId here

    comments: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId, // Use mongoose.Schema.Types.ObjectId here
        ref: 'User'
      },
      content: String,
      createdAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  {
    timestamps: true
  }
);
podcastSchema.index({ title: 'text', description: 'text' });
const Podcast = (models.Podcast || model<IPodcast>('Podcast', podcastSchema))
export default Podcast;
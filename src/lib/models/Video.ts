import mongoose, { Schema, model, models } from 'mongoose';
import { Video } from "@/types/common"; // Import the Video type

// Changed Schema type to any
const videoSchema = new Schema<any>(
  {
    channelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Channel',
      required: true
    },
    title: {
      type: String,
      required: true
    },
    description: String,
    videoUrl: {
      type: String,
      required: true
    },
    thumbnailUrl: String,
    categories: {
        type: Schema.Types.Mixed, // Allows any type
          default: {},
      },
    duration: {
      type: Number, // Keep number for the schema
        default: 0
    },
    uploadDate: {
        type: Date,  // Keep Date for the schema
        default: Date.now
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'processing', 'failed', 'processed'], // Added "processing" and "failed"
      default: 'draft'
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
    likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    dislikedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      content: String,
      createdAt: {
        type: Date,
        default: Date.now
      },
       replies: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
        default: []
      }],
    }],
     type: {
        type: String,
        enum: ['video', 'webinar', 'podcast', 'testimonial', 'demo', 'event', 'short'],
        default: 'video',
    },
        eventImageUrls: [{ // Add this field for event images
            type: String,
            default: [],
        }],
    watchedBy: [
      { type: Schema.Types.ObjectId, 
        ref: 'User' }],


      slug: {
          type: String,
          required: true,
          unique: true
      }
  },
  {
    timestamps: true
  }
);

videoSchema.index({ title: 'text', description: 'text' });
// Specify the type of 'this' with a generic
videoSchema.pre<Video>('save', function(next) {
  if (this.views < 0) {
    this.views = 0;
  }
  next();
});


const VideoModel = (models.Video || model<Video>('Video', videoSchema))
export default VideoModel;

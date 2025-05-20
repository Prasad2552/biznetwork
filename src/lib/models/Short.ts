// src/lib/models/Short.ts

import mongoose, { Schema, model, models, Types } from 'mongoose';
import { BaseContent } from '@/types/content';

export interface IShort extends BaseContent {
    likes: number;
    dislikes: number;
    views: number;
    duration: number;
    uploadDate: Date;
    likedBy: Types.ObjectId[];
    dislikedBy: Types.ObjectId[];
    comments: Array<{
        userId: Types.ObjectId;
        content: string;
        createdAt: Date;
    }>;
    videoUrl: string; // Add videoUrl
    thumbnailUrl: string; // Add thumbnailUrl
    // Define other fields specific to shorts here
}

const shortSchema = new Schema<IShort>(
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
        description: { type: String },
        videoUrl: { type: String, required: true },
        thumbnailUrl: { type: String },
        type: {
            type: String,
            default: 'short'
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
        slug: {
            type: String,
            required: true,
            unique: true
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
            }
        }],
    },
    {
        timestamps: true
    }
);

const Short = (models.Short || model<IShort>('Short', shortSchema));
export default Short;
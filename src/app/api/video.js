import mongoose from 'mongoose';

const videoSchema = new mongoose.Schema({
    channelId: { type: mongoose.Schema.Types.ObjectId, required: true , ref: 'Channel'},
    title: { type: String, required: true },
    description: { type: String },
    videoUrl: { type: String, required: true },
    thumbnailUrl: { type: String },
    categories: [String],
    audience: String,
    visibility: String,
    scheduleDate: Date,
    uploadDate: { type: Date, default: Date.now },
    status: { type: String, default: 'published' },
    duration: { type: Number },
    likes: { type: Number, default: 0 },
    dislikes: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],  // Array of user IDs who liked the video
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
    }]

});

const Video = mongoose.models.Video || mongoose.model('Video', videoSchema);

export default Video;
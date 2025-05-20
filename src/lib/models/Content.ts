//src\lib\models\Content.ts
import mongoose from 'mongoose'

const ContentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: { 
    type: String, 
    required: true,
    enum: ['video', 'blog', 'webinar', 'infographic', 'event']
  },
  thumbnail: { type: String, required: true },
  videoUrl: String,
  description: String,
  author: {
    name: { type: String, required: true },
    avatar: String,
  },
  views: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  comments: { type: Number, default: 0 },
  isFeatured: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
})

export default mongoose.models.Content || mongoose.model('Content', ContentSchema)


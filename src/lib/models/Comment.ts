//src\lib\models\Comment.ts
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IComment extends Document {
  videoId: Types.ObjectId; // Or Schema.Types.ObjectId
  userId: string;
  username: string;
  content: string;
  likes: number;
  dislikes: number;
  createdAt: Date;
  updatedAt: Date;
  replies: Types.ObjectId[]; //  Array of ObjectIds
  likedBy: string[];
  dislikedBy: string[];
}

const CommentSchema: Schema = new Schema<IComment>({ // Explicitly type the schema
  videoId: { type: Schema.Types.ObjectId, ref: 'Video', required: true },
  userId: { type: String, required: true },
  username: { type: String, required: true },
  content: { type: String, required: true },
  likes: { type: Number, default: 0 },
  dislikes: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  replies: [{ type: Schema.Types.ObjectId, ref: 'Comment' }],
  likedBy: [{ type: String, default: [] }],
  dislikedBy: [{ type: String, default: [] }],
}, { timestamps: true }); //  Optional: use timestamps option

export default mongoose.models.Comment || mongoose.model<IComment>('Comment', CommentSchema);
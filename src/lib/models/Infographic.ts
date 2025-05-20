import mongoose, { Schema, model } from 'mongoose';
import { BaseContent } from '@/types/content'; // Import the BaseContent type


const infographicSchema = new Schema<BaseContent>({
    channelId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Channel' },
    title: { type: String, required: true },
    description: { type: String }, // Make description optional
    filePath: { type: String, required: true }, // Make filePath required
    featureImageUrl: { type: String },// Make featureImageUrl optional
  author: {type: String}
}, { timestamps: true });

const Infographic = mongoose.models.Infographic || model<BaseContent>('Infographic', infographicSchema);

export default Infographic;
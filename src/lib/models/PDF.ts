// src\lib\models\PDF.ts
import mongoose, { Schema, model } from 'mongoose';
import { BaseContent } from '@/types/content';

interface PDFDocument extends BaseContent {
    fileUrl: string;
    contentType: string;
     content: string;
}

const pdfSchema = new Schema<PDFDocument>(
    {
        title: { type: String, required: true },
        channelId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
        fileUrl: { type: String, required: true },
        featureImageUrl: { type: String },
        author: { type: String }, //Optional author field
        description: { type: String }, //Optional description
        slug: {type: String, required: true },
         status: { type: String, enum: ['draft', 'published'], default: 'draft' },
         contentType: { type: String, required: true },
         views: { type: Number, default: 0 },
        content: { type: String, default: ''}
        
    },
    { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

pdfSchema.index({ title: 'text', description: 'text', content: 'text'});
const PDFModel = mongoose.models.PDF || model<PDFDocument>('PDF', pdfSchema);

export default PDFModel;
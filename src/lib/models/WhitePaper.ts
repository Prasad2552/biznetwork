//src\lib\models\WhitePaper.ts
import mongoose from 'mongoose'

const WhitePaperSchema = new mongoose.Schema({
  title: { type: String, required: true },
  abstract: { type: String, required: true },
  pdfUrl: { type: String, required: true },
  author: { type: String, required: true },
  channel: { type: mongoose.Schema.Types.ObjectId, ref: 'Channel', required: true },
}, { timestamps: true })
WhitePaperSchema.index({ title: 'text', abstract: 'text' });

const WhitePaper = mongoose.models.WhitePaper || mongoose.model('WhitePaper', WhitePaperSchema)

export default WhitePaper
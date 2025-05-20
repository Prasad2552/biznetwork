import mongoose from 'mongoose'

const EbookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  author: { type: String, required: true },
  coverImageUrl: { type: String, required: true },
  pdfUrl: { type: String, required: true },
  channel: { type: mongoose.Schema.Types.ObjectId, ref: 'Channel', required: true },
}, { timestamps: true })

const Ebook = mongoose.models.Ebook || mongoose.model('Ebook', EbookSchema)

export default Ebook


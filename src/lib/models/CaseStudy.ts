import mongoose from 'mongoose'

const caseStudySchema = new mongoose.Schema({
  title: { type: String, required: true },
  abstract: { type: String, required: true },
  pdfUrl: { type: String, required: true },
  author: { type: String, required: true },
  channel: { type: mongoose.Schema.Types.ObjectId, ref: 'Channel', required: true },
}, { timestamps: true })

const CaseStudy = mongoose.models.CaseStudy || mongoose.model('CaseStudy', caseStudySchema)

export default CaseStudy


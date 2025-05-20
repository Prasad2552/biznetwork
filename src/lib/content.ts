import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';

// Define a generic content schema
const contentSchema = new mongoose.Schema({
  title: String,
  description: String,
  thumbnail: String,
  author: String,
  date: Date,
  views: Number,
  type: String,
  channel: String,
  likes: Number,
  dislikes: Number,
  comments: Number,
}, { strict: false });

// Create a model for each content type
const Video = mongoose.models.Video || mongoose.model('Video', contentSchema);
const Blog = mongoose.models.Blog || mongoose.model('Blog', contentSchema);
const Webinar = mongoose.models.Webinar || mongoose.model('Webinar', contentSchema);
const Podcast = mongoose.models.Podcast || mongoose.model('Podcast', contentSchema);
const UpNext = mongoose.models.UpNext || mongoose.model('UpNext', contentSchema);
const TechNews = mongoose.models.TechNews || mongoose.model('TechNews', contentSchema);

export async function getContentByType(type: string) {
  await dbConnect();

  let model;
  switch (type) {
    case 'all':
      const allContent = await Promise.all([
        getContentFromModel(Video, 4),
        getContentFromModel(Blog, 4),
        getContentFromModel(Webinar, 4),
        getContentFromModel(Podcast, 4),
      ]);
      return allContent.flat();
    case 'videos':
      model = Video;
      break;
    case 'blogs':
      model = Blog;
      break;
    case 'webinars':
      model = Webinar;
      break;
    case 'podcasts':
      model = Podcast;
      break;
    case 'upnext':
      model = UpNext;
      break;
    case 'technews':
      model = TechNews;
      break;
    default:
      throw new Error('Invalid content type');
  }

  return getContentFromModel(model);
}

async function getContentFromModel(model: mongoose.Model<any>, limit: number = 12) {
  return await model.find().limit(limit).lean();
}


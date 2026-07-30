import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    title:       { type: String, required: true },
    slug:        { type: String, required: true, unique: true },
    category:    { type: String, enum: ['update', 'info', 'maintenance'], required: true },
    content:     { type: String, required: true },
    excerpt:     { type: String, required: true },
    coverUrl:    { type: String, default: null },
    readTime:    { type: Number, default: 1 },
    published:   { type: Boolean, default: false },
    publishedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export const NewsArticle =
  mongoose.models.NewsArticle || mongoose.model('NewsArticle', schema);

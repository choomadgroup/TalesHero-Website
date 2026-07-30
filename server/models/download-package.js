import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    id:        { type: String, enum: ['setup', 'fullclient', 'patch'], required: true, unique: true },
    href:      { type: String, default: '' },
    size:      { type: String, default: '' },
    available: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const DownloadPackage =
  mongoose.models.DownloadPackage || mongoose.model('DownloadPackage', schema);

import mongoose from 'mongoose';

const careerApplicationSchema = new mongoose.Schema({
  fullName:    { type: String, required: true, trim: true, maxlength: 100 },
  username:    { type: String, required: true, trim: true, maxlength: 50 },
  email:       { type: String, required: true, trim: true, maxlength: 200 },
  discord:     { type: String, required: true, trim: true, maxlength: 100 },
  position:    { type: String, required: true, enum: ['Game Master', 'Translator', 'Customer Service', 'Graphics Designer', 'Moderator', 'Developer'] },
  motivation:  { type: String, required: true, maxlength: 2000 },
  experience:  { type: String, required: true, maxlength: 2000 },
  portfolio:   { type: String, default: '', maxlength: 500 },
  status:      { type: String, enum: ['pending', 'reviewed', 'accepted', 'rejected'], default: 'pending' },
  createdAt:   { type: Date, default: Date.now },
});

export const CareerApplication = mongoose.models.CareerApplication
  || mongoose.model('CareerApplication', careerApplicationSchema);

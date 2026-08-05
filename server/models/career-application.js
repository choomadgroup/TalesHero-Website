import mongoose from 'mongoose';

const careerApplicationSchema = new mongoose.Schema({
  gameUsername:    { type: String, required: true, trim: true, maxlength: 50 },    // session login username
  nickname:        { type: String, required: true, trim: true, maxlength: 100 },   // in-game nickname (auto)
  email:           { type: String, required: true, trim: true, maxlength: 200 },   // auto from session
  fullName:        { type: String, required: true, trim: true, maxlength: 150 },   // applicant's full name
  birthDate:       { type: String, required: true, maxlength: 20 },                // date string YYYY-MM-DD
  discord:         { type: String, required: true, trim: true, maxlength: 100 },
  position:        { type: String, required: true, enum: ['Game Master', 'Translator', 'Customer Service', 'Graphics Designer', 'Moderator', 'Developer'] },
  whyJoin:         { type: String, required: true, maxlength: 2000 },   // kenapa berminat bergabung
  whatSkills:      { type: String, required: true, maxlength: 2000 },   // apa yang kamu punya/tawarkan
  whyChooseYou:    { type: String, required: true, maxlength: 2000 },   // mengapa kami harus memilih kamu
  isAvailable:     { type: Boolean, required: true },                   // siap login di waktu diminta
  experience:      { type: String, default: '', maxlength: 2000 },      // pengalaman relevan (optional)
  portfolio:       { type: String, default: '', maxlength: 500 },
  status:          { type: String, enum: ['pending', 'reviewed', 'accepted', 'rejected'], default: 'pending' },
  statusUpdatedAt: { type: Date, default: null },
  createdAt:       { type: Date, default: Date.now },
});

export const CareerApplication = mongoose.models.CareerApplication
  || mongoose.model('CareerApplication', careerApplicationSchema);

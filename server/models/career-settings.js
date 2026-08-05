import mongoose from 'mongoose';

// One document stores all position availability flags.
// Singleton — keyed by a fixed docId so upsert is idempotent.
const careerSettingsSchema = new mongoose.Schema({
  docId:     { type: String, default: 'career-settings', unique: true },
  positions: {
    type: Map,
    of: Boolean,
    default: () => new Map([
      ['Game Master',       true],
      ['Translator',        true],
      ['Customer Service',  true],
      ['Graphics Designer', true],
      ['Moderator',         true],
      ['Developer',         true],
    ]),
  },
});

export const CareerSettings = mongoose.models.CareerSettings
  || mongoose.model('CareerSettings', careerSettingsSchema);

/** Returns a plain object { 'Game Master': true, 'Translator': false, … } */
export async function getPositionSettings() {
  let doc = await CareerSettings.findOne({ docId: 'career-settings' });
  if (!doc) {
    doc = await CareerSettings.create({ docId: 'career-settings' });
  }
  return Object.fromEntries(doc.positions);
}

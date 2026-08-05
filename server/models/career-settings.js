import mongoose from 'mongoose';

// Positions stored as a plain nested object (Mixed) — avoids Map $set quirks.
const careerSettingsSchema = new mongoose.Schema({
  docId:     { type: String, default: 'career-settings', unique: true },
  positions: { type: mongoose.Schema.Types.Mixed, default: {} },
});

export const CareerSettings = mongoose.models.CareerSettings
  || mongoose.model('CareerSettings', careerSettingsSchema);

const ALL_POSITIONS = ['Game Master', 'Translator', 'Customer Service', 'Graphics Designer', 'Moderator', 'Developer'];

/** Returns a plain object { 'Game Master': true, 'Translator': false, … } */
export async function getPositionSettings() {
  let doc = await CareerSettings.findOne({ docId: 'career-settings' });
  if (!doc) {
    const defaults = Object.fromEntries(ALL_POSITIONS.map(p => [p, true]));
    doc = await CareerSettings.create({ docId: 'career-settings', positions: defaults });
  }
  // Back-fill any missing positions as open
  const positions = { ...doc.positions };
  let dirty = false;
  for (const p of ALL_POSITIONS) {
    if (!(p in positions)) { positions[p] = true; dirty = true; }
  }
  if (dirty) {
    await CareerSettings.updateOne({ docId: 'career-settings' }, { $set: { positions } });
  }
  return positions;
}

/** Toggle one position. Returns updated plain positions object. */
export async function setPositionAvailability(position, available) {
  const positions = await getPositionSettings();
  positions[position] = Boolean(available);
  // Use markModified pattern via replaceOne to avoid Mixed type caching
  await CareerSettings.replaceOne(
    { docId: 'career-settings' },
    { docId: 'career-settings', positions },
    { upsert: true },
  );
  return positions;
}

import mongoose from 'mongoose';

let _connected = false;

export async function connectMongoDB() {
  if (_connected) return;
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn('[MongoDB] MONGODB_URI not set — news MongoDB disabled');
    return;
  }
  try {
    await mongoose.connect(uri);
    _connected = true;
    console.log('[MongoDB] Connected');
  } catch (err) {
    console.error('[MongoDB] Connection error:', err.message);
  }
}

export function isMongoConnected() {
  return _connected;
}

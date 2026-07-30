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
  } catch (err) {
    throw err;
  }
}

export function isMongoConnected() {
  return _connected;
}

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env');
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    console.log('Using cached MongoDB connection');
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    console.log('Initializing new MongoDB connection...');
    
    mongoose.connection.on('connected', () => {
      console.log('MongoDB connected successfully');
    });

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
      // Reset the promise so we can try to connect again
      cached.promise = null;
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
      // Reset the promise so we can try to connect again
      cached.promise = null;
    });

    try {
      cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
        console.log('MongoDB connection established');
        return mongoose;
      });
    } catch (e) {
      console.error('Error during MongoDB connection setup:', e);
      cached.promise = null;
      throw e;
    }
  } else {
    console.log('Using existing connection promise');
  }

  try {
    cached.conn = await cached.promise;
    console.log('MongoDB connection ready');
  } catch (e) {
    console.error('Failed to resolve MongoDB connection:', e);
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB; 
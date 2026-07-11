import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod = null;

const connectDB = async (retries = 3) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      let dbUrl = process.env.MONGODB_URI;

      // In production, MONGODB_URI is mandatory
      if (!dbUrl && process.env.NODE_ENV === 'production') {
        console.error('FATAL: MONGODB_URI is not set. Cannot run in production without a real database.');
        process.exit(1);
      }

      // Use memory server only in development if MONGODB_URI is not provided
      if (!dbUrl) {
        console.warn('⚠️  WARNING: Using In-Memory MongoDB. Data will be lost on restart!');
        console.warn('⚠️  Set MONGODB_URI in .env for persistent data.');
        try {
          mongod = await MongoMemoryServer.create();
          dbUrl = mongod.getUri();
          console.log(`In-Memory MongoDB Server started at: ${dbUrl}`);
        } catch (err) {
          console.log('Failed to start In-Memory MongoDB server, trying local fallback:', err.message);
        }
      }

      const conn = await mongoose.connect(dbUrl || 'mongodb://127.0.0.1:27017/pickleball', {
        serverSelectionTimeoutMS: 10000, // 10 second timeout
      });
      console.log(`MongoDB Connected: ${conn.connection.host}`);
      return; // Success — exit the loop
    } catch (error) {
      console.error(`MongoDB connection attempt ${attempt}/${retries} failed: ${error.message}`);
      if (attempt < retries) {
        console.log(`Retrying in 5 seconds...`);
        await new Promise((resolve) => setTimeout(resolve, 5000));
      } else {
        console.error('All MongoDB connection attempts failed. Please check:');
        console.error('  1. Your internet connection');
        console.error('  2. MongoDB Atlas cluster status (may be paused)');
        console.error('  3. Network Access whitelist in Atlas dashboard');
        process.exit(1);
      }
    }
  }
};

export default connectDB;


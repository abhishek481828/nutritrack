const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  // Check if we already have a connection established or in progress
  const state = mongoose.connection.readyState;
  if (state === 1) {
    logger.info('MongoDB is already connected.');
    return;
  }
  if (state === 2) {
    logger.info('MongoDB is connecting...');
    return;
  }

  try {
    const opts = {
      bufferCommands: false,         // Disable mongoose buffering in serverless to fail fast
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    };
    await mongoose.connect(process.env.MONGO_URI, opts);
    logger.info('✅ MongoDB Connected Successfully');
  } catch (error) {
    logger.error(`MongoDB Connection Error: ${error.message}`, error);
    throw error;
  }
};

module.exports = connectDB;

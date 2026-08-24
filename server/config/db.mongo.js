const mongoose = require('mongoose');
const config = require('./env');

mongoose.set('bufferCommands', false);

let isConnected = false;

const connectMongoDB = async () => {
  if (isConnected || mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  try {
    const conn = await mongoose.connect(config.mongo.uri, {
      serverSelectionTimeoutMS: 2000,
      autoIndex: false,
    });
    isConnected = true;
    console.log(`[MongoDB] Connected successfully to: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.warn(`[MongoDB] Connection notice: ${error.message}`);
    return null;
  }
};

module.exports = {
  connectMongoDB,
  mongoose,
};

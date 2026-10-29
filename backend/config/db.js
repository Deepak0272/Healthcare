const mongoose = require('mongoose');

let mongoMemoryServerInstance = null;

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/healthtech';
    
    // Attempt standard connection first with 3 second serverSelectionTimeoutMS
    try {
      const conn = await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 2500,
      });
      console.log(`[MongoDB] Connected to database: ${conn.connection.host}/${conn.connection.name}`);
      return conn;
    } catch (primaryErr) {
      console.warn(`[MongoDB] Local/Specified MongoDB connection failed (${primaryErr.message}). Launching MongoMemoryServer for instant zero-config operation...`);
      
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongoMemoryServerInstance = await MongoMemoryServer.create({
        instance: {
          dbName: 'healthtech'
        }
      });
      const inMemoryUri = mongoMemoryServerInstance.getUri();
      console.log(`[MongoDB] In-Memory MongoDB Server initialized at: ${inMemoryUri}`);
      
      const conn = await mongoose.connect(inMemoryUri);
      console.log(`[MongoDB] Connected to In-Memory MongoDB successfully!`);
      return conn;
    }
  } catch (error) {
    console.error(`[MongoDB] Fatal connection error:`, error.message);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongoMemoryServerInstance) {
      await mongoMemoryServerInstance.stop();
    }
  } catch (err) {
    console.error('Error disconnecting database:', err.message);
  }
};

module.exports = { connectDB, disconnectDB };

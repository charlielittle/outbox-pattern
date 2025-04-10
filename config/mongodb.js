// First, let's set up our MongoDB connection and models

// config/mongodb.js
const mongoose = require('mongoose');
require('dotenv').config();
console.log( process.env.MONGODB_URI );

const connectMongoDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');
    return mongoose.connection;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

module.exports = { connectMongoDB };

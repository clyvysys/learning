// config/config.js

require('dotenv').config(); // Load .env into process.env

module.exports = {
  SECRET_KEY: process.env.JWT_SECRET || 'fallback-secret',
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/mydb',
  PORT: process.env.PORT || 5000
};

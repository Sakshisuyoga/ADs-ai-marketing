const { sequelize } = require('./sequelize');

// Test the connection
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully');
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    return false;
  }
}

// Initialize database and models
let isInitialized = false;

async function initializeDatabase() {
  if (isInitialized) {
    console.log('✅ Database already initialized');
    return true;
  }

  try {
    // Test connection first
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Database connection failed');
    }

    // Import models to register them with Sequelize
    require('../models/User');
    require('../models/Campaign');

    // Sync all models (use safe sync to prevent loops)
    await sequelize.sync({
      force: false,
      alter: false  // Disable alter to prevent table recreation loops
    });
    console.log('✅ Database synchronized successfully');

    // Seed sample data if SEED_SAMPLE_DATA is true or not explicitly set to false
    const shouldSeedData = process.env.SEED_SAMPLE_DATA !== 'false' &&
                          (process.env.NODE_ENV !== 'production' || process.env.SEED_SAMPLE_DATA === 'true');

    if (shouldSeedData) {
      const { seedSampleData } = require('../utils/seedData');
      await seedSampleData();
    }

    isInitialized = true;
    return true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

module.exports = {
  sequelize,
  testConnection,
  initializeDatabase
};

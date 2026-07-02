const logger = require('../utils/logger');

const validateEnv = () => {
  const required = ['MONGO_URI'];
  const missing = [];

  required.forEach((key) => {
    if (!process.env[key]) {
      missing.push(key);
    }
  });

  if (missing.length > 0) {
    logger.error(`❌ Critical Environment Variables Missing: ${missing.join(', ')}`);
    process.exit(1);
  }

  // Warn if JWT_SECRET is not configured or using default
  if (!process.env.JWT_SECRET) {
    logger.warn('⚠️  JWT_SECRET is not configured! Using default weak fallback secret. Change immediately in production.');
  } else if (process.env.JWT_SECRET === 'prod_jwt_secret_change_me_123' || process.env.JWT_SECRET.length < 16) {
    logger.warn('⚠️  JWT_SECRET is insecure! Ensure it is at least 16 characters and not using the default placeholder.');
  }

  logger.info('🛡️  Environment variables verified successfully.');
};

module.exports = { validateEnv };

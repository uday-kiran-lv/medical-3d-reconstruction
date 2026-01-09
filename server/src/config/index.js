import dotenv from 'dotenv'

// Load .env file in development
if (process.env.NODE_ENV !== 'production') {
  dotenv.config()
}

// Determine allowed origins based on environment
const getOrigins = () => {
  if (process.env.ALLOWED_ORIGINS) {
    return process.env.ALLOWED_ORIGINS.split(',')
  }
  
  // Default origins for development
  if (process.env.NODE_ENV !== 'production') {
    return ['http://localhost:3000', 'http://localhost:3009']
  }
  
  // Allow all origins in production if not specified
  return ['*']
}

export default {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/medical_3d_reconstruction',
  nodeEnv: process.env.NODE_ENV || 'development',
  allowedOrigins: getOrigins(),
  isVercel: process.env.VERCEL === '1'
}

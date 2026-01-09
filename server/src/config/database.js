import mongoose from 'mongoose'
import config from './index.js'

export const connectDB = async () => {
  try {
    await mongoose.connect(config.mongoUri)
    console.log('✅ MongoDB Connected Successfully')
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err)
    process.exit(1)
  }
}

export default connectDB

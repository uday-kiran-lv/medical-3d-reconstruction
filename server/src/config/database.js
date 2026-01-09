import mongoose from 'mongoose'
import config from './index.js'

// Connection state tracking
let connectionState = 'disconnected' // 'connecting', 'connected', 'disconnected', 'error'
let connectionPromise = null

export const connectDB = async () => {
  // Return existing connection attempt if already in progress
  if (connectionPromise && connectionState === 'connecting') {
    return connectionPromise
  }
  
  // Return success if already connected
  if (connectionState === 'connected' && mongoose.connection.readyState === 1) {
    return Promise.resolve()
  }
  
  // Start new connection
  connectionState = 'connecting'
  
  connectionPromise = (async () => {
    try {
      const mongoUri = config.mongoUri
      
      if (!mongoUri) {
        throw new Error('MONGODB_URI environment variable is not set')
      }
      
      // Connect with timeout
      const conn = await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 10000,
        connectTimeoutMS: 10000,
        maxPoolSize: 10,
      })
      
      connectionState = 'connected'
      console.log('✅ MongoDB Connected:', conn.connection.host)
      return true
    } catch (error) {
      connectionState = 'error'
      console.error('❌ MongoDB Connection Error:', error.message)
      
      // Don't exit process - let the app continue
      // Fail gracefully for Vercel serverless
      return false
    }
  })()
  
  return connectionPromise
}

// Graceful disconnection
export const disconnectDB = async () => {
  try {
    await mongoose.disconnect()
    connectionState = 'disconnected'
    console.log('✅ MongoDB Disconnected')
  } catch (error) {
    console.error('❌ MongoDB Disconnection Error:', error)
  }
}

// Get connection status
export const getConnectionStatus = () => {
  return {
    state: connectionState,
    ready: mongoose.connection.readyState === 1,
    connected: connectionState === 'connected'
  }
}

export default connectDB

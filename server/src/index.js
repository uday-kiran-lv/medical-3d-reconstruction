import express from 'express'
import cors from 'cors'
import config from './config/index.js'
import { connectDB } from './config/database.js'
import { imageRoutes, reconstructionRoutes } from './routes/index.js'
import { errorHandler, notFound } from './middleware/index.js'

const app = express()

// Track DB connection status
let dbConnected = false

// CORS configuration for cross-origin requests
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true)
    
    // Check if origin is in allowed list
    const allowedOrigins = config.allowedOrigins
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
}

// Middleware
app.use(cors(corsOptions))
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// Favicon request handler (silent 204)
app.get('/favicon.ico', (req, res) => {
  res.status(204).end()
})

// Initialize DB connection asynchronously (non-blocking)
let dbConnectionPromise = null

const initializeDB = async () => {
  if (dbConnectionPromise) {
    return dbConnectionPromise
  }
  
  if (dbConnected) {
    return Promise.resolve()
  }
  
  dbConnectionPromise = connectDB()
    .then(() => {
      dbConnected = true
      return true
    })
    .catch((err) => {
      console.error('DB connection failed:', err.message)
      dbConnected = false
      return false
    })
  
  return dbConnectionPromise
}

// Try to initialize DB on startup
initializeDB().catch(err => console.error('Initial DB connection attempt failed:', err.message))

// Routes
app.use('/api/images', imageRoutes)
app.use('/api/reconstruction', reconstructionRoutes)

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    await initializeDB()
    res.json({ 
      status: 'ok', 
      database: dbConnected ? 'connected' : 'connecting',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(503).json({ 
      status: 'degraded',
      database: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    })
  }
})

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Medical 3D Reconstruction API',
    version: '1.0.0',
    status: dbConnected ? 'ready' : 'initializing',
    endpoints: {
      health: '/api/health',
      images: '/api/images',
      reconstruction: '/api/reconstruction'
    }
  })
})

// Error handling
app.use(notFound)
app.use(errorHandler)

// Start server (only in non-serverless environment)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  const PORT = process.env.PORT || 5000
  app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`)
  })
}

// Export for Vercel serverless
export default app

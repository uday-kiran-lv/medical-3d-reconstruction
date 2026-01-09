import express from 'express'
import cors from 'cors'
import config from './config/index.js'
import { connectDB } from './config/database.js'
import { imageRoutes, reconstructionRoutes } from './routes/index.js'
import { errorHandler, notFound } from './middleware/index.js'

const app = express()

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

// Connect to MongoDB
connectDB()

// Routes
app.use('/api/images', imageRoutes)
app.use('/api/reconstruction', reconstructionRoutes)

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Medical 3D Reconstruction API',
    version: '1.0.0',
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
  app.listen(config.port, () => {
    console.log(`✅ Server running on http://localhost:${config.port}`)
  })
}

// Export for Vercel serverless
export default app

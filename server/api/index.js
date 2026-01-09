import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'

const app = express()

// CORS
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

app.use(express.json({ limit: '50mb' }))

// MongoDB connection caching for serverless
let cachedDb = null

const connectDB = async () => {
  if (cachedDb && mongoose.connection.readyState === 1) {
    return cachedDb
  }
  
  const uri = process.env.MONGODB_URI
  if (!uri) {
    console.error('MONGODB_URI not set')
    return null
  }
  
  try {
    const conn = await mongoose.connect(uri, {
      bufferCommands: false,
      maxPoolSize: 1,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 10000
    })
    cachedDb = conn
    console.log('MongoDB connected')
    return cachedDb
  } catch (err) {
    console.error('MongoDB error:', err.message)
    return null
  }
}

// Models inline to avoid import issues
const medicalImageSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  file_name: String,
  file_path: String,
  image_type: { type: String, enum: ['CT', 'MRI', 'X-ray', 'Ultrasound'] },
  format: { type: String, enum: ['DICOM', 'JPEG', 'PNG', 'NIFTI'] },
  file_size_mb: Number,
  upload_date: { type: Date, default: Date.now },
  status: { type: String, enum: ['uploaded', 'processing', 'completed', 'failed'], default: 'uploaded' }
})

const reconstructionSchema = new mongoose.Schema({
  image_id: { type: mongoose.Schema.Types.ObjectId, ref: 'MedicalImage' },
  model_type: String,
  mesh_path: String,
  texture_path: String,
  resolution: String,
  processing_time_seconds: Number,
  created_at: { type: Date, default: Date.now }
})

const MedicalImage = mongoose.models.MedicalImage || mongoose.model('MedicalImage', medicalImageSchema)
const ReconstructionResult = mongoose.models.ReconstructionResult || mongoose.model('ReconstructionResult', reconstructionSchema)

// Favicon
app.get('/favicon.ico', (req, res) => res.status(204).end())

// Health check
app.get('/api/health', async (req, res) => {
  const db = await connectDB()
  res.json({
    status: 'ok',
    database: db ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  })
})

// Root
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

// Upload image
app.post('/api/images/upload', async (req, res) => {
  try {
    await connectDB()
    const image = await MedicalImage.create({
      user_id: req.body.user_id,
      file_name: req.body.file_name,
      file_path: req.body.file_path,
      image_type: req.body.image_type,
      format: req.body.format,
      file_size_mb: req.body.file_size_mb
    })
    res.status(201).json(image)
  } catch (err) {
    console.error('Upload error:', err)
    res.status(500).json({ error: err.message })
  }
})

// Get image status
app.get('/api/images/status/:imageId', async (req, res) => {
  try {
    await connectDB()
    const image = await MedicalImage.findById(req.params.imageId).lean()
    if (!image) return res.status(404).json({ error: 'Image not found' })
    
    const reconstruction = await ReconstructionResult.findOne({ image_id: image._id }).lean()
    res.json({ image, reconstruction })
  } catch (err) {
    console.error('Status error:', err)
    res.status(500).json({ error: err.message })
  }
})

// Create reconstruction
app.post('/api/reconstruction/create', async (req, res) => {
  try {
    await connectDB()
    const result = await ReconstructionResult.create({
      image_id: req.body.image_id,
      model_type: req.body.model_type,
      mesh_path: req.body.mesh_path,
      texture_path: req.body.texture_path,
      resolution: req.body.resolution,
      processing_time_seconds: req.body.processing_time_seconds
    })
    res.status(201).json(result)
  } catch (err) {
    console.error('Reconstruction error:', err)
    res.status(500).json({ error: err.message })
  }
})

// Get reconstruction
app.get('/api/reconstruction/:id', async (req, res) => {
  try {
    await connectDB()
    const result = await ReconstructionResult.findById(req.params.id).lean()
    if (!result) return res.status(404).json({ error: 'Reconstruction not found' })
    res.json(result)
  } catch (err) {
    console.error('Get reconstruction error:', err)
    res.status(500).json({ error: err.message })
  }
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' })
})

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err)
  res.status(500).json({ error: err.message || 'Internal server error' })
})

export default app

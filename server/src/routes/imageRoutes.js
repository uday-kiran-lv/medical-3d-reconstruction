import express from 'express'
import { uploadImage, getImageStatus } from '../controllers/imageController.js'

const router = express.Router()

// POST /api/images/upload - Upload image metadata
router.post('/upload', uploadImage)

// GET /api/images/status/:imageId - Get image status
router.get('/status/:imageId', getImageStatus)

export default router

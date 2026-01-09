import express from 'express'
import { startProcessing, getReconstruction, generatePreview } from '../controllers/reconstructionController.js'

const router = express.Router()

// POST /api/reconstruction/start - Start processing
router.post('/start', startProcessing)

// POST /api/reconstruction/preview - Generate mesh preview without image
router.post('/preview', generatePreview)

// GET /api/reconstruction/:id - Get reconstruction result
router.get('/:id', getReconstruction)

export default router

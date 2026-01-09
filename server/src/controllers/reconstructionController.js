import { MedicalImage, ReconstructionResult } from '../models/index.js'
import { generateMesh, detectOrganType } from '../services/meshGenerator.js'

// Start processing an image
export const startProcessing = async (req, res) => {
  try {
    const { image_id, model_used = 'Standard CNN', parameters = {} } = req.body

    const image = await MedicalImage.findById(image_id)
    if (!image) return res.status(404).json({ error: 'Image not found' })

    // Mark image as processing
    image.status = 'processing'
    await image.save()

    // Create reconstruction record
    const reconstruction = await ReconstructionResult.create({
      image_id,
      model_used,
      output_file_path: '',
      output_preview_path: '',
      processing_time_sec: 0,
      accuracy_score: 0,
      mesh_data: null
    })

    // Get organ type from parameters or detect from image
    const organType = parameters.organType !== 'auto' 
      ? parameters.organType 
      : detectOrganType({
          fileName: image.file_name,
          image_type: image.image_type
        })

    // Simulate processing with realistic timing
    let elapsed = 0
    let currentProgress = 0
    const totalSteps = 8
    const stepDuration = 800 // ms between updates
    
    const progressStages = [
      { progress: 10, message: 'Loading image data...' },
      { progress: 25, message: 'Analyzing image features...' },
      { progress: 40, message: 'Detecting anatomical structures...' },
      { progress: 55, message: 'Generating mesh vertices...' },
      { progress: 70, message: 'Building 3D geometry...' },
      { progress: 85, message: 'Applying smoothing filters...' },
      { progress: 95, message: 'Optimizing mesh...' },
      { progress: 100, message: 'Reconstruction complete!' }
    ]

    let stepIndex = 0
    const interval = setInterval(async () => {
      if (stepIndex >= progressStages.length) {
        clearInterval(interval)
        return
      }

      elapsed += stepDuration / 1000
      const stage = progressStages[stepIndex]
      currentProgress = stage.progress
      
      // Calculate accuracy based on parameters
      const baseAccuracy = 85
      const detailBonus = (parameters.detail || 0.8) * 8
      const smoothingBonus = (parameters.smoothing || 0.7) * 5
      const accuracy = Math.min(99.5, baseAccuracy + detailBonus + smoothingBonus + (Math.random() * 2))

      if (currentProgress >= 100) {
        // Generate the actual mesh data
        const meshData = generateMesh(organType, parameters)
        
        await ReconstructionResult.findByIdAndUpdate(reconstruction._id, {
          $set: {
            processing_time_sec: Math.round(elapsed * 10) / 10,
            accuracy_score: Math.round(accuracy * 100) / 100,
            output_file_path: `/data/results/${reconstruction._id}.glb`,
            output_preview_path: `progress:100`,
            mesh_data: meshData
          }
        })

        // Update image status
        image.status = 'completed'
        await image.save()
        
        clearInterval(interval)
      } else {
        await ReconstructionResult.findByIdAndUpdate(reconstruction._id, {
          $set: {
            processing_time_sec: Math.round(elapsed * 10) / 10,
            accuracy_score: Math.round(accuracy * 100) / 100,
            output_preview_path: `progress:${currentProgress}`,
            status_message: stage.message
          }
        })
      }
      
      stepIndex++
    }, stepDuration)

    res.status(202).json({ reconstruction_id: reconstruction._id })
  } catch (error) {
    console.error('/start-processing error:', error)
    res.status(500).json({ error: error.message })
  }
}

// Generate mesh directly without image (for quick preview)
export const generatePreview = async (req, res) => {
  try {
    const { organType = 'thorax', parameters = {} } = req.body
    
    const meshData = generateMesh(organType, parameters)
    
    res.json({
      success: true,
      organType,
      meshData
    })
  } catch (error) {
    console.error('/generate-preview error:', error)
    res.status(500).json({ error: error.message })
  }
}

// Get reconstruction result by id
export const getReconstruction = async (req, res) => {
  try {
    const reconstruction = await ReconstructionResult.findById(req.params.id).lean()
    if (!reconstruction) return res.status(404).json({ error: 'Reconstruction not found' })
    res.json(reconstruction)
  } catch (error) {
    console.error('/reconstruction error:', error)
    res.status(500).json({ error: error.message })
  }
}

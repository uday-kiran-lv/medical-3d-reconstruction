import { MedicalImage, ReconstructionResult } from '../models/index.js'

// Upload image metadata
export const uploadImage = async (req, res) => {
  try {
    const image = await MedicalImage.create({
      user_id: req.body.user_id,
      file_name: req.body.file_name,
      file_path: req.body.file_path,
      image_type: req.body.image_type,
      format: req.body.format,
      file_size_mb: req.body.file_size_mb,
    })
    res.status(201).json(image)
  } catch (error) {
    console.error('/upload error:', error)
    res.status(500).json({ error: error.message })
  }
}

// Get image status with reconstruction result
export const getImageStatus = async (req, res) => {
  try {
    const image = await MedicalImage.findById(req.params.imageId).lean()
    if (!image) return res.status(404).json({ error: 'Image not found' })

    const reconstruction = await ReconstructionResult.findOne({ image_id: image._id }).lean()
    res.json({ image, reconstruction })
  } catch (error) {
    console.error('/status error:', error)
    res.status(500).json({ error: error.message })
  }
}

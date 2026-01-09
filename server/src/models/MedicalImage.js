import mongoose from 'mongoose'

const { Schema } = mongoose

const medicalImageSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  file_name: { type: String, required: true },
  file_path: { type: String, required: true },
  image_type: { type: String, enum: ['CT', 'MRI', 'X-ray', 'Ultrasound'], required: true },
  format: { type: String, enum: ['DICOM', 'JPEG', 'PNG', 'NIFTI'], required: true },
  file_size_mb: Number,
  upload_date: { type: Date, default: Date.now },
  status: { type: String, enum: ['uploaded', 'processing', 'completed', 'failed'], default: 'uploaded' }
})

export default mongoose.model('MedicalImage', medicalImageSchema)

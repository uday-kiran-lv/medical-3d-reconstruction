import mongoose from 'mongoose'

const { Schema } = mongoose

const reconstructionResultSchema = new Schema({
  image_id: { type: Schema.Types.ObjectId, ref: 'MedicalImage', required: true },
  model_used: { type: String, required: true },
  output_file_path: { type: String, required: true },
  output_preview_path: String,
  processing_time_sec: Number,
  accuracy_score: Number,
  generated_at: { type: Date, default: Date.now }
})

export default mongoose.model('ReconstructionResult', reconstructionResultSchema)

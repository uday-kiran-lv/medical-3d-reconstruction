import mongoose from 'mongoose'

const { Schema } = mongoose

const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  role: { type: String, enum: ['doctor', 'radiologist', 'admin'], default: 'doctor' },
  created_at: { type: Date, default: Date.now }
})

export default mongoose.model('User', userSchema)

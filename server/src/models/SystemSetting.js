import mongoose from 'mongoose'

const { Schema } = mongoose

const systemSettingSchema = new Schema({
  key: { type: String, required: true, unique: true },
  value: { type: String, required: true },
  updated_at: { type: Date, default: Date.now }
})

export default mongoose.model('SystemSetting', systemSettingSchema)

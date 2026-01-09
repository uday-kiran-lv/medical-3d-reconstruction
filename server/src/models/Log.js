import mongoose from 'mongoose'

const { Schema } = mongoose

const logSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true },
  details: String,
  timestamp: { type: Date, default: Date.now }
})

export default mongoose.model('Log', logSchema)

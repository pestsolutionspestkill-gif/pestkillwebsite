import mongoose from 'mongoose';
const serviceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  serviceType: { type: String, required: true },
  pestType: { type: String },
  city: { type: String },
  address: { type: String },
  preferredDate: { type: Date },
  description: { type: String },
  status: { type: String, enum: ['pending','confirmed','in-progress','completed','cancelled'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});
export default mongoose.model('Service', serviceSchema);
import mongoose from 'mongoose';
const complaintSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: String, required: true },
  description: { type: String, required: true },
  priority: { type: String, enum: ['low','medium','high'], default: 'medium' },
  status: { type: String, enum: ['open','in-progress','resolved','closed'], default: 'open' },
  createdAt: { type: Date, default: Date.now }
});
export default mongoose.model('Complaint', complaintSchema);
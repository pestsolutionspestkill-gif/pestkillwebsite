import mongoose from 'mongoose';
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  brand: { type: String, required: true },
  category: { type: String },
  formulation: { type: String },
  description: { type: String },
  price: { type: Number, required: true },
  mrp: { type: Number },
  packSize: { type: String },
  packUnit: { type: String },
  sku: { type: String, unique: true },
  stock: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});
productSchema.pre('save', function(next) {
  if (!this.slug) this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  next();
});
export default mongoose.model('Product', productSchema);
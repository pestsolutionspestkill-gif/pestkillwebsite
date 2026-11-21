import mongoose from 'mongoose';
const orderItemSchema = new mongoose.Schema({ productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }, name: String, quantity: Number, price: Number, total: Number });
const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  orderNumber: { type: String, required: true, unique: true },
  items: [orderItemSchema],
  subtotal: Number, tax: Number, shipping: Number, total: Number,
  shippingAddress: { name: String, phone: String, address: String, city: String },
  paymentStatus: { type: String, enum: ['pending','paid','failed'], default: 'pending' },
  orderStatus: { type: String, enum: ['pending','confirmed','processing','shipped','delivered'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});
export default mongoose.model('Order', orderSchema);
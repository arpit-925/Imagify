import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true,
    index: true,
  },
  razorpayOrderId: {
    type: String,
    required: true,
    unique: true,
  },
  razorpayPaymentId: {
    type: String,
    default: null,
    index: true,
  },
  razorpaySignature: {
    type: String,
    default: null,
  },
  plan: {
    type: String,
    enum: ['basic', 'advanced', 'business'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  credits: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['created', 'paid', 'failed'],
    default: 'created',
  },
}, { timestamps: true });

const paymentModel = mongoose.models.payment || mongoose.model('payment', paymentSchema);

export default paymentModel;
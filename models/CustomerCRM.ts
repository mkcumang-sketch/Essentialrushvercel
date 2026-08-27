import mongoose from 'mongoose';

const CustomerCRMSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  email: { type: String, required: true },
  phone: { type: String },
  walletBalance: { type: Number, default: 0 },
  loyaltyPoints: { type: Number, default: 0 },
  isVIP: { type: Boolean, default: false },
  totalSpent: { type: Number, default: 0 },
  fraudScore: { type: Number, default: 0 }, // AI Fraud detection
  notes: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.models.CustomerCRM as mongoose.Model<any>|| mongoose.model('CustomerCRM', CustomerCRMSchema);
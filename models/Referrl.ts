import mongoose, { Schema, Document, models } from 'mongoose';

export interface IReferral extends Document {
  referrerId: mongoose.Types.ObjectId; // Jisne invite kiya
  referredEmail: string;               // Jisko invite kiya
  referralCode: string;                // Code jo use hua
  status: 'PENDING' | 'COMPLETED';     // Signup ho gaya ya nahi
  rewardPoints: number;                // Kitne wallet points mile
  createdAt: Date;
}

const ReferralSchema = new Schema<IReferral>(
  {
    referrerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    referredEmail: { type: String, required: true, lowercase: true, trim: true },
    referralCode: { type: String, required: true, uppercase: true },
    status: { type: String, enum: ['PENDING', 'COMPLETED'], default: 'PENDING' },
    rewardPoints: { type: Number, default: 500 }, // Default points
  },
  { timestamps: true }
);

// Prevent Next.js from recompiling the model multiple times
const Referral = models.Referral as mongoose.Model<any>
 || mongoose.model<IReferral>('Referral', ReferralSchema);

export default Referral;
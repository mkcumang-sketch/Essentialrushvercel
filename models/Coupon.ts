import mongoose, { Document, Schema, Model } from 'mongoose';

// 🔧 NEW: Proper TypeScript interface
export interface ICoupon extends Document {
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minOrderValue: number;
  minOrder: number;
  maxDiscount: number | null;
  validFrom: Date;
  validUntil?: Date;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CouponSchema = new Schema<ICoupon>(
  {
    code: { 
      type: String, 
      required: true, 
      unique: true, 
      uppercase: true,
      trim: true,
      maxlength: 50
    },
    discountType: { 
      type: String, 
      enum: ['PERCENTAGE', 'FIXED'], 
      default: 'PERCENTAGE' 
    },
    discountValue: { 
      type: Number, 
      required: true,
      min: 0
    },
    minOrderValue: { 
      type: Number, 
      default: 0,
      min: 0
    },
    minOrder: {
      type: Number,
      default: 0,
      min: 0
    },
    maxDiscount: { 
      type: Number, 
      default: null 
    },
    validFrom: { 
      type: Date, 
      default: Date.now 
    },
    validUntil: {
      type: Date,
      default: null
    },
    usageLimit: { 
      type: Number, 
      default: 100,
      min: 0
    },
    usedCount: { 
      type: Number, 
      default: 0,
      min: 0
    },
    isActive: { 
      type: Boolean, 
      default: true 
    }
  }, 
  { timestamps: true }
);

// 🔧 Index for faster queries
CouponSchema.index({ isActive: 1, validUntil: 1 });

const Coupon: Model<ICoupon> =
  (mongoose.models.Coupon as Model<ICoupon>) ||
  mongoose.model<ICoupon>("Coupon", CouponSchema);

export { Coupon };
export default Coupon;
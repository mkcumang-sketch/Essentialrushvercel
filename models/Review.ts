import mongoose, { Document, Schema, Model } from 'mongoose';

// 🔧 NEW: Proper TypeScript interface
export interface IReview extends Document {
  product: mongoose.Types.ObjectId;
  userName: string;
  rating: number;
  comment: string;
  media?: string[];
  visibility: 'private' | 'public' | 'rejected';
  isAdminGenerated: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    product: { 
      type: Schema.Types.ObjectId, 
      ref: 'Product', 
      required: true 
    },
    userName: { 
      type: String, 
      required: true,
      trim: true,
      maxlength: 100
    },
    rating: { 
      type: Number, 
      required: true, 
      min: 1, 
      max: 5 
    },
    comment: { 
      type: String, 
      required: true,
      trim: true,
      maxlength: 1000
    },
    media: {
      type: [String],
      default: []
    },
    visibility: { 
      type: String, 
      enum: ['private', 'public', 'rejected'], 
      default: 'private' 
    },
    isAdminGenerated: { 
      type: Boolean, 
      default: false 
    }
  }, 
  { timestamps: true }
);

// 🔧 Index for faster queries
ReviewSchema.index({ product: 1, visibility: 1 });
ReviewSchema.index({ createdAt: -1 });

const Review: Model<IReview> =
  (mongoose.models.Review as Model<IReview>) ||
  mongoose.model<IReview>("Review", ReviewSchema);

export { Review };
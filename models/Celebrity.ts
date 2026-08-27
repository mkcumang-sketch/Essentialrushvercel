import mongoose, { Document, Schema, Model } from 'mongoose';

// 🔧 Proper TypeScript interface
export interface ICelebrity extends Document {
  name: string;
  title: string;
  imageUrl: string;
  img?: string; // Kept in interface so TS knows it exists as a virtual alias
  cloudinaryPublicId?: string;
  linkedWatches: mongoose.Types.ObjectId[];
  watch?: string;
  createdAt: Date;
  updatedAt: Date;
}

const celebritySchema = new Schema<ICelebrity>(
  {
    name: { 
      type: String, 
      required: true,
      trim: true,
      maxlength: 100
    },
    title: { 
      type: String, 
      default: "Global Ambassador",
      trim: true,
      maxlength: 200
    },
    // ✅ Apply the alias HERE so `img` acts as a shortcut to `imageUrl`
    imageUrl: { 
      type: String, 
      required: true,
      alias: 'img' 
    },
    // ❌ REMOVED the `img` field block entirely to prevent the collision
    cloudinaryPublicId: {
      type: String,
      default: null
    },
    linkedWatches: [{
      type: Schema.Types.ObjectId,
      ref: 'Product',
      default: []
    }],
    watch: {
      type: String,
      default: null
    }
  }, 
  { timestamps: true }
);

// 🔧 Index for faster queries
celebritySchema.index({ name: 1 });
celebritySchema.index({ createdAt: -1 });

const Celebrity: Model<ICelebrity> = mongoose.models.Celebrity as mongoose.Model<ICelebrity> || 
  mongoose.model<ICelebrity>('Celebrity', celebritySchema);

export { Celebrity };
export default Celebrity;
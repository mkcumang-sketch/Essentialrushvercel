import mongoose from "mongoose";
const heroSchema = new mongoose.Schema({
  heading: { type: String, required: true },
  subHeading: { type: String },
  imageUrl: { type: String, required: true },
  ctaText: { type: String, default: "Explore Collection" },
  ctaLink: { type: String, default: "/collection" },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });
export const Hero = mongoose.models.Hero as mongoose.Model<any>|| mongoose.model("Hero", heroSchema);
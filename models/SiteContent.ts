import mongoose from "mongoose";

const siteContentSchema = new mongoose.Schema({
  brands: [{ name: String, logo: String }],
  celebrities: [{ name: String, image: String, watchModel: String, story: String }],
  reviews: [{ name: String, comment: String, rating: Number, location: String }],
  about: {
    heroImage: String,
    heading: String,
    story: String,
    founderQuote: String,
    founderImage: String
  }
}, { timestamps: true });

export const SiteContent = mongoose.models.SiteContent as mongoose.Model<any>|| mongoose.model("SiteContent", siteContentSchema);
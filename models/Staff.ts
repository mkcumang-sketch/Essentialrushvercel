import mongoose from "mongoose";

const staffSchema = new mongoose.Schema({
  name: { type: String, required: true },
  refCode: { type: String, required: true, unique: true }, // e.g. "amit"
  visits: { type: Number, default: 0 }, // Kitne log aaye
  salesCount: { type: Number, default: 0 }, // Kitni watches biki
  totalRevenue: { type: Number, default: 0 }, // Kitne ka dhandha diya
}, { timestamps: true });

export const Staff = mongoose.models.Staff as mongoose.Model<any> || mongoose.model("Staff", staffSchema);
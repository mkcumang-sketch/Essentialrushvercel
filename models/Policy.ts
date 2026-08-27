import mongoose, { Schema, Document } from 'mongoose';

export interface IPolicy extends Document {
  title: string;
  slug: string;
  content: string;
  lastUpdated: Date;
}

const PolicySchema: Schema = new Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  content: { type: String, required: true },
  lastUpdated: { type: Date, default: Date.now },
}, { timestamps: true });

export const Policy = mongoose.models.Policy as mongoose.Model<any> || mongoose.model
('Policy', PolicySchema);


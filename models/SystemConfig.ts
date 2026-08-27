import mongoose from 'mongoose';

const SystemConfigSchema = new mongoose.Schema({
  heroSlides: [{
    type: { type: String, enum: ['video', 'image'], default: 'video' },
    url: { type: String, default: '' },
    heading: { type: String, default: '' }
  }],
  aboutConfig: {
    content: { type: String, default: '' },
    alignment: { type: String, default: 'center' },
    style: { type: String, default: 'luxury' }
  }
}, { timestamps: true });

export default mongoose.models.SystemConfig as mongoose.Model<any>|| mongoose.model('SystemConfig', SystemConfigSchema);
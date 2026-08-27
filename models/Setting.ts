import mongoose from 'mongoose';

const SettingsSchema = new mongoose.Schema({
  id: { type: String, default: 'global_config' },
  theme: {
    saleActive: { type: Boolean, default: false },
    saleName: { type: String, default: 'DIWALI DHAMAKA' },
    bannerText: { type: String, default: 'FLAT 20% OFF SITEWIDE' },
    primaryColor: { type: String, default: '#D4AF37' },
  },
  finance: {
    upiId: { type: String, default: '' },
    bankName: { type: String, default: '' },
    accNo: { type: String, default: '' },
    ifsc: { type: String, default: '' },
  },
  seo: {
    metaTitle: { type: String, default: 'Essential Rush | Curators of Time' },
    metaDesc: { type: String, default: 'Luxury Requisition and Timeless Assets.' },
    keywords: { type: String, default: 'watches, gadgets, luxury' },
  }
}, { timestamps: true });

export default mongoose.models.Settings as mongoose.Model<any>|| mongoose.model('Settings', SettingsSchema);
import mongoose from 'mongoose';

const cmsSchema = new mongoose.Schema({
    heroConfig: {
        title: { type: String, default: "Fine Horology" },
        subtitle: { type: String, default: "Uncompromising Excellence" },
        mediaType: { type: String, default: "IMAGE" }, // IMAGE or VIDEO
        mediaUrl: { type: String }, // Direct link or uploaded link
        cloudinaryPublicId: String
    },
    aboutConfig: {
        title: { type: String, default: "Our Heritage" },
        mediaType: { type: String, default: "IMAGE" },
        mediaUrl: { type: String },
        cloudinaryPublicId: String,
        content: String
    },
    uiConfig: { type: Object, default: {} },
    categories: { type: Array, default: [] },
    faqs: { type: Array, default: [] }
}, { timestamps: true, strict: false }); // strict:false helps if you have other dynamic data

const CmsConfig = mongoose.models.CmsConfig as mongoose.Model<any>|| mongoose.model('CmsConfig', cmsSchema);

export default CmsConfig;
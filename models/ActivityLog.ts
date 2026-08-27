import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
    action: { type: String, required: true },
    description: { type: String },
    userId: { type: String }, 
    createdAt: { type: Date, default: Date.now }
});

const ActivityLog = mongoose.models.ActivityLog as mongoose.Model<any>|| mongoose.model('ActivityLog', activityLogSchema);

export default ActivityLog;
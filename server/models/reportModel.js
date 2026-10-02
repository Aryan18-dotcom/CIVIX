import mongoose, { Schema } from "mongoose";

const StatusHistorySchema = new Schema({
    status: { 
        type: String, 
        enum: ['submitted', 'reviewed', 'updated', 'assigned', 'working_on_it', 'resolved'],
        required: true 
    },
    note: { type: String, default: '' },
    changedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: { createdAt: true, updatedAt: false } });

const ReportSchema = new Schema({
    reportId: { 
        type: String, 
        unique: true, 
        index: true 
    },
    userId: { 
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        required: true,
        index: true 
    },
    report_by_user: { 
        type: String, 
        required: true 
    },
    report_user_displayName: { 
        type: String, 
        required: true 
    },
    title: { 
        type: String, 
        required: true, 
        trim: true,
        maxlength: 120 
    },
    category: { 
        type: String, 
        required: true,
        enum: ["Road & Infrastructure", "Waste Management", "Water & Drainage", "Street Lighting", "Public Safety", "Public Property", "Other"] 
    },
    description: { 
        type: String, 
        required: true,
        maxlength: 1500 
    },
    location: {
        address: { type: String, required: true },
        coordinates: {
            type: { type: String, enum: ['Point'], default: 'Point' },
            coordinates: { type: [Number], required: true } // [Longitude, Latitude]
        }
    },
    images: [{
        url: { type: String, required: true },
        filename: { type: String, required: true }
    }],
    
    // Priority & Emergency Levels
    issuePriority: { type: Number, min: 1, max: 10, required: true },
    emergencyLevel: { type: Number, min: 1, max: 10, required: true },

    // Admin Overrides & Moderation
    updatedIssuePriority: { type: Number, min: 1, max: 10, default: null },
    updatedEmergency: { type: Number, min: 1, max: 10, default: null },
    updateReason: { type: String, default: '' }, // Reason required if admin changes priority/emergency
    
    status: { 
        type: String, 
        enum: ['submitted', 'reviewed', 'updated', 'assigned', 'working_on_it', 'resolved'],
        default: 'submitted',
        index: true 
    },
    blocked: { 
        type: Boolean, 
        default: false,
        index: true // Blocked/fake reports are excluded from carbon credits and leaderboards
    },
    blockReason: { type: String, default: '' },
    
    statusHistory: [StatusHistorySchema]

}, { timestamps: true });

// Geospatial index for radius/nearby queries on the map
ReportSchema.index({ "location.coordinates": "2dsphere" });

// Auto-generate a readable custom report ID prefix before saving
ReportSchema.pre('save', async function() {
    if (!this.reportId) {
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        this.reportId = `CVX-${randomNum}`;
    }
});

const ReportDB = mongoose.models.Report || mongoose.model('Report', ReportSchema);

export default ReportDB;
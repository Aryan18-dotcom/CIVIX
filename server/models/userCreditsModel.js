import mongoose, { Schema } from 'mongoose';

const CreditHistorySchema = new Schema({
    amount: { type: Number, required: true }, // positive for earned, negative for withdrawn/spent
    type: { type: String, enum: ['earned_report', 'withdrawn', 'bonus'], required: true },
    description: { type: String, required: true },
    referenceId: { type: Schema.Types.ObjectId, ref: 'Report' }, // Optional link to a report
}, { timestamps: { createdAt: true, updatedAt: false } });

const UserCreditsSchema = new Schema({
    userId: { 
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        required: true, 
        unique: true,
        index: true
    },
    username: { 
        type: String, 
        required: true, 
        trim: `true` 
    },
    credits: { 
        type: Number, 
        default: 50,
        min: [0, 'Credits cannot be negative'],
        index: true 
    },
    totalWithdrawn: {
        type: Number,
        default: 0
    },
    validReportsCount: { 
        type: Number, 
        default: 0,
        index: true // Used for leaderboard ranking by valid reports
    },
    history: [CreditHistorySchema]
}, { timestamps: true });

const UserCreditsDB = mongoose.models.UserCredits || mongoose.model('UserCredits', UserCreditsSchema);

export default UserCreditsDB;
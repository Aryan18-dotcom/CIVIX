import mongoose, { Schema } from 'mongoose';

const UserCreditsSchema = new Schema({
    userId: { 
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        required: true, 
        unique: true 
    },
    username: { 
        type: String, 
        required: true, 
        unique: true,
        trim: true 
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
    }
}, { timestamps: true });

const UserCreditsDB = mongoose.models.UserCredits || mongoose.model('UserCredits', UserCreditsSchema);

export default UserCreditsDB;
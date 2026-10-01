import mongoose, { Schema } from "mongoose";

const OtpSchema = new Schema({
    userId: { 
        type: Schema.Types.ObjectId, 
        ref: 'User', // Matches the name of your User model
        required: true 
    },
    email: { 
        type: String, 
        required: true 
    },
    otp: { 
        type: String, 
        required: true 
    },
    createdAt: { 
        type: Date, 
        default: Date.now, 
        expires: 300 // Auto-deletes after 5 minutes
    }
});

const OtpDB = mongoose.models.OTP || mongoose.model('OTP', OtpSchema);

export default OtpDB;
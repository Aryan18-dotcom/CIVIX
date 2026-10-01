import mongoose from "mongoose";
import UserCreditsDB from "./userCreditsModel.js";
import OtpDB from "./passwordResetOTPModel.js";

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    userType: { type: String, enum: ['user', 'admin'], default: 'user' },
    profilePicture: { type: String, default: '' },
}, { timestamps: true });

// FIXED: Removed 'next' and used standard async/await flow
UserSchema.pre('findOneAndDelete', async function () {
    // 'this' refers to the query object
    const userId = this.getQuery()._id;

    if (!userId) return;

    try {
        console.log(`Cascading delete initiated for User: ${userId}`);
        
        // Delete all related documents across collections in parallel
        await Promise.all([
            UserCreditsDB.deleteMany({ userId: userId }),
            OtpDB.deleteMany({ userId: userId }),
        ]);
        
        console.log(`Successfully cleared data for User: ${userId}`);
    } catch (err) {
        console.error(`Cascade delete failed: ${err.message}`);
        throw err; // Throwing inside async middleware is the correct way to pass errors
    }
});

const UserDB = mongoose.models.User || mongoose.model('User', UserSchema);

export default UserDB;
import UserDB from "../models/userModel.js";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer"
import OtpDB from "../models/passwordResetOTPModel.js";

export const UpdateUserProfile = async (req, res) => {
    try {
        const { username, email } = req.body;
        const userId = req.session.userId;

        if (!req.session.isLoggedIn || !userId) {
            return res.status(401).json({ message: 'Not authenticated' });
        }

        const user = await UserDB.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        // Check uniqueness conflict
        const conflict = await UserDB.findOne({
            _id: { $ne: userId },
            $or: [{ email: email.toLowerCase() }, { username }]
        });

        if (conflict) {
            return res.status(400).json({ 
                message: conflict.email === email.toLowerCase() ? "Email already taken" : "Username already taken" 
            });
        }

        user.username = username || user.username;
        user.email = email.toLowerCase() || user.email;

        await user.save();
        return res.status(200).json({ message: "Profile updated!", user: { username: user.username, email: user.email } });
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const sendOtpEmail = async (email, otp) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { 
            user: process.env.EMAIL_USER, 
            pass: process.env.EMAIL_PASS 
        }
    });

    await transporter.sendMail({
        from: '"Thumlify AI" <auth@thumlify.ai>',
        to: email,
        subject: "Your Security Code",
        html: `
            <div style="font-family: sans-serif; max-width: 400px; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
                <h2 style="color: #111; margin-bottom: 8px;">Verify your identity</h2>
                <p style="color: #666; font-size: 14px;">Use the code below to reset your password. This code expires in 5 minutes.</p>
                <div style="background: #fdf2f8; padding: 16px; text-align: center; border-radius: 8px; margin-top: 20px;">
                    <span style="font-size: 32px; font-weight: bold; color: #db2777; letter-spacing: 4px;">${otp}</span>
                </div>
            </div>`
    });
};

export const RequestPasswordResetOTP = async (req, res) => {
    try {
        const userId = req.session.userId;
        const user = await UserDB.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Save/Update OTP record. Updating createdAt resets the 5-min TTL timer.
        await OtpDB.findOneAndUpdate(
            { userId: user._id },
            { otp, email: user.email, createdAt: new Date() },
            { upsert: true, new: true }
        );

        await sendOtpEmail(user.email, otp);

        return res.status(200).json({ message: "OTP sent to your email" });
    } catch (error) {
        if (!res.headersSent) {
            return res.status(500).json({ message: "Failed to send OTP", error: error.message });
        }
    }
};

// 2. Resend OTP (Logic remains same as Request but provides clearer UX)
export const ResendOTP = async (req, res) => {
    try {
        const userId = req.session.userId;
        const user = await UserDB.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        const newOtp = Math.floor(100000 + Math.random() * 900000).toString();

        await OtpDB.findOneAndUpdate(
            { userId: user._id },
            { otp: newOtp, email: user.email, createdAt: new Date() },
            { upsert: true }
        );

        await sendOtpEmail(user.email, newOtp);

        return res.status(200).json({ message: "A fresh OTP has been sent" });
    } catch (error) {
        if (!res.headersSent) {
            return res.status(500).json({ message: "Resend failed", error: error.message });
        }
    }
};

// 3. Verify OTP and Change Password
export const VerifyOTPAndUpdatePassword = async (req, res) => {
    try {
        const { otp, newPassword } = req.body;
        const userId = req.session.userId;

        if (!otp || !newPassword) {
            return res.status(400).json({ message: "OTP and new password are required" });
        }

        // Search for the valid OTP record
        const otpRecord = await OtpDB.findOne({ 
            userId, 
            otp: otp.toString().trim() 
        });

        if (!otpRecord) {
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }

        // Update User
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        const updatedUser = await UserDB.findByIdAndUpdate(userId, {
            password: hashedPassword
        });

        if (!updatedUser) return res.status(404).json({ message: "User not found" });

        // Delete OTP immediately after successful use
        await OtpDB.deleteOne({ _id: otpRecord._id });

        return res.status(200).json({ message: "Password updated successfully" });

    } catch (error) {
        if (!res.headersSent) {
            return res.status(500).json({ message: "Update failed", error: error.message });
        }
    }
};

export const DeleteAccount = async (req, res) => {
    try {
        const userId = req.session.userId;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const deletedUser = await UserDB.findByIdAndDelete(userId);

        if (!deletedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        req.session.destroy((err) => {
            if (err) throw err;
            res.clearCookie('connect.sid');
            return res.status(200).json({ message: "Account and all associated data deleted successfully" });
        });

    } catch (err) {
        if (!res.headersSent) {
            return res.status(500).json({ message: `Deletion failed: ${err.message}` });
        }
    }
};

export const ForgotPasswordRequest = async (req, res) => {
    try {
        const { email } = req.body;
        console.log("Forgot Password Request Received for Email:", email);

        if (!email) {
            return res.status(400).json({ success: false, message: "Email is required." });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // 1. Check if user exists
        const user = await UserDB.findOne({ email: normalizedEmail });

        // SECURITY STANDARD: Return generic success message even if user doesn't exist
        // to prevent user enumeration attacks.
        if (!user) {
            return res.status(200).json({ 
                success: true, 
                message: "If an account with that email exists, a password reset code has been sent." 
            });
        }

        // 2. Generate secure 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // 3. Upsert OTP record tied to user's ID and email (resets TTL timer)
        await OtpDB.findOneAndUpdate(
            { userId: user._id },
            { 
                otp, 
                email: user.email, 
                createdAt: new Date() 
            },
            { upsert: true, new: true }
        );

        // 4. Dispatch email asynchronously or via helper
        await sendOtpEmail(user.email, otp);

        return res.status(200).json({ 
            success: true, 
            message: "If an account with that email exists, a password reset code has been sent." 
        });

    } catch (error) {
        console.error("Forgot Password Request Error:", error);
        return res.status(500).json({ success: false, message: "Internal server error. Please try again later." });
    }
};

export const ForgotPasswordVerifyAndReset = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        if (!email || !otp || !newPassword) {
            return res.status(400).json({ success: false, message: "All fields (email, otp, newPassword) are required." });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({ success: false, message: "Password must be at least 8 characters long." });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // 1. Find user
        const user = await UserDB.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid or expired reset session." });
        }

        // 2. Validate OTP record
        const otpRecord = await OtpDB.findOne({ 
            userId: user._id, 
            otp: otp.toString().trim() 
        });

        if (!otpRecord) {
            return res.status(400).json({ success: false, message: "Invalid or expired verification code." });
        }

        // 3. Hash new password securely
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // 4. Update user password
        user.password = hashedPassword;
        await user.save();

        // 5. Invalidate/Delete OTP immediately after single use
        await OtpDB.deleteOne({ _id: otpRecord._id });

        return res.status(200).json({ 
            success: true, 
            message: "Password reset successful. You can now log in with your new password." 
        });

    } catch (error) {
        console.error("Password Reset Verification Error:", error);
        return res.status(500).json({ success: false, message: "Internal server error. Password reset failed." });
    }
};
import UserDB from "../models/userModel.js";
import UserCreditsDB from "../models/userCreditsModel.js";
import bcrypt from "bcrypt";
import OtpDB from "../models/passwordResetOTPModel.js";
import { sendOtpEmail } from "./manageAccountControllers.js";

export const RequestRegistrationOTP = async (req, res) => {
    try {
        const { username, email } = req.body;

        const existingUser = await UserDB.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ message: 'Username or Email already taken' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        await OtpDB.findOneAndUpdate(
            { email },
            { otp, createdAt: new Date() },
            { upsert: true, new: true }
        );

        await sendOtpEmail(email, otp);

        return res.status(200).json({ message: "Verification code sent to your email" });
    } catch (error) {
        return res.status(500).json({ message: "Error sending OTP", error: error.message });
    }
};

export const VerifyAndRegister = async (req, res) => {
    try {
        const { username, email, password, otp } = req.body;

        const otpRecord = await OtpDB.findOne({ email, otp });
        if (!otpRecord) {
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }

        const existingUser = await UserDB.findOne({ $or: [{ email }, { username }] });
        if (existingUser) return res.status(400).json({ message: 'User already exists' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new UserDB({ username, email, password: hashedPassword });
        await newUser.save();

        // Give 20 credits free signup bonus with transaction history log
        const userCredits = new UserCreditsDB({
            userId: newUser._id,
            username: newUser.username,
            credits: 20,
            totalWithdrawn: 0,
            validReportsCount: 0,
            history: [{
                amount: 20,
                type: 'bonus',
                description: 'Welcome bonus for registering on CIVIX'
            }]
        });
        await userCredits.save();

        await OtpDB.deleteOne({ _id: otpRecord._id });
        
        req.session.isLoggedIn = true;
        req.session.userId = (newUser._id).toString();

        return res.status(201).json({
            message: 'User registered successfully',
            user: { id: newUser._id, username: newUser.username, email: newUser.email }
        });

    } catch (error) {
        return res.status(500).json({ message: "Registration failed", error: error.message });
    }
};

export const ResendOTP = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: "Email is required to resend OTP" });
        }

        const newOtp = Math.floor(100000 + Math.random() * 900000).toString();

        await OtpDB.findOneAndUpdate(
            { email: email.toLowerCase() },
            { otp: newOtp, createdAt: new Date() },
            { upsert: true, new: true }
        );

        await sendOtpEmail(email, newOtp);

        return res.status(200).json({ message: "A fresh OTP has been sent to your email" });
    } catch (error) {
        console.error("Resend OTP Error:", error);
        if (!res.headersSent) {
            return res.status(500).json({ message: "Failed to resend OTP", error: error.message });
        }
    }
};

export const RegisterUser = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        const existingUser = await UserDB.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const HashedPassword = await bcrypt.hash(password, salt);

        const displayName = email.split('@')[0]; // Default display name from email prefix

        const newUser = new UserDB({ username, email, password: HashedPassword, displayName });
        await newUser.save();

        const userCredits = new UserCreditsDB({
            userId: newUser._id,
            username: newUser.username,
            credits: 20,
            totalWithdrawn: 0,
            validReportsCount: 0,
            history: [{
                amount: 20,
                type: 'bonus',
                description: 'Welcome bonus for registering on CIVIX'
            }]
        });
        await userCredits.save();

        req.session.isLoggedIn = true;
        req.session.userId = newUser._id.toString();

        return res.status(201).json({
            message: 'User registered successfully',
            user: { id: newUser._id, username: newUser.username, email: newUser.email }
        });
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const LoginUser = async (req, res) => {
    try {
        const { userId, password } = req.body;
        const user = await UserDB.findOne({ $or: [{ email: userId }, { username: userId }] });

        if (!user) {
            return res.status(400).json({ message: 'Invalid username or password' });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(400).json({ message: 'Invalid username or password' });
        }

        req.session.isLoggedIn = true;
        req.session.userId = user._id.toString();

        if(user.userType === 'admin') {
            req.session.isAdmin = true;
            return res.status(200).json({
                message: 'Admin login successful',
                user: { id: user._id, username: user.username, email: user.email, userType: user.userType },
                isAdmin: true
            });
        }

        return res.status(200).json({
            message: 'Login successful',
            user: { id: user._id, username: user.username, email: user.email }
        });
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const LogoutUser = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: 'Logout failed', error: err });
        }
        res.clearCookie('connect.sid');
        return res.status(200).json({ success: true, message: 'Logout successful' });
    });
};

export const GetCurrentUser = async (req, res) => {
    try {
        if (!req.session.isLoggedIn || !req.session.userId) {
            return res.status(401).json({ message: 'Not authenticated' });
        }

        const user = await UserDB.findById(req.session.userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.status(200).json({ user });
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};
import UserDB from "../models/userModel.js";
import UserCreditsDB from "../models/userCreditsModel.js";
import bcrypt from "bcrypt";
import OtpDB from "../models/passwordResetOTPModel.js";
import { sendOtpEmail } from "./manageAccountControllers.js";

export const RequestRegistrationOTP = async (req, res) => {
    try {
        const { username, email } = req.body;

        // 1. Check if user already exists
        const existingUser = await UserDB.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ message: 'Username or Email already taken' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // 2. Upsert OTP record (using email as the identifier since userId doesn't exist yet)
        // We use a temporary ID or a specific field for registration OTPs
        await OtpDB.findOneAndUpdate(
            { email },
            { otp, createdAt: new Date() },
            { upsert: true, new: true }
        );

        // 3. Send Email (using the helper we built earlier)
        await sendOtpEmail(email, otp);

        return res.status(200).json({ message: "Verification code sent to your email" });
    } catch (error) {
        return res.status(500).json({ message: "Error sending OTP", error: error.message });
    }
};

export const VerifyAndRegister = async (req, res) => {
    try {
        const { username, email, password, otp } = req.body;

        // 1. Verify OTP
        const otpRecord = await OtpDB.findOne({ email, otp });
        if (!otpRecord) {
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }

        // 2. Double check availability (safety for race conditions)
        const existingUser = await UserDB.findOne({ $or: [{ email }, { username }] });
        if (existingUser) return res.status(400).json({ message: 'User already exists' });

        // 3. Hash Password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 4. Create User
        const newUser = new UserDB({ username, email, password: hashedPassword });
        await newUser.save();

        // 5. Create Credits (Automatically triggers via logic)
        const userCredits = new UserCreditsDB({
            userId: newUser._id,
            username: newUser.username,
            credits: 50
        });
        await userCredits.save();

        // 6. Cleanup OTP & Set Session
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
        const { email } = req.body; // Logic should rely on email, not session ID

        if (!email) {
            return res.status(400).json({ message: "Email is required to resend OTP" });
        }

        // Generate a fresh 6-digit OTP
        const newOtp = Math.floor(100000 + Math.random() * 900000).toString();

        // Find and update based on email. 
        // We use email as the unique identifier because userId might not exist yet during signup.
        await OtpDB.findOneAndUpdate(
            { email: email.toLowerCase() },
            { 
                otp: newOtp, 
                createdAt: new Date() 
            },
            { upsert: true, new: true }
        );

        // Send the email
        await sendOtpEmail(email, newOtp);

        return res.status(200).json({ message: "A fresh OTP has been sent to your email" });

    } catch (error) {
        console.error("Resend OTP Error:", error);
        if (!res.headersSent) {
            return res.status(500).json({ message: "Failed to resend OTP", error: error.message });
        }
    }
};

// Register User
export const RegisterUser = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // find user by email or username
        const existingUser = await UserDB.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Encrypt password before saving (hashing can be added here)
        const salt = await bcrypt.genSalt(10);
        const HashedPassword = await bcrypt.hash(password, salt);

        const newUser = new UserDB({ username, email, password: HashedPassword });
        await newUser.save();

        // Create UserCredits entry automatically
        const userCredits = new UserCreditsDB({
            userId: newUser._id,
            username: newUser.username,
            credits: 10, 
            totalWithdrawn: 0
        });
        await userCredits.save();

        // set the session for the new user
        req.session.isLoggedIn = true;
        req.session.userId = newUser._id.toString();

        return res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: newUser._id,
                username: newUser.username,
                email: newUser.email,
            }
        });
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error });
    }
};

// Login User
export const LoginUser = async (req, res) => {
    try {
        const { userId, password } = req.body;
        const user = await UserDB.findOne({ $or: [{ email: userId }, { username: userId }] });
        // const user = await UserDB.findOne({ username: userId });

        if (!user) {
            return res.status(400).json({ message: 'Invalid username or password' });
        }

        // Checking the hasshed passeword
        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(400).json({ message: 'Invalid username or password' });
        }

        // set the session for the logged-in user
        req.session.isLoggedIn = true;
        req.session.userId = user._id.toString();

        return res.status(200).json({
            message: 'Login successful',
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });
    }
    catch (error) {
        return res.status(500).json({ message: 'Server error', error });
    }
};


// Logout User
export const LogoutUser = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: 'Logout failed', error: err });
        }
        res.clearCookie('connect.sid');
        return res.status(200).json({ success: true, message: 'Logout successful' });
    });
};

// Get Current User
export const GetCurrentUser = async (req, res) => {
    try {
        // Check if user is authenticated
        if (!req.session.isLoggedIn || !req.session.userId) {
            return res.status(401).json({ message: 'Not authenticated' });
        }

        // Get user details excluding password
        const user = await UserDB.findById(req.session.userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.status(200).json({ user });
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error });
    }
};
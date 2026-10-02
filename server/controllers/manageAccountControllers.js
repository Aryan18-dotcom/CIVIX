import UserDB from "../models/userModel.js";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer"
import OtpDB from "../models/passwordResetOTPModel.js";

export const UpdateUserProfile = async (req, res) => {
    try {
        const { displayName } = req.body;
        const userId = req.session.userId;

        if (!req.session.isLoggedIn || !userId) {
            return res.status(401).json({ message: 'Not authenticated' });
        }

        const user = await UserDB.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        user.displayName = displayName || user.displayName;

        await user.save();
        return res.status(200).json({ message: "Profile updated!", user: { displayName: user.displayName } });
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const sendOtpEmail = async (email, otp) => {

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const expiryMinutes = 5;

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">

        <title>CIVIX — Security Verification</title>
    </head>

    <body style="
        margin:0;
        padding:0;
        background-color:#080D12;
        font-family:Arial,Helvetica,sans-serif;
        color:#F4F5EF;
    ">

        <table width="100%" cellpadding="0" cellspacing="0"
            style="background-color:#080D12;padding:35px 12px;">

            <tr>
                <td align="center">

                    <table width="100%" cellpadding="0" cellspacing="0"
                        style="
                            max-width:520px;
                            background-color:#101827;
                            border:1px solid #26332D;
                            border-radius:16px;
                            overflow:hidden;
                        ">

                        <!-- BRAND HEADER -->
                        <tr>
                            <td align="center" style="padding:32px 20px 26px;">

                                <div style="
                                    font-size:35px;
                                    font-weight:800;
                                    letter-spacing:7px;
                                    color:#F4F5EF;
                                ">
                                    CIVI<span style="color:#C7F36B;">X</span>
                                </div>

                                <p style="
                                    margin:9px 0 0;
                                    font-size:10px;
                                    letter-spacing:4px;
                                    color:#A0A8A5;
                                ">
                                    THE CITY THAT LISTENS
                                </p>

                            </td>
                        </tr>

                        <!-- LIME DIVIDER -->
                        <tr>
                            <td style="
                                height:2px;
                                background-color:#C7F36B;
                                font-size:0;
                            ">&nbsp;</td>
                        </tr>

                        <!-- MAIN CONTENT -->
                        <tr>
                            <td style="padding:35px 28px 30px;">

                                <!-- SECURITY ICON -->
                                <div style="
                                    width:52px;
                                    height:52px;
                                    line-height:52px;
                                    text-align:center;
                                    border-radius:14px;
                                    background-color:#26351F;
                                    color:#C7F36B;
                                    font-size:25px;
                                    margin-bottom:22px;
                                ">
                                    &#128274;
                                </div>

                                <h1 style="
                                    margin:0 0 12px;
                                    font-size:27px;
                                    line-height:1.3;
                                    color:#F4F5EF;
                                ">
                                    Verify your identity.
                                </h1>

                                <p style="
                                    margin:0;
                                    font-size:15px;
                                    line-height:1.8;
                                    color:#A0A8A5;
                                ">
                                    We received a request to verify your
                                    CIVIX account. Use the secure
                                    verification code below to continue.
                                </p>

                                <!-- OTP CARD -->
                                <table width="100%" cellpadding="0" cellspacing="0"
                                    style="
                                        margin-top:28px;
                                        background-color:#080D12;
                                        border:1px solid #344331;
                                        border-radius:12px;
                                    ">

                                    <tr>
                                        <td align="center" style="padding:25px 15px;">

                                            <p style="
                                                margin:0 0 15px;
                                                font-size:11px;
                                                font-weight:bold;
                                                letter-spacing:3px;
                                                color:#A0A8A5;
                                            ">
                                                YOUR VERIFICATION CODE
                                            </p>

                                            <div style="
                                                display:inline-block;
                                                padding:16px 22px;
                                                background-color:#17221B;
                                                border:1px solid #425533;
                                                border-radius:9px;
                                                font-family:monospace;
                                                font-size:36px;
                                                font-weight:bold;
                                                letter-spacing:9px;
                                                color:#C7F36B;
                                                user-select:all;
                                                -webkit-user-select:all;
                                            ">
                                                ${String(otp).replace(/[&<>"']/g, "")}
                                            </div>

                                            <p style="
                                                margin:18px 0 0;
                                                font-size:12px;
                                                color:#A0A8A5;
                                            ">
                                                Select and copy your code to continue.
                                            </p>

                                        </td>
                                    </tr>
                                </table>

                                <!-- EXPIRY INFO -->
                                <table width="100%" cellpadding="0" cellspacing="0"
                                    style="
                                        margin-top:22px;
                                        background-color:#25251B;
                                        border:1px solid #4B472A;
                                        border-radius:9px;
                                    ">

                                    <tr>
                                        <td style="padding:17px;">

                                            <p style="
                                                margin:0;
                                                font-size:14px;
                                                font-weight:bold;
                                                color:#C7F36B;
                                            ">
                                                &#9201; Expires in ${expiryMinutes} minutes
                                            </p>

                                            <p style="
                                                margin:8px 0 0;
                                                font-size:13px;
                                                line-height:1.7;
                                                color:#C7C6B5;
                                            ">
                                                This OTP is valid for only
                                                ${expiryMinutes} minutes from
                                                the time it was generated.
                                                After that, you will need
                                                to request a new code.
                                            </p>

                                        </td>
                                    </tr>
                                </table>

                                <!-- SECURITY NOTICE -->
                                <h3 style="
                                    margin:28px 0 10px;
                                    font-size:14px;
                                    color:#F4F5EF;
                                ">
                                    Important security notice
                                </h3>

                                <ul style="
                                    margin:0;
                                    padding-left:20px;
                                    font-size:13px;
                                    line-height:2;
                                    color:#A0A8A5;
                                ">
                                    <li>Never share this code with anyone.</li>
                                    <li>CIVIX will never ask you to disclose your OTP.</li>
                                    <li>If you did not request this code, simply ignore this email.</li>
                                </ul>

                                <p style="
                                    margin:28px 0 0;
                                    font-size:14px;
                                    line-height:1.8;
                                    color:#A0A8A5;
                                ">
                                    Keeping your account secure helps us
                                    build a safer and more connected city.
                                </p>

                                <p style="
                                    margin:20px 0 0;
                                    font-size:15px;
                                    font-weight:bold;
                                    color:#C7F36B;
                                ">
                                    — Team CIVIX
                                </p>

                            </td>
                        </tr>

                        <!-- FOOTER -->
                        <tr>
                            <td align="center" style="
                                padding:25px 20px;
                                background-color:#080D12;
                                border-top:1px solid #26332D;
                            ">

                                <p style="
                                    margin:0;
                                    font-size:12px;
                                    color:#A0A8A5;
                                ">
                                    SEE IT · REPORT IT · CREATE CHANGE
                                </p>

                                <p style="
                                    margin:15px 0 0;
                                    font-size:11px;
                                    color:#66716D;
                                    line-height:1.7;
                                ">
                                    This is an automated security email.
                                    Please do not reply.
                                </p>

                                <p style="
                                    margin:12px 0 0;
                                    font-size:11px;
                                    color:#66716D;
                                ">
                                    © ${new Date().getFullYear()} CIVIX
                                </p>

                            </td>
                        </tr>

                    </table>

                </td>
            </tr>
        </table>

    </body>
    </html>
    `;

    const text = `
CIVIX — THE CITY THAT LISTENS

Verify your identity.

Your CIVIX verification code is:

${otp}

EXPIRY:
This OTP is valid for ${expiryMinutes} minutes from the time it was generated.

SECURITY:
- Never share this code with anyone.
- CIVIX will never ask you to disclose your OTP.
- If you did not request this code, ignore this email.

— Team CIVIX

SEE IT · REPORT IT · CREATE CHANGE
`;

    const info = await transporter.sendMail({
        from: `"CIVIX — The City That Listens" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `${otp} is your CIVIX verification code`,
        text,
        html
    });

    return info;
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
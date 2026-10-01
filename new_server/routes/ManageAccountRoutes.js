import express from "express";
import isAuthenticated from "../middlewares/Auth.js";
import { 
    DeleteAccount,
    ForgotPasswordRequest,
    ForgotPasswordVerifyAndReset,
    RequestPasswordResetOTP, 
    ResendOTP, 
    UpdateUserProfile, 
    VerifyOTPAndUpdatePassword 
} from "../controllers/manageAccountControllers.js";

const ManageAccountRouter = express.Router();

// Profile Management
ManageAccountRouter.put('/update-profile', isAuthenticated, UpdateUserProfile);

// OTP & Password Management
ManageAccountRouter.post('/request-otp', isAuthenticated, RequestPasswordResetOTP);
ManageAccountRouter.post('/resend-otp', isAuthenticated, ResendOTP); // New Route added
ManageAccountRouter.post('/verify-otp', isAuthenticated, VerifyOTPAndUpdatePassword);
ManageAccountRouter.delete('/delete-account', isAuthenticated, DeleteAccount);
ManageAccountRouter.post('/forgot-password/request-otp', ForgotPasswordRequest);
ManageAccountRouter.post('/forgot-password/verify-otp', ForgotPasswordVerifyAndReset);

export default ManageAccountRouter;
import express from "express";
import { RegisterUser, LoginUser, GetCurrentUser, LogoutUser, RequestRegistrationOTP, VerifyAndRegister, ResendOTP } from "../controllers/AuthController.js";
import {isAuthenticated} from "../middlewares/Auth.js";

const AuthRouter = express.Router();


// Register Route
AuthRouter.post('/register', RegisterUser);
AuthRouter.post('/login', LoginUser);
AuthRouter.get('/current-user', isAuthenticated, GetCurrentUser);
AuthRouter.post('/logout', isAuthenticated, LogoutUser);
AuthRouter.post('/register/request-otp', RequestRegistrationOTP);
AuthRouter.post('/register/verify', VerifyAndRegister);
AuthRouter.post('/register/resend-otp', ResendOTP);

export default AuthRouter;

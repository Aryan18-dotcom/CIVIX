import express from "express";
import {isAuthenticated} from "../middlewares/Auth.js";
import { GetDashboard } from "../controllers/DashboardController.js";
const router = express.Router();
router.get("/", isAuthenticated, GetDashboard); // Single dashboard GET payload
export default router;

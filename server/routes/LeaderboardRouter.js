import express from "express";
import {isAuthenticated} from "../middlewares/Auth.js";
import { GetLeaderboard } from "../controllers/LeaderboardController.js";
const router = express.Router();
router.get("/", isAuthenticated, GetLeaderboard);
export default router;

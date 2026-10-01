import express from "express";
import isAuthenticated from "../middlewares/Auth.js";
import { GetMyCarbon, GetCarbonHistory } from "../controllers/CarbonController.js";
const router = express.Router();
router.get("/me", isAuthenticated, GetMyCarbon);
router.get("/history", isAuthenticated, GetCarbonHistory);
export default router;

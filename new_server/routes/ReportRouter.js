import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import isAuthenticated from "../middlewares/Auth.js";
import { CreateReport, GetMyReports, GetNearbyReports, GetReportById, UpdateReportStatus } from "../controllers/ReportController.js";

const router = express.Router();
const uploadDir = path.resolve("uploads/reports");
fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${Math.round(Math.random()*1e9)}${path.extname(file.originalname).toLowerCase()}`)
});
const upload = multer({
  storage, limits: { files: 6, fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype))
});
router.post("/", isAuthenticated, upload.array("photos", 6), CreateReport);
router.get("/my", isAuthenticated, GetMyReports);
router.get("/nearby", isAuthenticated, GetNearbyReports);
router.get("/:id", isAuthenticated, GetReportById);
router.patch("/:id/status", isAuthenticated, UpdateReportStatus);
export default router;

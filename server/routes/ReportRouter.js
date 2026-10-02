import express from "express";
import multer from "multer";
import { isAdmin, isAuthenticated } from "../middlewares/Auth.js";
import { CreateReport, GetMyReports, GetNearbyReports, GetReportById, UpdateReportStatus } from "../controllers/ReportController.js";
import { uploadToCloudinary } from "../middlewares/uploadToCloudinary.js";

const router = express.Router();

// Use memory storage to process buffers for Cloudinary upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { files: 6, fileSize: 5 * 1024 * 1024 }, // Max 5MB per file
  fileFilter: (_req, file, cb) => cb(null, ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype))
});

router.post("/", isAuthenticated, upload.array("photos", 6), uploadToCloudinary, CreateReport);
router.get("/my", isAuthenticated, GetMyReports);
router.get("/nearby", isAuthenticated, GetNearbyReports);
router.get("/:id", isAuthenticated, GetReportById);
router.patch("/:id/update", isAdmin, UpdateReportStatus);

export default router;
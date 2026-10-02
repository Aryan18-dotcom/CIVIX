import express from "express";
import { isAuthenticated, isAdmin } from "../middlewares/Auth.js";
import { AdminGetAllReports, AdminUpdateReportStatusOrBlock, AdminToggleBlockUser } from "../controllers/AdminController.js";

const AdminRouter = express.Router();

// All routes require authentication + admin verification
AdminRouter.get("/reports", isAuthenticated, isAdmin, AdminGetAllReports);
AdminRouter.patch("/reports/:id/update", isAuthenticated, isAdmin, AdminUpdateReportStatusOrBlock);
AdminRouter.post("/users/:userId/toggle-block", isAuthenticated, isAdmin, AdminToggleBlockUser);

export default AdminRouter;
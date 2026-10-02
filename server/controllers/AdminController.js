import ReportDB from "../models/reportModel.js";
import UserDB from "../models/userModel.js";
import UserCreditsDB from "../models/userCreditsModel.js";

// 1. Get All System Reports for Admin Review
export const AdminGetAllReports = async (req, res) => {
    try {
        const reports = await ReportDB.find({})
            .populate("userId", "username email userType")
            .sort({ createdAt: -1 })
            .lean();

        // Format for admin dashboard table compatibility
        const formattedReports = reports.map(r => ({
            ...r,
            id: r._id,
            report_user_displayName: r.report_user_displayName || r.userId?.username || "Citizen"
        }));

        return res.status(200).json({
            success: true,
            data: { reports: formattedReports }
        });
    } catch (error) {
        console.error("AdminGetAllReports Error:", error);
        return res.status(500).json({ success: false, message: "Unable to fetch reports for admin." });
    }
};

// 2. Update Report Status, Priority, or Block Report (Revoking 5 credits if blocked)
export const AdminUpdateReportStatusOrBlock = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, blocked, blockReason, updatedPriority, updateReason } = req.body;

        const report = await ReportDB.findById(id);
        if (!report) {
            return res.status(404).json({ success: false, message: "Report not found." });
        }

        // Status Update
        const allowedStatuses = ["submitted", "reviewed", "updated", "assigned", "working_on_it", "resolved"];
        if (status && allowedStatuses.includes(status)) {
            report.status = status;
            report.statusHistory.push({
                status,
                note: updateReason || `Status updated to ${status} by admin`,
                changedBy: req.session.userId
            });
        }

        // Priority Override
        if (updatedPriority !== undefined && Number(updatedPriority) !== report.issuePriority) {
            if (!updateReason || updateReason.trim() === "") {
                return res.status(400).json({ success: false, message: "An administrative reason is required to change report priority." });
            }
            report.updatedIssuePriority = Number(updatedPriority);
            report.updateReason = updateReason.trim();
        }

        // Block / Unblock Report (Revoking 5 credits if newly blocked)
        if (blocked !== undefined && blocked !== report.blocked) {
            report.blocked = blocked;
            report.blockReason = blockReason || "Flagged or blocked by administrator.";

            if (blocked === true) {
                // Deduct 5 credits and decrement valid reports count from user
                await UserCreditsDB.findOneAndUpdate(
                    { userId: report.userId },
                    {
                        $inc: { credits: -5, validReportsCount: -1 },$push: {
                            history: {
                                amount: -5,
                                type: 'withdrawn',
                                description: `5 Credits revoked because report ${report.reportId} was blocked/flagged as invalid by admin.`,
                                referenceId: report._id
                            }
                        }
                    }
                );
            }
        }

        await report.save();
        return res.status(200).json({ success: true, message: "Report updated successfully.", data: report });
    } catch (error) {
        console.error("AdminUpdateReport Error:", error);
        return res.status(500).json({ success: false, message: "Failed to update report." });
    }
};

// 3. Block User Account
export const AdminToggleBlockUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await UserDB.findById(userId);

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        // Prevent admin from blocking themselves
        if (userId === req.session.userId) {
            return res.status(400).json({ success: false, message: "You cannot block your own admin account." });
        }

        // Toggle user type or mark as blocked (depending on your User schema)
        user.isBlock = !user.isBlock; // Assuming isBlock is a boolean field in User model
        await user.save();

        return res.status(200).json({ success: true, message: `User ${user.username} has been blocked successfully.` });
    } catch (error) {
        console.error("AdminBlockUser Error:", error);
        return res.status(500).json({ success: false, message: "Failed to block user." });
    }
};
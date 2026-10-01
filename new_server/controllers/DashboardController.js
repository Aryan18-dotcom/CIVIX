import UserDB from "../models/userModel.js";
import UserCreditsDB from "../models/userCreditsModel.js";
import ReportDB from "../models/reportModel.js";

export const GetDashboard = async (req, res) => {
  try {
    const userId = req.session.userId;
    const user = await UserDB.findById(userId).select("-password").lean();
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const [credits, counts, recentReports, civicLeaders, carbonLeaders, platform] = await Promise.all([
      UserCreditsDB.findOne({ userId }).lean(),
      ReportDB.aggregate([
        { $match: { userId: user._id } },
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]),
      ReportDB.find({ userId }).sort({ createdAt: -1 }).limit(5).lean(),
      ReportDB.aggregate([
        { $group: { _id: "$userId", totalReports: { $sum: 1 }, resolvedReports: { $sum: { $cond: [{ $eq: ["$status", "Resolved"] }, 1, 0] } } } },
        { $sort: { resolvedReports: -1, totalReports: -1 } }, { $limit: 5 },
        { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "person" } },
        { $unwind: { path: "$person", preserveNullAndEmptyArrays: true } },
        { $project: { userId: "$_id", name: { $ifNull: ["$person.username", "CIVIX Citizen"] }, score: "$resolvedReports", totalReports: 1 } }
      ]),
      UserCreditsDB.find({}).sort({ credits: -1 }).limit(5).select("userId username credits").lean(),
      UserCreditsDB.aggregate([{ $group: { _id: null, totalCredits: { $sum: "$credits" } } }])
    ]);

    const byStatus = Object.fromEntries(counts.map(x => [x._id, x.count]));
    const totalReports = counts.reduce((sum, x) => sum + x.count, 0);
    const resolvedReports = byStatus.Resolved || 0;
    const userCredits = credits?.credits || 0;
    const totalPlatformCredits = platform[0]?.totalCredits || 0;

    res.json({
      success: true,
      data: {
        user: { id: user._id, username: user.username, email: user.email, profilePicture: user.profilePicture || "" },
        statistics: { totalReports, resolvedReports, pendingReports: (byStatus.Submitted || 0) + (byStatus["Under Review"] || 0), inProgressReports: byStatus["In Progress"] || 0, civicPoints: resolvedReports * 10 },
        carbon: { credits: userCredits, co2EquivalentKg: userCredits * 1000, platformCredits: totalPlatformCredits, contributionPercentage: totalPlatformCredits ? Number((userCredits / totalPlatformCredits * 100).toFixed(2)) : 0, treeYearsEquivalent: { minimum: userCredits * 40, maximum: userCredits * 50 } },
        recentReports: recentReports.map(r => ({ ...r, id: r._id })),
        leaderboard: { civic: civicLeaders, carbon: carbonLeaders.map((x, i) => ({ userId: x.userId, name: x.username, score: x.credits, rank: i + 1 })) }
      }
    });
  } catch (error) {
    console.error("GetDashboard:", error);
    res.status(500).json({ success: false, message: "Unable to load dashboard" });
  }
};

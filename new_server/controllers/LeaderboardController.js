import UserCreditsDB from "../models/userCreditsModel.js";
import ReportDB from "../models/reportModel.js";
export const GetLeaderboard = async (req, res) => {
  try {
    const type = req.query.type === "carbon" ? "carbon" : "civic";
    let leaderboard;
    if (type === "carbon") {
      leaderboard = await UserCreditsDB.find({}).sort({ credits: -1 }).limit(20).select("userId username credits").lean();
      leaderboard = leaderboard.map((u, i) => ({ userId: u.userId, name: u.username, score: u.credits, rank: i + 1 }));
    } else {
      const rows = await ReportDB.aggregate([
        { $match: { status: "Resolved" } },
        { $group: { _id: "$userId", score: { $sum: 1 } } }, { $sort: { score: -1 } }, { $limit: 20 },
        { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "person" } }, { $unwind: { path: "$person", preserveNullAndEmptyArrays: true } },
        { $project: { userId: "$_id", name: { $ifNull: ["$person.username", "CIVIX Citizen"] }, score: { $multiply: ["$score", 10] } } }
      ]);
      leaderboard = rows.map((u, i) => ({ ...u, rank: i + 1 }));
    }
    res.json({ success: true, data: { type, leaderboard } });
  } catch { res.status(500).json({ success: false, message: "Unable to fetch leaderboard" }); }
};

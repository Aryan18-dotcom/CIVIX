import UserCreditsDB from "../models/userCreditsModel.js";
export const GetMyCarbon = async (req, res) => {
  try {
    const row = await UserCreditsDB.findOne({ userId: req.session.userId }).lean();
    const credits = row?.credits || 0;
    res.json({ success: true, data: { credits, co2EquivalentKg: credits * 1000, treeYearsEquivalent: { minimum: credits * 40, maximum: credits * 50 } } });
  } catch { res.status(500).json({ success: false, message: "Unable to fetch credits" }); }
};
export const GetCarbonHistory = async (_req, res) => res.json({ success: true, data: { transactions: [], note: "Transaction history model not configured yet." } });

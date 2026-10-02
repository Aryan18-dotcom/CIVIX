import UserCreditsDB from "../models/userCreditsModel.js";

export const GetMyCarbon = async (req, res) => {
  try {
    const row = await UserCreditsDB.findOne({ userId: req.session.userId }).lean();
    const credits = row?.credits || 0;
    res.json({ 
      success: true, 
      data: { 
        credits, 
        co2EquivalentKg: credits * 1000, 
        treeYearsEquivalent: { minimum: credits * 40, maximum: credits * 50 } 
      } 
    });
  } catch (error) { 
    res.status(500).json({ success: false, message: "Unable to fetch credits" }); 
  }
};

export const GetCarbonHistory = async (req, res) => {
  try {
    const row = await UserCreditsDB.findOne({ userId: req.session.userId }).lean();
    const transactions = row?.history ? row.history.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) : [];
    
    res.json({ 
      success: true, 
      data: { 
        transactions, 
        totalWithdrawn: row?.totalWithdrawn || 0 
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Unable to fetch credit history" });
  }
};
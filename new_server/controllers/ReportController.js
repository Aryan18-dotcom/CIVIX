import mongoose from "mongoose";
import ReportDB from "../models/reportModel.js";

const allowedCategories = ["Road & Infrastructure", "Waste Management", "Water & Drainage", "Street Lighting", "Public Safety", "Public Property", "Other"];

export const CreateReport = async (req, res) => {
  try {
    const { title, category, description, address, latitude, longitude, priority, emergency } = req.body;
    const lat = Number(latitude), lng = Number(longitude), p = Number(priority), e = Number(emergency);
    if (!title?.trim() || !category || !description?.trim() || !address?.trim() ||
      !Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180 ||
      !Number.isInteger(p) || p < 1 || p > 10 || !Number.isInteger(e) || e < 1 || e > 10) {
      return res.status(400).json({ success: false, message: "Complete all fields with valid values." });
    }
    if (!allowedCategories.includes(category)) return res.status(400).json({ success: false, message: "Invalid category." });
    const uploads = req.files || [];
    if (uploads.length < 1 || uploads.length > 6) return res.status(400).json({ success: false, message: "Upload between 1 and 6 photos." });

    const report = await ReportDB.create({
      userId: req.session.userId, title: title.trim(), category, description: description.trim(),
      location: { address: address.trim(), coordinates: { type: "Point", coordinates: [lng, lat] } },
      priority: p, emergency: e,
      photos: uploads.map(f => ({ url: `/uploads/reports/${f.filename}`, filename: f.filename })),
      statusHistory: [{ status: "Submitted", changedBy: req.session.userId }]
    });
    res.status(201).json({ success: true, message: "Report submitted", data: { reportId: report.reportId, id: report._id, status: report.status, createdAt: report.createdAt } });
  } catch (error) {
    console.error("CreateReport:", error);
    res.status(500).json({ success: false, message: "Unable to submit report" });
  }
};

export const GetMyReports = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1), limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
    const [reports, total] = await Promise.all([
      ReportDB.find({ userId: req.session.userId }).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      ReportDB.countDocuments({ userId: req.session.userId })
    ]);
    res.json({ success: true, data: { reports, pagination: { page, limit, total, pages: Math.ceil(total / limit) } } });
  } catch (error) { res.status(500).json({ success: false, message: "Unable to fetch reports" }); }
};

export const GetNearbyReports = async (req, res) => {
  try {
    const lat = Number(req.query.lat), lng = Number(req.query.lng), radius = Math.min(25000, Math.max(100, Number(req.query.radius) || 3000));
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180)
      return res.status(400).json({ success: false, message: "Valid lat and lng are required." });
    const reports = await ReportDB.find({
      "location.coordinates": { $near: { $geometry: { type: "Point", coordinates: [lng, lat] }, $maxDistance: radius } },
      status: { $ne: "Rejected" }
    }).limit(200).select("reportId title category location status priority emergency photos createdAt").lean();
    res.json({ success: true, data: { reports, radius, count: reports.length } });
  } catch (error) { res.status(500).json({ success: false, message: "Unable to fetch nearby reports" }); }
};

export const GetReportById = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid report ID" });
  const report = await ReportDB.findById(req.params.id).lean();
  if (!report) return res.status(404).json({ success: false, message: "Report not found" });
  res.json({ success: true, data: report });
};

export const UpdateReportStatus = async (req, res) => {
  try {
    if (!["admin"].includes(req.user?.userType)) return res.status(403).json({ success: false, message: "Admin access required" });
    const allowed = ["Under Review", "In Progress", "Resolved", "Rejected", "Reopened"];
    const { status, note = "" } = req.body;
    if (!allowed.includes(status)) return res.status(400).json({ success: false, message: "Invalid status" });
    const report = await ReportDB.findById(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: "Report not found" });
    report.status = status;
    report.statusHistory.push({ status, note, changedBy: req.session.userId });
    await report.save();
    res.json({ success: true, data: report });
  } catch (error) { res.status(500).json({ success: false, message: "Unable to update status" }); }
};

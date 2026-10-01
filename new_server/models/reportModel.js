import mongoose from "mongoose";

const ReportSchema = new mongoose.Schema({
  reportId: { type: String, unique: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 120 },
  category: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true, maxlength: 3000 },
  location: {
    address: { type: String, required: true, trim: true },
    coordinates: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], required: true } // [longitude, latitude]
    }
  },
  priority: { type: Number, min: 1, max: 10, required: true },
  emergency: { type: Number, min: 1, max: 10, required: true },
  photos: [{ url: String, filename: String }],
  status: { type: String, enum: ["Submitted", "Under Review", "In Progress", "Resolved", "Rejected", "Reopened"], default: "Submitted", index: true },
  statusHistory: [{ status: String, note: String, changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, changedAt: { type: Date, default: Date.now } }]
}, { timestamps: true });

ReportSchema.index({ "location.coordinates": "2dsphere" });
ReportSchema.pre("validate", function() {
  if (!this.reportId) this.reportId = `CVX-${Date.now().toString().slice(-8)}-${Math.floor(Math.random()*900+100)}`;
});
export default mongoose.models.Report || mongoose.model("Report", ReportSchema);

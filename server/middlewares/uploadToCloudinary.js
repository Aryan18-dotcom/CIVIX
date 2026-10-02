import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";
dotenv.config(); // Load environment variables from .env file

// Configure Cloudinary (Make sure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET are in your .env)
console.log("Cloudinary Config:", {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY ? "SET" : "NOT SET",
  api_secret: process.env.CLOUDINARY_API_SECRET ? "SET" : "NOT SET"
});
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Helper middleware to handle high-quality Cloudinary uploads
export const uploadToCloudinary = async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, message: "Upload between 1 and 6 photos." });
  }

  try {
    const uploadPromises = req.files.map(file => {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "civix/reports",
            resource_type: "image",
            quality: "auto:best", // Ensures highest quality setting optimization
            fetch_format: "auto"
          },
          (error, result) => {
            if (error) reject(error);
            else resolve({ url: result.secure_url, filename: result.public_id });
          }
        );
        streamifier.createReadStream(file.buffer).pipe(uploadStream);
      });
    });

    req.cloudinaryImages = await Promise.all(uploadPromises);
    next();
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);
    return res.status(500).json({ success: false, message: "Failed to upload images to cloud storage." });
  }
};
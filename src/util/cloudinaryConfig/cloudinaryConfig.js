const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { Readable } = require("stream");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter – allows images + PDFs, plus videos for field 'video'
const fileFilter = (req, file, cb) => {
  // If the field is 'video', accept video MIME types
  if (file.fieldname === "video") {
    const allowedVideoTypes = /mp4|mov|avi|mkv|webm|flv|3gp/;
    const mimeType = allowedVideoTypes.test(file.mimetype);
    if (mimeType) return cb(null, true);
    return cb(
      new Error(
        "Only video files (MP4, MOV, AVI, MKV, WEBM) are allowed for the video field",
      ),
      false,
    );
  }

  // For all other fields (image, logo, banner, title_image, etc.):
  const allowedImageTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ];
  const allowedDocumentTypes = ["application/pdf"];
  const allowedTypes = [...allowedImageTypes, ...allowedDocumentTypes];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Only image files (JPEG, PNG, GIF, WEBP) and PDF files are allowed",
      ),
      false,
    );
  }
};

// Multer upload configuration (now accepts videos for the "video" field)
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 10MB for images; you may increase for videos later
  },
  fileFilter: fileFilter,
});

// Upload to Cloudinary (supports both image and video via resource_type option)
const uploadToCloudinary = (buffer, folder, options = {}) => {
  return new Promise((resolve, reject) => {
    let resourceType = options.resource_type || "auto";

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: resourceType,
        ...options,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      },
    );

    const readableStream = new Readable();
    readableStream.push(buffer);
    readableStream.push(null);
    readableStream.pipe(uploadStream);
  });
};

// Helper function to get resource type from URL or file
const getResourceTypeFromUrl = (url) => {
  if (!url) return "image";
  if (url.includes(".pdf") || url.includes("raw/upload")) return "raw";
  if (url.match(/\.(jpg|jpeg|png|gif|webp)/i) || url.includes("image/upload"))
    return "image";
  if (
    url.match(/\.(mp4|mov|avi|mkv|webm|flv|3gp)/i) ||
    url.includes("video/upload")
  )
    return "video";
  return "image";
};

// Delete from Cloudinary (detects resource type automatically)
const deleteFromCloudinary = async (publicIdOrUrl, resourceType = null) => {
  try {
    let publicId = publicIdOrUrl;
    let detectedResourceType = resourceType;

    if (publicIdOrUrl.includes("cloudinary")) {
      if (!detectedResourceType) {
        detectedResourceType = getResourceTypeFromUrl(publicIdOrUrl);
      }
      const parts = publicIdOrUrl.split("/");
      const uploadIndex = parts.findIndex((part) => part === "upload");
      if (uploadIndex !== -1) {
        const versionIndex = uploadIndex + 2;
        const publicIdParts = parts.slice(versionIndex + 1);
        publicId = publicIdParts.join("/").split(".")[0];
      }
    }

    const finalResourceType = detectedResourceType || "image";
    console.log(
      `Deleting from Cloudinary: ${publicId} (type: ${finalResourceType})`,
    );

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: finalResourceType,
    });
    return result;
  } catch (error) {
    console.error("Error deleting from Cloudinary:", error);
    throw error;
  }
};

// Get file info
const getFileInfo = async (publicId, resourceType = "image") => {
  try {
    const result = await cloudinary.api.resource(publicId, {
      resource_type: resourceType,
    });
    return result;
  } catch (error) {
    console.error("Error getting file info:", error);
    throw error;
  }
};

// Optional: still export a dedicated video uploader if needed elsewhere
const uploadVideo = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 200 * 1024 * 1024, // 200 MB
  },
  fileFilter: (req, file, cb) => {
    const allowedVideoTypes = /mp4|mov|avi|mkv|webm|flv|3gp/;
    const mimeType = allowedVideoTypes.test(file.mimetype);
    if (mimeType) return cb(null, true);
    cb(new Error("Only video files (MP4, MOV, AVI, MKV, WEBM) are allowed"));
  },
});
module.exports = {
  upload,
  uploadVideo,
  uploadToCloudinary,
  deleteFromCloudinary,
  getFileInfo,
};

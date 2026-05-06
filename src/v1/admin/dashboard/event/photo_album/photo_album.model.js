const mongoose = require("mongoose");

const newsSchema = new mongoose.Schema(
  {
    title: {
      kh: {
        type: String,
        required: true,
      },
      en: {
        type: String,
        required: true,
      },
    },
    article: {
      kh: {
        type: String,
        required: true,
      },
      en: { 
        type: String,
        required: true,
      },
    },
    
    title_image: {
      type: String, // Single image URL for title/thumbnail from Cloudinary
      default: null,
    },
    images: {
      type: [String], // Array of image URLs from Cloudinary for gallery
      default: [],
    },
    status: {
      type: Boolean,
      default: true, // true = published, false = draft
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updated_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: { createdAt: "created_date", updatedAt: "updated_date" },
  },
);

module.exports = mongoose.model("EventPhotoAlbum", newsSchema);




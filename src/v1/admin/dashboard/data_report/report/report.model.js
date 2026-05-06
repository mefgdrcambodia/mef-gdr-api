const mongoose = require("mongoose");

const legalSchema = new mongoose.Schema(
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
    description: {
      kh: {
        type: String,
        default: "",
      },
      en: {
        type: String,
        default: "",
      },
    },
    category: {
      type: String,
      enum: ["ssmr", "drp"],
      required: true,
    },
    cover_image: {
      type: String, // Image URL from Cloudinary
      default: null,
    },
    pdf_file: {
      kh: {
        type: String, // PDF file URL from Cloudinary (Khmer version)
        default: null,
      },
      en: {
        type: String, // PDF file URL from Cloudinary (English version)
        default: null,
      },
    },
    published_date: {
      type: Date,
      default: Date.now,
    },
    document_number: {
      type: String,
      default: "",
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

module.exports = mongoose.model("DataReport", legalSchema);

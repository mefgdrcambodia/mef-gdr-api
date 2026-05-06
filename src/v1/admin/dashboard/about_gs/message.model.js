const mongoose = require("mongoose");

const legalSchema = new mongoose.Schema(
  {
    name: {
      kh: {
        type: String,
        required: true,
      },
      en: {
        type: String,
        required: true,
      },
    },

    
    job_title: {
      kh: {
        type: String,
        default: "",
      },
      en: {
        type: String,
        default: "",
      },
    },

    message: {
      kh: {
        type: String,
        default: "",
      },
      en: {
        type: String,
        default: "",
      },
    },

    leader_profile: {
      type: String, // Image URL from Cloudinary
      default: null,
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

module.exports = mongoose.model("AboutGSMessage", legalSchema);

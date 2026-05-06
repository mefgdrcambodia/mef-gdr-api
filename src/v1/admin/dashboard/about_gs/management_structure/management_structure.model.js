const mongoose = require("mongoose");

const legalSchema = new mongoose.Schema(
  {
    article: {
      kh: {
        type: String,
        required: false,
      },
      en: {
        type: String,
        required: false,
      },
    },

    url_image: {
      kh: {
        type: String,
        required: true,
      },
      en: {
        type: String,
        required: true,
      },
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

module.exports = mongoose.model("AboutGSManagementStructure", legalSchema);

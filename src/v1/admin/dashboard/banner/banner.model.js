const mongoose = require("mongoose");
const userSchema = new mongoose.Schema(
  {
    url_about_general_department: {
      type: String,
      required: true,
    },

    url_new_and_event: {
      type: String,
      required: true,
    },

    url_document_collection: {
      type: String,
      required: true,
    },

    url_report: {
      type: String,
      required: true,
    },

    status: {
      type: Boolean,
      required: false,
      default: false,
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
module.exports = mongoose.model("WebsiteBanner", userSchema);

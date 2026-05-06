const mongoose = require("mongoose");
const userSchema = new mongoose.Schema(
  {
    mef_name_full: {
      type: String,
      required: true,
    },

    mef_name_full_en: {
      type: String,
      required: true,
    },

    mef_name_short: {
      type: String,
      required: true,
    },

    mef_name_short_en: {
      type: String,
      required: true,
    },

    running_text: {
      type: [
        {
          text: {
            type: String,
            required: true,
          },
        },
      ],
      required: false,
    },

    running_text_en: {
      type: [
        {
          text: {
            type: String,
            required: true,
          },
        },
      ],
      required: false,
    },

    url_logo: {
      type: String,
      required: false,
    },

    banners: {
      type: [
        {
          url: {
            type: String,
            required: true,
          },
        },
      ],
      required: false,
      default: [],
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
module.exports = mongoose.model("Header", userSchema);

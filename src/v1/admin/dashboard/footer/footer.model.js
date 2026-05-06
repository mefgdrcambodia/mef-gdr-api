const mongoose = require("mongoose");
const userSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    title_en: {
      type: String,
      required: true,
    },

    full_address: {
      type: String,
      required: true,
    },

    full_address_en: {
      type: String,
      required: true,
    },

    contact: {
      type: String,
      required: false,
    },

    email: {
      type: String,
      required: false,
    },

    copy_right: {
      type: String,
      required: true,
    },

    copy_right_en: {
      type: String,
      required: true,
    },

    copy_right_below: {
      type: String,
      required: true,
    },

    copy_right_below_en: {
      type: String,
      required: true,
    },

    url_mef: {
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
module.exports = mongoose.model("Footer", userSchema);

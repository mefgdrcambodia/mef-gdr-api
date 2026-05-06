const mongoose = require("mongoose");

// Reusable sub-schema for an office
const officeSubSchema = new mongoose.Schema(
  {
    title: {
      kh: { type: String, required: true },
      en: { type: String, required: true },
    },
    job_to_do: [
      {
        kh: { type: String, required: true },
        en: { type: String, required: true },
      },
    ],
  },
  { _id: false }, // Prevents creating separate _id for each office sub-document (optional)
);

const legalSchema = new mongoose.Schema(
  {
    title: {
      kh: { type: String, required: true },
      en: { type: String, required: true },
    },
    description: {
      kh: { type: String, required: true },
      en: { type: String, required: true },
    },

    job_to_do: [
      {
        kh: { type: String, required: true },
        en: { type: String, required: true },
      },
    ],

    // Three separate office fields
    office_one: officeSubSchema,
    office_two: officeSubSchema,
    office_three: officeSubSchema,

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

module.exports = mongoose.model(
  "AboutRoleAndResponsibilityDepartmentResttlementThree",
  legalSchema,
);

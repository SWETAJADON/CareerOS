const mongoose = require("mongoose");

const jobApplicationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    companyName: {
      type: String,
      required: true,
      trim: true,
    },

    jobTitle: {
      type: String,
      required: true,
      trim: true,
    },

    jobType: {
      type: String,
      enum: ["Full Time", "Part Time", "Internship", "Remote", "Contract"],
      default: "Full Time",
    },

    location: {
      type: String,
      default: "",
      trim: true,
    },

    salary: {
      type: String,
      default: "",
    },

    jobDescription: {
      type: String,
      default: "",
    },

    applicationDate: {
      type: Date,
      default: Date.now,
    },

    status: {
      type: String,
      enum: [
        "Applied",
        "Shortlisted",
        "Interview",
        "Offered",
        "Rejected",
        "Withdrawn",
      ],
      default: "Applied",
    },

    jobLink: {
      type: String,
      default: "",
    },

    notes: {
      type: String,
      default: "",
    },

    interviewDate: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "JobApplication",
  jobApplicationSchema
);

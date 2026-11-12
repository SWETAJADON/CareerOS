const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // Authentication
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },

    // Personal Information
    phone: { type: String, default: "" },
    location: { type: String, default: "" },

    // Education
    education: { type: String, default: "" },
    educationDetails: {
      institution: { type: String, default: "" },
      specialization: { type: String, default: "" },
      graduationYear: { type: String, default: "" },
      grade: { type: String, default: "" },
    },

    // Skills
    skills: { type: String, default: "" },

    // Career Preferences
    targetRole: { type: String, default: "" },
    careerPreferences: {
      industry: { type: String, default: "" },
      preferredLocation: { type: String, default: "" },
      workMode: { type: String, default: "" },
    },

    // Experience
    experience: [
      {
        jobTitle: { type: String, default: "" },
        company: { type: String, default: "" },
        duration: { type: String, default: "" },
        description: { type: String, default: "" },
      },
    ],

    // Certifications
    certifications: [
      {
        name: { type: String, default: "" },
        issuingOrganization: { type: String, default: "" },
        issueYear: { type: String, default: "" },
      },
    ],

    // Professional Summary
    about: { type: String, default: "" },

    // Social and Portfolio Links
    linkedin: { type: String, default: "" },
    github: { type: String, default: "" },
    portfolio: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);

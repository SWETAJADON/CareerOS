const mongoose = require("mongoose");

const resumeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: {
      type: String,
      default: "My Resume",
    },

    
    // Resume Customization
    template: {
      type: String,
      enum: ["modern", "professional", "minimal", "creative", "ats"],
      default: "modern",
    },

    themeColor: {
      type: String,
      default: "#2563eb",
    },

    fontFamily: {
      type: String,
      default: "Arial",
    },

    layout: {
      type: String,
      enum: ["single", "two-column"],
      default: "single",
    },


    personalDetails: {
      fullName: { type: String, default: "" },
      email: { type: String, default: "" },
      phone: { type: String, default: "" },
      location: { type: String, default: "" },
      linkedin: { type: String, default: "" },
      portfolio: { type: String, default: "" },
    },

    summary: {
      type: String,
      default: "",
    },

    education: [
      {
        degree: String,
        institution: String,
        year: String,
        grade: String,
      },
    ],

    experience: [
      {
        company: String,
        position: String,
        duration: String,
        description: String,
      },
    ],

    skills: [String],

    projects: [
      {
        name: String,
        technologies: String,
        description: String,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Resume", resumeSchema);

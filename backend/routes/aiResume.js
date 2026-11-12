const express = require("express");
const User = require("../models/User");
const authMiddleware = require("../middleware/auth");
const { generateResumeContent } = require("../services/aiService");

const router = express.Router();

router.post("/generate", authMiddleware, async (req, res) => {
  try {
    const { targetRole, additionalInfo = "" } = req.body;

    if (
      typeof targetRole !== "string" ||
      !targetRole.trim() ||
      targetRole.length > 100
    ) {
      return res.status(400).json({
        message: "Please provide a valid target job role.",
      });
    }

    if (
      typeof additionalInfo !== "string" ||
      additionalInfo.length > 5000
    ) {
      return res.status(400).json({
        message: "Additional information must be under 5000 characters.",
      });
    }

    const user = await User.findById(req.userId).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User profile not found.",
      });
    }

    const profile = {
      fullName: user.fullName,
      education: user.education,
      educationDetails: user.educationDetails,
      skills: user.skills,
      experience: user.experience,
      certifications: user.certifications,
      about: user.about,
      location: user.location,
    };

    const generatedResume = await generateResumeContent(
      profile,
      targetRole.trim(),
      additionalInfo.trim()
    );

    return res.status(200).json({
      message: "AI resume generated successfully!",
      resume: generatedResume,
    });
  } catch (error) {
    console.error("AI Resume Error:", error.message);

    return res.status(500).json({
      message: "Unable to generate resume. Please try again.",
    });
  }
});

module.exports = router;


const express = require("express");
const User = require("../models/User");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// GET /api/profile - Fetch logged-in user's profile
router.get("/", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    return res.status(200).json({
      message: "Profile fetched successfully!",
      user,
    });
  } catch (error) {
    console.error("Profile fetch error:", error.message);

    return res.status(500).json({
      message: "Unable to fetch profile.",
    });
  }
});

// PUT /api/profile - Update logged-in user's profile
router.put("/", authMiddleware, async (req, res) => {
  try {
    const allowedFields = [
      "fullName",
      "phone",
      "location",
      "education",
      "skills",
      "targetRole",
      "about",
      "educationDetails",
      "careerPreferences",
      "experience",
      "certifications",
      "linkedin",
      "github",
      "portfolio",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    // Validate full name
    if (
      updates.fullName !== undefined &&
      (typeof updates.fullName !== "string" ||
        !updates.fullName.trim())
    ) {
      return res.status(400).json({
        message: "Full name cannot be empty.",
      });
    }

    // Validate nested objects
    if (
      updates.educationDetails !== undefined &&
      (typeof updates.educationDetails !== "object" ||
        updates.educationDetails === null ||
        Array.isArray(updates.educationDetails))
    ) {
      return res.status(400).json({
        message: "Invalid education details.",
      });
    }

    if (
      updates.careerPreferences !== undefined &&
      (typeof updates.careerPreferences !== "object" ||
        updates.careerPreferences === null ||
        Array.isArray(updates.careerPreferences))
    ) {
      return res.status(400).json({
        message: "Invalid career preferences.",
      });
    }

    // Validate repeatable sections
    if (
      updates.experience !== undefined &&
      !Array.isArray(updates.experience)
    ) {
      return res.status(400).json({
        message: "Experience must be an array.",
      });
    }

    if (
      updates.certifications !== undefined &&
      !Array.isArray(updates.certifications)
    ) {
      return res.status(400).json({
        message: "Certifications must be an array.",
      });
    }

    // Update only the logged-in user's document
    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: updates },
      {
        new: true,
        runValidators: true,
      }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    return res.status(200).json({
      message: "Profile updated successfully!",
      user,
    });
  } catch (error) {
    console.error("Profile update error:", error.message);

    return res.status(500).json({
      message: "Unable to update profile.",
    });
  }
});

module.exports = router;

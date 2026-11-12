const express = require("express");
const Resume = require("../models/Resume");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// CREATE RESUME
router.post("/", authMiddleware, async (req, res) => {
  try {
    const resume = await Resume.create({
      ...req.body,
      userId: req.userId,
    });

    res.status(201).json({
      message: "Resume created successfully!",
      resume,
    });
  } catch (error) {
    console.error("Create resume error:", error.message);
    res.status(500).json({ message: "Unable to create resume." });
  }
});

// GET ALL USER RESUMES
router.get("/", authMiddleware, async (req, res) => {
  try {
    const resumes = await Resume.find({ userId: req.userId })
      .sort({ updatedAt: -1 });

    res.status(200).json({ resumes });
  } catch (error) {
    console.error("Fetch resumes error:", error.message);
    res.status(500).json({ message: "Unable to fetch resumes." });
  }
});

// GET SINGLE RESUME
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!resume) {
      return res.status(404).json({ message: "Resume not found." });
    }

    res.status(200).json({ resume });
  } catch (error) {
    res.status(400).json({ message: "Invalid resume ID." });
  }
});

// UPDATE RESUME
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const allowedFields = [
      "title",
      "personalDetails",
      "summary",
      "education",
      "experience",
      "skills",
      "projects",
      "template",
      "themeColor",
      "fontFamily",
      "layout",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const resume = await Resume.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!resume) {
      return res.status(404).json({ message: "Resume not found." });
    }

    res.status(200).json({
      message: "Resume updated successfully!",
      resume,
    });
  } catch (error) {
    console.error("Update resume error:", error.message);
    res.status(400).json({ message: "Unable to update resume." });
  }
});

// DELETE RESUME
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const resume = await Resume.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!resume) {
      return res.status(404).json({ message: "Resume not found." });
    }

    res.status(200).json({ message: "Resume deleted successfully!" });
  } catch (error) {
    res.status(400).json({ message: "Invalid resume ID." });
  }
});

module.exports = router;

const express = require("express");
const JobApplication = require("../models/JobApplication");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// CREATE JOB APPLICATION
router.post("/", authMiddleware, async (req, res) => {
  try {
    const {
      companyName,
      jobTitle,
      jobType,
      location,
      salary,
      jobDescription,
      applicationDate,
      status,
      jobLink,
      notes,
      interviewDate,
    } = req.body;

    if (
      !companyName?.trim() ||
      !jobTitle?.trim()
    ) {
      return res.status(400).json({
        message: "Company name and job title are required.",
      });
    }

    const application = await JobApplication.create({
      companyName,
      jobTitle,
      jobType,
      location,
      salary,
      jobDescription,
      applicationDate,
      status,
      jobLink,
      notes,
      interviewDate,
      userId: req.userId,
    });

    res.status(201).json({
      message: "Job application added successfully!",
      application,
    });
  } catch (error) {
    console.error("Create application error:", error.message);

    res.status(400).json({
      message: "Unable to add job application.",
    });
  }
});

// GET ALL JOB APPLICATIONS
router.get("/", authMiddleware, async (req, res) => {
  try {
    const applications = await JobApplication.find({
      userId: req.userId,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      applications,
    });
  } catch (error) {
    console.error("Fetch applications error:", error.message);

    res.status(500).json({
      message: "Unable to fetch job applications.",
    });
  }
});

// GET SINGLE JOB APPLICATION
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const application = await JobApplication.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!application) {
      return res.status(404).json({
        message: "Job application not found.",
      });
    }

    res.status(200).json({
      application,
    });
  } catch (error) {
    res.status(400).json({
      message: "Invalid application ID.",
    });
  }
});

// UPDATE JOB APPLICATION
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const allowedFields = [
      "companyName",
      "jobTitle",
      "jobType",
      "location",
      "salary",
      "jobDescription",
      "applicationDate",
      "status",
      "jobLink",
      "notes",
      "interviewDate",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (
      updates.companyName !== undefined &&
      !updates.companyName.trim()
    ) {
      return res.status(400).json({
        message: "Company name cannot be empty.",
      });
    }

    if (
      updates.jobTitle !== undefined &&
      !updates.jobTitle.trim()
    ) {
      return res.status(400).json({
        message: "Job title cannot be empty.",
      });
    }

    const application = await JobApplication.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.userId,
      },
      { $set: updates },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!application) {
      return res.status(404).json({
        message: "Job application not found.",
      });
    }

    res.status(200).json({
      message: "Job application updated successfully!",
      application,
    });
  } catch (error) {
    console.error("Update application error:", error.message);

    res.status(400).json({
      message: "Unable to update job application.",
    });
  }
});

// DELETE JOB APPLICATION
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const application = await JobApplication.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!application) {
      return res.status(404).json({
        message: "Job application not found.",
      });
    }

    res.status(200).json({
      message: "Job application deleted successfully!",
    });
  } catch (error) {
    res.status(400).json({
      message: "Invalid application ID.",
    });
  }
});

module.exports = router;

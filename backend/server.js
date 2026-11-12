const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const profileRoutes = require("./routes/profile");
const resumeRoutes = require("./routes/resume");
const aiResumeRoutes = require("./routes/aiResume");
const jobApplicationRoutes = require("./routes/jobApplication");
require("dotenv").config();



const connectDB = require("./config/db");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/resumes", resumeRoutes);
app.use("/api/ai-resume", aiResumeRoutes);
app.use("/api/job-applications", jobApplicationRoutes);


app.get("/", (req, res) => {
  res.send("CareerOS Backend is running!");
});

const startServer = async () => {
  await connectDB();

  const PORT = process.env.PORT || 5000;

  app.listen(PORT, () => {
    console.log(`CareerOS server running on port ${PORT}`);
  });
};

startServer();

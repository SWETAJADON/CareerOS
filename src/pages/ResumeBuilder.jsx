import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import html2pdf from "html2pdf.js";
import "./ResumeBuilder.css";

const PROFILE_API = "http://localhost:5000/api/profile";
const RESUME_API = "http://localhost:5000/api/resumes";
const AI_RESUME_API = "http://localhost:5000/api/ai-resume/generate";

const templates = [
  { id: "modern", name: "Modern", description: "Clean and contemporary design", color: "#2563eb" },
  { id: "professional", name: "Professional", description: "Formal corporate design", color: "#1f2937" },
  { id: "minimal", name: "Minimal", description: "Simple and elegant design", color: "#64748b" },
  { id: "creative", name: "Creative", description: "Colorful and distinctive design", color: "#9333ea" },
  { id: "ats", name: "ATS Friendly", description: "Simple, readable resume structure", color: "#15803d" },
];

const createEmptyResume = () => ({
  title: "My Resume",
  template: "modern",
  themeColor: "#2563eb",
  fontFamily: "Arial",
  layout: "single",
  personalDetails: {
    fullName: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    portfolio: "",
  },
  summary: "",
  education: [{ degree: "", institution: "", year: "", grade: "" }],
  experience: [{ company: "", position: "", duration: "", description: "" }],
  skills: [],
  projects: [{ name: "", technologies: "", description: "" }],
});

function ResumeBuilder() {
  const navigate = useNavigate();
  const token = sessionStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const [resumes, setResumes] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [targetRole, setTargetRole] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [formData, setFormData] = useState(createEmptyResume());
  const [skillsText, setSkillsText] = useState("");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    try {
      const [profileResponse, resumeResponse] = await Promise.all([
        axios.get(PROFILE_API, { headers }),
        axios.get(RESUME_API, { headers }),
      ]);

      const profile = profileResponse.data.user;
      const profileSkills = profile.skills || "";

      setFormData((prev) => ({
        ...prev,
        personalDetails: {
          fullName: profile.fullName || "",
          email: profile.email || "",
          phone: profile.phone || "",
          location: profile.location || "",
          linkedin: profile.linkedin || "",
          portfolio: profile.portfolio || "",
        },
        education: [{
          degree: profile.education || "",
          institution: profile.educationDetails?.institution || "",
          year: profile.educationDetails?.graduationYear || "",
          grade: profile.educationDetails?.grade || "",
        }],
        experience: profile.experience?.length
          ? profile.experience.map((item) => ({
              company: item.company || "",
              position: item.jobTitle || "",
              duration: item.duration || "",
              description: item.description || "",
            }))
          : prev.experience,
        skills: profileSkills
          ? profileSkills.split(",").map((skill) => skill.trim()).filter(Boolean)
          : [],
        summary: profile.about || "",
      }));

      setSkillsText(profileSkills);
      setResumes(resumeResponse.data.resumes || []);
    } catch (error) {
      console.error("Loading error:", error);
      setMessage(error.response?.data?.message || "Unable to load your data. Please try again.");
      if (error.response?.status === 401) {
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const loadResumesOnly = async () => {
    const response = await axios.get(RESUME_API, { headers });
    setResumes(response.data.resumes || []);
  };

  // Generate tailored resume content using the authenticated Gemini API.
  const handleGenerateAI = async () => {
    if (!targetRole.trim()) {
      setMessage("Please enter your target job role first.");
      return;
    }

    setAiLoading(true);
    setMessage("");
    setSuggestions([]);

    try {
      const response = await axios.post(
        AI_RESUME_API,
        {
          targetRole: targetRole.trim(),
          additionalInfo: additionalInfo.trim(),
        },
        { headers }
      );

      const generated = response.data?.resume;
      if (!generated || typeof generated !== "object") {
        throw new Error("The AI returned an unexpected response.");
      }

      const generatedSkills = Array.isArray(generated.skills)
        ? generated.skills.filter((item) => typeof item === "string" && item.trim())
        : [];

      const generatedExperience = Array.isArray(generated.experience)
        ? generated.experience.map((item) => ({
            company: item.company || "",
            position: item.position || "",
            duration: item.duration || "",
            description: item.description || "",
          }))
        : [];

      const generatedProjects = Array.isArray(generated.projects)
        ? generated.projects.map((item) => ({
            name: item.name || "",
            technologies: item.technologies || "",
            description: item.description || "",
          }))
        : [];

      setFormData((prev) => ({
        ...prev,
        title: generated.title || `${targetRole.trim()} Resume`,
        summary: generated.summary || prev.summary,
        skills: generatedSkills.length ? generatedSkills : prev.skills,
        experience: generatedExperience.length ? generatedExperience : prev.experience,
        projects: generatedProjects.length ? generatedProjects : prev.projects,
      }));

      if (generatedSkills.length) {
        setSkillsText(generatedSkills.join(", "));
      }

      setSuggestions(Array.isArray(generated.suggestions) ? generated.suggestions : []);
      setMessage("AI resume content generated! Review and edit it before saving.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error("AI generation error:", error);
      setMessage(
        error.response?.data?.message ||
        error.message ||
        "Unable to generate resume. Please try again."
      );
    } finally {
      setAiLoading(false);
    }
  };

  const handlePersonalChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      personalDetails: { ...prev.personalDetails, [name]: value },
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleArrayChange = (section, index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [section]: prev[section].map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const addEntry = (section, newEntry) => {
    setFormData((prev) => ({
      ...prev,
      [section]: [...prev[section], newEntry],
    }));
  };

  const removeEntry = (section, index) => {
    setFormData((prev) => ({
      ...prev,
      [section]: prev[section].filter((_, i) => i !== index),
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const payload = {
        ...formData,
        skills: skillsText.split(",").map((skill) => skill.trim()).filter(Boolean),
      };

      if (editingId) {
        await axios.put(`${RESUME_API}/${editingId}`, payload, { headers });
        setMessage("Resume updated successfully!");
      } else {
        await axios.post(RESUME_API, payload, { headers });
        setMessage("Resume created successfully!");
      }

      await loadResumesOnly();
      setEditingId(null);
    } catch (error) {
      console.error("Save error:", error);
      setMessage(error.response?.data?.message || "Unable to save resume.");
    }
  };

  const editResume = async (id) => {
    try {
      const response = await axios.get(`${RESUME_API}/${id}`, { headers });
      const resume = response.data.resume;
      const defaults = createEmptyResume();

      setFormData({
        ...defaults,
        ...resume,
        personalDetails: {
          ...defaults.personalDetails,
          ...resume.personalDetails,
        },
      });
      setSkillsText((resume.skills || []).join(", "));
      setEditingId(id);
      setSuggestions([]);
      setMessage("Resume loaded for editing.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error("Edit error:", error);
      setMessage("Unable to load this resume.");
    }
  };

  const deleteResume = async (id) => {
    if (!window.confirm("Are you sure you want to delete this resume?")) return;

    try {
      await axios.delete(`${RESUME_API}/${id}`, { headers });
      await loadResumesOnly();
      setMessage("Resume deleted successfully!");
      if (editingId === id) resetForm();
    } catch (error) {
      console.error("Delete error:", error);
      setMessage("Unable to delete resume.");
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData(createEmptyResume());
    setSkillsText("");
    setSuggestions([]);
    setMessage("");
  };

  const handleDownloadPdf = async () => {
    const element = document.getElementById("resume-pdf-content");
    if (!element) {
      setMessage("Resume preview not found.");
      return;
    }

    setDownloading(true);
    try {
      const safeName = (formData.personalDetails.fullName || "CareerOS")
        .trim()
        .replace(/[^a-z0-9]+/gi, "_");

      await html2pdf()
        .set({
          margin: [10, 10, 10, 10],
          filename: `${safeName}_Resume.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, scrollY: 0 },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
          pagebreak: { mode: ["css", "legacy"] },
        })
        .from(element)
        .save();

      setMessage("Resume PDF downloaded successfully!");
    } catch (error) {
      console.error("PDF download error:", error);
      setMessage("Unable to download PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return <div className="resume-loading">Loading Resume Builder...</div>;
  }

  return (
    <div className="resume-page">
      <div className="resume-header">
        <div>
          <p className="resume-label">CAREEROS / RESUME STUDIO</p>
          <h1>AI Resume Builder</h1>
          <p>Create a tailored resume with Gemini AI, then review and customize it.</p>
        </div>
        <button
          type="button"
          className="resume-back-btn"
          onClick={() => navigate("/dashboard")}
        >
          Back to Dashboard
        </button>
      </div>

      {message && <div className="resume-message" role="status">{message}</div>}

      <section className="ai-generator-panel">
        <div className="ai-panel-heading">
          <span className="ai-panel-eyebrow">CAREEROS AI • POWERED BY GEMINI</span>
          <h2>Build your resume with AI</h2>
          <p>
            Your saved profile is used as the starting point. Add a target role
            and extra details to tailor your resume.
          </p>
        </div>

        <label htmlFor="targetRole">Target job role *</label>
        <input
          id="targetRole"
          type="text"
          value={targetRole}
          onChange={(e) => setTargetRole(e.target.value)}
          placeholder="e.g. Full Stack Developer"
          maxLength={100}
        />

        <label htmlFor="additionalInfo">Additional information (optional)</label>
        <textarea
          id="additionalInfo"
          value={additionalInfo}
          onChange={(e) => setAdditionalInfo(e.target.value)}
          placeholder="Add relevant achievements, project details, internships, tools or job requirements. Only include accurate information."
          maxLength={5000}
          rows={4}
        />

        <div className="ai-generator-footer">
          <small>{additionalInfo.length}/5000 characters</small>
          <button
            type="button"
            className="generate-ai-btn"
            onClick={handleGenerateAI}
            disabled={aiLoading}
          >
            {aiLoading ? "Generating your resume..." : "✦ Generate Resume with AI"}
          </button>
        </div>
      </section>

      {suggestions.length > 0 && (
        <section className="ai-suggestions-panel">
          <h3>AI improvement suggestions</h3>
          <ul>
            {suggestions.map((suggestion, index) => (
              <li key={index}>{suggestion}</li>
            ))}
          </ul>
          <small>Only apply suggestions that accurately describe your experience.</small>
        </section>
      )}

      <section className="template-selection">
        <div className="template-heading">
          <h2>Choose your resume template</h2>
          <p>Select a design for your professional resume.</p>
        </div>

        <div className="template-grid">
          {templates.map((template) => (
            <button
              type="button"
              key={template.id}
              className={`template-card ${formData.template === template.id ? "selected" : ""}`}
              onClick={() =>
                setFormData((prev) => ({
                  ...prev,
                  template: template.id,
                  themeColor: template.color,
                }))
              }
              aria-pressed={formData.template === template.id}
            >
              <div
                className="template-preview"
                style={{ borderTop: `5px solid ${template.color}` }}
              >
                <div className="preview-line preview-name" />
                <div className="preview-line" />
                <div className="preview-line short" />
                <div className="preview-heading" />
                <div className="preview-line" />
                <div className="preview-line short" />
                <div className="preview-heading" />
                <div className="preview-line" />
              </div>
              <h3>{template.name}</h3>
              <p>{template.description}</p>
              {formData.template === template.id && (
                <span className="template-selected">✓ Selected</span>
              )}
            </button>
          ))}
        </div>
      </section>

      <div className="resume-layout">
        <form className="resume-form" onSubmit={handleSave}>
          <div className="resume-section">
            <h2>Resume information</h2>
            <label htmlFor="resumeTitle">Resume title</label>
            <input
              id="resumeTitle"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="My Developer Resume"
              required
            />
          </div>

          <div className="resume-section">
            <h2>Personal information</h2>
            <div className="resume-grid">
              {[
                ["fullName", "Full Name"],
                ["email", "Email"],
                ["phone", "Phone"],
                ["location", "Location"],
                ["linkedin", "LinkedIn URL"],
                ["portfolio", "Portfolio URL"],
              ].map(([name, label]) => (
                <div key={name}>
                  <label htmlFor={name}>{label}</label>
                  <input
                    id={name}
                    name={name}
                    value={formData.personalDetails[name] || ""}
                    onChange={handlePersonalChange}
                    placeholder={label}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="resume-section">
            <h2>Professional summary</h2>
            <textarea
              name="summary"
              value={formData.summary}
              onChange={handleChange}
              rows={5}
              placeholder="Your AI-generated professional summary will appear here. You can edit it."
            />
          </div>

          <div className="resume-section">
            <h2>Education</h2>
            {formData.education.map((item, index) => (
              <div className="resume-entry" key={index}>
                <input
                  aria-label="Degree"
                  placeholder="Degree"
                  value={item.degree || ""}
                  onChange={(e) => handleArrayChange("education", index, "degree", e.target.value)}
                />
                <input
                  aria-label="Institution"
                  placeholder="Institution"
                  value={item.institution || ""}
                  onChange={(e) => handleArrayChange("education", index, "institution", e.target.value)}
                />
                <input
                  aria-label="Graduation year"
                  placeholder="Graduation Year"
                  value={item.year || ""}
                  onChange={(e) => handleArrayChange("education", index, "year", e.target.value)}
                />
                <input
                  aria-label="Grade"
                  placeholder="Grade / CGPA"
                  value={item.grade || ""}
                  onChange={(e) => handleArrayChange("education", index, "grade", e.target.value)}
                />
                {formData.education.length > 1 && (
                  <button type="button" className="remove-entry" onClick={() => removeEntry("education", index)}>
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              className="add-entry"
              onClick={() => addEntry("education", { degree: "", institution: "", year: "", grade: "" })}
            >
              + Add Education
            </button>
          </div>

          <div className="resume-section">
            <h2>Experience & internships</h2>
            {formData.experience.map((item, index) => (
              <div className="resume-entry" key={index}>
                <input
                  placeholder="Company"
                  value={item.company || ""}
                  onChange={(e) => handleArrayChange("experience", index, "company", e.target.value)}
                />
                <input
                  placeholder="Job Position"
                  value={item.position || ""}
                  onChange={(e) => handleArrayChange("experience", index, "position", e.target.value)}
                />
                <input
                  placeholder="Duration"
                  value={item.duration || ""}
                  onChange={(e) => handleArrayChange("experience", index, "duration", e.target.value)}
                />
                <textarea
                  placeholder="Description"
                  rows={4}
                  value={item.description || ""}
                  onChange={(e) => handleArrayChange("experience", index, "description", e.target.value)}
                />
                {formData.experience.length > 1 && (
                  <button type="button" className="remove-entry" onClick={() => removeEntry("experience", index)}>
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              className="add-entry"
              onClick={() => addEntry("experience", { company: "", position: "", duration: "", description: "" })}
            >
              + Add Experience
            </button>
          </div>

          <div className="resume-section">
            <h2>Technical skills</h2>
            <label htmlFor="skillsText">Separate skills using commas</label>
            <textarea
              id="skillsText"
              value={skillsText}
              onChange={(e) => {
                setSkillsText(e.target.value);
                setFormData((prev) => ({
                  ...prev,
                  skills: e.target.value.split(",").map((skill) => skill.trim()).filter(Boolean),
                }));
              }}
              rows={3}
              placeholder="React, Node.js, MongoDB, Python..."
            />
          </div>

          <div className="resume-section">
            <h2>Projects</h2>
            {formData.projects.map((item, index) => (
              <div className="resume-entry" key={index}>
                <input
                  placeholder="Project Name"
                  value={item.name || ""}
                  onChange={(e) => handleArrayChange("projects", index, "name", e.target.value)}
                />
                <input
                  placeholder="Technologies Used"
                  value={item.technologies || ""}
                  onChange={(e) => handleArrayChange("projects", index, "technologies", e.target.value)}
                />
                <textarea
                  placeholder="Project Description"
                  rows={4}
                  value={item.description || ""}
                  onChange={(e) => handleArrayChange("projects", index, "description", e.target.value)}
                />
                {formData.projects.length > 1 && (
                  <button type="button" className="remove-entry" onClick={() => removeEntry("projects", index)}>
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              className="add-entry"
              onClick={() => addEntry("projects", { name: "", technologies: "", description: "" })}
            >
              + Add Project
            </button>
          </div>

          <div className="resume-section">
            <h2>Customize design</h2>
            <label htmlFor="themeColor">Theme color</label>
            <input
              id="themeColor"
              type="color"
              value={formData.themeColor}
              onChange={(e) => setFormData((prev) => ({ ...prev, themeColor: e.target.value }))}
            />

            <label htmlFor="fontFamily">Font family</label>
            <select
              id="fontFamily"
              value={formData.fontFamily}
              onChange={(e) => setFormData((prev) => ({ ...prev, fontFamily: e.target.value }))}
            >
              {["Arial", "Georgia", "Verdana", "Tahoma", "Times New Roman"].map((font) => (
                <option key={font} value={font}>{font}</option>
              ))}
            </select>

            <label htmlFor="layout">Layout</label>
            <select
              id="layout"
              value={formData.layout}
              onChange={(e) => setFormData((prev) => ({ ...prev, layout: e.target.value }))}
            >
              <option value="single">Single column</option>
              <option value="two-column">Two column (preview)</option>
            </select>
          </div>

          <div className="resume-actions">
            <button type="submit" className="save-resume-btn">
              {editingId ? "Update Resume" : "Save Resume"}
            </button>
            <button type="button" className="reset-resume-btn" onClick={resetForm}>
              New Resume
            </button>
          </div>
        </form>

        <aside className="resume-sidebar">
          <button
            type="button"
            className="download-pdf-btn"
            onClick={handleDownloadPdf}
            disabled={downloading}
          >
            {downloading ? "Preparing PDF..." : "↓ Download Resume PDF"}
          </button>

          <div
            id="resume-pdf-content"
            className={`live-resume-preview template-${formData.template} layout-${formData.layout}`}
            style={{
              "--resume-color": formData.themeColor,
              fontFamily: formData.fontFamily,
            }}
          >
            <div className="preview-header">
              <h2>{formData.personalDetails.fullName || "Your Name"}</h2>
              <p>
                {[formData.personalDetails.email, formData.personalDetails.phone]
                  .filter(Boolean).join(" | ")}
              </p>
              <p>{formData.personalDetails.location}</p>
              <p>
                {[formData.personalDetails.linkedin, formData.personalDetails.portfolio]
                  .filter(Boolean).join(" | ")}
              </p>
            </div>

            {formData.summary && (
              <section>
                <h3>PROFESSIONAL SUMMARY</h3>
                <p>{formData.summary}</p>
              </section>
            )}

            {formData.education.some((item) => item.degree || item.institution) && (
              <section>
                <h3>EDUCATION</h3>
                {formData.education.map((item, index) => (
                  <div key={index}>
                    <strong>{item.degree}</strong>
                    <p>{item.institution}</p>
                    <small>{[item.year, item.grade].filter(Boolean).join(" | ")}</small>
                  </div>
                ))}
              </section>
            )}

            {formData.experience.some((item) => item.company || item.position || item.description) && (
              <section>
                <h3>EXPERIENCE</h3>
                {formData.experience.map((item, index) => (
                  <div key={index}>
                    <strong>{item.position}</strong>
                    <p>{[item.company, item.duration].filter(Boolean).join(" | ")}</p>
                    <p>{item.description}</p>
                  </div>
                ))}
              </section>
            )}

            {formData.skills.length > 0 && (
              <section>
                <h3>TECHNICAL SKILLS</h3>
                <p>{formData.skills.join(" • ")}</p>
              </section>
            )}

            {formData.projects.some((item) => item.name || item.description) && (
              <section>
                <h3>PROJECTS</h3>
                {formData.projects.map((item, index) => (
                  <div key={index}>
                    <strong>{item.name}</strong>
                    <p>{item.technologies}</p>
                    <p>{item.description}</p>
                  </div>
                ))}
              </section>
            )}
          </div>

          <div className="saved-resumes">
            <h2>My Saved Resumes</h2>
            <p>Your previously saved resumes appear here.</p>

            {resumes.length === 0 ? (
              <div className="empty-resumes">No saved resumes yet.</div>
            ) : (
              resumes.map((resume) => (
                <div className="saved-resume-card" key={resume._id}>
                  <h3>{resume.title || "My Resume"}</h3>
                  <small>
                    {resume.updatedAt
                      ? `Updated ${new Date(resume.updatedAt).toLocaleDateString()}`
                      : "Saved resume"}
                  </small>
                  <div className="saved-resume-actions">
                    <button type="button" onClick={() => editResume(resume._id)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className="delete-resume"
                      onClick={() => deleteResume(resume._id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

export default ResumeBuilder;

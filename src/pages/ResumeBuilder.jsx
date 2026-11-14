import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import html2pdf from "html2pdf.js";


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
    return <div className="grid min-h-[55vh] place-items-center text-[15px] font-semibold text-slate-500">Loading Resume Builder...</div>;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_92%_0%,rgba(112,99,238,0.075),transparent_30%),#f6f7fb] px-[clamp(14px,3.4vw,54px)] py-5 sm:py-[38px] pb-14 font-sans text-[#172033]">
      <div className="mx-auto mb-7 flex max-w-[1500px] flex-col items-start justify-between gap-4 sm:flex-row sm:items-center sm:gap-6">
        <div>
          <p className="mb-2.5 inline-flex items-center gap-2 text-[11px] font-extrabold tracking-[1.7px] text-[#6558e8]">CAREEROS / RESUME STUDIO</p>
          <h1 className="text-[27px] font-extrabold leading-tight tracking-[-1.25px] text-[#151d31] sm:text-4xl">AI Resume Builder</h1>
          <p className="mt-2.5 max-w-[650px] text-sm leading-relaxed text-[#738096]">Create a tailored resume with Gemini AI, then review and customize it.</p>
        </div>
        <button
          type="button"
          className="min-h-[42px] shrink-0 rounded-[10px] border border-[#dedff0] bg-white px-[17px] text-[13px] font-bold text-[#3a4260] shadow-sm transition hover:-translate-y-px hover:border-[#c9c4ff] hover:bg-[#faf9ff]"
          onClick={() => navigate("/dashboard")}
        >
          Back to Dashboard
        </button>
      </div>

      {message && <div className="mx-auto mb-5 max-w-[1500px] rounded-[11px] border border-[#dcd8ff] bg-[#f2f0ff] px-4 py-3 text-[13px] font-semibold leading-relaxed text-[#5144bd]" role="status">{message}</div>}

      <section className="relative isolate mx-auto mb-[26px] max-w-[1500px] overflow-hidden rounded-[20px] border border-white/10 bg-[linear-gradient(115deg,#171d3c_0%,#28245f_55%,#5145b8_100%)] p-6 text-white shadow-[0_18px_42px_rgba(49,43,124,0.17)] sm:p-8">
        <div className="mb-6 max-w-[720px]">
          <span className="mb-3 inline-block text-[10px] font-extrabold tracking-[1.65px] text-[#c7c2ff]">CAREEROS AI • POWERED BY GEMINI</span>
          <h2 className="mb-2 text-[21px] font-extrabold tracking-tight text-white sm:text-[27px]">Build your resume with AI</h2>
          <p>
            Your saved profile is used as the starting point. Add a target role
            and extra details to tailor your resume.
          </p>
        </div>

        <label className="mt-4 mb-2 block text-xs font-bold text-[#f1f0ff]" htmlFor="targetRole">Target job role *</label>
        <input className="block min-h-[47px] w-full max-w-[620px] rounded-[10px] border border-[#e2e1ff]/70 bg-white px-[15px] py-[13px] text-[13px] text-[#20263a] shadow-sm outline-none placeholder:text-[#9aa1b2] focus:border-[#b6afff] focus:ring-[3px] focus:ring-[#c2bcff]/20" 
          id="targetRole"
          type="text"
          value={targetRole}
          onChange={(e) => setTargetRole(e.target.value)}
          placeholder="e.g. Full Stack Developer"
          maxLength={100}
        />

        <label className="mt-4 mb-2 block text-xs font-bold text-[#f1f0ff]" htmlFor="additionalInfo">Additional information (optional)</label>
        <textarea className="min-h-[108px] w-full resize-y rounded-[10px] border border-[#e2e1ff]/70 bg-white px-[15px] py-[13px] text-[13px] leading-relaxed text-[#20263a] shadow-sm outline-none placeholder:text-[#9aa1b2] focus:border-[#b6afff] focus:ring-[3px] focus:ring-[#c2bcff]/20" 
          id="additionalInfo"
          value={additionalInfo}
          onChange={(e) => setAdditionalInfo(e.target.value)}
          placeholder="Add relevant achievements, project details, internships, tools or job requirements. Only include accurate information."
          maxLength={5000}
          rows={4}
        />

        <div className="mt-1 flex flex-wrap items-center justify-between gap-3.5 max-[600px]:flex-col max-[600px]:items-start">
          <small>{additionalInfo.length}/5000 characters</small>
          <button
            type="button"
            className="mt-3.5 inline-flex min-h-[45px] items-center justify-center gap-2 rounded-[10px] border border-white bg-white px-5 text-[13px] font-bold text-[#40369f] shadow-md transition hover:-translate-y-0.5 hover:bg-[#f0efff] disabled:cursor-wait disabled:opacity-60 max-[600px]:w-full"
            onClick={handleGenerateAI}
            disabled={aiLoading}
          >
            {aiLoading ? "Generating your resume..." : "✦ Generate Resume with AI"}
          </button>
        </div>
      </section>

      {suggestions.length > 0 && (
        <section className="mx-auto mb-[26px] max-w-[1500px] rounded-[15px] border border-[#dcd8ff] bg-[#fbfaff] p-5 shadow-[0_12px_34px_rgba(24,34,58,0.055)] sm:px-6">
          <h3 className="mb-3 text-base font-extrabold text-[#28234f]">AI improvement suggestions</h3>
          <ul>
            {suggestions.map((suggestion, index) => (
              <li key={index}>{suggestion}</li>
            ))}
          </ul>
          <small>Only apply suggestions that accurately describe your experience.</small>
        </section>
      )}

      <section className="mx-auto mb-[26px] max-w-[1500px] rounded-[17px] border border-[#e7eaf1] bg-white p-5 shadow-[0_12px_34px_rgba(24,34,58,0.055)] sm:p-[25px]">
        <div className="mb-1">
          <h2 className="text-base font-extrabold text-[#202941]">Choose your resume template</h2>
          <p>Select a design for your professional resume.</p>
        </div>

        <div className="grid grid-cols-2 gap-2.5 min-[601px]:grid-cols-3 min-[851px]:grid-cols-5 sm:gap-3.5">
          {templates.map((template) => (
            <button
              type="button"
              key={template.id}
              className={`relative min-w-0 rounded-xl border p-3 text-left transition hover:-translate-y-0.5 hover:border-[#b9b2ff] hover:shadow-lg ${formData.template === template.id ? "border-[#6558e8] bg-[#fbfaff] shadow-[0_0_0_3px_rgba(101,88,232,0.09)]" : "border-[#e4e7ef] bg-white"}`}
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
                className="h-[120px] overflow-hidden rounded-[5px] border border-[#e6e8ef] bg-white p-3 shadow-sm sm:h-[142px]"
                style={{ borderTop: `5px solid ${template.color}` }}
              >
                <div className="my-2 h-2 w-[66%] rounded-[3px] bg-[#65718a]" />
                <div className="my-2 h-1 w-full rounded-[3px] bg-[#e0e4ec]" />
                <div className="my-2 h-1 w-[61%] rounded-[3px] bg-[#e0e4ec]" />
                <div className="mt-3 h-1.5 w-[46%] bg-[#7568e9]" />
                <div className="my-2 h-1 w-full rounded-[3px] bg-[#e0e4ec]" />
                <div className="my-2 h-1 w-[61%] rounded-[3px] bg-[#e0e4ec]" />
                <div className="mt-3 h-1.5 w-[46%] bg-[#7568e9]" />
                <div className="my-2 h-1 w-full rounded-[3px] bg-[#e0e4ec]" />
              </div>
              <h3 className="mt-3 mb-1 text-xs font-extrabold text-[#26314a]">{template.name}</h3>
              <p className="min-h-[29px] text-[10px] leading-snug text-[#8490a3]">{template.description}</p>
              {formData.template === template.id && (
                <span className="mt-2 inline-flex text-[10px] font-extrabold text-[#6558e8]">✓ Selected</span>
              )}
            </button>
          ))}
        </div>
      </section>

      <div className="mx-auto grid max-w-[1500px] grid-cols-1 items-start gap-6 min-[1121px]:grid-cols-[minmax(0,1.1fr)_minmax(350px,0.9fr)]">
        <form className="flex min-w-0 flex-col rounded-[17px] border border-[#e7eaf1] bg-white p-5 shadow-[0_12px_34px_rgba(24,34,58,0.055)] sm:p-[27px]" onSubmit={handleSave}>
          <div className="mb-6 border-b border-[#edf0f5] pb-6 last:mb-5">
            <h2 className="mb-[18px] flex items-center gap-2.5 text-[15px] font-extrabold text-[#202941] before:h-[17px] before:w-1 before:rounded before:bg-[#6558e8]">Resume information</h2>
            <label className="mb-2 mt-3 block text-[11px] font-bold text-[#4b566c]" htmlFor="resumeTitle">Resume title</label>
            <input className="mb-3 block min-h-[43px] w-full rounded-[9px] border border-[#e0e4ec] bg-white px-[13px] py-[11px] text-xs leading-relaxed text-[#273249] outline-none transition placeholder:text-[#a0a8b7] focus:border-[#9389f2] focus:bg-[#fdfdff] focus:ring-[3px] focus:ring-[#6558e8]/10" 
              id="resumeTitle"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="My Developer Resume"
              required
            />
          </div>

          <div className="mb-6 border-b border-[#edf0f5] pb-6 last:mb-5">
            <h2 className="mb-[18px] flex items-center gap-2.5 text-[15px] font-extrabold text-[#202941] before:h-[17px] before:w-1 before:rounded before:bg-[#6558e8]">Personal information</h2>
            <div className="grid grid-cols-1 gap-x-[15px] min-[601px]:grid-cols-2">
              {[
                ["fullName", "Full Name"],
                ["email", "Email"],
                ["phone", "Phone"],
                ["location", "Location"],
                ["linkedin", "LinkedIn URL"],
                ["portfolio", "Portfolio URL"],
              ].map(([name, label]) => (
                <div key={name}>
                  <label className="mb-2 mt-3 block text-[11px] font-bold text-[#4b566c]" htmlFor={name}>{label}</label>
                  <input className="mb-3 block min-h-[43px] w-full rounded-[9px] border border-[#e0e4ec] bg-white px-[13px] py-[11px] text-xs leading-relaxed text-[#273249] outline-none transition placeholder:text-[#a0a8b7] focus:border-[#9389f2] focus:bg-[#fdfdff] focus:ring-[3px] focus:ring-[#6558e8]/10" 
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

          <div className="mb-6 border-b border-[#edf0f5] pb-6 last:mb-5">
            <h2 className="mb-[18px] flex items-center gap-2.5 text-[15px] font-extrabold text-[#202941] before:h-[17px] before:w-1 before:rounded before:bg-[#6558e8]">Professional summary</h2>
            <textarea className="mb-3 block min-h-[43px] w-full rounded-[9px] border border-[#e0e4ec] bg-white px-[13px] py-[11px] text-xs leading-relaxed text-[#273249] outline-none transition placeholder:text-[#a0a8b7] focus:border-[#9389f2] focus:bg-[#fdfdff] focus:ring-[3px] focus:ring-[#6558e8]/10" 
              name="summary"
              value={formData.summary}
              onChange={handleChange}
              rows={5}
              placeholder="Your AI-generated professional summary will appear here. You can edit it."
            />
          </div>

          <div className="mb-6 border-b border-[#edf0f5] pb-6 last:mb-5">
            <h2 className="mb-[18px] flex items-center gap-2.5 text-[15px] font-extrabold text-[#202941] before:h-[17px] before:w-1 before:rounded before:bg-[#6558e8]">Education</h2>
            {formData.education.map((item, index) => (
              <div className="mb-3 grid grid-cols-1 gap-x-3 rounded-xl border border-[#e9ecf3] bg-[#fafbfe] p-4 min-[601px]:grid-cols-2" key={index}>
                <input className="mb-3 block min-h-[43px] w-full rounded-[9px] border border-[#e0e4ec] bg-white px-[13px] py-[11px] text-xs leading-relaxed text-[#273249] outline-none transition placeholder:text-[#a0a8b7] focus:border-[#9389f2] focus:bg-[#fdfdff] focus:ring-[3px] focus:ring-[#6558e8]/10" 
                  aria-label="Degree"
                  placeholder="Degree"
                  value={item.degree || ""}
                  onChange={(e) => handleArrayChange("education", index, "degree", e.target.value)}
                />
                <input className="mb-3 block min-h-[43px] w-full rounded-[9px] border border-[#e0e4ec] bg-white px-[13px] py-[11px] text-xs leading-relaxed text-[#273249] outline-none transition placeholder:text-[#a0a8b7] focus:border-[#9389f2] focus:bg-[#fdfdff] focus:ring-[3px] focus:ring-[#6558e8]/10" 
                  aria-label="Institution"
                  placeholder="Institution"
                  value={item.institution || ""}
                  onChange={(e) => handleArrayChange("education", index, "institution", e.target.value)}
                />
                <input className="mb-3 block min-h-[43px] w-full rounded-[9px] border border-[#e0e4ec] bg-white px-[13px] py-[11px] text-xs leading-relaxed text-[#273249] outline-none transition placeholder:text-[#a0a8b7] focus:border-[#9389f2] focus:bg-[#fdfdff] focus:ring-[3px] focus:ring-[#6558e8]/10" 
                  aria-label="Graduation year"
                  placeholder="Graduation Year"
                  value={item.year || ""}
                  onChange={(e) => handleArrayChange("education", index, "year", e.target.value)}
                />
                <input className="mb-3 block min-h-[43px] w-full rounded-[9px] border border-[#e0e4ec] bg-white px-[13px] py-[11px] text-xs leading-relaxed text-[#273249] outline-none transition placeholder:text-[#a0a8b7] focus:border-[#9389f2] focus:bg-[#fdfdff] focus:ring-[3px] focus:ring-[#6558e8]/10" 
                  aria-label="Grade"
                  placeholder="Grade / CGPA"
                  value={item.grade || ""}
                  onChange={(e) => handleArrayChange("education", index, "grade", e.target.value)}
                />
                {formData.education.length > 1 && (
                  <button type="button" className="inline-flex min-h-9 items-center justify-center justify-self-start rounded-[10px] bg-[#fff0f2] px-[13px] text-[11px] font-bold text-[#d94b61] transition hover:bg-[#ffe3e8]" onClick={() => removeEntry("education", index)}>
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              className="inline-flex min-h-9 items-center justify-center gap-2 rounded-[10px] border border-[#dedbff] bg-[#f3f1ff] px-[13px] text-[11px] font-bold text-[#574bd0] transition hover:border-[#bcb5ff] hover:bg-[#eae7ff]"
              onClick={() => addEntry("education", { degree: "", institution: "", year: "", grade: "" })}
            >
              + Add Education
            </button>
          </div>

          <div className="mb-6 border-b border-[#edf0f5] pb-6 last:mb-5">
            <h2 className="mb-[18px] flex items-center gap-2.5 text-[15px] font-extrabold text-[#202941] before:h-[17px] before:w-1 before:rounded before:bg-[#6558e8]">Experience & internships</h2>
            {formData.experience.map((item, index) => (
              <div className="mb-3 grid grid-cols-1 gap-x-3 rounded-xl border border-[#e9ecf3] bg-[#fafbfe] p-4 min-[601px]:grid-cols-2" key={index}>
                <input className="mb-3 block min-h-[43px] w-full rounded-[9px] border border-[#e0e4ec] bg-white px-[13px] py-[11px] text-xs leading-relaxed text-[#273249] outline-none transition placeholder:text-[#a0a8b7] focus:border-[#9389f2] focus:bg-[#fdfdff] focus:ring-[3px] focus:ring-[#6558e8]/10" 
                  placeholder="Company"
                  value={item.company || ""}
                  onChange={(e) => handleArrayChange("experience", index, "company", e.target.value)}
                />
                <input className="mb-3 block min-h-[43px] w-full rounded-[9px] border border-[#e0e4ec] bg-white px-[13px] py-[11px] text-xs leading-relaxed text-[#273249] outline-none transition placeholder:text-[#a0a8b7] focus:border-[#9389f2] focus:bg-[#fdfdff] focus:ring-[3px] focus:ring-[#6558e8]/10" 
                  placeholder="Job Position"
                  value={item.position || ""}
                  onChange={(e) => handleArrayChange("experience", index, "position", e.target.value)}
                />
                <input className="mb-3 block min-h-[43px] w-full rounded-[9px] border border-[#e0e4ec] bg-white px-[13px] py-[11px] text-xs leading-relaxed text-[#273249] outline-none transition placeholder:text-[#a0a8b7] focus:border-[#9389f2] focus:bg-[#fdfdff] focus:ring-[3px] focus:ring-[#6558e8]/10" 
                  placeholder="Duration"
                  value={item.duration || ""}
                  onChange={(e) => handleArrayChange("experience", index, "duration", e.target.value)}
                />
                <textarea className="mb-3 block min-h-[43px] w-full rounded-[9px] border border-[#e0e4ec] bg-white px-[13px] py-[11px] text-xs leading-relaxed text-[#273249] outline-none transition placeholder:text-[#a0a8b7] focus:border-[#9389f2] focus:bg-[#fdfdff] focus:ring-[3px] focus:ring-[#6558e8]/10" 
                  placeholder="Description"
                  rows={4}
                  value={item.description || ""}
                  onChange={(e) => handleArrayChange("experience", index, "description", e.target.value)}
                />
                {formData.experience.length > 1 && (
                  <button type="button" className="inline-flex min-h-9 items-center justify-center justify-self-start rounded-[10px] bg-[#fff0f2] px-[13px] text-[11px] font-bold text-[#d94b61] transition hover:bg-[#ffe3e8]" onClick={() => removeEntry("experience", index)}>
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              className="inline-flex min-h-9 items-center justify-center gap-2 rounded-[10px] border border-[#dedbff] bg-[#f3f1ff] px-[13px] text-[11px] font-bold text-[#574bd0] transition hover:border-[#bcb5ff] hover:bg-[#eae7ff]"
              onClick={() => addEntry("experience", { company: "", position: "", duration: "", description: "" })}
            >
              + Add Experience
            </button>
          </div>

          <div className="mb-6 border-b border-[#edf0f5] pb-6 last:mb-5">
            <h2 className="mb-[18px] flex items-center gap-2.5 text-[15px] font-extrabold text-[#202941] before:h-[17px] before:w-1 before:rounded before:bg-[#6558e8]">Technical skills</h2>
            <label className="mb-2 mt-3 block text-[11px] font-bold text-[#4b566c]" htmlFor="skillsText">Separate skills using commas</label>
            <textarea className="mb-3 block min-h-[43px] w-full rounded-[9px] border border-[#e0e4ec] bg-white px-[13px] py-[11px] text-xs leading-relaxed text-[#273249] outline-none transition placeholder:text-[#a0a8b7] focus:border-[#9389f2] focus:bg-[#fdfdff] focus:ring-[3px] focus:ring-[#6558e8]/10" 
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

          <div className="mb-6 border-b border-[#edf0f5] pb-6 last:mb-5">
            <h2 className="mb-[18px] flex items-center gap-2.5 text-[15px] font-extrabold text-[#202941] before:h-[17px] before:w-1 before:rounded before:bg-[#6558e8]">Projects</h2>
            {formData.projects.map((item, index) => (
              <div className="mb-3 grid grid-cols-1 gap-x-3 rounded-xl border border-[#e9ecf3] bg-[#fafbfe] p-4 min-[601px]:grid-cols-2" key={index}>
                <input className="mb-3 block min-h-[43px] w-full rounded-[9px] border border-[#e0e4ec] bg-white px-[13px] py-[11px] text-xs leading-relaxed text-[#273249] outline-none transition placeholder:text-[#a0a8b7] focus:border-[#9389f2] focus:bg-[#fdfdff] focus:ring-[3px] focus:ring-[#6558e8]/10" 
                  placeholder="Project Name"
                  value={item.name || ""}
                  onChange={(e) => handleArrayChange("projects", index, "name", e.target.value)}
                />
                <input className="mb-3 block min-h-[43px] w-full rounded-[9px] border border-[#e0e4ec] bg-white px-[13px] py-[11px] text-xs leading-relaxed text-[#273249] outline-none transition placeholder:text-[#a0a8b7] focus:border-[#9389f2] focus:bg-[#fdfdff] focus:ring-[3px] focus:ring-[#6558e8]/10" 
                  placeholder="Technologies Used"
                  value={item.technologies || ""}
                  onChange={(e) => handleArrayChange("projects", index, "technologies", e.target.value)}
                />
                <textarea className="mb-3 block min-h-[43px] w-full rounded-[9px] border border-[#e0e4ec] bg-white px-[13px] py-[11px] text-xs leading-relaxed text-[#273249] outline-none transition placeholder:text-[#a0a8b7] focus:border-[#9389f2] focus:bg-[#fdfdff] focus:ring-[3px] focus:ring-[#6558e8]/10" 
                  placeholder="Project Description"
                  rows={4}
                  value={item.description || ""}
                  onChange={(e) => handleArrayChange("projects", index, "description", e.target.value)}
                />
                {formData.projects.length > 1 && (
                  <button type="button" className="inline-flex min-h-9 items-center justify-center justify-self-start rounded-[10px] bg-[#fff0f2] px-[13px] text-[11px] font-bold text-[#d94b61] transition hover:bg-[#ffe3e8]" onClick={() => removeEntry("projects", index)}>
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              className="inline-flex min-h-9 items-center justify-center gap-2 rounded-[10px] border border-[#dedbff] bg-[#f3f1ff] px-[13px] text-[11px] font-bold text-[#574bd0] transition hover:border-[#bcb5ff] hover:bg-[#eae7ff]"
              onClick={() => addEntry("projects", { name: "", technologies: "", description: "" })}
            >
              + Add Project
            </button>
          </div>

          <div className="mb-6 border-b border-[#edf0f5] pb-6 last:mb-5">
            <h2 className="mb-[18px] flex items-center gap-2.5 text-[15px] font-extrabold text-[#202941] before:h-[17px] before:w-1 before:rounded before:bg-[#6558e8]">Customize design</h2>
            <label className="mb-2 mt-3 block text-[11px] font-bold text-[#4b566c]" htmlFor="themeColor">Theme color</label>
            <input id="themeColor"
              type="color"
              className="mb-3 h-[42px] w-[66px] cursor-pointer rounded-md border border-[#e0e4ec] p-1"
              value={formData.themeColor}
              onChange={(e) => setFormData((prev) => ({ ...prev, themeColor: e.target.value }))}
            />

            <label className="mb-2 mt-3 block text-[11px] font-bold text-[#4b566c]" htmlFor="fontFamily">Font family</label>
            <select className="mb-3 block min-h-[43px] w-full rounded-[9px] border border-[#e0e4ec] bg-white px-[13px] py-[11px] text-xs leading-relaxed text-[#273249] outline-none transition placeholder:text-[#a0a8b7] focus:border-[#9389f2] focus:bg-[#fdfdff] focus:ring-[3px] focus:ring-[#6558e8]/10" 
              id="fontFamily"
              value={formData.fontFamily}
              onChange={(e) => setFormData((prev) => ({ ...prev, fontFamily: e.target.value }))}
            >
              {["Arial", "Georgia", "Verdana", "Tahoma", "Times New Roman"].map((font) => (
                <option key={font} value={font}>{font}</option>
              ))}
            </select>

            <label className="mb-2 mt-3 block text-[11px] font-bold text-[#4b566c]" htmlFor="layout">Layout</label>
            <select className="mb-3 block min-h-[43px] w-full rounded-[9px] border border-[#e0e4ec] bg-white px-[13px] py-[11px] text-xs leading-relaxed text-[#273249] outline-none transition placeholder:text-[#a0a8b7] focus:border-[#9389f2] focus:bg-[#fdfdff] focus:ring-[3px] focus:ring-[#6558e8]/10" 
              id="layout"
              value={formData.layout}
              onChange={(e) => setFormData((prev) => ({ ...prev, layout: e.target.value }))}
            >
              <option value="single">Single column</option>
              <option value="two-column">Two column (preview)</option>
            </select>
          </div>

          <div className="flex flex-wrap gap-2.5 pt-0.5 max-[600px]:flex-col">
            <button type="submit" className="inline-flex min-h-11 items-center justify-center rounded-[10px] border border-[#6558e8] bg-[#6558e8] px-5 text-[13px] font-bold text-white shadow-md transition hover:-translate-y-px hover:border-[#5144d6] hover:bg-[#5144d6] max-[600px]:w-full">
              {editingId ? "Update Resume" : "Save Resume"}
            </button>
            <button type="button" className="inline-flex min-h-11 items-center justify-center rounded-[10px] border border-[#e0e4ec] bg-white px-5 text-[13px] font-bold text-[#566176] transition hover:border-[#c9c4ff] hover:bg-[#faf9ff] max-[600px]:w-full" onClick={resetForm}>
              New Resume
            </button>
          </div>
        </form>

        <aside className="flex min-w-0 flex-col gap-[15px] min-[1121px]:sticky min-[1121px]:top-[22px]">
          <button
            type="button"
            className="inline-flex min-h-[47px] w-full items-center justify-center rounded-[10px] border border-[#16835d] bg-[#16835d] px-[18px] text-[13px] font-bold text-white shadow-md transition hover:-translate-y-px hover:bg-[#106d4d] disabled:cursor-wait disabled:opacity-60"
            onClick={handleDownloadPdf}
            disabled={downloading}
          >
            {downloading ? "Preparing PDF..." : "↓ Download Resume PDF"}
          </button>

          <div
            id="resume-pdf-content"
            className={`min-h-[500px] w-full overflow-visible rounded-[7px] border border-[#e5e8ef] bg-white px-5 py-[25px] text-[#252525] shadow-[0_10px_28px_rgba(26,34,54,0.09)] [overflow-wrap:anywhere] sm:min-h-[650px] sm:px-[30px] sm:py-[34px] ${formData.template === "modern" ? "border-t-[6px]" : ""} ${formData.template === "professional" ? "border-t-4 border-t-double" : ""} ${formData.template === "creative" ? "border-l-[7px]" : ""} ${formData.template === "ats" ? "border-[#d8d8d8] shadow-none text-[#111]" : ""}`}
            style={{
              "--resume-color": formData.themeColor,
              fontFamily: formData.fontFamily,
            }}
          >
            <div className={`mb-5 border-b-2 pb-4 text-center ${["professional","minimal","creative"].includes(formData.template) ? "text-left" : ""}`}>
              <h2 className="mb-2 text-[23px] font-extrabold tracking-tight" style={{ color: formData.themeColor }}>{formData.personalDetails.fullName || "Your Name"}</h2>
              <p className="my-1 text-[9px] leading-relaxed text-[#555]">
                {[formData.personalDetails.email, formData.personalDetails.phone]
                  .filter(Boolean).join(" | ")}
              </p>
              <p className="my-1 text-[9px] leading-relaxed text-[#555]">{formData.personalDetails.location}</p>
              <p className="my-1 text-[9px] leading-relaxed text-[#555]">
                {[formData.personalDetails.linkedin, formData.personalDetails.portfolio]
                  .filter(Boolean).join(" | ")}
              </p>
            </div>

            {formData.summary && (
              <section className="mb-5 break-inside-avoid">
                <h3 className="mb-2 border-b border-[#dedede] pb-1.5 text-[10px] font-extrabold tracking-[0.85px]" style={{ color: formData.template === "ats" ? "#111" : formData.themeColor }}>PROFESSIONAL SUMMARY</h3>
                <p className="my-1 whitespace-pre-wrap text-[9px] leading-relaxed text-[#3d3d3d]">{formData.summary}</p>
              </section>
            )}

            {formData.education.some((item) => item.degree || item.institution) && (
              <section className="mb-5 break-inside-avoid">
                <h3 className="mb-2 border-b border-[#dedede] pb-1.5 text-[10px] font-extrabold tracking-[0.85px]" style={{ color: formData.template === "ats" ? "#111" : formData.themeColor }}>EDUCATION</h3>
                {formData.education.map((item, index) => (
                  <div key={index}>
                    <strong>{item.degree}</strong>
                    <p className="my-1 text-[9px] text-[#3d3d3d]">{item.institution}</p>
                    <small className="text-[8px] text-[#666]">{[item.year, item.grade].filter(Boolean).join(" | ")}</small>
                  </div>
                ))}
              </section>
            )}

            {formData.experience.some((item) => item.company || item.position || item.description) && (
              <section className="mb-5 break-inside-avoid">
                <h3 className="mb-2 border-b border-[#dedede] pb-1.5 text-[10px] font-extrabold tracking-[0.85px]" style={{ color: formData.template === "ats" ? "#111" : formData.themeColor }}>EXPERIENCE</h3>
                {formData.experience.map((item, index) => (
                  <div key={index}>
                    <strong>{item.position}</strong>
                    <p className="my-1 text-[9px] text-[#3d3d3d]">{[item.company, item.duration].filter(Boolean).join(" | ")}</p>
                    <p className="my-1 whitespace-pre-wrap text-[9px] leading-relaxed text-[#3d3d3d]">{item.description}</p>
                  </div>
                ))}
              </section>
            )}

            {formData.skills.length > 0 && (
              <section className="mb-5 break-inside-avoid">
                <h3 className="mb-2 border-b border-[#dedede] pb-1.5 text-[10px] font-extrabold tracking-[0.85px]" style={{ color: formData.template === "ats" ? "#111" : formData.themeColor }}>TECHNICAL SKILLS</h3>
                <p className="my-1 text-[9px] leading-relaxed text-[#3d3d3d]">{formData.skills.join(" • ")}</p>
              </section>
            )}

            {formData.projects.some((item) => item.name || item.description) && (
              <section className="mb-5 break-inside-avoid">
                <h3 className="mb-2 border-b border-[#dedede] pb-1.5 text-[10px] font-extrabold tracking-[0.85px]" style={{ color: formData.template === "ats" ? "#111" : formData.themeColor }}>PROJECTS</h3>
                {formData.projects.map((item, index) => (
                  <div key={index}>
                    <strong>{item.name}</strong>
                    <p className="my-1 text-[9px] text-[#3d3d3d]">{item.technologies}</p>
                    <p className="my-1 whitespace-pre-wrap text-[9px] leading-relaxed text-[#3d3d3d]">{item.description}</p>
                  </div>
                ))}
              </section>
            )}
          </div>

          <div className="min-w-0 rounded-[17px] border border-[#e7eaf1] bg-white p-5 shadow-[0_12px_34px_rgba(24,34,58,0.055)] sm:p-[22px]">
            <h2 className="text-[15px] font-extrabold text-[#202941]">My Saved Resumes</h2>
            <p className="my-2 mb-4 text-[11px] leading-relaxed text-[#738096]">Your previously saved resumes appear here.</p>

            {resumes.length === 0 ? (
              <div className="rounded-[10px] border border-dashed border-[#dfe3ec] px-3 py-6 text-center text-xs text-[#8992a4]">No saved resumes yet.</div>
            ) : (
              resumes.map((resume) => (
                <div className="mt-3 rounded-[11px] border border-[#e8ebf2] bg-[#fbfcff] p-[15px] transition hover:-translate-y-px hover:border-[#c9c4ff] hover:shadow-md" key={resume._id}>
                  <h3 className="mb-1.5 text-xs font-extrabold text-[#27324a]">{resume.title || "My Resume"}</h3>
                  <small>
                    {resume.updatedAt
                      ? `Updated ${new Date(resume.updatedAt).toLocaleDateString()}`
                      : "Saved resume"}
                  </small>
                  <div className="mt-3 flex gap-2">
                    <button type="button" onClick={() => editResume(resume._id)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className="rounded-[8px] border border-[#ffe0e5] bg-[#fff1f3] px-3 py-1.5 text-[10px] font-bold text-[#ca4057] hover:bg-[#ffe5e9]"
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

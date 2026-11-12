import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./Profile.css";

const API_URL = "http://localhost:5000/api/profile";

const emptyEducation = {
  institution: "",
  specialization: "",
  graduationYear: "",
  grade: "",
};

const emptyExperience = {
  jobTitle: "",
  company: "",
  duration: "",
  description: "",
};

const emptyCertification = {
  name: "",
  issuingOrganization: "",
  issueYear: "",
};

function Profile() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState({
    fullName: "",
    email: "",
    phone: "",
    location: "",
    education: "",
    educationDetails: { ...emptyEducation },
    skills: "",
    targetRole: "",
    careerPreferences: {
      industry: "",
      preferredLocation: "",
      workMode: "",
    },
    experience: [],
    certifications: [],
    about: "",
    linkedin: "",
    github: "",
    portfolio: "",
  });

  const [savedProfile, setSavedProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [photoPreview, setPhotoPreview] = useState("");

  useEffect(() => {
    async function fetchProfile() {
      const token = sessionStorage.getItem("token");

      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      try {
        const response = await axios.get(API_URL, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const user = response.data.user;

        const data = {
          fullName: user.fullName || "",
          email: user.email || "",
          phone: user.phone || "",
          location: user.location || "",
          education: user.education || "",
          educationDetails: {
            ...emptyEducation,
            ...(user.educationDetails || {}),
          },
          skills: user.skills || "",
          targetRole: user.targetRole || "",
          careerPreferences: {
            industry: "",
            preferredLocation: "",
            workMode: "",
            ...(user.careerPreferences || {}),
          },
          experience: user.experience || [],
          certifications: user.certifications || [],
          about: user.about || "",
          linkedin: user.linkedin || "",
          github: user.github || "",
          portfolio: user.portfolio || "",
        };

        setProfile(data);
        setSavedProfile(data);
      } catch (error) {
        if (error.response?.status === 401) {
          sessionStorage.removeItem("token");
          sessionStorage.removeItem("user");
          navigate("/login", { replace: true });
        } else {
          setMessage("Unable to load your profile.");
        }
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [navigate]);

  function handleChange(event) {
    const { name, value } = event.target;

    setProfile((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function handleNestedChange(section, field, value) {
    setProfile((previous) => ({
      ...previous,
      [section]: {
        ...previous[section],
        [field]: value,
      },
    }));
  }

  function handleArrayChange(section, index, field, value) {
    setProfile((previous) => ({
      ...previous,
      [section]: previous[section].map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  }

  function addEntry(section) {
    const newEntry =
      section === "experience"
        ? { ...emptyExperience }
        : { ...emptyCertification };

    setProfile((previous) => ({
      ...previous,
      [section]: [...previous[section], newEntry],
    }));
  }

  function removeEntry(section, index) {
    setProfile((previous) => ({
      ...previous,
      [section]: previous[section].filter((_, i) => i !== index),
    }));
  }

  async function handleSave(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const token = sessionStorage.getItem("token");

      const response = await axios.put(API_URL, profile, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const user = response.data.user;

      const updated = {
        ...profile,
        fullName: user.fullName || "",
        email: user.email || "",
        educationDetails: {
          ...emptyEducation,
          ...(user.educationDetails || {}),
        },
        careerPreferences: {
          industry: "",
          preferredLocation: "",
          workMode: "",
          ...(user.careerPreferences || {}),
        },
        experience: user.experience || [],
        certifications: user.certifications || [],
      };

      setProfile(updated);
      setSavedProfile(updated);
      setIsEditing(false);
      setMessage("Profile saved successfully!");
    } catch (error) {
      if (error.response?.status === 401) {
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
        navigate("/login", { replace: true });
      } else {
        setMessage(
          error.response?.data?.message ||
            "Unable to save profile. Please try again."
        );
      }
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setProfile(savedProfile);
    setIsEditing(false);
    setMessage("");
  }

  function handlePhotoChange(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setMessage("Please select a JPG, PNG, or WebP image.");
      event.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setMessage("Photo must be smaller than 2 MB.");
      event.target.value = "";
      return;
    }

    setPhotoPreview(URL.createObjectURL(file));
    setMessage("");
  }

  if (loading) {
    return <div className="profile-loading">Loading profile...</div>;
  }

  const completionFields = [
    profile.fullName,
    profile.phone,
    profile.location,
    profile.education,
    profile.educationDetails?.institution,
    profile.educationDetails?.specialization,
    profile.skills,
    profile.targetRole,
    profile.careerPreferences?.industry,
    profile.about,
    profile.linkedin,
    profile.github,
  ];

  const completion = Math.round(
    (completionFields.filter((value) => value?.trim()).length /
      completionFields.length) *
      100
  );

  return (
    <div className="profile-page">
      <header className="profile-topbar">
        <Link to="/dashboard" className="profile-brand">
          Career<span>OS</span>
        </Link>

        <nav>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/profile" className="profile-nav-active">
            My Profile
          </Link>
        </nav>

        <Link to="/dashboard" className="back-dashboard">
          ← Dashboard
        </Link>
      </header>

      <main className="profile-container">
        <div className="profile-page-heading">
          <div>
            <p className="profile-eyebrow">ACCOUNT MANAGEMENT</p>
            <h1>My Profile</h1>
            <p>Manage your personal details and career information.</p>
          </div>

          {!isEditing && (
            <button
              type="button"
              className="profile-edit-btn"
              onClick={() => {
                setIsEditing(true);
                setMessage("");
              }}
            >
              ✎ Edit Profile
            </button>
          )}
        </div>

        {message && (
          <div className="profile-message" role="status">
            {message}
          </div>
        )}

        <section className="profile-hero">
          <div className="profile-avatar">
            {photoPreview ? (
              <img src={photoPreview} alt="Profile" />
            ) : (
              (profile.fullName || "U").charAt(0).toUpperCase()
            )}
          </div>

          <div className="profile-hero-info">
            <h2>{profile.fullName || "Your Name"}</h2>
            <p>{profile.targetRole || "Add your target job role"}</p>
            <span>✉ {profile.email}</span>
          </div>

          <div className="profile-progress">
            <div className="progress-heading">
              <span>Profile Completion</span>
              <strong>{completion}%</strong>
            </div>
            <div className="profile-progress-track">
              <div
                className="profile-progress-fill"
                style={{ width: `${completion}%` }}
              />
            </div>
            <small>Complete your profile to improve your career readiness.</small>
          </div>
        </section>

        <form onSubmit={handleSave}>
          {/* PERSONAL INFORMATION */}
          <section className="profile-content-card">
            <div className="profile-card-heading">
              <div>
                <h2>Personal Information</h2>
                <p>Your basic contact information</p>
              </div>
              <span>01</span>
            </div>

            <div className="profile-photo-upload">
              <div className="small-avatar">
                {photoPreview ? (
                  <img src={photoPreview} alt="Profile preview" />
                ) : (
                  (profile.fullName || "U").charAt(0).toUpperCase()
                )}
              </div>

              <div>
                <label htmlFor="profilePhoto">Profile Photo</label>
                <p>JPG, PNG or WebP. Maximum 2 MB.</p>
                <input
                  id="profilePhoto"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoChange}
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div className="profile-form-grid">
              <div className="profile-field">
                <label>Full Name</label>
                <input
                  name="fullName"
                  value={profile.fullName}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                />
              </div>

              <div className="profile-field">
                <label>Email Address</label>
                <input value={profile.email} type="email" disabled />
              </div>

              <div className="profile-field">
                <label>Phone Number</label>
                <input
                  name="phone"
                  value={profile.phone}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="Enter phone number"
                />
              </div>

              <div className="profile-field">
                <label>Location</label>
                <input
                  name="location"
                  value={profile.location}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="City, State"
                />
              </div>
            </div>
          </section>

          {/* EDUCATION */}
          <section className="profile-content-card">
            <div className="profile-card-heading">
              <div>
                <h2>Education Details</h2>
                <p>Your academic background</p>
              </div>
              <span>02</span>
            </div>

            <div className="profile-form-grid">
              <div className="profile-field">
                <label>Qualification</label>
                <input
                  name="education"
                  value={profile.education}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="B.E., B.Tech, Diploma..."
                />
              </div>

              <div className="profile-field">
                <label>College / University</label>
                <input
                  value={profile.educationDetails.institution}
                  onChange={(e) =>
                    handleNestedChange(
                      "educationDetails",
                      "institution",
                      e.target.value
                    )
                  }
                  disabled={!isEditing}
                  placeholder="Institution name"
                />
              </div>

              <div className="profile-field">
                <label>Branch / Specialization</label>
                <input
                  value={profile.educationDetails.specialization}
                  onChange={(e) =>
                    handleNestedChange(
                      "educationDetails",
                      "specialization",
                      e.target.value
                    )
                  }
                  disabled={!isEditing}
                  placeholder="Computer Engineering"
                />
              </div>

              <div className="profile-field">
                <label>Graduation Year</label>
                <input
                  value={profile.educationDetails.graduationYear}
                  onChange={(e) =>
                    handleNestedChange(
                      "educationDetails",
                      "graduationYear",
                      e.target.value
                    )
                  }
                  disabled={!isEditing}
                  placeholder="2027"
                />
              </div>

              <div className="profile-field">
                <label>CGPA / Percentage</label>
                <input
                  value={profile.educationDetails.grade}
                  onChange={(e) =>
                    handleNestedChange(
                      "educationDetails",
                      "grade",
                      e.target.value
                    )
                  }
                  disabled={!isEditing}
                  placeholder="8.5 CGPA or 85%"
                />
              </div>
            </div>
          </section>

          {/* SKILLS */}
          <section className="profile-content-card">
            <div className="profile-card-heading">
              <div>
                <h2>Skills & Expertise</h2>
                <p>Your technical and professional skills</p>
              </div>
              <span>03</span>
            </div>

            <div className="profile-form-grid">
              <div className="profile-field">
                <label>Target Job Role</label>
                <input
                  name="targetRole"
                  value={profile.targetRole}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="MERN Stack Developer"
                />
              </div>

              <div className="profile-field">
                <label>Technical Skills</label>
                <input
                  name="skills"
                  value={profile.skills}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="React, Python, MongoDB..."
                />
              </div>
            </div>
          </section>

          {/* CAREER PREFERENCES */}
          <section className="profile-content-card">
            <div className="profile-card-heading">
              <div>
                <h2>Career Preferences</h2>
                <p>Tell us what kind of opportunities you prefer</p>
              </div>
              <span>04</span>
            </div>

            <div className="profile-form-grid">
              <div className="profile-field">
                <label>Preferred Industry</label>
                <input
                  value={profile.careerPreferences.industry}
                  onChange={(e) =>
                    handleNestedChange(
                      "careerPreferences",
                      "industry",
                      e.target.value
                    )
                  }
                  disabled={!isEditing}
                  placeholder="Information Technology"
                />
              </div>

              <div className="profile-field">
                <label>Preferred Job Location</label>
                <input
                  value={profile.careerPreferences.preferredLocation}
                  onChange={(e) =>
                    handleNestedChange(
                      "careerPreferences",
                      "preferredLocation",
                      e.target.value
                    )
                  }
                  disabled={!isEditing}
                  placeholder="Ahmedabad, Gujarat"
                />
              </div>

              <div className="profile-field">
                <label>Preferred Work Mode</label>
                <select
                  value={profile.careerPreferences.workMode}
                  onChange={(e) =>
                    handleNestedChange(
                      "careerPreferences",
                      "workMode",
                      e.target.value
                    )
                  }
                  disabled={!isEditing}
                >
                  <option value="">Select work mode</option>
                  <option value="On-site">On-site</option>
                  <option value="Remote">Remote</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>
            </div>
          </section>

          {/* EXPERIENCE */}
          <section className="profile-content-card">
            <div className="profile-card-heading">
              <div>
                <h2>Experience & Internships</h2>
                <p>Add your work experience and internships</p>
              </div>
              <span>05</span>
            </div>

            {profile.experience.map((item, index) => (
              <div className="repeat-entry" key={index}>
                <div className="repeat-entry-heading">
                  <strong>Experience {index + 1}</strong>
                  {isEditing && (
                    <button
                      type="button"
                      className="remove-entry-btn"
                      onClick={() => removeEntry("experience", index)}
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="profile-form-grid">
                  <div className="profile-field">
                    <label>Job Title</label>
                    <input
                      value={item.jobTitle}
                      disabled={!isEditing}
                      onChange={(e) =>
                        handleArrayChange(
                          "experience",
                          index,
                          "jobTitle",
                          e.target.value
                        )
                      }
                      placeholder="Web Development Intern"
                    />
                  </div>

                  <div className="profile-field">
                    <label>Company</label>
                    <input
                      value={item.company}
                      disabled={!isEditing}
                      onChange={(e) =>
                        handleArrayChange(
                          "experience",
                          index,
                          "company",
                          e.target.value
                        )
                      }
                      placeholder="Company name"
                    />
                  </div>

                  <div className="profile-field full-width">
                    <label>Duration</label>
                    <input
                      value={item.duration}
                      disabled={!isEditing}
                      onChange={(e) =>
                        handleArrayChange(
                          "experience",
                          index,
                          "duration",
                          e.target.value
                        )
                      }
                      placeholder="2 Months"
                    />
                  </div>

                  <div className="profile-field full-width">
                    <label>Description</label>
                    <textarea
                      rows={3}
                      value={item.description}
                      disabled={!isEditing}
                      onChange={(e) =>
                        handleArrayChange(
                          "experience",
                          index,
                          "description",
                          e.target.value
                        )
                      }
                      placeholder="Describe your responsibilities..."
                    />
                  </div>
                </div>
              </div>
            ))}

            {isEditing && (
              <button
                type="button"
                className="add-entry-btn"
                onClick={() => addEntry("experience")}
              >
                + Add Experience
              </button>
            )}
          </section>

          {/* CERTIFICATIONS */}
          <section className="profile-content-card">
            <div className="profile-card-heading">
              <div>
                <h2>Certifications</h2>
                <p>Add your completed courses and certificates</p>
              </div>
              <span>06</span>
            </div>

            {profile.certifications.map((item, index) => (
              <div className="repeat-entry" key={index}>
                <div className="repeat-entry-heading">
                  <strong>Certification {index + 1}</strong>
                  {isEditing && (
                    <button
                      type="button"
                      className="remove-entry-btn"
                      onClick={() =>
                        removeEntry("certifications", index)
                      }
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="profile-form-grid">
                  <div className="profile-field">
                    <label>Certificate Name</label>
                    <input
                      value={item.name}
                      disabled={!isEditing}
                      onChange={(e) =>
                        handleArrayChange(
                          "certifications",
                          index,
                          "name",
                          e.target.value
                        )
                      }
                      placeholder="Power BI for Beginners"
                    />
                  </div>

                  <div className="profile-field">
                    <label>Issuing Organization</label>
                    <input
                      value={item.issuingOrganization}
                      disabled={!isEditing}
                      onChange={(e) =>
                        handleArrayChange(
                          "certifications",
                          index,
                          "issuingOrganization",
                          e.target.value
                        )
                      }
                      placeholder="Organization name"
                    />
                  </div>

                  <div className="profile-field">
                    <label>Issue Year</label>
                    <input
                      value={item.issueYear}
                      disabled={!isEditing}
                      onChange={(e) =>
                        handleArrayChange(
                          "certifications",
                          index,
                          "issueYear",
                          e.target.value
                        )
                      }
                      placeholder="2025"
                    />
                  </div>
                </div>
              </div>
            ))}

            {isEditing && (
              <button
                type="button"
                className="add-entry-btn"
                onClick={() => addEntry("certifications")}
              >
                + Add Certification
              </button>
            )}
          </section>

          {/* SUMMARY AND SOCIAL LINKS */}
          <section className="profile-content-card">
            <div className="profile-card-heading">
              <div>
                <h2>Professional Summary & Links</h2>
                <p>Introduce yourself and share your professional work</p>
              </div>
              <span>07</span>
            </div>

            <div className="profile-form-grid">
              <div className="profile-field full-width">
                <label>About Me</label>
                <textarea
                  name="about"
                  value={profile.about}
                  onChange={handleChange}
                  disabled={!isEditing}
                  rows={4}
                  placeholder="Write a short professional introduction..."
                />
              </div>

              <div className="profile-field">
                <label>LinkedIn Profile</label>
                <input
                  name="linkedin"
                  value={profile.linkedin}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="https://linkedin.com/in/..."
                />
              </div>

              <div className="profile-field">
                <label>GitHub Profile</label>
                <input
                  name="github"
                  value={profile.github}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="https://github.com/..."
                />
              </div>

              <div className="profile-field full-width">
                <label>Portfolio Website</label>
                <input
                  name="portfolio"
                  value={profile.portfolio}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="https://yourportfolio.com"
                />
              </div>
            </div>
          </section>

          {isEditing && (
            <div className="profile-form-actions">
              <button
                type="button"
                className="profile-cancel-btn"
                onClick={handleCancel}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="profile-save-btn"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </form>

        <footer className="profile-footer">
          CareerOS © 2026 · Build your future with confidence.
        </footer>
      </main>
    </div>
  );
}

export default Profile;

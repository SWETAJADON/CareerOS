import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

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
    return <div className="grid min-h-screen place-items-center bg-slate-50 font-sans text-slate-600">Loading profile...</div>;
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
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <header className="flex h-[75px] items-center justify-between border-b border-slate-200 bg-white px-[6%]">
        <Link to="/dashboard" className="text-[25px] font-extrabold text-slate-800 no-underline">
          Career<span className="text-blue-600">OS</span>
        </Link>

        <nav className="hidden items-center gap-[30px] sm:flex">
          <Link to="/dashboard" className="text-sm font-semibold text-slate-500 no-underline transition hover:text-blue-600">Dashboard</Link>
          <Link to="/profile" className="text-sm font-semibold text-blue-600 no-underline">
            My Profile
          </Link>
        </nav>

        <Link to="/dashboard" className="text-sm font-semibold text-blue-600 no-underline">
          ← Dashboard
        </Link>
      </header>

      <main className="mx-auto my-8 w-[92%] max-w-[1100px]">
        <div className="mb-6 flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-[11px] font-bold tracking-[1.5px] text-blue-600">ACCOUNT MANAGEMENT</p>
            <h1 className="my-2 text-3xl font-bold tracking-tight text-slate-800">My Profile</h1>
            <p className="text-sm text-slate-500">Manage your personal details and career information.</p>
          </div>

          {!isEditing && (
            <button
              type="button"
              className="cursor-pointer rounded-lg border-0 bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
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
          <div className="mb-[18px] rounded-lg bg-blue-50 px-4 py-3 text-[13px] text-blue-800" role="status">
            {message}
          </div>
        )}

        <section className="mb-6 flex flex-wrap items-center gap-6 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-100 to-violet-100 p-6 md:flex-nowrap">
          <div className="grid h-[82px] w-[82px] shrink-0 place-items-center overflow-hidden rounded-full bg-blue-600 text-[32px] font-bold text-white">
            {photoPreview ? (
              <img src={photoPreview} alt="Profile" />
            ) : (
              (profile.fullName || "U").charAt(0).toUpperCase()
            )}
          </div>

          <div className="min-w-[180px]">
            <h2 className="mb-2 text-[21px] font-bold text-slate-800">{profile.fullName || "Your Name"}</h2>
            <p className="my-1 text-[13px] text-slate-500">{profile.targetRole || "Add your target job role"}</p>
            <span className="my-1 text-[13px] text-slate-500">✉ {profile.email}</span>
          </div>

          <div className="mt-2 w-full max-w-none md:ml-auto md:mt-0 md:max-w-[330px] md:flex-1">
            <div className="mb-2.5 flex justify-between text-[13px]">
              <span className="text-slate-700">Profile Completion</span>
              <strong className="text-blue-600">{completion}%</strong>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-blue-100">
              <div
                className="h-full rounded-full bg-blue-600 transition-all"
                style={{ width: `${completion}%` }}
              />
            </div>
            <small className="mt-2 block text-[11px] leading-relaxed text-slate-500">Complete your profile to improve your career readiness.</small>
          </div>
        </section>

        <form onSubmit={handleSave}>
          {/* PERSONAL INFORMATION */}
          <section className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 md:p-[27px]">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="mb-1.5 text-lg font-bold text-slate-800">Personal Information</h2>
                <p className="m-0 text-[13px] text-slate-400">Your basic contact information</p>
              </div>
              <span className="rounded-lg bg-blue-50 px-3 py-2 text-[13px] font-bold text-blue-600">01</span>
            </div>

            <div className="mb-6 flex items-center gap-4 border-b border-slate-100 pb-5">
              <div className="grid h-[62px] w-[62px] shrink-0 place-items-center overflow-hidden rounded-full bg-blue-600 text-2xl font-bold text-white">
                {photoPreview ? (
                  <img src={photoPreview} alt="Profile preview" />
                ) : (
                  (profile.fullName || "U").charAt(0).toUpperCase()
                )}
              </div>

              <div>
                <label htmlFor="profilePhoto" className="text-[13px] font-bold text-slate-700">Profile Photo</label>
                <p className="my-1.5 text-xs text-slate-500">JPG, PNG or WebP. Maximum 2 MB.</p>
                <input className="mt-1 max-w-[230px] text-xs file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:font-semibold file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-60"
                  id="profilePhoto"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoChange}
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-[22px] md:grid-cols-2">
              <div className="flex min-w-0 flex-col gap-[9px]">
                <label className="text-[13px] font-semibold text-slate-600">Full Name</label>
                <input className="w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3.5 py-3 text-[13px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
                  name="fullName"
                  value={profile.fullName}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                />
              </div>

              <div className="flex min-w-0 flex-col gap-[9px]">
                <label className="text-[13px] font-semibold text-slate-600">Email Address</label>
                <input className="w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3.5 py-3 text-[13px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500" value={profile.email} type="email" disabled />
              </div>

              <div className="flex min-w-0 flex-col gap-[9px]">
                <label className="text-[13px] font-semibold text-slate-600">Phone Number</label>
                <input className="w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3.5 py-3 text-[13px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
                  name="phone"
                  value={profile.phone}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="Enter phone number"
                />
              </div>

              <div className="flex min-w-0 flex-col gap-[9px]">
                <label className="text-[13px] font-semibold text-slate-600">Location</label>
                <input className="w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3.5 py-3 text-[13px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
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
          <section className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 md:p-[27px]">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="mb-1.5 text-lg font-bold text-slate-800">Education Details</h2>
                <p className="m-0 text-[13px] text-slate-400">Your academic background</p>
              </div>
              <span className="rounded-lg bg-blue-50 px-3 py-2 text-[13px] font-bold text-blue-600">02</span>
            </div>

            <div className="grid grid-cols-1 gap-[22px] md:grid-cols-2">
              <div className="flex min-w-0 flex-col gap-[9px]">
                <label className="text-[13px] font-semibold text-slate-600">Qualification</label>
                <input className="w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3.5 py-3 text-[13px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
                  name="education"
                  value={profile.education}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="B.E., B.Tech, Diploma..."
                />
              </div>

              <div className="flex min-w-0 flex-col gap-[9px]">
                <label className="text-[13px] font-semibold text-slate-600">College / University</label>
                <input className="w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3.5 py-3 text-[13px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
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

              <div className="flex min-w-0 flex-col gap-[9px]">
                <label className="text-[13px] font-semibold text-slate-600">Branch / Specialization</label>
                <input className="w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3.5 py-3 text-[13px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
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

              <div className="flex min-w-0 flex-col gap-[9px]">
                <label className="text-[13px] font-semibold text-slate-600">Graduation Year</label>
                <input className="w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3.5 py-3 text-[13px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
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

              <div className="flex min-w-0 flex-col gap-[9px]">
                <label className="text-[13px] font-semibold text-slate-600">CGPA / Percentage</label>
                <input className="w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3.5 py-3 text-[13px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
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
          <section className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 md:p-[27px]">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="mb-1.5 text-lg font-bold text-slate-800">Skills & Expertise</h2>
                <p className="m-0 text-[13px] text-slate-400">Your technical and professional skills</p>
              </div>
              <span className="rounded-lg bg-blue-50 px-3 py-2 text-[13px] font-bold text-blue-600">03</span>
            </div>

            <div className="grid grid-cols-1 gap-[22px] md:grid-cols-2">
              <div className="flex min-w-0 flex-col gap-[9px]">
                <label className="text-[13px] font-semibold text-slate-600">Target Job Role</label>
                <input className="w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3.5 py-3 text-[13px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
                  name="targetRole"
                  value={profile.targetRole}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="MERN Stack Developer"
                />
              </div>

              <div className="flex min-w-0 flex-col gap-[9px]">
                <label className="text-[13px] font-semibold text-slate-600">Technical Skills</label>
                <input className="w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3.5 py-3 text-[13px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
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
          <section className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 md:p-[27px]">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="mb-1.5 text-lg font-bold text-slate-800">Career Preferences</h2>
                <p className="m-0 text-[13px] text-slate-400">Tell us what kind of opportunities you prefer</p>
              </div>
              <span className="rounded-lg bg-blue-50 px-3 py-2 text-[13px] font-bold text-blue-600">04</span>
            </div>

            <div className="grid grid-cols-1 gap-[22px] md:grid-cols-2">
              <div className="flex min-w-0 flex-col gap-[9px]">
                <label className="text-[13px] font-semibold text-slate-600">Preferred Industry</label>
                <input className="w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3.5 py-3 text-[13px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
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

              <div className="flex min-w-0 flex-col gap-[9px]">
                <label className="text-[13px] font-semibold text-slate-600">Preferred Job Location</label>
                <input className="w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3.5 py-3 text-[13px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
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

              <div className="flex min-w-0 flex-col gap-[9px]">
                <label className="text-[13px] font-semibold text-slate-600">Preferred Work Mode</label>
                <select className="w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3.5 py-3 text-[13px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
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
          <section className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 md:p-[27px]">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="mb-1.5 text-lg font-bold text-slate-800">Experience & Internships</h2>
                <p className="m-0 text-[13px] text-slate-400">Add your work experience and internships</p>
              </div>
              <span className="rounded-lg bg-blue-50 px-3 py-2 text-[13px] font-bold text-blue-600">05</span>
            </div>

            {profile.experience.map((item, index) => (
              <div className="mb-[18px] rounded-xl border border-slate-200 bg-slate-50 p-5" key={index}>
                <div className="mb-5 flex items-center justify-between text-sm text-slate-700">
                  <strong className="font-semibold">Experience {index + 1}</strong>
                  {isEditing && (
                    <button
                      type="button"
                      className="cursor-pointer rounded-lg border-0 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100"
                      onClick={() => removeEntry("experience", index)}
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-[22px] md:grid-cols-2">
                  <div className="flex min-w-0 flex-col gap-[9px]">
                    <label className="text-[13px] font-semibold text-slate-600">Job Title</label>
                    <input className="w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3.5 py-3 text-[13px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
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

                  <div className="flex min-w-0 flex-col gap-[9px]">
                    <label className="text-[13px] font-semibold text-slate-600">Company</label>
                    <input className="w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3.5 py-3 text-[13px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
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

                  <div className="flex min-w-0 flex-col gap-[9px] md:col-span-2">
                    <label className="text-[13px] font-semibold text-slate-600">Duration</label>
                    <input className="w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3.5 py-3 text-[13px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
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

                  <div className="flex min-w-0 flex-col gap-[9px] md:col-span-2">
                    <label className="text-[13px] font-semibold text-slate-600">Description</label>
                    <textarea className="w-full min-w-0 resize-y rounded-lg border border-slate-200 bg-white px-3.5 py-3 text-[13px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
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
                className="cursor-pointer rounded-lg border border-dashed border-blue-300 bg-blue-50 px-4 py-3 text-[13px] font-semibold text-blue-600 transition hover:bg-blue-100"
                onClick={() => addEntry("experience")}
              >
                + Add Experience
              </button>
            )}
          </section>

          {/* CERTIFICATIONS */}
          <section className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 md:p-[27px]">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="mb-1.5 text-lg font-bold text-slate-800">Certifications</h2>
                <p className="m-0 text-[13px] text-slate-400">Add your completed courses and certificates</p>
              </div>
              <span className="rounded-lg bg-blue-50 px-3 py-2 text-[13px] font-bold text-blue-600">06</span>
            </div>

            {profile.certifications.map((item, index) => (
              <div className="mb-[18px] rounded-xl border border-slate-200 bg-slate-50 p-5" key={index}>
                <div className="mb-5 flex items-center justify-between text-sm text-slate-700">
                  <strong className="font-semibold">Certification {index + 1}</strong>
                  {isEditing && (
                    <button
                      type="button"
                      className="cursor-pointer rounded-lg border-0 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100"
                      onClick={() =>
                        removeEntry("certifications", index)
                      }
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-[22px] md:grid-cols-2">
                  <div className="flex min-w-0 flex-col gap-[9px]">
                    <label className="text-[13px] font-semibold text-slate-600">Certificate Name</label>
                    <input className="w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3.5 py-3 text-[13px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
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

                  <div className="flex min-w-0 flex-col gap-[9px]">
                    <label className="text-[13px] font-semibold text-slate-600">Issuing Organization</label>
                    <input className="w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3.5 py-3 text-[13px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
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

                  <div className="flex min-w-0 flex-col gap-[9px]">
                    <label className="text-[13px] font-semibold text-slate-600">Issue Year</label>
                    <input className="w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3.5 py-3 text-[13px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
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
                className="cursor-pointer rounded-lg border border-dashed border-blue-300 bg-blue-50 px-4 py-3 text-[13px] font-semibold text-blue-600 transition hover:bg-blue-100"
                onClick={() => addEntry("certifications")}
              >
                + Add Certification
              </button>
            )}
          </section>

          {/* SUMMARY AND SOCIAL LINKS */}
          <section className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 md:p-[27px]">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="mb-1.5 text-lg font-bold text-slate-800">Professional Summary & Links</h2>
                <p className="m-0 text-[13px] text-slate-400">Introduce yourself and share your professional work</p>
              </div>
              <span className="rounded-lg bg-blue-50 px-3 py-2 text-[13px] font-bold text-blue-600">07</span>
            </div>

            <div className="grid grid-cols-1 gap-[22px] md:grid-cols-2">
              <div className="flex min-w-0 flex-col gap-[9px] md:col-span-2">
                <label className="text-[13px] font-semibold text-slate-600">About Me</label>
                <textarea className="w-full min-w-0 resize-y rounded-lg border border-slate-200 bg-white px-3.5 py-3 text-[13px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
                  name="about"
                  value={profile.about}
                  onChange={handleChange}
                  disabled={!isEditing}
                  rows={4}
                  placeholder="Write a short professional introduction..."
                />
              </div>

              <div className="flex min-w-0 flex-col gap-[9px]">
                <label className="text-[13px] font-semibold text-slate-600">LinkedIn Profile</label>
                <input className="w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3.5 py-3 text-[13px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
                  name="linkedin"
                  value={profile.linkedin}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="https://linkedin.com/in/..."
                />
              </div>

              <div className="flex min-w-0 flex-col gap-[9px]">
                <label className="text-[13px] font-semibold text-slate-600">GitHub Profile</label>
                <input className="w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3.5 py-3 text-[13px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
                  name="github"
                  value={profile.github}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="https://github.com/..."
                />
              </div>

              <div className="flex min-w-0 flex-col gap-[9px] md:col-span-2">
                <label className="text-[13px] font-semibold text-slate-600">Portfolio Website</label>
                <input className="w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3.5 py-3 text-[13px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
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
            <div className="my-[22px] flex justify-end gap-3">
              <button
                type="button"
                className="cursor-pointer rounded-lg border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={handleCancel}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="cursor-pointer rounded-lg border-0 bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </form>

        <footer className="p-6 text-center text-xs text-slate-400">
          CareerOS © 2026 · Build your future with confidence.
        </footer>
      </main>
    </div>
  );
}

export default Profile;

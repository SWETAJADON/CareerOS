import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      const token = sessionStorage.getItem("token");

      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      try {
        const response = await axios.get(
          "http://localhost:5000/api/profile",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setUser(response.data.user);
      } catch (error) {
        if (error.response?.status === 401) {
          sessionStorage.removeItem("token");
          sessionStorage.removeItem("user");
          navigate("/login", { replace: true });
        }
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [navigate]);

  function handleLogout() {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    navigate("/login", { replace: true });
  }

  if (loading) {
    return <div className="dashboard-loading">Loading CareerOS...</div>;
  }

  const fields = user
    ? [user.fullName, user.phone, user.location, user.education,
       user.targetRole, user.skills, user.about]
    : [];

  const completed = fields.filter(
    (value) => value && value.trim()
  ).length;

  const completion = Math.round((completed / fields.length) * 100);

  return (
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar">
        <Link to="/dashboard" className="brand">
          💼 Career<span>OS</span>
        </Link>

        <p className="sidebar-label">WORKSPACE</p>

        <nav className="sidebar-nav">
          <Link to="/dashboard" className="nav-link active">
            <span>▦</span> Dashboard
          </Link>
          <Link to="/profile" className="nav-link">
            <span>♙</span> My Profile
          </Link>
          <button
            className="nav-link"
            onClick={() => navigate("/resume-builder")}
          >
            <span>▤</span> Resume Builder
          </button>
          <button
            className="nav-link"
            onClick={() => alert("Job Tracker coming soon!")}
          >
            <span>▣</span> Job Tracker
          </button>
          <button
            className="nav-link"
            onClick={() => alert("Career Resources coming soon!")}
          >
            <span>◇</span> Career Resources
          </button>
        </nav>

        <div className="sidebar-bottom">
          <button className="nav-link logout-link" onClick={handleLogout}>
            <span>⇥</span> Logout
          </button>
          <p>CareerOS © 2026</p>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <div>
            <p className="topbar-label">YOUR CAREER WORKSPACE</p>
            <h2>Dashboard</h2>
          </div>
          <div className="user-chip">
            <div className="user-avatar">
              {(user?.fullName || "U").charAt(0).toUpperCase()}
            </div>
            <span>{user?.fullName || "User"}</span>
          </div>
        </header>

        <section className="welcome-banner">
          <div>
            <p className="welcome-eyebrow">YOUR JOURNEY STARTS HERE</p>
            <h1>Welcome back, {user?.fullName || "there"}! 👋</h1>
            <p>
              Build your profile, create your resume, and take
              the next step in your career.
            </p>
            <Link to="/profile" className="welcome-button">
              Complete Your Profile →
            </Link>
          </div>
          <div className="banner-decoration">↗</div>
        </section>

        <section className="stats-grid">
          <article className="stat-card">
            <div className="stat-icon blue-icon">♙</div>
            <p>Profile Completion</p>
            <h2>{completion}%</h2>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${completion}%` }}
              />
            </div>
          </article>

          <article className="stat-card">
            <div className="stat-icon purple-icon">▤</div>
            <p>Resumes Created</p>
            <h2>0</h2>
            <span>Start building your resume</span>
          </article>

          <article className="stat-card">
            <div className="stat-icon orange-icon">▣</div>
            <p>Jobs Applied</p>
            <h2>0</h2>
            <span>Track your applications</span>
          </article>

          <article className="stat-card">
            <div className="stat-icon green-icon">✓</div>
            <p>Interviews</p>
            <h2>0</h2>
            <span>Stay ready for opportunities</span>
          </article>
        </section>

        <section className="dashboard-section">
          <div className="section-heading">
            <div>
              <h2>Quick Actions</h2>
              <p>What would you like to do today?</p>
            </div>
          </div>

          <div className="actions-grid">
            <button
              className="action-card action-blue"
              onClick={() => alert("Resume Builder coming soon!")}
            >
              <span className="action-icon">▤</span>
              <h3>Build Resume</h3>
              <p>Create a professional resume for your next opportunity.</p>
              <span className="action-arrow">→</span>
            </button>

            <button
              className="action-card action-green"
              onClick={() => alert("Job Tracker coming soon!")}
            >
              <span className="action-icon">▣</span>
              <h3>Track Jobs</h3>
              <p>Organize your job applications in one place.</p>
              <span className="action-arrow">→</span>
            </button>

            <Link to="/profile" className="action-card action-purple">
              <span className="action-icon">♙</span>
              <h3>Edit Profile</h3>
              <p>Keep your personal and career details up to date.</p>
              <span className="action-arrow">→</span>
            </Link>
          </div>
        </section>

        <section className="dashboard-section profile-overview">
          <div className="section-heading">
            <div>
              <h2>Profile Overview</h2>
              <p>Your current career information</p>
            </div>
            <Link to="/profile" className="text-link">Edit Profile →</Link>
          </div>

          <div className="profile-details">
            <div><span>Full Name</span><strong>{user?.fullName || "Not added"}</strong></div>
            <div><span>Email</span><strong>{user?.email || "Not added"}</strong></div>
            <div><span>Location</span><strong>{user?.location || "Not added"}</strong></div>
            <div><span>Education</span><strong>{user?.education || "Not added"}</strong></div>
            <div><span>Target Role</span><strong>{user?.targetRole || "Not added"}</strong></div>
            <div><span>Skills</span><strong>{user?.skills || "Not added"}</strong></div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;

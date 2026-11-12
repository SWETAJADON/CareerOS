import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

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
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 text-slate-600">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          <span className="font-medium">Loading CareerOS...</span>
        </div>
      </div>
    );
  }

  const completionFields = [
  user?.fullName,
  user?.phone,
  user?.location,
  user?.education,
  user?.educationDetails?.institution,
  user?.educationDetails?.specialization,
  user?.skills,
  user?.targetRole,
  user?.careerPreferences?.industry,
  user?.about,
  user?.linkedin,
  user?.github,
];

const completed = completionFields.filter(
  (value) => value && String(value).trim()
).length;

const completion = Math.round(
  (completed / completionFields.length) * 100
);

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-800">

      {/* Sidebar */}
      <aside className="flex w-full shrink-0 flex-col border-b border-slate-200 bg-white p-4 md:w-60 md:border-b-0 md:border-r md:p-5">

        <Link
          to="/dashboard"
          className="mb-5 px-2 text-2xl font-extrabold tracking-tight text-slate-800 md:mb-12"
        >
          💼 Career<span className="text-indigo-600">OS</span>
        </Link>

        <p className="mb-3 hidden px-3 text-xs font-bold tracking-widest text-slate-400 md:block">
          WORKSPACE
        </p>

        <nav className="flex gap-1 overflow-x-auto md:flex-col md:gap-2">

          <Link
            to="/dashboard"
            className="flex shrink-0 items-center gap-3 rounded-xl bg-indigo-50 px-3 py-3 text-sm font-bold text-indigo-600 transition hover:bg-indigo-100"
          >
            <span className="text-lg">▦</span>
            Dashboard
          </Link>

          <Link
            to="/profile"
            className="flex shrink-0 items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-600"
          >
            <span className="text-lg">♙</span>
            My Profile
          </Link>

          <Link
            to="/resume-builder"
            className="flex shrink-0 items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-600"
          >
            <span className="text-lg">▤</span>
            Resume Builder
          </Link>

          <Link
            to="/job-tracker"
            className="flex shrink-0 items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-600"
          >
            <span className="text-lg">▣</span>
            Job Tracker
          </Link>

          <button
            onClick={() => alert("Career Resources coming soon!")}
            className="flex shrink-0 items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-600"
          >
            <span className="text-lg">◇</span>
            Career Resources
          </button>

        </nav>

        {/* Sidebar Bottom */}
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 md:mt-auto md:block md:pt-5">

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-600 transition hover:bg-red-50 hover:text-red-600"
          >
            <span className="text-lg">⇥</span>
            Logout
          </button>

          <p className="px-3 text-xs text-slate-400 md:mt-3">
            CareerOS © 2026
          </p>

        </div>
      </aside>

      {/* Main Content */}
      <main className="min-w-0 flex-1 px-4 pb-8 md:px-7 lg:px-9">

        {/* Topbar */}
        <header className="mb-6 flex min-h-20 items-center justify-between gap-3 border-b border-slate-200">

          <div>
            <p className="mb-1 text-[11px] font-bold tracking-widest text-slate-400">
              YOUR CAREER WORKSPACE
            </p>
            <h2 className="text-xl font-bold text-slate-800 md:text-2xl">
              Dashboard
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-indigo-600 text-lg font-bold text-white">
              {(user?.fullName || "U").charAt(0).toUpperCase()}
            </div>

            <span className="hidden text-sm font-semibold text-slate-700 sm:block">
              {user?.fullName || "User"}
            </span>
          </div>

        </header>

        {/* Welcome Banner */}
        <section className="relative mb-6 flex items-center justify-between overflow-hidden rounded-2xl bg-gradient-to-r from-blue-100 via-indigo-100 to-purple-100 p-6 md:p-9">

          <div className="relative z-10 max-w-2xl">

            <p className="mb-3 text-[11px] font-bold tracking-widest text-indigo-700">
              YOUR JOURNEY STARTS HERE
            </p>

            <h1 className="mb-3 text-2xl font-extrabold tracking-tight text-slate-800 md:text-3xl">
              Welcome back, {user?.fullName || "there"}! 👋
            </h1>

            <p className="mb-5 text-sm leading-7 text-slate-600">
              Build your profile, create your resume, and take
              the next step in your career.
            </p>

            <Link
              to="/profile"
              className="inline-flex items-center rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
            >
              Complete Your Profile →
            </Link>

          </div>

          <div className="hidden pr-8 text-8xl font-extrabold text-indigo-400/60 lg:block">
            ↗
          </div>

        </section>

        {/* Statistics */}
        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          {/* Profile Completion */}
          <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">

            <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-xl text-blue-600">
              ♙
            </div>

            <p className="mb-2 text-sm text-slate-500">
              Profile Completion
            </p>

            <h2 className="mb-3 text-3xl font-bold text-slate-800">
              {completion}%
            </h2>

            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${completion}%` }}
              />
            </div>

          </article>

          {/* Resumes */}
          <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">

            <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-purple-50 text-xl text-purple-600">
              ▤
            </div>

            <p className="mb-2 text-sm text-slate-500">
              Resumes Created
            </p>

            <h2 className="mb-2 text-3xl font-bold text-slate-800">
              0
            </h2>

            <span className="text-xs text-slate-400">
              Start building your resume
            </span>

          </article>

          {/* Jobs */}
          <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">

            <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-orange-50 text-xl text-orange-600">
              ▣
            </div>

            <p className="mb-2 text-sm text-slate-500">
              Jobs Applied
            </p>

            <h2 className="mb-2 text-3xl font-bold text-slate-800">
              0
            </h2>

            <span className="text-xs text-slate-400">
              Track your applications
            </span>

          </article>

          {/* Interviews */}
          <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">

            <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-emerald-50 text-xl text-emerald-600">
              ✓
            </div>

            <p className="mb-2 text-sm text-slate-500">
              Interviews
            </p>

            <h2 className="mb-2 text-3xl font-bold text-slate-800">
              0
            </h2>

            <span className="text-xs text-slate-400">
              Stay ready for opportunities
            </span>

          </article>

        </section>

        {/* Quick Actions */}
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">

          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-800">
              Quick Actions
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              What would you like to do today?
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

            <Link
              to="/resume-builder"
              className="group rounded-xl border border-blue-100 bg-blue-50 p-5 transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="mb-5 grid h-11 w-11 place-items-center rounded-xl bg-white text-xl text-blue-600 shadow-sm">
                ▤
              </div>

              <h3 className="mb-2 font-bold text-slate-800">
                Build Resume
              </h3>

              <p className="mb-4 text-sm leading-6 text-slate-500">
                Create a professional resume for your next opportunity.
              </p>

              <span className="text-xl font-semibold text-blue-600 transition group-hover:translate-x-1 inline-block">
                →
              </span>
            </Link>

            <Link
              to="/job-tracker"
              className="group rounded-xl border border-emerald-100 bg-emerald-50 p-5 transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="mb-5 grid h-11 w-11 place-items-center rounded-xl bg-white text-xl text-emerald-600 shadow-sm">
                ▣
              </div>

              <h3 className="mb-2 font-bold text-slate-800">
                Track Jobs
              </h3>

              <p className="mb-4 text-sm leading-6 text-slate-500">
                Organize your job applications in one place.
              </p>

              <span className="text-xl font-semibold text-emerald-600 transition group-hover:translate-x-1 inline-block">
                →
              </span>
            </Link>

            <Link
              to="/profile"
              className="group rounded-xl border border-purple-100 bg-purple-50 p-5 transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="mb-5 grid h-11 w-11 place-items-center rounded-xl bg-white text-xl text-purple-600 shadow-sm">
                ♙
              </div>

              <h3 className="mb-2 font-bold text-slate-800">
                Edit Profile
              </h3>

              <p className="mb-4 text-sm leading-6 text-slate-500">
                Keep your personal and career details up to date.
              </p>

              <span className="text-xl font-semibold text-purple-600 transition group-hover:translate-x-1 inline-block">
                →
              </span>
            </Link>

          </div>
        </section>

        {/* Profile Overview */}
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">

          <div className="mb-5 flex items-center justify-between gap-3">

            <div>
              <h2 className="text-xl font-bold text-slate-800">
                Profile Overview
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Your current career information
              </p>
            </div>

            <Link
              to="/profile"
              className="whitespace-nowrap text-sm font-semibold text-indigo-600 transition hover:text-indigo-800"
            >
              Edit Profile →
            </Link>

          </div>

          <div className="grid grid-cols-1 gap-x-8 md:grid-cols-2">

            {[
              ["Full Name", user?.fullName],
              ["Email", user?.email],
              ["Location", user?.location],
              ["Education", user?.education],
              ["Target Role", user?.targetRole],
              ["Skills", user?.skills],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex min-w-0 items-start justify-between gap-4 border-b border-slate-100 py-4 text-sm"
              >
                <span className="shrink-0 text-slate-500">
                  {label}
                </span>

                <strong className="min-w-0 break-words text-right font-semibold text-slate-800">
                  {value || "Not added"}
                </strong>
              </div>
            ))}

          </div>

        </section>

      </main>
    </div>
  );
}

export default Dashboard;

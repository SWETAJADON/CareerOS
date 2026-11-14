import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

function Register() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (Object.values(formData).some((value) => !value.trim())) {
      setError("Please fill in all fields.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        "http://localhost:5000/api/auth/register",
        {
          fullName: formData.fullName.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
        }
      );

      setSuccess(response.data.message || "Registration successful!");

      setFormData({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
    } catch (err) {
      if (err.response) {
        setError(err.response.data.message || "Registration failed.");
      } else {
        setError(
          "Cannot connect to the server. Please check your backend."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  const inputClasses =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-[15px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-200";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0b1220] to-[#172554] px-4 py-8 font-sans">
      <div className="w-full max-w-[440px] rounded-2xl bg-white p-6 shadow-[0_10px_35px_rgba(15,23,42,0.18)] sm:p-9">
        <h1 className="text-center text-[32px] font-bold tracking-tight text-[#17365d]">
          CareerOS
        </h1>
        <p className="mb-7 mt-2 text-center text-slate-500">
          Create your account
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col">
          <label
            htmlFor="fullName"
            className="mb-1.5 mt-3 text-sm font-semibold text-slate-700"
          >
            Full name
          </label>
          <input
            id="fullName"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="Enter your full name"
            autoComplete="name"
            required
            className={inputClasses}
          />

          <label
            htmlFor="email"
            className="mb-1.5 mt-3 text-sm font-semibold text-slate-700"
          >
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="you@example.com"
            autoComplete="email"
            required
            className={inputClasses}
          />

          <label
            htmlFor="password"
            className="mb-1.5 mt-3 text-sm font-semibold text-slate-700"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="At least 8 characters"
            autoComplete="new-password"
            required
            className={inputClasses}
          />

          <label
            htmlFor="confirmPassword"
            className="mb-1.5 mt-3 text-sm font-semibold text-slate-700"
          >
            Confirm password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Enter password again"
            autoComplete="new-password"
            required
            className={inputClasses}
          />

          {error && (
            <p
              className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
              role="alert"
            >
              {error}
            </p>
          )}

          {success && (
            <p
              className="mt-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2.5 text-sm text-green-700"
              role="status"
            >
              {success}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 rounded-lg bg-blue-600 px-4 py-3 text-[15px] font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-blue-600 no-underline hover:text-blue-800 hover:underline"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));

    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!formData.email.trim() || !formData.password) {
      setError("Please enter your email and password.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        "http://localhost:5000/api/auth/login",
        {
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
        }
      );

      sessionStorage.setItem("token", response.data.token);
      sessionStorage.setItem("user", JSON.stringify(response.data.user));

      navigate("/dashboard", { replace: true });
    } catch (err) {
      if (err.response) {
        setError(
          err.response.data.message || "Login failed. Please try again."
        );
      } else {
        setError("Cannot connect to the server. Please check your backend.");
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
          Welcome back! Please log in.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col">
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

          <div className="relative flex items-center">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
              className={`${inputClasses} pr-20`}
            />

            <button
              type="button"
              className="absolute right-2 rounded-md px-2 py-1.5 text-[13px] font-semibold text-blue-600 transition hover:bg-blue-50 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-300"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          {error && (
            <p
              className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
              role="alert"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 rounded-lg bg-blue-600 px-4 py-3 text-[15px] font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="font-semibold text-blue-600 no-underline hover:text-blue-800 hover:underline"
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;

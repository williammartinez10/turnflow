import "./Login.css";
import { useState } from "react";
import type { SyntheticEvent } from "react";
import { Link } from "react-router-dom";
import Header from "../../components/Header/Header";

function Login() {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const apiBaseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const response = await fetch(`${apiBaseUrl}/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.get("email"),
          password: formData.get("password"),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          typeof data.detail === "string"
            ? data.detail
            : "Could not log in."
        );
        return;
      }

      setSuccess("Logged in successfully.");
    } catch {
      setError("Could not complete login. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <Header />

      <main className="login-main">
        <div className="login-content">
          <h1 className="login-title">Log In</h1>

          <p className="login-description">Log in to your Staff or Admin account.</p>

          <form
            className="login-form"
            onSubmit={handleLogin}
          >
            <label className="login-form-label" htmlFor="email">Email</label>

            <input
              className="login-form-input"
              id="email"
              name="email"
              type="email"
              placeholder="Enter your email"
              required
            />

            <label className="login-form-label" htmlFor="password">Password</label>

            <input
              className="login-form-input"
              id="password"
              name="password"
              type="password"
              placeholder="Enter your password"
              required
            />

            {error && <p role="alert" style={{ textAlign: "center", color: "#FF2C2C" }}>
              {error}
            </p>}
            {success && <p role="status" style={{ textAlign: "center", color: "#008000" }}>
              {success}
            </p>}

            <button
              className="login-form-button"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? "Logging In..." : "Log In"}
            </button>
          </form>

          <p className="login-signup-label">Don't have an account?</p>

          <div className="login-signup-links">
            <Link
              className="login-signup-link"
              to="/signup/staff/staff_code"
            >
              Sign Up as Staff
            </Link>

            <Link
              className="login-signup-link"
              to="/signup/admin"
            >
              Sign Up as Admin
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Login;
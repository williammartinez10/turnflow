import "./AdminSignup.css";
import { useState, SyntheticEvent } from "react";
import { Link } from "react-router-dom";
import Header from "../../../components/Header/Header";

function AdminSignup() {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const apiBaseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const response = await fetch(`${apiBaseUrl}/database/admin/add_admin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: formData.get("full-name"),
          email: formData.get("email"),
          password: formData.get("password"),
          organization_name: formData.get("organization-name"),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          typeof data.detail === "string"
            ? data.detail
            : "Could not create the account."
        );
        return;
      }

      setSuccess("Admin account created successfully.");
    } catch {
      setError("Could not create the account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  
  return (
    <div className="admin-signup-page">
      <Header />

      <main className="admin-signup-main">
        <div className="admin-signup-content">
          <h1 className="admin-signup-title">Sign Up as Admin</h1>

          <p className="admin-signup-description">
            Create an admin account to manage your organization.
          </p>

          <form
            className="admin-signup-form"
            onSubmit={handleSignup}
          >
            <label className="admin-signup-form-label" htmlFor="full-name">
              Full Name
            </label>

            <input
              className="admin-signup-form-input"
              id="full-name"
              name="full-name"
              type="text"
              placeholder="Enter your full name"
              required
            />

            <label className="admin-signup-form-label" htmlFor="email">
              Email
            </label>

            <input
              className="admin-signup-form-input"
              id="email"
              name="email"
              type="email"
              placeholder="Enter your email"
              required
            />

            <label className="admin-signup-form-label" htmlFor="password">
              Password
            </label>

            <input
              className="admin-signup-form-input"
              id="password"
              name="password"
              type="password"
              placeholder="Enter your password"
              required
            />

            <label className="admin-signup-form-label" htmlFor="organization-name">
              Organization Name
            </label>

            <input
              className="admin-signup-form-input"
              id="organization-name"
              name="organization-name"
              type="text"
              placeholder="Enter your organization name"
              required
            />

            {error && (
              <p role="alert" style={{ color: "#FF2C2C", textAlign: "center" }}>
                {error}
              </p>
            )}
            {success && (
              <p role="status">
                {success} <Link to="/login">Log In</Link>
              </p>
            )}

            <button
              className="admin-signup-form-button"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? "Creating Account..." : "Create Admin Account"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default AdminSignup;
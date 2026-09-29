import "./AdminSignup.css";
import { ClockCheck } from "lucide-react";
import { Link } from "react-router-dom";

function AdminSignup() {
  return (
    <div className="admin-signup-page">
      <header className="admin-signup-header">
        <Link className="admin-signup-brand" to="/">
          <span className="admin-signup-brand-icon">
            <ClockCheck size={24} />
          </span>
          <span>TurnFlow</span>
        </Link>
      </header>

      <main className="admin-signup-main">
        <div className="admin-signup-content">
          <h1 className="admin-signup-title">Sign Up as Admin</h1>

          <p className="admin-signup-description">
            Create an admin account to manage your organization.
          </p>

          <form
            className="admin-signup-form"
            onSubmit={(e) => e.preventDefault()}
          >
            <label className="admin-signup-form-label" htmlFor="full-name">
              Full Name
            </label>

            <input
              className="admin-signup-form-input"
              id="full-name"
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
              type="text"
              placeholder="Enter your organization name"
              required
            />

            <button className="admin-signup-form-button" type="submit">
              Create Admin Account
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default AdminSignup;
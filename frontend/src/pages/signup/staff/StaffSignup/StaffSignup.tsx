import "./StaffSignup.css";
import { ClockCheck } from "lucide-react";

function StaffSignup() {
  return (
    <div className="staff-signup-page">
      <header className="staff-signup-header">
        <a className="staff-signup-brand" href="/">
          <span className="staff-signup-brand-icon">
            <ClockCheck size={24} />
          </span>
          <span>TurnFlow</span>
        </a>
      </header>

      <main className="staff-signup-main">
        <div className="staff-signup-content">
          <h1 className="staff-signup-title">Sign Up as Staff</h1>

          <p className="staff-signup-description">
            Enter your information to create your staff account.
          </p>

          <form
            className="staff-signup-form"
            onSubmit={(e) => e.preventDefault()}
          >
            <label className="staff-signup-form-label" htmlFor="full-name">
              Full Name
            </label>

            <input
              className="staff-signup-form-input"
              id="full-name"
              type="text"
              placeholder="Enter your full name"
              required
            />

            <label className="staff-signup-form-label" htmlFor="email">
              Email
            </label>

            <input
              className="staff-signup-form-input"
              id="email"
              type="email"
              placeholder="Enter your email"
              required
            />

            <label className="staff-signup-form-label" htmlFor="password">
              Password
            </label>

            <input
              className="staff-signup-form-input"
              id="password"
              type="password"
              placeholder="Enter your password"
              required
            />

            <button className="staff-signup-form-button" type="submit">
              Create Staff Account
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default StaffSignup;
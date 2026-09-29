import "./Login.css";
import { ClockCheck } from "lucide-react";
import { Link } from "react-router-dom";
import Header from "../../components/Header/Header";

function Login() {
  return (
    <div className="login-page">
      <Header />

      <main className="login-main">
        <div className="login-content">
          <h1 className="login-title">Log In</h1>

          <p className="login-description">Log in to your Staff or Admin account.</p>

          <form
            className="login-form"
            onSubmit={(e) => e.preventDefault()}
          >
            <label className="login-form-label" htmlFor="email">Email</label>

            <input
              className="login-form-input"
              id="email"
              type="email"
              placeholder="Enter your email"
              required
            />

            <label className="login-form-label" htmlFor="password">Password</label>

            <input
              className="login-form-input"
              id="password"
              type="password"
              placeholder="Enter your password"
              required
            />

            <button className="login-form-button" type="submit">Log In</button>
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
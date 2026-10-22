import "./Home.css";
import { ClockCheck } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState("");

  /** Opens the Admin dashboard if signed in; otherwise opens Login. */
  const handleAccountAccess = async (
    e: React.MouseEvent<HTMLAnchorElement>
  ) => {
    e.preventDefault();

    if (isChecking) return;

    setError("");
    setIsChecking(true);

    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

    try {
      const response = await fetch(`${apiBaseUrl}/auth/get_current_account`, {
        credentials: "include",
      });

      if (response.status === 401) {
        navigate("/login");
        return;
      }

      if (!response.ok) {
        throw new Error("Session check failed.");
      }

      const account = await response.json();

      navigate(
        account.role === "admin" ? "/admin/AdminDashboard" : "/login"
      );
    } catch {
      setError("Could not check your session. Please try again.");
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="home-page">
      <header className="home-header">
        <div className="home-brand">
          <span className="home-brand-icon">
            <ClockCheck size={24} />
          </span>
          <span>TurnFlow</span>
        </div>
      </header>

      <main className="home-main">
        <div className="home-content">
          <span className="home-eyebrow">WELCOME TO TURNFLOW</span>

          <h1 className="home-title">Your time matters.</h1>

          <p className="home-description">Join a virtual queue and get real-time updates.</p>

          <button
            className="customer-button"
            type="button"
            onClick={() => navigate("/join-queue")}
          >
            Continue as Customer <span aria-hidden="true">→</span>
          </button>

          <p className="home-note">No account needed.</p>

          <div className="home-divider" />

          <p className="staff-link">
            Staff or Admin?{" "}
            <Link
              className="staff-login-link"
              to="/login"
              onClick={handleAccountAccess}
              aria-busy={isChecking}
            >
              {isChecking ? "Checking..." : "Here"}
            </Link>
          </p>

          {error && (
            <p role="alert" style={{ color: "#FF2C2C" }}>
              {error}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}

export default Home;

import "./Home.css";
import { ClockCheck } from "lucide-react";

function Home() {
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
            onClick={() => (window.location.href = "/join-queue")}
          >
            Continue as Customer <span aria-hidden="true">→</span>
          </button>

          <p className="home-note">No account needed.</p>

          <div className="home-divider" />

          <p className="staff-link">Staff or Admin? 
            <a className="staff-login-link" href="/login">Here</a>
          </p>
        </div>
      </main>
    </div>
  );
}

export default Home;
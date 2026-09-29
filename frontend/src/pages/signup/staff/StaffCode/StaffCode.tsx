import "./StaffCode.css";
import { ClockCheck } from "lucide-react";

function StaffCode() {
  return (
    <div className="staff-code-page">
      <header className="staff-code-header">
        <a className="staff-code-brand" href="/">
          <span className="staff-code-brand-icon">
            <ClockCheck size={24} />
          </span>
          <span>TurnFlow</span>
        </a>
      </header>

      <main className="staff-code-main">
        <div className="staff-code-content">
          <h1 className="staff-code-title">Staff Sign Up</h1>

          <p className="staff-code-description">
            Enter your organization's invitation code to continue.
          </p>

          <form
            className="staff-code-form"
            onSubmit={(e) => {
              e.preventDefault();
              window.location.href = "/signup/staff";
            }}
          >
            <label className="staff-code-form-label" htmlFor="invitation-code">
              Organization / Invitation Code
            </label>

            <input
              className="staff-code-form-input"
              id="invitation-code"
              type="text"
              placeholder="Enter your invitation code"
            //  For now, the invitation code isn't required to be filled in, 
            //  but once the backend is implemented/added, you would likely 
            //  want to validate this input and make it required. For now, we
            //  can leave it as optional, to be able to showcase the flow of
            //  the website.
            
            //    required
            />

            <button className="staff-code-form-button" type="submit">
              Continue
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default StaffCode;
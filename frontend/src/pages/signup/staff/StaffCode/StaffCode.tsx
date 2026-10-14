import "./StaffCode.css";
import { ClockCheck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../../../../components/Header/Header";

/**
 * Displays the organization invitation-code step before staff signup.
 * The input is currently optional for demonstrating the frontend flow.
 * Backend invitation validation and organization linking remain pending.
 */
function StaffCode() {
  const navigate = useNavigate();

  return (
    <div className="staff-code-page">
      <Header />

      <main className="staff-code-main">
        <div className="staff-code-content">
          <h1 className="staff-code-title">Staff Sign Up</h1>

          <p className="staff-code-description">
            Enter your organization's invitation code to continue.
          </p>

          <form
            className="staff-code-form"
            onSubmit={(e) => {
              // Prevent a page reload and continue to the staff account form.
              // The entered code is not yet validated or passed to the next page.
              e.preventDefault();
              navigate("/signup/staff");
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
              // TODO: Require and validate the invitation code when integrated.
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
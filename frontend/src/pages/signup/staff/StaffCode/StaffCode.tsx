import "./StaffCode.css";
import { useState, SubmitEvent } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../../../components/Header/Header";

/**
 * Displays the organization invitation-code step before staff signup.
 * The input is currently optional for demonstrating the frontend flow.
 * Backend invitation validation and organization linking remain pending.
 */
function StaffCode() {
  const navigate = useNavigate();
  const [invitationCode, setInvitationCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleInvitationCode(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();

    const apiBaseUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

    setError("");
    setIsLoading(true);

    try {
      const response = await fetch(
          `${apiBaseUrl}/database/admin/validate_invitation_code`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(invitationCode),
          }
      );

      if (!response.ok) {
        const data = await response.json();
        setError(data.detail || "Invalid invitation code.");
        return;
      }

      const organization = await response.json();

      navigate("/signup/staff", {
        state: {
          adminId: organization.admin_id,
          organizationName: organization.organization_name,
          invitationCode: invitationCode.trim().toUpperCase(),
        },
      });
    } catch {
      setError("Could not validate invitation code.");
    } finally {
      setIsLoading(false);
    }
  }

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
            onSubmit={handleInvitationCode}
          >
            <label className="staff-code-form-label" htmlFor="invitation-code">
              Organization / Invitation Code
            </label>

            <input
                className="staff-code-form-input"
                id="invitation-code"
                type="text"
                placeholder="Enter your invitation code"
                value={invitationCode}
                onChange={(e) => setInvitationCode(e.target.value)}
                required
            />
            {error && <p role="alert">{error}</p>}

            <button
                className="staff-code-form-button"
                type="submit"
                disabled={isLoading}
            >
              {isLoading ? "Checking..." : "Continue"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default StaffCode;
import "./StaffSignup.css";
import { useState, SyntheticEvent } from "react";
import { Link } from "react-router-dom";
import Header from "../../../../components/Header/Header";
import PasswordInput from "../../../../components/PasswordInput/PasswordInput";

function StaffSignup() {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const[isFormValid, setIsFormValid] = useState(false);
  
  const updateFormValidity = (e: SyntheticEvent<HTMLFormElement>) => {
    const requiredInputs =
      e.currentTarget.querySelectorAll<HTMLInputElement>("input[required]");

    setIsFormValid(
      Array.from(requiredInputs).every(
        (input) => input.value.trim() !== "" && input.validity.valid
      )
    );
  };

  const handleSignup = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const apiBaseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const response = await fetch(`${apiBaseUrl}/database/staff/add_staff`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: formData.get("full-name"),
          email: formData.get("email"),
          password: formData.get("password"),
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

      setSuccess("Staff account created successfully.");
    } catch {
      setError("Could not create the account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="staff-signup-page">
      <Header />

      <main className="staff-signup-main">
        <div className="staff-signup-content">
          <h1 className="staff-signup-title">Sign Up as Staff</h1>

          <p className="staff-signup-description">
            Enter your information to create your staff account.
          </p>

          <form
            className="staff-signup-form"
            onSubmit={handleSignup}
            onChange={updateFormValidity}
            onFocusCapture={updateFormValidity}
          >
            <label className="staff-signup-form-label" htmlFor="full-name">
              Full Name
            </label>

            <input
              className="staff-signup-form-input"
              id="full-name"
              name="full-name"
              type="text"
              placeholder="Enter your full name"
              pattern={String.raw`\s*\S+(?:\s+\S+)+\s*`}
              title="Enter at least two words for your full name."
              required
              aria-describedby="full-name-hint"
            />

            <p id="full-name-hint" className="staff-signup-form-hint">
              Enter at least two words, for example:<br/> Firstname Lastname.
            </p>

            <label className="staff-signup-form-label" htmlFor="email">
              Email
            </label>

            <input
              className="staff-signup-form-input"
              id="email"
              name="email"
              type="email"
              placeholder="Enter your email"
              pattern={String.raw`[^@\s]+@[^@\s]+\.[^@\s]+`}
              title="Enter an email address such as name@example.com."
              aria-describedby="email-hint"
              required
            />

            <p id="email-hint" className="staff-signup-form-hint">
              Enter an email address such as name@example.com.
            </p>

            <label className="staff-signup-form-label" htmlFor="password">Password</label>

            <PasswordInput
              className="staff-signup-form-input"
              id="password"
              name="password"
              placeholder="Enter your password"
              required
            />

            {error && <p role="alert">{error}</p>}
            {success && (
              <p role="status" style={{ color: "#008000", textAlign: "center" }}>
                {success} <Link to="/login" style={{ color: "#000000" }}>
                  Log In
                </Link>
              </p>
            )}

            <button
              className="staff-signup-form-button"
              type="submit"
              disabled={isLoading || !isFormValid}
            >
              {isLoading ? "Creating Account..." : "Create Staff Account"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default StaffSignup;
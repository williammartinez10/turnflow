import "./CustomerJoinDetails.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../../components/Header/Header";
import QueueConfirmationModal from "../../../components/QueueConfirmation/QueueConfirmationModal";

function CustomerJoinDetails() {
  const navigate = useNavigate();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);

  // TODO Later: Replace this placeholder with ticket number returned by backend after successfully joining the queue
  const ticketNumber = "<###>";

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 10);

    if (digits.length === 0) {
      return "";
    }

    if (digits.length <= 3) {
      return `(${digits}`;
    }

    if (digits.length <= 6) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    }

    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  };

  const handlePhoneChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setPhoneNumber(formatPhoneNumber(e.target.value));
  };

  const handleContinue = (
    e: React.SyntheticEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    const digits = phoneNumber.replace(/\D/g, "");

    if (digits.length !== 10) {
      return;
    }

    // TODO Later: Send the phone number to the backend in E.164 format
    // Displayed: (787) 123-4567
    // In Backend:  +17871234567 (For Twilio SMS purposes)
    // The backend should create the queue entry and return the generated virtual ticket number

    const backendPhoneNumber = `+1${digits}`;

    console.log("Phone number for backend:", backendPhoneNumber);

    // TODO Later: Show confirmation modal only after backend successfully creates the virtual ticket
    setShowConfirmation(true);
  };

  const handleViewStatus = () => {
    navigate("/queue-status");
  };

  const handleCancel = () => {
    navigate("/service-information");
  };

  return (
    <div className="customer-join-details-page">
      <Header />

      <main className="customer-join-details-main">
        <section className="customer-join-details-content">
          <h1 className="customer-join-details-title">
            Join Queue
          </h1>

          <p className="customer-join-details-description">
            Enter your phone number to continue.
          </p>

          <form
            className="customer-join-details-form"
            onSubmit={handleContinue}
          >
            <label
              className="customer-phone-label"
              htmlFor="phone-number"
            >
              Phone Number
            </label>

            <div className="customer-phone-input-wrapper">
              <span className="customer-phone-prefix">
                +1
              </span>

              <input
                className="customer-phone-input"
                id="phone-number"
                name="phone-number"
                type="tel"
                inputMode="numeric"
                value={phoneNumber}
                onChange={handlePhoneChange}
                placeholder="(###) ###-####"
                autoComplete="tel"
                required
              />
            </div>

            <p className="customer-phone-help">
              Used to send an SMS when your turn is approaching.
            </p>

            <button
              className="customer-join-details-button"
              type="submit"
            >
              Continue
            </button>

            <button
              className="customer-join-details-cancel-button"
              type="button"
              onClick={handleCancel}
            >
              Cancel
            </button>
          </form>
        </section>
      </main>

      {showConfirmation && (
        <QueueConfirmationModal
          ticketNumber={ticketNumber}
          onViewStatus={handleViewStatus}
        />
      )}
    </div>
  );
}

export default CustomerJoinDetails;
import "./CustomerJoinDetails.css";
import { useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import type { ChangeEvent, SyntheticEvent } from "react";
import Header from "../../../components/Header/Header";
import QueueConfirmationModal from "../../../components/QueueConfirmation/QueueConfirmationModal";

/**
 * Collects a customer phone number and registers it in the selected queue.
 * Displays the backend-generated ticket, or a clearly marked demo ticket on failure.
 * Duplicate active tickets show a message and a link to Find My Ticket.
 * Passes ticket, queue, service, organization, and status details to the status page.
 */
function CustomerJoinDetails() {
  const navigate = useNavigate();
  const location = useLocation();

  // Queue information passed from the previous page.
  const queueCode = location.state?.queueCode;
  const serviceName: string = location.state?.serviceName ?? "";
  const organizationName = location.state?.organizationName;

  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [ticketNumber, setTicketNumber] = useState("");
  const [ticketStatus, setTicketStatus] = useState<string | undefined>();
  const [error, setError] = useState("");
  const [hasActiveTicket, setHasActiveTicket] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDemo, setIsDemo] = useState(false);

  const phoneInputRef = useRef<HTMLInputElement>(null);
  const continueButtonRef = useRef<HTMLButtonElement>(null);

  /**
   * Keeps at most ten digits and progressively formats the displayed phone number.
   * This prepares the input for the separate ten-digit submission check.
   *
   * @param value - The current input text, including any separators.
   * @returns The formatted display value, or an empty string when no digits remain.
   */
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

  /** Updates the formatted input and clears its previous validation message. */
  const handlePhoneChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPhoneNumber(formatPhoneNumber(e.target.value));
    setPhoneError("");
  };

  /**
   * Checks the phone length and queue selection, then requests customer registration.
   * Converts the display value to the backend's XXX-XXX-XXXX phone-number format.
   * Uses the returned ticket ID on success and shows feedback for duplicate tickets.
   * Other failures open a demo confirmation.
   *
   * @param e - The customer registration form submission event.
   */
  const handleContinue = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();

    const digits = phoneNumber.replace(/\D/g, "");

    setPhoneError("");
    setError("");
    setHasActiveTicket(false);

    if (digits.length !== 10) {
      setPhoneError("Enter a 10-digit phone number, including the area code.");
      phoneInputRef.current?.focus();
      return;
    }

    if (!queueCode) {
      setError("Queue information is missing. Please select a queue first.");
      return;
    }

    setIsLoading(true);
    setIsDemo(false);

    // Format currently accepted by the FastAPI backend.
    const backendPhoneNumber =
      `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;

    try {
      // The backend determines the service from the selected queue.
      const response = await fetch(
        "http://127.0.0.1:8000/database/customer/add_customer",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phone_number: backendPhoneNumber,
            queue_code: queueCode,
          }),
        }
      );

      // An existing active ticket must not open a demo confirmation.
      if (response.status === 409) {
        setError("You already have an active ticket in this queue. Use Find My Ticket to view it.");
        setHasActiveTicket(true);
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error("Backend request failed");
      }

      const customer = await response.json();

      if (customer.ticket_id == null) {
        throw new Error("Ticket ID missing from backend response");
      }

      // Use the ticket and status returned by PostgreSQL.
      setTicketNumber(String(customer.ticket_id));
      setTicketStatus(customer.status);
    } catch (error) {
      // Fall back to a dummy ticket for frontend testing without the backend.
      console.warn("Could not register customer. Using mock data.", error);
      setTicketNumber("1");
      setTicketStatus(undefined);
      // Mark it as demo because customer registration was not confirmed.
      setIsDemo(true);
    }

    setShowConfirmation(true);
    setIsLoading(false);
  };

  /** Opens queue status with the ticket, queue, service, organization, and status. */
  const handleViewStatus = () => {
    navigate("/queue-status", {
      state: {
        queueCode,
        serviceName,
        ticketNumber,
        status: ticketStatus,
        organizationName,
      },
    });
  };

  /** Returns to service information with the selection preserved in router state. */
  const handleCancel = () => {
    navigate("/service-information", {
      state: location.state,
    });
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
              <span className="customer-phone-prefix" aria-hidden="true">
                +1
              </span>

              <input
                className="customer-phone-input"
                ref={phoneInputRef}
                id="phone-number"
                name="phone-number"
                type="tel"
                inputMode="numeric"
                value={phoneNumber}
                onChange={handlePhoneChange}
                placeholder="(###) ###-####"
                autoComplete="tel-national"
                aria-describedby={
                  phoneError
                    ? "customer-phone-help customer-phone-error"
                    : "customer-phone-help"
                }
                aria-invalid={phoneError ? true : undefined}
                required
              />
            </div>

            <p
              className="customer-phone-help"
              id="customer-phone-help"
            >
              Enter 10 digits, including the area code. The +1 country code is
              included. Used for ticket confirmation and turn notifications.
            </p>

            {phoneError && (
              <p
                id="customer-phone-error"
                role="alert"
                style={{ color: "#ff0000", textAlign: "left" }}
              >
                {phoneError}
              </p>
            )}

            {error && (
              <p role="alert" style={{ color: "#ff0000", textAlign: "left" }}>
                {error}
              </p>
            )}

            {hasActiveTicket && (
              <p style={{ textAlign: "center" }}>
                <Link to="/find-ticket" style={{ color: "#303030", fontWeight: 500 }}>
                  Find My Ticket
                </Link>
              </p>
            )}

            <p className="screen-reader-only" role="status" aria-atomic="true">
              {isLoading ? "Joining the queue. Please wait." : ""}
            </p>

            <button
              className="customer-join-details-button"
              ref={continueButtonRef}
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? "Joining Queue..." : "Continue"}
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
          onClose={() => setShowConfirmation(false)}
          isDemo={isDemo}
          returnFocusTo={continueButtonRef.current}
        />
      )}
    </div>
  );
}

export default CustomerJoinDetails;
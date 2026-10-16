import "./CustomerFindTicket.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../../components/Header/Header";

/**
 * Displays the returning-customer ticket-number form.
 * Retrieves a ticket using its queue code and number before opening the status page.
 */
function CustomerFindTicket() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Prevents a browser form reload and searches for the entered ticket.
   * Opens its Queue Status page when found, or displays request feedback.
   *
   * @param e - The ticket-number form submission event.
   */
  const handleFindTicket = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const queueCode = String(formData.get("queue-code") ?? "").trim().toUpperCase();
    const ticketNumber = String(formData.get("ticket-number") ?? "").trim();
    const number = Number(ticketNumber);

    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

    setError("");

    if (!queueCode || !Number.isSafeInteger(number) || number < 1) {
      setError("Enter a queue code and a valid ticket number.");
      return;
    }

    setIsLoading(true);

    try {
      // Search for a ticket using the entered queue code and ticket number.
      const params = new URLSearchParams({
        queue_code: queueCode,
        ticket_number: ticketNumber,
      });

      const response = await fetch(
        `${apiBaseUrl}/database/customer/get_ticket?${params}`
      );

      if (response.status === 404) {
        setError("Ticket not found. Check your queue code and ticket number.");
        return;
      }

      if (!response.ok) {
        setError("Could not find your ticket. Please try again.");
        return;
      }

      const ticket = await response.json();

      // If the ticket exists, navigate to its Queue Status page.
      navigate("/queue-status", {
        state: {
          ticketNumber: String(ticket.ticket_number),
          queueCode: ticket.queue_code,
          service: ticket.service,
          status: ticket.status,
        },
      });
    } catch {
      setError("Could not connect to the server. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="customer-find-ticket-page">
      <Header />

      <main className="customer-find-ticket-main">
        <section className="customer-find-ticket-content">
          <h1 className="customer-find-ticket-title">
            Find My Ticket
          </h1>

          <p className="customer-find-ticket-description">
            Enter your queue code and ticket number to view your queue status.
          </p>

          <form
            className="customer-find-ticket-form"
            onSubmit={handleFindTicket}
          >
            <label
              className="ticket-number-label"
              htmlFor="queue-code"
            >
              Queue Code
            </label>

            <input
              className="ticket-number-input"
              id="queue-code"
              name="queue-code"
              type="text"
              placeholder="Enter your queue code"
              required
            />

            <label
              className="ticket-number-label"
              htmlFor="ticket-number"
            >
              Ticket Number
            </label>

            <input
              className="ticket-number-input"
              id="ticket-number"
              name="ticket-number"
              type="text"
              inputMode="numeric"
              pattern="[0-9]+"
              placeholder="Enter your ticket number"
              required
            />

            <p className="ticket-number-help">
              Enter the ticket number you received when joining the queue.
            </p>

            {error && (
              <p role="alert" style={{ color: "#FF2C2C" }}>
                {error}
              </p>
            )}

            <button
              className="find-ticket-submit-button"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? "Finding Ticket..." : "View Queue Status"}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}

export default CustomerFindTicket;
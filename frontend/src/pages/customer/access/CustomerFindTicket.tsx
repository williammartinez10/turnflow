import "./CustomerFindTicket.css";
import { useNavigate } from "react-router-dom";
import Header from "../../../components/Header/Header";

function CustomerFindTicket() {
  const navigate = useNavigate();

  const handleFindTicket = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();

    // TODO Later:
    
    // Search for an active ticket using the entered ticket number.
    // If the ticket exists, navigate to its Queue Status page.

    navigate("/queue-status");
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
            Enter your ticket number to view your current queue status.
          </p>

          <form
            className="customer-find-ticket-form"
            onSubmit={handleFindTicket}
          >
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
              placeholder="Enter your ticket number"
              required
            />

            <p className="ticket-number-help">
              Enter the ticket number you received when joining the queue.
            </p>

            <button
              className="find-ticket-submit-button"
              type="submit"
            >
              View Queue Status
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}

export default CustomerFindTicket;
import "./QueueConfirmationModal.css";
import { Check, Ticket } from "lucide-react";

/** Data and callback supplied by the customer registration page. */
interface QueueConfirmationModalProps {
  /** Ticket ID displayed to the customer, supplied by registration or demo mode. */
  ticketNumber: string;
  /** Callback used by the parent page to navigate to queue status. */
  onViewStatus: () => void;
  /** Marks an unconfirmed registration and shows demo wording; defaults to false. */
  isDemo?: boolean;
}

/**
 * Presents the ticket in a labelled modal dialog after registration is attempted.
 * Uses distinct wording when the ticket is a demo rather than a confirmed registration.
 * Delegates status-page navigation to the callback supplied by its parent.
 */
function QueueConfirmationModal({
  ticketNumber,
  onViewStatus,
  isDemo = false,
}: QueueConfirmationModalProps) {
  return (
    <div className="queue-confirmation-overlay">
      <div
        className="queue-confirmation-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="queue-confirmation-title"
      >
        <div className="queue-confirmation-icon">
          <Check size={42} strokeWidth={2.5} />
        </div>

        <h2
          className="queue-confirmation-title"
          id="queue-confirmation-title"
        >
          {isDemo ? "Demo ticket" : "You're in the queue!"}
        </h2>

        <p className="queue-confirmation-description">
          {/* 
              Phone number registration succeeds:
                  - Show the real ticket
              Registration fails (demo mode):
                  - Show a demo ticket with a warning message
          */}
          {isDemo
            ? "For demonstration only. Registration was not confirmed."
            : "Your virtual ticket has been created."}
        </p>

        <div className="queue-ticket">
          <Ticket
            className="queue-ticket-icon"
            size={52}
            strokeWidth={1.8}
          />

          <div className="queue-ticket-info">
            <span className="queue-ticket-label">
              YOUR TICKET
            </span>

            <span className="queue-ticket-number">
              {ticketNumber}
            </span>
          </div>
        </div>

        <button
          className="queue-confirmation-button"
          type="button"
          onClick={onViewStatus}
        >
          View Queue Status
        </button>
      </div>
    </div>
  );
}

export default QueueConfirmationModal;
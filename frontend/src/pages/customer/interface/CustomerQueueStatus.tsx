import "./CustomerQueueStatus.css";
import { Clock3, Info, Ticket } from "lucide-react";
import { useLocation } from "react-router-dom";
import Header from "../../../components/Header/Header";

/**
 * Displays ticket, queue, service, and status details received from registration or lookup.
 * Position, people ahead, now serving, and wait estimates currently use placeholders.
 * The screen does not yet poll the backend or send notifications.
 */
function CustomerQueueStatus() {
  const location = useLocation();

  // Ticket and queue information passed from registration or ticket lookup.
  const ticketNumber = location.state?.ticketNumber || "<###>";
  const queueCode = location.state?.queueCode || "<Queue Name>";
  const service = location.state?.service;

  // Display the stored status without inferring it from missing ticket data.
  const statuses: Record<string, { title: string; description: string }> = {
    waiting: {
      title: "Waiting",
      description: "You're currently waiting in the queue.",
    },
    called: {
      title: "It's Your Turn",
      description: "Please proceed to the service area.",
    },
    completed: {
      title: "Completed",
      description: "Your service has been completed.",
    },
    skipped: {
      title: "Skipped",
      description: "Your ticket was skipped. Please check with Staff.",
    },
    no_show: {
      title: "No Show",
      description: "Staff marked you as absent. Please check with Staff.",
    },
  };

  const currentStatus = statuses[location.state?.status] || {
    title: "Status Unavailable",
    description: "Look up your ticket again to retrieve its current status.",
  };

  // TODO Later: Retrieve position and wait-time information from the backend.
  const queueStatus = {
    organizationName: "<Organization Name>",
    serviceName: service || "<Service Name>",
    queueName: queueCode,
    position: "<Position>",
    nowServing: "<###>",
    peopleAhead: "<Count>",
    estimatedWait: "<Time>",
  };

  return (
    <div className="customer-queue-status-page">
      <Header />

      <main className="customer-queue-status-main">
        <section className="customer-queue-status-content">
          <h1 className="customer-queue-status-title">
            Queue Status
          </h1>

          <div className="customer-queue-status-header">
            <h2>{queueStatus.queueName}</h2>

            <p className="customer-queue-status-organization">
              {queueStatus.organizationName}
            </p>

            <p className="customer-queue-status-service">
              <span>Service:</span> {queueStatus.serviceName}
            </p>
          </div>

          <div className="customer-queue-ticket">
            <Ticket
              className="customer-queue-ticket-icon"
              size={52}
              strokeWidth={1.8}
            />

            <div className="customer-queue-ticket-info">
              <span className="customer-queue-ticket-label">
                YOUR TICKET
              </span>

              <span className="customer-queue-ticket-number">
                {ticketNumber}
              </span>
            </div>
          </div>

          <div className="customer-queue-status-grid">
            <div className="customer-queue-status-item">
              <span className="customer-queue-status-label">
                Your Position
              </span>

              <span className="customer-queue-status-value">
                {queueStatus.position}
              </span>
            </div>

            <div className="customer-queue-status-item">
              <span className="customer-queue-status-label">
                Now Serving
              </span>

              <span className="customer-queue-status-value">
                {queueStatus.nowServing}
              </span>
            </div>

            <div className="customer-queue-status-item">
              <span className="customer-queue-status-label">
                People Ahead
              </span>

              <span className="customer-queue-status-value">
                {queueStatus.peopleAhead}
              </span>
            </div>

            <div className="customer-queue-status-item">
              <span className="customer-queue-status-label">
                Estimated Wait
              </span>

              <span className="customer-queue-status-value">
                {queueStatus.estimatedWait}
              </span>
            </div>
          </div>

          <div className="customer-queue-current-status">
            <div className="customer-queue-current-status-icon">
              <Clock3 size={24} strokeWidth={2} />
            </div>

            <div className="customer-queue-current-status-text">
              <h2>{currentStatus.title}</h2>

              <p>{currentStatus.description}</p>
            </div>
          </div>

          <div className="customer-queue-update-info">
            <Info size={18} strokeWidth={2} />

            <p>
              Status reflects the last ticket lookup or registration.
              {" "}Look up your ticket again for an updated status.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default CustomerQueueStatus;